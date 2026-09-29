# Jagports Cloudflare D1 Operations

## Scope

Reusable operator procedure for creating and verifying repository-controlled `parts-<range_slug>` Cloudflare D1 database identities.

This procedure covers **database identity only**. It does not apply parts schema migrations, add Worker bindings, import JEPC catalogue data, publish the Search Index, or expose a database to VIEPS runtime.

The adjacent [README.md](README.md) defines the directory context and database-role boundary.

## Requirements

- Node.js 24 or newer.
- The Cloudflare account ID for the intended account.
- A `CLOUDFLARE_API_TOKEN` with D1 Read and D1 Write permissions for `create`; D1 Read is sufficient for `verify`.
- Keep the token out of the repository and command arguments.
- Verify the intended Cloudflare account, plan, and D1 capacity before creation.
- Supply the verified account plan as `--account-plan free` or `paid`. The utility does not infer it.

The utility checks the configured Workers Free database-count limit and refuses creation when that limit is reached.

Current Cloudflare limits must be verified from Cloudflare before relying on capacity assumptions.

## Plan

From the repository root, inspect the derived parts database name without Cloudflare credentials or mutation:

```text
node 3-Deployment/internet/cloudflare/d1/jagports/setup-parts-db.mjs plan --range xk
```

Expected database name:

```text
parts-xk
```

## Create

After verifying the Range mapping, Cloudflare account, capacity, and derived name, set `CLOUDFLARE_API_TOKEN` in the local environment and run:

```text
node 3-Deployment/internet/cloudflare/d1/jagports/setup-parts-db.mjs create --range xk --account-id <32-hex-account-id> --account-plan free --confirm-name parts-xk
```

Before creating anything, the utility lists D1 databases in the selected account.

If the derived name is absent and there is no checked-in configuration, it creates one D1 database through the Cloudflare D1 API and writes:

```text
3-Deployment/internet/cloudflare/d1/jagports/config/<range_slug>.json
```

The configuration records:

- Range slug;
- derived parts database name;
- Cloudflare account ID;
- returned database ID.

Review and commit that identity record.

The utility refuses to:

- adopt an existing same-name database that has no matching reviewed configuration;
- replace a configured database whose remote ID differs;
- recreate a configured database that is missing remotely;
- create a database when `--confirm-name` differs from deterministic `parts-<range_slug>`.

A repeated `create` with matching configuration verifies and reuses the same remote database.

## Verify

Verify an existing configured parts database without mutation:

```text
node 3-Deployment/internet/cloudflare/d1/jagports/setup-parts-db.mjs verify --range xk --account-id <32-hex-account-id> --account-plan free
```

Verification compares the requested Range/account, reviewed repository configuration, and remote Cloudflare database identity.

## Interrupted creation

If Cloudflare creation succeeds but execution stops before `config/<range_slug>.json` is written or reviewed, do not rerun creation expecting automatic adoption.

Instead:

1. compare the remote database name, database ID, and Cloudflare account manually;
2. verify they are the intended identity;
3. record the verified identity through a reviewed repository change.

Do not delete or recreate the database as a normal retry.

## Operational boundary after identity creation

A created database is not yet a VIEPS parts-data destination.

The following remain separate reviewed operations:

- parts schema initialization and verification;
- Worker D1 binding;
- configured Range -> binding routing;
- JEPC catalogue import;
- Search Index publication;
- runtime publication.

The exact database identity, schema, and Worker routing must be verified before runtime use.

## Local test

Run:

```text
node --test 3-Deployment/internet/cloudflare/d1/jagports/test/setup-parts-db.test.mjs
```
