# VIEPS Worker Management Tasks

## Purpose

Manage the VIEPS pre-production Worker after deployment without mixing operational management with deployment procedure or implementation knowledge.

## Worker resource

```text
4-Production/internet/cloudflare/workers/jagports/
```

The Worker identity configured by Wrangler is `vieps`.

## Management tasks

### Inspect deployment status

Use the Cloudflare Workers & Pages dashboard for Worker deployment/build status. Where the supported Workers Builds API is configured, use it to inspect builds and logs.

Official reference:

https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/

### Preview a change

Use a non-production branch and the configured preview mechanism:

```text
npx wrangler versions upload
```

Verify the preview version separately from the pre-production deployment.

### Roll back Worker code

Select a known-good Worker version using the Cloudflare deployment/version mechanism and verify application behaviour after rollback.

Do not assume Worker rollback reverses D1 schema changes.

### D1 operations

Use the separate D1 migration procedure:

`3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md`

### Application authorization

Keep the Worker publicly reachable for public/read functions. Application-level authorization must restrict stock mutation to authenticated administrators.

Do not introduce whole-application Cloudflare Access merely to protect stock management.

## Verification

Use the VIEPS application functional tests:

`3-Deployment/internet/jagports/solution/vieps/SetupTesting.md`

## Credential rule

Never record passwords, password hashes, recovery codes, API tokens, or secret values in this file.
