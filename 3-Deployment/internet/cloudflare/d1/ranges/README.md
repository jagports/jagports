# JEPC Range D1 deployment

This procedure creates and verifies a Range D1 database, applies the schema-only JEPC catalogue schema, and records its Worker binding. The importer then publishes catalogue records from its local SQLite ledger. The existing Worker migration chain includes fixtures and must never be applied to a Range database. The operational `jagports` D1 database remains separate and retains stock and fixture data.

The name comes from an approved stable VIEPS Range slug: `jagports-<range_slug>`. For example, `xk` resolves to `jagports-xk`. `source-range-map.json` separately identifies approved JEPC source-group IDs. A `--parse` pattern never assigns a Range; the import rejects a model with zero or multiple approved matches. The XK source groups `7422` and `3175` were checked against `menus/models_l_id_0.xml`.

## Requirements

- Node.js 24 or newer.
- The Cloudflare account ID for the intended account.
- A `CLOUDFLARE_API_TOKEN` with D1 Read and D1 Write permissions for that account for creation, schema application and publication; D1 Read is sufficient for identity verification. Keep the token out of the repository and command arguments.
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

After reviewing `config/xk.json`, initialize and verify the schema, then generate the Worker bindings from the same reviewed identities:

```text
node 3-Deployment/internet/cloudflare/d1/ranges/apply-range-schema.mjs xk
node 3-Deployment/internet/cloudflare/d1/ranges/sync-worker-bindings.mjs
```

`apply-range-schema.mjs` verifies the remote UUID/name before writing. It refuses an occupied database with no Range schema identity, and repeated calls verify the same schema identity. `sync-worker-bindings.mjs` updates the marked section of the Worker's `wrangler.toml` with `RANGE_BINDINGS` and the corresponding D1 bindings; review and commit that change before deployment. The binding name is derived from the slug, such as `RANGE_XK`. `config/<slug>.json` is deployment identity, not a temporary import manifest. No catalogue rows are written to `jagports` by these commands.

With the reviewed schema and binding in place, the DataImporter operator runs its existing `--parse PATTERN` command on the JEPC computer. With `CLOUDFLARE_API_TOKEN` set, it publishes matching staged bundles through the [Cloudflare D1 query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/). Each category uses a D1 batch; the bundle hash is written last and read back before the local SQLite publication record is updated. Repeat runs retain previous categories and retry staged bundles that have not been recorded as published. Unknown source structures remain in SQLite and are not published.

Deploy the Worker with the reviewed `wrangler.toml` once the Range database is populated. `?TEST=1` on the VIEPS page keeps the existing fixture-backed route; without it, VIEPS reads the bound Range catalogue and non-fixture operational stock. If no real Range binding is configured, the real route reports an unavailable Range instead of falling back to fixtures. The current live lookup supports one configured Range by default, or an explicit `range=<slug>` when multiple bindings are present. Global cross-Range discovery, verified applicability and cross-Range supersession remain open under Issue #555; do not mark that Issue complete from this publication step.

Local checks for this procedure:

```text
node --test 3-Deployment/internet/cloudflare/d1/ranges/test/setup-range-db.test.mjs
```
