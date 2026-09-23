import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { XK_MODEL_IDS, selectXkBundles } from '../src/DataImporter.Selection.mjs';

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
  return { source, stateDir, seed: 'reviewable-seed', put };
}

test('selects forty real bundles across five models and reuses the same manifest', async t => {
  const options = await fixture(t);
  const first = await selectXkBundles(options);
  assert.equal(first.reused, false);
  assert.equal(first.manifest.selection.candidateCount, 45);
  assert.equal(first.manifest.bundles.length, 40);
  assert.deepEqual([...new Set(first.manifest.bundles.map(b => b.model))].sort(), [...XK_MODEL_IDS].sort());
  assert.equal(first.manifest.bundles[0].files.length, 3);
  assert.equal(first.manifest.phase, 'SELECTION_ONLY');
  assert.equal((await readFile(first.filename, 'utf8')).includes('PN-'), false);
  const again = await selectXkBundles(options);
  assert.equal(again.reused, true);
  assert.deepEqual(again.manifest.bundles, first.manifest.bundles);
});

test('different seed has a separate manifest; source change blocks reuse', async t => {
  const options = await fixture(t);
  const first = await selectXkBundles(options);
  const other = await selectXkBundles({ ...options, seed: 'another-seed' });
  assert.notEqual(other.filename, first.filename);
  assert.notDeepEqual(other.manifest.bundles.map(b => `${b.model}/${b.category}`),
    first.manifest.bundles.map(b => `${b.model}/${b.category}`));
  const file = first.manifest.bundles[0].files[0].path;
  await options.put(file, '<Data>changed source</Data>');
  await assert.rejects(selectXkBundles(options), /Existing selection differs/);
});

test('missing or unknown menu structures fail rather than invent candidates', async t => {
  const options = await fixture(t);
  await options.put('menus/L0/pl_id_3187_l_id_0.xml', '<?xml version="1.0"?>\n<Data>\n[broken]\n</Data>');
  await assert.rejects(selectXkBundles(options), /Unknown menu row/);
  await assert.rejects(selectXkBundles({ ...options, stateDir: path.join(options.source, 'state') }), /outside/);
});

test('a missing dependency excludes that category from the candidate population', async t => {
  const options = await fixture(t);
  await rm(path.join(options.source, 'drilldown/pl_id_3187/L0/tl_M3187_C318701_L0.xml'));
  const result = await selectXkBundles(options);
  assert.equal(result.manifest.selection.candidateCount, 44);
  assert.equal(result.manifest.bundles.some(bundle => bundle.model === '3187' && bundle.category === '318701'), false);
});
