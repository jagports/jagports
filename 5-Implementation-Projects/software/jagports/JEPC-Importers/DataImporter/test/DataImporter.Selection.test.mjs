import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { matchingLeafModels, selectModelBundles } from '../src/DataImporter.Selection.mjs';

const TEST_MODEL_IDS = ['3187', '3183', '3178', '3173', '7420'];

async function fixture(t) {
  const parent = await mkdtemp(path.join(tmpdir(), 'jepc-select-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const source = path.join(parent, 'source'), stateDir = path.join(parent, 'state');
  const put = async (relative, value) => {
    const filename = path.join(source, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, value);
  };
  const wrapper = values => `<?xml version="1.0" encoding="ISO8859-1" ?>\n<Data>\n${values.join('\n')}\n</Data>`;
  await put('menus/models_l_id_0.xml', wrapper([
    '[3175,10001,\'Jaguar XK8 Coupe/Convertible\']',
    ...TEST_MODEL_IDS.slice(0, 4).map(id => `[${id},3175,'XK8 model ${id}']`),
    '[7422,10001,\'XK Range\']', '[7420,7422,\'XK Range model\']',
  ]));
  for (const model of TEST_MODEL_IDS) {
    const entries = [];
    for (let n = 1; n <= 9; n++) {
      const category = String(Number(model) * 100 + n);
      entries.push(`[${category},${model},'Category ${n}',1]`);
      const base = `drilldown/pl_id_${model}/L0`;
      await put(`${base}/cat_M${model}_C${category}_L0.xml`, `<Data>[category ${n}]</Data>`);
      await put(`${base}/tl_M${model}_C${category}_L0.xml`, `<Data>[1,'Part']</Data>`);
      await put(`${base}/Itm_M${model}_C${category}_I1_L0.xml`, `<Data>[1,101,'PN-${n}']</Data>`);
    }
    await put(`menus/L0/pl_id_${model}_l_id_0.xml`, wrapper(entries));
  }
  return { source, stateDir, put };
}

test('model pattern selects XML leaves and matching parent descendants without fixed IDs', () => {
  const source = `<Data>\n[3175,10001,'Jaguar XK8 Coupe/Convertible']\n[3187,3175,'XK8 Coupe']\n[7422,10001,'XK Range']\n[7420,7422,'XK Range later']\n[2233,10001,'XJ Series X300']\n[2231,2233,'XJ Series model']\n[3215,10001,'XJ Series X308']\n[3218,3215,'XJ Series model']\n[2213,10001,'XJS Sports Coupe']\n[2216,2213,'XJS model']\n</Data>`;
  assert.deepEqual(matchingLeafModels(source, 'XK').map(model => model.id), ['3187', '7420']);
  assert.deepEqual(matchingLeafModels(source, 'X300').map(model => model.id), ['2231']);
  assert.deepEqual(matchingLeafModels(source, 'X3').map(model => model.id), ['2231', '3218']);
  assert.deepEqual(matchingLeafModels(source, 'XJ').map(model => model.id), ['2231', '3218', '2216']);
  assert.deepEqual(matchingLeafModels(source, 'XJS').map(model => model.id), ['2216']);
  assert.throws(() => matchingLeafModels(source, 'F-Type'), /No leaf source models/);
});

test('selection caps complete categories at forty, covers matched models and records incomplete ones', async t => {
  const options = await fixture(t);
  const first = await selectModelBundles({ ...options, pattern: 'XK' });
  assert.equal(first.modelPattern, 'XK');
  assert.deepEqual(first.modelIds, TEST_MODEL_IDS);
  assert.equal(first.eligibleCategories, 45);
  assert.equal(first.categoryLimit, 40);
  assert.equal(first.bundles.length, 40);
  assert.deepEqual(new Set(first.bundles.map(bundle => bundle.model)), new Set(TEST_MODEL_IDS));
  assert.deepEqual((await selectModelBundles({ ...options, pattern: 'xk' })).bundles, first.bundles);
  const other = await selectModelBundles({ ...options, pattern: 'XK', seed: 'another-sample' });
  assert.equal(other.bundles.length, 40);
  assert.notDeepEqual(other.bundles.map(bundle => `${bundle.model}/${bundle.category}`),
    first.bundles.map(bundle => `${bundle.model}/${bundle.category}`));
  assert.equal(first.incompleteCategories.length, 0);
  await assert.rejects(readdir(options.stateDir), /ENOENT/);
  await rm(path.join(options.source, 'drilldown/pl_id_3187/L0/tl_M3187_C318701_L0.xml'));
  const changed = await selectModelBundles({ ...options, pattern: 'xk' });
  assert.equal(changed.eligibleCategories, 44);
  assert.equal(changed.bundles.length, 40);
  assert.deepEqual(changed.incompleteCategories[0].missing, ['top-level']);
});

test('unknown menu structures and state inside the source are rejected', async t => {
  const options = await fixture(t);
  await options.put('menus/L0/pl_id_3187_l_id_0.xml', '<?xml version="1.0"?>\n<Data>\n[broken]\n</Data>');
  await assert.rejects(selectModelBundles({ ...options, pattern: 'XK' }), /Unknown menu row/);
  await assert.rejects(selectModelBundles({ ...options, pattern: 'XK', stateDir: path.join(options.source, 'state') }), /outside/);
});

test('--parse stages forty matched bundles and reuses evidence without saving a selection file', async t => {
  const options = await fixture(t);
  const cli = path.resolve('src/DataImporter.CLI.mjs');
  const run = (pattern, extra = []) => spawnSync(process.execPath, [cli, '--parse', pattern,
    '--source', options.source, '--state-dir', options.stateDir, ...extra, '--json'], { encoding: 'utf8' });
  const first = run('XK');
  assert.equal(first.status, 0, first.stderr);
  const summary = JSON.parse(first.stdout);
  assert.equal(summary.eligible, 45);
  assert.equal(summary.limit, 40);
  assert.equal(summary.selected, 40);
  assert.deepEqual(summary.modelIds, TEST_MODEL_IDS);
  assert.equal(summary.staging.bundles, 40);
  assert.equal(summary.staging.reused, 0);
  assert.equal((await readdir(options.stateDir)).some(name => name.includes('selection')), false);
  const second = run('xk');
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).staging.reused, 40);
  const estimated = run('XK', ['--estimate']);
  assert.equal(estimated.status, 0, estimated.stderr);
  const estimateReport = JSON.parse(await readFile(JSON.parse(estimated.stdout).estimate.report, 'utf8'));
  assert.equal(estimateReport.modelPattern, 'XK');
  assert.equal(estimateReport.range, null);
});
