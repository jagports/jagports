# Jagports Cloudflare D1 Migration Operations

## Purpose

Repeatable procedure for reviewing, applying, and verifying D1 schema migrations during VIEPS development and deployment.

Database creation and Worker/D1 binding are separate tasks. A migration can be repeated against an existing database without recreating the database.

## Migration source

Cloudflare D1 migrations are versioned SQL files stored in a `migrations` directory and tracked as repository-controlled database changes.

Official reference:

https://developers.cloudflare.com/d1/reference/migrations/

## Review rule

Every migration is a repository change and must pass normal Jagports review before production application.

Review at minimum:

1. migration filename/version ordering;
2. SQL correctness;
3. application compatibility;
4. data-loss/destructive-operation risk;
5. deployment order;
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

## Inspect remote migration state

```text
npx wrangler d1 migrations list jagports --remote
```

The database name is deliberately used to reduce the risk of applying a migration to the wrong binding.

## Apply migrations

After review and target verification:

```text
npx wrangler d1 migrations apply jagports --remote
```

Wrangler prompts for confirmation in an interactive terminal. Review the migration list before confirming.

Cloudflare currently documents that an apply operation captures a backup and that a failed migration is rolled back, leaving the previous successful migration applied.

## Verify after apply

```text
npx wrangler d1 migrations list jagports --remote
```

Verify:

- intended migrations are applied;
- no unexpected migration remains unapplied;
- the Worker `DB` binding points to the intended database;
- the application version is compatible with the resulting schema.

## Preview/development

For local migration testing:

```text
npx wrangler d1 migrations list jagports --local
npx wrangler d1 migrations apply jagports --local
```

Use the reviewed preview environment/configuration and `--preview` for a preview D1 database where configured.

Do not use development or preview state as evidence of production migration state.

## Repeatability

Database recreation is not required for each migration.

```text
new migration
    -> code review
    -> preview/local test
    -> merge
    -> production migration apply
    -> production migration verification
```

## Rollback

Do not assume application rollback reverses a D1 migration.

For destructive schema changes, establish the recovery/data-impact strategy before production application.

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
