import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { openLedger } from './DataImporter.Runtime.mjs';

export const PARSER_VERSION = 5;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const within = (root, child) => {
  const rel = path.relative(root, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
};

// JEPC's .xml files contain line-oriented records inside an XML-looking wrapper.
// This splitter handles quoted commas without evaluating source text as JavaScript.
function bracketFields(line) {
  if (!line.startsWith('[') || !line.endsWith(']')) return null;
  const fields = [];
  let field = '', quoted = false;
  for (let i = 1; i < line.length - 1; i++) {
    const char = line[i];
    if (char === "'") {
      if (quoted && line[i + 1] === "'") { field += "''"; i++; continue; }
      quoted = !quoted;
    }
    if (char === ',' && !quoted) { fields.push(field); field = ''; }
    else field += char;
  }
  if (quoted) return null;
  fields.push(field);
  return fields;
}

function classify(kind, text) {
  if (kind === 'attributes') {
    const match = /^(\d+),((?:\[[^\]\r\n]*\])+)$/.exec(text);
    if (!match) return null;
    const predicates = [...match[2].matchAll(/\[([^\]]*)\]/g)].map(part => ({ raw: part[0], fields: part[1].split(',') }));
    return { type: 'applicability', key: match[1], predicates };
  }
  const fields = bracketFields(text);
  if (!fields) return null;
  if (kind === 'category') {
    const context = text.slice(1, -1);
    if (context.includes('/') || /^[a-z]{2}\d+[a-z]?$/i.test(context)) {
      return { type: 'category-context', fields: [context] };
    }
    if (fields.length >= 3 && /^\d+$/.test(fields[0]) && /^[01]$/.test(fields.at(-1))) {
      return { type: 'category-entry', fields: [fields[0], fields.slice(1, -1).join(','), fields.at(-1)] };
    }
  }
  if (kind === 'top-level' && fields.length === 2 && /^\d+$/.test(fields[0])) {
    return { type: 'top-level-item', fields };
  }
  if (kind === 'item' && fields.length === 12 && /^\d+$/.test(fields[0]) && /^\d+$/.test(fields[1])) {
    return { type: 'item-tree-row', fields };
  }
  return null;
}

export function parseJepcFile(bytes, kind, sourcePath) {
  const source = bytes.toString('latin1');
  const lines = source.split(/\r\n|\n|\r/);
  const records = [], unknown = [];
  let opened = false, closed = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], text = raw.trim(), line = i + 1;
    if (!text) continue;
    if (!opened && /^<\?xml\b.*\?>$/i.test(text)) continue;
    if (!opened && text === '<Data>') { opened = true; continue; }
    if (opened && text === '</Data>') { closed = true; continue; }
    const parsed = opened && !closed ? classify(kind, text) : null;
    if (parsed) records.push({ line, raw, ...parsed });
    else unknown.push({ line, raw, reason: !opened || closed ? 'outside-data-wrapper' : 'unrecognized-record' });
  }
  if (!opened || !closed) unknown.push({ line: null, raw: '', reason: 'missing-data-wrapper' });
  return { path: sourcePath, kind, size: bytes.length, sha256: hash(bytes), rawBase64: bytes.toString('base64'),
    records, unknown };
}

async function sourceBytes(root, relative, expectedHash) {
  if (path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => part === '..' || part === '')) {
    throw new Error(`Unsafe source path: ${relative}`);
  }
  const unresolved = path.join(root, ...relative.split('/'));
  let full;
  try { full = await realpath(unresolved); }
  catch (error) { if (error.code === 'ENOENT' && expectedHash === undefined) return null; throw error; }
  if (!within(root, full)) throw new Error(`Source path escapes installation: ${relative}`);
  const before = await stat(full);
  if (!before.isFile() || before.size > 16 * 1024 * 1024) throw new Error(`Unsupported source file size/type: ${relative}`);
  const bytes = await readFile(full);
  const after = await stat(full);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes.length !== after.size) {
    throw new Error(`Source changed while reading: ${relative}`);
  }
  if (expectedHash && hash(bytes) !== expectedHash) throw new Error(`Selected source checksum changed: ${relative}`);
  return bytes;
}

function fileKind(relative) {
  const name = path.posix.basename(relative);
  if (name.endsWith('_attributes.xml')) return 'attributes';
  if (name.startsWith('cat_')) return 'category';
  if (name.startsWith('tl_')) return 'top-level';
  if (name.startsWith('Itm_')) return 'item';
  throw new Error(`Unexpected selected file family: ${relative}`);
}

function sidecarFor(relative, language) {
  const match = /^(drilldown\/pl_id_\d+)\/L\d+\/(cat|tl|Itm)_M\d+_C\d+(?:_I\d+)?_L\d+\.xml$/.exec(relative);
  if (!match || !relative.includes(`/L${language}/`)) throw new Error(`Selected file path disagrees with source selection: ${relative}`);
  return relative.replace(`/L${language}/`, '/').replace(new RegExp(`_L${language}\\.xml$`), '_attributes.xml');
}

export async function parseSelection({ selection, stateDir, onProgress }) {
  if (!selection || !stateDir) throw new Error('Require a selected source scope and state directory.');
  const { modelPattern, modelIds, bundles } = selection;
  if (selection.schemaVersion !== 1 || typeof modelPattern !== 'string' || modelPattern.trim().length < 2
      || !Array.isArray(modelIds) || !modelIds.length || new Set(modelIds).size !== modelIds.length
      || !Array.isArray(bundles) || !bundles.length
      || bundles.some(bundle => !modelIds.includes(bundle.model))) {
    throw new Error('Invalid selected source scope.');
  }
  const identities = bundles.map(bundle => `${bundle.model}/${bundle.category}/L${bundle.language}`);
  if (new Set(identities).size !== identities.length) throw new Error('Duplicate bundle identity in source selection.');
  const root = await realpath(selection.source);
  const state = path.resolve(stateDir);
  let ancestor = state;
  while (true) {
    try { ancestor = await realpath(ancestor); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; ancestor = path.dirname(ancestor); }
  }
  if (within(root, state) || within(root, ancestor)) throw new Error('State directory must be outside source installation.');
  const ledger = await openLedger(root, state);
  const runId = ledger.beginRun({ modelPattern, modelIds, parserVersion: PARSER_VERSION });
  const scope = { modelPattern, modelIds };
  const summary = { parserVersion: PARSER_VERSION, ...scope, phase: 'LOCAL_STAGING_ONLY',
    bundles: 0, reused: 0, files: 0, records: 0, unknown: 0, missingOptionalSidecars: 0, statuses: {},
    database: ledger.filename, runId };
  try {
  for (const bundle of bundles) {
    if (!/^\d+$/.test(bundle.model) || !/^\d+$/.test(bundle.category) || !/^\d{1,2}$/.test(bundle.language)
        || !Array.isArray(bundle.files) || bundle.files.length < 3) throw new Error('Invalid bundle identity or file list.');
    const names = bundle.files.map(entry => path.posix.basename(entry.path));
    if (new Set(names).size !== names.length
        || names.filter(name => name.startsWith('cat_')).length !== 1
        || names.filter(name => name.startsWith('tl_')).length !== 1
        || !names.some(name => name.startsWith('Itm_'))) {
      throw new Error(`Incomplete or duplicate selected file list: ${identities[summary.bundles]}`);
    }
    const files = [], missingSidecars = [];
    const expectedPrefix = `drilldown/pl_id_${bundle.model}/L${bundle.language}/`;
    for (const entry of bundle.files) {
      if (!entry.path.startsWith(expectedPrefix)
          || !new RegExp(`^(?:(?:cat|tl)_M${bundle.model}_C${bundle.category}|Itm_M${bundle.model}_C${bundle.category}_I\\d+)_L${bundle.language}\\.xml$`).test(path.posix.basename(entry.path))
          || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
        throw new Error(`Selected file disagrees with bundle identity: ${entry.path}`);
      }
      const bytes = await sourceBytes(root, entry.path, entry.sha256);
      files.push(parseJepcFile(bytes, fileKind(entry.path), entry.path));
      const sidecar = sidecarFor(entry.path, bundle.language);
      const sidecarBytes = await sourceBytes(root, sidecar);
      if (sidecarBytes) files.push(parseJepcFile(sidecarBytes, 'attributes', sidecar));
      else missingSidecars.push(sidecar);
    }
    const unknown = files.flatMap(file => file.unknown.map(item => ({ path: file.path, ...item })));
    const status = unknown.length ? 'UNKNOWN_STRUCTURE' : 'PARSED';
    const staged = { schemaVersion: 1, parserVersion: PARSER_VERSION, phase: 'LOCAL_STAGING_ONLY',
      identity: { model: bundle.model, category: bundle.category, language: bundle.language },
      source: { root, modelLabel: bundle.modelLabel, categoryLabel: bundle.categoryLabel,
        parentModel: bundle.parentModel, parentModelLabel: bundle.parentModelLabel,
        categoryParent: bundle.categoryParent },
      status, files, missingOptionalSidecars: missingSidecars, unknown };
    if (ledger.storeBundle(runId, staged).reused) summary.reused++;
    summary.bundles++; summary.files += files.length;
    summary.records += files.reduce((count, file) => count + file.records.length, 0);
    summary.unknown += unknown.length;
    summary.missingOptionalSidecars += missingSidecars.length;
    summary.statuses[status] = (summary.statuses[status] ?? 0) + 1;
    onProgress?.({ phase: 'parsing', completed: summary.bundles, total: bundles.length,
      model: bundle.model });
  }
  ledger.completeRun(runId, 'COMPLETED');
  return summary;
  } catch (error) {
    ledger.completeRun(runId, 'FAILED', error.message);
    throw error;
  } finally { ledger.close(); }
}
