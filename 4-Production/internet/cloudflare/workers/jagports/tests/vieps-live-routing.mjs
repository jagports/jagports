import test from 'node:test';
import assert from 'node:assert/strict';
import { liveRangeDatabase } from '../src/vieps-live.js';

test('real routing uses a reviewed Range binding and never falls back to fixture DB', () => {
  const env = { DB: {}, RANGE_BINDINGS: '{"xk":"RANGE_XK"}', RANGE_XK: { name: 'xk' } };
  assert.equal(liveRangeDatabase(new URL('https://example.test/api/vieps/tree'), env).db, env.RANGE_XK);
  assert.throws(() => liveRangeDatabase(new URL('https://example.test/api/vieps/tree'), { ...env, RANGE_XK: undefined }), error => error.code === 'range_unavailable');
});
