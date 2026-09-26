# VIEPS Application Functional Testing

## Purpose

Verify VIEPS application behaviour after the infrastructure and application deployment tasks have completed.

Cloudflare account, GitHub integration, Worker, D1, migration, and DNS setup tests belong to those task-specific procedures. This file contains VIEPS application-level functional tests plus verification that the deployed application is connected to the expected GitHub-to-Cloudflare deployment chain.

## Test environment

Use the verified deployment endpoint supplied by the deployment execution process. For local application checks, open Windows Terminal using PowerShell or Git Bash at:

```text
jagports/jagports/
```

## Public access test

Verify:

- application loads through the intended public endpoint;
- public/read functionality works without administrator authentication;
- public users cannot add stock;
- public users cannot modify stock;
- public stock mutation is rejected;
- unauthorized mutation requests return the intended denial response.

Use `curl.exe` in PowerShell or `curl` in Git Bash where HTTP verification is appropriate:

```text
curl.exe -i https://<verified-test-host>/
```

## Administrator test

**Current transitional implementation:** the Stock/Suitability Admin currently uses `ADMIN_TOKEN` / `x-admin-token`; its safe, non-mutating live test is Step 4 below. This is not the final login/session system.

The accepted administrator model is application-level username/password authentication with `parts@jagports.fi` as the initial administrator identity.

Do not execute this as passed until Issue #448 has been implemented, reviewed, tested, and merged.

After the authentication implementation is available, verify:

- administrator authentication succeeds with valid credentials supplied through the approved credential mechanism;
- invalid credentials are rejected;
- authenticated administrator can add stock;
- authenticated administrator can modify stock;
- public users remain unable to mutate stock.

Never put credentials in shell history, repository files, Issues, PRs, or execution records.

## Persistence test

After an authorized stock mutation:

1. read the resulting record;
2. verify the expected application result;
3. verify the corresponding D1 persistence through the D1 task procedure;
4. read the record again after the normal deployment/restart boundary;
5. confirm that the expected record remains available.

## Deployment chain verification

Also verify the deployment trace for the tested Worker version:

```text
GitHub commit
    -> Cloudflare build
    -> deployed Worker version
    -> active production version
```

Verify that the tested deployed Worker version can be traced to the intended GitHub commit, that the corresponding Cloudflare build completed successfully, that the Worker version was deployed, and that the expected version is the active production version for the tested environment.

This verifies deployment traceability and active-version selection; Cloudflare account, GitHub integration, Worker creation, D1 creation, and DNS setup remain covered by their task-specific procedures.


## Suitability release and test procedure (#633 / #641 / #877 / #895)

This section tests the reviewed Suitability Admin and upper public checkbox implementation. It distinguishes an automated implementation test from a live Worker/D1 deployment test. Use the existing pre-production Worker, not the separately reserved later production hostname.

**Current release boundary:** the public suitability reader is deliberately fixture-only and is disabled unless `ENABLE_SUITABILITY_FIXTURES=1`. Never set that flag or load synthetic occurrence fixtures in the shared remote D1 database. A normal deployed Worker without imported, published JEPC occurrence mappings must return an explicit **unavailable** response; it must not show synthetic positive fitment. The Admin UI can manage real imported descriptions only once the relevant importer has populated their immutable source records. Mapping a JEPC description in Admin does not by itself create an occurrence condition or publish fitment.

### Step 1 — Automated implementation tests; no Cloudflare credentials required

The repository's [VIEPS model integrity workflow](https://github.com/jagports/jagports/actions/workflows/integrity_parts-model.yml) runs the complete local migration chain, Admin authorization and audit tests, source-qualified fixture/API tests, and application regressions. The [existing browser evidence workflow](https://github.com/jagports/jagports/actions/workflows/vieps-browser-evidence.yml) uses a local, isolated browser API fixture—not live Jaguar data—to test the horizontal public checkboxes, checked-first ordering, Search Results/Parts Tree synchronization, one-page Admin mapping/history, EN/FI, 220px/320px mobile and emulated touch. Its `vieps-browser-evidence` artifact contains actual PNG screenshots. Download the latest **successful run for the exact tested commit**; an artifact download page is not a directly rendered PNG URL.

To repeat the deterministic tests on a Windows workstation with Node.js **24 or later**, run this from the root of an up-to-date checkout in **PowerShell**:

~~~powershell
git fetch origin
git switch main
git pull --ff-only origin main
Set-Location 4-Production/internet/cloudflare/workers/jagports
node --version
npm ci
npm test
npm run build
~~~

To recreate the browser screenshot evidence locally (optional; the workflow already runs it automatically):

~~~powershell
npm install --no-save --package-lock=false playwright@1.55.1
npx playwright install chromium
node scripts/browser-evidence.mjs
~~~

Inspect `browser-evidence/desktop-suitability-filter.png`, `desktop-suitability-fi.png`, `mobile-320-suitability-touch.png`, `admin-suitability-desktop.png`, and `admin-suitability-mobile-320.png`. Local fixtures and browser screenshots verify implementation behaviour, not the remote D1 migration ledger or active Worker version.

### Step 2 — Check the deployed site without credentials or mutations

Use the accepted pre-production endpoint `https://vieps.parts-5ec.workers.dev`. These PowerShell requests are read-only:

~~~powershell
$base = "https://vieps.parts-5ec.workers.dev"
curl.exe -i "$base/"
curl.exe -i "$base/api/health"
curl.exe -i "$base/stock-admin.html"
curl.exe -i "$base/api/admin/suitability"
curl.exe -i "$base/api/vieps/suitability"
curl.exe -i "$base/vieps-tailwind.css"
~~~

Expected outcomes for the **current fixture-isolated release**:

- `/` and `/stock-admin.html`: HTTP 200; the page contains the upper Suitability section and the Admin page's independent Suitability Categories section respectively.
- `/api/health`: HTTP 200 with `"ok":true` and `"database":"ok"`. This proves a basic D1 connection, **not** that the new migrations are applied.
- `/api/admin/suitability` without an Admin token: HTTP 401 and `"error_code":"authorization_required"`. An unprotected response is a failure.
- `/api/vieps/suitability` in normal pre-production configuration: HTTP 503 with `"state":"unavailable"`, `"fixture_mode":false` and `"reason":"normalized_suitability_not_published"`. This is intentional until a separately reviewed real JEPC consumer is published; 503 here alone is **not** evidence of a D1 migration failure.
- `/vieps-tailwind.css`: HTTP 200, nonempty CSS and a `text/css` response.

In the public browser UI, search for the **existing deployed-runtime fixture PART number** `MJB7703AA`. The ordinary PART/stock/Parts Tree and Applicable Models paths must remain usable when the Suitability filter reports unavailable. Do **not** expect the fixture-only Coupe/Convertible checkbox demo to be publicly active on this shared Worker. The browser evidence above tests that interaction without exposing synthetic fitment in production.

### Step 3 — Verify the active Worker and the remote D1 schema

This is an operator-only Cloudflare check. A GitHub merge, passing GitHub tests, public health response or successful GitHub Pages job does **not** establish the active Cloudflare Worker version or remote schema. The GitHub-to-Cloudflare deployed revision must be checked using the Cloudflare Worker build/version information per `deployment_Execution.md`; compare it with the reviewed `main` commit under test.

From the same Worker directory, when authenticated to the intended Cloudflare account, inspect **without mutating** remote state:

~~~powershell
npx wrangler whoami
Get-Content wrangler.toml
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 execute jagports --remote --command "SELECT name FROM sqlite_schema WHERE type='table' AND name IN ('applicability_source_description','applicability_description_mapping_revision','applicability_dimension_retirement','applicability_suitability_admin_audit') ORDER BY name;"
~~~

Check that the remote ledger lists both **applied** migrations `0019_suitability_description_mapping.sql` and `0020_suitability_admin.sql`; the SQL query must return all four listed tables. This read-only check is part of the [Worker/D1 upgrade procedure](../../../cloudflare/workers/jagports/Cloudflare_Worker_D1_Upgrade_Guide.md). If migrations are pending, use the separately authorized procedure there; do not create a new database or run arbitrary fixture SQL in remote D1.

Once the intended Worker version and D1 schema are verified, run the existing remote application and deployed-asset tests. From the Worker root in PowerShell:

~~~powershell
$env:VIEPS_BASE_URL = "https://vieps.parts-5ec.workers.dev"
npm run test:runtime
npm run verify:deployed-assets
Remove-Item Env:\VIEPS_BASE_URL
~~~

The runtime suite checks public UI, D1 health, canonical PART/search, fixture stock and unknown-PART handling. If it fails because expected stock fixtures are absent, inspect the **reviewed remote data migrations**; do not silently fabricate inventory. This suite currently does not exercise an imported JEPC suitability mapping.

### Step 4 — Admin access and actual mapping, without test writes to shared D1

Open `https://vieps.parts-5ec.workers.dev/stock-admin.html`. Use the current transitional application `ADMIN_TOKEN` in its **Authorization** field; this is not a GitHub or Cloudflare token. Successful authorization should reveal the separate **Suitability Categories** section. Inspect category/value EN/FI labels, source-description provenance (namespace, dataset, original language/text, group and locator), current mapping status and revision history. Do not record the token or paste it into an Issue/PR.

An empty source list is expected when the reviewed JEPC importer has not imported source descriptions. A live mutation/retirement test requires a **separately approved isolated preview D1** and an actual identifiable source row. Choose the row by its complete source identity, not by the word `Coupe` alone; add a proposed mapping with an evidence note, inspect read-back/history, and only mark a genuine imported JEPC description verified after independent evidence review. Never promote a synthetic fixture to a JEPC fact. A deployed Admin page alone does not certify that real JEPC fitment is available in the public filter.

### Step 5 — Recording and stop conditions

Record **actual** operator, date, exact URL, active Worker version/main commit, remote migration ledger, query output, runtime-test outcome, screenshots or Actions URLs, and deviations using `deployment_ExecutionTaskResultTemplate.md` in the relevant deployment Issue/PR comment. The test states are PASS, FAIL, BLOCKED or NOT RUN. Never mark the live deployment VERIFIED based solely on a browser screenshot, GitHub CI run, unauthenticated 401 or a health response. Do not include tokens.

If the execution environment lacks Cloudflare access or the live hostname is unreachable, label only the affected **remote verification** BLOCKED/NOT RUN and retain the independently passed local/CI evidence. The [post-main deployed-runtime workflow](https://github.com/jagports/jagports/actions/workflows/vieps-postdeploy-runtime.yml) runs after relevant `main` changes (or manual dispatch on `main`). It waits three minutes for the external Workers Build, retries the public health probe for a bounded period, then runs `npm run test:runtime` (including fixture-isolation 503 and unauthenticated-Admin 401 checks) and `npm run verify:deployed-assets`. It never applies remote migrations or uses an application Admin token. A passing job is **public runtime evidence**, not proof of an exact active Cloudflare revision or an applied remote D1 ledger; those still require the separate operator checks in Step 3. [Issue #633](https://github.com/jagports/jagports/issues/633) remains open until a post-deployment run has been verified.

## Failure classification

Use:

```text
PASS
FAIL
BLOCKED
NOT RUN
```

For a failure record the exact endpoint/operation, expected result, observed result, environment, and required corrective action in the relevant GitHub Issue/PR or execution record.

## Acceptance

Application testing is complete only when all of the following have been independently verified for the intended environment:

```text
Public Internet request
        |
        +--> application loads
        +--> public/read functionality succeeds
        +--> public stock mutation is rejected

Administrator
        |
        +--> authentication succeeds
        +--> authorized stock mutation succeeds
        +--> D1 data persists

Deployment trace
        |
        +--> GitHub commit
        +--> Cloudflare build
        +--> deployed Worker version
        +--> active production version
```
