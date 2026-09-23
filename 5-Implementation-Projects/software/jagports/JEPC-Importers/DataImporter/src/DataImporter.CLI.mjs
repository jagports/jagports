import { parseArgs } from 'node:util';
import { moveCursor, cursorTo, clearScreenDown } from 'node:readline';
import { inspect, readState } from './DataImporter.Runtime.mjs';
import { selectRangeBundles } from './DataImporter.Selection.mjs';
import { parseSelection } from './DataImporter.Parse.mjs';
import { estimateRange, modelsForRange } from './DataImporter.Estimate.mjs';

const help = `

Jagports JEPC Data Importer v0.1 — source inspection skeleton
(C)2026 by tlindi and ChatGPT

Node.js 24+; run locally on the computer that can read the source files.
  inspect --source <JEPC root> --state-dir <outside source> --model <id> --category <id> --item <id> [--language 0] [--json]
  status  --state-dir <directory> [--json]
  report  --state-dir <directory>
  doctor  --state-dir <directory> [--full]
  select --range xk --source <JEPC root> --state-dir <outside source> --seed <text> [--language 0] [--estimate] [--sample-size 100] [--calibration measured.json] [--json]
  estimate-range --source <JEPC root> --state-dir <outside source> --range xk [--models 3187,3183,...] [--seed text] [--sample-size 100] [--calibration measured.json] [--json]
  parse --manifest <selection.json> --state-dir <outside source> [--json]

 example usage:
  
  cd <DataImporter_Dir>
  node .\src\DataImporter.CLI.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir . --model 3187 --category 12088 --item 1 --language 0

inspect checks eight expected source paths. It does not import catalogue data.
select records a reproducible forty-category selection for the requested Range; currently only xk is supported. --estimate optionally scans its Range source before a later import.
estimate-range inventories the selected Range source and samples files; it never starts import.
parse stages the manifest's source records and applicability sidecars locally; it does not publish to D1.
Repeat inspect with the same arguments to recheck/reuse persisted checksums.
Q or first Ctrl+C stops after the current file checkpoint; second Ctrl+C exits.
report emits the latest run and its detailed persistent events as JSON.
`;

// Source text must not introduce control sequences into a terminal display.
const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
export function screen(snapshot) {
  if (!snapshot.run) return 'No runs recorded.';
  const { run } = snapshot, p = run.profile;
  return [
    'Jagports JEPC Data Importer v0.1', '(C)2026 by tlindi and ChatGPT', '',
    `JEPC Parent_ID #${safe(p.parent)} — ${safe(p.parentLabel)}`,
    `JEPC Model_ID #${safe(p.model)} — ${safe(p.modelLabel)}`,
    `Region: ${safe(p.region)} | Language: ${safe(p.language)}`,
    '', `SOURCE INSPECTION | ${safe(run.state)}`,
    `Files checked: ${run.checked}/${p.total} | Unchanged: ${run.unchanged} | Missing: ${run.missing}`,
    'Catalogue import, content/translation counts and media processing: not implemented.',
    '[Q] Stop safely | Ctrl+C: stop safely; again: emergency exit',
  ].join('\n');
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    source: { type: 'string' }, 'state-dir': { type: 'string' },
    model: { type: 'string' }, category: { type: 'string' }, item: { type: 'string' },
    language: { type: 'string' }, json: { type: 'boolean' }, full: { type: 'boolean' },
    seed: { type: 'string' }, manifest: { type: 'string' }, range: { type: 'string' }, models: { type: 'string' },
    'sample-size': { type: 'string' }, calibration: { type: 'string' },
    estimate: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help || !positionals.length) { console.log(help); return; }
  const [command] = positionals;
  if (positionals.length !== 1 || !['inspect', 'status', 'report', 'doctor', 'select', 'estimate-range', 'parse'].includes(command)) throw new Error('Unknown command. Use --help.');
  const allowed = command === 'inspect' ? ['source', 'state-dir', 'model', 'category', 'item', 'language', 'json']
    : command === 'select' ? ['range', 'source', 'state-dir', 'seed', 'language', 'estimate', 'sample-size', 'calibration', 'json']
    : command === 'estimate-range' ? ['source', 'state-dir', 'range', 'models', 'seed', 'sample-size', 'calibration', 'json']
    : command === 'parse' ? ['manifest', 'state-dir', 'json']
    : command === 'doctor' ? ['state-dir', 'full'] : command === 'status' ? ['state-dir', 'json'] : ['state-dir'];
  for (const key of Object.keys(values)) if (!allowed.includes(key)) throw new Error(`--${key} is not valid for ${command}.`);
  if (!values['state-dir']) throw new Error('--state-dir is required.');
  if (command === 'estimate-range') {
    if (!values.range) throw new Error('--range is required.');
    const models = modelsForRange(values.range, values.models);
    let stopped = false, signals = 0, lastNotice = 0;
    const onSignal = () => { stopped = true; if (++signals > 1) process.exit(130); };
    process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);
    try {
      const { filename, result } = await estimateRange({ source: values.source, stateDir: values['state-dir'],
        range: values.range, models, seed: values.seed ?? 'range-estimate',
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
  if (command === 'select') {
    if (!values.estimate && (values['sample-size'] !== undefined || values.calibration)) {
      throw new Error('--sample-size and --calibration require --estimate.');
    }
    const result = await selectRangeBundles({ range: values.range, source: values.source, stateDir: values['state-dir'],
      seed: values.seed, language: values.language ?? '0' });
    const summary = { range: result.manifest.range ?? 'xk', manifest: result.filename, reused: result.reused,
      phase: result.manifest.phase, selected: result.manifest.bundles.length,
      candidates: result.manifest.selection.candidateCount,
      candidatesByModel: result.manifest.selection.candidateCountsByModel,
      selectedByModel: Object.fromEntries(result.manifest.selection.modelIds.map(model =>
        [model, result.manifest.bundles.filter(bundle => bundle.model === model).length])) };
    if (values.estimate) {
      let stopped = false, signals = 0;
      const onSignal = () => { stopped = true; if (++signals > 1) process.exit(130); };
      process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);
      try {
        const estimate = await estimateRange({ source: values.source, stateDir: values['state-dir'],
          range: values.range, models: result.manifest.selection.modelIds, seed: values.seed,
          sampleSize: values['sample-size'] === undefined ? 100 : Number(values['sample-size']),
          calibrationPath: values.calibration }, { shouldStop: () => stopped,
          onProgress: current => {
            if (process.stderr.isTTY) process.stderr.write(`\rEstimated scope: ${current.inventory.files} files / ${current.inventory.bytes} bytes.   `);
          } });
        if (process.stderr.isTTY) process.stderr.write('\n');
        summary.estimate = { state: estimate.result.state, report: estimate.filename,
          sourceFiles: estimate.result.inventory.files, sourceBytes: estimate.result.inventory.bytes,
          projectedD1Bytes: estimate.result.projection.d1Bytes,
          projectedImportSeconds: estimate.result.projection.importSeconds };
        if (estimate.result.state === 'STOPPED_BY_USER') process.exitCode = 130;
        else if (estimate.result.state === 'INCOMPLETE') process.exitCode = 2;
      } catch (error) {
        summary.estimate = { state: 'FAILED', error: safe(error.message) };
        process.exitCode = 2;
      } finally { process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal); }
    }
    console.log(values.json ? JSON.stringify(summary, null, 2)
      : `Selected ${summary.selected} ${values.range} category bundles from ${summary.candidates} candidates.\nManifest: ${summary.manifest}\n${summary.estimate ? `Optional estimate: ${summary.estimate.state}; report: ${summary.estimate.report ?? summary.estimate.error}.\n` : ''}D1 publication: not started.`);
    return;
  }
  if (command === 'parse') {
    const result = await parseSelection({ manifestPath: values.manifest, stateDir: values['state-dir'] });
    console.log(values.json ? JSON.stringify(result, null, 2)
      : `Staged ${result.bundles} ${result.range} bundles and ${result.records} source records.\nUnknown records: ${result.unknown}.\nStaging: ${result.outputDir}\nD1 publication: not started.`);
    return;
  }
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
  let renderedLines = 0;
  
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  if (raw) { process.stdin.setRawMode(true); process.stdin.setEncoding('utf8'); process.stdin.on('data', onKey); process.stdin.resume(); }
  try {
    if (interactive) process.stdout.write('\x1b[s');
    const result = await inspect({ source: values.source, stateDir: values['state-dir'], model: values.model,
      category: values.category, item: values.item, language: values.language ?? '0' }, {
      shouldStop: () => stopped,
      onProgress: snapshot => {
        if (interactive) {
          const output = `${screen(snapshot)}\n`;

          if (renderedLines > 0) {
            moveCursor(process.stdout, 0, -renderedLines);
            cursorTo(process.stdout, 0);
            clearScreenDown(process.stdout);
          }

          process.stdout.write(output);
          renderedLines = output.split('\n').length - 1;
        }
      }
    });
    if (!interactive) console.log(values.json ? JSON.stringify(result, null, 2) : screen(result));
    process.exitCode = result.run.state === 'STOPPED_BY_USER' ? 130 : result.run.missing ? 2 : 0;
  } finally {
    process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
    if (raw) { process.stdin.off('data', onKey); process.stdin.setRawMode(Boolean(previousRaw)); process.stdin.pause(); }
  }
}

try { await main(); }
catch (error) { console.error(`Importer: ${safe(error.message)}`); process.exitCode = 1; }
