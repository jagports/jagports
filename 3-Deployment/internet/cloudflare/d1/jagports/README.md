# Jagports Cloudflare D1

## Purpose

This directory contains the repository-controlled Cloudflare D1 procedures for the Jagports VIEPS application database and the JEPC **parts databases** partitioned by configured vehicle Range.

The two database roles are distinct:

```text
jagports
  -> fixture-backed / operational application database
  -> mutable STOCK and application state

parts-<range_slug>
  -> imported JEPC/EPC parts database
  -> catalogue/reference data for one configured vehicle Range
```

A Range is application configuration used to select a parts database. A Range is not a database type.

Related procedures:

- [Jagports D1 deployment](CloudFlareGit_DB_Deployment.md)
- [Jagports D1 migrations](CloudFlareGit_DB_Migrations.md)

## Parts database identity setup

The repository-controlled setup utility is:

```text
3-Deployment/internet/cloudflare/d1/jagports/setup-range-db.mjs
```

It creates or verifies a parts database identity only. It does not apply schema migrations, add Worker bindings, import catalogue data, or expose the database to VIEPS.

Database names are derived from an accepted stable VIEPS Range slug:

```text
<range_slug> -> parts-<range_slug>
xk           -> parts-xk
f-type       -> parts-f-type
```

The command validates Range-slug syntax but does not decide whether a JEPC model belongs to that Range.

The Worker migration chain under `4-Production/internet/cloudflare/workers/jagports/migrations/` includes application/fixture behavior and must not be applied wholesale to a parts database. Parts schema setup remains a separate operation from database creation.

## Requirements

- Node.js 24 or newer.
- The Cloudflare account ID for the intended account.
- A `CLOUDFLARE_API_TOKEN` with D1 Read and D1 Write permissions for `create`; D1 Read is sufficient for `verify`.
- Keep the token out of the repository and command arguments.
- Verify the intended Cloudflare account, plan and D1 capacity before creation.
- Supply the verified account plan as `--account-plan free` or `paid`. The utility does not infer it.
- On the configured Workers Free limit, the utility refuses creation when the database-count limit is reached and reports remaining slots.

Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/

## Plan

From the repository root, inspect the derived parts database name without Cloudflare credentials or mutation:

```text
node 3-Deployment/internet/cloudflare/d1/jagports/setup-range-db.mjs plan --range xk
```

Expected database name:

```text
parts-xk
```

## Create

After verifying the Range mapping, Cloudflare account, capacity and derived name, set `CLOUDFLARE_API_TOKEN` in the local environment and run:

```text
node 3-Deployment/internet/cloudflare/d1/jagports/setup-range-db.mjs create --range xk --account-id <32-hex-account-id> --account-plan free --confirm-name parts-xk
```

Before creating anything, the utility lists D1 databases in the selected account.

If the derived name is absent and there is no checked-in configuration, it creates one D1 database through the Cloudflare D1 API and writes:

```text
3-Deployment/internet/cloudflare/d1/jagports/config/<range_slug>.json
```

The configuration records the Range slug, derived parts database name, Cloudflare account ID and returned database ID.

Review and commit that identity record.

The utility refuses to:

- adopt an existing same-name database that has no matching reviewed configuration;
- replace a configured database whose remote ID differs;
- recreate a configured database that is missing remotely;
- create a database when the supplied confirmation name differs from the deterministic `parts-<range_slug>` name.

A repeated `create` with matching configuration verifies and reuses the same remote database.

## Verify

To verify an existing configured parts database without mutation:

```text
node 3-Deployment/internet/cloudflare/d1/jagports/setup-range-db.mjs verify --range xk --account-id <32-hex-account-id> --account-plan free
```

Verification compares the requested Range/account, reviewed repository configuration and remote Cloudflare database identity.

## Interrupted creation

If Cloudflare creation succeeds but execution stops before `config/<range_slug>.json` is written or reviewed, do not rerun creation expecting automatic adoption.

Compare the remote database name, database ID and account manually, then record the verified identity through a reviewed repository change. Do not delete or recreate the database as a normal retry.

## Parts schema and runtime binding

Database creation is separate from:

- parts schema initialization and verification;
- Worker D1 binding;
- configured Range -> binding routing;
- JEPC catalogue import;
- runtime publication.

The database is not a VIEPS parts-data destination until the exact database identity, schema and Worker routing have been verified.

The fixture-backed `jagports` database remains separate from `parts-<range_slug>` databases.

## Local test

Run:

```text
node --test 3-Deployment/internet/cloudflare/d1/jagports/test/setup-range-db.test.mjs
```
