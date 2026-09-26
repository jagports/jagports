import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseNameForRange } from './setup-range-db.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readRangeConfiguration(rangeSlug, configDirectory = path.join(directory, 'config')) {
  const databaseName = databaseNameForRange(rangeSlug);
  const config = JSON.parse(await readFile(path.join(configDirectory, `${rangeSlug}.json`), 'utf8'));
  if (config.rangeSlug !== rangeSlug || config.databaseName !== databaseName
      || !/^[0-9a-f]{32}$/i.test(config.accountId ?? '') || !uuid.test(config.databaseId ?? '')) {
    throw new Error(`Invalid reviewed D1 identity for Range ${rangeSlug}.`);
  }
  return config;
}

export async function readSourceRangeMap(filename = path.join(directory, 'source-range-map.json')) {
  const map = JSON.parse(await readFile(filename, 'utf8'));
  if (!Array.isArray(map.ranges) || !map.ranges.length) throw new Error('Empty source-to-Range map.');
  const groups = new Set(), slugs = new Set();
  for (const entry of map.ranges) {
    databaseNameForRange(entry.rangeSlug);
    if (slugs.has(entry.rangeSlug) || !Array.isArray(entry.sourceGroupIds) || !entry.sourceGroupIds.length) {
      throw new Error('Duplicate Range or empty source group in source-to-Range map.');
    }
    slugs.add(entry.rangeSlug);
    for (const id of entry.sourceGroupIds) {
      if (!/^\d+$/.test(id) || groups.has(id)) throw new Error('Invalid or duplicate source group ID.');
      groups.add(id);
    }
  }
  return map.ranges;
}

export function rangeForSource(source, ranges) {
  const ancestry = [source.model, ...(source.ancestorModelIds ?? [])];
  if (!ancestry.every(id => /^\d+$/.test(id))) throw new Error('Source model ancestry is incomplete.');
  const matches = ranges.filter(range => range.sourceGroupIds.some(id => ancestry.includes(id)));
  if (matches.length !== 1) throw new Error(`Source model ${source.model} has ${matches.length} approved Range matches.`);
  return matches[0].rangeSlug;
}

export function d1Client(config, token, fetchImpl = fetch) {
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is required for Range D1 publication.');
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}`;
  const request = async (suffix, method = 'GET', body) => {
    const response = await fetchImpl(`${url}${suffix}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(60000),
    });
    const payload = await response.json();
    if (!response.ok || payload.success !== true
        || (Array.isArray(payload.result) && payload.result.some(item => item.success === false))) {
      const codes = (payload.errors ?? []).map(error => error.code).filter(Boolean).join(', ');
      throw new Error(`Cloudflare D1 request failed (HTTP ${response.status}${codes ? `; codes ${codes}` : ''}).`);
    }
    return payload.result;
  };
  return {
    async verifyIdentity() {
      const remote = await request('');
      if (remote?.uuid !== config.databaseId || remote?.name !== config.databaseName) {
        throw new Error('Remote D1 identity differs from reviewed Range configuration.');
      }
    },
    async query(sql, params = []) {
      const result = await request('/query', 'POST', { sql, params: params.map(value => String(value)) });
      return result?.[0]?.results ?? [];
    },
    async batch(statements) {
      if (!statements.length) return;
      const result = await request('/query', 'POST', { batch: statements });
      if (!Array.isArray(result) || result.length !== statements.length) {
        throw new Error('Cloudflare D1 returned an incomplete batch result.');
      }
    },
  };
}

export async function verifyRangeSchema(client, config) {
  const rows = await client.query('SELECT range_slug,database_name,schema_version FROM range_identity');
  if (rows.length !== 1 || rows[0].range_slug !== config.rangeSlug
      || rows[0].database_name !== config.databaseName || rows[0].schema_version !== 1) {
    throw new Error('Range D1 schema identity is missing or disagrees with reviewed configuration.');
  }
}

export async function applyRangeSchema(config, token, fetchImpl = fetch) {
  const ranges = await readSourceRangeMap();
  if (!ranges.some(range => range.rangeSlug === config.rangeSlug)) {
    throw new Error(`Range ${config.rangeSlug} has no reviewed source-group mapping.`);
  }
  const client = d1Client(config, token, fetchImpl);
  await client.verifyIdentity();
  const tables = await client.query(`SELECT name FROM sqlite_master WHERE type='table'
    AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_cf_KV','d1_migrations')`);
  if (tables.length && !tables.some(row => row.name === 'range_identity')) {
    throw new Error('Range D1 is not empty and has no schema identity; refusing to adopt it.');
  }
  if (tables.some(row => row.name === 'range_identity')) {
    await verifyRangeSchema(client, config);
    return { rangeSlug: config.rangeSlug, databaseName: config.databaseName,
      databaseId: config.databaseId, schemaVersion: 1, reused: true };
  }
  const schema = await readFile(path.join(directory, 'schema.sql'), 'utf8');
  await client.query(schema);
  await client.query(`INSERT INTO range_identity(range_slug,database_name,schema_version)
    VALUES(?,?,1) ON CONFLICT(range_slug) DO NOTHING`, [config.rangeSlug, config.databaseName]);
  await verifyRangeSchema(client, config);
  return { rangeSlug: config.rangeSlug, databaseName: config.databaseName, databaseId: config.databaseId, schemaVersion: 1 };
}
