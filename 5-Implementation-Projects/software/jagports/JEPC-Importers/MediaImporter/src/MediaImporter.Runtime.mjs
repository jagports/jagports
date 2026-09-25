import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, realpath, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { FilesystemDestination, objectKey } from './MediaImporter.Destination.mjs';

export const CONTRACT_VERSION = 1;
const IMAGE_LIMIT = 64 * 1024 * 1024;

const inside = (root, child) => {
  const relative = path.relative(root, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

async function canonicalFuture(location) {
  try { return await realpath(location); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(location);
    if (parent === location) throw error;
    return path.join(await canonicalFuture(parent), path.basename(location));
  }
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

function sha(value) { return createHash('sha256').update(value).digest('hex'); }

export function logicalMediaKey(sourceNamespace, sourceRelease, mediaId) {
  return `jepc-logical-media-v1:${sha(canonical({ version: 1, sourceNamespace, sourceRelease, mediaId }))}`;
}

export function candidatePaths(mediaId) {
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(String(mediaId))) throw new Error('Media ID must contain only letters, digits, dot, underscore or hyphen.');
  return [
    { role: 'source_jpeg', relative: `flash/images/${mediaId}.jpg` },
    { role: 'source_png', relative: `illustrations/png/${mediaId}.png` },
    { role: 'hotspot_xml', relative: `flash/xml/${mediaId}.xml` },
  ];
}

async function sourcePath(root, relative) {
  const filename = await realpath(path.join(root, relative));
  if (!inside(root, filename)) throw new Error('Source reference escapes the selected source root.');
  return filename;
}

async function hashFile(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

function be32(bytes, offset) { return bytes.readUInt32BE(offset); }

export function inspectImage(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && bytes.subarray(12, 16).toString('ascii') === 'IHDR' && be32(bytes, 8) === 13) {
    const width = be32(bytes, 16), height = be32(bytes, 20);
    if (!width || !height) throw new Error('PNG dimensions must be positive.');
    return { mediaType: 'image/png', extension: 'png', width, height, validation: 'HEADER_VALIDATED' };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker >= 0xd0 && marker <= 0xd7) continue;
      if (offset + 2 > bytes.length) break;
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) break;
      const sof = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)
        || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
      if (sof && length >= 8) {
        const height = bytes.readUInt16BE(offset + 3), width = bytes.readUInt16BE(offset + 5);
        if (!width || !height) throw new Error('JPEG dimensions must be positive.');
        return { mediaType: 'image/jpeg', extension: 'jpg', width, height, validation: 'HEADER_VALIDATED' };
      }
      offset += length;
    }
    throw new Error('JPEG does not contain a supported frame header.');
  }
  throw new Error('Unsupported image format.');
}

export function parseHotspots(xml) {
  if (!/^\s*<image(?:\s[^>]*)?>[\s\S]*<\/image>\s*$/.test(xml)) throw new Error('Hotspot XML must contain one image element.');
  const value = tag => {
    const match = xml.match(new RegExp(`<${tag}>\\s*([^<]+?)\\s*</${tag}>`, 'i'));
    if (!match) throw new Error(`Hotspot XML is missing ${tag}.`);
    if (!/^-?\d+(?:\.\d+)?$/.test(match[1].trim())) throw new Error(`Hotspot XML has non-numeric ${tag}.`);
    return match[1].trim();
  };
  const originalWidth = value('originalwidth');
  const originalHeight = value('originalheight');
  const hotspotBlock = xml.match(/<hotspots(?:\s[^>]*)?>([\s\S]*?)<\/hotspots>/i);
  if (!hotspotBlock) throw new Error('Hotspot XML is missing hotspots.');
  const rectangles = [];
  for (const match of hotspotBlock[1].matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const item = tag => {
      const found = match[1].match(new RegExp(`<${tag}>\\s*([^<]+?)\\s*</${tag}>`, 'i'));
      if (!found || !/^-?\d+(?:\.\d+)?$/.test(found[1].trim())) throw new Error(`Hotspot item is missing numeric ${tag}.`);
      return found[1].trim();
    };
    rectangles.push({ itemNumber: item('itemno'), x: item('x'), y: item('y'), width: item('width'), height: item('height') });
  }
  return { originalWidth, originalHeight, rectangles };
}

function health(db, full = false) {
  const check = full ? 'integrity_check' : 'quick_check';
  const rows = db.prepare(`PRAGMA ${check}`).all();
  if (rows.length !== 1 || Object.values(rows[0])[0] !== 'ok') throw new Error(`${check} failed.`);
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('foreign_key_check failed.');
  return { check, result: 'ok', foreignKeys: 'ok' };
}

function schema(db) {
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version !== 0 && version !== CONTRACT_VERSION) throw new Error(`Unsupported ledger version ${version}.`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY, pid INTEGER NOT NULL, state TEXT NOT NULL, command TEXT NOT NULL,
      source TEXT, started TEXT NOT NULL, updated TEXT NOT NULL, processed INTEGER NOT NULL DEFAULT 0,
      missing INTEGER NOT NULL DEFAULT 0, corrupt INTEGER NOT NULL DEFAULT 0, unchanged INTEGER NOT NULL DEFAULT 0, error TEXT
    );
    CREATE TABLE IF NOT EXISTS media_work (
      id TEXT PRIMARY KEY, media_id TEXT NOT NULL, source_namespace TEXT NOT NULL, source_release TEXT NOT NULL,
      state TEXT NOT NULL, conversion_state TEXT NOT NULL, source_root TEXT, last_run_id TEXT REFERENCES runs(id),
      last_error TEXT, UNIQUE(source_namespace, source_release, media_id)
    );
    CREATE TABLE IF NOT EXISTS candidates (
      work_id TEXT NOT NULL REFERENCES media_work(id), role TEXT NOT NULL, source_path TEXT NOT NULL,
      checksum TEXT, size INTEGER, media_type TEXT, width INTEGER, height INTEGER, validation TEXT,
      state TEXT NOT NULL, PRIMARY KEY(work_id, role)
    );
    CREATE TABLE IF NOT EXISTS hotspot_sources (
      work_id TEXT PRIMARY KEY REFERENCES media_work(id), source_path TEXT NOT NULL, checksum TEXT,
      raw_xml TEXT, original_width TEXT, original_height TEXT, state TEXT NOT NULL, error TEXT
    );
    CREATE TABLE IF NOT EXISTS hotspot_rectangles (
      work_id TEXT NOT NULL REFERENCES media_work(id), source_order INTEGER NOT NULL, item_number TEXT NOT NULL,
      raw_x TEXT NOT NULL, raw_y TEXT NOT NULL, raw_width TEXT NOT NULL, raw_height TEXT NOT NULL,
      PRIMARY KEY(work_id, source_order)
    );
    CREATE TABLE IF NOT EXISTS events (
      sequence INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), time TEXT NOT NULL, detail TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS preserved_objects (
      work_id TEXT NOT NULL REFERENCES media_work(id), role TEXT NOT NULL, object_key TEXT NOT NULL,
      checksum TEXT NOT NULL, size INTEGER NOT NULL, media_type TEXT NOT NULL, state TEXT NOT NULL,
      PRIMARY KEY(work_id, role)
    );
    PRAGMA user_version=1;
  `);
  if (!db.prepare('PRAGMA table_info(runs)').all().some(column => column.name === 'unchanged')) {
    db.exec('ALTER TABLE runs ADD COLUMN unchanged INTEGER NOT NULL DEFAULT 0');
  }
}

function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code !== 'ESRCH'; }
}

function event(db, runId, detail) {
  db.prepare('INSERT INTO events(run_id,time,detail) VALUES(?,?,?)').run(runId, new Date().toISOString(), JSON.stringify(detail));
}

function snapshot(db, id) {
  const run = id ? db.prepare('SELECT * FROM runs WHERE id=?').get(id) : db.prepare('SELECT * FROM runs ORDER BY rowid DESC LIMIT 1').get();
  if (!run) return { contractVersion: CONTRACT_VERSION, run: null };
  const counts = db.prepare(`SELECT state, count(*) n FROM media_work GROUP BY state`).all();
  return { contractVersion: CONTRACT_VERSION, phase: 'LOCAL_PRESERVATION', run, work: Object.fromEntries(counts.map(row => [row.state, row.n])) };
}

async function open(options, command) {
  const stateDir = await canonicalFuture(path.resolve(options.stateDir));
  const source = options.source ? await realpath(path.resolve(options.source)) : null;
  if (source && inside(source, stateDir)) throw new Error('State directory must be outside the source installation.');
  await mkdir(stateDir, { recursive: true });
  const db = new DatabaseSync(path.join(stateDir, 'media-ledger.sqlite'));
  try {
    schema(db); health(db);
    const id = randomUUID();
    transaction(db, () => {
      const stranded = db.prepare("SELECT * FROM runs WHERE state='RUNNING'").all();
      if (stranded.some(run => alive(run.pid))) throw new Error('Another MediaImporter owns this state directory.');
      if (stranded.length) health(db, true);
      db.prepare("UPDATE runs SET state='CRASH_RECOVERED',updated=? WHERE state='RUNNING'").run(new Date().toISOString());
      const now = new Date().toISOString();
      db.prepare('INSERT INTO runs(id,pid,state,command,source,started,updated) VALUES(?,?,?,?,?,?,?)')
        .run(id, process.pid, 'RUNNING', command, source, now, now);
      event(db, id, { type: 'START', command, recoveredRuns: stranded.map(row => row.id) });
    });
    return { db, id, source, stateDir };
  } catch (error) {
    db.close();
    throw error;
  }
}

function closeRun(db, id, state, error = null) {
  transaction(db, () => {
    db.prepare('UPDATE runs SET state=?,error=?,updated=? WHERE id=?').run(state, error, new Date().toISOString(), id);
    event(db, id, { type: state, error });
  });
}

async function inspectWork(db, runId, source, work, onProgress) {
  let missing = 0, corrupt = 0, unchanged = 0;
  for (const candidate of candidatePaths(work.media_id)) {
    let state = 'FOUND', checksum = null, size = null, mediaType = null, width = null, height = null, validation = null;
    try {
      const filename = await sourcePath(source, candidate.relative);
      const before = await stat(filename);
      if (!before.isFile()) throw new Error('Expected a regular source file.');
      if (before.size > IMAGE_LIMIT) throw new Error('Source media exceeds the configured 64 MiB inspection limit.');
      checksum = await hashFile(filename); size = before.size;
      const bytes = await readFile(filename);
      const after = await stat(filename);
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('Source changed during inspection; retry on a stable source.');
      if (candidate.role === 'hotspot_xml') {
        const parsed = parseHotspots(bytes.toString('utf8'));
        transaction(db, () => {
          db.prepare(`INSERT INTO hotspot_sources(work_id,source_path,checksum,raw_xml,original_width,original_height,state,error) VALUES(?,?,?,?,?,?,?,NULL)
            ON CONFLICT(work_id) DO UPDATE SET source_path=excluded.source_path,checksum=excluded.checksum,raw_xml=excluded.raw_xml,original_width=excluded.original_width,original_height=excluded.original_height,state=excluded.state,error=NULL`)
            .run(work.id, candidate.relative, checksum, bytes.toString('utf8'), parsed.originalWidth, parsed.originalHeight, 'PARSED');
          db.prepare('DELETE FROM hotspot_rectangles WHERE work_id=?').run(work.id);
          const insert = db.prepare('INSERT INTO hotspot_rectangles VALUES(?,?,?,?,?,?,?)');
          parsed.rectangles.forEach((rectangle, index) => insert.run(work.id, index, rectangle.itemNumber, rectangle.x, rectangle.y, rectangle.width, rectangle.height));
        });
      } else {
        const image = inspectImage(bytes); mediaType = image.mediaType; width = image.width; height = image.height; validation = image.validation;
      }
    } catch (error) {
      if (error.code === 'ENOENT') { state = 'MISSING'; missing += 1; }
      else { state = 'CORRUPT'; corrupt += 1; }
      if (candidate.role === 'hotspot_xml') transaction(db, () => db.prepare(`INSERT INTO hotspot_sources(work_id,source_path,state,error) VALUES(?,?,?,?)
        ON CONFLICT(work_id) DO UPDATE SET source_path=excluded.source_path,state=excluded.state,error=excluded.error`).run(work.id, candidate.relative, state, error.message));
    }
    transaction(db, () => {
      const previous = db.prepare('SELECT checksum,state FROM candidates WHERE work_id=? AND role=?').get(work.id, candidate.role);
      if (state === 'FOUND' && previous?.state === 'FOUND' && previous.checksum === checksum) unchanged += 1;
      db.prepare(`INSERT INTO candidates VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(work_id,role) DO UPDATE SET
        source_path=excluded.source_path,checksum=excluded.checksum,size=excluded.size,media_type=excluded.media_type,width=excluded.width,height=excluded.height,validation=excluded.validation,state=excluded.state`)
        .run(work.id, candidate.role, candidate.relative, checksum, size, mediaType, width, height, validation, state);
      event(db, runId, { type: 'CANDIDATE', workId: work.id, role: candidate.role, path: candidate.relative, state, checksum, size, mediaType, width, height });
    });
  }
  transaction(db, () => {
    db.prepare('UPDATE media_work SET state=?,conversion_state=?,source_root=?,last_run_id=?,last_error=NULL WHERE id=?')
      .run(missing === 3 ? 'MISSING_OR_WITHDRAWN' : corrupt ? 'NEEDS_REPROCESS' : 'PROCESSED', 'BLOCKED_UNVERIFIED', source, runId, work.id);
    db.prepare('UPDATE runs SET processed=processed+1,missing=missing+?,corrupt=corrupt+?,unchanged=unchanged+?,updated=? WHERE id=?')
      .run(missing, corrupt, unchanged, new Date().toISOString(), runId);
    event(db, runId, { type: 'WORK_COMPLETED', workId: work.id, missing, corrupt, unchanged, conversionState: 'BLOCKED_UNVERIFIED' });
  });
  onProgress(snapshot(db, runId));
}

export async function inspectMedia(options, { onProgress = () => {}, shouldStop = () => false } = {}) {
  candidatePaths(options.mediaId);
  const sourceNamespace = options.sourceNamespace ?? 'JEPC';
  const sourceRelease = options.sourceRelease ?? 'unknown';
  const { db, id, source, stateDir } = await open(options, 'INSPECT');
  try {
    const workId = logicalMediaKey(sourceNamespace, sourceRelease, options.mediaId);
    transaction(db, () => {
      db.prepare(`INSERT INTO media_work(id,media_id,source_namespace,source_release,state,conversion_state) VALUES(?,?,?,?,?,?)
        ON CONFLICT(source_namespace,source_release,media_id) DO NOTHING`).run(workId, options.mediaId, sourceNamespace, sourceRelease, 'DISCOVERED', 'BLOCKED_UNVERIFIED');
    });
    const work = db.prepare('SELECT * FROM media_work WHERE id=?').get(workId);
    if (shouldStop()) { closeRun(db, id, 'STOPPED_BY_USER'); return { ...snapshot(db, id), stateDir }; }
    await inspectWork(db, id, source, work, onProgress);
    closeRun(db, id, shouldStop() ? 'STOPPED_BY_USER' : 'COMPLETED');
    return { ...snapshot(db, id), stateDir };
  } catch (error) { closeRun(db, id, 'FAILED', error.message); throw error; }
  finally { db.close(); }
}

export async function run(options, controls = {}) {
  const { db, id, source, stateDir } = await open(options, 'RUN');
  const { onProgress = () => {}, shouldStop = () => false } = controls;
  try {
    const works = db.prepare("SELECT * FROM media_work WHERE state IN ('DISCOVERED','NEEDS_REPROCESS') ORDER BY media_id LIMIT 1").all();
    for (const work of works) {
      if (shouldStop()) break;
      transaction(db, () => db.prepare('UPDATE media_work SET state=?,last_run_id=? WHERE id=?').run('PROCESSING', id, work.id));
      await inspectWork(db, id, source, work, onProgress);
    }
    closeRun(db, id, shouldStop() ? 'STOPPED_BY_USER' : 'COMPLETED');
    return { ...snapshot(db, id), stateDir };
  } catch (error) { closeRun(db, id, 'FAILED', error.message); throw error; }
  finally { db.close(); }
}

export async function preserveMedia(options) {
  await inspectMedia(options);
  const { db, id, source, stateDir } = await open(options, 'PRESERVE');
  try {
    const destination = await FilesystemDestination.open(options.destinationDir);
    if (source && inside(source, destination.root)) throw new Error('Destination directory must be outside the source installation.');
    await destination.health();
    const work = db.prepare('SELECT * FROM media_work WHERE media_id=? ORDER BY rowid DESC LIMIT 1').get(options.mediaId);
    const candidates = db.prepare("SELECT * FROM candidates WHERE work_id=? AND state='FOUND' ORDER BY role").all(work.id);
    let preserved = 0, reused = 0;
    for (const candidate of candidates) {
      const evidence = candidate.role === 'hotspot_xml';
      const bytes = await readFile(await sourcePath(source, candidate.source_path));
      if (sha(bytes) !== candidate.checksum || bytes.length !== candidate.size) throw new Error(`Source changed before preservation: ${candidate.source_path}`);
      const extension = evidence ? 'xml' : candidate.media_type === 'image/jpeg' ? 'jpg' : 'png';
      const key = objectKey({ checksum: candidate.checksum, extension, evidence });
      const result = await destination.putVerified({ key, bytes, expectedChecksum: candidate.checksum, expectedSize: candidate.size });
      transaction(db, () => {
        db.prepare(`INSERT INTO preserved_objects VALUES(?,?,?,?,?,?,?) ON CONFLICT(work_id,role) DO UPDATE SET object_key=excluded.object_key,checksum=excluded.checksum,size=excluded.size,media_type=excluded.media_type,state=excluded.state`)
          .run(work.id, candidate.role, key, candidate.checksum, candidate.size, candidate.media_type ?? 'application/xml', result.reused ? 'REUSED' : 'PRESERVED');
        event(db, id, { type: 'OBJECT_PRESERVED', workId: work.id, role: candidate.role, key, reused: result.reused });
      });
      preserved += 1; if (result.reused) reused += 1;
    }
    closeRun(db, id, 'COMPLETED');
    return { ...snapshot(db, id), preserved, reused, destination: destination.root, stateDir };
  } catch (error) { closeRun(db, id, 'FAILED', error.message); throw error; }
  finally { db.close(); }
}

export function readState(stateDir, { doctor = false, full = false, report = false } = {}) {
  const db = new DatabaseSync(path.join(path.resolve(stateDir), 'media-ledger.sqlite'));
  try {
    schema(db);
    const result = snapshot(db);
    if (doctor) return { ...result, ...health(db, full) };
    if (report && result.run) return { ...result, events: db.prepare('SELECT * FROM events WHERE run_id=? ORDER BY sequence').all(result.run.id).map(row => ({ ...row, detail: JSON.parse(row.detail) })) };
    return result;
  } finally { db.close(); }
}

