import { parseArgs } from 'node:util';
import { inspect, readState } from './DataImporter.Runtime.mjs';

const help = `
Jagports JEPC Data Importer v0.1 — source inspection skeleton
(C)2026 by tlindi and ChatGPT

Node.js 24+; run locally on the computer that can read the source files.
  inspect --source <JEPC root> --state-dir <outside source> --model <id> --category <id> --item <id> [--language 0] [--json]
  status  --state-dir <directory> [--json]
  report  --state-dir <directory>
  doctor  --state-dir <directory> [--full]

 example usage:
  
  cd <DataImporter_Dir>
  node .\src\DataImporter.CLI.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir . --model 3187 --category 12088 --item 1 --language 0

inspect checks eight expected source paths. It does not import catalogue data.
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
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help || !positionals.length) { console.log(help); return; }
  const [command] = positionals;
  if (positionals.length !== 1 || !['inspect', 'status', 'report', 'doctor'].includes(command)) throw new Error('Unknown command. Use --help.');
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
      onProgress: snapshot => {
        if (interactive) process.stdout.write(`\x1b[2J\x1b[H${screen(snapshot)}\n`);
      },
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
