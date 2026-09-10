# Jagports Cloudflare Git Worker Deployment

## Purpose

Deploy the public Jagports VIEPS application as Cloudflare Workers.

This procedure covers Worker deployment only. Cloudflare account setup, GitHub integration, D1 deployment/migrations, DNS deployment, and VIEPS application management are separate tasks.

## Environment model

```text
Pre-production Worker: vieps
Production Worker:     jagports
```

The existing Deployment-1 MVP Worker `jagports` is the production Worker identity. Its existing Workers.dev endpoint is preserved; production DNS/custom-domain work is a separate task.

## Pre-production representation

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

The default Wrangler configuration in this directory represents the pre-production VIEPS Worker:

```text
Worker name: vieps
```

Default deployment:

```text
npx wrangler deploy
```

## Production representation

Production uses the Wrangler `production` environment in the same repository configuration:

```text
Worker name: jagports
Wrangler environment: production
```

Production deployment:

```text
npx wrangler deploy --env production
```

The existing Deployment-1 `jagports` Worker is the production Worker resource. It must not be renamed or deleted merely to implement this environment model.

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
4-Production/internet/cloudflare/workers/jagports/vieps/
```

Build command:

```text
leave empty unless a build step is introduced
```

Deploy commands:

```text
Pre-production: npx wrangler deploy
Production:     npx wrangler deploy --env production
```

Preview deploy command:

```text
npx wrangler versions upload
```

Workers Builds configuration must identify the intended environment and Worker explicitly.

The Cloudflare GitHub integration is configured in `3-Deployment/internet/cloudflare/CloudFlare_GitHub_Integration_Setup.md`.

## CLI execution

Open Windows Terminal using PowerShell or Git Bash at the Worker root:

```text
jagports/jagports/4-Production/internet/cloudflare/workers/jagports/vieps/
```

Authenticate first if required:

```text
npx wrangler login
npx wrangler whoami
```

Validate the default pre-production Worker configuration without deploying:

```text
npx wrangler deploy --dry-run
```

Validate the production environment configuration without deploying:

```text
npx wrangler deploy --env production --dry-run
```

A controlled direct deployment fallback is:

```text
npx wrangler deploy
```

or, for production:

```text
npx wrangler deploy --env production
```

Use direct deployment only when the Git-integrated deployment path is unavailable or for an explicitly recorded bootstrap/troubleshooting case.

## Preview deployment

Use non-production branch builds for development/testing. Keep production on `main`.

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

## Production endpoint dependency

The current production Worker retains the observed Workers.dev endpoint:

```text
https://jagports.parts-5ec.workers.dev
```

The intended public VIEPS production hostname remains:

```text
https://vieps.jagports.fi
```

The public DNS name is independent of the internal Cloudflare Worker name. The production Worker is `jagports`; the public production hostname remains the VIEPS application hostname.

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
npx wrangler deploy --env production --dry-run
```

After deployment verify, using the supported CLI/API first and UI only where required:

- the build corresponds to the intended GitHub commit;
- the intended Worker version is active;
- the Worker uses the intended deployment root/configuration;
- the D1 binding is present;
- the pre-production `vieps` and production `jagports` Worker identities are correct;
- the existing Deployment-1 `jagports` Worker remains the production Worker;
- the public VIEPS production endpoint serves the intended production Worker once DNS deployment is established.

Record actual test evidence in the relevant Issue/PR or execution record, not as a permanent chronological log here.

## Rollback

Worker rollback and D1 schema rollback are separate operations. Do not assume that restoring a Worker version reverses a D1 migration.

## Official references

- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Worker routing: https://developers.cloudflare.com/workers/configuration/routing/
- Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
