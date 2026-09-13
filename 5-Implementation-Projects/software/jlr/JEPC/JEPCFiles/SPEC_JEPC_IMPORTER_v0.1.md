# Jagports JEPC Data Importer v0.1

(C)2026 by tlindi and ChatGPT

## Purpose

Define the v0.1/MVP operating specification for a restartable, discovery-driven JEPC data importer.

The importer must begin from source structures and target-schema concepts already understood with high confidence, process selected JEPC models incrementally, preserve unknown source information, and improve its parser/schema knowledge only when evidence from actual JEPC source requires it.

This specification complements the existing JEPC source-structure and importer documents. It does not replace the approved VIEPS Parts Data Model.

## Core operating principle

The importer must not require the complete JEPC installation to be reverse-engineered before useful import work can begin.

It shall:

1. start from known-good schema concepts;
2. process one persistent source bundle at a time;
3. detect source structures it already understands;
4. preserve and report structures it does not yet understand;
5. extend parser behavior when an existing schema can already represent newly understood source data;
6. extend the normalized schema only when a genuinely new source concept cannot be represented correctly by the existing approved model;
7. re-evaluate earlier unresolved data when later discoveries explain it;
8. commit progress transactionally so the importer can be stopped, corrected, and restarted safely.

## Source file bundle concept

JEPC files sharing model/category/item/language identifiers form a logical source bundle.

Example:

```text
cat_M3187_C11096_L0.xml
tl_M3187_C11096_L0.xml
Itm_M3187_C11096_I1_L0.xml
Itm_M3187_C11096_I1_attributes.xml
```

The importer shall preserve and use the identifiers encoded in filenames rather than treating files as unrelated inputs.

Observed interpretation to validate across multiple datasets:

- `M<n>` — JEPC Model_ID.
- `C<n>` — category identifier.
- `I<n>` — numbered top-level catalogue item within that category; current evidence strongly supports `I1` meaning top-level item 1, but this remains subject to verification across exceptional/missing-number cases.
- `L<n>` — language identifier.

The importer must preserve source scope because related files exist at different levels, including model/category/language and model/category/item/language scopes.

## Source index

### First start

On first start, the importer shall scan the configured JEPC source directory and create a persistent source-file index.

The index should record at least:

```text
path
filename
file family
model_id
category_id
item_id
language_id
size
modified time
processing status
```

A checksum may be stored where stronger change detection is justified.

### Later starts

On later starts, the importer must not blindly trust the old index.

It shall verify whether the source directory has been expanded or changed and reconcile the persistent index.

Detected changes shall be handled at least as follows:

```text
new file      -> add as UNPROCESSED
changed file  -> mark affected source bundle NEEDS_REPROCESS
missing file  -> retain history and mark MISSING/REMOVED
```

A complete million-file rescan must not be required for every processing loop. Index reconciliation is a startup/inventory concern; normal import processing shall use the persistent index.

## Configurable import scope

The importer must allow selection below the broad VIEPS Range level when JEPC exposes distinct model/sub-range/market variants.

The import scope therefore needs configurable profiles based on source facts such as:

- JEPC Model_ID;
- JEPC model/sub-range description;
- normalized Region/market context;
- optional language selection where appropriate.

Initial v0.1/MVP validation profiles:

1. `XK8 Coupe/Convertible up to (V) 042775` — Region `Rest of world excluding Americas`.
2. `XJ Series From (V)812317 to (V)F59525 (X308)` — Region `Rest of world excluding Americas`.
3. F-Type — representative modern JEPC source dataset.

Related durable source knowledge establishes that the corresponding Canada/USA XK8 and Canada/Mexico/USA X308 source variants represent `Region = Americas`.

## Incremental processing loop

The normal processing loop shall be restartable and persistent:

```text
1. Open database.
2. Check previous importer run state.
3. Run startup database health checks.
4. Verify/reconcile source index when required.
5. Load selected model/sub-range/Region profile(s).
6. Select the first indexed source bundle whose status requires processing.
7. Mark the bundle PROCESSING.
8. Begin a database transaction.
9. Read and interpret only the files belonging to that source bundle.
10. Insert/update known normalized data and preserve unresolved source data.
11. Validate the bundle result.
12. COMMIT, or ROLLBACK on failure.
13. Mark the bundle PROCESSED, UNKNOWN_STRUCTURE, NEEDS_REPROCESS, or ERROR as applicable.
14. Check whether new parser/schema knowledge explains earlier unresolved records.
15. Mark affected earlier bundles NEEDS_REPROCESS when required.
16. Check for a safe-stop request.
17. Repeat.
```

The importer must not rediscover/sort the entire million-file source tree before every bundle. It shall simply select the next indexed bundle that requires work.

## Persistent processing states

At minimum, source bundles should support states equivalent to:

```text
UNPROCESSED
PROCESSING
PROCESSED
UNKNOWN_STRUCTURE
NEEDS_REPROCESS
ERROR
```

Persist sufficient metadata to make restart behavior explainable, including parser/schema version where useful.

## Adaptive source/schema discovery

A newly encountered source element must never be silently discarded.

Discoveries shall be classified before deciding whether the database schema needs to change.

### 1. New value

Existing structure and semantics are understood, but a new value appears.

Action: store normally. No schema change.

### 2. New code or semantic unknown

The generic known source structure can already preserve the value, but its human/domain meaning is not yet decoded.

Example: a new JEPC applicability code appears in a structure already known to represent applicability.

Action: preserve raw code/value/flags and provenance. No schema change merely because the code is new.

### 3. New source format

The source carries an already understood domain concept using a previously unseen record/file layout.

Action: extend the parser, preserve evidence, then retry/reprocess affected bundles.

### 4. New normalized data concept

The source demonstrates a genuine relationship/entity/property that the approved normalized model cannot represent correctly.

Action: document the evidence and required semantic change, extend the schema through a controlled migration, update parser behavior, and reprocess affected source bundles.

The importer must not create arbitrary SQL columns merely because a new JEPC attribute code/value appears.

## Learning must also apply backwards

A later source discovery may explain records that were previously unresolved.

When parser/schema/semantic knowledge is improved, the importer shall identify affected prior data and mark it for reprocessing where practical.

Conceptually:

```text
new verified understanding
        |
        +-- document discovery
        +-- update parser/decoder/schema as required
        +-- process current bundle
        +-- find earlier affected UNKNOWN data
        +-- mark affected bundles NEEDS_REPROCESS
```

This is a controlled structural-learning mechanism, not machine learning.

## Documentation of learned structures

Meaningful discoveries must become durable development knowledge rather than existing only in code or logs.

Each significant discovery should record, as applicable:

```text
discovery
source model/category/item/files examined
evidence/example
confidence/status
parser effect
schema effect
previous unknowns affected
```

Distinguish verified facts, strongly supported observations, hypotheses, and unresolved meanings.

## Transaction and safe-stop behavior

One source bundle shall be the natural atomic transaction boundary where practical.

```text
BEGIN TRANSACTION
process related source files
validate
COMMIT
```

On failure:

```text
ROLLBACK
mark bundle ERROR or NEEDS_REPROCESS
```

### Operator stop

The importer must provide a cooperative stop mechanism that does not depend on abruptly terminating the process.

At minimum:

```text
[Q] Stop safely after current transaction
```

A stop request shall:

1. set a persistent/in-memory stop request;
2. finish or roll back the current atomic bundle transaction;
3. save processing state;
4. flush detailed logs;
5. mark the importer run as stopped by user;
6. close the database normally;
7. exit.

`Ctrl+C` should be trapped where practical and treated first as a graceful-stop request rather than immediate termination. A second forced interrupt may remain an emergency escape.

## Startup database health checks

Every restart shall perform lightweight database health verification before resuming imports.

For SQLite staging/import databases this should include, as appropriate:

```sql
PRAGMA foreign_key_check;
PRAGMA quick_check;
```

A stronger integrity check should run after abnormal termination, schema migration, explicit operator request, or failure of the quick check:

```sql
PRAGMA integrity_check;
```

The importer shall also verify its own state tables and detect bundles left in `PROCESSING` by an interrupted previous run.

Because bundle data is transactional, such bundles should normally be recoverable by marking them `NEEDS_REPROCESS` instead of attempting to continue from an unknown halfway state.

A persistent importer-run record should distinguish states such as:

```text
RUNNING
COMPLETED
STOPPED_BY_USER
FAILED
CRASH_RECOVERED
```

## Operator processing view

The terminal/operator view must favor stable, understandable aggregate information rather than rapidly changing internal bundle details.

Do not continuously display current filenames, current bundle identifiers, or deep current breadcrumb paths in the primary live view. Those details change too quickly for a human to follow and belong in the persistent detailed log.

The screen should be redrawn in place rather than producing an endlessly scrolling console log.

### Required header

Example:

```text
Jagports JEPC Data Importer v0.1
(C)2026 by tlindi and ChatGPT

JEPC Model_ID #3187
Jaguar XK8 Coupe/Convertible up to (V) 042775
Region: Rest of world excluding Americas
```

The model line must identify both the technical JEPC `Model_ID` and its source/Jaguar model description.

### Imported catalogue content table

Show first-level catalogue breadcrumb/path groups only after imported content exists for them.

Example:

```text
Imported catalogue content

Part path                               Unique parts   Occurrences (English)
AIR AND FUEL DELIVERY SYSTEMS           15             25
BATTERY/STARTER MOTOR/ALTERNATOR         1              3
BODY METAL PANELS AND SEALING            1              1
ENGINE                                  42             78
ENGINE COOLING SYSTEM                    1              2
EXTERIOR FITTINGS AND SUNROOF            1              1
```

Rows with zero imported content stay hidden.

Definitions:

- `Unique parts` = distinct canonical Jaguar part numbers represented in that displayed scope.
- `Occurrences` = imported catalogue/source occurrences of those parts; one canonical part may have multiple occurrences.
- The language qualifier in the occurrence column identifies the currently displayed path-language source, not a multiplication of canonical part identities.

### Translation coverage table

Show catalogue/path-item translation coverage separately from the first-level path table.

Example:

```text
Part path item translations             Unique parts   Occurrences
English                                 51             92
Italian                                 11             81
In all languages                        62            173
```

Rules:

- `In all languages / Unique parts` must be a true distinct count across all imported languages; do not sum per-language unique counts where the same part occurs in more than one language.
- `In all languages / Occurrences` represents all imported language-specific occurrences according to the source/import semantics.
- Importing another language must enrich the same catalogue structure/entity relationships rather than create language-specific duplicate canonical PART identities.

### Structure-discovery metrics

Show stable cumulative importer-learning metrics:

```text
Existing structure used                  152
Created new DB structures                 11
Unknown structures to be researched       2
Errors                                     0
```

Definitions:

- `Existing structure used` = processed source structures handled through already-known parser/schema behavior.
- `Created new DB structures` = genuinely new normalized schema elements/migrations introduced because the existing approved schema could not represent verified source semantics correctly. Parser-only extensions must not inflate this count.
- `Unknown structures to be researched` = preserved source structures whose semantic/structural interpretation remains unresolved and requires investigation.
- `Errors` = processing failures, distinct from unresolved-but-preserved structures.

### Optional overall progress

A stable progress line may also show indexed source-set progress without exposing rapidly changing current-bundle details, for example:

```text
Processed source sets: 1,284   Pending: 6,912
```

### Safe-stop control

The live view shall always keep the cooperative stop instruction visible:

```text
[Q] Stop safely after current transaction
```

## Detailed background log

The concise processing view does not replace detailed logging.

The importer shall retain a persistent detailed log sufficient to audit and diagnose processing, including where useful:

- run ID;
- source bundle and files;
- source identifiers;
- part/occurrence inserts or updates;
- parser/schema versions;
- detected unknowns;
- parser/schema discoveries;
- reprocessing decisions;
- warnings;
- errors;
- transaction outcome.

The operator should not be expected to follow this high-volume log visually during normal processing.

## v0.1/MVP acceptance direction

The importer v0.1/MVP should demonstrate that:

- the source index can be created and later reconciled when source contents expand;
- selected model/sub-range/Region profiles can be processed independently;
- processing resumes from persistent bundle state rather than restarting from the beginning;
- known structures import without schema churn;
- unknown structures are preserved and surfaced rather than discarded;
- genuinely new normalized concepts can be documented and added through controlled migration;
- later discoveries can trigger targeted reprocessing of earlier unresolved data;
- bundle transactions protect the staging database from partial source-set imports;
- the importer can be stopped cooperatively and restarted safely;
- database health is checked before restart/resume;
- the operator sees stable aggregate model/path/language/structure metrics without a scrolling per-record console flood;
- detailed processing remains available in background logs;
- canonical part identity remains independent from language-specific source occurrences.

## Related work

- Issue #355 — JEPC Data Importer; primary implementation owner.
- Issue #354 — Parts Data Model; owns approved normalized persistent entities and relationships.
- Issue #620 — multilingual JEPC catalogue-data specification; relevant to language-specific source/translation handling without duplicating canonical entities.
- PR #621 — JEPC source Region/breadcrumb semantics used by configurable importer source selection.

This specification does not authorize a parallel Parts Data Model. Importer-discovered schema changes must be reconciled with the approved model and project workflow before becoming production schema.