import { parseArgs } from 'node:util';
import { moveCursor, cursorTo, clearScreenDown } from 'node:readline';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { selectModelBundles } from './DataImporter.Selection.mjs';
import { parseSelection } from './DataImporter.Parse.mjs';
import { estimateSource } from './DataImporter.Estimate.mjs';
import { importSelectionToD1 } from './DataImporter.Update.mjs';
import { inspect, readState } from './DataImporter.Runtime.mjs';

const shortCommitHash = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || 'unknown';
  } catch {
    return 'unknown';
  }
})();
const buildLabel = `v0.1a-${shortCommitHash}`;
const applicationTitle = `Jagports JEPC DataImporter ${buildLabel}`;

const usage = `${applicationTitle}

Run parsing from the repository root:
  node src/DataImporter.CLI.mjs --source <JEPC root> --state-dir <directory> --category <model_id>:<category_id> [--item <id>] [--language N] [--json] [--import [--estimate]]
  node src/DataImporter.CLI.mjs --source <JEPC root> --state-dir <directory> --parse PATTERN [--language N] [--json] [--import [--estimate]]

Commands:
  node src/DataImporter.CLI.mjs status --state-dir <directory> [--json]
  node src/DataImporter.CLI.mjs report --state-dir <directory> [--json]
  node src/DataImporter.CLI.mjs doctor --state-dir <directory> [--full] [--json]
  node src/DataImporter.CLI.mjs inspect --source <JEPC root> --state-dir <directory> --category <model_id>:<category_id> --item <id> [--language N] [--json]

Node.js 24+. Without --import, selected evidence is staged locally in SQLite only.
Use --import to update the mapped D1 parts database. --estimate adds a per-run source-sample duration estimate.
`

// Source text must not introduce control sequences into a terminal display.
const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');

export function screen(snapshot) {
  if (!snapshot.run) return 'No runs recorded.';
  const { run } = snapshot, p = run.profile ?? {};
  return [
    applicationTitle, '(C)2026 by tlindi and ChatGPT', '',
    `JEPC Parent_ID #${safe(p.parent ?? '—')} — ${safe(p.parentLabel ?? '—')}`,
    `JEPC Model_ID #${safe(p.model ?? '—')} — ${safe(p.modelLabel ?? '—')}`,
    `Region: ${safe(p.region ?? '—')} | Language: ${safe(p.language ?? '—')}`,
    '', `${safe(snapshot.phase ?? 'SOURCE INSPECTION')} | ${safe(run.state)}`,
    `Files checked: ${run.checked ?? 0}/${p.total ?? '—'} | Unchanged: ${run.unchanged ?? 0} | Missing: ${run.missing ?? 0}`,
    'This command inspects source evidence only; it does not import catalogue data.',
    '[Q] Stop safely | Ctrl+C: stop safely; again: emergency exit',
  ].join('\n');
}

function createProgressRenderer(stream = process.stdout) {
  let renderedLines = 0;
  return frame => {
    const output = `${frame}\n`;
    if (renderedLines > 0) {
      moveCursor(stream, 0, -renderedLines);
      cursorTo(stream, 0);
      clearScreenDown(stream);
    }
    stream.write(output);
    renderedLines = output.split('\n').length - 1;
  };
}

function printInspection(snapshot, json, interactive, renderProgress) {
  if (!interactive) {
    console.log(json ? JSON.stringify(snapshot, null, 2) : screen(snapshot));
    return;
  }
  renderProgress(screen(snapshot));
}

async function runInspection(command, values) {
  const allowed = command === 'inspect' ? ['source', 'state-dir', 'category', 'item', 'language', 'json']
    : command === 'doctor' ? ['state-dir', 'full', 'json'] : command === 'status' ? ['state-dir', 'json'] : ['state-dir', 'json'];
  for (const key of Object.keys(values)) if (!allowed.includes(key)) throw new Error(`--${key} is not valid for ${command}.`);
  if (!values['state-dir']) throw new Error('--state-dir is required.');

  if (command !== 'inspect') {
    const result = readState(values['state-dir'], { doctor: command === 'doctor', full: values.full, report: command === 'report' });
    if (values.json) console.log(JSON.stringify(result, null, 2));
    else if (command === 'doctor') console.log(`SQLite health: ${result.result} (${result.check}); foreign keys: ${result.foreignKeys}.`);
    else {
      console.log(screen(result));
      if (command === 'report' && result.events?.length) {
        console.log('\nRecent run events:');
        for (const event of result.events) console.log(`${event.time} ${event.detail.type ?? 'EVENT'} ${event.detail.path ?? ''} ${event.detail.error ?? ''}`.trim());
      }
    }
    return;
  }

  for (const key of ['source', 'category', 'item']) if (!values[key]) throw new Error(`--${key} is required.`);
  const selected = /^(\d+):(\d+)$/.exec(String(values.category));
  if (!selected) throw new Error('--category must use MODEL_ID:CATEGORY_ID, for example 3187:11096.');
  let stopped = false, signals = 0;
  const onSignal = () => { stopped = true; if (++signals > 1) process.exit(130); };
  const onKey = chunk => { if (chunk.includes('\x03')) onSignal(); else if (/q/i.test(chunk)) stopped = true; };
  const interactive = Boolean(process.stdout.isTTY && !values.json);
  const renderProgress = interactive ? createProgressRenderer() : null;
  const raw = Boolean(interactive && process.stdin.isTTY);
  const previousRaw = process.stdin.isRaw;
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  if (raw) { process.stdin.setRawMode(true); process.stdin.setEncoding('utf8'); process.stdin.on('data', onKey); process.stdin.resume(); }
  try {
    const result = await inspect({ source: values.source, stateDir: values['state-dir'], model: selected[1],
      category: selected[2], item: values.item, language: values.language ?? '0' }, {
      shouldStop: () => stopped,
      onProgress: snapshot => { if (interactive) printInspection(snapshot, values.json, true, renderProgress); },
    });
    if (!interactive) printInspection(result, values.json, false);
    process.exitCode = result.run.state === 'STOPPED_BY_USER' ? 130 : result.run.missing ? 2 : 0;
  } finally {
    process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
    if (raw) { process.stdin.off('data', onKey); process.stdin.setRawMode(Boolean(previousRaw)); process.stdin.pause(); }
  }
}

function summaryText(summary) {
  const lines = [
    `${applicationTitle}: ${summary.selector === 'MODEL_CATEGORY' ? `category ${summary.categorySelector}${summary.itemId ? `, item ${summary.itemId}` : ''}` : `model pattern ${summary.modelPattern}`}`,
    `Models: ${summary.modelIds.join(', ')} | Complete categories selected: ${summary.selected}${summary.limit ? ` (maximum ${summary.limit})` : ''}`,
    `SQLite staging: ${summary.staging.bundles} bundles, ${summary.staging.files} files, ${summary.staging.records} records${summary.staging.database ? ` — ${summary.staging.database}` : ''}`,
  ];
  if (summary.estimate) {
    lines.push(`Estimate: ${summary.estimate.state}; ${summary.estimate.files} files, ${summary.estimate.bytes} bytes inventoried in ${summary.estimate.elapsedSeconds}s.`);
    lines.push(`Selected source parse estimate: ${summary.estimate.estimatedSelectedParseSeconds == null ? 'unavailable (no readable sample)' : `${summary.estimate.estimatedSelectedParseSeconds.toFixed(1)}s`} for ${summary.estimate.selectedBundleBytes} bytes.`);
    lines.push(`D1 duration projection: ${summary.estimate.projection?.importSeconds == null ? 'not available without measured calibration' : `${summary.estimate.projection.importSeconds}s`} (${summary.estimate.projection?.basis ?? 'no projection'})`);
  }
  const d1 = summary.d1Import;
  lines.push(`D1 parts database: ${d1.phase}${d1.imported === undefined ? '' : `; ${d1.imported} written, ${d1.reused} reused, ${d1.occurrences} occurrences`}`);
  if (d1.verificationUpdated) lines.push(`${d1.verificationUpdated} existing JEPC rows marked verified.`);
  if (d1.reason) lines.push(d1.reason);
  return lines.join('\n');
}

async function runCatalogue(values) {
  const hasPattern = values.parse !== undefined;
  const hasCategory = values.category !== undefined;
  const singleCategory = hasCategory;
  if (hasPattern && singleCategory) throw new Error('Use either --parse PATTERN or --category MODEL_ID:CATEGORY_ID, not both.');
  if (!hasPattern && !singleCategory) throw new Error('Choose --parse PATTERN or --category MODEL_ID:CATEGORY_ID.');
  if (values.model !== undefined) throw new Error('--model is only valid with the original inspect command; use --category MODEL_ID:CATEGORY_ID for catalogue processing.');
  const categorySelector = singleCategory ? /^(\d+):(\d+)$/.exec(String(values.category)) : null;
  if (singleCategory && !categorySelector) throw new Error('--category must use MODEL_ID:CATEGORY_ID, for example 3187:11096.');
  if (values.estimate && !values.import) throw new Error('--estimate is valid only with --import.');
  if (values.item !== undefined && !singleCategory) throw new Error('--item is valid only with --category MODEL_ID:CATEGORY_ID.');
  for (const key of Object.keys(values)) {
    if (!['parse', 'estimate', 'import', 'category', 'item', 'source', 'state-dir', 'language', 'json'].includes(key)) {
      throw new Error(`--${key} is not valid for catalogue processing.`);
    }
  }

  const source = values.source;
  const stateDir = values['state-dir'];
  if (!source) throw new Error('--source is required.');
  if (!stateDir) throw new Error('--state-dir is required.');
  if (values.language !== undefined && !/^\d+$/.test(values.language)) throw new Error('--language must be a nonnegative numeric ID.');
  let lastNotice = 0;
  const interactiveProgress = Boolean(process.stdout.isTTY && !values.json);
  const renderProgress = interactiveProgress ? createProgressRenderer() : null;
  const selectorLabel = hasPattern ? `Model pattern: ${values.parse}`
    : `Model_ID ${categorySelector[1]} / Category_ID ${categorySelector[2]}`;
  const onProgress = current => {
    const now = Date.now();
    if (interactiveProgress) {
      const total = Number(current.total) || 0;
      const completed = Number(current.completed) || 0;
      const percent = total ? Math.min(100, Math.floor(completed * 100 / total)) : 0;
      const width = 24;
      const bar = `${'█'.repeat(Math.floor(percent * width / 100))}${'░'.repeat(width - Math.floor(percent * width / 100))}`;
      const progress = total
        ? `Progress: [${bar}] ${percent}% (${completed}/${total}) bundles`
        : `Files indexed: ${completed.toLocaleString()} (directory scan in progress)`;
      const frame = [
        applicationTitle,
        selectorLabel,
        `Phase: ${current.phase}`,
        progress,
        ...(hasPattern && current.model != null ? [`Model_ID: ${current.model}`] : []),
        ...(hasPattern && current.category != null ? [`Category_ID: ${current.category}`] : []),
      ].join('\n');
      renderProgress(frame);
      return;
    }
    if ((current.total == null || current.completed !== current.total) && now - lastNotice < 15000) return;
    lastNotice = now;
    process.stderr.write(current.total == null
      ? `${current.phase}: ${Number(current.completed).toLocaleString()} files indexed (Model_ID ${current.model}).\n`
      : `${current.phase}: ${current.completed}/${current.total} bundles (Model_ID ${current.model}).\n`);
  };
  const selector = singleCategory
    ? { modelId: categorySelector[1], categoryId: categorySelector[2] }
    : { pattern: values.parse };
  const language = values.language ?? '0';
  const selection = await selectModelBundles({ ...selector, source, stateDir, language, onProgress });
  if (values.item !== undefined) {
    if (!/^\d+$/.test(values.item)) throw new Error('--item must be a numeric JEPC item ID.');
    const bundle = selection.bundles[0];
    const expectedItemFile = `Itm_M${categorySelector[1]}_C${categorySelector[2]}_I${values.item}_L${language}.xml`;
    if (!bundle?.files.some(file => file.path.split('/').at(-1) === expectedItemFile)) {
      throw new Error(`Item ${values.item} was not found in category ${categorySelector[1]}:${categorySelector[2]} for language ${language}.`);
    }
  }
  const summary = { version: 'v0.1a', build: buildLabel, selector: selection.selector,
    modelPattern: hasPattern ? selection.modelPattern : undefined,
    categorySelector: singleCategory ? values.category : undefined,
    itemId: values.item ?? null,
    modelId: selection.modelId ?? undefined, categoryId: selection.categoryId ?? undefined,
    modelIds: selection.modelIds, eligible: selection.eligibleCategories,
    limit: selection.categoryLimit, selected: selection.bundles.length,
    incompleteCategories: selection.incompleteCategories.length,
    sampledCategories: selection.bundles.map(bundle => ({ model: bundle.model, modelLabel: bundle.modelLabel,
      category: bundle.category, categoryLabel: bundle.categoryLabel, language: bundle.language })) };
  if (values.estimate) {
    try {
      let lastEstimateNotice = 0;
      const estimate = await estimateSource({ source, stateDir, modelPattern: summary.modelPattern ?? `category-${categorySelector[1]}-${categorySelector[2]}`,
        models: summary.modelIds, seed: randomUUID(), sampleSize: 100 }, { onProgress: current => {
        const now = Date.now();
        if (interactiveProgress) {
          renderProgress(`${applicationTitle}
${selectorLabel}
Phase: source_estimate
Files scanned: ${current.inventory.files.toLocaleString()}
Bytes scanned: ${current.inventory.bytes.toLocaleString()}
Errors: ${current.inventory.errorCount}`);
          return;
        }
        if (current.state === 'RUNNING' && now - lastEstimateNotice < 15000) return;
        lastEstimateNotice = now;
        process.stderr.write(`Estimate: ${current.inventory.files} files, ${current.inventory.bytes} bytes scanned.\n`);
      } });
      const selectedBundleBytes = selection.bundles.reduce((total, bundle) =>
        total + bundle.files.reduce((bundleTotal, file) => bundleTotal + file.size, 0), 0);
      const sampleReadSeconds = estimate.result.sample.readSeconds;
      const sampleReadBytes = estimate.result.sample.readBytes;
      const estimatedSelectedParseSeconds = sampleReadBytes > 0
        ? selectedBundleBytes * sampleReadSeconds / sampleReadBytes : null;
      summary.estimate = { state: estimate.result.state, files: estimate.result.inventory.files,
        bytes: estimate.result.inventory.bytes, elapsedSeconds: estimate.result.elapsedSeconds,
        selectedBundleBytes, estimatedSelectedParseSeconds,
        errors: estimate.result.inventory.errorCount, projection: estimate.result.projection,
        database: estimate.database, reportId: estimate.id };
    } catch (error) { summary.estimate = { state: 'FAILED', error: safe(error.message) }; }
  }
  summary.staging = await parseSelection({ selection, stateDir, onProgress });
  if (!values.import) {
    summary.d1Import = { phase: 'NOT_REQUESTED', requested: false,
      reason: '--import was not supplied; evidence was staged in SQLite only.' };
  } else if (!process.env.CLOUDFLARE_API_TOKEN) {
    summary.d1Import = { phase: 'NOT_CONFIGURED', requested: true,
      reason: 'CLOUDFLARE_API_TOKEN is absent; SQLite staging only.' };
  } else {
    summary.d1Import = { requested: true,
      ...await importSelectionToD1({ selection, stateDir, token: process.env.CLOUDFLARE_API_TOKEN, itemId: values.item, onProgress }) };
  }
  if (values.json) console.log(JSON.stringify(summary, null, 2));
  else console.log(summaryText(summary));
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    estimate: { type: 'boolean' }, import: { type: 'boolean' }, parse: { type: 'string' },
    source: { type: 'string' }, 'state-dir': { type: 'string' },
    category: { type: 'string' }, item: { type: 'string' },
    language: { type: 'string' }, json: { type: 'boolean' }, full: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help && !positionals.length) { console.log(usage); return; }
  if (positionals.length) {
    if (positionals.length !== 1 || !['inspect', 'status', 'report', 'doctor'].includes(positionals[0])) {
      throw new Error('Unknown command. Use --help.');
    }
    await runInspection(positionals[0], values);
    return;
  }
  if (values.parse === undefined && values.category === undefined && Object.keys(values).length === 0) { console.log(usage); return; }
  await runCatalogue(values);
}

try { await main(); }
catch (error) { console.error(`Importer: ${safe(error.message)}\n${usage}`); process.exitCode = 1; }

