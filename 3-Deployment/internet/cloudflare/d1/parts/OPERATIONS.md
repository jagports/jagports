# JEPC parts database deployment: operation instructions

This procedure creates and verifies a D1 parts database for an approved Range and applies the schema-only JEPC catalogue schema. The same DataImporter CLI run that reads JEPC and records its local SQLite ledger then updates that parts database when the reviewed identity and Cloudflare token are available. The existing Worker migration chain includes fixtures and must never be applied to a parts database. The operational `jagports` D1 database remains separate and retains stock and fixture data. The [deployment specification](SPEC_Parts_Database_Deployment.md) defines the requirements; the [Parts Data Model](../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md) defines the destination data. The completed website `TEST=1` work is separate; real parts-data website reads remain in [PR #961](https://github.com/jagports/jagports/pull/961).

The parts database name comes from an approved stable VIEPS Range slug: `parts-<range_slug>`. For example, `xk` resolves to `parts-xk` and `xj` to `parts-xj`. `source-range-map.json` separately identifies approved JEPC source-group IDs. A `--parse` pattern never assigns a Range; the import rejects a model with zero or multiple approved matches. The XK source groups `7422` and `3175` were checked against `menus/models_l_id_0.xml`.

## Requirements

- Node.js 24 or newer.
- The Cloudflare account ID for the intended account.
- A `CLOUDFLARE_API_TOKEN` with D1 Read and D1 Write permissions for that account for creation, schema application and import; D1 Read is sufficient for identity verification. Keep the token out of the repository and command arguments.
- Check the account's D1 plan and current capacity. [Cloudflare's D1 limits](https://developers.cloudflare.com/d1/platform/limits/) currently allow 10 databases on Workers Free, with 500 MB per database and 5 GB total. The existing `jagports` database uses one of those slots if it is in the same account. State the verified account plan as `--account-plan free` or `paid`; the command does not infer it. On Free, it refuses creation when 10 databases already exist. It also reports database count and the remaining slots *if the account is on Free*. Cloudflare may enforce other limits.

## Procedure

From the repository root, first inspect the derived name without using Cloudflare credentials or changing anything:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs plan --range xk
```

After the Range mapping, account, capacity, and derived name have been reviewed, set `CLOUDFLARE_API_TOKEN` in your local environment and run:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs create --range xk --account-id <32-hex-account-id> --account-plan free --confirm-name parts-xk
```

The command lists databases in the selected account before creating anything. If the name is absent and there is no checked-in configuration, it creates one D1 database through the [Cloudflare D1 API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/) and writes `config/xk.json` with the returned account/name/ID. Review and commit that file. If the name already exists without matching configuration, the command stops instead of adopting it. If configuration exists but Cloudflare has a different ID or no database, it stops instead of replacing anything. A repeated run with matching configuration verifies and reuses the same database.

To check an existing configured database without mutation:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs verify --range xk --account-id <32-hex-account-id> --account-plan free
```

If creation succeeds but the process stops before `config/<range_slug>.json` is written or reviewed, **do not rerun creation expecting it to adopt the database**. Compare the remote database name/ID/account manually and record the identity in a reviewed configuration change. Never delete or recreate the database as a normal retry.

After reviewing `config/xk.json`, initialize and verify the schema:

```text
node 3-Deployment/internet/cloudflare/d1/parts/apply-parts-schema.mjs xk
```

`apply-parts-schema.mjs` verifies the remote UUID/name before writing. It refuses an occupied database with no parts database identity, and repeated calls verify the same identity. `config/<slug>.json` is deployment identity, not a temporary import manifest. No catalogue rows are written to `jagports` by these commands. Worker bindings for real parts-data website reads are separate work in [PR #961](https://github.com/jagports/jagports/pull/961).

With the reviewed schema in place, the DataImporter operator runs its existing `--parse PATTERN` command on the JEPC computer. With `CLOUDFLARE_API_TOKEN` set, that same process updates matching staged bundles through the [Cloudflare D1 query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/). Each category uses a D1 batch; the bundle hash is written last and read back before the local SQLite update record is saved. Repeat runs retain previous categories and retry staged bundles that have not been recorded as updated. Unknown source structures remain in SQLite and are not sent to D1.

Before handing the Product Owner the single DataImporter command, verify the reviewed `config/<range_slug>.json`, remote schema identity and a usable `CLOUDFLARE_API_TOKEN` in the environment of the shell that will run the CLI. A token set only in an agent's separate process will not carry into that shell. Without these prerequisites, `--parse` can stage locally but cannot complete D1 injection. Website real-data routing remains in [PR #961](https://github.com/jagports/jagports/pull/961). Global cross-Range discovery, verified applicability and cross-Range supersession remain open under Issue #555; do not mark that Issue complete from this D1 update step.

Local checks for this procedure:

```text
node --test 3-Deployment/internet/cloudflare/d1/parts/test/setup-parts-db.test.mjs
```
