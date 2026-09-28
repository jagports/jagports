import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { estimateRange, modelsForRange } from '../src/DataImporter.Estimate.mjs';

async function fixture(t) {
  const parent = await mkdtemp(path.join(tmpdir(), 'jepc-estimate-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const source = path.join(parent, 'source'), stateDir = path.join(parent, 'state');
  const files = {
    'menus/models_l_id_0.xml': '<Data>\n[3187,3175,\'XK8\']\n</Data>',
    'menus/L0/pl_id_3187_l_id_0.xml': '<Data>\n[1,2,\'Category\',1]\n</Data>',
    'drilldown/pl_id_3187/L0/cat_M3187_C1_L0.xml': '<Data>\n[1,\'Entry\',1]\n</Data>',
    'drilldown/pl_id_3187/L0/Itm_M3187_C1_I1_L0.xml': '<Data>\n[1,2,3]\n</Data>',
    'drilldown/pl_id_3187/Itm_M3187_C1_I1_attributes.xml': '<Data>\n1,[A,B]\n</Data>',
  };
  for (const [name, content] of Object.entries(files)) {
    const filename = path.join(source, name);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, content);
  }
  return { source, stateDir, files, range: 'xk', models: ['3187'], seed: 'same-seed', sampleSize: 3 };
}

test('Range inventory is read-only, bounded to selected models and reproducibly sampled', async t => {
  const options = await fixture(t);
  const first = await estimateRange(options);
  assert.equal(first.result.state, 'COMPLETED');
  assert.equal(first.result.inventory.files, 5);
  assert.equal(first.result.inventory.bytes, Object.values(options.files).reduce((n, value) => n + Buffer.byteLength(value), 0));
  assert.equal(first.result.sample.files.length, 3);
  assert.equal(first.result.sample.readBytes, first.result.sample.files.reduce((n, file) => n + file.size, 0));
  assert.ok(first.result.sample.recordLikeLines > 0);
  assert.equal(first.result.projection.d1Bytes, null);
  const second = await estimateRange(options);
  assert.deepEqual(second.result.sample.files, first.result.sample.files);
  assert.equal(await readFile(path.join(options.source, 'menus/models_l_id_0.xml'), 'utf8'), options.files['menus/models_l_id_0.xml']);
});

test('missing model directory and interrupted inventory never produce a complete projection', async t => {
  const options = await fixture(t);
  const missing = await estimateRange({ ...options, models: ['999'] });
  assert.equal(missing.result.state, 'INCOMPLETE');
  assert.equal(missing.result.inventory.errorCount, 1);
  let stop = false;
  const interrupted = await estimateRange(options, { onProgress: () => { stop = true; }, shouldStop: () => stop });
  assert.equal(interrupted.result.state, 'STOPPED_BY_USER');
  assert.equal(interrupted.result.projection.d1Bytes, null);
});

test('D1/time projection requires a measured calibration and keeps its basis explicit', async t => {
  const options = await fixture(t);
  const calibrationPath = path.join(path.dirname(options.source), 'calibration.json');
  await writeFile(calibrationPath, JSON.stringify({ range: 'xk', sourceBytes: 100, d1BytesAdded: 50, importSeconds: 20 }));
  const { result } = await estimateRange({ ...options, calibrationPath });
  assert.equal(result.projection.d1Bytes, Math.round(result.sample.eligibleBytes / 2));
  assert.equal(result.projection.importSeconds, Math.round(result.sample.eligibleBytes / 5));
  assert.match(result.projection.basis, /Linear projection/);
});

test('model-pattern estimate measures source scope without inventing a destination Range', async t => {
  const options = await fixture(t);
  const { result } = await estimateRange({ ...options, range: undefined, modelPattern: 'XK' });
  assert.equal(result.modelPattern, 'XK');
  assert.equal(result.range, null);
  assert.equal(result.inventory.files, 5);
  assert.equal(result.projection.d1Bytes, null);
  assert.match(result.projection.basis, /destination Ranges are resolved/);
  await assert.rejects(estimateRange({ ...options, range: undefined, modelPattern: 'XK',
    calibrationPath: path.join(options.stateDir, 'calibration.json') }), /resolved destination Range/);
});

test('CLI accepts explicit model scope and rejects invalid invocations', async t => {
  const options = await fixture(t);
  assert.deepEqual(modelsForRange('xk', '3187,3183'), ['3187', '3183']);
  assert.throws(() => modelsForRange('xk'), /explicit/);
  assert.throws(() => modelsForRange('xe'), /explicit/);
  const cli = path.resolve('src/DataImporter.CLI.mjs');
  const call = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  const args = ['estimate-range', '--source', options.source, '--state-dir', options.stateDir,
    '--range', 'xk', '--models', '3187', '--sample-size', '2', '--json'];
  const run = call(args);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).inventory.files, 5);
  assert.equal(call([...args, '--sample-size', '0']).status, 1);
  assert.equal(call(['estimate-range', '--state-dir', options.stateDir, '--range', 'xe']).status, 1);
});
