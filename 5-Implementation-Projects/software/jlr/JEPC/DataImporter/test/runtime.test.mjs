import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { bundlePaths, inspect, readState } from '../src/runtime.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'jepc-runtime-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const options = { source: path.join(root, 'source'), stateDir: path.join(root, 'state'),
    model: '3187', category: '11096', item: '1', language: '0' };
  for (const file of bundlePaths(options)) {
    const target = path.join(options.source, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.startsWith('menus/models')
      ? "<Data>\n[3175,10001,'Jaguar XK8 Coupe/Convertible']\n[3187,3175,'XK8 Coupe/Convertible up to (V) 042775']\n</Data>" : '<Data>fixture</Data>');
  }
  return options;
}

test('bounded inspection persists checksums, rechecks changes and never edits source', async t => {
  const options = await fixture(t);
  const target = path.join(options.source, bundlePaths(options)[5]);
  const original = await readFile(target);
  let result = await inspect(options);
  assert.equal(result.run.checked, 8); assert.equal(result.run.state, 'COMPLETED');
  assert.equal(result.importImplemented, false);
  assert.equal((await inspect(options)).run.unchanged, 8);
  assert.deepEqual(await readFile(target), original);
  await writeFile(target, '<Data>changed</Data>');
  result = await inspect(options);
  assert.equal(result.run.unchanged, 7);
  await rm(target);
  result = await inspect(options);
  assert.equal(result.run.missing, 1);
  assert.equal(readState(options.stateDir, { report: true }).events.length, 10);
  assert.equal(readState(options.stateDir, { doctor: true, full: true }).result, 'ok');
});

test('safe stop commits current checkpoint and repeated invocation finishes', async t => {
  const options = await fixture(t);
  let stop = false;
  const result = await inspect(options, { shouldStop: () => stop,
    onProgress: value => { if (value.run.checked === 2) stop = true; } });
  assert.equal(result.run.state, 'STOPPED_BY_USER'); assert.equal(result.run.checked, 2);
  const resumed = await inspect(options);
  assert.equal(resumed.run.checked, 8); assert.equal(resumed.run.unchanged, 2);
});

test('single writer rejects another run; dead owner recovers after integrity check', async t => {
  const options = await fixture(t);
  await inspect(options);
  const filename = path.join(options.stateDir, 'ledger.sqlite');
  let db = new DatabaseSync(filename);
  db.prepare("UPDATE runs SET state='RUNNING',pid=?").run(process.pid); db.close();
  await assert.rejects(inspect(options), /Another importer/);
  // Use a real exited child PID, rather than assuming an arbitrary PID is dead.
  const child = spawnSync(process.execPath, ['-e', '']);
  assert.equal(child.status, 0);
  db = new DatabaseSync(filename);
  db.prepare('UPDATE runs SET pid=?').run(child.pid); db.close();
  await inspect(options);
  db = new DatabaseSync(filename);
  assert.equal(db.prepare("SELECT count(*) n FROM runs WHERE state='CRASH_RECOVERED'").get().n, 1);
  db.close();
});

test('invalid IDs, unknown model and state under source fail before writing', async t => {
  const options = await fixture(t);
  await assert.rejects(inspect({ ...options, item: '../1' }), /numeric IDs/);
  await assert.rejects(inspect({ ...options, model: '999' }), /not found/);
  await assert.rejects(inspect({ ...options, stateDir: path.join(options.source, 'state') }), /outside/);
});

test('file errors persist a failed run and future schema is rejected', async t => {
  const options = await fixture(t);
  const target = path.join(options.source, bundlePaths(options)[5]);
  await rm(target); await mkdir(target);
  await assert.rejects(inspect(options), /regular source file/);
  assert.equal(readState(options.stateDir).run.state, 'FAILED');
  const db = new DatabaseSync(path.join(options.stateDir, 'ledger.sqlite'));
  db.exec('PRAGMA user_version=99'); db.close();
  await assert.rejects(inspect(options), /Unsupported ledger version/);
});

test('CLI help, machine result, missing-file exit and invalid arguments', async t => {
  const options = await fixture(t);
  const cli = path.resolve('src/cli.mjs');
  const call = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  assert.match(call(['--help']).stdout, /source inspection skeleton/);
  assert.equal(call(['run']).status, 1);
  const args = ['inspect', '--source', options.source, '--state-dir', options.stateDir,
    '--model', '3187', '--category', '11096', '--item', '1', '--json'];
  const success = call(args);
  assert.equal(success.status, 0, success.stderr);
  assert.equal(JSON.parse(success.stdout).run.checked, 8);
  await rm(path.join(options.source, bundlePaths(options)[7]));
  assert.equal(call(args).status, 2);
  assert.equal(call(['status', '--state-dir', options.stateDir, '--full']).status, 1);
});
