#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readRangeConfiguration, readSourceRangeMap } from './range-d1-client.mjs';

const workerConfig = fileURLToPath(new URL('../../../../4-Production/internet/cloudflare/workers/jagports/wrangler.toml', import.meta.url));
const begin = '# BEGIN REVIEWED JEPC RANGE BINDINGS';
const end = '# END REVIEWED JEPC RANGE BINDINGS';

export async function syncWorkerBindings(filename = workerConfig) {
  const ranges = await readSourceRangeMap();
  const bindings = [];
  for (const range of ranges) {
    const config = await readRangeConfiguration(range.rangeSlug);
    const binding = `RANGE_${range.rangeSlug.toUpperCase().replaceAll('-', '_')}`;
    bindings.push({ rangeSlug: range.rangeSlug, binding, ...config });
  }
  const original = await readFile(filename, 'utf8');
  const markerStart = original.indexOf(begin), markerEnd = original.indexOf(end);
  if ((markerStart < 0) !== (markerEnd < 0)) throw new Error('Incomplete Range binding markers in wrangler.toml.');
  const base = markerStart < 0 ? original.trimEnd() :
    `${original.slice(0, markerStart).trimEnd()}${original.slice(markerEnd + end.length)}`.trimEnd();
  const block = [begin,
    '[vars]',
    `RANGE_BINDINGS = '${JSON.stringify(Object.fromEntries(bindings.map(item => [item.rangeSlug, item.binding])))}'`,
    ...bindings.flatMap(item => ['', '[[d1_databases]]', `binding = "${item.binding}"`,
      `database_name = "${item.databaseName}"`, `database_id = "${item.databaseId}"`]),
    end].join('\n');
  await writeFile(filename, `${base}\n\n${block}\n`);
  return bindings.map(({ rangeSlug, binding, databaseName, databaseId }) =>
    ({ rangeSlug, binding, databaseName, databaseId }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { console.log(JSON.stringify(await syncWorkerBindings(), null, 2)); }
  catch (error) { console.error(`Range bindings: ${error.message}`); process.exitCode = 1; }
}
