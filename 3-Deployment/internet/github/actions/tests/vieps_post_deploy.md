# VIEPS post-deployment verification

`.github/workflows/vieps-post-deploy.yml` runs on every push to `main`, and supports manual dispatch on `main` after operational recovery. Ordinary PR tests remain local and do not set `VIEPS_BASE_URL`.

The job polls GitHub for up to 20 minutes for the latest `Workers Builds: vieps` check from the Cloudflare app on the exact workflow commit. A failed build, missing/timed-out build, API access failure or superseding `main` commit prevents a passing runtime claim. New runs cancel older runs. The job checks again after testing that the commit and successful build still match.

After successful deployment evidence, it runs the existing `npm run test:runtime` against `https://vieps.parts-5ec.workers.dev`. Requests have bounded timeouts. Tests verify health, catalogue responses, unknown-part behavior and exact fixture stock locations for numbered and descriptive identifiers. The job needs only GitHub contents/checks read permissions and public HTTP access; no Cloudflare credential or migration-write permission is supplied.

## Failure and recovery

- Deployment step fails: inspect the linked Cloudflare build. Missing builds may indicate branch/trigger configuration or a delayed build; no runtime success is claimed.
- Runtime step fails: inspect the failing endpoint/assertion. Missing columns, missing fixture parts and empty stock suggest checking remote D1 state; they do not independently prove migration drift.
- Superseded commit: use the run for current `main`; the public endpoint is shared and must not be attributed to an older checkout.
- After authorized migration or deployment recovery, rerun this workflow for current `main` using **Actions → VIEPS post-deployment verification → Run workflow**. No code commit is needed just to rerun verification.

Follow the [D1 upgrade runbook](../../../cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md#merged-worker--d1-upgrade-troubleshooting) for ledger, schema/data and operator verification. This workflow never applies migrations. Automatic migration application requires a separately reviewed policy.

## Evidence limits

The Cloudflare check provides commit/build evidence; the public endpoint has no commit-identity endpoint. Before/after checks reduce superseded-run attribution but cannot rule out out-of-band deployment or rollback. When closing deployment work, independently verify the active Worker version using the deployment runbook. Successful smoke tests do not prove that every remote migration is applied or that human-only acceptance criteria passed.

## Validation

Run `node --test .github/scripts/vieps-deployment-check.test.mjs` from the repository root. The PR workflow executes these deterministic gate tests without contacting production. Local mocked tests and manual live tests do not prove that the new push-triggered workflow has executed; record its first successful `main` run after review/merge before completing the CI work item.

GitHub references: [workflow triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [check-run API](https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference).
