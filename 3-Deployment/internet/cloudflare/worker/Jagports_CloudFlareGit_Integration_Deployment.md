# Jagports Cloudflare Git Integration Deployment

## Purpose

Deployment knowledge and deployment procedures for the Jagports application.

The production application is located at:

```text
4-Production/base/application-platform/application/jagports/
```

This document belongs under `3-Deployment/` because it describes how that production application is deployed and operated. The production application directory is the deployment source; this document is not an implementation-process document.

## Recommended development and deployment model

Jagports uses GitHub as the source of truth and Cloudflare Workers Builds as the preferred Git-to-Cloudflare deployment integration.

The recommended development flow is:

```text
Developer
   |
   v
GitHub feature branch
   |
   v
Pull Request
   |
   +--> Cloudflare preview build/version
   |       |
   |       +--> application verification
   |       +--> review
   |
   v
Merge to main
   |
   v
Cloudflare production build
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

This model keeps GitHub as the change-control system and Cloudflare as the build/deployment platform. Cloudflare Workers Builds supports GitHub repository integration, build status reporting in GitHub, production branch builds, and optional non-production branch preview builds.

For Jagports, use native Cloudflare Workers Builds unless a concrete requirement makes an external CI/CD system preferable. GitHub Actions remains the documented alternative for cases where native Workers Builds is unsuitable.

## 1. Create and secure the Cloudflare account

Cloudflare account creation is a required part of the deployment setup. It must not be assumed to already exist.

### 1.1 Create the account

1. Open the Cloudflare dashboard.
2. Create a Cloudflare account if the Jagports account does not already exist.
3. For a business/team account, use a durable team email alias or distribution list as the primary account contact where practical.
4. Verify the account email address.
5. Record the Cloudflare account identifier in the private operational record, not in repository documentation if it is considered internal account metadata.

The account owner should be a durable organizational identity rather than a developer's personal account.

### 1.2 Secure the login

After the email address is verified:

1. Open the Cloudflare user profile.
2. Open **Authentication**.
3. Enable two-factor authentication using a supported method.
4. Store recovery information in the organization's approved password/credential storage.
5. Do not store passwords, recovery codes, API tokens, or other credentials in GitHub.

Cloudflare recommends 2FA for all account users and requires a verified email before 2FA can be enabled successfully.

### 1.3 Add account members

Do not share the account owner's login.

Add individual Cloudflare account members and assign the minimum roles required for their work. Cloudflare account roles are scoped permissions; the Super Administrator role has broad account-management capabilities and should not be used for routine development when a narrower role is sufficient.

At minimum, distinguish:

```text
Cloudflare account owner / Super Administrator
        |
        +--> account administration and billing
        |
        +--> deployment administration
        |
        +--> development/operator access
```

The exact role assignment is an operational decision and must be recorded when the actual account is created.

## 2. Connect GitHub to Cloudflare

### 2.1 Preferred integration: Cloudflare Workers Builds

Use Cloudflare's native Git integration rather than building a custom GitHub-to-Cloudflare authentication mechanism.

The integration supports GitHub organization repositories as well as individual repositories. For Jagports, the repository is:

```text
jagports/jagports
```

Cloudflare's current setup flow is:

1. Open **Workers & Pages** in the Cloudflare dashboard.
2. Select **Create application**.
3. Select **Get started** for **Import a repository** when creating a new Worker from Git.
4. Select/connect the GitHub account.
5. Authorize the Cloudflare Git integration for the `jagports` organization when GitHub requests authorization.
6. Restrict the GitHub App installation to `jagports/jagports` if organization-level repository selection permits this.
7. Select the `jagports/jagports` repository.
8. Configure the Worker project as described below.

If the GitHub integration is already installed, manage it from:

```text
Cloudflare Dashboard
  -> Workers & Pages
  -> <Jagports Worker>
  -> Settings
  -> Builds
  -> Git Repository
  -> Manage
```

### 2.2 GitHub organization authorization

The Cloudflare GitHub integration may require an organization owner or an appropriately authorized GitHub user to approve access for an organization repository.

If `jagports/jagports` does not appear in Cloudflare's repository selector:

1. Check the Cloudflare Git integration installation in GitHub organization settings.
2. Confirm that the `jagports` organization permits the Cloudflare GitHub App to access the repository.
3. Grant access only to the repository required for this deployment where repository-specific access is available.
4. Return to Cloudflare and refresh/manage the Git repository connection.

Do not create a second GitHub authentication mechanism merely because the repository is not immediately visible; first correct the Cloudflare Git integration authorization.

## 3. Configure the Jagports Worker project

### 3.1 Production source directory

The Worker project root is:

```text
4-Production/base/application-platform/application/jagports/
```

This is the **Production** application directory and is the source directory for the deployed Jagports Worker.

It contains the application `package.json` and `wrangler.toml`.

The current Wrangler configuration defines:

```text
name = "jagports"
main = "src/index.js"
```

The Cloudflare Worker therefore uses the Worker name:

```text
jagports
```

### 3.2 Workers Builds configuration

Configure the connected project with:

```text
Git account:             jagports
Git repository:          jagports/jagports
Production branch:      main
Root directory:          4-Production/base/application-platform/application/jagports/
Build command:           leave empty unless a build step is introduced
Deploy command:          npx wrangler deploy
Preview deploy command:  npx wrangler versions upload
```

The root directory is important because this is a repository containing multiple project areas. Cloudflare must build the production application from its actual production directory rather than from an implementation/documentation directory.

Workers Builds uses the Wrangler version available to the project. The current application declares Wrangler as a development dependency and provides:

```text
npm install
npm test
npm run dev
npm run deploy
```

The normal production path is GitHub `main` -> Workers Builds -> `npx wrangler deploy`. A manual `npm run deploy` is a development/operator fallback, not the preferred production change path after Git integration has been established.

## 4. Configure branch and preview deployment behavior

### 4.1 Production branch

Set the production branch to:

```text
main
```

Every push to the production branch triggers the production Workers Build and runs the configured build and deploy commands.

Production changes should therefore reach `main` through the normal GitHub Pull Request review and merge process.

### 4.2 Non-production branches

Enable non-production branch builds when the application is ready for preview validation.

For non-production branches, use:

```text
npx wrangler versions upload
```

This uploads a Worker version without promoting it to the active production deployment and allows Cloudflare to provide preview information for the branch/version.

The intended Jagports review loop is:

```text
feature branch
    -> Pull Request
    -> Cloudflare preview build
    -> test/review
    -> merge to main
    -> production deployment
```

A preview deployment must never be treated as the production deployment.

## 5. Create and configure Cloudflare D1

Create the production D1 database in the same Cloudflare account as the Worker.

Recommended database name:

```text
jagports
```

### 5.1 CLI creation option

For an operator who is authenticated with Wrangler, the database can be created with:

```text
npx wrangler d1 create jagports
```

The command returns the database identifier and Wrangler configuration information. Do not copy credentials or access tokens into the repository. The D1 database identifier itself is configuration and is not a secret.

### 5.2 Configure the Worker binding

The production Worker already declares a D1 binding in:

```text
4-Production/base/application-platform/application/jagports/wrangler.toml
```

The configuration must contain the real production database ID instead of the placeholder:

```text
[[d1_databases]]
binding = "DB"
database_name = "jagports"
database_id = "<CLOUDFLARE_D1_DATABASE_ID>"
migrations_dir = "migrations"
```

Do not substitute an implementation directory for the production application directory.

## 6. D1 migration procedure

The repository's `migrations/` directory is the version-controlled database schema history.

Before changing the production database:

1. Confirm the target Cloudflare account.
2. Confirm the target database name and ID.
3. Inspect the migration history.
4. Review unapplied SQL migrations.
5. Check application compatibility.
6. Apply the migrations.
7. Record the result in the execution record below without recording secrets.

Commands:

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
```

Do not assume that deploying the Worker automatically applies D1 migrations. Migration execution must be an explicit and verified deployment step.

For production schema changes:

- review the SQL before execution;
- avoid destructive changes that cannot be recovered safely;
- prefer compatible expand/migrate/contract changes;
- verify the application version against the schema version;
- record migration results;
- document any manual recovery procedure required.

## 7. Configure application secrets

The application currently expects:

```text
ADMIN_TOKEN
```

Set the value as a Cloudflare Worker secret:

```text
npx wrangler secret put ADMIN_TOKEN
```

Never put the secret value in:

- Git commits;
- Pull Requests;
- Issues or comments;
- repository documentation;
- build logs;
- copied shell history;
- application source.

`ADMIN_TOKEN` is an application-level authorization mechanism. It does not replace Cloudflare Access.

## 8. Configure Cloudflare Access

Cloudflare Access is the external authentication/authorization boundary for the deployed application and is separate from `ADMIN_TOKEN`.

Before exposing real inventory:

1. Enable the required Cloudflare Zero Trust functionality.
2. Create an Access application/policy for the deployed Worker endpoint.
3. Define the permitted users/groups according to the operational requirement.
4. Verify that an unauthenticated request is rejected.
5. Verify that an authorized request reaches the Worker.
6. Keep the Access configuration outside the Git repository unless a specific configuration-as-code approach is intentionally adopted.

The exact identity provider and Access policy are deployment decisions and must be recorded in the execution record without recording credentials.

## 9. First deployment

The first deployment is a controlled setup event, not merely a documentation step.

Before the first production deployment, verify:

```text
Cloudflare account
    |
    +--> secure login / members
    +--> GitHub integration
    +--> Worker
    +--> D1 database + binding
    +--> migrations
    +--> ADMIN_TOKEN secret
    +--> Access policy
```

Then trigger the first Git-integrated deployment by merging the approved change to `main`.

For the first deployment, verify in both GitHub and Cloudflare:

- the build was triggered by the intended commit;
- the build completed successfully;
- the production deployment was promoted;
- the Worker name is `jagports`;
- the Worker uses the intended production root directory;
- the D1 binding is available;
- the expected migration state is present;
- Access enforcement is active;
- application logs contain no deployment errors.

A manual `npx wrangler deploy` may be used for controlled bootstrap/troubleshooting only when necessary; if it is used, record why it was required.

## 10. Verification

Minimum verification after the first deployment:

```text
Unauthenticated request
        |
        +--> rejected by Cloudflare Access

Authenticated request
        |
        +--> application loads
        +--> health check succeeds
        +--> part lookup succeeds
        +--> authorized stock CRUD succeeds
        +--> D1 data persists
```

Also verify the Git integration itself:

```text
GitHub commit
    |
    +--> Cloudflare build appears
    +--> build/check status appears in GitHub
    +--> deployment/version corresponds to commit
    +--> expected Worker version becomes active for main
```

For a Pull Request branch, verify the preview build separately before merge where preview builds are enabled.

## 11. Alternative CI/CD: GitHub Actions

GitHub Actions is an alternative, not the default Jagports deployment path.

Use it when a concrete requirement makes Workers Builds unsuitable.

The external CI path requires:

- a dedicated Cloudflare API token;
- the Cloudflare account ID;
- GitHub Actions encrypted/protected secrets;
- the repository's declared Wrangler version;
- explicit deployment and migration steps.

The token must have only the permissions required for the deployment. Never place the token in workflow source or log output.

Do not introduce a GitHub Actions deployment pipeline merely because it is familiar. Native Workers Builds is the preferred integration for this GitHub repository.

## 12. Rollback

Worker code rollback and D1 schema rollback are separate operations.

For Worker code, use Cloudflare Worker versions/deployments to return to a known-good application version.

For D1:

- do not assume a Worker rollback reverses a schema migration;
- do not rely on automatic schema rollback for destructive changes;
- use compatible migration strategies;
- document data restoration/recovery procedures where required.

A rollback test should be performed before the deployment process is considered operationally complete when the environment permits it.

## 13. Actual setup execution record

This section is the durable record of the **real Cloudflare setup**, not a theoretical checklist. Update it as the environment is actually created and verified.

The status vocabulary is:

```text
RESEARCHED  = procedure checked against current Cloudflare documentation
EXECUTED    = operation actually performed in the target environment
VERIFIED    = resulting state independently checked
BLOCKED     = operation could not be performed because required access/capability was unavailable
```

At the current documentation-update stage, no Cloudflare account creation, GitHub authorization, Worker creation, D1 creation, secret creation, Access configuration, or production deployment is claimed as executed by this document alone.

When setup is performed, record entries in this form:

```text
Date/time:
Operator:
Environment: production
Operation:
Status: RESEARCHED | EXECUTED | VERIFIED | BLOCKED
Command / dashboard action:
Result:
Verification:
Deviation / decision:
```

Never record secret values, passwords, recovery codes, API tokens, or other credentials.

## 14. Official Cloudflare references

The deployment procedure should be rechecked against current Cloudflare documentation when the setup is executed:

- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Git integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/
- GitHub integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- Build configuration: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Build branches: https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
- Account roles: https://developers.cloudflare.com/fundamentals/manage-members/roles/
- Two-factor authentication: https://developers.cloudflare.com/fundamentals/user-profiles/2fa/

## Acceptance checklist

### Cloudflare account

- [ ] Cloudflare account created or existing account explicitly identified.
- [ ] Account email verified.
- [ ] Two-factor authentication enabled.
- [ ] Account owner / administrator role identified.
- [ ] Required individual members and roles configured.

### GitHub integration

- [ ] Cloudflare Workers Builds selected as the deployment integration.
- [ ] Cloudflare GitHub integration authorized for the `jagports` organization.
- [ ] Access restricted to `jagports/jagports` where possible.
- [ ] Worker project connected to `jagports/jagports`.

### Production Worker

- [ ] Worker name is `jagports`.
- [ ] Production root is `4-Production/base/application-platform/application/jagports/`.
- [ ] Production branch is `main`.
- [ ] Build command is defined correctly.
- [ ] Production deploy command is `npx wrangler deploy`.
- [ ] Non-production preview deploy command is `npx wrangler versions upload` where enabled.

### Data and security

- [ ] Production D1 database `jagports` created.
- [ ] Real D1 database ID configured in the production Wrangler configuration.
- [ ] Remote migrations inspected.
- [ ] Required migrations applied and verified.
- [ ] `ADMIN_TOKEN` configured as a Cloudflare secret.
- [ ] Cloudflare Access / Zero Trust protection enabled.
- [ ] No credentials or secret values committed to GitHub.

### Deployment verification

- [ ] First Git-integrated deployment completed.
- [ ] GitHub build/check status verified.
- [ ] Cloudflare build/deployment verified.
- [ ] Unauthenticated access rejected.
- [ ] Authenticated application behavior verified.
- [ ] D1 persistence verified.
- [ ] Pull Request preview path verified where enabled.
- [ ] Worker rollback path understood/tested.
- [ ] D1 migration rollback limitations understood.

## Separation of concerns

```text
5-Implementation-Projects/   Implementation/project work
3-Deployment/                Deployment knowledge and procedures
4-Production/base/           Production foundation/runtime
4-Production/platform/       Production platform components
4-Production/application/    Production application implementations
4-Production/base/application-platform/application/jagports/
                             Jagports production application source
```
