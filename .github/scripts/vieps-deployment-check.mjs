import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

export function deploymentState(runs, sha) {
  const matching = runs.filter(run => run.head_sha === sha &&
    run.name === 'Workers Builds: vieps' && run.app?.slug === 'cloudflare-workers-and-pages');
  const latest = matching.sort((a, b) => b.id - a.id)[0];
  if (!latest || latest.status !== 'completed') return { state: 'waiting' };
  return { state: latest.conclusion === 'success' ? 'success' : 'failed', run: latest };
}

export async function waitForDeployment({ sha, readMain, readChecks, pause = sleep, attempts = 80 }) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (await readMain() !== sha) throw new Error('SUPERSEDED: main changed; do not attribute live results to this commit. Run the workflow for current main.');
    const result = deploymentState(await readChecks(), sha);
    if (result.state === 'success') return result.run;
    if (result.state === 'failed') throw new Error(`DEPLOYMENT FAILED: ${result.run.conclusion}; ${result.run.details_url}`);
    if (attempt + 1 < attempts) await pause(15000);
  }
  throw new Error('DEPLOYMENT NOT VERIFIED: no successful matching Cloudflare build within 20 minutes. Inspect Workers Builds before runtime testing.');
}

async function main() {
  const { GITHUB_REPOSITORY: repository, GITHUB_SHA: sha, GITHUB_TOKEN: token } = process.env;
  if (!repository || !/^[a-f0-9]{40}$/.test(sha ?? '') || !token) throw new Error('Missing GitHub repository, commit or token.');
  async function get(path) {
    // Space every GitHub request, including pagination and before/after checks.
    await sleep(350);
    const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`GitHub verification API failed: HTTP ${response.status}`);
    return response.json();
  }
  const readMain = async () => (await get('git/ref/heads/main')).object.sha;
  const readChecks = async () => {
    const runs = [];
    for (let page = 1; ; page++) {
      const data = await get(`commits/${sha}/check-runs?per_page=100&filter=all&page=${page}`);
      runs.push(...data.check_runs);
      if (data.check_runs.length < 100) return runs;
    }
  };
  const run = await waitForDeployment({ sha, readMain, readChecks, attempts: process.argv.includes('--verify') ? 1 : 80 });
  const evidence = `Cloudflare build verified for ${sha}: ${run.details_url}`;
  console.log(evidence);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${evidence}\n\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
