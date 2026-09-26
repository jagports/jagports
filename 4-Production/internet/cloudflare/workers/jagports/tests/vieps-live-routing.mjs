import test from 'node:test';
import assert from 'node:assert/strict';
import { liveRangeDatabase } from '../src/vieps-live.js';

test('real routing uses a reviewed Range binding and never falls back to fixture DB', () => {
  const fixture = { name: 'fixture' }, xk = { name: 'xk' };
  const env = { DB: fixture, RANGE_BINDINGS: '{"xk":"RANGE_XK"}', RANGE_XK: xk };
  assert.equal(liveRangeDatabase(new URL('https://example.test/api/vieps/tree'), env).db, xk);
  assert.throws(() => liveRangeDatabase(new URL('https://example.test/api/vieps/tree'),
    { ...env, RANGE_XK: undefined }), error => error.code === 'range_unavailable');
});

test('multiple real Ranges require an explicit selected Range', () => {
  const env = { DB: {}, RANGE_BINDINGS: '{"xk":"RANGE_XK","xj":"RANGE_XJ"}',
    RANGE_XK: { name: 'xk' }, RANGE_XJ: { name: 'xj' } };
  assert.throws(() => liveRangeDatabase(new URL('https://example.test/api/vieps/part?q=ABC'), env),
    error => error.code === 'range_required');
  assert.equal(liveRangeDatabase(new URL('https://example.test/api/vieps/part?q=ABC&range=xj'), env).db,
    env.RANGE_XJ);
});
