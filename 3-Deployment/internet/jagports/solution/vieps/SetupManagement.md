# VIEPS Deployment Setup Management

## Purpose

Define how VIEPS deployment setup is managed as a sequence of independently executable and verifiable tasks.

This document coordinates the solution-level deployment work. It does not replace the detailed Cloudflare account, GitHub integration, Worker, D1, migration, or testing procedures.

## Task sequence

### P1 — Cloudflare account

Execute:

`3-Deployment/internet/cloudflare/account/Jagports_CloudFlare_Account_Setup.md`

Verify:

- account exists;
- intended owner/operator can authenticate;
- 2FA is enabled.

### P2 — GitHub integration

Execute:

`3-Deployment/internet/cloudflare/github/Jagports_CloudFlare_GitHub_Integration_Setup.md`

Verify:

- `jagports/jagports` is connected;
- production branch is `main`;
- Worker builds are configured.

### P3 — Worker deployment

Execute the Worker procedure from the Cloudflare deployment documentation.

Verify:

- Worker configuration passes dry-run;
- Worker version is created;
- expected deployment is active in the intended environment.

### P4 — D1 database

Execute the D1 deployment procedure.

Verify:

- intended D1 database exists;
- production Worker binding points to it.

### P5 — D1 migrations

Execute:

`3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Migrations.md`

Verify:

- reviewed migrations are applied;
- remote migration state is correct.

### P6 — DNS/endpoint

Execute only after the accepted endpoint architecture is available.

Target:

`vieps.jagports.fi`

Current state: **BLOCKED** until the Cloudflare/DNS architecture is resolved.

### P7 — VIEPS application testing

Execute:

`3-Deployment/internet/jagports/solution/vieps/SetupTesting.md`

Verify:

- public/read access;
- administrator-only stock mutation;
- persistence;
- deployment chain.

## Management rule

A task is not considered complete because a preceding task succeeded.

Each task requires its own:

```text
EXECUTED -> VERIFIED
```

state transition.

A blocked prerequisite remains `BLOCKED` and must not be represented as verified.

## CLI-first rule

For every task, use the supported CLI/API command when one exists and use UI only where the supported API/CLI path does not provide the required operation.

Document the exact command and the UI path in the task-specific procedure.

## Traceability

GitHub Issues and Pull Requests are the task traceability system.

Do not maintain duplicate Issue/PR traceability lists in this document.

Use GitHub to record:

- implementation;
- review;
- test result;
- decision;
- blocker;
- completion.
