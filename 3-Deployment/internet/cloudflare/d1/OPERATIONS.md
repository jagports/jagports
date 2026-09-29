# JEPC parts database deployment: operation instructions

This guide is the single deployment and operations authority for the Cloudflare D1 JEPC parts database. It defines database identity, separation, setup, schema application, verification and injection. The [Parts Data Model](../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md) defines the destination data and [schema.sql](parts/schema.sql) implements its D1 shape; the DataImporter runtime contract is in [SPEC_DataImporter.md](../../../../5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/SPEC_DataImporter.md). The same DataImporter CLI run that reads JEPC and records its local SQLite ledger then updates this parts database when the reviewed identity and Cloudflare token are available. The existing Worker migration chain includes fixtures and must never be applied to a parts database. The operational `jagports` D1 database remains separate and retains stock and fixture data. The completed website `TEST=1` work is separate; real parts-data website reads are handled separately by merged [PR #981](https://github.com/jagports/jagports/pull/981), [PR #982](https://github.com/jagports/jagports/pull/982), and [PR #984](https://github.com/jagports/jagports/pull/984).

The parts database name comes from an approved stable VIEPS Range slug: `parts-<approved_range_slug>`. For example, `xk` resolves to `parts-xk` and `xj` to `parts-xj`. `source-range-map.json` separately identifies approved JEPC source-group IDs. A `--parse` pattern never assigns a Range; the import rejects a model with zero or multiple approved matches. The XK source groups `7422` and `3175` were checked against `menus/models_l_id_0.xml`.

## Database identity and separation

Each approved VIEPS Range has a separate parts database named `parts-<approved_range_slug>`. The approved source-group map must resolve every staged source model to exactly one Range; the Range slug selects the destination and is never selected by the operator's `--parse` text.

The existing `jagports` D1 database holds operational stock and fixtures and is not a JEPC parts import target. A parts database contains only the schema-defined JEPC catalogue tables, with no fixture migrations or operational STOCK rows. Numeric row IDs are local to each database; a numbered JEPC PART uses the stable canonical key `JEPC:<part_number_normalized>`.

## Requirements

- Node.js 24 or newer.
- The Cloudflare account ID for the intended account.
- A `CLOUDFLARE_API_TOKEN` restricted to the intended account with D1 read and write access. In Cloudflare's current Custom Token screen, the combined permission is shown as **Account → D1 → Edit**. Keep the token out of the repository and command arguments.

## Create the D1 API token

Create a dedicated token for parts database setup and DataImporter access:

1. In Cloudflare, open **User API Tokens**, choose **Create Token**, then **Create Custom Token → Get started**.
2. Give the token a recognizable name; the name is an operator choice and is not read by the software.
3. Add one permission row: **Account → D1 → Edit**. In the current UI, D1 can be selected only once; do not add a duplicate D1 row. **Read** alone cannot create the database or write its schema/data.
4. Under **Account Resources**, select **Include** and choose only the verified intended account, `Parts@jagports.fi`. Do not leave **All accounts** selected.
5. Review the summary; it must show **D1: Edit** for the intended account only. Create the token and save the secret in the approved password manager. Cloudflare displays the secret once; never paste it into GitHub, a command argument, or this guide.
6. At run time, provide the token to Wrangler and the parts setup/DataImporter tools through the shell environment variable `CLOUDFLARE_API_TOKEN`. Do not use the Worker `ADMIN_TOKEN`; it is unrelated.

The same account-scoped API token can authenticate Wrangler commands and the parts setup/DataImporter direct D1 API calls. Wrangler browser OAuth is not used by the direct API client.
- Check the account's Workers plan and current D1 capacity. In Cloudflare, open **Manage Account → Billing → Subscriptions**: an active **Workers Free** subscription means use `--account-plan free`; an active **Workers Paid** subscription means use `--account-plan paid`. This is the Workers plan, not the domain plan. [Cloudflare's D1 limits](https://developers.cloudflare.com/d1/platform/limits/) currently allow 10 databases on Workers Free, with 500 MB per database and 5 GB total. The existing `jagports` database uses one of those slots if it is in the same account. State the verified account-plan value as `free` or `paid`; the command does not infer it. On Free, it refuses creation when 10 databases already exist. It also reports database count and the remaining slots *if the account is on Free*. Cloudflare may enforce other limits. Workers Free also has daily D1 quotas of 5 million rows read and 100,000 rows written; once exceeded, D1 queries fail until the daily reset. Check remaining usage before import, because a random 40-category run is not guaranteed to fit the daily write quota. See [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

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

Apply [schema.sql](parts/schema.sql) only after identity review. The schema application verifies its identity marker and refuses an occupied database without that marker. Repeated setup and schema commands verify and reuse the same database rather than resetting it. DataImporter verifies the same identity and schema before injection, replaces one category atomically, reads back its evidence hash, and only then records the confirmed D1 injection in its local SQLite ledger. JEPC is authoritative for catalogue part and occurrence fit: DataImporter marks JEPC-derived parts, occurrences, source tree nodes and occurrence-tree paths `verified`. An import run also upgrades previously imported JEPC rows in that parts database, even when their evidence hashes have not changed. Interrupted or repeated runs retry without discarding previously injected categories.

The setup commands below are infrastructure operations. DataImporter remains one local CLI. Parsing requires `--source <JEPC root>` and `--state-dir <directory>`, then either `--parse PATTERN` or `--category MODEL_ID:CATEGORY_ID [--item ID]`. The optional `--import` flag requests D1 injection; `--estimate` is valid only with `--import`. Website reads and the `TEST=1` URL parameter are separate from this database procedure.

## Procedure

In Git Bash, first change to `PROJECT_ROOT`, the local Jagports repository folder containing `3-Deployment` and `5-Implementation-Projects`:

```text
cd "<PROJECT_ROOT>"
```

Replace `<PROJECT_ROOT>` with the full path to that folder. Run the following commands from there. First inspect the derived name without using Cloudflare credentials or changing anything:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs plan --range xk
```

After the Range mapping, account, capacity, and derived name have been reviewed, set `CLOUDFLARE_API_TOKEN` in your local environment and run:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs create --range xk --account-id <32-hex-account-id> --account-plan <free-or-paid> --confirm-name parts-xk
```

The command lists databases in the selected account before creating anything. If the name is absent and there is no checked-in configuration, it creates one D1 database through the [Cloudflare D1 API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/) and writes `3-Deployment/internet/cloudflare/d1/parts/config/xk.json` with the returned account/name/ID. Review the values, then stage and commit only the generated Range configuration from the repository root:

```text
git add 3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json
git commit -m "Record parts-<range_slug> D1 database identity"
git push origin <branch-name>
```

Replace `<branch-name>` with the branch used for the deployment change so the reviewed identity is present on GitHub before schema setup.

If the name already exists without matching configuration, the command stops instead of adopting it. If configuration exists but Cloudflare has a different ID or no database, it stops instead of replacing anything. A repeated run with matching configuration verifies and reuses the same database.

To check an existing configured database without mutation:

```text
node 3-Deployment/internet/cloudflare/d1/parts/setup-parts-db.mjs verify --range xk --account-id <32-hex-account-id> --account-plan <free-or-paid>
```

If creation succeeds but the process stops before `3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json` is written or reviewed, **do not rerun creation expecting it to adopt the database**. Compare the remote database name/ID/account manually and record the identity in a reviewed configuration change. Never delete or recreate the database as a normal retry.

After reviewing `3-Deployment/internet/cloudflare/d1/parts/config/xk.json`, initialize and verify the schema:

```text
node 3-Deployment/internet/cloudflare/d1/parts/apply-parts-schema.mjs xk
```

`apply-parts-schema.mjs` verifies the remote UUID/name before writing. It refuses an occupied database with no parts database identity, applies the schema, then queries the remote `parts_database_identity` row to verify Range, database name, and schema version. A successful result includes `rangeSlug`, `databaseName`, `databaseId`, and `schemaVersion: 1`; repeated calls verify and reuse the same schema. `3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json` records the reviewed deployment identity. The operational `jagports` database is not changed by these setup commands. Worker binding to the XK parts database was implemented separately in merged [PR #981](https://github.com/jagports/jagports/pull/981).

With the reviewed schema in place, the DataImporter operator runs the documented CLI on the JEPC computer, including `--import` to request a D1 write. The selector is either a source model pattern (`--parse PATTERN`, up to 40 random complete category bundles) or one source category (`--category MODEL_ID:CATEGORY_ID`, optionally narrowed to `--item ID`). With `CLOUDFLARE_API_TOKEN` set, that same process updates the mapped parts database through the [Cloudflare D1 query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/). Each category uses a D1 batch; the bundle hash is written last and read back before the local SQLite update record is saved. Repeat runs retain previous categories and retry staged bundles that have not been recorded as updated. Unknown source structures remain in SQLite and are not sent to D1.

## Verify imported parts directly in D1

To confirm the category/item import independently of the website, query the remote parts database with Wrangler from the repository root. This is read-only. For the example run `--category 3187:11096 --item 1` with the default language `0`, run:

```sh
npx wrangler d1 execute parts-xk --remote --command "SELECT p.part_number_raw, p.part_number_normalized, o.context_ref, o.item_number, n.label AS part_tree_node, o.verification_status, o.source_ref FROM part_occurrence o JOIN part p ON p.id = o.part_id LEFT JOIN part_occurrence_tree_path t ON t.part_occurrence_id = o.id LEFT JOIN part_tree_node n ON n.id = t.tree_node_id WHERE o.source = 'JEPC' AND o.context_ref = '3187/11096/L0' AND o.item_number = '1' ORDER BY p.part_number_normalized, o.source_ref;"
```

Each returned row is an imported JEPC occurrence, with its canonical part number, source context, linked tree node and verification status. After running the updated DataImporter with `--import`, the status should read `verified`. The next import run upgrades JEPC rows that were imported by earlier builds, even if the source evidence is unchanged. The example should return the item’s D1 occurrences (the reported import had two). An empty result means no matching occurrence exists in `parts-xk` for that model/category/item/language; check that the CLI run completed D1 injection and that the context values match. For another selection, replace `3187/11096/L0` and `1` with the selected `MODEL_ID/CATEGORY_ID/L<language>` and item ID. Omit the item filter to inspect all occurrences in the category.

Before handing the Product Owner the DataImporter command, verify the reviewed `3-Deployment/internet/cloudflare/d1/parts/config/<range_slug>.json`, remote schema identity and a usable `CLOUDFLARE_API_TOKEN` in the environment of the shell that will run the CLI. A token set only in an agent's separate process will not carry into that shell. Without these prerequisites, parsing can stage locally but cannot complete D1 injection. Website parts-data reads remain separate from DataImporter and were implemented in merged PRs #981, #982 and #984.. Global cross-Range discovery, verified applicability and cross-Range supersession remain open under Issue #555; do not mark that Issue complete from this D1 update step.

Local checks for this procedure:

```text
node --test 3-Deployment/internet/cloudflare/d1/parts/test/setup-parts-db.test.mjs
```
