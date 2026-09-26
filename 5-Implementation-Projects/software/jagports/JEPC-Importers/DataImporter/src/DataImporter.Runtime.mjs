import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';

const VERSION = 3;
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
  if (![0, 1, 2, VERSION].includes(version)) throw new Error(`Unsupported importer ledger version ${version}.`);
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
      CREATE TABLE IF NOT EXISTS range_publications (
        source TEXT NOT NULL, model TEXT NOT NULL, category TEXT NOT NULL,
        language TEXT NOT NULL, range_slug TEXT NOT NULL, database_id TEXT NOT NULL,
        evidence_hash TEXT NOT NULL, published_at TEXT NOT NULL,
        PRIMARY KEY(source,model,category,language,range_slug,database_id)
      );
      PRAGMA user_version=3;
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
    lastPublication({ model, category, language, rangeSlug, databaseId }) {
      return db.prepare(`SELECT evidence_hash FROM range_publications
        WHERE source=? AND model=? AND category=? AND language=? AND range_slug=? AND database_id=?`)
        .get(root, model, category, language, rangeSlug, databaseId)?.evidence_hash ?? null;
    },
    publicationTargets(model, category, language) {
      return db.prepare(`SELECT DISTINCT range_slug,database_id FROM range_publications
        WHERE source=? AND model=? AND category=? AND language=?`)
        .all(root, model, category, language);
    },
    recordPublication({ model, category, language, rangeSlug, databaseId, evidenceHash }) {
      db.prepare(`INSERT INTO range_publications
        (source,model,category,language,range_slug,database_id,evidence_hash,published_at)
        VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(source,model,category,language,range_slug,database_id)
        DO UPDATE SET evidence_hash=excluded.evidence_hash,published_at=excluded.published_at`)
        .run(root, model, category, language, rangeSlug, databaseId, evidenceHash, new Date().toISOString());
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
