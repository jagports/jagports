import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, realpath, stat, readFile } from 'node:fs/promises';
import path from 'node:path';

const VERSION = 5;
const inside = (root, child) => {
  const relative = path.relative(root, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

async function canonicalFuture(location) {
  try { return await realpath(location); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(location);
    if (parent === location) throw error;
    return path.join(await canonicalFuture(parent), path.basename(location));
  }
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

function schema(db) {
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (![0, 1, 2, 3, 4, VERSION].includes(version)) throw new Error(`Unsupported importer ledger version ${version}.`);
  transaction(db, () => {
    // Preserve the original PR #660 run/file/event ledger when upgrading v1.
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
      CREATE TABLE IF NOT EXISTS bundle_evidence (
        source TEXT NOT NULL, model TEXT NOT NULL, category TEXT NOT NULL,
        language TEXT NOT NULL, evidence_hash TEXT NOT NULL,
        parser_version INTEGER NOT NULL, status TEXT NOT NULL,
        evidence_json TEXT NOT NULL, run_id TEXT NOT NULL REFERENCES runs(id),
        PRIMARY KEY(source,model,category,language,evidence_hash)
      );
      CREATE INDEX IF NOT EXISTS idx_bundle_scope
        ON bundle_evidence(source,model,category,language);
      CREATE TABLE IF NOT EXISTS source_estimates (
        id TEXT PRIMARY KEY, source TEXT NOT NULL, scope TEXT NOT NULL,
        report_json TEXT NOT NULL, created TEXT NOT NULL
      );
    `);
    const hasLegacyPublished = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='range_publications'").get());
    const hasLegacyRangeTable = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='range_d1_imports'").get());
    const hasPartsDatabaseTable = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='parts_database_imports'").get());
    if (!hasPartsDatabaseTable && hasLegacyPublished && !hasLegacyRangeTable) {
      db.exec('ALTER TABLE range_publications RENAME TO parts_database_imports');
      db.exec('ALTER TABLE parts_database_imports RENAME COLUMN published_at TO imported_at');
    } else if (!hasPartsDatabaseTable && !hasLegacyPublished && hasLegacyRangeTable) {
      db.exec('ALTER TABLE range_d1_imports RENAME TO parts_database_imports');
    } else {
      db.exec(`
        CREATE TABLE IF NOT EXISTS parts_database_imports (
          source TEXT NOT NULL, model TEXT NOT NULL, category TEXT NOT NULL,
          language TEXT NOT NULL, range_slug TEXT NOT NULL, database_id TEXT NOT NULL,
          evidence_hash TEXT NOT NULL, imported_at TEXT NOT NULL,
          PRIMARY KEY(source,model,category,language,range_slug,database_id)
        );
      `);
      if (hasLegacyPublished) {
        db.exec(`INSERT OR IGNORE INTO parts_database_imports
          (source,model,category,language,range_slug,database_id,evidence_hash,imported_at)
          SELECT source,model,category,language,range_slug,database_id,evidence_hash,published_at
          FROM range_publications`);
        db.exec('DROP TABLE range_publications');
      }
      if (hasLegacyRangeTable) {
        db.exec(`INSERT OR IGNORE INTO parts_database_imports
          (source,model,category,language,range_slug,database_id,evidence_hash,imported_at)
          SELECT source,model,category,language,range_slug,database_id,evidence_hash,imported_at
          FROM parts_database_imports`);
        db.exec('DROP TABLE range_d1_imports');
      }
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS parts_database_imports (
        source TEXT NOT NULL, model TEXT NOT NULL, category TEXT NOT NULL,
        language TEXT NOT NULL, range_slug TEXT NOT NULL, database_id TEXT NOT NULL,
        evidence_hash TEXT NOT NULL, imported_at TEXT NOT NULL,
        PRIMARY KEY(source,model,category,language,range_slug,database_id)
      );
      PRAGMA user_version=5;
    `);
  });
  if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok'
      || db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Importer ledger integrity check failed.');
}

export async function openLedger(source, stateDir) {
  const root = await realpath(path.resolve(source));
  const state = await canonicalFuture(path.resolve(stateDir));
  if (inside(root, state)) throw new Error('State directory must be outside source installation.');
  await mkdir(state, { recursive: true });
  const filename = path.join(state, 'ledger.sqlite');
  const db = new DatabaseSync(filename);
  try { schema(db); }
  catch (error) { db.close(); throw error; }
  return {
    filename,
    beginRun(profile) {
      const id = randomUUID(), now = new Date().toISOString();
      transaction(db, () => {
        const stranded = db.prepare("SELECT id,pid FROM runs WHERE state='RUNNING'").all();
        if (stranded.some(run => alive(run.pid))) throw new Error('Another importer owns this SQLite ledger.');
        if (stranded.length) {
          if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok')
            throw new Error('Importer ledger integrity check failed after interrupted run.');
          db.prepare("UPDATE runs SET state='CRASH_RECOVERED',updated=? WHERE state='RUNNING'").run(now);
        }
        db.prepare('INSERT INTO runs(id,pid,state,started,updated,profile) VALUES(?,?,?,?,?,?)')
          .run(id, process.pid, 'RUNNING', now, now, JSON.stringify({ ...profile, source: root }));
        db.prepare('INSERT INTO events(run_id,time,detail) VALUES(?,?,?)')
          .run(id, now, JSON.stringify({ type: 'START', recoveredRuns: stranded.map(run => run.id) }));
      });
      return id;
    },
    storeBundle(runId, staged) {
      const content = JSON.stringify(staged);
      const evidenceHash = createHash('sha256').update(content).digest('hex');
      const { model, category, language } = staged.identity;
      return transaction(db, () => {
        const prior = db.prepare(`SELECT 1 AS found FROM bundle_evidence
          WHERE source=? AND model=? AND category=? AND language=? AND evidence_hash=?`)
          .get(root, model, category, language, evidenceHash);
        db.prepare(`INSERT OR IGNORE INTO bundle_evidence
          (source,model,category,language,evidence_hash,parser_version,status,evidence_json,run_id)
          VALUES(?,?,?,?,?,?,?,?,?)`)
          .run(root, model, category, language, evidenceHash, staged.parserVersion, staged.status, content, runId);
        for (const file of staged.files) db.prepare(`INSERT INTO files
          (source,path,checksum,size,mtime,state,version,run_id) VALUES(?,?,?,?,?,?,?,?)
          ON CONFLICT(source,path) DO UPDATE SET checksum=excluded.checksum,size=excluded.size,
          state=excluded.state,version=excluded.version,run_id=excluded.run_id`)
          .run(root, file.path, file.sha256, file.size, null, 'INSPECTED', staged.parserVersion, runId);
        const now = new Date().toISOString();
        db.prepare('UPDATE runs SET checked=checked+1,unchanged=unchanged+?,updated=? WHERE id=?')
          .run(Number(Boolean(prior)), now, runId);
        db.prepare('INSERT INTO events(run_id,time,detail) VALUES(?,?,?)')
          .run(runId, now, JSON.stringify({ type: 'BUNDLE', model, category, language,
            evidenceHash, status: staged.status, reused: Boolean(prior) }));
        return { evidenceHash, reused: Boolean(prior) };
      });
    },
    completeRun(runId, state, error = null) {
      transaction(db, () => db.prepare('UPDATE runs SET state=?,error=?,updated=? WHERE id=?')
        .run(state, error, new Date().toISOString(), runId));
    },
    readBundle(model, category, language) {
      const row = db.prepare(`SELECT evidence_json FROM bundle_evidence
        WHERE source=? AND model=? AND category=? AND language=? ORDER BY rowid DESC LIMIT 1`)
        .get(root, model, category, language);
      return row ? JSON.parse(row.evidence_json) : null;
    },
    readBundleWithHash(model, category, language) {
      const row = db.prepare(`SELECT evidence_json,evidence_hash FROM bundle_evidence
        WHERE source=? AND model=? AND category=? AND language=? ORDER BY rowid DESC LIMIT 1`)
        .get(root, model, category, language);
      return row ? { staged: JSON.parse(row.evidence_json), evidenceHash: row.evidence_hash } : null;
    },
    latestBundles(modelIds) {
      if (!Array.isArray(modelIds) || !modelIds.length || modelIds.some(id => !/^\d+$/.test(id))) {
        throw new Error('Require selected numeric Model_IDs to inspect staged bundles.');
      }
      const placeholders = modelIds.map(() => '?').join(',');
      const rows = db.prepare(`SELECT be.evidence_json,be.evidence_hash FROM bundle_evidence be
        JOIN (SELECT MAX(rowid) AS newest FROM bundle_evidence
          WHERE source=? AND model IN (${placeholders}) GROUP BY model,category,language) latest
          ON latest.newest=be.rowid ORDER BY be.model,be.category,be.language`)
        .all(root, ...modelIds);
      return rows.map(row => ({ staged: JSON.parse(row.evidence_json), evidenceHash: row.evidence_hash }));
    },
    lastD1Import({ model, category, language, rangeSlug, databaseId }) {
      return db.prepare(`SELECT evidence_hash FROM parts_database_imports
        WHERE source=? AND model=? AND category=? AND language=? AND range_slug=? AND database_id=?`)
        .get(root, model, category, language, rangeSlug, databaseId)?.evidence_hash ?? null;
    },
    d1ImportTargets(model, category, language) {
      return db.prepare(`SELECT DISTINCT range_slug,database_id FROM parts_database_imports
        WHERE source=? AND model=? AND category=? AND language=?`)
        .all(root, model, category, language);
    },
    recordD1Import({ model, category, language, rangeSlug, databaseId, evidenceHash }) {
      db.prepare(`INSERT INTO parts_database_imports
        (source,model,category,language,range_slug,database_id,evidence_hash,imported_at)
        VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(source,model,category,language,range_slug,database_id)
        DO UPDATE SET evidence_hash=excluded.evidence_hash,imported_at=excluded.imported_at`)
        .run(root, model, category, language, rangeSlug, databaseId, evidenceHash, new Date().toISOString());
    },
    clearD1Import(model, category, language) {
      db.prepare('DELETE FROM parts_database_imports WHERE source=? AND model=? AND category=? AND language=?')
        .run(root, model, category, language);
    },
    storeEstimate(scope, report) {
      const id = randomUUID();
      db.prepare('INSERT INTO source_estimates(id,source,scope,report_json,created) VALUES(?,?,?,?,?)')
        .run(id, root, scope, JSON.stringify(report), new Date().toISOString());
      return id;
    },
    readEstimate(id) {
      const row = db.prepare('SELECT report_json FROM source_estimates WHERE id=? AND source=?').get(id, root);
      return row ? JSON.parse(row.report_json) : null;
    },
    close() { db.close(); },
  };
}

export async function saveEstimate(source, stateDir, scope, report) {
  const ledger = await openLedger(source, stateDir);
  try {
    return { database: ledger.filename, id: ledger.storeEstimate(scope, report) };
  } finally { ledger.close(); }
}

// Original v0.1 single-category inspection contract. This is intentionally
// separate from model-pattern parsing and reuses the current v4 SQLite ledger.
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

async function inspectionSourcePath(root, relative) {
  const filename = await realpath(path.join(root, relative));
  if (!inside(root, filename)) throw new Error('Source reference escapes the selected source root.');
  return filename;
}

async function inspectionLabels(root, model) {
  const filename = await inspectionSourcePath(root, 'menus/models_l_id_0.xml');
  if ((await stat(filename)).size > 2 * 1024 * 1024) throw new Error('Model menu exceeds the 2 MiB preflight limit.');
  const rows = new Map();
  const source = await readFile(filename, 'latin1');
  for (const match of source.matchAll(/^\s*\[(\d+),(\d+),'(.*)'\]\s*$/gm)) {
    rows.set(match[1], { parent: match[2], label: match[3] });
  }
  const selected = rows.get(String(model));
  if (!selected) throw new Error(`Model ${model} not found in the supported model menu format.`);
  return { modelLabel: selected.label, parent: selected.parent, parentLabel: rows.get(selected.parent)?.label ?? 'Unknown parent label' };
}

function inspectionSnapshot(db, id) {
  const row = id ? db.prepare('SELECT * FROM runs WHERE id=?').get(id)
    : db.prepare('SELECT * FROM runs ORDER BY rowid DESC LIMIT 1').get();
  if (!row) return { contractVersion: 1, run: null };
  const { profile, ...run } = row;
  return { contractVersion: 1, phase: 'SOURCE_INSPECTION', importImplemented: false,
    run: { ...run, profile: JSON.parse(profile) } };
}

function inspectionHealth(db, full = false) {
  const check = full ? 'integrity_check' : 'quick_check';
  const rows = db.prepare(`PRAGMA ${check}`).all();
  if (rows.length !== 1 || Object.values(rows[0])[0] !== 'ok') throw new Error(`${check} failed.`);
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('foreign_key_check failed.');
  return { check, result: 'ok', foreignKeys: 'ok' };
}

export async function inspect(options, { onProgress = () => {}, shouldStop = () => false } = {}) {
  const paths = bundlePaths(options);
  const source = await realpath(path.resolve(options.source));
  const stateDir = await canonicalFuture(path.resolve(options.stateDir));
  if (inside(source, stateDir)) throw new Error('State directory must be outside the source installation.');
  const profile = { ...options, source, stateDir, ...await inspectionLabels(source, options.model),
    region: 'Not interpreted in source inspection', total: paths.length };
  const initialized = await openLedger(source, stateDir);
  const filename = initialized.filename;
  initialized.close();
  const db = new DatabaseSync(filename);
  const id = randomUUID();
  let claimed = false;
  const emit = () => onProgress(inspectionSnapshot(db, id));
  const event = detail => db.prepare('INSERT INTO events(run_id,time,detail) VALUES(?,?,?)')
    .run(id, new Date().toISOString(), JSON.stringify(detail));
  try {
    db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    if (db.prepare('PRAGMA user_version').get().user_version !== VERSION) throw new Error('Unsupported ledger version.');
    inspectionHealth(db);
    transaction(db, () => {
      const stranded = db.prepare("SELECT * FROM runs WHERE state='RUNNING'").all();
      if (stranded.some(run => alive(run.pid))) throw new Error('Another importer owns this state directory.');
      if (stranded.length) inspectionHealth(db, true);
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
        const file = await inspectionSourcePath(source, relative);
        const before = await stat(file);
        if (!before.isFile()) throw new Error('Expected a regular source file.');
        const hash = createHash('sha256');
        for await (const chunk of createReadStream(file)) hash.update(chunk);
        const after = await stat(file);
        if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('Source changed during inspection; retry on a stable source.');
        checksum = hash.digest('hex'); size = after.size; mtime = after.mtimeMs;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        state = 'MISSING';
      }
      transaction(db, () => {
        const prior = db.prepare('SELECT checksum,state,version FROM files WHERE source=? AND path=?').get(source, relative);
        const unchanged = state === 'INSPECTED' && prior?.state === 'INSPECTED'
          && prior.checksum === checksum && prior.version === 1;
        db.prepare(`INSERT INTO files VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(source,path) DO UPDATE SET
          checksum=excluded.checksum,size=excluded.size,mtime=excluded.mtime,state=excluded.state,
          version=excluded.version,run_id=excluded.run_id`)
          .run(source, relative, checksum, size, mtime, state, 1, id);
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
    return inspectionSnapshot(db, id);
  } catch (error) {
    if (claimed) transaction(db, () => {
      db.prepare("UPDATE runs SET state='FAILED',error=?,updated=? WHERE id=?").run(error.message, new Date().toISOString(), id);
      event({ type: 'FAILED', error: error.message });
    });
    throw error;
  } finally { db.close(); }
}

export function readState(stateDir, { doctor = false, full = false, report = false } = {}) {
  const filename = path.join(path.resolve(stateDir), 'ledger.sqlite');
  if (!existsSync(filename)) throw new Error(`No importer ledger found at ${filename}.`);
  const writable = new DatabaseSync(filename);
  try { schema(writable); }
  finally { writable.close(); }
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    if (db.prepare('PRAGMA user_version').get().user_version !== VERSION) throw new Error('Unsupported ledger version.');
    if (doctor) return inspectionHealth(db, full);
    const result = inspectionSnapshot(db);
    if (report && result.run) result.events = db.prepare('SELECT * FROM events WHERE run_id=? ORDER BY sequence').all(result.run.id)
      .map(row => ({ ...row, detail: JSON.parse(row.detail) }));
    return result;
  } finally { db.close(); }
}
