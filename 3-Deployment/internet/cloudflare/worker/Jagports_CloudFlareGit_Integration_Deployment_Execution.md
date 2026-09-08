# Jagports Cloudflare Git Integrated Application Deployment — Execution Plan

## Purpose

This document is the execution companion for the Cloudflare Git-integrated Jagports application deployment.

It converts the deployment procedure into an operator sequence that explicitly distinguishes **UI**, **CLI**, and **VERIFY** actions.

The reusable deployment procedure remains in:

`3-Deployment/internet/cloudflare/worker/Jagports_CloudFlareGit_Integration_Deployment.md`

## Current execution state

No live Cloudflare environment operation is claimed by this repository change.

The actual setup must be executed against the intended Cloudflare account and recorded after the operator has authenticated to the target environment.

Status vocabulary:

```text
RESEARCHED  = procedure checked against current documentation
EXECUTED    = operation actually performed
VERIFIED    = resulting state independently checked
BLOCKED     = required access, capability, or prerequisite unavailable
```

## Execution sequence

### 1. Cloudflare account and security

**UI**

1. Create or identify the Jagports Cloudflare account.
2. Verify the account email.
3. Enable 2FA.
4. Identify the durable account owner/administrator.
5. Add individual members with least-privilege roles.
6. Store recovery information in the approved credential store.

**CLI**

No Wrangler command is used for initial account creation, account-member administration, or enabling user 2FA. These are account-management operations and should be marked **UI-required** unless an explicitly supported Cloudflare API/automation path is adopted by Jagports.

**VERIFY**

Confirm through the Cloudflare dashboard that the account is verified, 2FA is enabled, and required members/roles exist.

### 2. Wrangler authentication

**CLI**

```text
npx wrangler login
npx wrangler whoami
```

`wrangler login` authenticates the operator. `wrangler whoami` verifies the identity used by Wrangler.

**VERIFY**

Confirm the authenticated identity is the intended deployment operator. Authentication success is not proof that all required deployment permissions are available.

### 3. GitHub-to-Cloudflare integration

**UI**

1. Open Cloudflare Workers & Pages.
2. Create/import the Worker from Git.
3. Connect the GitHub account/organization.
4. Authorize the Cloudflare GitHub App for `jagports`.
5. Restrict repository access to `jagports/jagports` where supported.
6. Select `jagports/jagports`.
7. Configure the Worker root and deployment commands.

**CLI**

There is no Wrangler command that replaces the Workers Builds GitHub repository connection. Do not invent a CLI equivalent.

**VERIFY**

Confirm the connected repository is exactly `jagports/jagports` and the production branch is `main`.

### 4. Worker configuration

**Repository source**

```text
4-Production/base/application-platform/application/jagports/
```

**Expected Workers Builds configuration**

```text
Worker name:             jagports
Production branch:       main
Root directory:          4-Production/base/application-platform/application/jagports/
Build command:           empty unless a build step is introduced
Deploy command:          npx wrangler deploy
Preview deploy command:  npx wrangler versions upload
```

**CLI verification**

After Wrangler authentication:

```text
npx wrangler deploy --dry-run
```

A dry run is configuration/package validation only and must not be represented as a production deployment.

**VERIFY**

Confirm Worker name, source root, branch, bindings and deployment settings in Cloudflare.

### 5. D1 database

**CLI**

Create the database only if it does not already exist:

```text
npx wrangler d1 create jagports
```

Record the returned database identifier in the intended configuration change. Never record credentials.

**UI alternative**

Cloudflare Dashboard -> D1 -> create or inspect the `jagports` database.

**VERIFY**

Confirm database name and ID before changing the production binding.

### 6. Production D1 binding

The production configuration is:

`4-Production/base/application-platform/application/jagports/wrangler.toml`

The binding must use the real production database ID. The current placeholder is:

```text
database_id = "REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID"
```

This placeholder must not be deployed as the production configuration.

**VERIFY**

Confirm the configured ID belongs to the intended production database and account.

### 7. D1 migrations

**CLI**

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
```

Review migrations before applying them.

**VERIFY**

Run the migration-list command again and confirm the intended migrations are applied. Record migration status only; never record credentials.

### 8. Application secret

The application expects:

```text
ADMIN_TOKEN
```

**CLI**

```text
npx wrangler secret put ADMIN_TOKEN
```

The value must never be placed in GitHub content, Issues, Pull Requests, documentation, scripts, or logs.

**UI alternative**

Cloudflare Worker -> Settings -> Variables and Secrets -> add the encrypted `ADMIN_TOKEN` secret.

**VERIFY**

Confirm the secret exists by name/configuration state only. Never expose its value.

### 9. Cloudflare Access

**UI**

1. Enable/use Cloudflare Zero Trust as required.
2. Create the Access application for the deployed Worker endpoint.
3. Configure the intended identity provider.
4. Define permitted users/groups.
5. Apply the policy before exposing real inventory data.

**CLI**

No Wrangler command replaces Access application/policy configuration. Mark this **UI-required** unless a separate approved Cloudflare API/IaC procedure is adopted.

**VERIFY**

- Unauthenticated request is rejected.
- Authorized request reaches the application.
- Access policy does not unintentionally expose the application.

### 10. Preview deployment

**CLI / Workers Builds**

For a non-production branch:

```text
npx wrangler versions upload
```

**VERIFY**

Confirm the preview version is not promoted as production and test it before merge where preview builds are enabled.

### 11. Production deployment

**Preferred path: Workers Builds triggered by GitHub**

```text
Pull Request
    -> review
    -> merge to main
    -> Cloudflare Workers Build
    -> npx wrangler deploy
    -> production Worker
```

**CLI fallback**

```text
npx wrangler deploy
```

Use direct CLI deployment only for controlled bootstrap/troubleshooting when the Git-integrated path cannot yet perform the deployment. Record the reason.

**VERIFY**

Confirm GitHub and Cloudflare show the intended commit/build/version and that the expected production Worker version is active.

### 12. Application verification

**VERIFY**

At minimum verify:

```text
Access rejects unauthenticated request
        |
        v
Authorized request reaches Worker
        |
        +--> application loads
        +--> health check succeeds
        +--> part lookup succeeds
        +--> authorized stock CRUD succeeds
        +--> D1 data persists
```

Also verify:

```text
GitHub commit
    -> Cloudflare build
    -> deployed Worker version
    -> active production version
```

### 13. Rollback readiness

**CLI / Cloudflare deployment controls**

Worker code rollback uses a known-good Worker version/deployment. D1 schema rollback is a separate operation.

Do not assume a Worker rollback reverses a D1 migration.

**VERIFY**

Where operationally safe, perform a rollback/recovery test before declaring the deployment operationally complete.

## UI versus CLI rule

Use a CLI command only when the command is actually supported by the relevant Cloudflare tooling.

Use **UI-required** when the operation is dashboard/account configuration and no supported Wrangler command replaces it.

Do not replace a missing CLI capability with an invented command.

## Actual execution record

Populate this section during the real setup.

```text
Date/time:
Operator:
Environment: production
Operation:
Interface: UI | CLI
Status: RESEARCHED | EXECUTED | VERIFIED | BLOCKED
Command / dashboard action:
Result:
Verification:
Deviation / decision:
```

Repeat one record per operation. Never record passwords, recovery codes, API tokens, secret values, or other credentials.

## Blocking prerequisites

- [ ] Target Cloudflare account identified.
- [ ] Operator has authorized Cloudflare access.
- [ ] Wrangler authentication verified with `npx wrangler whoami`.
- [ ] Workers Builds GitHub integration can access `jagports/jagports`.
- [ ] Production Worker `jagports` exists or can be created.
- [ ] Production D1 database `jagports` exists or can be created.
- [ ] Real D1 database ID is available for production configuration.
- [ ] D1 migrations have been reviewed and can be applied.
- [ ] `ADMIN_TOKEN` can be provisioned securely.
- [ ] Cloudflare Access identity/policy requirements are decided.
- [ ] First Git-integrated deployment can be triggered.
- [ ] Pre-merge and post-deployment verification can be executed.

## Traceability

**Implements**

[Issue #446 — Document Cloudflare Git integration and D1 deployment procedure](https://github.com/jagports/jagports/issues/446)

**Related documentation**

[PR #445 — Cloudflare Git integration deployment documentation](https://github.com/jagports/jagports/pull/445)
