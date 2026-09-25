import assert from 'node:assert/strict';
import test from 'node:test';
import { transformBundle } from '../src/DataImporter.Transform.mjs';

test('keeps source decision paths and sidecar predicates with each occurrence', () => {
  const prefix = 'drilldown/pl_id_3173';
  const itemPath = `${prefix}/L0/Itm_M3173_C10036_I1_L0.xml`;
  const sidecarPath = `${prefix}/Itm_M3173_C10036_I1_attributes.xml`;
  const row = (line, fields) => ({ type: 'item-tree-row', line, raw: `[${fields.join(',')}]`, fields });
  const staged = {
    schemaVersion: 1, status: 'PARSED',
    identity: { model: '3173', category: '10036', language: '0' },
    source: { root: 'source', modelLabel: 'XK8', parentModel: '1', parentModelLabel: 'XK Range',
      categoryLabel: 'Harnesses', categoryParent: 'Electrical' },
    files: [
      { kind: 'category', path: `${prefix}/L0/cat_M3173_C10036_L0.xml`, size: 1, sha256: 'cat',
        records: [{ type: 'category-context', fields: ['XK8/ELECTRICAL/HARNESSES'] }] },
      { kind: 'top-level', path: `${prefix}/L0/tl_M3173_C10036_L0.xml`, size: 1, sha256: 'top',
        records: [{ type: 'top-level-item', fields: ['1', "'Harness'"] }] },
      { kind: 'item', path: itemPath, size: 1, sha256: 'item', records: [
        row(3, ['1', '11001', "'LH side'", '0', '0', '0', '0', '0', '0', '0', "'0'", '0']),
        row(4, ['11001', '11002', "'To VIN (A36873)'", '0', '0', '0', '0', '0', '0', '0', "'0'", '0']),
        row(5, ['11002', '11003', "''", '87663', "'LJA3705AB'", '0', '1', '0', "'pb_02'", '0', "'1'", '144798']),
      ] },
      { kind: 'attributes', path: sidecarPath, size: 1, sha256: 'sidecar', records: [
        { type: 'applicability', line: 3, raw: '144798,[A23,154,0,0]', key: '144798',
          predicates: [{ raw: '[A23,154,0,0]', fields: ['A23', '154', '0', '0'] }] },
      ] },
    ],
  };
  const result = transformBundle(staged);
  assert.equal(result.occurrences.length, 1);
  assert.equal(result.occurrences[0].partNumberNormalized, 'LJA3705AB');
  assert.deepEqual(result.occurrences[0].sourceConditions.map(item => item.description),
    ['LH side', 'To VIN (A36873)']);
  assert.equal(result.occurrences[0].applicabilityEvidence[0].path, sidecarPath);
  assert.equal(result.occurrences[0].applicabilityEvidence[0].predicates[0].raw, '[A23,154,0,0]');
  assert.equal(result.source.breadcrumb, 'XK8/ELECTRICAL/HARNESSES');
});
