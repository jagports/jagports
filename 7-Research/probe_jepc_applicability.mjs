// Bounded source-code probes, not a VIEPS evaluator or importer.
// Run from any directory: node 7-Research/probe_jepc_applicability.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const sourceUrl = new URL('../5-Implementation-Projects/software/jlr/JEPC/JEPCFiles/js/JEPCFiltering.js', import.meta.url);
const source = readFileSync(sourceUrl);
const context = vm.createContext({});
vm.runInContext(source.toString('utf8'), context, { timeout: 1000 });
console.log(`JEPCFiltering.js SHA256 ${createHash('sha256').update(source).digest('hex')}`);
let count = 0;
function probe(name, input, expression, expected) {
  Object.assign(context, input);
  const actual = JSON.parse(JSON.stringify(vm.runInContext(expression, context, { timeout: 1000 })));
  assert.deepEqual(actual, expected, name);
  console.log(`PASS ${name}: ${JSON.stringify(actual)}`);
  count++;
}

// Observed 3187/11096 source boundaries, retaining their two leading spaces.
// Padded serials below isolate comparator behavior; this is NOT a VIN parser test.
const applications = [{ applicationId: '93491' }, { applicationId: '151439' }];
const boundaries = [['93491', [['C', '  023699', '1', '0']]], ['151439', [['C', '  023700', '0', '0']]]];
for (const [serial, expected] of [['  023698', ['93491']], ['  023699', ['93491']], ['  023700', ['151439']], ['  023701', ['151439']]]) {
  probe(`application boundary ${serial.trim()}`, { applications, boundaries, serial },
    'filterDrillDownItem(applications, boundaries, serial, []).map(x => x.applicationId)', expected);
}
const item = [['1', '0', 'Passenger airbag module', '1']];
const itemBoundaries = boundaries.map(([, attrs]) => ['1', attrs]);
probe('repeated top-level item boundaries are alternatives', { item, itemBoundaries },
  'filterDrillDownTopLevel(item, itemBoundaries, "  023699", []).map(x => x[0])', ['1']);
probe('same repeated bounds at application scope reject the candidate',
  { one: [{ applicationId: '1' }] },
  'filterDrillDownItem(one, itemBoundaries, "  023699", []).map(x => x.applicationId)', []);
probe('unpadded serial differs against padded raw boundary', { applications, boundaries },
  'filterDrillDownItem(applications, boundaries, "023699", []).map(x => x.applicationId)', ['151439']);

// Synthetic combinations of observed A6 token vocabulary. These are code-behavior
// probes, not claims that this compound record occurs in the installed catalogue.
const candidate = [{ applicationId: 'x' }];
const category = [['x', '0', 'synthetic', '1']];
const attrs = [['x', [['A6', '913', '1'], ['A23', '154', '0']]]];
const vehicle = [['A6', '913'], ['A23', '154']];
probe('application exclusion survives another matching group', { candidate, attrs, vehicle },
  'filterDrillDownItem(candidate, attrs, null, vehicle).map(x => x.applicationId)', []);
probe('category matching group can rescue the same identifier', { category },
  'filterCategoryMenu(category, attrs, null, vehicle).map(x => x[0])', ['x']);
probe('source skips a missing vehicle attribute group',
  { missing: [['A23', '154']], onlyA6: [['x', [['A6', '913', '0']]]] },
  'filterDrillDownItem(candidate, onlyA6, null, missing).map(x => x.applicationId)', ['x']);
console.log(`${count} source probes passed; no production fitment equivalence claimed.`);
