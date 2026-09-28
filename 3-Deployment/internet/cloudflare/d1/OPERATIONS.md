# JEPC parts database deployment: operation instructions

This guide is the single deployment and operations authority for the Cloudflare D1 JEPC parts database. It defines database identity, separation, setup, schema application, verification and injection. The [Parts Data Model](../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md) defines the destination data and [schema.sql](parts/schema.sql) implements its D1 shape; the DataImporter runtime contract is in [SPEC_DataImporter.md](../../../../5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/SPEC_DataImporter.md). The same DataImporter CLI run that reads JEPC and records its local SQLite ledger then updates this parts database when the reviewed identity and Cloudflare token are available. The existing Worker migration chain includes fixtures and must never be applied to a parts database. The operational `jagports` D1 database remains separate and retains stock and fixture data. The completed website `TEST=1` work is separate; real parts-data website reads remain in [PR #961](https://github.com/jagports/jagports/pull/961).

The parts database name comes from an approved stable VIEPS Range slug: `jagports-<approved_range_slug>`. For example, `xk` resolves to `jagports-xk` and `xj` to `jagports-xj`. `source-range-map.json` separately identifies approved JEPC source-group IDs. A `--parse` pattern never assigns a Range; the import rejects a model with zero or multiple approved matches. The XK source groups `7422` and `3175` were checked against `menus/models_l_id_0.xml`.

## Database identity and separation

Each approved VIEPS Range has a separate parts database named `jagports-<approved_range_slug>`. The approved source-group map must resolve every staged source model to exactly one Range; the Range slug selects the destination and is never selected by the operator's `--parse` text.

The existing `jagports` D1 database holds operational stock and fixtures and is not a JEPC parts import target. A parts database contains only the schema-defined JEPC catalogue tables, with no fixture migrations or operational STOCK rows. Numeric row IDs are local to each database; a numbered JEPC PART uses the stable canonical key `JEPC:<part_number_normalized>`.

## Requirements

- Node.js 24 or newer.
- The Cloudflare account ID for the intended account.
- A `CLOUDFLARE_API_TOKEN` with D1 Read and D1 Write permissions for that account for creation, schema application and import; D1 Read is sufficient for identity verification. Keep the token out of the repository and command arguments.
- Check the account's D1 plan and current capacity. [Cloudflare's D1 limits](https://developers.cloudflare.com/d1/platform/limits/) currently allow 10 databases on Workers Free, with 500 MB per database and 5 GB total. The existing `jagports` database uses one of those slots if it is in the same account. State the verified account plan as `--account-plan free` or `paid`; the command does not infer it. On Free, it refuses creation when 10 databases already exist. It also reports database count and the remaining slots *if the account is on Free*. Cloudflare may enforce other limits. Workers Free also has daily D1 quotas of 5 million rows read and 100,000 rows written; once exceeded, D1 queries fail until the daily reset. Check remaining usage before import, because a random 40-category run is not guaranteed to fit the daily write quota. See [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Database creation must respect the account's verified D1 capacity. Credentials stay in the local environment, never in committed configuration or command arguments.

## Alignment with the Jagports D1 deployment procedure

Use the same controlled setup sequence documented for the existing Jagports D1 database in [CloudFlareGit_DB_Deployment.md](jagports/CloudFlareGit_DB_Deployment.md) and [CloudFlareGit_DB_Migrations.md](jagports/CloudFlareGit_DB_Migrations.md): authenticate to the intended Cloudflare account, inspect the existing database before creation, compare the target identity with reviewed repository configuration, create only when absent, record the returned database ID, apply schema separately, and verify the resulting remote state. Parts setup uses the repository-controlled parts CLI and D1 API because it has no Worker binding or fixture migration chain; it must preserve those same identity, review, separation, and verification controls.

Before any remote setup operation, run the read-only Wrangler account and database checks from the repository root:

```text
npx wrangler whoami
npx wrangler d1 list
```

Confirm the authenticated account ID is the intended account and compare the candidate database name and ID with the reviewed parts configuration. Then use the parts setup CLI below, which independently checks the selected account and exact database identity through the D1 API. Do not create through the dashboard or adopt an existing database without a matching reviewed configuration.

## Setup and verification contract

Before any catalogue write, derive the database name from the approved Range slug and verify the Cloudflare account, database name and UUID against reviewed `3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json`. Reuse an existing database only when its identity matches that configuration. Never silently adopt, delete or recreate an unconfigured or mismatched database.

Apply [schema.sql](parts/schema.sql) only after identity review. The schema application verifies its identity marker and refuses an occupied database without that marker. Repeated setup and schema commands verify and reuse the same database rather than resetting it. DataImporter verifies the same identity and schema before injection, replaces one category atomically, reads back its evidence hash, and only then records the confirmed D1 injection in its local SQLite ledger. Interrupted or repeated runs retry without discarding previously injected categories.

The setup commands below are infrastructure operations. DataImporter remains one local CLI invocation with required `--parse PATTERN` and optional `--estimate`. Website reads and the `TEST=1` URL parameter are separate from this database procedure.

## Procedure

From the repository root, first inspect the derived name without using Cloudflare credentials or changing anything:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs plan --range xk
```

After the Range mapping, account, capacity, and derived name have been reviewed, set `CLOUDFLARE_API_TOKEN` in your local environment and run:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs create --range xk --account-id <32-hex-account-id> --account-plan free --confirm-name jagports-xk
```

The command lists databases in the selected account before creating anything. If the name is absent and there is no checked-in configuration, it creates one D1 database through the [Cloudflare D1 API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/) and writes `3-Deployment/internet/cloudflare/d1/parts/config/xk.json` with the returned account/name/ID. Review and commit that file. If the name already exists without matching configuration, the command stops instead of adopting it. If configuration exists but Cloudflare has a different ID or no database, it stops instead of replacing anything. A repeated run with matching configuration verifies and reuses the same database.

To check an existing configured database without mutation:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs verify --range xk --account-id <32-hex-account-id> --account-plan free
```

If creation succeeds but the process stops before `3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json` is written or reviewed, **do not rerun creation expecting it to adopt the database**. Compare the remote database name/ID/account manually and record the identity in a reviewed configuration change. Never delete or recreate the database as a normal retry.

After reviewing `3-Deployment/internet/cloudflare/d1/parts/config/xk.json`, initialize and verify the schema:

```text
node 3-Deployment/internet/cloudflare/d1/parts/apply-parts-schema.mjs xk
```

`apply-parts-schema.mjs` verifies the remote UUID/name before writing. It refuses an occupied database with no parts database identity, and repeated calls verify the same identity. `3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json` records the reviewed deployment identity. The operational `jagports` database is not changed by these setup commands. Worker bindings for real parts-data website reads are separate work in [PR #961](https://github.com/jagports/jagports/pull/961).

With the reviewed schema in place, the DataImporter operator runs its existing `--parse PATTERN` command on the JEPC computer. With `CLOUDFLARE_API_TOKEN` set, that same process updates matching staged bundles through the [Cloudflare D1 query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/). Each category uses a D1 batch; the bundle hash is written last and read back before the local SQLite update record is saved. Repeat runs retain previous categories and retry staged bundles that have not been recorded as updated. Unknown source structures remain in SQLite and are not sent to D1.

Before handing the Product Owner the single DataImporter command, verify the reviewed `3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json`, remote schema identity and a usable `CLOUDFLARE_API_TOKEN` in the environment of the shell that will run the CLI. A token set only in an agent's separate process will not carry into that shell. Without these prerequisites, `--parse` can stage locally but cannot complete D1 injection. Website real-data routing remains in [PR #961](https://github.com/jagports/jagports/pull/961). Global cross-Range discovery, verified applicability and cross-Range supersession remain open under Issue #555; do not mark that Issue complete from this D1 update step.

Local checks for this procedure:

```text
node --test 3-Deployment/internet/cloudflare/d1/parts/test/setup-parts-db.test.mjs
```

