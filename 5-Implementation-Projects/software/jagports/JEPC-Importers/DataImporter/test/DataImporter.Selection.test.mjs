import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { XK_MODEL_IDS, matchingLeafModels, selectRangeBundles } from '../src/DataImporter.Selection.mjs';

test('model fragment includes matching leaves and descendants of matching parent rows', () => {
  const source = `<Data>\n[3175,10001,'Jaguar XK8 Coupe/Convertible']\n[3187,3175,'XK8 Coupe up to VIN']\n[3183,3175,'XK8 Coupe Canada/USA']\n[7422,10001,'XK Range']\n[7420,7422,'XK Range later']\n[2233,10001,'XJ Range X300']\n[2231,2233,'XJ Range X300 model']\n[3215,10001,'XJ Range X308']\n[3218,3215,'XJ Range X308 model']\n[2213,10001,'XJS Sports Coupe']\n[2216,2213,'XJS model']\n</Data>`;
  assert.deepEqual(matchingLeafModels(source, 'xk').map(model => model.id), ['3187', '3183', '7420']);
  assert.deepEqual(matchingLeafModels(source, 'Jaguar XK8').map(model => model.id), ['3187', '3183']);
  assert.deepEqual(matchingLeafModels(source, 'X300').map(model => model.id), ['2231']);
  assert.deepEqual(matchingLeafModels(source, 'X3').map(model => model.id), ['2231', '3218']);
  assert.deepEqual(matchingLeafModels(source, 'XJ').map(model => model.id), ['2231', '3218', '2216']);
  assert.deepEqual(matchingLeafModels(source, 'XJS').map(model => model.id), ['2216']);
  assert.throws(() => matchingLeafModels(source, 'F-Type'), /No leaf source models/);
});

async function fixture(t) {
  const parent = await mkdtemp(path.join(tmpdir(), 'jepc-select-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const source = path.join(parent, 'source');
  const stateDir = path.join(parent, 'state');
  const put = async (relative, value) => {
    const filename = path.join(source, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, value);
  };
  const wrapper = values => `<?xml version="1.0" encoding="ISO8859-1" ?>\n<Data>\n${values.join('\n')}\n</Data>`;
  await put('menus/models_l_id_0.xml', wrapper(XK_MODEL_IDS.map(id => `[${id},3175,'XK model ${id}']`)));
  for (const model of XK_MODEL_IDS) {
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
  return { range: 'xk', source, stateDir, seed: 'reviewable-seed', put };
}

test('selects forty real bundles across five models and reuses the same manifest', async t => {
  const options = await fixture(t);
  const first = await selectRangeBundles(options);
  assert.equal(first.manifest.range, 'xk');
  assert.equal(first.reused, false);
  assert.equal(first.manifest.selection.candidateCount, 45);
  assert.equal(first.manifest.bundles.length, 40);
  assert.deepEqual([...new Set(first.manifest.bundles.map(b => b.model))].sort(), [...XK_MODEL_IDS].sort());
  assert.equal(first.manifest.bundles[0].files.length, 3);
  assert.equal(first.manifest.phase, 'SELECTION_ONLY');
  assert.equal((await readFile(first.filename, 'utf8')).includes('PN-'), false);
  const again = await selectRangeBundles(options);
  assert.equal(again.reused, true);
  assert.deepEqual(again.manifest.bundles, first.manifest.bundles);
  const legacy = { ...first.manifest };
  delete legacy.range;
  await writeFile(first.filename, `${JSON.stringify(legacy, null, 2)}\n`);
  const reusedLegacy = await selectRangeBundles(options);
  assert.equal(reusedLegacy.reused, true);
  assert.equal(reusedLegacy.manifest.range, undefined);
});

test('different seed has a separate manifest; source change blocks reuse', async t => {
  const options = await fixture(t);
  const first = await selectRangeBundles(options);
  const other = await selectRangeBundles({ ...options, seed: 'another-seed' });
  assert.notEqual(other.filename, first.filename);
  assert.notDeepEqual(other.manifest.bundles.map(b => `${b.model}/${b.category}`),
    first.manifest.bundles.map(b => `${b.model}/${b.category}`));
  const file = first.manifest.bundles[0].files[0].path;
  await options.put(file, '<Data>changed source</Data>');
  await assert.rejects(selectRangeBundles(options), /Existing selection differs/);
});

test('missing or unknown menu structures fail rather than invent candidates', async t => {
  const options = await fixture(t);
  await options.put('menus/L0/pl_id_3187_l_id_0.xml', '<?xml version="1.0"?>\n<Data>\n[broken]\n</Data>');
  await assert.rejects(selectRangeBundles(options), /Unknown menu row/);
  await assert.rejects(selectRangeBundles({ ...options, stateDir: path.join(options.source, 'state') }), /outside/);
});

test('a missing dependency excludes that category from the candidate population', async t => {
  const options = await fixture(t);
  await rm(path.join(options.source, 'drilldown/pl_id_3187/L0/tl_M3187_C318701_L0.xml'));
  const result = await selectRangeBundles(options);
  assert.equal(result.manifest.selection.candidateCount, 44);
  assert.equal(result.manifest.bundles.some(bundle => bundle.model === '3187' && bundle.category === '318701'), false);
});

test('pre-import estimate runs only when explicitly enabled', async t => {
  const options = await fixture(t);
  const cli = path.resolve('src/DataImporter.CLI.mjs');
  const base = ['select', '--range', 'xk', '--source', options.source, '--state-dir', options.stateDir,
    '--seed', options.seed, '--json'];
  const call = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  const plain = call(base);
  assert.equal(plain.status, 0, plain.stderr);
  assert.equal(JSON.parse(plain.stdout).estimate, undefined);
  assert.equal((await readdir(options.stateDir)).some(name => name.startsWith('range-estimate-')), false);
  const enabled = call([...base, '--estimate', '--sample-size', '5']);
  assert.equal(enabled.status, 0, enabled.stderr);
  const summary = JSON.parse(enabled.stdout);
  assert.equal(summary.estimate.state, 'COMPLETED');
  assert.equal(summary.estimate.sourceFiles, 141);
  assert.equal(summary.estimate.projectedD1Bytes, null);
  assert.ok((await readdir(options.stateDir)).some(name => name.startsWith('range-estimate-')));
  assert.equal(call([...base, '--sample-size', '5']).status, 1);
  assert.match(call(base.filter((value, index) => index < 1 || index > 2)).stderr, /Unsupported Range/);
  assert.match(call(base.map(value => value === 'xk' ? 'xj' : value)).stderr, /Unsupported Range/);
});

test('--parse model fragment stages every complete category in all matching source models', async t => {
  const options = await fixture(t);
  const cli = path.resolve('src/DataImporter.CLI.mjs');
  const run = fragment => spawnSync(process.execPath, [cli, '--parse', fragment, '--source', options.source,
    '--state-dir', options.stateDir, '--json'], { encoding: 'utf8' });
  const first = run('XK');
  assert.equal(first.status, 0, first.stderr);
  const summary = JSON.parse(first.stdout);
  assert.equal(summary.selected, 45);
  assert.deepEqual(summary.modelIds, XK_MODEL_IDS);
  assert.equal(summary.staging.bundles, 45);
  assert.equal(summary.staging.reused, 0);
  assert.equal(summary.estimate, undefined);
  const second = run('xk');
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).staging.reused, 45);
  const estimated = spawnSync(process.execPath, [cli, '--parse', 'XK', '--source', options.source,
    '--state-dir', options.stateDir, '--estimate', '--json'], { encoding: 'utf8' });
  assert.equal(estimated.status, 0, estimated.stderr);
  const estimateReport = JSON.parse(await readFile(JSON.parse(estimated.stdout).estimate.report, 'utf8'));
  assert.equal(estimateReport.modelPattern, 'XK');
  assert.equal(estimateReport.range, null);
});
