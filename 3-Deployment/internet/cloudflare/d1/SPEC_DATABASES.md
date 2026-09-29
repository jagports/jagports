# JEPC parts database deployment specification

This specification defines the deployment identity and technical requirements for the Cloudflare D1 parts databases receiving JEPC catalogue data. The destination data format is defined by the [VIEPS Parts Data Model](../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md) and implemented by [parts/schema.sql](parts/schema.sql). The source ancestry routing is recorded in [parts/source-range-map.json](parts/source-range-map.json). Setup and operator procedures are in [OPERATIONS.md](OPERATIONS.md); importer behavior is in the [DataImporter specification](../../../../5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/SPEC_DataImporter.md).

## Database identity

Each approved VIEPS Range has a separate parts database named `parts-<approved_range_slug>`, for example `parts-xk` and `parts-xj`. The reviewed source-group map resolves every JEPC model to exactly one approved VIEPS Range. That mapping selects the database; the operator's `--parse PATTERN` selects source models and never chooses a destination.

The operational D1 database named `jagports` remains separate and retains its stock and fixture data. Parts databases hold the JEPC catalogue tables defined by [parts/schema.sql](parts/schema.sql), without fixture migrations or operational stock rows.

## Setup requirements

Before creating or writing to a parts database, verify the Cloudflare account, approved Range slug, derived database name, and database UUID against the reviewed per-Range configuration. Reuse a database only when its account, name, and UUID match that configuration. Do not silently adopt, delete, or recreate an unconfigured or mismatched database.

Apply the parts schema separately from the operational Worker migration chain. The setup and schema tools must verify the target identity before remote writes, preserve existing imported category data, and fail on an unexpected identity or schema. Credentials remain in the local environment and are never committed.

The exact account checks, capacity checks, create-if-absent procedure, schema application, verification, and DataImporter operation sequence are specified in [OPERATIONS.md](OPERATIONS.md).
