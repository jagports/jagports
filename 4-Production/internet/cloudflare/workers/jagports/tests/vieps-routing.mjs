import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { partsDatabase } from '../js/parts.js';
import { handleApi } from '../js/worker.js';
import { database, d1 } from './helpers/model-db.mjs';

test('real routing uses a reviewed parts database binding and never falls back to fixture DB', () => {
  const fixture = { name: 'fixture' }, xk = { name: 'xk' };
  const env = { DB: fixture, PARTS_DATABASE_BINDINGS: '{"xk":"PARTS_XK"}', PARTS_XK: xk };
  assert.equal(partsDatabase(new URL('https://example.test/api/tree'), env).db, xk);
  assert.throws(() => partsDatabase(new URL('https://example.test/api/tree'),
    { ...env, PARTS_XK: undefined }), error => error.code === 'parts_database_unavailable');
});

test('multiple configured Ranges fail visibly until global index is available', () => {
  const env = { DB: {}, PARTS_DATABASE_BINDINGS: '{"xk":"PARTS_XK","xj":"PARTS_XJ"}',
    PARTS_XK: { name: 'xk' }, PARTS_XJ: { name: 'xj' } };
  for (const url of ['https://example.test/api/part?q=ABC',
    'https://example.test/api/part?q=ABC&range=xj']) {
    assert.throws(() => partsDatabase(new URL(url), env),
      error => error.code === 'parts_database_unavailable' && error.status === 503);
  }
});

test('a single Range does not accept an unsupported per-request selector', () => {
  const env = { DB: {}, PARTS_DATABASE_BINDINGS: '{"xk":"PARTS_XK"}', PARTS_XK: {} };
  assert.throws(() => partsDatabase(new URL('https://example.test/api/part?range=xj'), env),
    error => error.code === 'parts_database_unavailable');
});

test('real PART lookup does not require tree data, FIT tables or a description', async (t) => {
  const partsDb = new DatabaseSync(':memory:');
  const stockDb = database({ fixtures: false });
  t.after(() => { partsDb.close(); stockDb.close(); });
  partsDb.exec(`
    CREATE TABLE part (
      id INTEGER PRIMARY KEY,
      part_number_raw TEXT NOT NULL,
      part_number_normalized TEXT NOT NULL,
      description TEXT,
      source TEXT NOT NULL,
      source_ref TEXT,
      verification_status TEXT NOT NULL
    );
    CREATE TABLE part_occurrence (
      id INTEGER PRIMARY KEY,
      part_id INTEGER NOT NULL,
      source TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      context_type TEXT NOT NULL,
      context_ref TEXT NOT NULL,
      category_ref TEXT NOT NULL,
      item_number TEXT NOT NULL,
      diagram_ref TEXT,
      diagram_item_number TEXT,
      verification_status TEXT NOT NULL
    );
    INSERT INTO part VALUES
      (1,'JLM 11716','JLM11716',NULL,'JEPC','sample/part','unverified');
    INSERT INTO part_occurrence VALUES
      (1,1,'JEPC','sample/occurrence','epc','3187/11096/L0','11096','1',NULL,NULL,'unverified');
  `);
  const env = {
    DB: d1(stockDb),
    PARTS_DATABASE_BINDINGS: '{"xk":"PARTS_XK"}',
    PARTS_XK: d1(partsDb),
  };

  const response = await handleApi(new Request(
    'https://test.example/api/part?q=JLM11716'), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.state, 'resolved');
  assert.equal(body.part.part_number_normalized, 'JLM11716');
  assert.equal(body.part.description, null);
  assert.equal(body.tree_state, 'unavailable');
  assert.deepEqual(body.tree_roots, []);
  assert.deepEqual(body.parts_tree, []);
  assert.equal(body.occurrences.length, 1);
  assert.deepEqual(body.fitment, []);

  const fit = await handleApi(new Request('https://test.example/api/fit'), env);
  assert.equal(fit.status, 503);
  assert.equal((await fit.json()).error_code, 'real_fit_data_missing');
});

test('real mode returns an explicit error rather than publishing available synthetic Fit', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const partsDb = d1(db);
  const env = { DB: partsDb, PARTS_DATABASE_BINDINGS: '{"xk":"PARTS_XK"}', PARTS_XK: partsDb };
  const response = await handleApi(new Request(
    'https://test.example/api/fit'), env);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.state, 'error');
  assert.equal(body.fixture_mode, false);
  assert.equal(body.error_code, 'real_fit_data_missing');
  assert.equal(body.range, 'xk');
  assert.deepEqual(body.categories, []);
  assert.deepEqual(body.matches, []);
  const fixture = await handleApi(new Request(
    'https://test.example/api/fit?TEST=1'), env);
  assert.equal(fixture.status, 200);
  const fixtureBody = await fixture.json();
  assert.equal(fixtureBody.fixture_mode, true);
  assert.equal(fixtureBody.fixture_provider, 'embedded');
  assert.ok(fixtureBody.categories.length > 0);
});

test('real mode with an unbound parts database fails rather than reading the fixture D1', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  await assert.rejects(() => handleApi(new Request(
    'https://test.example/api/fit'), { DB: d1(db) }),
  error => error.status === 503 && error.code === 'parts_database_unavailable');
});

test('case-insensitive TEST URL enables fixtures on Web APIs and does not depend on a parts database', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const env = { DB: d1(db) };
  for (const key of ['TEST', 'test', 'TeSt']) {
    const query = key + '=1';
    const fit = await handleApi(new Request(
      'https://test.example/api/fit?' + query), env);
    assert.equal(fit.status, 200, query);
    const body = await fit.json();
    assert.equal(body.fixture_mode, true, query);
    assert.equal(body.categories.length, 4, query);
    assert.equal(body.categories.flatMap(category => category.values).length, 8, query);
    const parts = await handleApi(new Request(
      'https://test.example/api/part?q=MJB7703AA&' + query), env);
    assert.equal(parts.status, 200, query);
    const part = await parts.json();
    assert.equal(part.part?.part_number_normalized, 'MJB7703AA', query);
    const tree = await handleApi(new Request(
      'https://test.example/api/tree?root=1&' + query), env);
    assert.equal(tree.status, 200, query);
  }
});

test('missing or conflicting TEST URL flags never expose fixture data', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const env = { DB: d1(db) };
  for (const flags of ['', '?TEST=0', '?test=2', '?TEST=1&test=0', '?test=1&TEST=1']) {
    await assert.rejects(() => handleApi(new Request(
      'https://test.example/api/fit' + flags), env),
    error => error.status === 503 && error.code === 'parts_database_unavailable',
    'unbound parts database must reject URL flags: ' + flags);
  }
});


test('#976 FIT route remains canonical', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const env = { DB: d1(db) };
  const response = await handleApi(new Request('https://test.example/api/fit?TEST=1'), env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.fixture_mode, true);
  assert.equal(data.categories.length, 4);
  assert.ok(data.matches.length > 0);
});


test('Worker deployment config publishes the reviewed XK parts binding', async () => {
  const filename = fileURLToPath(new URL('../wrangler.toml', import.meta.url));
  const config = await readFile(filename, 'utf8');
  assert.match(config, /PARTS_DATABASE_BINDINGS\s*=\s*'\{"xk":"PARTS_XK"\}'/);
  assert.match(config, /binding\s*=\s*"PARTS_XK"/);
  assert.match(config, /database_name\s*=\s*"parts-xk"/);
  assert.match(config, /database_id\s*=\s*"55a0ebdb-6a86-4c2a-9ede-d4da2e47db00"/);
});
