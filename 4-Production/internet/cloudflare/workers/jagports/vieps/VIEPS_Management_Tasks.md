# VIEPS Production Worker Management Tasks

## Purpose

Record the repeatable management tasks for the deployed VIEPS Worker without mixing deployment procedure with application implementation knowledge.

## Production resource

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

## Management tasks

### Deploy reviewed production code

Trigger the accepted Workers Builds production deployment from the reviewed `main` branch.

Verify:

- build succeeded;
- expected Worker version was produced;
- expected version is active;
- public endpoint tests pass.

### Inspect deployment status

Use Cloudflare Workers & Pages -> select `jagports` Worker -> deployment/build information.

Where API access is configured, use the Workers Builds API to list builds and inspect build status/logs.

Official reference:

https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/

### Preview a change

Use a non-production branch build and the configured preview deploy command:

```text
npx wrangler versions upload
```

Verify the preview version separately from production.

### Roll back Worker code

Select a known-good Worker deployment/version using the Cloudflare deployment/version mechanism.

Verify the application after rollback.

Do not assume Worker rollback reverses D1 schema changes.

### D1 changes

Use the separate D1 migration procedure:

`3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Migrations.md`

### Application authorization

The Worker must remain publicly reachable for public/read functions.

Application-level authorization must restrict stock mutation to authenticated administrators.

Do not reintroduce whole-application Cloudflare Access merely to protect stock management.

## Production verification

Every production change must independently verify:

```text
Worker build
    -> Worker deployment
    -> endpoint
    -> public/read behaviour
    -> administrator mutation behaviour
    -> D1 persistence
```

The exact test procedure is:

`3-Deployment/internet/jagports/solution/vieps/SetupTesting.md`

## Credential rule

Never record passwords, password hashes, recovery codes, API tokens, or secret values in this file.
