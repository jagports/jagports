# VIEPS Deployment Execution

## Purpose

Orchestrate the actual VIEPS deployment by calling the task-specific deployment procedures. This file defines order and stop conditions; it does not duplicate the detailed Cloudflare, DNS, D1, or application-management procedures.

## Production-readiness boundary

Deployment readiness is only one part of overall VIEPS production readiness. Production-readiness assessment must distinguish **product/application readiness** from **deployment/infrastructure readiness** before individual deployment prerequisites are ranked.

Product/application readiness includes, as applicable:

- approved UI implementation;
- Parts Data Model implementation;
- JEPC data importer implementation;
- required backend/API/application behaviour;
- database/schema readiness;
- authentication/authorization implementation;
- automated tests and acceptance evidence;
- pre-production validation.

Deployment/infrastructure readiness includes, as applicable:

- Cloudflare account and GitHub integration;
- Worker deployment readiness;
- D1 deployment and migration readiness;
- DNS/FQDN architecture and production hostname configuration;
- production operational readiness and rollback capability.

A missing DNS/FQDN prerequisite is therefore a **specific production deployment prerequisite**, not by itself evidence that DNS is the primary or largest overall VIEPS production blocker. Do not rank an individual infrastructure prerequisite as the biggest blocker unless the complete current readiness/dependency picture supports that conclusion.

Pre-production validation may use the accepted Cloudflare-provided Workers hostname documented below. Production custom-domain/DNS work must not block or distort the priority of application implementation and pre-production validation when the accepted `workers.dev` endpoint is sufficient.

This deployment procedure begins only when the applicable implementation and validation prerequisites for the intended environment are ready to execute. Successful completion of P1-P10 does not retroactively prove missing product/application requirements complete.

## Execution environment

Open Windows Terminal using PowerShell or Git Bash at the Jagports repository root:

```text
jagports/jagports/
```

Required tooling:

```text
node --version
npm --version
npx wrangler --version
```

Use the intended Cloudflare account. Never put credentials or secret values in commands, files, or logs.

## Execution order

### P1 — Cloudflare account

Follow:

`3-Deployment/internet/cloudflare/CloudFlare_Account_Setup.md`

Account creation/member/2FA operations are UI/account operations. Use CLI for Wrangler authentication where supported.

Verify:

```text
npx wrangler whoami
```

Stop if the intended account/operator cannot be verified.

### P2 — GitHub integration

Follow:

`3-Deployment/internet/cloudflare/CloudFlare_GitHub_Integration_Setup.md`

The initial GitHub App authorization is UI-required. Later Workers Builds automation may use the documented API where an actual automation step requires it.

Verify the repository connection before relying on Git-integrated deployment.

### P3 — Worker deployment

Follow:

`3-Deployment/internet/cloudflare/workers/jagports/CloudFlareGit_App_Deployment.md`

The VIEPS Worker contains generated frontend assets. Therefore the Worker deployment path must restore the locked dependencies and run the project-defined build before Wrangler publishes `public/`.

From the Worker root:

```text
npm ci
npm run build
npx wrangler deploy --dry-run
```

For normal Git-integrated deployment, verify that the remote Workers Builds trigger matches repository policy before relying on it:

```text
node 3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs --check
```

Production should normally flow through reviewed `main` -> Workers Builds build command -> deploy command. The current VIEPS contract is `npm ci && npm run build` before `npx wrangler deploy`.

Use direct deployment only as an explicitly recorded fallback/bootstrap operation. Direct deployment must use the same build contract:

```text
npm ci
npm run deploy
```

After deployment, verify the generated stylesheet directly:

```text
npm run verify:deployed-assets
```

Stop P3 if the generated asset is absent/empty, its deployed URL is not successful with the expected content type, or the rendered application is unstyled. A successful Wrangler/Workers deployment alone is not sufficient P3 verification.

### P4 — D1 database

Follow:

`3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Deployment.md`

Verify the intended database exists before creating one. Never create a duplicate merely because a deployment is being repeated.

### P5 — D1 migration

Follow:

`3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md`

Worker migration source:

`4-Production/internet/cloudflare/workers/jagports/migrations/`

Inspect production state before apply and verify it after apply:

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
npx wrangler d1 migrations list jagports --remote
```

Do not recreate the database for a new migration.

### P6 — Preview/development validation

For non-production branches use the configured preview build/version mechanism. Keep production on `main`.

Preview deployment must also run the project build first:

```text
npm ci
npm run build
npx wrangler versions upload
```

Use separate preview D1 state where configured. Preview state is not production evidence.

### P7 — VIEPS application testing

Use:

`3-Deployment/internet/jagports/solution/vieps/SetupTesting.md`

The functional tests cover public/read access, unauthorized stock mutation, administrator authentication/mutation after Issue #448 is implemented, and persistence.

### P8 — Pre-Production DNS/address

Follow:

`3-Deployment/internet/dns/hosting/jagports/setupPre-ProductionAddress.md`

Implementation procedure:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress.md`

Before any create/enable operation, run the prerequisite/state test:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md`

The accepted pre-production endpoint must be established from actual Cloudflare deployment evidence. Do not infer the account subdomain from the Worker name.

### P9 — Production DNS/address

Follow:

`3-Deployment/internet/dns/hosting/jagports/setupProductionAddress.md`

Requirement:

`5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md`

Target:

```text
vieps.jagports.fi
```

Production DNS/address execution is separate from pre-production Workers hostname setup.

### P10 — Worker management

After deployment, use:

`4-Production/internet/cloudflare/workers/jagports/Management_Tasks.md`

Operational management is not duplicated here.

## Verification rule

Each task must independently reach:

```text
EXECUTED -> VERIFIED
```

A preceding successful task does not prove a later task. `BLOCKED`, `FAIL`, or `NOT RUN` is not success.

For P3 specifically, Worker deployment success does not prove generated frontend assets exist, and generated frontend asset success does not prove D1 migration state. Verify each boundary independently.

Use CLI/API first. Use UI only where no supported programmatic operation is available.

## Execution task result record

Use the single VIEPS execution task result template for **every actual P1–P10 execution-task result**:

`3-Deployment/internet/jagports/solution/vieps/deployment_ExecutionTaskResultTemplate.md`

The template is the required minimum record structure, not merely a reference example. Copy/use its fields in the relevant GitHub Issue or Pull Request comment for each actual task result.

At minimum, each record must identify the date/time, operator, task, environment, resource, interface, command/dashboard path, expected result, observed result, status, verification evidence, and any deviation/decision.

Record actual execution evidence in the relevant GitHub Issue/PR and execution record. Do not maintain a duplicate task-tracking system in deployment Markdown.

Historical Issue/PR comments must not be rewritten merely to retrofit this template. The requirement applies to subsequent execution records.

## Credentials

Never record passwords, password hashes, recovery codes, API tokens, GitHub credentials, Cloudflare secrets, or secret values. Retrieve operational credentials through the approved credential/secret system at execution time.
