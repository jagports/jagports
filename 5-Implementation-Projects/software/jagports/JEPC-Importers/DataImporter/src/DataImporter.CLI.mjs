import { parseArgs } from 'node:util';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { selectModelBundles } from './DataImporter.Selection.mjs';
import { parseSelection } from './DataImporter.Parse.mjs';
import { estimateRange, modelsForRange } from './DataImporter.Estimate.mjs';

const help = `

Jagports JEPC Data Importer v0.1a — source category parser
(C)2026 by tlindi and ChatGPT

Node.js 24+; run locally on the computer that can read the source files.
  --parse <model-name-fragment> [--source <JEPC root>] [--state-dir <outside source>] [--language 0] [--estimate] [--json]
  estimate-range --source <JEPC root> --state-dir <outside source> --range xk --models 3187,3183,... [--sample-size 100] [--calibration measured.json] [--json]

Example:
  cd <DataImporter_Dir>
  node .\src\DataImporter.CLI.mjs --parse XK
  node .\src\DataImporter.CLI.mjs --parse XK --estimate

--parse matches source XML model names by case-insensitive literal substring and stages up to 40 complete category bundles per run.
--estimate optionally inventories the matched models' source files. Measured-calibration projections require an explicit Range and verified model scope.
The source installation is read-only. Local parsed evidence is not a D1 import.
`;

// Source text must not introduce control sequences into a terminal display.
const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    source: { type: 'string' }, 'state-dir': { type: 'string' },
    language: { type: 'string' }, json: { type: 'boolean' },
    range: { type: 'string' }, models: { type: 'string' },
    'sample-size': { type: 'string' }, calibration: { type: 'string' },
    estimate: { type: 'boolean' }, parse: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) { console.log(help); return; }
  if (values.parse !== undefined) {
    if (positionals.length || Object.keys(values).some(key => !['parse', 'source', 'state-dir', 'language', 'estimate', 'json'].includes(key))) {
      throw new Error('--parse accepts only source, state-dir, language, estimate and json options.');
    }
    const source = values.source ?? process.env.JEPC_SOURCE ?? 'C:\\Program Files\\JEPC\\applications\\JEPC';
    const stateDir = values['state-dir'] ?? path.join(process.env.LOCALAPPDATA ?? path.join(homedir(), '.local', 'state'),
      'Jagports', 'JEPC-Importer');
    let lastNotice = 0;
    const onProgress = current => {
      const now = Date.now();
      if (current.completed !== current.total && now - lastNotice < 15000) return;
      lastNotice = now;
      process.stderr.write(`${current.phase}: ${current.completed}/${current.total} bundles (Model_ID ${current.model}).\n`);
    };
    const selection = await selectModelBundles({ pattern: values.parse, source, stateDir,
      language: values.language ?? '0', onProgress });
    const summary = { modelPattern: selection.modelPattern, modelIds: selection.modelIds,
      eligible: selection.eligibleCategories, limit: selection.categoryLimit,
      selected: selection.bundles.length, incompleteCategories: selection.incompleteCategories.length,
      sampledCategories: selection.bundles.map(bundle => ({ model: bundle.model, modelLabel: bundle.modelLabel,
        category: bundle.category, categoryLabel: bundle.categoryLabel, language: bundle.language })) };
    if (values.estimate) {
      try {
        const estimate = await estimateRange({ source, stateDir, modelPattern: summary.modelPattern,
          models: summary.modelIds, seed: randomUUID(), sampleSize: 100 });
        summary.estimate = { state: estimate.result.state, report: estimate.filename };
      } catch (error) { summary.estimate = { state: 'FAILED', error: safe(error.message) }; }
    }
    summary.staging = await parseSelection({ selection, stateDir, onProgress });
    console.log(values.json ? JSON.stringify(summary, null, 2)
      : `Matched ${summary.modelIds.length} source models; staged ${summary.staging.bundles} of ${summary.eligible} complete category bundles (limit ${summary.limit}).\nStaging: ${summary.staging.outputDir}\nD1 publication: not started.`);
    return;
  }
  if (!positionals.length) { console.log(help); return; }
  const [command] = positionals;
  if (positionals.length !== 1 || command !== 'estimate-range') throw new Error('Unknown command. Use --help.');
  const allowed = ['source', 'state-dir', 'range', 'models', 'sample-size', 'calibration', 'json'];
  for (const key of Object.keys(values)) if (!allowed.includes(key)) throw new Error(`--${key} is not valid for ${command}.`);
  if (!values['state-dir']) throw new Error('--state-dir is required.');
  if (!values.range) throw new Error('--range is required.');
    const models = modelsForRange(values.range, values.models);
    let stopped = false, signals = 0, lastNotice = 0;
    const onSignal = () => { stopped = true; if (++signals > 1) process.exit(130); };
    process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);
    try {
      const { filename, result } = await estimateRange({ source: values.source, stateDir: values['state-dir'],
        range: values.range, models, seed: randomUUID(),
        sampleSize: values['sample-size'] === undefined ? 100 : Number(values['sample-size']),
        calibrationPath: values.calibration }, { shouldStop: () => stopped,
        onProgress: current => {
          const now = Date.now();
          if (!process.stderr.isTTY && now - lastNotice < 15000) return;
          lastNotice = now;
          process.stderr.write(`${process.stderr.isTTY ? '\r' : ''}Scanned ${current.inventory.files} files / ${current.inventory.bytes} source bytes; ${current.inventory.errorCount} errors.    ${process.stderr.isTTY ? '' : '\n'}`);
        } });
      if (process.stderr.isTTY) process.stderr.write('\n');
      console.log(values.json ? JSON.stringify({ filename, ...result }, null, 2)
        : `Range ${safe(result.range)}: ${result.state}; ${result.inventory.files} files, ${result.inventory.bytes} source bytes in ${result.elapsedSeconds.toFixed(1)} s.\nSampled ${result.sample.files.length} files; D1 estimate: ${result.projection.d1Bytes ?? 'unavailable without measured calibration'}; import seconds: ${result.projection.importSeconds ?? 'unavailable without measured calibration'}.\nReport: ${filename}`);
      process.exitCode = result.state === 'STOPPED_BY_USER' ? 130 : result.state === 'INCOMPLETE' ? 2 : 0;
    } finally { process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal); }
  return;
}

try { await main(); }
catch (error) { console.error(`Importer: ${safe(error.message)}`); process.exitCode = 1; }
