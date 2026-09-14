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

Default deployment:

```text
npx wrangler deploy
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

Build command:

```text
leave empty unless a build step is introduced
```

Pre-production deploy command:

```text
npx wrangler deploy
```

Preview deploy command:

```text
npx wrangler versions upload
```

Workers Builds configuration must identify `vieps` as the pre-production Worker. Do not configure or deploy a production `jagports` Worker as part of this pre-production task.

The Worker configuration, application source, public assets, migrations and tests are contained in the Worker directory. The obsolete `/base` hierarchy is not a deployment dependency.

## Git-integrated build branch control

Cloudflare Workers Builds is connected to the repository, but build/deployment eligibility is intentionally narrower than normal Pull Request activity.

The repository source of truth is:

```text
3-Deployment/internet/cloudflare/workers/jagports/cloudflare-build-branches.json
```

The default policy is:

```text
main -> production Workers Build enabled
all other branches -> Workers Builds disabled
```

The policy file contains:

- `worker` — Worker name governed by the policy; currently `vieps`;
- `production_branch` — must be `main`;
- `preview_branches` — exact non-production branch names intentionally allowed to run preview Workers Builds.

Wildcard preview branches are prohibited. An unlisted PR branch must not trigger a Cloudflare Workers Build merely because a commit was pushed.

The policy is applied to Cloudflare by:

```text
3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs
```

The script uses the Cloudflare Workers Builds API branch include/exclude controls. It does not change application source under `4-Production/`.

### Required credentials

Set these only in the local/operator environment. Do not commit values to the repository:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

`CLOUDFLARE_WORKER_TAG` may be supplied to bypass Worker-tag discovery.

`CLOUDFLARE_BUILD_TOKEN_UUID` is required only when an explicit preview branch is configured and no preview trigger currently exists, because Cloudflare requires a build-token UUID when creating that trigger.

### Check current Cloudflare branch state

From the repository root:

```text
node 3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs --check
```

`--check` is read-only. It fails if the remote Workers Builds triggers do not exactly match the repository policy.

### Apply policy to an already-launched Cloudflare Worker

The repository configuration does not modify Cloudflare merely by existing in Git. After this configuration is first merged, or whenever the branch list changes, an authorized operator must apply it to the existing `vieps` Workers Builds connection:

```text
node 3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs --apply
```

The apply operation:

1. discovers the `vieps` Worker tag unless it was supplied explicitly;
2. reads the existing Workers Builds triggers;
3. restricts the production trigger to `main`;
4. deletes the preview trigger when `preview_branches` is empty, disabling non-production branch builds;
5. updates an existing preview trigger to exactly the explicit preview list when branches are configured;
6. creates the preview trigger when required and sufficient Cloudflare identifiers are available;
7. re-reads the remote trigger state and fails unless it exactly matches the repository policy.

This is the required step that updates an existing Cloudflare deployment. A documentation/configuration commit alone is not evidence that the live Cloudflare trigger configuration changed.

Cloudflare Dashboard provides the corresponding broad branch control under:

```text
Worker -> Settings -> Build -> Branch control
```

For the default `main`-only state, the production branch must be `main` and **Builds for non-production branches** must be disabled. The API-managed repository policy remains authoritative when explicitly named preview branches are used because the repository policy is more precise than an all-non-production-branches toggle.

### Temporarily allow an explicit preview/test branch

Edit only `preview_branches` in `cloudflare-build-branches.json`, for example:

```json
{
  "schema_version": 1,
  "worker": "vieps",
  "production_branch": "main",
  "preview_branches": ["explicit-cloudflare-test"]
}
```

Then run `--apply` and `--check`. Only that named non-production branch is eligible for a preview Workers Build.

After the test, remove the branch from `preview_branches`, run `--apply`, and run `--check` again. When the list becomes empty, the preview trigger is removed and future non-production branch builds are disabled.

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

Validate the pre-production Worker configuration without deploying:

```text
npx wrangler deploy --dry-run
```

A controlled direct deployment fallback is:

```text
npx wrangler deploy
```

Use direct deployment only when the Git-integrated deployment path is unavailable or for an explicitly recorded bootstrap/troubleshooting case.

## Preview deployment

Preview Workers Builds are disabled by default. Use a non-production branch for Cloudflare preview deployment only when its exact branch name has been explicitly added to `cloudflare-build-branches.json` and the policy has been applied to Cloudflare.

Preview version upload:

```text
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

After each merged deployment, continue through the [merged Worker + D1 upgrade procedure](../../d1/jagports/CloudFlareGit_DB_Migrations.md#merged-worker--d1-upgrade-troubleshooting). The [post-deployment CI check](../../../github/actions/tests/vieps_post_deploy.md) verifies the matching Cloudflare build before running live smoke tests; a build-success badge alone is not the upgrade completion result.

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

From the Worker root:

```text
npx wrangler whoami
npx wrangler deploy --dry-run
```

Verify the repository branch policy against Cloudflare:

```text
node ../../../../../3-Deployment/internet/cloudflare/workers/jagports/apply-build-branches.mjs --check
```

After deployment verify, using the supported CLI/API first and UI only where required:

- the build corresponds to the intended GitHub commit;
- the intended Worker version is active;
- the Worker uses the intended deployment root/configuration;
- the Worker name is `vieps`;
- the D1 binding is present;
- the Workers Builds production trigger includes only `main`;
- when `preview_branches` is empty, no preview trigger exists;
- an unlisted PR branch produces no Cloudflare Workers Build or deployment-status/comment noise;
- if an explicit preview branch is temporarily configured, that branch can trigger the preview path and removing it disables future preview builds;
- the discarded `jagports.parts-5ec.workers.dev` Deployment-1 MVP is not being treated as the pre-production environment.

For #559-style verification, record evidence for all three cases in the Issue/PR execution record:

1. `main` — expected production Workers Build;
2. one explicitly listed optional branch — expected preview Workers Build while listed;
3. one unlisted PR branch — expected no Cloudflare Workers Build.

Record actual test evidence in the relevant Issue/PR or execution record, not as a permanent chronological log here.

## Rollback

Worker rollback and D1 schema rollback are separate operations. Do not assume that restoring a Worker version reverses a D1 migration.

Branch-control rollback is also separate from Worker-version rollback. Restore the intended branch list in `cloudflare-build-branches.json`, apply it, and verify the remote trigger state. Do not re-enable all non-production branch builds as a rollback shortcut.
