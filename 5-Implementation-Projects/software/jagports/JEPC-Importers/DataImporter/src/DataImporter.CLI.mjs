import { parseArgs } from 'node:util';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { selectModelBundles } from './DataImporter.Selection.mjs';
import { parseSelection } from './DataImporter.Parse.mjs';
import { estimateSource } from './DataImporter.Estimate.mjs';

const help = `

Jagports JEPC Data Importer v0.1a — source category parser
(C)2026 by tlindi and ChatGPT

Node.js 24+; run locally on the computer that can read the source files.
  --parse <model-name-fragment> [--source <JEPC root>] [--state-dir <outside source>] [--language 0] [--estimate] [--json]

Example:
  cd <DataImporter_Dir>
  node .\src\DataImporter.CLI.mjs --parse XK
  node .\src\DataImporter.CLI.mjs --parse XK --estimate

--parse matches source XML model names by case-insensitive literal substring and stages up to 40 complete category bundles per run.
--estimate optionally inventories the matched models' source files.
The source installation is read-only. Local parsed evidence is not a D1 import.
`;

// Source text must not introduce control sequences into a terminal display.
const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
async function main() {
  const { values } = parseArgs({ options: {
    source: { type: 'string' }, 'state-dir': { type: 'string' },
    language: { type: 'string' }, json: { type: 'boolean' },
    estimate: { type: 'boolean' }, parse: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) { console.log(help); return; }
  if (values.parse !== undefined) {
    if (Object.keys(values).some(key => !['parse', 'source', 'state-dir', 'language', 'estimate', 'json'].includes(key))) {
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
        let lastEstimateNotice = 0;
        const estimate = await estimateSource({ source, stateDir, modelPattern: summary.modelPattern,
          models: summary.modelIds, seed: randomUUID(), sampleSize: 100 }, { onProgress: current => {
          const now = Date.now();
          if (current.state === 'RUNNING' && now - lastEstimateNotice < 15000) return;
          lastEstimateNotice = now;
          process.stderr.write(`Estimate: ${current.inventory.files} files, ${current.inventory.bytes} bytes scanned.\n`);
        } });
        summary.estimate = { state: estimate.result.state, files: estimate.result.inventory.files,
          bytes: estimate.result.inventory.bytes, elapsedSeconds: estimate.result.elapsedSeconds,
          errors: estimate.result.inventory.errorCount, report: estimate.filename };
      } catch (error) { summary.estimate = { state: 'FAILED', error: safe(error.message) }; }
    }
    summary.staging = await parseSelection({ selection, stateDir, onProgress });
    console.log(values.json ? JSON.stringify(summary, null, 2)
      : `Matched ${summary.modelIds.length} source models; staged ${summary.staging.bundles} of ${summary.eligible} complete category bundles (limit ${summary.limit}).\nStaging: ${summary.staging.outputDir}${summary.estimate ? `\nEstimate: ${summary.estimate.state}; ${summary.estimate.files ?? 0} files, ${summary.estimate.bytes ?? 0} bytes in ${summary.estimate.elapsedSeconds?.toFixed(1) ?? '?'} s. Report: ${summary.estimate.report ?? summary.estimate.error}` : ''}\nD1 publication: not started.`);
    return;
  }
  if (Object.keys(values).length) throw new Error('Use --parse PATTERN, optionally with --estimate.');
  console.log(help);
}

try { await main(); }
catch (error) { console.error(`Importer: ${safe(error.message)}`); process.exitCode = 1; }
