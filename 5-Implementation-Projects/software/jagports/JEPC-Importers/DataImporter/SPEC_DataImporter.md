# Jagports JEPC DataImporter specification


## Purpose

Define the DataImporter contract for incrementally reading JEPC source data, preserving lossless source evidence, maintaining restartable importer state, and publishing durable catalogue data that conforms to [MODEL_D1_DataImporter-JEPC.md](../../../../internet/jagports/solution/vieps/SPEC/MODEL_D1_DataImporter-JEPC.md) and [MODEL_PARTS.md](../../../../internet/jagports/solution/vieps/SPEC/MODEL_PARTS.md).

The importer processes selected JEPC source scopes incrementally, preserves unknown source information, and extends interpretation only when source evidence supports it.

## Command contract

```text
node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse PATTERN [--estimate]
```

Run this command from the repository root. `--parse PATTERN` selects source models by model-name fragment. `PATTERN` must contain at least two characters. `--estimate` adds a source inventory estimate for the selected run. Invalid flags or unsupported positional arguments fail with usage guidance.

The source root defaults to `C:\Program Files\JEPC\applications\JEPC`; `JEPC_SOURCE` may point to another installation. Local evidence and run records are stored in `%LOCALAPPDATA%\Jagports\JEPC-Importer\ledger.sqlite`. Source language `0` is the default unless another supported language is selected. Progress is emitted separately from the final machine-readable result.

## Persistence boundary

The local SQLite ledger is importer-owned evidence, processing state and recovery state. It is not the VIEPS runtime catalogue.

Durable imported catalogue data is published idempotently to the Range D1 database selected by source ancestry and Range mapping. A Range slug resolves to `parts-<range_slug>`. Command-line source selectors do not directly choose a destination database.

Deployment/account setup remains outside the importer data contract. A successful local parse is not a published import.

Kit, nested-kit and NSS observations must be preserved with provenance when encountered, including unnumbered constituents. No Jaguar part number or verified composition may be invented. The canonical PART model governs catalogue identity, occurrence evidence and verified composition.

## Core operating principle

The importer must not require the complete JEPC installation to be reverse-engineered before useful import work can begin.

It shall:

1. start from known-good schema concepts;
2. process one persistent source bundle at a time;
3. detect source structures it already understands;
4. preserve and report structures it does not yet understand;
5. continue processing safely when an unknown structure can be preserved for reprocessing;
6. extend parser behavior when an existing schema can already represent newly understood source data;
7. extend staging/discovery storage where doing so avoids rereading source files and preserves newly observed fields losslessly;
8. extend the normalized schema only when a genuinely new source concept cannot be represented correctly by the canonical model;
9. re-evaluate earlier unresolved data when new evidence explains it;
10. commit progress transactionally so the importer can be stopped, corrected, and restarted safely.

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
- `C<n>` — JEPC Category_ID.
- `I<n>` — numbered top-level catalogue item within that category; `I<n>` identifies the numbered top-level catalogue item; exceptional or missing-number cases must remain explicitly verifiable.
- `L<n>` — language identifier.

The importer must preserve source scope because related files exist at different levels, including model/category/language and model/category/item/language scopes.


## Occurrence-first catalogue import contract

The importer shall treat a JEPC PART as a canonical identity that may have multiple source occurrences. Each occurrence is bound to the exact catalogue/tree path and source applicability evidence in which the PART appears.

The source occurrence path is assembled from linked scopes:

```text
model / catalogue ancestry
    -> category ancestry
    -> top-level item description
    -> ordered item-tree descriptions
    -> PART leaf
```

The importer shall preserve, at minimum:

```text
canonical PART reference
source model/category/item/language scope
source tree node identity and ancestry
source ordering
source descriptions
applicationId
raw applicability rules and predicates
source-file / record provenance
```

A flattened `FullDescriptionPath` may be generated for logs, validation and exports, but must not be used as the structural identity of the tree or occurrence.

The human-readable source descriptions can be used as browse/filter candidates immediately. Raw `A`, `C` and other source predicates are still preserved for provenance and applicability evaluation. The importer must not attempt to reconstruct readable descriptions by positional alignment between predicates and tree nodes.

### Query behavior enabled by the import

Catalogue browsing:

```text
selected branch
    -> all occurrences below the branch
    -> optional description / VIN / applicability filtering
    -> surviving occurrences
    -> distinct PART numbers
```

PART-number search:

```text
PART number
    -> every source occurrence
    -> complete path for each occurrence
    -> applicationId + raw applicability evidence
```

Filtering is occurrence-first. The canonical PART remains visible if at least one occurrence survives the selected conditions.

### Semantic mapping

The importer shall not invent domain categories for source descriptions. A controlled mapping layer may map a source description to one or more normalized facets. The original description, occurrence path and raw predicates remain independently recoverable.

Mappings may be context-sensitive. A mapping change must not require a source re-import when the original occurrence/tree data is already preserved losslessly.

### Multilingual source trees

Language-qualified source trees must be preserved independently when JEPC structure differs between languages. Do not assume that i18n is only a translated string table over one universal tree.

Canonical PART identity may be shared across languages. Source node/path identity remains language-qualified unless deterministic equivalence is proven. Cross-language node or occurrence reconciliation is derived data, not an import assumption.

### Applicability and JEPC branch descriptions

These are separate layers, and each must be represented explicitly:

| Layer | Meaning | Required representation |
| --- | --- | --- |
| Source branch | A JEPC non-PART row on an item's parent-child path, with a source node ID, parent ID, order, language and text such as `To VIN (A36873)`, `RHD`, `LH side`, `Except Japan`, `assembly` or `Supercharged`. | Preserve the exact row, source location and language-qualified ancestry. A branch can be a condition, catalogue role, presentation grouping or still unresolved. Do not classify every branch as a vehicle predicate. |
| Source application | The PART leaf's source application ID and the matching keyed row in an available `Itm_*_attributes.xml` sidecar, together with model, category and top-level scope. | Join by exact application ID within the exact item sidecar; preserve raw tuples and report absent sidecars. One application can appear on multiple tree paths. |
| Normalized applicability | A verified assertion for one occurrence and model context, expressed as complete alternative condition sets with typed dimensions, VIN/serial bounds, operators and evidence. | Produce only when the relevant source scopes, branch meanings and predicate mapping have been verified. Missing information yields an explicit unavailable/unresolved state, never unrestricted applicability. |
| Fitment | Evaluation of normalized applicability against a supplied vehicle/configuration. | Return applicable, not applicable or unavailable with the supporting occurrence and reasons; it is a query result, not a permanent PART field. |

The importer must keep source branch nodes as catalogue evidence and must **not** copy JEPC's decision-tree navigation as the VIEPS applicability engine. `LH side` and `RHD` are separate source terms; the former is not silently rewritten as vehicle steering. Sibling branches may be alternatives, and repeated application IDs do not alone determine Boolean `AND` or `OR`. The sidecar's tuple order is not a description dictionary. A part-number search must return all its occurrences and their source paths; a filtered browse must evaluate occurrence-level assertions, then project surviving PARTs.

For a branch whose condition meaning is resolved, VIEPS shall store a stable normalized **description reference** for that meaning and present its localized label through an i18n mapping. The reference identifies the verified concept (for example steering/right-hand-drive), while the JEPC text remains a language-qualified source label with file/row provenance. The reference must not be minted from label spelling or treated as proof that all identically worded branches mean the same thing. Catalogue role descriptions that are not applicability conditions still receive source-language display records without being forced into a condition dimension. The UI may show a source label when a normalized reference is unresolved, but must expose its source/uncertain status and must not use it as a verified filter.

For each selected bundle, look first for the corresponding JEPC language files under that same model/category/item scope. Match localized branch descriptions to a canonical occurrence only after comparing source row/node structure, PART number, application ID, ancestry and role; record the matched source file and line. Do **not** assume that identical node IDs across languages have identical meaning: in installed model `3173`, category `10036`, item `1`, node `11001` in `L0` heads an `LH side` path to `LJA3705AB`, while the `L-2` file uses that node for the opposite-side part `LJA3704AE`. If a localized label is absent or the local row differs, search other language files and nearby item/category files **within the selected model/category scope** for the PART/application and candidate wording. Record search scope, candidates and outcome in SQLite; do not scan the entire installation, invent a translation, or treat a failed search as an empty condition. Any unresolved mapping remains source text plus a missing/ambiguous localization state for resolution.

## Catalogue occurrence-tree persistence

JEPC catalogue trees must be persisted as source-qualified structural relationships. Persistence must preserve node identity, ancestry, ordering, language and exact occurrence-path relationships rather than reducing the source tree to presentation text.

The importer must not reduce source tree structure to only a flattened description path.

For each source-qualified imported tree node, persist as applicable:

- source namespace;
- JEPC model/category/item scope;
- source language;
- stable source node identity;
- parent source node identity;
- source description;
- source order;
- source reference/provenance.

Human-readable description text is not node identity.

`part_tree_part` may be populated as a broad browse/navigation summary, but it is not the authoritative occurrence identity.

For each PART occurrence supplied by a JEPC source path, persist an exact `part_occurrence_tree_path` relationship containing the occurrence, source tree node/path identity, source namespace, source path ID, application ID where available, and provenance.

The importer must preserve multiple path rows for the same occurrence/application when JEPC contains them.

Language-specific trees must be imported independently when their source structure differs. Matching labels across languages do not establish node/path equivalence. Canonical PART identity remains shared across language-specific occurrences.

Importer reruns must use the source-qualified node/path identities so identical source evidence is idempotent rather than duplicated.



## Incremental source index / processing ledger

The importer shall not build or hold an in-memory array of the complete JEPC installation before processing. The source installation can contain roughly one million files and may differ between JEPC installations/packages.

The persistent index is primarily a **processed/discovered bundle ledger**, built incrementally as bundles are encountered.

For each discovered bundle/file, record at least:

```text
path
filename
file family
model_id
category_id
item_id
language_id
size
modified time (informational only)
checksum
processing status
parser version
schema version
```

A checksum is mandatory for source identity/change detection. File edit/modification time must not be trusted as authoritative because different JEPC installation/packages may carry identical or changed source with unreliable timestamps.

### First start

On first start there is no requirement for a pre-existing full source index.

The importer shall:

1. locate the configured JEPC source root;
2. load the selected model/sub-range/Region profile;
3. search deterministically for the next source bundle not yet present in the processing ledger;
4. read/process that one bundle;
5. calculate checksums for its source files;
6. add/update the bundle and files in the persistent ledger;
7. mark the bundle with its resulting processing status;
8. then determine the next bundle and repeat.

Source discovery must stream/traverse incrementally. It must not materialize or repeatedly loop over an array containing the whole million-file installation.

### Restart and expanded source directories

On restart, the importer shall use the existing processing ledger and verify whether the configured JEPC source directory has been expanded, replaced or changed.

If source verification is requested or indicated, reconciliation must still be incremental: examine candidate files/bundles one at a time, calculate/compare checksums, update affected ledger entries, and continue. A complete file list need not be loaded into memory.

Detected changes shall be handled at least as follows:

```text
new bundle/file      -> add when encountered and process
checksum changed     -> mark affected bundle NEEDS_REPROCESS
missing source       -> retain ledger records and mark MISSING/REMOVED
```

A complete million-file scan must not be required for **any normal processing loop**. Each loop processes one bundle and then determines the next bundle.

### Optional source estimate

An operator may explicitly run a slow, exhaustive **selected-model inventory** for the models matched by `--parse`. It traverses their drilldown directories and model menus, excluding shared media and other models. This remains separate from the category parsing loop: no estimate is required before a useful parse run, and a failed estimate must not alter parsed evidence. The report is stored in `ledger.sqlite` and retains the model-name pattern, Model_ID set, source scope, start/end time, file/byte counts, errors and sample details. The scan streams discovery instead of materializing the complete source file list in memory. The estimator function supports cooperative stopping. Cooperative stop behavior must not corrupt or misrepresent an incomplete estimate.

Every importer run requires `--parse PATTERN`. The source inventory is enabled only by adding the optional `--estimate` flag to that run; `--estimate` alone is invalid. The flag is off by default and measures the selected source models; no external installation figures are built in or used as calibration. An estimate failure is reported separately from parsing and must not erase accepted progress.

The estimate may sample reproducibly selected source files to measure input size and read cost. Source counts, bytes and elapsed scan time are measurements. D1 storage and import duration would be projections only after a calibration sample has actually been transformed and published; projections are valid only when backed by measured published calibration. No duration or D1 size is inferred from fixture data or raw XML byte size. Shared media belongs to MediaImporter.

## Configurable import scope

The operator's parsing input is a case-insensitive model-name pattern, for example `--parse XK`. Match it as a literal substring against the installed `models_l_id_0.xml` names and parent relationships, then identify complete category bundles in the matching leaf models. A parent name match includes its descendant leaves. Stage at most 40 complete bundles per invocation. For each pick, randomly choose a matched model with remaining complete categories, then randomly choose one of that model's categories. Remove the chosen category from the current run's pool so it cannot be picked twice. A subsequent invocation makes fresh picks without an operator-supplied seed. Report eligible, selected and incomplete category counts. Selection remains in memory. Evidence reuse is keyed by each category's content rather than the whole random selection, so overlapping runs reuse unchanged evidence. This path stages locally and does not publish to D1.

A pattern-scoped `--estimate` measures the matched source files. D1 storage and import-time projections require measured published calibration.

The importer must allow selection below the broad VIEPS Range level when JEPC exposes distinct model/sub-range/market variants.

Transformation may need source context based on facts such as:

- JEPC Model_ID;
- JEPC `parent_id` from the model hierarchy in `menus/models_l_id_0.xml`;
- parent model/family source description;
- selected JEPC model/sub-range description;
- normalized Region/market context;
- optional language selection where appropriate.

JEPC model hierarchy records are of the form `[model_id,parent_id,model_name]`. Both `model_id` and `parent_id` must be preserved because the hierarchy relationship can distinguish a selected model/sub-range from its parent model/family even when display names are not unique. Source menu paths such as `pl_id_<model_id>` remain source linkage for the selected JEPC model and must not be confused with a separate VIEPS vehicle identity.

Verified examples from `menus/models_l_id_0.xml` include:

```text
[3175,10001,'Jaguar XK8 Coupe/Convertible']
[3187,3175,'XK8 Coupe/Convertible up to (V) 042775']

[3215,10001,'XJ Series (From (V)812317 to (V)F59525 (X308)']
[3218,3215,'XJ Series From (V)812317 to (V)F59525 (X308)']
```

For importer/operator presentation, the selected model shall therefore retain and expose both its own `Model_ID` and its immediate `Parent_ID`, together with the source descriptions for both levels. The parent level may act as a model/family grouping in JEPC, but the importer must preserve the source hierarchy rather than assuming a stronger domain label than the source establishes.

The `--parse` selector applies the same model-name matching rule to every source model; it does not load a fixed list of validation profiles or assign a VIEPS Range. Region mappings require explicit source evidence and remain separate from model selection.

Where a short region token such as `Region=NA` is used, it must be represented as a Region/market value and kept semantically distinct from the engine-option abbreviation `N/A`, meaning Non-Aspirated/non-Supercharged. Region and aspiration/supercharger state are separate dimensions.

## Incremental processing loop

The normal processing loop shall be restartable and persistent:

```text
1. Open database.
2. Check previous importer run state.
3. Run startup database health checks before any bundle processing.
4. Load selected model/sub-range/Region profile(s).
5. Prefer any indexed bundle explicitly marked NEEDS_REPROCESS when the active parser/schema version can improve it.
6. Otherwise search deterministically for the next source bundle not yet present in the processing ledger.
7. Mark the selected bundle PROCESSING in the ledger.
8. Begin the bundle parsing/import transaction(s).
9. Read and interpret only files belonging to that source bundle.
10. Insert/update known normalized data and preserve unresolved/raw source data.
11. If a new but preservable structure is encountered, record sufficient raw/staging data, mark the bundle NEEDS_REPROCESS, log the discovery, and continue rather than stopping the whole import.
12. Validate the bundle result.
13. COMMIT, or ROLLBACK on failure.
14. Mark/update the bundle in the index as PROCESSED, NEEDS_REPROCESS, UNKNOWN_STRUCTURE, or ERROR as applicable.
15. Check whether new parser/schema knowledge explains earlier unresolved records.
16. Mark affected earlier bundles NEEDS_REPROCESS when required.
17. Check for a safe-stop request.
18. Determine the next bundle and repeat.
```

The importer must not rediscover/sort the entire million-file source tree before any bundle. It shall process one bundle, persist its ledger state, then determine the next not-yet-indexed or reprocessable bundle.

## Persistent processing states

At minimum, source bundles should support states equivalent to:

```text
PROCESSING
PROCESSED
UNKNOWN_STRUCTURE
NEEDS_REPROCESS
ERROR
MISSING/REMOVED
```

A not-yet-discovered bundle has no ledger row yet; it does not need a pre-created `UNPROCESSED` index row.

Persist sufficient metadata to make restart behavior explainable, including parser/schema version and source checksums.

## Adaptive source/schema discovery

A newly encountered source element must never be silently discarded.

Discoveries shall be classified before deciding whether the parser, staging schema, or normalized schema needs to change.

### 1. New value

Existing structure and semantics are understood, but a new value appears.

Action: store normally. No schema change.

### 2. New code or semantic unknown

The generic known source structure can already preserve the value, but its human/domain meaning is not yet decoded.

Example: a new JEPC applicability code appears in a structure already known to represent applicability.

Action: preserve raw code/value/flags and provenance. Mark the affected bundle `NEEDS_REPROCESS` when new semantic/parser knowledge could enrich it. Do not stop the whole import when the unknown can be preserved safely.

### 3. New source format / parser structure

The source carries an already understood or partially understood domain concept using a previously unseen record/file layout.

Action:

- preserve enough raw/staging representation to avoid losing information;
- where useful, add explicit staging/discovery columns so parser reprocessing can work from preserved database values instead of rereading source files;
- record the parser-extension requirement in the run report;
- mark affected bundle(s) `NEEDS_REPROCESS`;
- continue with subsequent bundles when data integrity is not compromised.

A parser extension should result in a new parser/software version identifier so reprocessing can determine which bundles were handled by an older parser.

### 4. New normalized data concept

The source demonstrates a genuine relationship/entity/property that the canonical normalized model cannot represent correctly.

Action: document the evidence and required semantic change, extend the normalized schema through a controlled migration, update parser behavior, and reprocess affected source bundles.

The importer may add staging/discovery columns for lossless capture and reprocessing acceleration when justified. It must not, however, treat every new JEPC code/value as a new normalized production column or entity without semantic justification.

## Learning must also apply backwards

New source evidence may explain previously unresolved records.

When parser/schema/semantic knowledge is improved, the importer shall identify affected prior data and mark it for reprocessing where practical.

Conceptually:

```text
new verified understanding
        |
        +-- document discovery
        +-- increment parser/schema version as applicable
        +-- update parser/decoder/staging/normalized schema as required
        +-- process current bundle
        +-- find earlier affected UNKNOWN/NEEDS_REPROCESS data
        +-- reprocess from preserved DB values where sufficient
        +-- reread source only when preserved data is insufficient
```

This is a controlled structural-learning mechanism, not machine learning.

## Documentation of learned structures

Meaningful discoveries must become durable development knowledge rather than existing only in code or transient console output.

Each significant discovery should record, as applicable:

```text
discovery
source model/category/item/files examined
evidence/example
confidence/status
parser effect
staging-schema effect
normalized-schema effect
parser/software version needed or created
previous unknowns affected
reprocessing requirement
```

Distinguish verified facts, strongly supported observations, hypotheses, and unresolved meanings.

## Transaction and safe-stop behavior

One source bundle shall be the natural atomic transaction boundary where practical. A bundle may use more than one internal database transaction if required, but safe-stop must occur only after the bundle's parsing/import transaction set is in a consistent committed or rolled-back state.

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

The operator interface must provide a cooperative stop action.

A stop request shall:

1. set a persistent/in-memory stop request;
2. finish or roll back the current bundle parsing/import transaction set;
3. save processing state;
4. flush detailed logs and the run report;
5. mark the importer run as stopped by user;
6. close the database normally;
7. exit.

`Ctrl+C` should be trapped where practical and treated first as a graceful-stop request rather than immediate termination. A second forced interrupt may remain an emergency escape.

## Startup database health checks

Every restart shall perform lightweight database health verification **before any bundle is processed**.

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

## Operator status information

Operator-visible status must provide stable aggregate information without prescribing terminal layout, exact labels, fixed banners, column widths or example values.

The status information must make available:

- selected JEPC `Model_ID`, immediate `Parent_ID`, and their source descriptions;
- source Region/market context when established by source evidence;
- imported catalogue aggregates by first-level source path, including distinct canonical PART count and occurrence count;
- language-specific occurrence coverage and a true distinct PART count across languages;
- cumulative counts for source structures handled by known parser behavior, parser/staging extensions, normalized-model discoveries, unresolved structures and processing errors;
- cooperative-stop availability and the fact that stopping occurs only after the active transaction/checkpoint is completed or rolled back safely.

Aggregate counts must preserve these semantics:

- a canonical PART appearing in several occurrences is counted once in a distinct-PART count;
- occurrences remain source-qualified and language-qualified;
- all-language distinct counts must not be calculated by summing per-language distinct counts;
- unresolved-but-preserved source structures are distinct from processing errors;
- undiscovered source bundles are not reported as a meaningful pending total unless an explicit complete source inventory exists.

Rapidly changing filenames, bundle IDs and deep breadcrumb paths belong in detailed logs rather than the aggregate operator status.

## Detailed background log and run report

The concise processing view does not replace detailed logging.

The importer shall retain a persistent detailed log sufficient to audit and diagnose processing, including where useful:

- run ID;
- source bundle and files;
- source checksums;
- source identifiers including Model_ID, parent_id, Category_ID, Item_ID and Language_ID where present;
- part/occurrence inserts or updates;
- parser/schema versions;
- detected unknowns;
- parser/staging/normalized-schema discoveries;
- raw/staging fields preserved for parser reprocessing;
- reprocessing decisions;
- warnings;
- errors;
- transaction outcome.

In addition, each importer run shall maintain a **run report** continuously until clean stop/exit. The run report is intended to support the subsequent diagnosis or parser refinement, including AI-assisted analysis. It shall summarize enough evidence to determine required parser extensions without requiring a human to reconstruct the issue from the console output.

For each parser/schema discovery the run report should include, where available:

```text
source model/category/item and filenames
checksum(s)
representative raw record/value
observed record shape / field count / field types
what existing parser expected
what differed
how data was preserved in staging
required parser-extension evidence
parser version that encountered it
bundles marked NEEDS_REPROCESS
whether normalized schema change appears necessary
```

The operator should not be expected to follow this high-volume log visually during normal processing.

## Conformance requirements

The importer must demonstrate that:

- no complete pre-existing million-file index is required before useful import begins;
- the processing ledger is built incrementally bundle by bundle;
- source checksums are calculated and used instead of trusting modification time;
- selected model/sub-range/Region profiles can be processed independently while preserving and displaying both JEPC `model_id` and immediate `parent_id` hierarchy identity;
- processing resumes from persistent bundle state rather than restarting from the beginning;
- each normal loop reads/processes one bundle and only then determines the next;
- known structures import without unnecessary normalized-schema churn;
- unknown but preservable structures are logged, retained, marked for reprocessing, and do not unnecessarily stop subsequent bundle processing;
- parser/staging extensions can preserve new fields/columns so subsequent parser versions can reprocess from the database when sufficient;
- genuinely new normalized concepts can be documented and added through controlled migration;
- newly resolved evidence can trigger targeted reprocessing of earlier unresolved data;
- parser/software versions identify which logic processed each bundle;
- bundle transactions protect the staging database from partial source-set imports;
- the importer can be stopped cooperatively after current bundle parsing transactions and restarted safely;
- database health is checked before any bundle processing on restart/resume;
- the operator sees stable aggregate parent/model/path/language/structure metrics without a scrolling per-record console flood;
- detailed processing and a diagnostic run report remain available in background logs;
- canonical part identity remains independent from language-specific source occurrences;
- Region/market terms remain distinct from engine aspiration/supercharger-option terminology.

The importer must not create a parallel Parts Data Model. Any discovered normalized-schema requirement must conform to the canonical PARTS and E2E JEPC-to-D1 models. Staging/discovery extensions may preserve unresolved source structures without redefining normalized VIEPS domain semantics.

## Fixture-to-imported catalogue transition

Fixture or manually entered catalogue-context evidence may be used by VIEPS before the corresponding JEPC data has been imported.

When authoritative imported JEPC evidence becomes available for the same catalogue context, the importer/publication flow must allow that imported evidence to replace or validate the fixture/manual catalogue-side evidence without changing canonical PART identity or operational STOCK records.

Fixture/manual evidence must remain distinguishable from imported Jaguar/JEPC evidence and must never be presented as independently verified source data.
