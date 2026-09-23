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

## Applicability as separate filterable properties

JEPC applicability is source evidence attached to an occurrence. The importer shall convert every understood applicability assertion into one or more **separate descriptive properties**, linked to the occurrence and grouped according to the source rule. It shall not flatten applicability into the PART description or carry source decision-tree nodes into VIEPS as application logic.

An imported property must retain at least its source label/value or code, polarity where expressed, source operator/grouping where understood, and source evidence reference. Examples include Region/market, LHD/RHD, Supercharged or Non-Supercharged, Other Option, headlamp levelling, powerwash and VIN boundary. A readable description is a display label for a property; it is not the property identity and must not be the only retained form.

The UI owns filtering. It shall expose the imported descriptive properties as filters and evaluate them against occurrences, so a PART remains visible when at least one of its occurrences satisfies the chosen vehicle/configuration conditions. The importer prepares the explicit relationships and property values; it does not recreate the source decision tree in the destination or hide filter semantics inside a concatenated description string.

Where an assertion's meaning or boolean grouping is not yet understood, the importer preserves the raw source rule and reports it as unresolved. It must not invent a filter property or assume that textual adjacency establishes AND/OR logic.

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

## Persistence tiers and publication

The DataImporter uses two distinct persistence tiers:

- **Local SQLite** is the importer-owned processing ledger, staging store, run report and test environment on the computer reading the JEPC installation. It supports checkpoints, lossless raw capture, retry and validation. It is not the live VIEPS catalogue.
- **Cloudflare D1** is the authoritative production destination for accepted VIEPS catalogue/reference data. Actual imported PARTs, occurrences, tree paths, applicability properties and related published catalogue relationships must be written to the approved D1 model and become available to the VIEPS UI through its Worker/API. The publication target is a D1 database selected by the accepted VIEPS Range key using the naming and setup contract below. The existing `jagports` D1 database remains the fixture-backed application database and is not an importer write target.

The importer must parse and validate a selected bundle locally before publication. A successful local staging run alone is not an import result for the product. A publication step must write accepted data to D1 idempotently, report the D1 outcome separately from local parsing, and leave failed or unresolved source structures out of the live catalogue until they are validly handled.

Development fixtures may remain local or in test databases. They must not be described as live imported product information.

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



## Kits, nested kit contents and NSS callouts

### MVP boundary

Kit/assembly composition, nested kit contents and NSS constituent handling are post-MVP catalogue enrichment. They must not delay the first forty-bundle XK import or require kit/NSS-specific parser logic. When encountered during MVP import, preserve any safely capturable raw source evidence, report it as unsupported/unresolved where needed, and never invent a Jaguar part number for an NSS constituent.

JEPC catalogue structure can describe a sellable PART as a kit or assembly while the illustration exposes constituent components separately.

Observed XK8 source/UI evidence from `XK8 Coupe/Convertible up to (V) 042775 / BRAKING SYSTEM / BRAKE DISC AND CALIPERS` includes catalogue items such as:

```text
1  Brake disc kit
2  Brake caliper
3  Caliper housing
4  Caliper carrier kit
5  Guiding pin
6  Bushing kit
7  Brake caliper seal kit
8  Bleed screw
9  Dust cap
10 Housing clip
11 Brake pad kit
```

The associated illustration uses numbered callouts and visual grouping to show component membership. It also demonstrates that a constituent can itself be a kit/subset, such as item 7 `Brake caliper seal kit`. An illustrated constituent may be marked `NSS` (not serviced separately) even though it is physically identifiable within the higher-level assembly.

For importer purposes:

- a Jaguar kit/assembly and its constituent callouts are distinct catalogue facts and must not be flattened into a single PART occurrence;
- kit composition may be nested: a kit/assembly may contain another kit/subset;
- the importer must preserve source parent/child or grouping evidence when it can be derived from catalogue records, illustration callouts, hotspots or bounded visual groups;
- a constituent callout must not be discarded merely because JEPC supplies no standalone Jaguar part number for it;
- `NSS` means that JEPC/Jaguar does not service that constituent as its own Jaguar PART in that context; it does not mean that the physical component is nonexistent;
- the importer must not invent a Jaguar part number for an NSS constituent;
- where kit membership is evidenced only by illustration/callout/hotspot structure, preserve that evidence and provenance explicitly rather than pretending it came from a textual PART row.

This means illustration/callout structure is potentially data-bearing source evidence for kit composition, not merely decorative media. The exact source encoding of these relationships remains subject to parser discovery and must be retained losslessly when not yet decoded.

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

## Configurable import scope

The importer must allow selection below the broad VIEPS Range level when JEPC exposes distinct model/sub-range/market variants.

The import scope therefore needs configurable profiles based on source facts such as:

- JEPC Model_ID;
- JEPC `parent_id` from the model hierarchy in `models_l_id_0.xml` / `menus/models_I_id_0.xml` source hierarchy data;
- parent model/family source description;
- selected JEPC model/sub-range description;
- normalized Region/market context;
- optional language selection where appropriate.

JEPC model hierarchy records are of the form `[model_id,parent_id,model_name]`. Both `model_id` and `parent_id` must be preserved because the hierarchy relationship can distinguish a selected model/sub-range from its parent model/family even when display names are not unique. Source menu paths such as `pl_id_<model_id>` remain source linkage for the selected JEPC model and must not be confused with a separate VIEPS vehicle identity.

Verified examples from `menus/models_I_id_0.xml` include:

```text
[3175,10001,'Jaguar XK8 Coupe/Convertible']
[3187,3175,'XK8 Coupe/Convertible up to (V) 042775']

[3215,10001,'XJ Series (From (V)812317 to (V)F59525 (X308)']
[3218,3215,'XJ Series From (V)812317 to (V)F59525 (X308)']
```

For importer/operator presentation, the selected model shall therefore retain and expose both its own `Model_ID` and its immediate `Parent_ID`, together with the source descriptions for both levels. The parent level may act as a model/family grouping in JEPC, but the importer must preserve the source hierarchy rather than assuming a stronger domain label than the source establishes.

Initial v0.1/MVP validation profiles:

1. `XK8 Coupe/Convertible up to (V) 042775` — Region `Rest of world excluding Americas`.
2. `XJ Series From (V)812317 to (V)F59525 (X308)` — Region `Rest of world excluding Americas`.
3. F-Type — representative modern JEPC source dataset.

Related durable source knowledge establishes that the corresponding Canada/USA XK8 and Canada/Mexico/USA X308 source variants represent `Region = Americas`.

Where a short region token such as `Region=NA` is used, it must be represented as a Region/market value and kept semantically distinct from the engine-option abbreviation `N/A`, meaning Non-Aspirated/non-Supercharged. Region and aspiration/supercharger state are separate dimensions.

## First XK forty-bundle import scope

The first actual catalogue import is limited to the XK Range and consists of **forty randomly selected JEPC category bundles** from the available XK source hierarchy. It is not a full XK import and it does not include a separate Accessories sample in this first selection.

Selection is stratified across all available XK JEPC Model_ID profiles that expose category bundles: each such model receives at least one selected bundle before the remaining selections are drawn. The importer must persist the random seed, selection algorithm version, candidate population definition and the resulting ordered bundle identities. This makes a chosen forty-bundle run reproducible and explainable while allowing later runs to choose a different sample.

A selected category bundle includes its related model/category/language source files and the item files required to import that category's supplied occurrences. A selected bundle may create many canonical PARTs and occurrences; forty bundles is not a cap on part numbers.

Accepted XK catalogue/reference data is published only to the Range database resolved from the Range key `xk`: `jagports-xk`. The importer must not publish JEPC catalogue data to `jagports`. All JEPC model/sub-range variants of the same accepted VIEPS Range share that Range database; source model, category, language and occurrence identities remain explicit within it.

## Range D1 naming, setup and routing contract

The database name for an imported VIEPS Range is derived from its **approved, stable Range slug**:

```text
database_name = "jagports-" + range_slug
XK Range: range_slug = "xk" -> database_name = "jagports-xk"
```

A Range slug uses lowercase ASCII letters, digits and internal hyphens (`[a-z0-9]+(?:-[a-z0-9]+)*`). It is a controlled Range identifier, not a JEPC model ID, source menu label, random-selection seed, language or version nickname. A slug must be unique and stable; ambiguous or colliding Range mappings stop setup and import. The importer records the accepted Range key, resolved database name, database ID/account, source model IDs and source checksums in its run evidence. Future Ranges use the same rule without hard-coded database names in importer logic.

Database provisioning must be specified and executed through a **repository-controlled setup script with README instructions**, not by manually creating an unrecorded database in the Cloudflare dashboard. This specification does not create a Cloudflare database. The setup workflow must:

1. accept an approved Range slug, derive and display the database name, and verify the selected Cloudflare account and existing database identity before any mutation;
2. create the named D1 database only when absent, persist its returned database ID in reviewed configuration, and refuse an unexpected existing name/ID instead of adopting or resetting it silently;
3. apply a reviewed **schema-only** migration path for the approved catalogue model, keeping fixture-seeding SQL out of the Range database; the current mixed migration chain must be separated or otherwise controlled before this step is implemented;
4. verify migration ledger and table shape on the exact target, then test the Worker/API path that reads that Range database;
5. make repeated setup runs safe, report the resulting binding/name/ID and applied migrations, and never delete or recreate an existing database as a normal retry.

The importer publication command must require an explicit accepted Range target and verify that its configured D1 binding resolves to the corresponding `jagports-<range_slug>` database. It must refuse a missing, mismatched or default `jagports` destination. A source model mapped to a different Range is a blocking mismatch, not a reason to create another database automatically.

The current Worker queries catalogue PART, occurrence, tree, applicability and STOCK tables through one `DB` binding. Before a Range database is exposed as live VIEPS data, the implementation must specify and test Worker routing and catalogue-to-STOCK reconciliation across database boundaries. Numeric row IDs and foreign keys are database-local; a cross-Range or STOCK relationship must use an approved stable identity and must not be inferred from matching local IDs. No combined UI or stock-link claim is accepted until that contract is implemented and verified. This Range split is a storage/routing decision, not permission to duplicate canonical PART semantics or to turn JEPC decision-tree traversal into fitment logic.

### Repeated random runs

Repeated runs are safe by source-qualified identity, not by assuming that two random samples are equal:

- rerunning the same persisted selection and unchanged source must produce no duplicate D1 catalogue/tree/occurrence/applicability rows;
- rerunning a bundle selected in an earlier random sample must update or confirm its existing rows idempotently;
- a new seeded selection may add new source-qualified bundles without deleting accepted data from earlier samples;
- changed checksums must mark affected bundles for controlled reprocessing rather than silently duplicating or overwriting unrelated data;
- each run report must distinguish locally parsed, validly published to D1, unchanged, unresolved, failed and skipped bundles.

This is a bounded proof that the approved catalogue model can receive real XK data through multiple random import runs into `jagports-xk`. It is not evidence that the complete installation or every model family has been imported.

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
Jagports JEPC Data Importer v0.1
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

## v0.1/MVP acceptance direction

The importer v0.1/MVP should demonstrate that:

- no complete pre-existing million-file index is required before useful import begins;
- the processing ledger is built incrementally bundle by bundle;
- source checksums are calculated and used instead of trusting modification time;
- selected model/sub-range/Region profiles can be processed independently while preserving and displaying both JEPC `model_id` and immediate `parent_id` hierarchy identity;
- the first actual import uses forty reproducibly selected XK category bundles, stratified across all available XK JEPC Model_ID profiles, and publishes accepted data only into the Range database resolved as `jagports-xk`;
- understood applicability assertions become separate descriptive properties linked to occurrences; the UI filters those properties instead of interpreting source decision-tree nodes or concatenated part descriptions;
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
- repeated seeded selections and reruns of the same source-qualified bundle remain idempotent in D1, while each run separately reports local parsing and D1 publication outcomes;
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
