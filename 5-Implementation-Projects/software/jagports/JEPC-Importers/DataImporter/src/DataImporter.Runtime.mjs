import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, realpath, stat, readFile } from 'node:fs/promises';
import path from 'node:path';

export const CONTRACT_VERSION = 1;
const inside = (root, child) => {
  const relative = path.relative(root, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

// Resolve existing ancestors too: a junction must not redirect state into source.
async function canonicalFuture(location) {
  try { return await realpath(location); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(location);
    if (parent === location) throw error;
    return path.join(await canonicalFuture(parent), path.basename(location));
  }
}

export function bundlePaths({ model, category, item, language }) {
  for (const value of [model, category, item, language]) {
    if (!/^\d{1,10}$/.test(String(value))) throw new Error('Model, category, item and language must be numeric IDs.');
  }
  const base = `drilldown/pl_id_${model}`;
  return [
    'menus/models_l_id_0.xml',
    `menus/L${language}/pl_id_${model}_l_id_${language}.xml`,
    `menus/pl_id_${model}_attributes.xml`,
    `${base}/L${language}/cat_M${model}_C${category}_L${language}.xml`,
    `${base}/L${language}/tl_M${model}_C${category}_L${language}.xml`,
    `${base}/L${language}/Itm_M${model}_C${category}_I${item}_L${language}.xml`,
    `${base}/tl_M${model}_C${category}_attributes.xml`,
    `${base}/Itm_M${model}_C${category}_I${item}_attributes.xml`,
  ];
}

async function sourcePath(root, relative) {
  const filename = await realpath(path.join(root, relative));
  if (!inside(root, filename)) throw new Error('Source reference escapes the selected source root.');
  return filename;
}

async function labels(root, model) {
  const filename = await sourcePath(root, 'menus/models_l_id_0.xml');
  if ((await stat(filename)).size > 2 * 1024 * 1024) throw new Error('Model menu exceeds the 2 MiB preflight limit.');
  const rows = new Map();
  // This installed menu is a Latin-1 <Data> wrapper around bracketed rows.
  // Do not evaluate it as JavaScript or infer region from punctuation.
  const source = await readFile(filename, 'latin1');
  for (const match of source.matchAll(/^\s*\[(\d+),(\d+),'(.*)'\]\s*$/gm)) {
    rows.set(match[1], { parent: match[2], label: match[3] });
  }
  const selected = rows.get(String(model));
  if (!selected) throw new Error(`Model ${model} not found in the supported model menu format.`);
  return { modelLabel: selected.label, parent: selected.parent, parentLabel: rows.get(selected.parent)?.label ?? 'Unknown parent label' };
}

function health(db, full = false) {
  const check = full ? 'integrity_check' : 'quick_check';
  const rows = db.prepare(`PRAGMA ${check}`).all();
  if (rows.length !== 1 || Object.values(rows[0])[0] !== 'ok') throw new Error(`${check} failed.`);
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('foreign_key_check failed.');
  return { check, result: 'ok', foreignKeys: 'ok' };
}

function schema(db) {
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version !== 0 && version !== CONTRACT_VERSION) throw new Error(`Unsupported ledger version ${version}.`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY, pid INTEGER NOT NULL, state TEXT NOT NULL,
      started TEXT NOT NULL, updated TEXT NOT NULL, profile TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0, unchanged INTEGER NOT NULL DEFAULT 0,
      missing INTEGER NOT NULL DEFAULT 0, error TEXT
    );
    CREATE TABLE IF NOT EXISTS files (
      source TEXT NOT NULL, path TEXT NOT NULL, checksum TEXT, size INTEGER,
      mtime REAL, state TEXT NOT NULL, version INTEGER NOT NULL,
      run_id TEXT NOT NULL REFERENCES runs(id), PRIMARY KEY(source,path)
    );
    CREATE TABLE IF NOT EXISTS events (
      sequence INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id),
      time TEXT NOT NULL, detail TEXT NOT NULL
    );
    PRAGMA user_version=1;
  `);
}

function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code !== 'ESRCH'; }
}

function snapshot(db, id) {
  const row = id ? db.prepare('SELECT * FROM runs WHERE id=?').get(id)
    : db.prepare('SELECT * FROM runs ORDER BY rowid DESC LIMIT 1').get();
  if (!row) return { contractVersion: CONTRACT_VERSION, run: null };
  const { profile, ...run } = row;
  return { contractVersion: CONTRACT_VERSION, phase: 'SOURCE_INSPECTION',
    importImplemented: false, run: { ...run, profile: JSON.parse(profile) } };
}

export async function inspect(options, { onProgress = () => {}, shouldStop = () => false } = {}) {
  const paths = bundlePaths(options);
  const source = await realpath(path.resolve(options.source));
  const stateDir = await canonicalFuture(path.resolve(options.stateDir));
  if (inside(source, stateDir)) throw new Error('State directory must be outside the source installation.');
  const profile = { ...options, source, stateDir, ...await labels(source, options.model),
    region: 'Not interpreted in this skeleton', total: paths.length };
  await mkdir(stateDir, { recursive: true });
  const db = new DatabaseSync(path.join(stateDir, 'ledger.sqlite'));
  const id = randomUUID();
  let claimed = false;
  const emit = () => onProgress(snapshot(db, id));
  const event = detail => db.prepare('INSERT INTO events(run_id,time,detail) VALUES(?,?,?)')
    .run(id, new Date().toISOString(), JSON.stringify(detail));
  try {
    schema(db);
    health(db);
    transaction(db, () => {
      const stranded = db.prepare("SELECT * FROM runs WHERE state='RUNNING'").all();
      if (stranded.some(run => alive(run.pid))) throw new Error('Another importer owns this state directory.');
      if (stranded.length) health(db, true);
      const now = new Date().toISOString();
      db.prepare("UPDATE runs SET state='CRASH_RECOVERED', updated=? WHERE state='RUNNING'").run(now);
      db.prepare('INSERT INTO runs(id,pid,state,started,updated,profile) VALUES(?,?,?,?,?,?)')
        .run(id, process.pid, 'RUNNING', now, now, JSON.stringify(profile));
      event({ type: 'START', recoveredRuns: stranded.map(run => run.id) });
    });
    claimed = true;
    emit();
    for (const relative of paths) {
      if (shouldStop()) break;
      let checksum = null, size = null, mtime = null, state = 'INSPECTED';
      try {
        const filename = await sourcePath(source, relative);
        const before = await stat(filename);
        if (!before.isFile()) throw new Error('Expected a regular source file.');
        const hash = createHash('sha256');
        for await (const chunk of createReadStream(filename)) hash.update(chunk);
        const after = await stat(filename);
        if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('Source changed during inspection; retry on a stable source.');
        checksum = hash.digest('hex'); size = after.size; mtime = after.mtimeMs;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        state = 'MISSING';
      }
      transaction(db, () => {
        const prior = db.prepare('SELECT checksum,state,version FROM files WHERE source=? AND path=?').get(source, relative);
        const unchanged = state === 'INSPECTED' && prior?.state === 'INSPECTED'
          && prior.checksum === checksum && prior.version === CONTRACT_VERSION;
        db.prepare(`INSERT INTO files VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(source,path) DO UPDATE SET
          checksum=excluded.checksum,size=excluded.size,mtime=excluded.mtime,state=excluded.state,
          version=excluded.version,run_id=excluded.run_id`)
          .run(source, relative, checksum, size, mtime, state, CONTRACT_VERSION, id);
        db.prepare('UPDATE runs SET checked=checked+1,unchanged=unchanged+?,missing=missing+?,updated=? WHERE id=?')
          .run(Number(unchanged), Number(state === 'MISSING'), new Date().toISOString(), id);
        event({ path: relative, state, checksum, size, mtime, unchanged });
      });
      emit();
    }
    transaction(db, () => {
      const state = shouldStop() ? 'STOPPED_BY_USER' : 'COMPLETED';
      db.prepare('UPDATE runs SET state=?,updated=? WHERE id=?').run(state, new Date().toISOString(), id);
      event({ type: state });
    });
    emit();
    return snapshot(db, id);
  } catch (error) {
    if (claimed) transaction(db, () => {
      db.prepare("UPDATE runs SET state='FAILED',error=?,updated=? WHERE id=?").run(error.message, new Date().toISOString(), id);
      event({ type: 'FAILED', error: error.message });
    });
    throw error;
  } finally { db.close(); }
}

export function readState(stateDir, { doctor = false, full = false, report = false } = {}) {
  const db = new DatabaseSync(path.join(path.resolve(stateDir), 'ledger.sqlite'), { readOnly: true });
  try {
    if (db.prepare('PRAGMA user_version').get().user_version !== CONTRACT_VERSION) throw new Error('Unsupported ledger version.');
    if (doctor) return health(db, full);
    const result = snapshot(db);
    if (report && result.run) result.events = db.prepare('SELECT * FROM events WHERE run_id=? ORDER BY sequence').all(result.run.id)
      .map(row => ({ ...row, detail: JSON.parse(row.detail) }));
    return result;
  } finally { db.close(); }
}
