# VIEPS Cloudflare Worker + D1 Upgrade Guide

## Purpose

Provide the shortest safe upgrade path after reviewed VIEPS changes reach `main`.

A Cloudflare Worker deployment and a Cloudflare D1 migration are separate operations. A successful Worker deployment does **not** prove that the remote D1 schema/data migrations have been applied.

## Upgrade sequence

```text
reviewed change
    -> merge to main
    -> Worker build/deploy
    -> verify remote D1 migration ledger
    -> apply pending reviewed migrations
    -> verify remote schema
    -> verify affected live request
```

Do not change Worker queries merely to hide a missing-column error until remote migration drift has been ruled out.

## Required working directory

Run D1 migration commands from the active Worker root:

```text
jagports/jagports/4-Production/internet/cloudflare/workers/jagports/
```

This directory contains the active `wrangler.toml` and its relative `migrations_dir = "migrations"`.

Running from the repository root without an explicit configuration path can fail with:

```text
No configuration file found
```

If running from another directory is necessary, pass the active configuration explicitly.

## Verify operator and target

From the Worker root:

```text
npx wrangler whoami
cat wrangler.toml
```

Confirm the intended Jagports Cloudflare account, D1 database name `jagports`, binding `DB`, and migration directory before any remote mutation.

## Inspect remote migration state

```text
npx wrangler d1 migrations list jagports --remote
```

Treat this remote ledger as authoritative for the current Cloudflare database state.

Do not infer D1 state from:

- GitHub merge status;
- Worker deployment success;
- local D1 migration state;
- preview D1 migration state;
- repository migration filenames alone.

## Apply pending reviewed migrations

Only from a reviewed migration set corresponding to `main`:

```text
npx wrangler d1 migrations apply jagports --remote
```

Then verify again:

```text
npx wrangler d1 migrations list jagports --remote
```

No database recreation is required for normal forward migrations.

## Migration filename rule

Cloudflare migration tracking uses the full migration filename. Do not rename an already-reviewed or already-applied migration merely because another migration shares the same numeric prefix.

If duplicate numeric prefixes exist, first inspect the remote ledger. Preserve already-tracked filenames and resolve future ordering with a new reviewed migration filename rather than rewriting migration history.

## Verify affected remote schema

For STOCK changes:

```text
npx wrangler d1 execute jagports --remote --command "PRAGMA table_info(stock_item);"
npx wrangler d1 execute jagports --remote --command "PRAGMA table_info(stock_location);"
npx wrangler d1 execute jagports --remote --command "PRAGMA table_info(stock_source_party);"
```

For other migrations, inspect the affected table/index/trigger explicitly.

A successful migration-ledger update is not enough when the deployed Worker depends on a specific table shape.

## Verify the live runtime

After schema verification, exercise the request affected by the migration.

For the current VIEPS pre-production Worker:

```text
https://vieps.parts-5ec.workers.dev
```

For PART/stock lookup, use reviewed fixture or known test part numbers rather than inventing probes.

For Stock Admin, verify both:

- the page asset is served;
- authenticated API operations use the expected remote D1 schema.


## Suitability mapping migration verification

After merging the reviewed Suitability Admin/public-filter changes, check the **actual remote** D1 ledger independently of the Worker deployment. The additive, reviewed migrations are:

- `0019_suitability_description_mapping.sql` — source-qualified descriptions, append-only mapping revisions, localized normalized labels and occurrence-level evidence.
- `0020_suitability_admin.sql` — normalized category/value retirement and immutable Admin audit history.

From the active Worker root on an authenticated operator's workstation:

~~~powershell
npx wrangler whoami
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 execute jagports --remote --command "SELECT name FROM sqlite_schema WHERE type='table' AND name IN ('applicability_source_description','applicability_description_mapping_revision','applicability_dimension_retirement','applicability_suitability_admin_audit') ORDER BY name;"
npx wrangler d1 execute jagports --remote --command "SELECT name FROM sqlite_schema WHERE type='view' AND name='applicability_description_mapping_current';"
~~~

**PASS:** both migration filenames are recorded as applied; all four tables and the current-revision view exist in the intended D1 database. **BLOCKED/FAIL:** a pending migration, missing table or view, wrong Cloudflare account, or missing database binding. Apply outstanding reviewed migrations only through the separately authorized production migration step above, then recheck. No migration inserts synthetic Suitability fixture rows; those reside exclusively in `tests/fixtures/occurrence_applicability.sql`.

The public `GET /api/vieps/suitability` intentionally returns HTTP 503 with `normalized_suitability_not_published` while fixture mode is disabled and a reviewed real JEPC consumer is not yet available. That response proves fail-closed behaviour but **does not establish** that migrations have been applied. The unauthenticated `GET /api/admin/suitability` must return HTTP 401; authenticated Admin read-back requires both a valid application Admin token and the applied remote schema.

The actionable, no-credential public probes; current Admin browser checks; safe local fixture tests; remote regression commands; and required evidence record are in [VIEPS Application Functional Testing](../../../jagports/solution/vieps/SetupTesting.md), under **Suitability release and test procedure**.

## Missing-column troubleshooting

If a live request fails with:

```text
D1_ERROR: no such column: <column-name>
```

use this order:

1. verify `npx wrangler whoami`;
2. list remote migrations;
3. apply pending reviewed migrations;
4. re-list remote migrations;
5. inspect the affected table shape;
6. retry the live request;
7. only then consider application-code changes.

Do not remove DB-specified fields from Worker queries merely to mask an unapplied migration.

## Seed/data migrations

Seed/data migrations follow the same deployment boundary as schema migrations.

A Worker deployment does not automatically apply seed/data migrations either.

Repository test fixtures that are not in the production migration directory are **not** loaded into remote D1 by `d1 migrations apply`.

## Evidence record

Record:

- reviewed commit/PR;
- operator;
- environment;
- remote migration names applied;
- pre/post migration ledger;
- relevant schema verification;
- live endpoint/request result.

Do not record credentials, OAuth tokens, API tokens, passwords, password hashes, or secret values.

## Related procedures

- `3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md`
- `3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Deployment.md`
- `3-Deployment/internet/cloudflare/workers/jagports/CloudFlareGit_App_Deployment.md`
- `3-Deployment/internet/jagports/solution/vieps/deployment_Execution.md`
