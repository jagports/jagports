# Jagports Cloudflare D1 Migration Operations

## Purpose

Repeatable procedure for reviewing, applying, and verifying D1 schema migrations during VIEPS development and deployment.

Database creation and migration are separate tasks. Applying a new migration does not recreate the database.

## Migration source and selection

Reviewed migration files are repository-controlled SQL files under the active VIEPS Worker production representation:

```text
4-Production/internet/cloudflare/workers/jagports/migrations/
```

The active Wrangler configuration is:

```text
4-Production/internet/cloudflare/workers/jagports/wrangler.toml
```

That configuration declares:

```text
[[d1_databases]]
binding = "DB"
database_name = "jagports"
migrations_dir = "migrations"
```

Select the migration by its versioned filename/order from the reviewed change. Before applying, verify that the exact migration file is present in the Worker checkout being used and that the target database/environment is the intended one.

Do not run the migration commands from the repository root unless an explicit Wrangler configuration path is supplied. Running from the Worker root keeps the active `wrangler.toml` and its relative `migrations_dir` unambiguous.

## Review rule

Every migration is a repository change and must pass normal Jagports review before production application.

Review at minimum:

1. filename/version ordering;
2. SQL correctness;
3. application compatibility;
4. data-loss/destructive-operation risk;
5. deployment order;
6. recovery implications;
7. target environment.

Do not apply an unreviewed migration directly to production.

## CLI execution

Open Windows Terminal using PowerShell or Git Bash at the active Worker root:

```text
jagports/jagports/4-Production/internet/cloudflare/workers/jagports/
```

Verify tooling and authentication:

```text
node --version
npm --version
npx wrangler --version
npx wrangler whoami
```

Verify the intended configuration before any remote change:

```text
pwd
cat wrangler.toml
```

Confirm that the configuration identifies the intended D1 database and `migrations_dir = "migrations"`.

## Production migration state

Inspect the intended remote database before applying:

```text
npx wrangler d1 migrations list jagports --remote
```

Compare the result with the reviewed migration sequence. Apply only the required reviewed migrations:

```text
npx wrangler d1 migrations apply jagports --remote
```

Verify the migration ledger again:

```text
npx wrangler d1 migrations list jagports --remote
```

The database name/ID and Cloudflare account must be checked before apply. Do not infer migration state from Worker deployment status.

For a migration that changes columns used by the deployed Worker, also verify the remote table shape explicitly. Example for the canonical PART image relationship:

```text
npx wrangler d1 execute jagports --remote --command "PRAGMA table_info(part_image);"
```

The PART image migration is not verified merely because the migration ledger reports success. The resulting `part_image` table must contain the columns required by the deployed Worker, including `image_ref` when the Worker query selects that column.

After schema verification, execute the affected application request and confirm that the previous D1 schema error no longer occurs. For example, `D1_ERROR: no such column: image_ref` must be treated as evidence that the deployed Worker and D1 schema are not aligned until the remote table shape and runtime request are both verified.

## Preview and local migration state

Preview D1 state is separate from production state. Where a preview D1 database is configured, use the preview environment/configuration and the installed Wrangler version's supported `--preview` behavior.

For local testing, run from the same Worker root:

```text
npx wrangler d1 migrations list jagports --local
npx wrangler d1 migrations apply jagports --local
```

Never use local or preview migration state as evidence of production migration state.

## Repeatability

```text
reviewed migration
    -> preview/local test
    -> merge
    -> inspect production migration state
    -> apply required migration
    -> verify migration ledger
    -> verify remote table shape
    -> verify affected runtime request
```

No database recreation is required for each new migration.

## Migration production record

Production migration records use:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/migration_<migrationShortDescription>.md
```

The record identifies the migration and evidence; the executable SQL remains in the reviewed Worker migration source directory. Do not confuse the record with the SQL migration itself.

Use the single execution-record template:

```text
3-Deployment/internet/solution/jagports/ExecutionRecordTemplate.md
```

## Rollback/recovery

Do not assume application rollback reverses a D1 migration. For destructive changes, establish the recovery/data-impact strategy before production application.

## Verification boundary

Use CLI/API first. Use Cloudflare UI only where the required state is not available through supported CLI/API operations.

Never record passwords, API tokens, recovery codes, password hashes, or other secret values.

## Official references

- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Wrangler D1 commands: https://developers.cloudflare.com/d1/wrangler-commands/
