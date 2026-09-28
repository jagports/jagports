import test from 'node:test';
import assert from 'node:assert/strict';
import {
  d1Client, rangeForSource, readSourceRangeMap, verifyPartsDatabaseSchema,
} from '../../../../../../3-Deployment/internet/cloudflare/d1/parts/parts-d1-client.mjs';

test('Range comes from reviewed source ancestry, never the parse text', async () => {
  const ranges = await readSourceRangeMap();
  assert.equal(rangeForSource({ model: '3187', ancestorModelIds: ['3175', '10001'] }, ranges), 'xk');
  assert.equal(rangeForSource({ model: '7420', ancestorModelIds: ['7422', '10001'] }, ranges), 'xk');
  assert.throws(() => rangeForSource({ model: '2231', ancestorModelIds: ['2233', '10001'] }, ranges));
});

test('parts database writes require the reviewed D1 identity and complete batch confirmation', async () => {
  const config = { rangeSlug: 'xk', databaseName: 'jagports-xk',
    accountId: 'a'.repeat(32), databaseId: '12345678-1234-1234-1234-123456789abc' };
  const requests = [];
  const fetchImpl = async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : null;
    requests.push({ url, body });
    const result = body?.batch ? body.batch.map(() => ({ success: true, results: [] }))
      : body?.sql ? [{ success: true, results: [{ range_slug: 'xk',
        database_name: 'jagports-xk', schema_version: 1 }] }]
        : { uuid: config.databaseId, name: config.databaseName };
    return { ok: true, status: 200, json: async () => ({ success: true, result }) };
  };
  const client = d1Client(config, 'test-token', fetchImpl);
  await client.verifyIdentity();
  await verifyPartsDatabaseSchema(client, config);
  await client.batch([{ sql: 'SELECT 1', params: [] }]);
  assert.equal(requests.length, 3);
  assert.ok(requests.every(request => request.url.includes(config.databaseId)));
  assert.deepEqual(requests[2].body, { batch: [{ sql: 'SELECT 1', params: [] }] });

  const wrongIdentity = d1Client(config, 'test-token', async () => ({ ok: true, status: 200,
    json: async () => ({ success: true, result: { uuid: config.databaseId, name: 'other-parts' } }) }));
  await assert.rejects(wrongIdentity.verifyIdentity(), /identity differs/);
  const incompleteBatch = d1Client(config, 'test-token', async () => ({ ok: true, status: 200,
    json: async () => ({ success: true, result: [] }) }));
  await assert.rejects(incompleteBatch.batch([{ sql: 'SELECT 1', params: [] }]), /incomplete batch/);
});

