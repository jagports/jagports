import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const inside = (root, child) => {
  const relative = path.relative(root, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

export function objectKey({ checksum, extension, evidence = false }) {
  if (!/^[a-f0-9]{64}$/.test(checksum)) throw new Error('Object checksum must be lowercase SHA-256 hexadecimal.');
  if (evidence) return `jepc/evidence/sha256/${checksum.slice(0, 2)}/${checksum}.xml`;
  if (!['jpg', 'png'].includes(extension)) throw new Error('Presentation extension must be jpg or png.');
  return `jepc/assets/sha256/${checksum.slice(0, 2)}/${checksum}.${extension}`;
}

const checksum = bytes => createHash('sha256').update(bytes).digest('hex');

export class FilesystemDestination {
  static async open(root) {
    const absolute = path.resolve(root);
    await mkdir(absolute, { recursive: true });
    return new FilesystemDestination(await realpath(absolute));
  }

  constructor(root) { this.root = root; }
  async health() { await stat(this.root); return { state: 'ok', kind: 'filesystem' }; }
  filename(key) {
    if (!/^jepc\/(assets|evidence)\/sha256\/[a-f0-9]{2}\/[a-f0-9]{64}\.(jpg|png|xml)$/.test(key)) throw new Error('Unsafe destination key.');
    const filename = path.resolve(this.root, key);
    if (!inside(this.root, filename)) throw new Error('Destination key escapes root.');
    return filename;
  }
  async head(key) {
    try { const bytes = await readFile(this.filename(key)); return { exists: true, size: bytes.length, checksum: checksum(bytes) }; }
    catch (error) { if (error.code === 'ENOENT') return { exists: false }; throw error; }
  }
  async putVerified({ key, bytes, expectedChecksum, expectedSize }) {
    if (checksum(bytes) !== expectedChecksum || bytes.length !== expectedSize) throw new Error('Bytes do not match expected preservation identity.');
    const existing = await this.head(key);
    if (existing.exists) {
      if (existing.checksum !== expectedChecksum || existing.size !== expectedSize) throw new Error('Existing destination object does not verify.');
      return { reused: true, ...existing };
    }
    const filename = this.filename(key); await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, bytes, { flag: 'wx' });
    const verified = await this.head(key);
    if (verified.checksum !== expectedChecksum || verified.size !== expectedSize) throw new Error('Stored destination object did not verify.');
    return { reused: false, ...verified };
  }
}

