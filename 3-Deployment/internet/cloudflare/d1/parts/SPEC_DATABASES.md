# JEPC parts database deployment specification

This specification governs the Cloudflare D1 **parts database** used for imported JEPC catalogue data. The parts data format is defined by [the Parts Data Model](../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md) and represented by the executable [schema.sql](schema.sql). The DataImporter runtime contract is in [SPEC_DataImporter.md](../../../../../5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/SPEC_DataImporter.md). The executable database setup and operation steps are in [OPERATIONS.md](../OPERATIONS.md); the [DataImporter README](../../../../../5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/README.md) explains importer usage.

## Database identity and separation

Each approved VIEPS Range has a separate parts database named `parts-<range_slug>`; for example, XK uses `parts-xk` and XJ uses `parts-xj`. The Range slug identifies which parts database receives a JEPC source group. It is not selected by the operator's `--parse` text. The approved [source-group map](source-range-map.json) must resolve every staged source model to exactly one Range, or DataImporter must refuse the D1 write.

The existing `jagports` D1 database holds operational stock and fixtures. It is not a JEPC parts import target. A parts database contains the schema-only JEPC catalogue tables in [schema.sql](schema.sql), with no fixtures or operational STOCK rows. The operational Worker migration chain must not be applied to a parts database. Numeric row IDs belong to their own database; the stable canonical key for a numbered imported JEPC part is `JEPC:<part_number_normalized>`.

## Setup and verification contract

Deployment must derive the database name from an approved Range slug and verify the Cloudflare account, name and database UUID against approved `config/<range_slug>.json` before any catalogue write. A matching existing database may be reused only with matching approved configuration. An existing database without approved configuration must not be silently adopted, deleted or recreated. Database creation must respect the account's verified D1 capacity. Credentials stay in the local environment, never in committed configuration or command arguments.

Apply [schema.sql](schema.sql) only after identity review. The schema application verifies its identity marker and refuses an occupied database without that marker. Repeated setup and schema commands must verify and reuse the same database rather than reset data. DataImporter must verify that same identity and schema before injecting any JEPC rows. It replaces one category atomically, reads back the recorded evidence hash, and only then records the confirmed D1 import in its local SQLite ledger. Interrupted or repeated runs retry without discarding earlier imported categories.

The setup commands and their exact order are specified in [OPERATIONS.md](../OPERATIONS.md). They are infrastructure operations; the DataImporter remains one local CLI invocation with required `--parse PATTERN` and optional `--estimate`. Website reads and the `TEST=1` URL parameter are separate from this deployment contract.

