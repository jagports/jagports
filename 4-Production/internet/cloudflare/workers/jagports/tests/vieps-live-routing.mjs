import test from 'node:test';
import assert from 'node:assert/strict';
import { liveRangeDatabase } from '../js/vieps-parts.js';

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
