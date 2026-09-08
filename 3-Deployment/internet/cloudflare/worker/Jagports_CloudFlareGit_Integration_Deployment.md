# Jagports Cloudflare Git Integration Deployment

## Purpose

Deployment knowledge and deployment procedures for the Jagports application.

The application implementation is under `4-Production/base/application-platform/application/jagports/`. This document belongs under `3-Deployment/` because it describes how that application is deployed and operated.

## Recommended development and deployment model

Jagports uses GitHub as the source of truth and Cloudflare Workers Builds as the preferred Git-to-Cloudflare deployment integration.

The recommended flow is:

```text
GitHub repository
    |
    | push / pull request
    v
Cloudflare Workers Builds
    |
    +--> build
    +--> preview version for non-production branches
    +--> production deployment from the production branch
    |
    v
Cloudflare Worker
    |
    +---- Static Assets
    +---- /api/*
             |
             v
          Cloudflare D1
```

Cloudflare's native Workers Builds integration is preferred for this repository because it directly connects GitHub to Workers, provides GitHub build/check visibility, supports preview versions, and keeps deployment authentication in the Cloudflare build system. A separate GitHub Actions deployment pipeline is an alternative when native Workers Builds is unsuitable.

## 1. Cloudflare account and login

### 1.1 Create the Cloudflare account

Create the Cloudflare account before creating the Worker or D1 resources.

For a team/business account:

- Use a durable team or service email alias as the primary account contact.
- Verify the email address.
- Enable two-factor authentication.
- Give individual users their own Cloudflare account membership instead of sharing one login.

Cloudflare recommends an email alias or distribution list for the primary account contact for team/business accounts.

### 1.2 Account members

Use Cloudflare account members and role-based access rather than shared credentials.

The initial account owner/Super Administrator performs account-level setup and invites additional members with only the roles and scopes they require.

Do not put Cloudflare passwords, API tokens, recovery codes, or other credentials in GitHub.

### 1.3 Local Wrangler login

For local development or manual administrative operations, authenticate Wrangler interactively:

```text
npx wrangler login
```

Verify the authenticated account before making account-level changes.

For non-interactive CI/CD using GitHub Actions, use a narrowly scoped Cloudflare API token and the Cloudflare account ID as protected GitHub secrets. Do not use a developer's personal credential in CI.

## 2. GitHub organization integration

### 2.1 Install the Cloudflare GitHub App

Use Cloudflare Workers & Pages GitHub integration rather than creating a custom GitHub OAuth integration.

In Cloudflare:

1. Open **Workers & Pages**.
2. Create or open the Worker.
3. Open **Settings > Builds**.
4. Select **Connect**.
5. Select GitHub.
6. Authorize the **Cloudflare Workers and Pages** GitHub App for the `jagports` organization.

For the `jagports` organization, restrict the GitHub App to the repository actually required by this deployment:

```text
jagports/jagports
```

Do not grant the Cloudflare GitHub App unrestricted access to unrelated repositories when repository-specific access is sufficient.

Cloudflare requires an organization owner or a user with the appropriate GitHub Apps Manager capability to install the application for an organization.

## 3. Worker project configuration

The Jagports Worker project root is:

```text
4-Production/base/application-platform/application/jagports/
```

This is the directory that contains the application `package.json` and `wrangler.toml`.

The current Wrangler configuration defines:

```text
name = "jagports"
main = "src/index.js"
```

Therefore the Cloudflare Worker must use the Worker name `jagports` and the Cloudflare Workers Builds root directory must point to the directory above.

For the native Workers Builds configuration use:

```text
Git account: jagports
Git repository: jagports/jagports
Production branch: main
Root directory: 4-Production/base/application-platform/application/jagports/
Build command: leave empty unless a build step is introduced
Deploy command: npx wrangler deploy
Non-production deploy command: npx wrangler versions upload
```

Workers Builds uses the Wrangler version declared by the application's `package.json`. The current application already declares Wrangler as a development dependency and provides:

```text
npm test
npm run dev
npm run deploy
```

## 4. D1 database

Create the production D1 database in the same Cloudflare account as the Worker.

Recommended database name:

```text
jagports
```

The database ID is then placed in:

```text
4-Production/base/application-platform/application/jagports/wrangler.toml
```

under the existing D1 binding:

```text
[[d1_databases]]
binding = "DB"
database_name = "jagports"
database_id = "<CLOUDFLARE_D1_DATABASE_ID>"
migrations_dir = "migrations"
```

The D1 database ID is configuration, not a secret. Credentials and tokens remain outside Git.

## 5. D1 migrations

The repository's `migrations/` directory is the version-controlled database schema history.

For a controlled production migration, inspect unapplied migrations first and then apply them to the remote database:

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
```

Do not assume that deploying a Worker automatically applies D1 migrations. The production deployment procedure must explicitly establish how migration execution is performed and verified.

Before applying a migration that changes an existing production schema:

- review the SQL;
- verify compatibility with the deployed application version;
- confirm the target database;
- record the migration result;
- keep rollback limitations visible.

## 6. Application secrets

The application currently expects `ADMIN_TOKEN`.

Set it as a Cloudflare Worker secret, never as a repository variable or committed file:

```text
npx wrangler secret put ADMIN_TOKEN
```

Secrets must not appear in:

- Git commits;
- Pull Requests;
- Issues or comments;
- build logs;
- documentation;
- shell history copied into project records.

## 7. Cloudflare Access

Cloudflare Access is an external authentication/authorization boundary and is separate from the application's `ADMIN_TOKEN` mechanism.

Before exposing real inventory:

1. Enable Zero Trust if it is not already enabled.
2. Create/protect the Worker with Cloudflare Access.
3. Define the allowed users/groups according to the application's operational requirements.
4. Verify that unauthenticated requests are rejected.
5. Verify that an authorized user can reach the application.

Do not treat `ADMIN_TOKEN` as a replacement for Cloudflare Access.

## 8. First deployment

The first deployment should be performed only after the Cloudflare account, GitHub integration, Worker, D1 database, migration state, secret, and Access policy are configured.

Local/manual deployment command:

```text
npm run deploy
```

The normal Git-integrated production deployment is triggered by a commit to the configured production branch.

For the first Git-integrated deployment, verify in both systems:

- Cloudflare build status and deployment/version;
- GitHub commit status/check run;
- Worker URL;
- Worker name;
- D1 binding;
- application logs/errors;
- Access enforcement.

## 9. Verification

Minimum verification after the first deployment:

```text
Unauthenticated request
        |
        +--> rejected by Access

Authenticated request
        |
        +--> application loads
        +--> health check succeeds
        +--> part lookup succeeds
        +--> stock CRUD succeeds where authorized
        +--> D1 data persists
```

Also verify that a subsequent GitHub commit triggers the expected Cloudflare build and that the resulting deployment corresponds to the intended commit.

## 10. Preview deployments

Non-production branches should use Workers Builds preview deployments where practical.

The default non-production deploy command is:

```text
npx wrangler versions upload
```

A preview deployment must not replace or promote the production deployment.

Use previews to validate Worker behavior and Git integration before merging to the production branch.

## 11. Alternative: GitHub Actions

GitHub Actions is an alternative when Cloudflare Workers Builds does not meet the required workflow.

The CI job must use:

- a dedicated Cloudflare API token;
- the Cloudflare account ID;
- GitHub Actions encrypted secrets;
- the repository's local Wrangler version;
- explicit deployment and migration steps.

The token must have only the permissions required for the deployment. Never place the token in the workflow source.

For this repository, do not introduce GitHub Actions deployment merely because it is familiar. Use native Workers Builds unless a concrete requirement makes external CI/CD preferable.

## 12. Rollback

Worker code rollback and D1 schema rollback are separate operations.

For Worker code, use the Cloudflare Worker version/deployment mechanism to return to a known-good application version.

For D1:

- do not assume a Worker rollback reverses a schema migration;
- avoid destructive migrations that cannot be rolled back safely;
- prefer compatible expand/migrate/contract changes for production data;
- document any manual data-recovery procedure required by a migration.

## 13. Actual setup execution record

This document defines the researched setup procedure. The actual Cloudflare account creation, login, GitHub App authorization, Worker creation, D1 creation, secret creation, Access configuration, first deployment, and verification must be recorded here as they are performed.

No Cloudflare account credentials or secret values are recorded in this document.

Execution status must distinguish:

```text
RESEARCHED  = procedure verified against current Cloudflare documentation
EXECUTED    = operation actually performed in the target Cloudflare account
VERIFIED    = resulting state independently checked
BLOCKED     = operation could not be performed because required access/capability was unavailable
```

## Acceptance checklist

- [ ] Cloudflare account created and email verified.
- [ ] Two-factor authentication enabled.
- [ ] Required Cloudflare account members/roles configured.
- [ ] Wrangler local login verified where local administration is required.
- [ ] Cloudflare Workers & Pages GitHub App installed for `jagports`.
- [ ] GitHub App access restricted to `jagports/jagports`.
- [ ] Worker created/configured as `jagports`.
- [ ] Worker root set to `4-Production/base/application-platform/application/jagports/`.
- [ ] Production branch configured.
- [ ] D1 database `jagports` created.
- [ ] D1 database ID recorded in Wrangler configuration.
- [ ] Remote migrations inspected and applied.
- [ ] `ADMIN_TOKEN` configured as a Cloudflare secret.
- [ ] Cloudflare Access / Zero Trust protection enabled.
- [ ] First Git-integrated deployment completed.
- [ ] GitHub build/check status verified.
- [ ] Unauthenticated access rejected.
- [ ] Authenticated application behavior verified.
- [ ] D1 persistence verified.
- [ ] Preview deployment path verified where enabled.
- [ ] Worker rollback path understood.
- [ ] D1 migration rollback limitations documented.

## Separation of concerns

```text
5-Implementation-Projects/   Implementation/project work
3-Deployment/                Deployment knowledge and procedures
4-Production/base/           Production foundation/runtime
4-Production/application/    Other production application implementations
4-Production/base/application-platform/application/jagports/
                             Jagports application implementation
```
