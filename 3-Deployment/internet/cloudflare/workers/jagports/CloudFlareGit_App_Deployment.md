# Jagports Cloudflare Git Worker Deployment

## Purpose

Deploy the public Jagports VIEPS application as a Cloudflare Worker.

This procedure covers the pre-production Worker deployment. Cloudflare account setup, GitHub integration, D1 deployment/migrations, DNS deployment, and later production deployment are separate tasks.

## Environment model

```text
Pre-production Worker: vieps
Production Worker:     jagports — reserved for a later production phase
```

The existing Deployment-1 MVP `jagports.parts-5ec.workers.dev` deployment is superseded and discarded. It is not the pre-production Worker and is not preserved by this procedure.

## Pre-production representation

```text
4-Production/internet/cloudflare/workers/jagports/
```

The default Wrangler configuration in this directory represents the pre-production VIEPS Worker:

```text
Worker name: vieps
```

No production Wrangler environment is defined by this pre-production configuration.

## Production representation

Production Worker identity `jagports` is reserved for a later, separate production deployment.

Production configuration and deployment are not established by this procedure and must not be inferred from the pre-production configuration.

## Worker configuration

Repository:

```text
jagports/jagports
```

Production branch:

```text
main
```

Root directory:

```text
4-Production/internet/cloudflare/workers/jagports/
```

Workers Builds build command:

```text
npm ci && npm run build
```

Pre-production deploy command:

```text
npx wrangler deploy
```

Preview build command:

```text
npm ci && npm run build
```

Preview deploy command:

```text
npx wrangler versions upload
```

The repository source of truth for these Workers Builds values is:

```text
3-Deployment/internet/cloudflare/workers/jagports/cloudflare-build-branches.json
```

The Worker configuration, application source, generated-asset sources, public assets, migrations and tests are contained in the Worker directory. The obsolete `/base` hierarchy is not a deployment dependency.

## Generated-asset build contract

A generated asset must be built and verified before a deployment command publishes the Worker asset tree.

Reusable sequence:

```text
reviewed source revision
  -> restore/install pinned dependencies
  -> run the project's authoritative build command
  -> verify required generated assets exist and are non-empty
  -> deploy
  -> verify generated asset URLs from the deployed environment
  -> verify rendered/runtime application
```

The generic deployment rule is **project-defined build before deploy**. Do not hard-code a framework-specific build command into reusable deployment policy when the project package/build configuration already defines the authoritative build.

For the current VIEPS Worker the concrete mapping is:

```text
source:          styles/vieps-tailwind.css
project build:   npm run build
CSS sub-build:   npm run build:css
generated asset: public/vieps-tailwind.css
asset root:      public/
pre-deploy check npm run verify:generated-assets
post-deploy test npm run verify:deployed-assets
```

`npm run build` compiles the Tailwind source and then verifies that the generated CSS exists and is non-empty. The generated `public/vieps-tailwind.css` is a deployment artifact and is not source-controlled.

This rule was introduced after the PR #647 deployment incident, where the Worker deployed successfully while the generated stylesheet was absent and the live page rendered essentially unstyled. A successful Worker deployment therefore does not by itself prove that generated frontend assets were built or served.

## Git-integrated build branch and command control

Cloudflare Workers Builds is connected to the repository, but build/deployment eligibility is intentionally narrower than normal Pull Request activity.

The repository source of truth is:

```text
3-Deployment/internet/cloudflare/workers/jagports/cloudflare-build-branches.json
```

The policy controls:

- Worker name;
- Worker root directory;
- production branch;
- production build command;
- production deploy command;
- preview build command;
- preview deploy command;
- exact preview branch allow-list.

The default branch policy is:

```text
main -> production Workers Build enabled
all other branches -> Workers Builds disabled
```

Wildcard preview branches are prohibited. An unlisted PR branch must not trigger a Cloudflare Workers Build merely because a commit was pushed.

The policy is applied to Cloudflare by:

```text
3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs
```

The script manages both branch eligibility and the build/deploy command contract. It does not change application source under `4-Production/`.

### Required credentials

Set these only in the local/operator environment. Do not commit values to the repository:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

`CLOUDFLARE_WORKER_TAG` may be supplied to bypass Worker-tag discovery.

`CLOUDFLARE_BUILD_TOKEN_UUID` is required only when an explicit preview branch is configured and no preview trigger currently exists, because Cloudflare requires a build-token UUID when creating that trigger.

### Check current Cloudflare Workers Builds state

From the repository root:

```text
node 3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs --check
```

`--check` is read-only. It fails unless the remote production and preview triggers exactly match the repository policy, including build command, deploy command, root directory, and branch rules.

### Apply policy to an already-launched Cloudflare Worker

The repository configuration does not modify Cloudflare merely by existing in Git. After this configuration is first merged, or whenever any controlled Workers Builds value changes, an authorized operator must apply it to the existing `vieps` Workers Builds connection:

```text
node 3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs --apply
```

The apply operation:

1. discovers the `vieps` Worker tag unless supplied explicitly;
2. reads existing Workers Builds triggers;
3. updates the production trigger to the repository-defined root, build command, deploy command, and `main`-only branch rule;
4. deletes the preview trigger when `preview_branches` is empty;
5. updates an existing preview trigger to the repository-defined build/deploy contract and exact preview allow-list;
6. creates the preview trigger when required and sufficient Cloudflare identifiers are available;
7. re-reads remote trigger state and fails unless it exactly matches repository policy.

A documentation/configuration commit alone is not evidence that the live Cloudflare trigger configuration changed.

Cloudflare Dashboard provides corresponding settings under:

```text
Worker -> Settings -> Build
```

The repository policy remains authoritative for the values it controls.

### Temporarily allow an explicit preview/test branch

Edit only `preview_branches` in `cloudflare-build-branches.json`, for example:

```json
{
  "schema_version": 2,
  "worker": "vieps",
  "root_directory": "4-Production/internet/cloudflare/workers/jagports/",
  "production_branch": "main",
  "production_build_command": "npm ci && npm run build",
  "production_deploy_command": "npx wrangler deploy",
  "preview_build_command": "npm ci && npm run build",
  "preview_deploy_command": "npx wrangler versions upload",
  "preview_branches": ["explicit-cloudflare-test"]
}
```

Then run `--apply` and `--check`. Only that named non-production branch is eligible for a preview Workers Build.

After the test, remove the branch from `preview_branches`, run `--apply`, and run `--check` again.

Do not modify `4-Production/` merely to add or remove an eligible deployment branch.

## CLI execution

Open Windows Terminal using PowerShell or Git Bash at the Worker root:

```text
jagports/jagports/4-Production/internet/cloudflare/workers/jagports/
```

Authenticate first if required:

```text
npx wrangler login
npx wrangler whoami
```

Restore the exact locked dependency set and execute the authoritative build:

```text
npm ci
npm run build
```

The build must fail if a required generated asset is absent or empty.

Validate the resulting Worker configuration/assets without deploying:

```text
npx wrangler deploy --dry-run
```

A controlled direct deployment fallback uses the same build-before-deploy contract:

```text
npm ci
npm run deploy
```

Use direct deployment only when the Git-integrated deployment path is unavailable or for an explicitly recorded bootstrap/troubleshooting case.

## Preview deployment

Preview Workers Builds are disabled by default. Use a non-production branch for Cloudflare preview deployment only when its exact branch name has been explicitly added to `cloudflare-build-branches.json` and the policy has been applied to Cloudflare.

Manual preview follows the same build contract:

```text
npm ci
npm run build
npx wrangler versions upload
```

A preview deployment must not be treated as production deployment evidence.

## D1 dependency

The Worker configuration uses a D1 binding. D1 creation and migrations are separate deployment tasks.

D1 deployment procedure:

```text
3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Deployment.md
```

D1 migration procedure:

```text
3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md
```

A successful Worker deployment does not prove that the required D1 migrations have been applied.

## Production endpoint dependency

The discarded Deployment-1 MVP endpoint was:

```text
https://jagports.parts-5ec.workers.dev
```

It must not be treated as the current pre-production endpoint.

The intended public VIEPS production hostname remains a separate DNS/production concern:

```text
https://vieps.jagports.fi
```

The public DNS name is independent of the internal Cloudflare Worker name. The later production Worker identity is reserved as `jagports`.

DNS/production-address deployment is a separate task:

```text
3-Deployment/internet/dns/hosting/jagports/setupProductionAddress.md
```

Do not mark the custom production endpoint verified until that task has established and independently tested the supported DNS/Cloudflare architecture.

## Verification

From the Worker root, verify the local deployment artifact contract:

```text
npm ci
npm run build
npx wrangler deploy --dry-run
```

Verify the repository Workers Builds policy against Cloudflare:

```text
node ../../../../../3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs --check
```

After deployment, verify at least one generated asset directly:

```text
npm run verify:deployed-assets
```

To target another supported endpoint:

```text
VIEPS_BASE_URL="https://example.invalid" npm run verify:deployed-assets
```

Then verify the rendered/runtime application and affected application probes.

Deployment verification must establish:

- the build corresponds to the intended GitHub commit;
- the intended Worker version is active;
- the Worker uses the intended deployment root/configuration;
- the Worker name is `vieps`;
- generated assets were built before deployment;
- required generated assets are non-empty;
- `/vieps-tailwind.css` returns success and `text/css` from the deployed environment;
- the rendered application uses the expected styling;
- the D1 binding is present;
- the Workers Builds production trigger matches the repository-defined root/build/deploy commands and includes only `main`;
- when `preview_branches` is empty, no preview trigger exists;
- an unlisted PR branch produces no Cloudflare Workers Build or deployment-status/comment noise;
- if an explicit preview branch is temporarily configured, that branch can trigger the preview path and removing it disables future preview builds;
- the discarded `jagports.parts-5ec.workers.dev` Deployment-1 MVP is not being treated as the pre-production environment.

Record actual test evidence in the relevant Issue/PR or execution record, not as a permanent chronological log here.

## Rollback

Worker rollback and D1 schema rollback are separate operations. Do not assume that restoring a Worker version reverses a D1 migration.

Branch/build-control rollback is also separate from Worker-version rollback. Restore the intended repository policy, apply it, and verify remote trigger state. Do not bypass the generated-asset build contract as a rollback shortcut.
