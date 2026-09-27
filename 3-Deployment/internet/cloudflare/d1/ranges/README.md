# JEPC Range D1 identity setup

This procedure covers **database creation and identity verification only**. It does not apply schema migrations, add Worker bindings, import catalogue data, or expose a new database to VIEPS. Those steps need their own reviewed implementation. In particular, the current `4-Production/internet/cloudflare/workers/jagports/migrations/` chain includes fixture-seeding SQL and must not be applied wholesale to a Range database.

The name comes from an approved stable VIEPS Range slug: `jagports-<range_slug>`. For example, `xk` resolves to `jagports-xk`. The slug must be approved in the importer/Range mapping before creation; this command validates its syntax but cannot decide whether a catalogue model belongs to that Range.

## Requirements

- Node.js 24 or newer.
- The Cloudflare account ID for the intended account.
- A `CLOUDFLARE_API_TOKEN` with D1 Read and D1 Write permissions for that account for `create`; D1 Read is sufficient for `verify`. Keep the token out of the repository and command arguments.
- Check the account's D1 plan and current capacity. [Cloudflare's D1 limits](https://developers.cloudflare.com/d1/platform/limits/) currently allow 10 databases on Workers Free, with 500 MB per database and 5 GB total. The existing `jagports` database uses one of those slots if it is in the same account. State the verified account plan as `--account-plan free` or `paid`; the command does not infer it. On Free, it refuses creation when 10 databases already exist. It also reports database count and the remaining slots *if the account is on Free*. Cloudflare may enforce other limits.

## Procedure

From the repository root, first inspect the derived name without using Cloudflare credentials or changing anything:

```text
node 3-Deployment/internet/cloudflare/d1/ranges/setup-range-db.mjs plan --range xk
```

After the Range mapping, account, capacity, and derived name have been reviewed, set `CLOUDFLARE_API_TOKEN` in your local environment and run:

```text
node 3-Deployment/internet/cloudflare/d1/ranges/setup-range-db.mjs create --range xk --account-id <32-hex-account-id> --account-plan free --confirm-name jagports-xk
```

The command lists databases in the selected account before creating anything. If the name is absent and there is no checked-in configuration, it creates one D1 database through the [Cloudflare D1 API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/) and writes `config/xk.json` with the returned account/name/ID. Review and commit that file. If the name already exists without matching configuration, the command stops instead of adopting it. If configuration exists but Cloudflare has a different ID or no database, it stops instead of replacing anything. A repeated run with matching configuration verifies and reuses the same database.

To check an existing configured database without mutation:

```text
node 3-Deployment/internet/cloudflare/d1/ranges/setup-range-db.mjs verify --range xk --account-id <32-hex-account-id> --account-plan free
```

If creation succeeds but the process stops before `config/<range_slug>.json` is written or reviewed, **do not rerun creation expecting it to adopt the database**. Compare the remote database name/ID/account manually and record the identity in a reviewed configuration change. Never delete or recreate the database as a normal retry.

The next deployment slice must provide a schema-only migration path, verify its ledger and table shape against the configured ID, and implement/test Worker routing and STOCK reconciliation. Until then, this database is an unbound resource and not a live catalogue destination.

Local checks for this procedure:

```text
node --test 3-Deployment/internet/cloudflare/d1/ranges/test/setup-range-db.test.mjs
```
