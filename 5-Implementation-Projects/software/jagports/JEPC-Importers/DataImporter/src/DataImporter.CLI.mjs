import { parseArgs } from 'node:util';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { selectModelBundles } from './DataImporter.Selection.mjs';
import { parseSelection } from './DataImporter.Parse.mjs';
import { estimateSource } from './DataImporter.Estimate.mjs';
import { importSelectionToD1 } from './DataImporter.Update.mjs';
import { inspect, readState } from './DataImporter.Runtime.mjs';

const usage = `Jagports JEPC DataImporter

One-category source inspection (original v0.1 interface):
  node src/DataImporter.CLI.mjs inspect --source <JEPC root> --state-dir <outside source> --model <id> --category <id> --item <id> [--language 0] [--json]
  node src/DataImporter.CLI.mjs status --state-dir <directory> [--json]
  node src/DataImporter.CLI.mjs report --state-dir <directory>
  node src/DataImporter.CLI.mjs doctor --state-dir <directory> [--full]

Model-pattern parsing and D1 import:
  node src/DataImporter.CLI.mjs --parse PATTERN [--estimate]

Node.js 24+. Inspection checks one explicit bundle. Parsing selects up to 40 random complete categories.
`;

// Source text must not introduce control sequences into a terminal display.
const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');

export function screen(snapshot) {
  if (!snapshot.run) return 'No runs recorded.';
  const { run } = snapshot, p = run.profile ?? {};
  return [
    'Jagports JEPC Data Importer v0.1', '(C)2026 by tlindi and ChatGPT', '',
    `JEPC Parent_ID #${safe(p.parent ?? '—')} — ${safe(p.parentLabel ?? '—')}`,
    `JEPC Model_ID #${safe(p.model ?? '—')} — ${safe(p.modelLabel ?? '—')}`,
    `Region: ${safe(p.region ?? '—')} | Language: ${safe(p.language ?? '—')}`,
    '', `${safe(snapshot.phase ?? 'SOURCE INSPECTION')} | ${safe(run.state)}`,
    `Files checked: ${run.checked ?? 0}/${p.total ?? '—'} | Unchanged: ${run.unchanged ?? 0} | Missing: ${run.missing ?? 0}`,
    'This command inspects source evidence only; it does not import catalogue data.',
    '[Q] Stop safely | Ctrl+C: stop safely; again: emergency exit',
  ].join('\n');
}

function printInspection(snapshot, json, interactive) {
  if (!interactive) {
    console.log(json ? JSON.stringify(snapshot, null, 2) : screen(snapshot));
    return;
  }
  process.stdout.write(`\x1b[2J\x1b[H${screen(snapshot)}\n`);
}

async function runInspection(command, values) {
  const allowed = command === 'inspect' ? ['source', 'state-dir', 'model', 'category', 'item', 'language', 'json']
    : command === 'doctor' ? ['state-dir', 'full'] : command === 'status' ? ['state-dir', 'json'] : ['state-dir'];
  for (const key of Object.keys(values)) if (!allowed.includes(key)) throw new Error(`--${key} is not valid for ${command}.`);
  if (!values['state-dir']) throw new Error('--state-dir is required.');

  if (command !== 'inspect') {
    const result = readState(values['state-dir'], { doctor: command === 'doctor', full: values.full, report: command === 'report' });
    console.log(command === 'status' && !values.json ? screen(result) : JSON.stringify(result, null, 2));
    return;
  }

  for (const key of ['source', 'model', 'category', 'item']) if (!values[key]) throw new Error(`--${key} is required.`);
  let stopped = false, signals = 0;
  const onSignal = () => { stopped = true; if (++signals > 1) process.exit(130); };
  const onKey = chunk => { if (chunk.includes('\x03')) onSignal(); else if (/q/i.test(chunk)) stopped = true; };
  const interactive = Boolean(process.stdout.isTTY && !values.json);
  const raw = Boolean(interactive && process.stdin.isTTY);
  const previousRaw = process.stdin.isRaw;
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  if (raw) { process.stdin.setRawMode(true); process.stdin.setEncoding('utf8'); process.stdin.on('data', onKey); process.stdin.resume(); }
  try {
    const result = await inspect({ source: values.source, stateDir: values['state-dir'], model: values.model,
      category: values.category, item: values.item, language: values.language ?? '0' }, {
      shouldStop: () => stopped,
      onProgress: snapshot => { if (interactive) printInspection(snapshot, values.json, true); },
    });
    if (!interactive) printInspection(result, values.json, false);
    process.exitCode = result.run.state === 'STOPPED_BY_USER' ? 130 : result.run.missing ? 2 : 0;
  } finally {
    process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
    if (raw) { process.stdin.off('data', onKey); process.stdin.setRawMode(Boolean(previousRaw)); process.stdin.pause(); }
  }
}

async function runPatternParse(values) {
  for (const key of Object.keys(values)) if (!['parse', 'estimate'].includes(key)) throw new Error(`--${key} is only valid with an inspection command.`);
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
  const selection = await selectModelBundles({ pattern: values.parse, source, stateDir, language: '0', onProgress });
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
        errors: estimate.result.inventory.errorCount, database: estimate.database, reportId: estimate.id };
    } catch (error) { summary.estimate = { state: 'FAILED', error: safe(error.message) }; }
  }
  summary.staging = await parseSelection({ selection, stateDir, onProgress });
  summary.d1Import = process.env.CLOUDFLARE_API_TOKEN
    ? await importSelectionToD1({ selection, stateDir, token: process.env.CLOUDFLARE_API_TOKEN, onProgress })
    : { phase: 'NOT_CONFIGURED', reason: 'CLOUDFLARE_API_TOKEN is absent; SQLite staging only.' };
  console.log(JSON.stringify(summary, null, 2));
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    estimate: { type: 'boolean' }, parse: { type: 'string' },
    source: { type: 'string' }, 'state-dir': { type: 'string' },
    model: { type: 'string' }, category: { type: 'string' }, item: { type: 'string' },
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
  if (values.parse === undefined && Object.keys(values).length === 0) { console.log(usage); return; }
  await runPatternParse(values);
}

try { await main(); }
catch (error) { console.error(`Importer: ${safe(error.message)}\n${usage}`); process.exitCode = 1; }

