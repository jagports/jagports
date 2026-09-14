import test from 'node:test';
import assert from 'node:assert/strict';
import { deploymentState, waitForDeployment } from './vieps-deployment-check.mjs';

const sha = 'a'.repeat(40);
const run = (overrides = {}) => ({ id: 1, head_sha: sha, name: 'Workers Builds: vieps',
  app: { slug: 'cloudflare-workers-and-pages' }, status: 'completed', conclusion: 'success', ...overrides });

test('only the matching commit, Worker and Cloudflare app establish deployment', () => {
  for (const other of [run({ head_sha: 'b'.repeat(40) }), run({ name: 'model' }), run({ app: { slug: 'github-actions' } })]) {
    assert.equal(deploymentState([other], sha).state, 'waiting');
  }
  assert.equal(deploymentState([run()], sha).state, 'success');
});
test('a newer failed or queued build supersedes earlier success', () => {
  assert.equal(deploymentState([run(), run({ id: 2, conclusion: 'failure' })], sha).state, 'failed');
  assert.equal(deploymentState([run(), run({ id: 2, status: 'queued', conclusion: null })], sha).state, 'waiting');
});
test('waits for completion before permitting runtime testing', async () => {
  let reads = 0;
  let pauses = 0;
  const result = await waitForDeployment({ sha, readMain: async () => sha,
    readChecks: async () => ++reads === 1 ? [] : [run()], pause: async () => pauses++ });
  assert.equal(result.id, 1);
  assert.equal(pauses, 1);
});
test('missing, failed and superseded deployments fail closed', async () => {
  const options = { sha, readMain: async () => sha, readChecks: async () => [], attempts: 1 };
  await assert.rejects(waitForDeployment(options), /DEPLOYMENT NOT VERIFIED/);
  await assert.rejects(waitForDeployment({ ...options, readChecks: async () => [run({ conclusion: 'failure' })] }), /DEPLOYMENT FAILED/);
  await assert.rejects(waitForDeployment({ ...options, readMain: async () => 'newer' }), /SUPERSEDED/);
});
test('API failure cannot be reported as a passing deployment', async () => {
  await assert.rejects(waitForDeployment({ sha, readMain: async () => { throw new Error('HTTP 403'); }, readChecks: async () => [run()] }), /HTTP 403/);
});
