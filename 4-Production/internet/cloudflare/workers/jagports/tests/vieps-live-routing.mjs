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

test('case-insensitive TEST URL enables fixtures on Web APIs and does not depend on a real Range', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const env = { DB: d1(db) };
  for (const key of ['TEST', 'test', 'TeSt']) {
    const query = key + '=1';
    const suitability = await handleApi(new Request(
      'https://test.example/api/vieps/suitability?' + query), env);
    assert.equal(suitability.status, 200, query);
    const body = await suitability.json();
    assert.equal(body.fixture_mode, true, query);
    assert.equal(body.categories.length, 4, query);
    assert.equal(body.categories.flatMap(category => category.values).length, 8, query);
    const parts = await handleApi(new Request(
      'https://test.example/api/vieps/part?q=MJB7703AA&' + query), env);
    assert.equal(parts.status, 200, query);
    const part = await parts.json();
    assert.equal(part.part?.part_number_normalized, 'MJB7703AA', query);
    const tree = await handleApi(new Request(
      'https://test.example/api/vieps/tree?root=1&' + query), env);
    assert.equal(tree.status, 200, query);
  }
});

test('missing or conflicting TEST URL flags never expose fixture data', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const env = { DB: d1(db) };
  for (const flags of ['', '?TEST=0', '?test=2', '?TEST=1&test=0', '?test=1&TEST=1']) {
    await assert.rejects(() => handleApi(new Request(
      'https://test.example/api/vieps/suitability' + flags), env),
    error => error.status === 503 && error.code === 'range_unavailable',
    'unbound real Range must reject URL flags: ' + flags);
  }
});


test('#976 FIT route is canonical and legacy suitability API remains a compatible alias', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const env = { DB: d1(db) };
  for (const path of ['/api/vieps/fit', '/api/vieps/suitability']) {
    const response = await handleApi(new Request('https://test.example' + path + '?TEST=1'), env);
    assert.equal(response.status, 200, path);
    const data = await response.json();
    assert.equal(data.fixture_mode, true, path);
    assert.equal(data.categories.length, 4, path);
    assert.ok(data.matches.length > 0, path);
  }
});
