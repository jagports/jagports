import assert from 'node:assert/strict';
import test from 'node:test';
import {
  d1ImportStatements,
  d1VerificationStatements,
  upgradeJePCVerification,
} from '../src/DataImporter.Update.mjs';

const projection = {
  identity: { model: '3187', category: '11096', language: '0' },
  source: {
    modelLabel: 'XK8 Coupe/Convertible',
    parentModel: '3175',
    categoryLabel: 'AIRBAG SENSORS PASSENGER AIRBAG',
    breadcrumb: 'XK8 Coupe/Convertible/AIRBAG SENSORS PASSENGER AIRBAG',
  },
  files: [],
  unresolvedLeaves: [],
  occurrences: [{
    partNumberRaw: 'HJB9670AA',
    partNumberNormalized: 'HJB9670AA',
    item: '1',
    topLevelDescription: 'Passenger airbag module',
    sourceConditions: [{ id: 'vin-from-023700', description: 'From VIN (023700)', line: 6 }],
    sourcePath: 'drilldown/pl_id_3187/L0/Itm_M3187_C11096_I1_L0.xml:6',
    sourceNodeId: '6',
    parentSourceNodeId: '1',
    sourceFileSha256: 'a'.repeat(64),
    applicationId: '1',
    applicabilityEvidence: [],
    rawRow: '{}',
  }],
};

test('D1 import writes JEPC parts, occurrences and tree paths as verified', () => {
  const statements = d1ImportStatements(projection, 'evidence-hash');
  const sql = statements.map(entry => entry.sql).join('\n');

  assert.match(sql, /source_description,source_order,source_ref,verification_status\)/);
  assert.match(sql, /VALUES\(\?,\?,\?,'ImportJEPC','JEPC','verified'\)/);
  assert.match(sql, /category_ref,item_number,verification_status\)/);
  assert.match(sql, /'epc',\?,\?,\?,'verified'\)/);
  assert.match(sql, /source_ref,verification_status\)/);
  assert.match(sql, /'JEPC',\?,\?,\?,'verified'\)/);
  assert.match(sql, /ON CONFLICT\(part_number_normalized\) DO UPDATE SET verification_status='verified'/);
  assert.doesNotMatch(sql, /'unverified'/);
});

test('existing JEPC D1 rows are upgraded and the result is read back', async () => {
  const queries = [];
  const batches = [];
  const pendingCounts = [{ pending: 7 }, { pending: 0 }];
  const client = {
    async query(sql) { queries.push(sql); return [pendingCounts.shift()]; },
    async batch(statements) { batches.push(statements); },
  };

  const upgraded = await upgradeJePCVerification(client);
  assert.equal(upgraded, 7);
  assert.equal(queries.length, 2);
  assert.equal(batches.length, 1);
  assert.deepEqual(
    batches[0].map(entry => entry.sql.match(/UPDATE (\w+)/)?.[1]),
    ['part', 'part_occurrence', 'part_tree_node', 'part_occurrence_tree_path'],
  );
  assert.ok(batches[0].every(entry => entry.sql.includes("verification_status='verified'")));
});

test('no D1 update is sent when all JEPC rows are already verified', async () => {
  let batchCount = 0;
  const client = {
    async query() { return [{ pending: 0 }]; },
    async batch() { batchCount++; },
  };
  assert.equal(await upgradeJePCVerification(client), 0);
  assert.equal(batchCount, 0);
  assert.equal(d1VerificationStatements().length, 4);
});
