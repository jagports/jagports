import { parseArgs } from 'node:util';
import { moveCursor, cursorTo, clearScreenDown } from 'node:readline';
import { inspectMedia, preserveMedia, readState, run } from './MediaImporter.Runtime.mjs';

const help = `
Jagports JEPC MediaImporter v0.1 — bounded local preservation
(C)2026 by tlindi and ChatGPT

Node.js 24+; run locally beside a JEPC installation.
  inspect --source <JEPC root> --state-dir <directory> --media-id <id> [--json]
  preserve --source <JEPC root> --state-dir <directory> --destination-dir <directory> --media-id <id> [--json]
  run --source <JEPC root> --state-dir <directory> [--json]
  status --state-dir <directory> [--json]
  report --state-dir <directory>
  doctor --state-dir <directory> [--full]

Only three paths are inspected for one media ID: flash/images/<id>.jpg,
illustrations/png/<id>.png and flash/xml/<id>.xml. This version does not publish to R2 or D1 and does not convert hotspot coordinates.
Q or the first Ctrl+C stops after the current work checkpoint; a second Ctrl+C exits.
`;

const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
export function screen(snapshot) {
  if (!snapshot.run) return 'No MediaImporter runs recorded.';
  const run = snapshot.run, work = snapshot.work ?? {};
  return [
    'Jagports JEPC MediaImporter v0.1', '(C)2026 by tlindi and ChatGPT', '',
    `LOCAL PRESERVATION | ${safe(run.state)} | ${safe(run.command)}`,
    `Processed: ${run.processed} | Unchanged candidates: ${run.unchanged} | Missing candidates: ${run.missing} | Corrupt candidates: ${run.corrupt}`,
    `Work: discovered ${work.DISCOVERED ?? 0} | processed ${work.PROCESSED ?? 0} | needs reprocess ${work.NEEDS_REPROCESS ?? 0}`,
    'Hotspot geometry: BLOCKED_UNVERIFIED until issue #352 is completed.',
    'R2/D1 publication: not implemented in Slice 1.',
    '[Q] Stop safely | Ctrl+C: stop safely; again: emergency exit',
  ].join('\n');
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  source: { type: 'string' }, 'state-dir': { type: 'string' }, 'destination-dir': { type: 'string' }, 'media-id': { type: 'string' },
    json: { type: 'boolean' }, full: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help || !positionals.length) { console.log(help); return; }
  const [command] = positionals;
  if (positionals.length !== 1 || !['inspect', 'preserve', 'run', 'status', 'report', 'doctor'].includes(command)) throw new Error('Unknown command. Use --help.');
  const allowed = command === 'inspect' ? ['source', 'state-dir', 'media-id', 'json'] : command === 'preserve' ? ['source', 'state-dir', 'destination-dir', 'media-id', 'json']
      : command === 'run' ? ['source', 'state-dir', 'json']
        : command === 'doctor' ? ['state-dir', 'full'] : command === 'status' ? ['state-dir', 'json'] : ['state-dir'];
  for (const key of Object.keys(values)) if (!allowed.includes(key)) throw new Error(`--${key} is not valid for ${command}.`);
  if (!values['state-dir']) throw new Error('--state-dir is required.');
  if (command === 'status' || command === 'report' || command === 'doctor') {
    const result = readState(values['state-dir'], { report: command === 'report', doctor: command === 'doctor', full: values.full });
    console.log(command === 'status' && !values.json ? screen(result) : JSON.stringify(result, null, 2)); return;
  }
  if (!values.source) throw new Error('--source is required.');
  if ((command === 'inspect' || command === 'preserve') && !values['media-id']) throw new Error('--media-id is required.');
  if (command === 'preserve' && !values['destination-dir']) throw new Error('--destination-dir is required.');
  let stopped = false, signals = 0, renderedLines = 0;
  const onSignal = () => { stopped = true; if (++signals > 1) process.exit(130); };
  const onKey = chunk => { if (chunk.includes('\x03')) onSignal(); else if (/q/i.test(chunk)) stopped = true; };
  const interactive = Boolean(process.stdout.isTTY && !values.json), raw = Boolean(interactive && process.stdin.isTTY), previousRaw = process.stdin.isRaw;
  const progress = snapshot => {
    if (!interactive) return;
    const output = `${screen(snapshot)}\n`;
    if (renderedLines) { moveCursor(process.stdout, 0, -renderedLines); cursorTo(process.stdout, 0); clearScreenDown(process.stdout); }
    process.stdout.write(output); renderedLines = output.split('\n').length - 1;
  };
  process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);
  if (raw) { process.stdin.setRawMode(true); process.stdin.setEncoding('utf8'); process.stdin.on('data', onKey); process.stdin.resume(); }
  try {
    const result = command === 'inspect'
      ? await inspectMedia({ source: values.source, stateDir: values['state-dir'], mediaId: values['media-id'] }, { shouldStop: () => stopped, onProgress: progress })
      : command === 'preserve' ? await preserveMedia({ source: values.source, stateDir: values['state-dir'], destinationDir: values['destination-dir'], mediaId: values['media-id'] })
      : await run({ source: values.source, stateDir: values['state-dir'] }, { shouldStop: () => stopped, onProgress: progress });
    if (!interactive) console.log(values.json ? JSON.stringify(result, null, 2) : screen(result));
    process.exitCode = result.run.state === 'STOPPED_BY_USER' ? 130 : 0;
  } finally {
    process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
    if (raw) { process.stdin.off('data', onKey); process.stdin.setRawMode(Boolean(previousRaw)); process.stdin.pause(); }
  }
}

try { await main(); } catch (error) { console.error(`MediaImporter: ${safe(error.message)}`); process.exitCode = 1; }

