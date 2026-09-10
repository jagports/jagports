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
4-Production/internet/cloudflare/workers/jagports/vieps/
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

Use non-production branch builds for development/testing. Keep the pre-production Worker identity `vieps` explicit.

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

After deployment verify, using the supported CLI/API first and UI only where required:

- the build corresponds to the intended GitHub commit;
- the intended Worker version is active;
- the Worker uses the intended deployment root/configuration;
- the Worker name is `vieps`;
- the D1 binding is present;
- the discarded `jagports.parts-5ec.workers.dev` Deployment-1 MVP is not being treated as the pre-production environment.

Record actual test evidence in the relevant Issue/PR or execution record, not as a permanent chronological log here.

## Rollback

Worker rollback and D1 schema rollback are separate operations. Do not assume that restoring a Worker version reverses a D1 migration.

## Official references

- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Worker routing: https://developers.cloudflare.com/workers/configuration/routing/
- Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
