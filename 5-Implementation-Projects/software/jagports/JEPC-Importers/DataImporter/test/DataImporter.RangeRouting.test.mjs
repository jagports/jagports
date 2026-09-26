import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeForSource, readSourceRangeMap } from '../../../../../../3-Deployment/internet/cloudflare/d1/ranges/range-d1-client.mjs';

test('Range comes from reviewed source ancestry, never the parse text', async () => {
  const ranges = await readSourceRangeMap();
  assert.equal(rangeForSource({ model: '3187', ancestorModelIds: ['3175', '10001'] }, ranges), 'xk');
  assert.equal(rangeForSource({ model: '7420', ancestorModelIds: ['7422', '10001'] }, ranges), 'xk');
  assert.throws(() => rangeForSource({ model: '2231', ancestorModelIds: ['2233', '10001'] }, ranges));
});
