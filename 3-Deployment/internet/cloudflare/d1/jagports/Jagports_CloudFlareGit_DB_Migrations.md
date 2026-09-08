# Jagports Cloudflare D1 Migration Operations

## Purpose

Repeatable procedure for reviewing, applying, and verifying D1 schema migrations during VIEPS development and deployment.

Database creation and Worker/D1 binding are separate tasks. A migration can be repeated against an existing database without recreating the database.

## Migration source

Cloudflare D1 migrations are versioned SQL files stored in a `migrations` directory. They are part of the repository-controlled application/database change history.

Official reference:

https://developers.cloudflare.com/d1/reference/migrations/

The exact migration directory and Wrangler configuration used by VIEPS must follow the merged D1 production documentation in PR #445.

## Review rule

Every migration is a repository change and must pass normal Jagports review before production application.

Review at minimum:

1. migration filename/version ordering;
2. SQL correctness;
3. compatibility with the application version being deployed;
4. data-loss/destructive-operation risk;
5. forward deployment order;
6. recovery/rollback implications;
7. target database/environment.

Do not apply an unreviewed migration directly to production.

## CLI location and prerequisites

Open a terminal at the Jagports repository root:

```text
jagports/jagports/
```

Required:

```text
node --version
npm --version
npx wrangler --version
```

Authenticate to the intended Cloudflare account:

```text
npx wrangler login
npx wrangler whoami
```

Use the production Wrangler configuration from the reviewed production Worker/D1 implementation. Do not substitute a local/development configuration accidentally.

## Inspect migration state

From the repository root:

```text
npx wrangler d1 migrations list jagports --remote
```

This lists migration state for the remote database. The database name is deliberately used rather than relying on an interchangeable binding name, reducing the risk of selecting the wrong database.

Official command reference:

https://developers.cloudflare.com/d1/wrangler-commands/

## Apply migrations

After review and target verification:

```text
npx wrangler d1 migrations apply jagports --remote
```

Wrangler prompts for confirmation in an interactive terminal. Review the migration list before confirming.

Cloudflare currently documents that an apply operation captures a backup and that a failed migration is rolled back, leaving the previous successful migration applied. This does not remove the need for application-level recovery planning.

## Verify after apply

Run the list command again:

```text
npx wrangler d1 migrations list jagports --remote
```

Verify:

- intended migrations are applied;
- no unexpected migration remains unapplied;
- the Worker `DB` binding points to the intended database;
- the application version is compatible with the resulting schema.

## Preview/development migration testing

For a local database:

```text
npx wrangler d1 migrations list jagports --local
npx wrangler d1 migrations apply jagports --local
```

For a preview D1 database, use the reviewed preview environment/configuration and the `--preview` option where configured.

Do not use a development or preview database as evidence that production migration state is correct.

## Repeatability

Database recreation is not required for each migration.

Normal development flow is:

```text
new migration
    -> code review
    -> preview/local test
    -> merge
    -> production migration apply
    -> production migration verification
```

## Rollback

Do not assume application rollback reverses database schema changes.

For destructive schema changes, the Issue/PR must define the recovery/data-impact strategy before production application.

## Execution record

For each production migration operation record:

```text
Date/time:
Operator:
Environment: production
Database:
Migration(s):
Command:
Status: EXECUTED | VERIFIED | BLOCKED
Result:
Verification:
```

Never record credentials, API tokens, passwords, password hashes, or secret values.
