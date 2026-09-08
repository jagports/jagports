# Jagports Cloudflare Git Integrated Application Deployment — Execution Plan

## Purpose

This document is the execution companion for the Cloudflare Git-integrated Jagports application deployment.

It converts the deployment procedure into an operator sequence that explicitly distinguishes:

- **UI** — action performed in Cloudflare or GitHub web interfaces;
- **CLI** — action that can be performed with Wrangler or another supported command-line interface;
- **VERIFY** — independent confirmation of the resulting state.

The reusable deployment procedure remains in:

`3-Deployment/internet/cloudflare/worker/Jagports_CloudFlareGit_Integration_Deployment.md`

## Current execution state

No live Cloudflare environment operation is claimed by this repository change.

The actual setup must be executed against the intended Cloudflare account and recorded below after the operator has authenticated to the target environment.

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

No Wrangler command is used for initial Cloudflare account creation, account-member administration, or enabling user 2FA. These are Cloudflare account-management operations and should be marked **UI-required** unless Cloudflare provides an explicitly supported API/automation path adopted by Jagports.

**VERIFY**

Confirm through the Cloudflare dashboard that the account is verified, 2FA is enabled, and required members/roles exist.

### 2. Wrangler authentication

**CLI**

```text
npx wrangler login
npx wrangler whoami
```

`wrangler login` is the preferred interactive CLI authentication path for an operator. `wrangler whoami` verifies which Cloudflare identity Wrangler is using.

**VERIFY**

The authenticated identity must be the intended deployment operator/account. Do not treat successful authentication as proof that all required deployment permissions are available.

### 3. GitHub-to-Cloudflare integration

**UI**

1. Open Cloudflare Workers & Pages.
2. Create/import the Worker from Git.
3. Connect the GitHub account/organization.
4. Authorize the Cloudflare GitHub App for `jagports`.
5. Restrict repository access to `jagports/jagports` where supported.
6. Select the `jagports/jagports` repository.
7. Configure the Worker root and deployment commands.

**CLI**

There is no Wrangler command that replaces the Cloudflare dashboard's Workers Builds GitHub repository connection. Do not invent a CLI equivalent.

**VERIFY**

Confirm in Cloudflare that the connected repository is exactly:

```text
jagports/jagports
```

and that the production branch is `main`.

### 4. Worker configuration

**Repository source**

```text
4-Production/base/application-platform/application/jagports/
```

**Expected Worker configuration**

```text
Worker name:             jagports
Production branch:       main
Root directory:          4-Production/base/application-platform/application/jagports/
Deploy command:          npx wrangler deploy
Preview deploy command:  npx wrangler versions upload
```

**CLI verification**

After Wrangler authentication and when the Worker exists:

```text
npx wrangler deploy --dry-run
```

Use the dry-run as a configuration/package validation step. It must not be represented as a production deployment.

**VERIFY**

Confirm the Worker name, source root, branch, bindings and deployment settings in Cloudflare.

### 5. D1 database

**CLI**

Create the database only if it does not already exist:

```text
npx wrangler d1 create jagports
```

The command output contains the database identifier needed by the production Wrangler configuration. The identifier is configuration, not a credential, but it must be copied only into the intended configuration change.

**UI alternative**

Cloudflare Dashboard -> Workers & Pages / D1 -> create or inspect the `jagports` database.

**VERIFY**

Confirm database name and ID in Cloudflare before changing the production binding.

### 6. Production D1 binding

The production configuration is:

`4-Production/base/application-platform/application/jagports/wrangler.toml`

The binding must use the real production database ID. The repository placeholder:

```text
database_id = "REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID"
```

must not be deployed as the production configuration.

**VERIFY**

Before merge/deployment, verify that the configuration references the intended production database and not a local, development, or unrelated database.

### 7. D1 migrations

**CLI**

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
```

Review the migration list before applying changes.

**VERIFY**

Run the migration-list command again and confirm that the intended migrations are applied. Record migration identifiers/status, but never record credentials.

### 8. Application secret

The application expects:

```text
ADMIN_TOKEN
```

**CLI**

```text
npx wrangler secret put ADMIN_TOKEN
```

The command prompts for the secret value. The value must never be placed in GitHub content, Issue/PR comments, documentation, scripts, or logs.

**UI alternative**

Cloudflare Worker -> Settings -> Variables and Secrets -> add the encrypted `ADMIN_TOKEN` secret.

**VERIFY**

Confirm that the secret exists by its name/configuration state only. Never echo or retrieve the secret value for the repository record.

### 9. Cloudflare Access

**UI**

1. Enable/use Cloudflare Zero Trust as required.
2. Create the Access application for the deployed Worker endpoint.
3. Configure the intended identity provider.
4. Define the permitted users/groups.
5. Apply the policy before exposing real inventory data.

**CLI**

No Wrangler command replaces creation and policy configuration of the Cloudflare Access application. Mark this **UI-required** unless a separate approved Cloudflare API/IaC procedure is adopted.

**VERIFY**

- Unauthenticated request is rejected.
- Authorized request reaches the application.
- Access policy does not unintentionally expose the application.

### 10. Preview deployment

**CLI / Workers Builds configuration**

For a non-production branch, the documented preview command is:

```text
npx wrangler versions upload
```

**VERIFY**

Confirm that the preview version is not promoted as the production deployment and that the Pull Request is tested against the preview before merge where preview builds are enabled.

### 11. Production deployment

**Preferred path: UI-configured Workers Builds triggered by GitHub**

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

Use direct CLI deployment only for controlled bootstrap/troubleshooting when the Git-integrated deployment path cannot yet perform the required deployment. Record the reason for any manual deployment.

**VERIFY**

Confirm both GitHub and Cloudflare show the intended commit/build/version and that the expected production Worker version is active.

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

Also verify deployment provenance:

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

Where operationally safe, perform a rollback/recovery test before declaring the deployment procedure operationally complete.

## UI versus CLI rule

Use a CLI command only when the command is actually supported by the relevant Cloudflare tooling.

Use **UI-required** when the operation is inherently account/dashboard configuration in the documented deployment path and no supported Wrangler command exists.

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

The following must be resolved before the live deployment can be claimed complete:

- [ ] Target Cloudflare account identified.
- [ ] Operator has authorized Cloudflare access.
- [ ] Wrangler authentication verified with `npx wrangler whoami`.
- [ ] Cloudflare Workers Builds GitHub integration can access `jagports/jagports`.
- [ ] Production Worker `jagports` exists or can be created.
- [ ] Production D1 database `jagports` exists or can be created.
- [ ] Real D1 database ID is available for the production configuration.
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
