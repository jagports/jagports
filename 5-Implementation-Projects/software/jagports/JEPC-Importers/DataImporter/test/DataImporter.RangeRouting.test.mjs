import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPartsDatabaseSchema, d1Client, rangeForSource, readSourceRangeMap, verifyPartsDatabaseSchema,
} from '../../../../../../3-Deployment/internet/cloudflare/d1/parts/parts-d1-client.mjs';
import { d1ImportRows, d1ImportStatements } from '../src/DataImporter.Update.mjs';

test('D1 import excludes staged bundles outside the current selection for both selectors', () => {
  const rows = ['11096', '11097'].map(category => ({ staged: {
    identity: { model: '3187', category, language: '0' },
  } }));
  const exactCategory = d1ImportRows(rows, {
    selector: 'MODEL_CATEGORY',
    bundles: [{ model: '3187', category: '11096', language: '0' }],
  });
  assert.deepEqual(exactCategory.map(row => row.staged.identity.category), ['11096']);
  const modelPattern = d1ImportRows(rows, {
    selector: 'MODEL_PATTERN',
    bundles: [{ model: '3187', category: '11096', language: '0' }],
  });
  assert.deepEqual(modelPattern.map(row => row.staged.identity.category), ['11096']);
});

test('Range comes from reviewed source ancestry, never the parse text', async () => {
  const ranges = await readSourceRangeMap();
  assert.equal(rangeForSource({ model: '3187', ancestorModelIds: ['3175', '10001'] }, ranges), 'xk');
  assert.equal(rangeForSource({ model: '7420', ancestorModelIds: ['7422', '10001'] }, ranges), 'xk');
  assert.throws(() => rangeForSource({ model: '2231', ancestorModelIds: ['2233', '10001'] }, ranges));
});

test('parts database writes require the reviewed D1 identity and complete batch confirmation', async () => {
  const config = { rangeSlug: 'xk', databaseName: 'parts-xk',
    accountId: 'a'.repeat(32), databaseId: '12345678-1234-1234-1234-123456789abc' };
  const requests = [];
  const fetchImpl = async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : null;
    requests.push({ url, body });
    const result = body?.batch ? body.batch.map(() => ({ success: true, results: [] }))
      : body?.sql ? [{ success: true, results: [{ range_slug: 'xk',
        database_name: 'parts-xk', schema_version: 1 }] }]
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


test('item-only D1 replacement preserves siblings and removes whole-category confirmation', () => {
  const projection = {
    identity: { model: '3187', category: '11096', language: '0' },
    source: { modelLabel: 'XK8', categoryLabel: 'Safety' },
    occurrences: [], unresolvedLeaves: [],
    files: [{ path: 'drilldown/pl_id_3187/L0/Itm_M3187_C11096_I7_L0.xml' }],
  };
  const sql = d1ImportStatements(projection, 'item-hash', '7').map(query => query.sql);
  assert.ok(sql.some(statement => statement.includes('context_ref=? AND item_number=?')));
  assert.ok(sql.some(statement => statement.includes('DELETE FROM jepc_bundle')));
  assert.ok(!sql.some(statement => statement.includes('INSERT INTO jepc_bundle')));
});


test('migrates a matching legacy Range identity table without losing the existing D1 data', async () => {
  const config = { rangeSlug: 'xk', databaseName: 'parts-xk',
    accountId: 'a'.repeat(32), databaseId: '12345678-1234-1234-1234-123456789abc' };
  const requests = [];
  const fetchImpl = async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : null;
    requests.push({ url, body });
    if (!body) return { ok: true, status: 200,
      json: async () => ({ success: true, result: { uuid: config.databaseId, name: config.databaseName } }) };
    const sql = body.sql ?? '';
    let results = [];
    if (sql.includes('SELECT name FROM sqlite_master')) {
      results = [{ name: 'range_identity' }, { name: 'part' }];
    } else if (sql.includes('FROM range_identity')) {
      results = [{ range_slug: 'xk', database_name: 'parts-xk', schema_version: 1 }];
    } else if (sql.includes('FROM parts_database_identity')) {
      results = [{ range_slug: 'xk', database_name: 'parts-xk', schema_version: 1 }];
    }
    return { ok: true, status: 200,
      json: async () => ({ success: true, result: [{ success: true, results }] }) };
  };
  const result = await applyPartsDatabaseSchema(config, 'test-token', fetchImpl);
  assert.equal(result.reused, true);
  assert.equal(result.databaseId, config.databaseId);
  const statements = requests.map(request => request.body?.sql ?? '');
  assert.ok(statements.some(sql => sql.includes('INSERT INTO parts_database_identity')));
  assert.ok(statements.includes('DROP TABLE range_identity'));
  assert.ok(statements.some(sql => sql.includes('FROM parts_database_identity')));
  assert.ok(statements.indexOf('DROP TABLE range_identity')
    > statements.findIndex(sql => sql.includes('FROM parts_database_identity')));
});
