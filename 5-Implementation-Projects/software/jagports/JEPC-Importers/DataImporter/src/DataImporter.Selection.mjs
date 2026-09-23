import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, opendir, readFile, realpath, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const XK_MODEL_IDS = Object.freeze(['3187', '3183', '3178', '3173', '7420']);
export const SELECTION_VERSION = 1;
const LIMIT = 40;
const sourcePath = (...parts) => parts.join('/');
const hashText = value => createHash('sha256').update(value).digest('hex');
const within = (root, child) => {
  const relative = path.relative(root, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

async function checkedFile(root, relative) {
  const full = await realpath(path.join(root, relative));
  if (!within(root, full)) throw new Error(`Source path escapes installation: ${relative}`);
  const details = await stat(full);
  if (!details.isFile()) throw new Error(`Expected regular source file: ${relative}`);
  return { full, details };
}

async function menu(root, relative) {
  const { full, details } = await checkedFile(root, relative);
  if (details.size > 4 * 1024 * 1024) throw new Error(`Menu exceeds 4 MiB: ${relative}`);
  const raw = await readFile(full);
  const source = raw.toString('latin1');
  if (!/^\s*<\?xml\b/i.test(source) || !/<Data>/.test(source) || !/<\/Data>/.test(source)) {
    throw new Error(`Unsupported JEPC menu wrapper: ${relative}`);
  }
  return { source, sha256: hashText(raw) };
}

function rows(source, fields, relative) {
  const result = [];
  for (const line of source.split(/\r?\n/)) {
    const value = line.trim();
    if (!value.startsWith('[')) continue;
    // JEPC menus are line-oriented bracket records, not JSON or executable JS.
    const match = fields === 3
      ? /^\[(\d+),(\d+),'(.*)'\]$/.exec(value)
      : /^\[(\d+),(\d+),'(.*)',([01])\]$/.exec(value);
    if (!match) throw new Error(`Unknown menu row in ${relative}: ${value.slice(0, 100)}`);
    result.push(match.slice(1));
  }
  return result;
}

export function matchingLeafModels(modelMenuSource, fragment) {
  const query = String(fragment ?? '').trim().toLocaleLowerCase('en');
  if (query.length < 2) throw new Error('Model name fragment must contain at least two characters.');
  const models = rows(modelMenuSource, 3, 'menus/models_l_id_0.xml')
    .map(([id, parent, label]) => ({ id, parent, label }));
  const children = new Map();
  for (const model of models) {
    const siblings = children.get(model.parent) ?? [];
    siblings.push(model.id);
    children.set(model.parent, siblings);
  }
  const matches = label => label.toLocaleLowerCase('en').includes(query);
  const selected = new Set(models.filter(model => matches(model.label)).map(model => model.id));
  const visit = id => { for (const child of children.get(id) ?? []) if (!selected.has(child)) { selected.add(child); visit(child); } };
  for (const id of [...selected]) visit(id);
  const leaves = [...new Map(models.filter(model => selected.has(model.id) && !children.has(model.id))
    .map(model => [model.id, model])).values()];
  if (!leaves.length) throw new Error(`No leaf source models match: ${fragment}`);
  return leaves;
}

async function filesInModel(root, model, language) {
  const relative = sourcePath('drilldown', `pl_id_${model}`, `L${language}`);
  const directory = await realpath(path.join(root, relative));
  if (!within(root, directory)) throw new Error(`Source directory escapes installation: ${relative}`);
  const byCategory = new Map();
  for await (const entry of await opendir(directory)) {
    if (!entry.isFile()) continue;
    const match = new RegExp(`^(cat|tl)_M${model}_C(\\d+)_L${language}\\.xml$|^Itm_M${model}_C(\\d+)_I(\\d+)_L${language}\\.xml$`).exec(entry.name);
    if (!match) continue;
    const category = match[2] ?? match[3];
    const existing = byCategory.get(category) ?? { items: [] };
    if (match[1]) existing[match[1]] = sourcePath(relative, entry.name);
    else existing.items.push({ item: match[4], path: sourcePath(relative, entry.name) });
    byCategory.set(category, existing);
  }
  return byCategory;
}

async function fingerprint(root, relative) {
  const { full, details } = await checkedFile(root, relative);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(full)) hash.update(chunk);
  const after = await stat(full);
  if (details.size !== after.size || details.mtimeMs !== after.mtimeMs) {
    throw new Error(`Source changed during selection: ${relative}`);
  }
  return { path: relative, size: after.size, sha256: hash.digest('hex') };
}

export async function selectRangeBundles(options) {
  const { range } = options;
  if (range !== 'xk') throw new Error('Unsupported Range for bundle selection; currently supported: xk.');
  return selectBundles(options);
}

export async function selectModelFamilyBundles({ modelFragment, source, stateDir, language = '0', onProgress }) {
  if (typeof modelFragment !== 'string' || modelFragment.trim().length < 2) {
    throw new Error('Model name fragment must contain at least two characters.');
  }
  const normalized = modelFragment.trim().toLocaleUpperCase('en');
  return selectBundles({ modelFragment: normalized, source, stateDir, language, seed: normalized.toLocaleLowerCase('en'),
    all: true, onProgress });
}

async function selectBundles({ range, modelFragment, all = false, source, stateDir, seed, language = '0', onProgress }) {
  if (!source || !stateDir || typeof seed !== 'string' || !seed || seed.length > 256) {
    throw new Error('Require --source, --state-dir and a nonempty --seed (up to 256 characters).');
  }
  if (!/^\d{1,2}$/.test(String(language))) throw new Error('Language must be a numeric ID.');
  const root = await realpath(path.resolve(source));
  const state = path.resolve(stateDir);
  let existingAncestor = state;
  while (true) {
    try { existingAncestor = await realpath(existingAncestor); break; }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(existingAncestor);
      if (parent === existingAncestor) throw error;
      existingAncestor = parent;
    }
  }
  if (within(root, state) || within(root, existingAncestor)) throw new Error('State directory must be outside the source installation.');

  const modelsFile = 'menus/models_l_id_0.xml';
  const modelsMenu = await menu(root, modelsFile);
  const models = new Map(rows(modelsMenu.source, 3, modelsFile).map(([id, parent, label]) => [id, { parent, label }]));
  const modelIds = modelFragment ? matchingLeafModels(modelsMenu.source, modelFragment).map(model => model.id) : XK_MODEL_IDS;
  const population = [];
  const incompleteCategories = [];
  const menuChecksums = [{ path: modelsFile, sha256: modelsMenu.sha256 }];
  for (const model of modelIds) {
    if (!models.has(model)) throw new Error(`Selected model ${model} absent from model menu.`);
    const relative = sourcePath('menus', `L${language}`, `pl_id_${model}_l_id_${language}.xml`);
    const categoryMenu = await menu(root, relative);
    menuChecksums.push({ path: relative, sha256: categoryMenu.sha256 });
    const files = await filesInModel(root, model, language);
    for (const [category, parent, label, leaf] of rows(categoryMenu.source, 4, relative)) {
      if (leaf !== '1') continue;
      const bundle = files.get(category);
      if (!bundle?.cat || !bundle?.tl || !bundle.items.length) {
        incompleteCategories.push({ model, category, missing: [
          !bundle?.cat && 'category', !bundle?.tl && 'top-level', !bundle?.items.length && 'item',
        ].filter(Boolean) });
        continue;
      }
      population.push({ model, parentModel: models.get(model).parent,
        modelLabel: models.get(model).label, category, categoryParent: parent,
        categoryLabel: label, language: String(language),
        paths: [bundle.cat, bundle.tl, ...bundle.items
          .sort((a, b) => Number(a.item) - Number(b.item))
          .map(item => item.path)] });
    }
  }
  const identity = bundle => `${bundle.model}/${bundle.category}/L${bundle.language}`;
  if (new Set(population.map(identity)).size !== population.length) throw new Error('Duplicate category in source menus.');
  for (const model of modelIds) {
    if (!population.some(bundle => bundle.model === model)) throw new Error(`No complete category bundle in model ${model}.`);
  }
  const score = bundle => hashText(`${SELECTION_VERSION}\0${seed}\0${identity(bundle)}`);
  const ranked = population.sort(all
    ? (a, b) => identity(a).localeCompare(identity(b))
    : (a, b) => score(a).localeCompare(score(b)) || identity(a).localeCompare(identity(b)));
  if (!ranked.length || (!all && ranked.length < LIMIT)) {
    throw new Error(`Only ${ranked.length} complete category bundles; need ${all ? 1 : LIMIT}.`);
  }
  const chosen = all ? [...ranked] : [];
  const used = new Set();
  for (const model of all ? [] : modelIds) {
    const first = ranked.find(bundle => bundle.model === model);
    if (!first) throw new Error(`No complete category bundle in XK model ${model}.`);
    chosen.push(first); used.add(identity(first));
  }
  for (const bundle of all ? [] : ranked) {
    if (chosen.length === LIMIT) break;
    if (!used.has(identity(bundle))) { chosen.push(bundle); used.add(identity(bundle)); }
  }
  const bundles = [];
  for (const bundle of chosen) {
    bundles.push({ ...bundle, files: await Promise.all(bundle.paths.map(relative => fingerprint(root, relative))),
      selectionScore: score(bundle) });
    delete bundles.at(-1).paths;
    onProgress?.({ phase: 'selection', completed: bundles.length, total: chosen.length, model: bundle.model });
  }
  const manifest = {
    schemaVersion: SELECTION_VERSION, phase: 'SELECTION_ONLY',
    ...(range ? { range } : { modelFragment: modelFragment.trim() }),
    selection: { algorithm: all ? 'all complete categories in matched leaf models' : 'sha256(seed,source-qualified-bundle); one-per-model then lowest scores',
      seed, language: String(language), count: chosen.length, modelIds: [...modelIds],
      candidateCount: ranked.length, candidateCountsByModel: Object.fromEntries(modelIds.map(model => [model, ranked.filter(b => b.model === model).length])),
      ...(all ? { incompleteCategories } : {}), menuChecksums },
    source: root, bundles,
    note: 'No catalogue rows were parsed or published to D1.',
  };
  await mkdir(state, { recursive: true });
  const filename = path.join(state, `${all ? 'model' : 'xk'}-selection-${hashText(`${language}\0${seed}`).slice(0,20)}.json`);
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  try {
    const prior = await readFile(filename, 'utf8');
    // Preserve manifests written before Range became an explicit selection field.
    const legacy = { ...manifest };
    delete legacy.range;
    if (prior === `${JSON.stringify(legacy, null, 2)}\n`) {
      return { filename, manifest: JSON.parse(prior), reused: true };
    }
    if (prior !== serialized) throw new Error(`Existing selection differs from current source: ${filename}`);
    return { filename, manifest, reused: true };
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporary, serialized, { flag: 'wx' });
  try { await rename(temporary, filename); }
  catch (error) { throw new Error(`Could not persist selection: ${error.message}`); }
  return { filename, manifest, reused: false };
}
