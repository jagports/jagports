import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseJepcFile, parseSelection } from '../src/DataImporter.Parse.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('preserves exact source bytes and reported record coordinates', () => {
  const bytes = Buffer.from("<?xml version=\"1.0\"?>\r\n<Data>\r\n[XK Range/SEATING/REAR SEATS, TRIM AND FITTINGS]\r\n[123,label,with,commas,1]\r\n[unexpected syntax\r\n</Data>\r\n", 'latin1');
  const file = parseJepcFile(bytes, 'category', 'cat.xml');
  assert.deepEqual(Buffer.from(file.rawBase64, 'base64'), bytes);
  assert.equal(file.sha256, sha(bytes));
  assert.equal(file.records[0].fields[0], 'XK Range/SEATING/REAR SEATS, TRIM AND FITTINGS');
  assert.deepEqual(file.records[1].fields, ['123', 'label,with,commas', '1']);
  assert.deepEqual(file.unknown.map(item => [item.line, item.reason]), [[5, 'unrecognized-record']]);
});

test('retains opaque applicability tuples without assigning invented meanings', () => {
  const file = parseJepcFile(Buffer.from('<Data>\n142207,[A155,2932,0,0][A23,154,0,0]\n</Data>'),
    'attributes', 'item_attributes.xml');
  assert.equal(file.unknown.length, 0);
  assert.equal(file.records[0].key, '142207');
  assert.deepEqual(file.records[0].predicates.map(item => item.raw), ['[A155,2932,0,0]', '[A23,154,0,0]']);
});

test('stages forty bundles, reuses identical evidence and rejects source drift', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'jepc-parse-'));
  try {
    const source = path.join(temp, 'source'), stateDir = path.join(temp, 'state');
    const bundles = [];
    for (const model of ['3187', '3183', '3178', '3173', '7420']) {
      const directory = path.join(source, 'drilldown', `pl_id_${model}`, 'L0');
      await mkdir(directory, { recursive: true });
      for (let index = 1; index <= 8; index++) {
        const category = String(index);
        const names = [`cat_M${model}_C${category}_L0.xml`, `tl_M${model}_C${category}_L0.xml`,
          `Itm_M${model}_C${category}_I1_L0.xml`];
        const contents = [`<Data>\n[Model/Catalogue/Category]\n[ab123]\n[${category},Label,1]\n</Data>\n`,
          `<Data>\n[1,'Item']\n</Data>\n`,
          "<Data>\n[1,2,'Leaf',4,'PART',0,1,0,'image',0,'1',142207]\n</Data>\n"];
        const files = [];
        for (let i = 0; i < names.length; i++) {
          const bytes = Buffer.from(contents[i]);
          await writeFile(path.join(directory, names[i]), bytes);
          files.push({ path: `drilldown/pl_id_${model}/L0/${names[i]}`, sha256: sha(bytes), size: bytes.length });
        }
        if (model === '3187' && index === 1) {
          await writeFile(path.join(source, 'drilldown', `pl_id_${model}`, `Itm_M${model}_C1_I1_attributes.xml`),
            '<Data>\n142207,[A23,154,0,0]\n</Data>\n');
        }
        bundles.push({ model, category, language: '0', files });
      }
    }
    const manifestPath = path.join(temp, 'selection.json');
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, phase: 'SELECTION_ONLY', range: 'xj', source, bundles }));
    await assert.rejects(parseSelection({ manifestPath, stateDir }), /Unsupported Range/);
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, phase: 'SELECTION_ONLY', range: 'xk', source, bundles }));
    const first = await parseSelection({ manifestPath, stateDir });
    assert.equal(first.range, 'xk');
    assert.equal(first.bundles, 40);
    assert.equal(first.files, 121);
    assert.equal(first.unknown, 0);
    assert.equal(first.reused, 0);
    const second = await parseSelection({ manifestPath, stateDir });
    assert.equal(second.reused, 40);
    const staged = JSON.parse(await readFile(path.join(first.outputDir, 'M3187_C1_L0.json')));
    assert.equal(staged.files.find(file => file.kind === 'attributes').records[0].key, '142207');
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 1, phase: 'SELECTION_ONLY', source, bundles }));
    assert.equal((await parseSelection({ manifestPath, stateDir })).range, 'xk');
    await writeFile(path.join(source, 'drilldown', 'pl_id_3187', 'L0', 'cat_M3187_C1_L0.xml'), 'changed');
    await assert.rejects(parseSelection({ manifestPath, stateDir }), /checksum changed/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
