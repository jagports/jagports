# Cloudflare D1 Migrations

## Purpose

Apply version-controlled D1 migrations as a separate repeatable deployment task. Database creation is not repeated when a migration changes.

## Migration source

The production migration source is:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/migrations/
```

Migration files are reviewed through the normal GitHub Issue/PR workflow before they are merged to the branch used for deployment.

## Operator environment

Open Windows Terminal using PowerShell or Git Bash at the Jagports repository root:

```text
jagports/jagports/
```

The `npx` command is supplied by the installed Node.js/npm toolchain and invokes the repository's Wrangler CLI dependency.

## Pre-apply verification

Authenticate:

```text
npx wrangler whoami
```

Verify the database exists and inspect migration state:

```text
npx wrangler d1 list
npx wrangler d1 migrations list jagports --remote
```

Stop if the intended database cannot be identified or the migration source is not the reviewed production migration set.

## Apply

Apply the reviewed pending migrations:

```text
npx wrangler d1 migrations apply jagports --remote
```

Do not recreate the database to apply a new migration.

## Post-apply verification

Run:

```text
npx wrangler d1 migrations list jagports --remote
```

Verify that the intended migration versions are applied and that the command exits successfully.

## Credentials

API tokens and other secrets are supplied through the approved credential mechanism at execution time. Never store them in GitHub or migration files.
