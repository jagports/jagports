import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { liveRangeDatabase } from '../js/vieps-parts.js';
import { handleApi } from '../js/vieps-worker.js';
import { database, d1 } from './helpers/model-db.mjs';

test('real routing uses a reviewed Range binding and never falls back to fixture DB', () => {
  const fixture = { name: 'fixture' }, xk = { name: 'xk' };
  const env = { DB: fixture, RANGE_BINDINGS: '{"xk":"RANGE_XK"}', RANGE_XK: xk };
  assert.equal(liveRangeDatabase(new URL('https://example.test/api/vieps/tree'), env).db, xk);
  assert.throws(() => liveRangeDatabase(new URL('https://example.test/api/vieps/tree'),
    { ...env, RANGE_XK: undefined }), error => error.code === 'range_unavailable');
});

test('multiple real Ranges fail visibly until global index is available', () => {
  const env = { DB: {}, RANGE_BINDINGS: '{"xk":"RANGE_XK","xj":"RANGE_XJ"}',
    RANGE_XK: { name: 'xk' }, RANGE_XJ: { name: 'xj' } };
  for (const url of ['https://example.test/api/vieps/part?q=ABC',
    'https://example.test/api/vieps/part?q=ABC&range=xj']) {
    assert.throws(() => liveRangeDatabase(new URL(url), env),
      error => error.code === 'range_unavailable' && error.status === 503);
  }
});

test('a single Range does not accept an unsupported per-request selector', () => {
  const env = { DB: {}, RANGE_BINDINGS: '{"xk":"RANGE_XK"}', RANGE_XK: {} };
  assert.throws(() => liveRangeDatabase(new URL('https://example.test/api/vieps/part?range=xj'), env),
    error => error.code === 'range_unavailable');
});

test('real mode returns an explicit error rather than publishing available synthetic Suitability', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const range = d1(db);
  const env = { DB: range, RANGE_BINDINGS: '{"xk":"RANGE_XK"}', RANGE_XK: range };
  const response = await handleApi(new Request(
    'https://test.example/api/vieps/suitability'), env);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.state, 'error');
  assert.equal(body.fixture_mode, false);
  assert.equal(body.error_code, 'real_suitability_data_missing');
  assert.equal(body.range, 'xk');
  assert.deepEqual(body.categories, []);
  assert.deepEqual(body.matches, []);
  const fixture = await handleApi(new Request(
    'https://test.example/api/vieps/suitability?TEST=1'), env);
  assert.equal(fixture.status, 200);
  const fixtureBody = await fixture.json();
  assert.equal(fixtureBody.fixture_mode, true);
  assert.equal(fixtureBody.fixture_provider, 'embedded');
  assert.ok(fixtureBody.categories.length > 0);
});

test('real mode with an unbound Range fails rather than reading the fixture D1', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  await assert.rejects(() => handleApi(new Request(
    'https://test.example/api/vieps/suitability'), { DB: d1(db) }),
  error => error.status === 503 && error.code === 'range_unavailable');
});


test('Worker deployment config publishes the reviewed XK parts binding', async () => {
  const filename = fileURLToPath(new URL('../wrangler.toml', import.meta.url));
  const config = await readFile(filename, 'utf8');
  assert.match(config, /RANGE_BINDINGS\s*=\s*'\{"xk":"RANGE_XK"\}'/);
  assert.match(config, /binding\s*=\s*"RANGE_XK"/);
  assert.match(config, /database_name\s*=\s*"parts-xk"/);
  assert.match(config, /database_id\s*=\s*"55a0ebdb-6a86-4c2a-9ede-d4da2e47db00"/);
});
