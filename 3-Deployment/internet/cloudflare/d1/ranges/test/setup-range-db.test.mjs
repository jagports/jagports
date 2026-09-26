import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { databaseNameForRange, setupRangeDatabase } from '../setup-range-db.mjs';

const accountId = 'a'.repeat(32);
const databaseId = '12345678-1234-1234-1234-123456789abc';
const token = 'test-token';

async function configDirectory() {
  return mkdtemp(join(tmpdir(), 'jagports-range-db-'));
}

function response(result, resultInfo) {
  return { ok: true, status: 200, json: async () => ({ success: true, result, result_info: resultInfo }) };
}

test('Range names are derived and invalid slugs are refused', () => {
  assert.equal(databaseNameForRange('xk'), 'jagports-xk');
  assert.equal(databaseNameForRange('f-type'), 'jagports-f-type');
  for (const slug of ['XK', '../xk', 'xk_', '-xk', 'xk--s']) {
    assert.throws(() => databaseNameForRange(slug));
  }
});

test('plan never calls Cloudflare or writes configuration', async () => {
  const result = await setupRangeDatabase({ mode: 'plan', rangeSlug: 'xk', fetchImpl: () => { throw new Error('network used'); }, configDirectory: await configDirectory() });
  assert.equal(result.databaseName, 'jagports-xk');
  assert.equal(result.remoteChange, false);
});

test('create writes the returned ID and a repeat run reuses the exact database', async () => {
  const dir = await configDirectory();
  const calls = [];
  let exists = false;
  const fetchImpl = async (_url, options) => {
    calls.push(options.method);
    if (options.method === 'POST') {
      assert.deepEqual(JSON.parse(options.body), { name: 'jagports-xk' });
      exists = true;
      return response({ name: 'jagports-xk', uuid: databaseId });
    }
    return response(exists ? [{ name: 'jagports-xk', uuid: databaseId }] : []);
  };
  const options = { mode: 'create', rangeSlug: 'xk', accountId, accountPlan: 'free', token, fetchImpl, configDirectory: dir };
  const first = await setupRangeDatabase(options);
  assert.equal(first.created, true);
  assert.equal(first.freeSlotsIfOnFree, 9);
  assert.deepEqual(JSON.parse(await readFile(join(dir, 'xk.json'), 'utf8')), {
    rangeSlug: 'xk', databaseName: 'jagports-xk', accountId, databaseId,
  });
  const second = await setupRangeDatabase(options);
  assert.equal(second.created, false);
  assert.deepEqual(calls, ['GET', 'POST', 'GET']);
});

test('existing unconfigured database and mismatched reviewed ID are refused', async () => {
  const dir = await configDirectory();
  const fetchImpl = async () => response([{ name: 'jagports-xk', uuid: databaseId }]);
  const options = { mode: 'create', rangeSlug: 'xk', accountId, accountPlan: 'free', token, fetchImpl, configDirectory: dir };
  await assert.rejects(setupRangeDatabase(options), /no reviewed configuration/);
  await writeFile(join(dir, 'xk.json'), JSON.stringify({ rangeSlug: 'xk', databaseName: 'jagports-xk', accountId, databaseId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }));
  await assert.rejects(setupRangeDatabase(options), /ID differs/);
});

test('configured database missing remotely is not recreated', async () => {
  const dir = await configDirectory();
  await writeFile(join(dir, 'xk.json'), JSON.stringify({ rangeSlug: 'xk', databaseName: 'jagports-xk', accountId, databaseId }));
  let post = false;
  const fetchImpl = async (_url, options) => { post ||= options.method === 'POST'; return response([]); };
  await assert.rejects(setupRangeDatabase({ mode: 'create', rangeSlug: 'xk', accountId, accountPlan: 'free', token, fetchImpl, configDirectory: dir }), /missing/);
  assert.equal(post, false);
});

test('Workers Free capacity is checked before creation', async () => {
  let post = false;
  const fetchImpl = async (_url, options) => {
    post ||= options.method === 'POST';
    return response(Array.from({ length: 10 }, (_, index) => ({ name: `other-${index}`, uuid: databaseId })));
  };
  await assert.rejects(setupRangeDatabase({ mode: 'create', rangeSlug: 'xk', accountId, accountPlan: 'free', token, fetchImpl, configDirectory: await configDirectory() }), /limit/);
  assert.equal(post, false);
});
