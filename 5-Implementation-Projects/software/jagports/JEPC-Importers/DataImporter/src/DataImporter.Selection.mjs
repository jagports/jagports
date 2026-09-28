import { createHash, randomInt } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { opendir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const sourcePath = (...parts) => parts.join('/');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const CATEGORY_LIMIT = 40;
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
  return { source, sha256: hash(raw) };
}

function rows(source, fields, relative) {
  const result = [];
  for (const line of source.split(/\r?\n/)) {
    const value = line.trim();
    if (!value.startsWith('[')) continue;
    const match = fields === 3
      ? /^\[(\d+),(\d+),'(.*)'\]$/.exec(value)
      : /^\[(\d+),(\d+),'(.*)',([01])\]$/.exec(value);
    if (!match) throw new Error(`Unknown menu row in ${relative}: ${value.slice(0, 100)}`);
    result.push(match.slice(1));
  }
  return result;
}

export function matchingLeafModels(modelMenuSource, pattern) {
  const query = String(pattern ?? '').trim().toLocaleLowerCase('en');
  if (query.length < 2) throw new Error('Model name pattern must contain at least two characters.');
  const models = rows(modelMenuSource, 3, 'menus/models_l_id_0.xml')
    .map(([id, parent, label]) => ({ id, parent, label }));
  const children = new Map();
  for (const model of models) {
    const siblings = children.get(model.parent) ?? [];
    siblings.push(model.id);
    children.set(model.parent, siblings);
  }
  const selected = new Set(models.filter(model => model.label.toLocaleLowerCase('en').includes(query))
    .map(model => model.id));
  const visit = id => { for (const child of children.get(id) ?? []) if (!selected.has(child)) { selected.add(child); visit(child); } };
  for (const id of [...selected]) visit(id);
  const leaves = [...new Map(models.filter(model => selected.has(model.id) && !children.has(model.id))
    .map(model => [model.id, model])).values()];
  if (!leaves.length) throw new Error(`No leaf source models match: ${pattern}`);
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
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(full)) digest.update(chunk);
  const after = await stat(full);
  if (details.size !== after.size || details.mtimeMs !== after.mtimeMs) {
    throw new Error(`Source changed during selection: ${relative}`);
  }
  return { path: relative, size: after.size, sha256: digest.digest('hex') };
}

export async function selectModelBundles({ pattern, source, stateDir, language = '0', onProgress }) {
  if (typeof pattern !== 'string' || pattern.trim().length < 2 || !source || !stateDir) {
    throw new Error('Require a model-name pattern, source root and state directory.');
  }
  if (!/^\d{1,2}$/.test(String(language))) throw new Error('Language must be a numeric ID.');
  const modelPattern = pattern.trim().toLocaleUpperCase('en');
  const root = await realpath(path.resolve(source));
  const state = path.resolve(stateDir);
  let ancestor = state;
  while (true) {
    try { ancestor = await realpath(ancestor); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; ancestor = path.dirname(ancestor); }
  }
  if (within(root, state) || within(root, ancestor)) throw new Error('State directory must be outside source installation.');

  const modelsFile = 'menus/models_l_id_0.xml';
  const modelsMenu = await menu(root, modelsFile);
  const models = new Map(rows(modelsMenu.source, 3, modelsFile).map(([id, parent, label]) => [id, { parent, label }]));
  const ancestorsOf = id => {
    const ancestors = [], seen = new Set([id]);
    let parent = models.get(id)?.parent;
    while (models.has(parent)) {
      if (seen.has(parent)) throw new Error(`Cyclic source model hierarchy at ${id}.`);
      seen.add(parent);
      ancestors.push(parent);
      parent = models.get(parent).parent;
    }
    return ancestors;
  };
  const matched = matchingLeafModels(modelsMenu.source, modelPattern);
  const modelIds = matched.map(model => model.id);
  const menuChecksums = [{ path: modelsFile, sha256: modelsMenu.sha256 }];
  const candidates = [], incompleteCategories = [];
  for (const model of modelIds) {
    const relative = sourcePath('menus', `L${language}`, `pl_id_${model}_l_id_${language}.xml`);
    const categoryMenu = await menu(root, relative);
    menuChecksums.push({ path: relative, sha256: categoryMenu.sha256 });
    const files = await filesInModel(root, model, language);
    for (const [category, categoryParent, categoryLabel, leaf] of rows(categoryMenu.source, 4, relative)) {
      if (leaf !== '1') continue;
      const bundle = files.get(category);
      if (!bundle?.cat || !bundle?.tl || !bundle.items.length) {
        incompleteCategories.push({ model, category, missing: [
          !bundle?.cat && 'category', !bundle?.tl && 'top-level', !bundle?.items.length && 'item',
        ].filter(Boolean) });
        continue;
      }
      candidates.push({ model, ancestorModelIds: ancestorsOf(model), parentModel: models.get(model).parent,
        parentModelLabel: models.get(models.get(model).parent)?.label ?? null,
        modelLabel: models.get(model).label, category, categoryParent, categoryLabel, language: String(language),
        paths: [bundle.cat, bundle.tl, ...bundle.items.sort((a, b) => Number(a.item) - Number(b.item))
          .map(item => item.path)] });
    }
  }
  const identity = bundle => `${bundle.model}/${bundle.category}/L${bundle.language}`;
  if (new Set(candidates.map(identity)).size !== candidates.length) throw new Error('Duplicate category in source menus.');
  for (const model of modelIds) {
    if (!candidates.some(bundle => bundle.model === model)) throw new Error(`No complete category bundle in model ${model}.`);
  }
  const byModel = new Map(modelIds.map(model => [model, []]));
  for (const candidate of candidates) byModel.get(candidate.model).push(candidate);
  const activeModels = modelIds.filter(model => byModel.get(model).length);
  const sampled = [];
  while (sampled.length < CATEGORY_LIMIT && activeModels.length) {
    const modelIndex = randomInt(activeModels.length);
    const categories = byModel.get(activeModels[modelIndex]);
    sampled.push(categories.splice(randomInt(categories.length), 1)[0]);
    if (!categories.length) activeModels.splice(modelIndex, 1);
  }
  sampled.sort((a, b) => identity(a).localeCompare(identity(b)));
  const bundles = [];
  for (const candidate of sampled) {
    const { paths, ...details } = candidate;
    bundles.push({ ...details, files: await Promise.all(paths.map(relative => fingerprint(root, relative))) });
    onProgress?.({ phase: 'selection', completed: bundles.length, total: sampled.length, model: candidate.model });
  }
  return { schemaVersion: 1, modelPattern, source: root, language: String(language), modelIds,
    menuChecksums, incompleteCategories, eligibleCategories: candidates.length, categoryLimit: CATEGORY_LIMIT, bundles };
}
