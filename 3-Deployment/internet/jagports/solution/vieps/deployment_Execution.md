# VIEPS Deployment Execution

## Purpose

Orchestrate the actual VIEPS deployment by calling the task-specific deployment procedures. This file defines order and stop conditions; it does not duplicate the detailed Cloudflare, DNS, D1, or application-management procedures.

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

Run from the repository root:

```text
npx wrangler deploy --dry-run
```

Production should normally flow through reviewed `main` -> Workers Builds -> deployment. Use direct `npx wrangler deploy` only as an explicitly recorded fallback/bootstrap operation.

### P4 — D1 database

Follow:

`3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Deployment.md`

Verify the intended database exists before creating one. Never create a duplicate merely because a deployment is being repeated.

### P5 — D1 migration

Follow:

`3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md`

Migration source:

`4-Production/internet/cloudflare/d1/jagports/vieps/migrations/`

Inspect production state before apply and verify it after apply:

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
npx wrangler d1 migrations list jagports --remote
```

Do not recreate the database for a new migration.

### P6 — Preview/development validation

For non-production branches use the configured preview build/version mechanism. Keep production on `main`.

```text
npx wrangler versions upload
```

Use separate preview D1 state where configured. Preview state is not production evidence.

### P7 — VIEPS application testing

Use:

`3-Deployment/internet/jagports/solution/vieps/SetupTesting.md`

The functional tests cover public/read access, unauthorized stock mutation, administrator authentication/mutation after Issue #448 is implemented, and persistence.

### P8 — Production DNS/address

Follow:

`3-Deployment/internet/dns/hosting/jagports/setupProductionAddress.md`

Requirement:

`5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md`

Target:

```text
vieps.jagports.fi
```

Current state: **BLOCKED** until the supported Cloudflare/DNS architecture is available. Do not treat a `workers.dev` URL or DNS lookup alone as production endpoint verification.

### P9 — Production management

After deployment, use:

`4-Production/internet/cloudflare/workers/jagports/vieps/Management_Tasks.md`

Operational management is not duplicated here.

## Verification rule

Each task must independently reach:

```text
EXECUTED -> VERIFIED
```

A preceding successful task does not prove a later task. `BLOCKED`, `FAIL`, or `NOT RUN` is not success.

Use CLI/API first. Use UI only where no supported programmatic operation is available.

## Execution record

Use the single common template:

`3-Deployment/internet/solution/jagports/ExecutionRecordTemplate.md`

Record actual execution evidence in the relevant GitHub Issue/PR and execution record. Do not maintain a duplicate task-tracking system in deployment Markdown.

## Credentials

Never record passwords, password hashes, recovery codes, API tokens, GitHub credentials, Cloudflare secrets, or secret values. Retrieve operational credentials through the approved credential/secret system at execution time.

## Current architectural blocker

`vieps.jagports.fi` remains intentionally blocked until DNS/Cloudflare deployment architecture is resolved. Do not remove this blocker from the execution plan before the prerequisite is actually verified.
