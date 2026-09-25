#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const directory = fileURLToPath(new URL('.', import.meta.url));
const defaultConfigDirectory = join(directory, 'config');
const apiOrigin = 'https://api.cloudflare.com/client/v4';
const freeDatabaseLimit = 10;

export function databaseNameForRange(rangeSlug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rangeSlug ?? '')) {
    throw new Error('Range slug must use lowercase letters, digits and internal hyphens.');
  }
  return `jagports-${rangeSlug}`;
}

function assertAccountId(accountId) {
  if (!/^[0-9a-f]{32}$/i.test(accountId ?? '')) {
    throw new Error('Cloudflare account ID must be 32 hexadecimal characters.');
  }
}

function assertDatabase(database) {
  if (!database || typeof database.name !== 'string' || !/^[0-9a-f-]{36}$/i.test(database.uuid ?? '')) {
    throw new Error('Cloudflare returned an invalid D1 database identity.');
  }
}

async function readConfiguration(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function assertConfiguration(config, expected) {
  if (!config) return;
  if (config.rangeSlug !== expected.rangeSlug || config.databaseName !== expected.databaseName || config.accountId !== expected.accountId || !/^[0-9a-f-]{36}$/i.test(config.databaseId ?? '')) {
    throw new Error('Reviewed Range configuration does not match the requested Range/account.');
  }
}

async function requestD1({ accountId, token, fetchImpl, method = 'GET', body, page }) {
  const url = new URL(`${apiOrigin}/accounts/${accountId}/d1/database`);
  if (page) {
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '100');
  }
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json();
  if (!response.ok || payload.success !== true) {
    const codes = Array.isArray(payload.errors) ? payload.errors.map((item) => item.code).filter(Boolean).join(', ') : '';
    throw new Error(`Cloudflare D1 ${method} failed (HTTP ${response.status}${codes ? `; codes ${codes}` : ''}).`);
  }
  return payload;
}

async function listDatabases(options) {
  const databases = [];
  for (let page = 1; ; page += 1) {
    const payload = await requestD1({ ...options, page });
    if (!Array.isArray(payload.result)) throw new Error('Cloudflare returned an invalid D1 list.');
    databases.push(...payload.result);
    const totalPages = payload.result_info?.total_pages;
    if (Number.isInteger(totalPages) ? page >= totalPages : payload.result.length < 100) break;
    if (page >= 1000) throw new Error('Cloudflare D1 list exceeded the safety page limit.');
  }
  return databases;
}

export async function setupRangeDatabase({ mode, rangeSlug, accountId, accountPlan, token, fetchImpl = fetch, configDirectory = defaultConfigDirectory }) {
  const databaseName = databaseNameForRange(rangeSlug);
  const configPath = join(configDirectory, `${rangeSlug}.json`);
  const expected = { rangeSlug, databaseName, accountId };
  if (mode === 'plan') {
    return { mode, rangeSlug, databaseName, configPath, remoteChange: false };
  }
  if (mode !== 'create' && mode !== 'verify') throw new Error('Command must be plan, create or verify.');
  assertAccountId(accountId);
  if (!['free', 'paid'].includes(accountPlan)) throw new Error('--account-plan must be free or paid for remote operations.');
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is required for remote operations.');

  const config = await readConfiguration(configPath);
  assertConfiguration(config, expected);
  const databases = await listDatabases({ accountId, token, fetchImpl });
  const matching = databases.filter((database) => database.name === databaseName);
  if (matching.length > 1) throw new Error('Multiple Cloudflare databases have the expected name.');
  let database = matching[0];
  if (database) assertDatabase(database);
  if (config && (!database || database.uuid !== config.databaseId)) {
    throw new Error('Cloudflare database is missing or its ID differs from reviewed configuration.');
  }
  if (database && !config) {
    throw new Error('A database with this name already exists but has no reviewed configuration; refusing to adopt it.');
  }
  if (mode === 'verify' && !database) throw new Error('Range database does not exist.');

  let created = false;
  if (mode === 'create' && !database) {
    if (accountPlan === 'free' && databases.length >= freeDatabaseLimit) {
      throw new Error(`Workers Free D1 database limit (${freeDatabaseLimit}) is reached; refusing creation.`);
    }
    const payload = await requestD1({ accountId, token, fetchImpl, method: 'POST', body: { name: databaseName } });
    database = payload.result;
    assertDatabase(database);
    if (database.name !== databaseName) throw new Error('Cloudflare created a database with an unexpected name.');
    created = true;
    await mkdir(configDirectory, { recursive: true });
    await writeFile(configPath, `${JSON.stringify({ ...expected, databaseId: database.uuid }, null, 2)}\n`, { flag: 'wx' });
  }
  return {
    mode, rangeSlug, databaseName, databaseId: database.uuid, accountId, accountPlan,
    configPath, created, databaseCount: databases.length + (created ? 1 : 0),
    freeLimit: freeDatabaseLimit,
    freeSlotsIfOnFree: Math.max(0, freeDatabaseLimit - databases.length - (created ? 1 : 0)),
    remoteChange: created,
  };
}

function parseArguments(argv) {
  const [mode, ...remaining] = argv;
  const args = { mode };
  for (let index = 0; index < remaining.length; index += 2) {
    const flag = remaining[index];
    const value = remaining[index + 1];
    if (!value || !['--range', '--account-id', '--account-plan', '--confirm-name'].includes(flag) || args[flag]) {
      throw new Error('Usage: setup-range-db.mjs <plan|create|verify> --range <slug> [--account-id <id> --account-plan <free|paid>] [--confirm-name <derived-name> for create]');
    }
    args[flag] = value;
  }
  if (mode === 'create' && args['--confirm-name'] !== databaseNameForRange(args['--range'])) {
    throw new Error('Create requires --confirm-name matching the derived database name.');
  }
  if (mode !== 'create' && args['--confirm-name']) throw new Error('--confirm-name is only valid for create.');
  return { mode, rangeSlug: args['--range'], accountId: args['--account-id'], accountPlan: args['--account-plan'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await setupRangeDatabase({ ...parseArguments(process.argv.slice(2)), token: process.env.CLOUDFLARE_API_TOKEN });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
