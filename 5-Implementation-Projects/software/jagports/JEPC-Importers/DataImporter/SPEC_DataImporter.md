# Jagports JEPC DataImporter specification

(C)2026 by tlindi and ChatGPT

## Purpose

Define the v0.1a command, SQLite evidence staging, first Range D1 publication boundary and later catalogue requirements. The runnable procedure is in the [DataImporter README](README.md).

**Implementation boundary:** v0.1a is a local Windows/Node.js parser and D1 publisher. It stages up to 40 complete source-category bundles per run in `ledger.sqlite`, preserves source evidence and run history, and optionally inventories matched source files. When the reviewed Range identity, schema and Cloudflare token are present, it publishes parsed PART numbers, exact occurrences, tree nodes and source-condition evidence to Range D1. Missing configuration leaves an explicit `NOT_CONFIGURED` publication state. It does not yet interpret predicates into verified fitment, localize verified condition references, publish media, offer the future progress screen, or implement future safe-stop controls. Those requirements remain targets, not claims about this implementation.

The importer must begin from source structures and target-schema concepts already understood with high confidence, process selected JEPC models incrementally, preserve unknown source information, and improve its parser/schema knowledge only when evidence from actual JEPC source requires it.

This specification complements the existing JEPC source-structure and importer documents. It does not replace the approved VIEPS Parts Data Model.

## v0.1a command contract

```text
node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse PATTERN [--estimate]
```

Run this command from the repository root. `--parse PATTERN` is required for every importer run. `PATTERN` must contain at least two characters and is matched as a source model-name fragment. `--estimate` is optional and valid only with `--parse`; it adds a source inventory to that run. The CLI rejects all other flags and all positional commands. An invocation without `--parse PATTERN` fails and prints the usage line.

The source root defaults to `C:\Program Files\JEPC\applications\JEPC`; the `JEPC_SOURCE` environment variable can point to another installation. Local evidence and run history go into `%LOCALAPPDATA%\Jagports\JEPC-Importer\ledger.sqlite`. The current parse uses source language `0`. Progress goes to standard error, and the final result is JSON on standard output. These settings are not additional CLI parameters. Current runs write no separate source copies, category JSON files or estimate-report files. Earlier JSON staging output is left untouched and is not a second active store.

## Local and production persistence boundary

The local SQLite ledger is importer-owned source evidence, run history and recovery state. It is not the live VIEPS catalogue. Parsed PARTs, occurrences and source tree paths are published idempotently to the approved Range D1 database. Source conditions and sidecar predicates are preserved as **unverified evidence**, never as unrestricted or verified fitment. Localized description references and verified applicability remain future work. An accepted Range slug determines the database name as `jagports-<range_slug>`; `xk` resolves to `jagports-xk`. The fixture-backed `jagports` database is not a JEPC importer write target. `--parse PATTERN` selects source models only; it does not assign a Range or destination.

Before remote publication, the repository-controlled [Range D1 deployment procedure](../../../../../3-Deployment/internet/cloudflare/d1/ranges/README.md) must verify account/name/ID and apply schema-only D1 tables. `source-range-map.json` maps reviewed JEPC source-group IDs to stable Range slugs; the importer checks each staged model's ancestry and refuses zero or ambiguous matches. One category is replaced atomically in its Range partition using the D1 batch API; the evidence hash is read back before `range_publications` is updated in local SQLite. Later runs retain earlier categories and retry locally staged bundles without a successful publication record. A local parse with `publication.phase=NOT_CONFIGURED` is not a published import. The separate deployment tools add no DataImporter CLI flags. Cross-Range discovery, supersession and full applicability remain open under [Issue #555](https://github.com/jagports/jagports/issues/555).

The VIEPS URL parameter `TEST=1` selects the existing fixture-backed part/tree/suitability routes. With `TEST` omitted, part search and Parts Tree use the bound Range D1 database and operational stock queries exclude rows marked `verification_status='fixture'`. A missing Range binding fails visibly; it does not read fixtures. Real suitability is explicitly unavailable until verified applicability is published. When more than one Range is bound, the caller must supply an approved `range=<slug>` until global cross-Range discovery is implemented.

Kit, nested-kit and NSS source observations must be preserved with provenance when encountered, including an unnumbered constituent; no Jaguar part number or verified composition may be invented. Kit composition is not required to complete the current 40-bundle parsing run. The approved [PART model](../../../../internet/jagports/solution/vieps/SPEC/MODEL_PART.md) governs the distinction between catalogue PART identity, occurrence evidence and verified composition.

## Core operating principle

The remainder of this specification describes the intended importer unless a paragraph explicitly says it describes the current v0.1a implementation.

The importer must not require the complete JEPC installation to be reverse-engineered before useful import work can begin.

It shall:

1. start from known-good schema concepts;
2. process one persistent source bundle at a time;
3. detect source structures it already understands;
4. preserve and report structures it does not yet understand;
5. continue processing safely when an unknown structure can be preserved for later reprocessing;
6. extend parser behavior when an existing schema can already represent newly understood source data;
7. extend staging/discovery storage where doing so avoids rereading source files and preserves newly observed fields losslessly;
8. extend the normalized schema only when a genuinely new source concept cannot be represented correctly by the existing approved model;
9. re-evaluate earlier unresolved data when later discoveries explain it;
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
- `I<n>` — numbered top-level catalogue item within that category; current evidence strongly supports `I1` meaning top-level item 1, but this remains subject to verification across exceptional/missing-number cases.
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

The human-readable source descriptions can be used as browse/filter candidates immediately. Raw `A`, `C` and other source predicates are still preserved for provenance and later applicability evaluation. The importer must not attempt to reconstruct readable descriptions by positional alignment between predicates and tree nodes.

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

### Semantic mapping is a later enrichment layer

The importer shall not invent domain categories for source descriptions. A later controlled mapping layer may map a source description to one or more normalized facets. The original description, occurrence path and raw predicates remain independently recoverable.

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

For each selected bundle, look first for the corresponding JEPC language files under that same model/category/item scope. Match localized branch descriptions to a canonical occurrence only after comparing source row/node structure, PART number, application ID, ancestry and role; record the matched source file and line. Do **not** assume that identical node IDs across languages have identical meaning: in installed model `3173`, category `10036`, item `1`, node `11001` in `L0` heads an `LH side` path to `LJA3705AB`, while the `L-2` file uses that node for the opposite-side part `LJA3704AE`. If a localized label is absent or the local row differs, search other language files and nearby item/category files **within the selected model/category scope** for the PART/application and candidate wording. Record search scope, candidates and outcome in SQLite; do not scan the entire installation, invent a translation, or treat a failed search as an empty condition. Any unresolved mapping remains source text plus a missing/ambiguous localization state for later review.

## Catalogue occurrence-tree persistence target

Production persistence of JEPC catalogue trees must use the canonical PART model defined in `MODEL_PART.md` and the additive `0017_part_tree_occurrence.sql` migration.

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

### Later starts and expanded source directories

On later starts, the importer shall use the existing processing ledger and ask/verify whether the configured JEPC source directory has been expanded or replaced/changed.

If source verification is requested or indicated, reconciliation must still be incremental: examine candidate files/bundles one at a time, calculate/compare checksums, update affected ledger entries, and continue. A complete file list need not be loaded into memory.

Detected changes shall be handled at least as follows:

```text
new bundle/file      -> add when encountered and process
checksum changed     -> mark affected bundle NEEDS_REPROCESS
missing source       -> retain ledger history and mark MISSING/REMOVED
```

A complete million-file scan must not be required for **any normal processing loop**. Each loop processes one bundle and then determines the next bundle.

### Optional source estimate

An operator may explicitly run a slow, exhaustive **selected-model inventory** for the models matched by `--parse`. It traverses their drilldown directories and model menus, excluding shared media and other models. This remains separate from the category parsing loop: no estimate is required before a useful parse run, and a failed estimate must not alter parsed evidence. The report is stored in `ledger.sqlite` and retains the model-name pattern, Model_ID set, source scope, start/end time, file/byte counts, errors and sample details. The scan streams discovery instead of materializing the complete source file list in memory. The estimator function supports cooperative stopping, but the v0.1a CLI does not expose a stop control or guarantee a partial report when its process is interrupted.

Every importer run requires `--parse PATTERN`. The source inventory is enabled only by adding the optional `--estimate` flag to that run; `--estimate` alone is invalid. The flag is off by default and measures the current selected source models; no earlier installation's figures are built in or used as calibration. An estimate failure is reported separately from parsing and must not erase accepted progress.

The estimate may sample reproducibly selected source files to measure input size and read cost. Source counts, bytes and elapsed scan time are measurements. D1 storage and import duration would be projections only after a calibration sample has actually been transformed and published; v0.1a does not provide those projections. No duration or D1 size is inferred from fixture data or raw XML byte size. Shared media belongs to MediaImporter.

## Configurable import scope

The operator's parsing input is a case-insensitive model-name pattern, for example `--parse XK`. Match it as a literal substring against the installed `models_l_id_0.xml` names and parent relationships, then identify complete category bundles in the matching leaf models. A parent name match includes its descendant leaves. Stage at most 40 complete bundles per invocation. For each pick, randomly choose a matched model with remaining complete categories, then randomly choose one of that model's categories. Remove the chosen category from the current run's pool so it cannot be picked twice. A later run makes fresh picks without an operator-supplied seed. Report eligible, selected and incomplete category counts. Selection remains in memory. Evidence reuse is keyed by each category's content rather than the whole random selection, so overlapping runs reuse unchanged evidence. With a configured and verified Range D1 target, the same command publishes parsed bundles and retries earlier unpublished bundles for the selected source models; the 40-category limit applies to **new source selection**, not recovery of already staged evidence.

A pattern-scoped `--estimate` measures the matched source files. D1 storage and import-time projections require measured published calibration and remain outside v0.1a.

The importer must allow selection below the broad VIEPS Range level when JEPC exposes distinct model/sub-range/market variants.

Later transformation may need source context based on facts such as:

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

The current `--parse` selector applies the same model-name matching rule to every source model; it does not load a fixed list of validation profiles or assign a VIEPS Range. Later Region mappings require explicit source evidence and remain separate from model selection.

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

Action: preserve raw code/value/flags and provenance. Mark the affected bundle `NEEDS_REPROCESS` when later semantic/parser improvement could enrich it. Do not stop the whole import when the unknown can be preserved safely.

### 3. New source format / parser structure

The source carries an already understood or partially understood domain concept using a previously unseen record/file layout.

Action:

- preserve enough raw/staging representation to avoid losing information;
- where useful, add explicit staging/discovery columns so a later parser version can work from preserved database values instead of rereading source files;
- record the parser-extension requirement in the run report;
- mark affected bundle(s) `NEEDS_REPROCESS`;
- continue with later bundles when data integrity is not compromised.

A parser extension should result in a new parser/software version identifier so reprocessing can determine which bundles were handled by an older parser.

### 4. New normalized data concept

The source demonstrates a genuine relationship/entity/property that the approved normalized model cannot represent correctly.

Action: document the evidence and required semantic change, extend the normalized schema through a controlled migration, update parser behavior, and reprocess affected source bundles.

The importer may add staging/discovery columns for lossless capture and later acceleration when justified. It must not, however, treat every new JEPC code/value as a new normalized production column or entity without semantic justification.

## Learning must also apply backwards

A later source discovery may explain records that were previously unresolved.

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

At minimum:

```text
[Q] Stop safely after current bundle parsing transactions are done
```

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

## Operator processing view

The terminal/operator view must favor stable, understandable aggregate information rather than rapidly changing internal bundle details.

Do not continuously display current filenames, current bundle identifiers, or deep current breadcrumb paths in the primary live view. Those details change too quickly for a human to follow and belong in the persistent detailed log/run report.

The screen should be redrawn in place rather than producing an endlessly scrolling console log.

### Required header

Example:

```text
Jagports JEPC DataImporter — future processing screen
(C)2026 by tlindi and ChatGPT

JEPC Parent_ID #3175 — Jaguar XK8 Coupe/Convertible
JEPC Model_ID #3187 — XK8 Coupe/Convertible up to (V) 042775
Region: Rest of world excluding Americas
```

The header must identify the selected technical JEPC `Model_ID`, its immediate `Parent_ID`, and the corresponding source descriptions for both levels. For example, source hierarchy `[3175,10001,'Jaguar XK8 Coupe/Convertible']` followed by `[3187,3175,'XK8 Coupe/Convertible up to (V) 042775']` is presented as Parent_ID `3175` plus selected Model_ID `3187`. The parent is described neutrally as the JEPC parent model/family level unless stronger semantics are separately verified. JEPC `Category_ID` must still be preserved in source/staging/log metadata, but it is not required in the compact live operator table.

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
Existing structure used                    152
Parser/staging structures created/extended   7
Created new normalized DB structures         11
Unknown structures to be researched           2
Errors                                         0
```

Definitions:

- `Existing structure used` = processed source structures handled through already-known parser/schema behavior.
- `Parser/staging structures created/extended` = parser-only behavior additions and/or staging/discovery schema extensions introduced to preserve newly observed source structure or accelerate later reprocessing. These must be counted and recorded even when they do not change the normalized production model.
- `Created new normalized DB structures` = genuinely new normalized schema elements/migrations introduced because the existing approved schema could not represent verified source semantics correctly.
- `Unknown structures to be researched` = preserved source structures whose semantic/structural interpretation remains unresolved and requires investigation.
- `Errors` = processing failures, distinct from unresolved-but-preserved structures.

No `Pending` bundle count is required in the live view because undiscovered bundles are not pre-indexed and a meaningful pending total would require a separate complete source inventory such as `JEPC-files-LIST.txt`.

### Safe-stop control

The live view shall always keep the cooperative stop instruction visible:

```text
[Q] Stop safely after current bundle parsing transactions are done
```

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
- raw/staging fields preserved for later parser work;
- reprocessing decisions;
- warnings;
- errors;
- transaction outcome.

In addition, each importer run shall maintain a **run report** continuously until clean stop/exit. The run report is intended to support the next importer/parser development iteration, including AI-assisted analysis. It shall summarize enough evidence to determine required parser extensions without requiring a human to reconstruct the issue from the console output.

For each parser/schema discovery the run report should include, where available:

```text
source model/category/item and filenames
checksum(s)
representative raw record/value
observed record shape / field count / field types
what existing parser expected
what differed
how data was preserved in staging
suggested parser-extension requirement
parser version that encountered it
bundles marked NEEDS_REPROCESS
whether normalized schema change appears necessary
```

The operator should not be expected to follow this high-volume log visually during normal processing.

## Future catalogue-import acceptance direction

Later catalogue-import implementation should demonstrate that:

- no complete pre-existing million-file index is required before useful import begins;
- the processing ledger is built incrementally bundle by bundle;
- source checksums are calculated and used instead of trusting modification time;
- selected model/sub-range/Region profiles can be processed independently while preserving and displaying both JEPC `model_id` and immediate `parent_id` hierarchy identity;
- processing resumes from persistent bundle state rather than restarting from the beginning;
- each normal loop reads/processes one bundle and only then determines the next;
- known structures import without unnecessary normalized-schema churn;
- unknown but preservable structures are logged, retained, marked for reprocessing, and do not unnecessarily stop later bundle processing;
- parser/staging extensions can preserve new fields/columns so later parser versions can reprocess from the database when sufficient;
- genuinely new normalized concepts can be documented and added through controlled migration;
- later discoveries can trigger targeted reprocessing of earlier unresolved data;
- parser/software versions identify which logic processed each bundle;
- bundle transactions protect the staging database from partial source-set imports;
- the importer can be stopped cooperatively after current bundle parsing transactions and restarted safely;
- database health is checked before any bundle processing on restart/resume;
- the operator sees stable aggregate parent/model/path/language/structure metrics without a scrolling per-record console flood;
- detailed processing and a development-oriented run report remain available in background logs;
- canonical part identity remains independent from language-specific source occurrences;
- Region/market terms remain distinct from engine aspiration/supercharger-option terminology.

## Related work

- Issue #355 — JEPC Data Importer; primary implementation owner.
- Issue #354 — Parts Data Model; owns approved normalized persistent entities and relationships.
- Issue #620 — multilingual JEPC catalogue-data specification; relevant to language-specific source/translation handling without duplicating canonical entities.
- PR #621 — JEPC source Region/breadcrumb semantics used by configurable importer source selection.

This specification does not authorize a parallel Parts Data Model. Importer-discovered normalized-schema changes must be reconciled with the approved model and project workflow before becoming production schema. Staging/discovery extensions may be used to preserve and accelerate analysis of source structures without silently redefining normalized VIEPS domain semantics.

## Fixture-to-imported catalogue transition

Fixture or manually entered catalogue-context evidence may be used by VIEPS before the corresponding JEPC data has been imported.

When authoritative imported JEPC evidence becomes available for the same catalogue context, the importer/publication flow must allow that imported evidence to replace or validate the temporary fixture/manual catalogue-side evidence without changing canonical PART identity or operational STOCK records.

Temporary fixture/manual evidence must remain distinguishable from imported Jaguar/JEPC evidence and must never be presented as independently verified source data.
