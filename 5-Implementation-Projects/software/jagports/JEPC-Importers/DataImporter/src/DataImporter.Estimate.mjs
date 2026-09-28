import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, opendir, readFile, realpath, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createInterface } from 'node:readline';

const within = (root, child) => {
  const relative = path.relative(root, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
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

function score(seed, relative) {
  return createHash('sha256').update(seed).update('\0').update(relative).digest('hex');
}

function family(relative) {
  const name = path.basename(relative);
  if (name.endsWith('_attributes.xml')) return 'attributes';
  if (name.startsWith('Itm_')) return 'item';
  if (name.startsWith('cat_')) return 'category';
  if (name.startsWith('tl_')) return 'top-level';
  if (relative.startsWith('menus')) return 'menu';
  return 'other';
}

function sampleFile(sample, candidate, size) {
  const record = { path: candidate, size, score: score(sample.seed, candidate) };
  if (sample.files.length < sample.limit) sample.files.push(record);
  else {
    let worst = 0;
    for (let index = 1; index < sample.files.length; index++) {
      if (sample.files[index].score > sample.files[worst].score) worst = index;
    }
    if (record.score < sample.files[worst].score) sample.files[worst] = record;
  }
}

function validateOptions({ source, stateDir, range, modelPattern, models, seed, sampleSize }) {
  const rangeScope = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(range ?? '') && modelPattern === undefined;
  const patternScope = range === undefined && typeof modelPattern === 'string' && modelPattern.trim().length >= 2;
  if (!source || !stateDir || !(rangeScope || patternScope)) {
    throw new Error('Require --source, --state-dir and either a lowercase Range slug or a model-name pattern.');
  }
  if (!Array.isArray(models) || !models.length || models.some(id => !/^\d{1,10}$/.test(String(id))) || new Set(models).size !== models.length) {
    throw new Error('Provide unique numeric Model_IDs.');
  }
  if (typeof seed !== 'string' || !seed || seed.length > 256) throw new Error('Sample seed must contain 1–256 characters.');
  if (!Number.isSafeInteger(sampleSize) || sampleSize < 1 || sampleSize > 10000) {
    throw new Error('Sample size must be an integer from 1 to 10000.');
  }
}

export async function estimateRange({ source, stateDir, range, modelPattern, models, seed = 'range-estimate', sampleSize = 100, calibrationPath },
  { onProgress = () => {}, shouldStop = () => false } = {}) {
  validateOptions({ source, stateDir, range, modelPattern, models, seed, sampleSize });
  if (modelPattern !== undefined && calibrationPath) throw new Error('D1 calibration requires a resolved destination Range.');
  const root = await realpath(path.resolve(source));
  const state = await canonicalFuture(path.resolve(stateDir));
  if (within(root, state)) throw new Error('State directory must be outside the source installation.');
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const result = {
    schemaVersion: 1, phase: 'SOURCE_ESTIMATE', state: 'RUNNING',
    range: range ?? null, ...(modelPattern === undefined ? {} : { modelPattern }),
    modelIds: [...models], source: root, startedAt,
    coverage: 'Explicit Model_ID directories and their model menus; shared media is excluded.',
    inventory: { files: 0, bytes: 0, directories: 0, byExtension: {}, byFamily: {}, byModel: {}, errorCount: 0, errors: [], skippedLinks: 0 },
    sample: { seed, requested: sampleSize, eligibleFiles: 0, eligibleBytes: 0, files: [], readBytes: 0, readSeconds: 0, lines: 0, recordLikeLines: 0, byFamily: {} },
    projection: { d1Bytes: null, importSeconds: null, basis: modelPattern === undefined
      ? 'Unavailable until measured D1/import calibration is provided.'
      : 'Unavailable until destination Ranges are resolved and measured D1/import calibration is provided.' },
  };
  const sample = { seed, limit: sampleSize, files: [] };
  const seenDirectories = new Set();
  let lastProgress = 0;
  const progress = (force = false) => {
    const now = performance.now();
    if (force || now - lastProgress >= 1000) { lastProgress = now; onProgress(result); }
  };
  const recordError = (relative, error) => {
    if (result.inventory.errors.length < 50) result.inventory.errors.push({ path: relative, code: error.code ?? 'INVALID' });
    result.inventory.errorCount += 1;
  };

  async function countFile(relative, model) {
    if (shouldStop()) return;
    try {
      const full = await realpath(path.join(root, relative));
      if (!within(root, full)) throw new Error('File escapes source root.');
      const info = await stat(full);
      if (!info.isFile()) throw new Error('Expected regular file.');
      const extension = path.extname(relative).toLowerCase() || '(none)';
      result.inventory.files += 1;
      result.inventory.bytes += info.size;
      const type = result.inventory.byExtension[extension] ?? { files: 0, bytes: 0 };
      type.files += 1; type.bytes += info.size;
      result.inventory.byExtension[extension] = type;
      const kind = family(relative);
      const familyTotals = result.inventory.byFamily[kind] ?? { files: 0, bytes: 0 };
      familyTotals.files += 1; familyTotals.bytes += info.size;
      result.inventory.byFamily[kind] = familyTotals;
      const modelTotals = result.inventory.byModel[model] ?? { files: 0, bytes: 0 };
      modelTotals.files += 1; modelTotals.bytes += info.size;
      result.inventory.byModel[model] = modelTotals;
      if (extension === '.xml' || extension === '.csv') {
        result.sample.eligibleFiles += 1;
        result.sample.eligibleBytes += info.size;
        sampleFile(sample, relative.replaceAll('\\', '/'), info.size);
      }
    } catch (error) { recordError(relative, error); }
    progress();
  }

  async function walk(relative, model) {
    if (shouldStop()) return;
    let directory;
    try {
      directory = await realpath(path.join(root, relative));
      if (!within(root, directory)) throw new Error('Directory escapes source root.');
      if (seenDirectories.has(directory)) throw new Error('Repeated source directory or link.');
      seenDirectories.add(directory);
      const info = await stat(directory);
      if (!info.isDirectory()) throw new Error('Expected directory.');
      result.inventory.directories += 1;
      for await (const entry of await opendir(directory)) {
        if (shouldStop()) break;
        const child = path.join(relative, entry.name);
        if (entry.isSymbolicLink()) { result.inventory.skippedLinks += 1; continue; }
        if (entry.isDirectory()) await walk(child, model);
        else if (entry.isFile()) await countFile(child, model);
        else recordError(child, new Error('Unknown filesystem entry type.'));
      }
    } catch (error) { recordError(relative, error); }
    progress();
  }

  // The model menu is shared; all other menu paths are selected by exact Model_ID.
  await countFile(path.join('menus', 'models_l_id_0.xml'), 'shared');
  for (const model of models) {
    if (shouldStop()) break;
    await walk(path.join('drilldown', `pl_id_${model}`), model);
    const menuRoot = 'menus';
    try {
      const menuDir = await realpath(path.join(root, menuRoot));
      if (!within(root, menuDir)) throw new Error('Menu directory escapes source root.');
      for await (const entry of await opendir(menuDir)) {
        if (shouldStop()) break;
        if (entry.isFile() && entry.name.startsWith(`pl_id_${model}_`)) await countFile(path.join(menuRoot, entry.name), model);
        if (entry.isDirectory() && /^L-?\d+$/.test(entry.name)) {
          const languageDir = path.join(menuRoot, entry.name);
          try {
            const fullLanguageDir = await realpath(path.join(root, languageDir));
            if (!within(root, fullLanguageDir)) throw new Error('Language menu directory escapes source root.');
            for await (const child of await opendir(fullLanguageDir)) {
              if (shouldStop()) break;
              if (child.isFile() && child.name.startsWith(`pl_id_${model}_`)) await countFile(path.join(languageDir, child.name), model);
            }
          } catch (error) { recordError(languageDir, error); }
        }
      }
    } catch (error) { recordError(menuRoot, error); }
    progress(true);
  }

  result.sample.files = sample.files.sort((a, b) => a.score.localeCompare(b.score)).map(({ path: file, size }) => ({ path: file, size }));
  if (!shouldStop()) {
    const readStart = performance.now();
    for (const file of result.sample.files) {
      if (shouldStop()) break;
      try {
        const full = await realpath(path.join(root, file.path));
        if (!within(root, full)) throw new Error('Sample file escapes source root.');
        const input = createReadStream(full);
        let readBytes = 0;
        input.on('data', chunk => { readBytes += chunk.length; });
        let lines = 0, recordLikeLines = 0;
        for await (const line of createInterface({ input, crlfDelay: Infinity })) {
          lines += 1;
          if (/^\s*(?:\[|\d+,\[)/.test(line)) recordLikeLines += 1;
        }
        if (readBytes !== file.size) throw new Error('Sample file changed during reading.');
        result.sample.readBytes += readBytes;
        result.sample.lines += lines;
        result.sample.recordLikeLines += recordLikeLines;
        const kind = family(file.path);
        const familyTotals = result.sample.byFamily[kind] ?? { files: 0, bytes: 0, recordLikeLines: 0 };
        familyTotals.files += 1; familyTotals.bytes += readBytes; familyTotals.recordLikeLines += recordLikeLines;
        result.sample.byFamily[kind] = familyTotals;
      } catch (error) { recordError(file.path, error); }
      progress();
    }
    result.sample.readSeconds = (performance.now() - readStart) / 1000;
  }
  result.elapsedSeconds = (performance.now() - start) / 1000;
  result.finishedAt = new Date().toISOString();
  result.state = shouldStop() ? 'STOPPED_BY_USER' : result.inventory.errorCount || result.inventory.skippedLinks ? 'INCOMPLETE' : 'COMPLETED';
  if (result.state === 'COMPLETED' && calibrationPath) {
    const calibration = JSON.parse(await readFile(calibrationPath, 'utf8'));
    if (calibration.range !== range || !Number.isFinite(calibration.sourceBytes) || calibration.sourceBytes <= 0 ||
      !Number.isFinite(calibration.d1BytesAdded) || calibration.d1BytesAdded < 0 ||
      !Number.isFinite(calibration.importSeconds) || calibration.importSeconds <= 0) {
      throw new Error('Calibration must contain this Range and positive measured sourceBytes/importSeconds plus nonnegative d1BytesAdded.');
    }
    result.projection = {
      d1Bytes: Math.round(result.sample.eligibleBytes * calibration.d1BytesAdded / calibration.sourceBytes),
      importSeconds: Math.round(result.sample.eligibleBytes * calibration.importSeconds / calibration.sourceBytes),
      basis: 'Linear projection from externally measured published sample; not a capacity guarantee.',
      calibration: { path: path.resolve(calibrationPath), sourceBytes: calibration.sourceBytes,
        d1BytesAdded: calibration.d1BytesAdded, importSeconds: calibration.importSeconds },
    };
  }
  await mkdir(state, { recursive: true });
  const scopeName = range ?? `models-${createHash('sha256').update(modelPattern).digest('hex').slice(0, 12)}`;
  const filename = path.join(state, `range-estimate-${scopeName}-${randomUUID()}.json`);
  const temporary = `${filename}.tmp`;
  await writeFile(temporary, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  await rename(temporary, filename);
  progress(true);
  return { filename, result };
}

export function modelsForRange(range, explicitModels) {
  if (explicitModels) return explicitModels.split(',').map(value => value.trim());
  throw new Error(`Range ${range} requires an explicit comma-separated --models list; Model_IDs are not hardcoded.`);
}
