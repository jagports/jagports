# Jagports Cloudflare Git Integrated Application Deployment — Execution Orchestrator

## Purpose

This file coordinates the actual VIEPS Cloudflare deployment work. Detailed instructions are kept in task-specific documents so Worker, D1, account, GitHub integration, testing, and management procedures can be repeated independently.

## Procedure index

Start here:

`3-Deployment/internet/cloudflare/README.md`

Account:

`3-Deployment/internet/cloudflare/account/Jagports_CloudFlare_Account_Setup.md`

GitHub integration:

`3-Deployment/internet/cloudflare/github/Jagports_CloudFlare_GitHub_Integration_Setup.md`

Worker:

`3-Deployment/internet/cloudflare/workers/jagports/Jagports_CloudFlareGit_App_Deployment.md`

D1:

`3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Deployment.md`

D1 migrations:

`3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Migrations.md`

VIEPS testing:

`3-Deployment/internet/jagports/solution/vieps/SetupTesting.md`

VIEPS setup management:

`3-Deployment/internet/jagports/solution/vieps/SetupManagement.md`

Execution-record format:

`3-Deployment/internet/jagports/solution/vieps/SetupDocumentationRecordFormat.md`

Production Worker management:

`4-Production/internet/cloudflare/workers/jagports/vieps/VIEPS_Management_Tasks.md`

Application FQDN requirement:

`5-Implementation-Projects/base/application-platform/application/jagports/vieps/FQDN_requirements.md`

## Execution order

### P1 — Cloudflare account

Follow the account procedure.

Result required:

```text
EXECUTED -> VERIFIED
```

### P2 — Wrangler authentication

Open Windows Terminal with PowerShell or Git Bash at the repository root:

```text
jagports/jagports/
```

Run:

```text
npx wrangler login
npx wrangler whoami
```

The browser authentication flow is expected for `wrangler login`.

Verify that `whoami` identifies the intended Cloudflare account/operator.

### P3 — GitHub integration

Follow the GitHub integration procedure.

The initial Cloudflare Workers & Pages GitHub App installation is UI-required. There is no Wrangler command replacing that operation.

After the one-time installation, Cloudflare's Workers Builds API can automate repository connections, triggers, environment variables, build triggering, build listing, and logs.

API reference:

https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/

### P4 — Worker configuration/deployment

Follow the Worker procedure from the index.

CLI validation from the repository root:

```text
npx wrangler deploy --dry-run
```

Production deployment fallback, only when the Git-integrated path is unavailable:

```text
npx wrangler deploy
```

Preferred production path:

```text
reviewed PR
    -> merge to main
    -> Workers Build
    -> npx wrangler deploy
    -> production Worker
```

### P5 — D1 resource

Follow the D1 procedure.

Creation, only when the database does not already exist:

```text
npx wrangler d1 create jagports
```

Before changing production configuration, verify the returned database ID belongs to the intended Cloudflare account/database.

### P6 — D1 migration

Follow the separate migration procedure.

Inspect:

```text
npx wrangler d1 migrations list jagports --remote
```

Apply reviewed migrations:

```text
npx wrangler d1 migrations apply jagports --remote
```

Verify again:

```text
npx wrangler d1 migrations list jagports --remote
```

Migration review and application are separate from database creation. Do not recreate the database for every migration.

### P7 — Preview/development deployment

Enable non-production branch builds in Cloudflare when preview testing is required.

For a preview version:

```text
npx wrangler versions upload
```

Cloudflare Workers Builds uses the preview deploy command for non-production branches and can provide a preview URL when supported.

Branch-control UI path:

**Workers & Pages -> Worker -> Settings -> Build -> Branch control**

Configure:

- production branch: `main`;
- non-production branch builds: enabled when needed.

### P8 — VIEPS application testing

Follow:

`3-Deployment/internet/jagports/solution/vieps/SetupTesting.md`

The minimum test set is:

```text
public application loads
public/read functionality works
public stock mutation is denied
administrator authentication works only after #448 is merged
administrator stock mutation works only after #448 is merged
D1 persistence is verified
GitHub -> Cloudflare build -> Worker version is verified
```

### P9 — Production endpoint

Required hostname:

```text
vieps.jagports.fi
```

Current state: **BLOCKED** until the supported Cloudflare/DNS architecture is selected.

Do not mark the endpoint verified through a `workers.dev` test or by DNS resolution alone.

The current Cloudflare documentation requires an active Cloudflare zone for a Custom Domain. Worker Routes require a DNS record proxied through Cloudflare.

References:

https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
https://developers.cloudflare.com/workers/configuration/routing/routes/

### P10 — Production management

After deployment, use:

`4-Production/internet/cloudflare/workers/jagports/vieps/VIEPS_Management_Tasks.md`

Do not put operational task history into the deployment procedure.

## CLI/API/UI rule

Use CLI/API first where the supported operation exists.

Use UI where Cloudflare requires dashboard/account interaction and no supported CLI/API replacement is being used.

Do not invent commands.

For every task record:

```text
command or UI path
result
verification
status
```

Use the execution record format:

`3-Deployment/internet/jagports/solution/vieps/SetupDocumentationRecordFormat.md`

## Credentials

Never record:

- passwords;
- password hashes;
- recovery codes;
- Cloudflare API tokens;
- GitHub credentials;
- Cloudflare secrets;
- secret values.

Store operational credentials only in the approved credential/secret system.

## Traceability

GitHub Issues and Pull Requests are the authoritative traceability system.

Do not maintain a second Issue/PR tracking table in deployment Markdown.

## Current architectural decisions

- VIEPS is a public Internet application.
- Public/read access does not require whole-application Cloudflare Access.
- Stock add/modify requires application-level administrator authorization.
- Initial administrator identity is `parts@jagports.fi`.
- No Google/Microsoft external IdP is selected at this stage.
- D1 is a separate operational resource from the Worker.
- `vieps.jagports.fi` remains a deployment blocker until the DNS/Cloudflare architecture is resolved.

## Status boundary

This repository change documents procedures and execution orchestration. It does **not** claim that the Cloudflare account, Worker, D1 database, GitHub integration, secrets, DNS, administrator authentication, or production deployment has been executed.

Live execution must be recorded only after the operator actually performs and verifies the operation.

## Traceability

**Implements**

[Issue #446 — Document Cloudflare Git integration and D1 deployment procedure](https://github.com/jagports/jagports/issues/446)

**Related**

[PR #445 — Split Cloudflare Worker and D1 deployment documentation](https://github.com/jagports/jagports/pull/445)

[Issue #448 — Implement public VIEPS access with administrator stock authorization](https://github.com/jagports/jagports/issues/448)
