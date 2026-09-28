import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import {
  candidatePaths, inspectImage, inspectMedia, parseHotspots, preserveMedia, readState, run,
} from '../src/MediaImporter.Runtime.mjs';
import { FilesystemDestination, objectKey } from '../src/MediaImporter.Destination.mjs';

const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]), Buffer.from('IHDR'), Buffer.from([0, 0, 0, 40, 0, 0, 0, 30])]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0, 11, 8, 0, 20, 0, 30, 3, 1, 17, 0, 2, 17, 1, 3, 17, 1, 0xff, 0xd9]);
const hotspot = `<image><originalwidth>1544</originalwidth><originalheight>1965</originalheight><hotspots>
<item><itemno>1</itemno><x>2187</x><y>1893</y><width>360</width><height>241</height></item>
<item><itemno>4</itemno><x>4641</x><y>7611</y><width>360</width><height>241</height></item>
<item><itemno>4</itemno><x>6596</x><y>5162</y><width>360</width><height>241</height></item>
</hotspots></image>`;

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'jepc-media-importer-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), stateDir = path.join(root, 'state');
  for (const [relative, contents] of [
    ['flash/images/tu6333.jpg', jpeg], ['illustrations/png/tu6333.png', png], ['flash/xml/tu6333.xml', hotspot],
  ]) {
    const target = path.join(source, relative); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, contents);
  }
  return { root, source, stateDir };
}

test('candidate paths and parsers are bounded and retain raw hotspot rectangles', () => {
  assert.deepEqual(candidatePaths('tu6333').map(value => value.relative), ['flash/images/tu6333.jpg', 'illustrations/png/tu6333.png', 'flash/xml/tu6333.xml']);
  assert.throws(() => candidatePaths('../all'), /Media ID/);
  assert.deepEqual(inspectImage(png), { mediaType: 'image/png', extension: 'png', width: 40, height: 30, validation: 'HEADER_VALIDATED' });
  assert.deepEqual(inspectImage(jpeg), { mediaType: 'image/jpeg', extension: 'jpg', width: 30, height: 20, validation: 'HEADER_VALIDATED' });
  assert.throws(() => inspectImage(Buffer.from('not an image')), /Unsupported/);
  const parsed = parseHotspots(hotspot);
  assert.equal(parsed.originalWidth, '1544'); assert.equal(parsed.rectangles.length, 3);
  assert.equal(parsed.rectangles.filter(rectangle => rectangle.itemNumber === '4').length, 2);
  assert.throws(() => parseHotspots('<image></image>'), /originalwidth/);
});

test('filesystem destination preserves verified content-addressed bytes once', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'jepc-media-destination-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const destination = await FilesystemDestination.open(root), bytes = Buffer.from('evidence');
  const hash = (await import('node:crypto')).createHash('sha256').update(bytes).digest('hex');
  const key = objectKey({ checksum: hash, evidence: true });
  assert.equal((await destination.health()).state, 'ok');
  assert.equal((await destination.putVerified({ key, bytes, expectedChecksum: hash, expectedSize: bytes.length })).reused, false);
  assert.equal((await destination.putVerified({ key, bytes, expectedChecksum: hash, expectedSize: bytes.length })).reused, true);
  await assert.rejects(destination.putVerified({ key, bytes, expectedChecksum: '0'.repeat(64), expectedSize: bytes.length }), /identity/);
  assert.throws(() => objectKey({ checksum: hash, extension: 'gif' }), /extension/);
});

test('preserve creates physical image and private XML objects and reuses them', async t => {
  const options = await fixture(t), destinationDir = path.join(options.root, 'objects');
  const first = await preserveMedia({ ...options, mediaId: 'tu6333', destinationDir });
  assert.equal(first.preserved, 3); assert.equal(first.reused, 0);
  const second = await preserveMedia({ ...options, mediaId: 'tu6333', destinationDir });
  assert.equal(second.reused, 3);
  const files = await readFile(path.join(destinationDir, 'jepc/evidence/sha256', (await import('node:crypto')).createHash('sha256').update(hotspot).digest('hex').slice(0, 2), `${(await import('node:crypto')).createHash('sha256').update(hotspot).digest('hex')}.xml`));
  assert.equal(files.toString(), hotspot);
});

test('direct media inspection is replay-safe and preserves images and raw XML', async t => {
  const options = await fixture(t);
  const original = await readFile(path.join(options.source, 'flash/images/tu6333.jpg'));
  const result = await inspectMedia({ ...options, mediaId: 'tu6333' });
  assert.equal(result.run.state, 'COMPLETED');
  assert.equal(result.work.PROCESSED, 1);
  assert.deepEqual(await readFile(path.join(options.source, 'flash/images/tu6333.jpg')), original);
  const db = new DatabaseSync(path.join(options.stateDir, 'media-ledger.sqlite'));
  const candidates = db.prepare('SELECT role,media_type,width,height,state FROM candidates ORDER BY role').all().map(row => ({ ...row }));
  assert.deepEqual(candidates, [
    { role: 'hotspot_xml', media_type: null, width: null, height: null, state: 'FOUND' },
    { role: 'source_jpeg', media_type: 'image/jpeg', width: 30, height: 20, state: 'FOUND' },
    { role: 'source_png', media_type: 'image/png', width: 40, height: 30, state: 'FOUND' },
  ]);
  assert.equal(db.prepare("SELECT conversion_state FROM media_work").get().conversion_state, 'BLOCKED_UNVERIFIED');
  assert.equal(db.prepare('SELECT count(*) n FROM hotspot_rectangles WHERE item_number=?').get('4').n, 2);
  assert.equal(db.prepare('SELECT original_width,original_height,state FROM hotspot_sources').get().original_width, '1544');
  assert.match(db.prepare('SELECT raw_xml FROM hotspot_sources').get().raw_xml, /<itemno>4<\/itemno>/);
  db.close();
  const rerun = await inspectMedia({ source: options.source, stateDir: options.stateDir, mediaId: 'tu6333' });
  assert.equal(rerun.run.state, 'COMPLETED');
  assert.equal(rerun.run.unchanged, 3);
});

test('missing and corrupt candidates are explicit and source root/state safety is enforced', async t => {
  const options = await fixture(t);
  await rm(path.join(options.source, 'illustrations/png/tu6333.png'));
  await writeFile(path.join(options.source, 'flash/images/tu6333.jpg'), Buffer.from('broken'));
  const result = await inspectMedia({ source: options.source, stateDir: options.stateDir, mediaId: 'tu6333' });
  assert.equal(result.work.NEEDS_REPROCESS, 1);
  const report = readState(options.stateDir, { report: true });
  assert.equal(report.run.missing, 1); assert.equal(report.run.corrupt, 1);
  await assert.rejects(inspectMedia({ source: options.source, stateDir: path.join(options.source, 'state'), mediaId: 'tu6333' }), /outside/);
});

test('safe-stop retains committed work and dead owners are recovered', async t => {
  const options = await fixture(t);
  await inspectMedia({ ...options, mediaId: 'tu6333' });
  const db0 = new DatabaseSync(path.join(options.stateDir, 'media-ledger.sqlite'));
  db0.prepare("UPDATE media_work SET state='DISCOVERED'").run(); db0.close();
  let stop = false;
  const result = await run(options, { onProgress: () => { stop = true; }, shouldStop: () => stop });
  assert.equal(result.run.state, 'STOPPED_BY_USER');
  const filename = path.join(options.stateDir, 'media-ledger.sqlite');
  let db = new DatabaseSync(filename);
  db.prepare("UPDATE runs SET state='RUNNING',pid=? WHERE id=(SELECT id FROM runs ORDER BY rowid DESC LIMIT 1)").run(process.pid); db.close();
  await assert.rejects(run(options), /Another MediaImporter/);
  const child = spawnSync(process.execPath, ['-e', '']); assert.equal(child.status, 0);
  db = new DatabaseSync(filename); db.prepare("UPDATE runs SET pid=? WHERE state='RUNNING'").run(child.pid); db.close();
  await inspectMedia({ source: options.source, stateDir: options.stateDir, mediaId: 'tu6333' });
  db = new DatabaseSync(filename);
  assert.equal(db.prepare("SELECT count(*) n FROM runs WHERE state='CRASH_RECOVERED'").get().n, 1);
  db.close();
  assert.equal(readState(options.stateDir, { doctor: true, full: true }).result, 'ok');
});

test('CLI supports bounded inspect and rejects incomplete commands', async t => {
  const options = await fixture(t);
  const cli = path.resolve('src/MediaImporter.CLI.mjs');
  const call = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  assert.match(call(['--help']).stdout, /bounded local preservation/);
  assert.equal(call(['inspect', '--state-dir', options.stateDir]).status, 1);
  const result = call(['inspect', '--source', options.source, '--state-dir', options.stateDir, '--media-id', 'tu6333', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).run.state, 'COMPLETED');
  assert.equal(call(['unknown-command', '--state-dir', options.stateDir]).status, 1);
});

