# Jagports Cloudflare Git Worker Deployment

## Purpose

Deploy the public Jagports VIEPS application as a Cloudflare Worker.

This procedure covers Worker deployment only. Cloudflare account setup, GitHub integration, D1 deployment/migrations, DNS deployment, and VIEPS application management are separate tasks.

## Production representation

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

## Worker configuration

Worker name:

```text
jagports
```

Production branch:

```text
main
```

Workers Builds configuration:

```text
Repository:             jagports/jagports
Production branch:     main
Root directory:        4-Production/internet/cloudflare/workers/jagports/vieps/
Build command:          leave empty unless a build step is introduced
Deploy command:         npx wrangler deploy
Preview deploy command: npx wrangler versions upload
```

The Cloudflare GitHub integration is configured in `3-Deployment/internet/cloudflare/CloudFlare_GitHub_Integration_Setup.md`.

## CLI execution

Open Windows Terminal using PowerShell or Git Bash at the repository root:

```text
jagports/jagports/
```

Authenticate first if required:

```text
npx wrangler login
npx wrangler whoami
```

Validate the Worker configuration without deploying:

```text
npx wrangler deploy --dry-run
```

A controlled direct deployment fallback is:

```text
npx wrangler deploy
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

The production Worker configuration uses a D1 binding. D1 creation and migrations are separate deployment tasks.

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

The target endpoint is:

```text
https://vieps.jagports.fi
```

DNS/production-address deployment is a separate task:

```text
3-Deployment/internet/dns/hosting/jagports/setupProductionAddress.md
```

Do not mark the endpoint verified until that task has established and independently tested the supported DNS/Cloudflare architecture.

## Verification

Run from the repository root:

```text
npx wrangler whoami
npx wrangler deploy --dry-run
```

After deployment verify, using the supported CLI/API first and UI only where required:

- the build corresponds to the intended GitHub commit;
- the intended Worker version is active;
- the Worker uses the intended deployment root/configuration;
- the D1 binding is present;
- the public VIEPS endpoint serves the intended Worker once DNS deployment is unblocked.

Record actual test evidence in the relevant Issue/PR or execution record, not as a permanent chronological log here.

## Rollback

Worker rollback and D1 schema rollback are separate operations. Do not assume that restoring a Worker version reverses a D1 migration.

## Official references

- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Worker routing: https://developers.cloudflare.com/workers/configuration/routing/
- Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
