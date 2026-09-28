import { parseArgs } from 'node:util';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { selectModelBundles } from './DataImporter.Selection.mjs';
import { parseSelection } from './DataImporter.Parse.mjs';
import { estimateSource } from './DataImporter.Estimate.mjs';

const usage = 'Usage: node src/DataImporter.CLI.mjs --parse PATTERN [--estimate]';

// Source text must not introduce control sequences into a terminal display.
const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
async function main() {
  const { values } = parseArgs({ options: {
    estimate: { type: 'boolean' }, parse: { type: 'string' },
  } });
  if (values.parse === undefined) throw new Error('Required parameter: --parse PATTERN.');
    const source = process.env.JEPC_SOURCE ?? 'C:\\Program Files\\JEPC\\applications\\JEPC';
    const stateDir = path.join(process.env.LOCALAPPDATA ?? path.join(homedir(), '.local', 'state'),
      'Jagports', 'JEPC-Importer');
    let lastNotice = 0;
    const onProgress = current => {
      const now = Date.now();
      if (current.completed !== current.total && now - lastNotice < 15000) return;
      lastNotice = now;
      process.stderr.write(`${current.phase}: ${current.completed}/${current.total} bundles (Model_ID ${current.model}).\n`);
    };
    const selection = await selectModelBundles({ pattern: values.parse, source, stateDir,
      language: '0', onProgress });
    const summary = { version: 'v0.1a', modelPattern: selection.modelPattern, modelIds: selection.modelIds,
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
          errors: estimate.result.inventory.errorCount, database: estimate.database,
          reportId: estimate.id };
      } catch (error) { summary.estimate = { state: 'FAILED', error: safe(error.message) }; }
    }
    summary.staging = await parseSelection({ selection, stateDir, onProgress });
    console.log(JSON.stringify(summary, null, 2));
}

try { await main(); }
catch (error) { console.error(`Importer: ${safe(error.message)}\n${usage}`); process.exitCode = 1; }
