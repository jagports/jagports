import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { openLedger } from '../src/DataImporter.Runtime.mjs';

test('upgrades and preserves the original SQLite inspector ledger', async t => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'jepc-ledger-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const source = path.join(parent, 'source'), state = path.join(parent, 'state');
  await mkdir(source); await mkdir(state);
  const db = new DatabaseSync(path.join(state, 'ledger.sqlite'));
  db.exec(`CREATE TABLE runs (
    id TEXT PRIMARY KEY, pid INTEGER NOT NULL, state TEXT NOT NULL,
    started TEXT NOT NULL, updated TEXT NOT NULL, profile TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0, unchanged INTEGER NOT NULL DEFAULT 0,
    missing INTEGER NOT NULL DEFAULT 0, error TEXT
  );
  CREATE TABLE files (
    source TEXT NOT NULL, path TEXT NOT NULL, checksum TEXT, size INTEGER,
    mtime REAL, state TEXT NOT NULL, version INTEGER NOT NULL,
    run_id TEXT NOT NULL REFERENCES runs(id), PRIMARY KEY(source,path)
  );
  CREATE TABLE events (
    sequence INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id),
    time TEXT NOT NULL, detail TEXT NOT NULL
  );
  INSERT INTO runs(id,pid,state,started,updated,profile) VALUES('old',1,'COMPLETED','t','t','{}');
  PRAGMA user_version=1;`);
  db.close();
  const ledger = await openLedger(source, state);
  ledger.close();
  const upgraded = new DatabaseSync(path.join(state, 'ledger.sqlite'), { readOnly: true });
  assert.equal(upgraded.prepare('PRAGMA user_version').get().user_version, 2);
  assert.equal(upgraded.prepare("SELECT state FROM runs WHERE id='old'").get().state, 'COMPLETED');
  assert.equal(upgraded.prepare('SELECT count(*) AS count FROM bundle_evidence').get().count, 0);
  upgraded.close();
});
