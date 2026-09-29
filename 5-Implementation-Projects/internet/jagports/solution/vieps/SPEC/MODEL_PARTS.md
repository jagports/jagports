# VIEPS PARTS Model

## Purpose

This document is the global canonical specification for reusable PART identity, PART relationships and non-dynamic catalogue applicability evidence across imported Jaguar/JEPC PARTs, Jagports specified PARTs and verified third-party/vendor references. Dynamic JEPC-description FIT filter behavior is owned by [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md); mutable operational stock remains owned by [`MODEL_STOCK.md`](MODEL_STOCK.md).

This document defines canonical catalogue `PART` identity and the catalogue-side relationships needed by VIEPS part search, part detail, EPC context, fit, diagrams, hotspots, supersession and operational stock linkage.

Operational stock semantics are defined separately in [`MODEL_STOCK.md`](MODEL_STOCK.md).

Occurrence-bound grouped applicability and versioned non-dynamic source-evidence semantics are defined in this model. Dynamic JEPC-description mappings remain defined in [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md).

## Canonical PART identity

`PART` is the stable reusable product/reference identity used by VIEPS.

The same canonical `part(id)` namespace contains both imported Jaguar/JEPC PARTs and manually created Jagports specified PARTs. A Jagports specified PART is canonical inside VIEPS but is not Jaguar-issued and must remain distinguishable by origin/provenance.

The internal `id` is the stable PART identity. A part number can be attached later without changing that identity.

A PART may be created before a catalogue part number is known, allowing unidentified reference parts to be recorded and subsequently identified.

Unresolved physical stock does not require a PART row.

## PART fields

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable internal catalogue-part identifier. |
| `part_number_raw` | optional | Original part-number representation supplied by the source, when known. |
| `part_number_normalized` | optional, unique when present | Stable lookup identity derived from the raw part number. Multiple NULL values are allowed. |
| `description` | optional, non-unique | Part description/name; may be empty or NULL. Descriptions are not identity because different parts can share the same description. |
| `source_origin` | required | How the PART record entered the PART database. Controlled values: `ImportJEPC` or `AddedManually`. |
| `source` | optional | Source system/document identifier. |
| `source_ref` | optional | Source reference or URL where available. |
| `verification_status` | required | Provenance/verification state; defaults to `unverified`. |

## PART record origin

`part.source_origin` records how the PART record entered the PART database.

Allowed values are:

- `ImportJEPC` — the PART record was created from JEPC importer output;
- `AddedManually` — the PART record was created manually in VIEPS, including Jagports specified third-party PARTs.

This field records record origin only. It does not replace detailed `source`, `source_ref`, verification, occurrence, or importer provenance evidence.

A later verification or enrichment step must not change `source_origin`; the value describes how the canonical PART record was first created.

## Unidentified parts

A PART can initially have no part number, a useful description such as `Fir tree clip`, and source/provenance information when available.

It can later be identified through a verified catalogue part number.

Descriptions are not unique identifiers.

## Part-number normalization

Part-number normalization is deterministic and conservative: require a string when supplied, trim surrounding whitespace, convert to uppercase, remove whitespace and hyphen separators, and preserve the original representation in `part_number_raw`.

Examples:

| Raw input | Normalized value |
|---|---|
| `MNA 7691-AA` | `MNA7691AA` |
| `mna-7691-aa` | `MNA7691AA` |
| `XR847031` | `XR847031` |

## PART image and identification evidence

`part_image` is a separate child entity of canonical `part`.

It stores a stable image record ID, `part_id`, opaque `image_ref`, source/provenance, optional description, and verification status.

One PART may have multiple images, including before its catalogue part number is known.

Image descriptions are not identity fields.

An unavailable image placeholder has `image_ref = NULL` and `availability_status = unavailable`; no invented reference is needed.

## Catalogue occurrence tree

A canonical PART may appear in multiple EPC/JEPC source paths. VIEPS therefore treats catalogue browsing as an occurrence-tree problem rather than assigning one tree path to the PART itself.

The imported source path can include:

```text
model/catalogue ancestry
    -> category ancestry
    -> top-level item description
    -> ordered source description/breakpoint nodes
    -> PART occurrence
```

The tree provides browse structure, human-readable occurrence context and source filter candidates. It is not itself the Boolean fit evaluator.

Migration `0017_part_tree_occurrence.sql` extends the existing tree storage additively. It preserves legacy browse rows while allowing source-qualified imported nodes to retain source namespace, model/category/item scope, source language, stable source node identity, parent source node identity, source description, source order, source reference and verification state.

Description text and flattened full-description paths are not structural identity.

`part_tree_part` remains the broad tree-node ↔ canonical PART browse/navigation summary.

`part_occurrence_tree_path` is the exact occurrence/path relation. It links a `part_occurrence` to the source tree node/path evidence and preserves source namespace, stable source path identity, optional application ID, source reference and verification state. One occurrence may have multiple path rows where the source does so.

Filtering is occurrence-first: select the branch, retain occurrences satisfying requested description/VIN/fit filters, then project distinct PART identities. Reverse PART-number search can therefore return every occurrence with its complete retained tree context.

JEPC language trees are not assumed to be structurally identical. Language-qualified source nodes are preserved independently and canonical PART identity is shared across them. Cross-language path equivalence is not inferred from matching labels.

Source-description-to-domain mappings are a separate enrichment layer and do not alter source tree identity or raw fit evidence.

## PART vehicle and VIN fit

Occurrence-bound model context, alternative condition sets and versioned evidence complement the PART-level model/VIN links. The detailed occurrence-applicability relations and verification limits are defined below; PART-level fitment rows are not automatically promoted into grouped occurrence evidence.

Vehicle fit is represented outside the canonical `part` row.

`model_range` and `vin_range` are distinct concepts.

Model-range and VIN-range fit are not collapsed into one entity.

A PART can link to multiple ranges through `part_model_range` and `part_vin_range`.

Those links apply at PART level. Occurrence fit binds an occurrence to a versioned source model context and its optional canonical `model_range`; it does not introduce a complete global model/variant ontology.

Discriminator columns retain source text, not decoder output with independently tracked derivation.

VIN-derived interpretation must remain distinguishable from source facts.

This model does not use KOVuosi as a source for VIN decoding, VIN-range selection or model-year inference and does not implement a complete VIN decoder.

## PART supersession

`part_supersession` is an explicit directed relationship between catalogue parts.

`superseded_part_id → superseding_part_id` preserves both superseded and replacement identities.

One replacement may supersede multiple superseded parts and chains such as `A → B → C` are representable.

Supersession is not a generic interchangeability assertion.

A superseded PART remains a canonical PART and remains separately addressable from the PART that supersedes it. Historical and current part identities remain separately addressable.

Only direct self-links are prohibited; multi-hop cycles and effective-date ordering are not constrained.

Representative evidence fixture: `MNA7691AA → XR847031`.

## PART fitment and attribute fit

`part_fitment` stores source occurrence constraints and retained PART/range qualifiers in one domain table.

Every row has exactly one scope:

- an occurrence; or
- a PART plus `vehicle_range` pair.

It cannot name both scopes.

Retained range qualifiers remain source text.

Opaque JEPC attribute groups remain source data until semantic interpretation is verified.

The original source representation of `exceptFlag` is retained in `except_flag`.

The database does not translate that value or check consistency with `applicability_state`; a verified importer must supply the state.

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable fitment-record identifier. |
| `part_occurrence_id` | required for occurrence scope | FK to the EPC/application occurrence; NULL only for a PART/range row. |
| `applicability_state` | required | `applicable`, `excluded`, or `unavailable`. |
| `attribute_group` | optional | Original/source attribute group identifier. |
| `attribute_key` | optional | Original/source attribute key. |
| `source_value` | optional | Original/source attribute value; not interpreted unless established. |
| `except_flag` | optional | Original source exclusion indicator. |
| `source` / `source_ref` | optional | Provenance/evidence. |
| `verification_status` | required | Verification state. |
| `confidence` | optional | Confidence where appropriate. |

Occurrence-bound grouped fit is separate from `part_fitment`. Grouped evidence does not silently reinterpret stored `applicability_state` rows as an evaluated fit result.

### Required distinctions

#### Terms explained

In this specification, **fit** describes the supported vehicle/configuration contexts of a catalogue part. **Fitment** is the evaluation of that fit for a particular vehicle and catalogue role, returning applicable, not applicable or unavailable. Catalogue usage sometimes treats these words as synonyms; this distinction clarifies the data versus the query result. A fitment result does not by itself certify mechanical installation, modification safety or interchangeability.

**Conditions** are the requirements and exclusions that define an fit assertion. An **attribute** is a dimension/value describing a vehicle or catalogue context; a condition applies an operator to it, such as `steering = RHD` or `market != Japan`. Preserve verified combinations, not just a bag of labels.

| Source term/example | What it describes | Example condition / boundary |
|---|---|---|
| Supercharged | Engine configuration: a supercharger is specified. | Requires the verified supercharged configuration. Do not infer it from an unknown group code or assume this attribute occurs in the headlamp examples. |
| Other option / headlamp levelling / headlamp powerwash | A particular equipment feature or option. | Requires headlamp levelling; or excludes vehicles with it. `Other option` without an identified feature/value is unresolved, not a defined universal flag. |
| LHD / RHD | Left-hand-drive / right-hand-drive steering configuration of the vehicle. | Requires RHD. |
| LH / RH source path descriptions | Observed JEPC language descriptions on decision-tree nodes that are distinct from the LHD/RHD descriptions. Their exact semantic role and fit encoding are unverified. | Preserve the descriptions and path evidence without assuming that they are presentation-only, a physical installation-side dimension, or absent from fit semantics. |
| Region | A source market grouping used to scope a catalogue model/profile. | A Canada/USA model grouping scopes the catalogue; a USA branch adds a more specific market condition. Region, country/market and steering remain separate dimensions. |
| `($)` in a category title | An observed source marker, retained verbatim. | In the examined later-XK headlamp category it accompanies Canada and USA branches. Market scope can occur below a shared model. Do not globally equate this marker with an approved geographic vocabulary without further mapping evidence. |
| Except Japan | An exclusion of the stated market within the surrounding scope. | `market != Japan`; unknown market does not prove this condition true. It does not mean every non-Japanese vehicle worldwide is covered. |
| Assembly | The supplied component/assembly description or catalogue role. | Not every heading is a vehicle-selection condition. |
| Bundle | A logical set of related source files and references needed to interpret one selected catalogue context together. | Identified by source namespace plus model/category/item/language as appropriate; not a ZIP file, a PART, or necessarily all files in one folder. |

A bundle includes the relevant model/category menu ancestry, category popup and illustration reference, numbered-item list, item/application rows and available fit sidecars. Shared parent files and referenced media can serve several bundles. Record their dependencies once and link them; report missing dependencies explicitly. The precise transaction/checkpoint boundary remains an importer contract. Referenced media may be processed separately by MediaImporter without losing the bundle relationship.

#### Relationship to the preserved catalogue tree

Fit assertions are bound to source occurrences, and source occurrences retain their complete catalogue/tree path.

The tree serves three purposes that are distinct from predicate evaluation:

1. catalogue browsing;
2. human-readable occurrence context and filter candidates;
3. provenance showing where a PART/application appears in JEPC.

The same canonical PART may therefore have several source occurrences and several paths. Filtering removes or retains occurrences first; a PART remains visible while at least one occurrence survives.

A full-path string is presentation/debug output only. The normalized model must retain structural source-node identity, ancestry/order and occurrence linkage independently of concatenated text.

A semantic enrichment layer may map source descriptions to normalized facets. Such mappings do not replace the raw tree descriptions or the raw JEPC predicates.

#### Headlamp examples

The following are observed **source paths** confirmed in the source item files. They are not a claim that each displayed path is the complete final predicate or that all source descriptions have been mapped to approved typed dimensions.

| Part and source context | Meaning of the selected path |
|---|---|
| LJA4513AF, model 3183/category 8067/item 1, application 145240 | In the Canada/USA model and HEADLAMP ASSEMBLY-POWERWASH category: headlamp assembly → USA market → except headlamp levelling → LH source-path description. The shown path does not specify LHD or RHD; do not infer steering from USA or the `LH` path description. |
| LJA4501AG, model 3187/category 8069/item 1, application 145251 | In the earlier XK model and HEADLAMP ASSEMBLY-NON POWERWASH category: headlamp assembly → headlamp levelling → except Japan → RHD steering → LH source-path description. Levelling, market and steering are distinct observed semantics; the exact semantic role of the `LH` description remains unresolved. |

The installed file also lists LJA4513AF/application 145240 beneath Canada and USA alternatives, and LJA4501AG/application 145251 beneath another path headed `Except headlamp powerwash`. Preserve every source path and its row identity. The same application ID can repeat under different paths inside one bundle; it is not a unique leaf-row identifier. Verify how the paths combine before emitting normalized condition sets. Never combine all alternative path headings into one mandatory conjunction.

`145251,[A23,157,0,0]` is the corresponding application sidecar tuple for LJA4501AG. That tuple alone does not contain the complete displayed path. The hierarchy, scope and sidecars must be interpreted together. Repeated source paths are import evidence; VIEPS consumes their verified derived relationships without traversing JEPC nodes.

The later model `3178` has category `8059`, `HEADLAMP ASSEMBLY-NON POWERWASH ($)`, with Canada and USA branches. It does not require a separate market-specific model identity. Installed application `145267` supplies LJA4511AG on LH-side paths; RH-side paths instead supply LJA4510AG/application `145265`. Region/market conditions may therefore belong to the occurrence's condition sets even when `model_context.region_ref` is absent. Preserve original source wording; deciding whether a normalized group is called North America or Americas is a vocabulary mapping, not inferred from the dollar marker alone.

| Concept | Meaning and boundary |
|---|---|
| PART | Canonical catalogue identity, independent of vehicle, language and stock. |
| Occurrence | A source application of one PART in a particular catalogue context. A matching part number does not merge separate occurrences. |
| Catalogue role | The contextual item/function fulfilled by an occurrence. Category/item/diagram scope identifies it where evidence supports that mapping. This term does not mandate a new role table. |
| Model context | A source-qualified model/subrange and its established relationship to a canonical model range. Source model ID, parent ID and market profile remain distinguishable. A source model ID is not automatically a globally canonical model/variant. |
| Fit assertion | A positive or explicitly negative statement about one occurrence in a model context, conditional on a complete combination of constraints. |
| Evaluation | A result for a supplied vehicle context: `applicable`, `not_applicable` or `unavailable`, with reasons and evidence. It is not a permanent property of a PART or an individual attribute. |

Do not equate the existing presentation `vehicle_range` with canonical `model_range`. Preserve unmapped source contexts without inventing their canonical relationship. Source region/market text, engine attributes and model names must not be substituted for one another.

### JEPC source-attribute interpretation contract

JEPC fit attributes are an open source vocabulary, not a fixed five-column vehicle schema. Source responses and fit sidecars can contain group IDs beyond the five common editable groups. Therefore production normalization must preserve the raw JEPC group/value identity even when a human-readable mapping is available.

A verified mapping can be established from several evidence forms:

- explicit source/UI naming for a specific group;
- repeated joins between an application ID in an item-tree leaf and the matching `*_attributes.xml` sidecar row;
- consistent catalogue ancestry across independent occurrences.

One observed X100 example has the tree ancestry `main floor → RH → Coffee → LHD → GJA9460BJSDC` and sidecar `142207,[A155,2932,0,0][A23,154,0,0]`. This supports `A155=2932` as Coffee and `A23=154` as LHD in that source context. It also demonstrates that `RH` and `LHD` are separate source-path descriptions. The example does not establish the semantic role of `RH` or prove that it is absent from fit semantics elsewhere.

Mappings derived from ancestry are versioned interpretation evidence, not replacements for the raw tuples. Equal display descriptions in different JEPC groups must remain distinct source values. Unknown groups/values remain unresolved evidence and must not be guessed, dropped, or coerced into one of the legacy VIN UI fields.

### Occurrence and combination requirements

1. Bind every fit assertion to exactly one occurrence and one explicit model context. Model/VIN/attribute conditions must stay attached to that same assertion. Never combine independent PART-to-model and PART-to-VIN lists into their Cartesian product.
2. An occurrence can have several alternative complete condition sets. Sets are alternatives (`OR`); all predicates within one set must hold together (`AND`). An explicit exclusion within a set is a negative predicate, not a global exclusion of the PART.
3. Only a verified source mapping may establish set boundaries and operators. Duplicate source IDs are not sufficient evidence for either `AND` or `OR`; category, top-level item and application scopes behave differently.
4. A condition set can contain typed model/context constraints, serial bounds and verified attribute membership/nonmembership constraints. Known domain dimensions use typed relationships. Unknown source groups stay in evidence; do not turn arbitrary source descriptions or generic EAV rows into verified domain facts.
5. A source omission is not an unconditional assertion. An unconditional set requires explicit verification that no further condition applies within its stated scope. Empty sets produced by parser failure or missing dependencies are unresolved, never automatically true.
6. Alternative occurrences of the same PART retain their catalogue roles, constraints and evidence when results are grouped under the PART. A negative result for one occurrence must not veto an independently applicable occurrence in another role/context.
7. Conflicting positive and explicit negative evidence for the same occurrence and matching context produces `unavailable` with a conflict reason until resolved. There is no implicit last-write-wins or global exclusion-wins rule. Source `exceptFlag` alone is not an explicit negative assertion.

The logical form is a finite collection of relational condition sets, not a persisted copy of the JEPC decision tree. If flattening verified logic would cause unbounded expansion, preserve the unresolved source case and report it; silently truncating alternatives is forbidden. Physical table names and representation optimizations remain subject to the schema constraints.

### Serial and VIN requirements

- Preserve exact raw serial/boundary text, including leading spaces and zeros. Store normalized comparison values separately, with the parser/mapping version and evidence for the normalization.
- Support lower-only, upper-only and two-sided serial constraints. Do not fabricate a VIN prefix, a zero start, a maximum end or a model-year interval to satisfy a SQL `NOT NULL` constraint.
- Derive effective fit by intersecting the verified model/subrange interval with the occurrence's verified conditions. A one-sided item condition does not imply a one-sided effective interval: model breadcrumbs and authoritative production/VIN documents may supply the other endpoint. Preserve the source condition, inherited model bounds and derived intersection separately, with evidence for each.
- Model boundary inheritance requires an explicit occurrence-to-model-context relationship. Use only compatible serial domains and market scopes. The next model's start can corroborate an endpoint, but deriving a predecessor requires verified ordering, adjacency and no-gap assumptions; do not universally subtract one or bridge different serial formats.
- Distinguish a known unbounded endpoint from an endpoint whose meaning or value is unknown. For a required-but-unknown endpoint, the constraint remains unresolved.
- Store boundary direction and inclusivity explicitly. For the audited C comparison, type `0` rejects smaller serials and type `1` rejects larger serials; equality survives. This is not an attribute-exclusion flag.
- Scope a serial comparison to its source model/domain and an approved comparator. A serial is not a full VIN. Do not compare across unrelated model domains or assume a universal numeric, lexical or alphanumeric ordering.
- A prefix may be unknown when a source model and serial condition are known. The evaluator must have an established context match; absence of a prefix is not a wildcard across all models.
- Validate bound compatibility and ordering under the selected comparator. Reject/quarantine impossible intervals, invalid values and unsupported comparators; preserve their raw evidence.

For model `3187`, the model description supplies the upper boundary `042775`. Application 151439's `from 023700` condition therefore has an effective interval `023700` through `042775` once model ownership, comparator and inclusivity are verified. Application 93491's `through 023699` interval may use the model start from an authoritative JLHT document only when that exact value and citation are present in retained evidence. Without that cited value, the model-start bound remains unavailable; this does not establish that no such bound exists.

The source model list separately identifies `3178` as `A00083` through `A30644` and `3173` as from `A30645`. These are separate model contexts; capture the latter's end from the cited authoritative document rather than inventing it. Production normalization, alphanumeric ordering and the actual parser-to-comparator path still require source validation. The isolated comparator probe is not evidence that trimming raw source tokens is universally safe.

#### Parts spanning sub-model boundaries

A catalogue sub-model boundary is not a PART identity boundary or necessarily a change of part. One PART may have fit evidence on both sides through distinct occurrences. Return the union of those scoped assertions under the same canonical PART; retain their separate provenance and conditions.

The observed passenger-airbag records illustrate this. Effective intervals below intersect the displayed item conditions with the source model bounds; final verified fitment also requires validation of remaining parent/category/attribute constraints.

| Canonical PART | Model / category / item / application | Source item condition | Model-bounded serial interval |
|---|---|---|---|
| HJB9670AA | 3187 / 11096 / 1 / 151439 | From 023700 | 023700 through 042775 |
| HJB9670AA | 3178 / 9504 / 1 / 151441 | Through A00115 | A00083 through A00115 |
| HJB9670AB | 3178 / 9504 / 1 / 150742 | From A00116 through A11050 | A00116 through A11050 |
| HJE9042AB | 3178 / 9504 / 1 / 171081 | From A11051 | A11051 through A30644 |
| HJE9042AB | 3173 / 9502 / 1 / 171082 | No additional serial condition displayed on the item row | A30645 through the documented model end, subject to inherited conditions |

HJB9670AA therefore remains one PART across the numeric and A-prefixed source model contexts. Do not replace its two intervals with a universal `023700 through A00115` string comparison. HJE9042AB also remains one PART across A30644/A30645. A display may coalesce proven adjacent intervals only when serial domain, ordering, scope and all other conditions are equivalent; the underlying occurrences and evidence remain separately recoverable. Catalogue succession of part numbers is not, by itself, a supersession or interchangeability statement.

Item number `1` is local to its category/model context. These records do not authorize globally merging every item `1`, category description or application ID. Conversely, requiring separate source occurrences must not duplicate the canonical PART or prevent a query from returning its full supported coverage across sub-models.

### Attribute and exclusion requirements

Retain record family, key scope, group/code, tuple position, raw value and flag. A verified mapping identifies the target dimension, allowed value domain, operator, cardinality and missing-value behavior. Mapping versions must be independently identifiable from parser versions.

Within a verified dimension, a set of alternative included values can be represented by membership; explicit excluded values by nonmembership. Across dimensions, preserve the established combination rather than manufacturing all combinations. Multi-valued vehicle attributes need a defined quantifier/cardinality policy before evaluation; scalar `not equal` is not a safe default for a set.

Unknown source groups do not justify guessed names such as engine, body or market. An opaque source code can be retained, but evaluating it requires a verified mapping to comparable vehicle-context evidence. Unsupported tuples and flags must remain visible as unresolved conditions.

### Evaluation and query contract

Use three-valued predicate evaluation: true, false and unknown. A known false predicate defeats an `AND` set; otherwise any unknown makes that set unknown. A verified true alternative satisfies `OR`; otherwise an unknown alternative prevents an all-false conclusion.

These truth rules apply only to established predicates and grouping. Unresolved grouping, incomplete relevant source coverage, a failed source dependency or conflicting assertions adds an assertion-level availability gate. A partially imported assertion must not become a verified positive result merely because one retained predicate matched.

| State | Required meaning |
|---|---|
| `applicable` | At least one complete verified positive assertion matches, with no unresolved contradictory evidence in that assertion's scope. Return the matching occurrence/role and conditions. |
| `not_applicable` | A verified explicit negative assertion matches, or all positive alternatives in a declared complete relevant scope evaluate false. State which basis was used. |
| `unavailable` | No evidence; incomplete scope; missing required vehicle values; unsupported interpretation/comparator; or conflicting relevant assertions. Return specific reason codes and retained evidence. |

When querying a PART across occurrences, a verified applicable occurrence establishes fit for that role/context. Retain other unresolved contexts in the response and report coverage separately. If none matches, any unresolved relevant occurrence/coverage prevents a blanket negative result.

The response must retain occurrence IDs, model contexts, complete condition-set grouping, exclusions, evidence/mapping version, availability reasons and coverage. Summary model/VIN lists may be returned for navigation but cannot replace the grouped facts used for fitment. Reverse lookup returns conditional contexts, not a fabricated exhaustive list of individual vehicles.

Keep candidate browsing separate from verified fitment. A source UI leaving a candidate visible when vehicle input is absent does not authorize an `applicable` result. Existing `part_fitment.applicability_state` values describe stored rows; they must not be silently renamed or exposed as this new evaluation contract without an explicit adapter/migration.

### Recommended relational refinement

These are logical entities for schema design, not executable DDL. Reuse existing entities where their semantics and integrity constraints fit.

| Relation | Required contents and cardinality |
|---|---|
| Source model context | Stable source-qualified identity; source model/parent IDs and profile evidence; optional verified canonical `model_range` relationship. One context has many assertions. |
| Fit assertion | Stable identity; exactly one occurrence and model context; positive/explicit-negative effect; verification and coverage state. One assertion has zero or more condition sets; zero means unresolved. |
| Condition set | Belongs to exactly one assertion; alternative-set identity; completeness/unconditional state. Contains zero or more typed predicates; zero predicates require verified unconditional status. |
| Serial constraint | Belongs to one set; serial domain/comparator; optional established VIN prefix; separate endpoint states, values and inclusivity; raw-evidence links. Effective intervals retain links to both model bounds and occurrence constraints used in their derivation. |
| Attribute constraint | Belongs to one set; verified dimension/value-domain reference; membership/nonmembership operator and values; cardinality semantics; raw-evidence links. |
| Evidence and interpretation | Many evidence records may support one assertion/predicate and one source record may support several derived relationships. Preserve source dataset, relative path, checksum, row/tuple locator, source scope, parser and mapping versions, verification and unresolved reasons. |

Foreign keys and uniqueness must enforce scope ownership: a condition cannot leak into another assertion, and an assertion cannot name a different PART from its occurrence. Index occurrence, model context, serial domain/bounds and verified attribute lookup paths appropriate to both query directions. Reject references that mix domains; a free-text context description is insufficient for relational identity.

#### Multilingual occurrence-path rule

Language is not assumed to be merely a text translation over one universal JEPC tree. Where source-language trees differ structurally, preserve those trees and their occurrence paths independently.

Canonical PART identity remains language-independent when the source PART identity is the same. Source node/path identity is language-qualified unless deterministic equivalence is established. Cross-language reconciliation is derived data and must not be forced by equal descriptions or a shared application number alone.

#### Stable identity and reprocessing

Separate logical source identity from byte-version evidence. A checksum identifies source bytes, not a new PART or a new logical occurrence. The importer must establish a source key qualified by dataset namespace, model, category, item and application scope; qualify further where observed IDs collide. Language is evidence identity, not a new PART identity. Do not assume application IDs are globally unique or stable merely because they are numeric.

Repeated leaf rows for the same source application, PART and context may represent alternative source paths, as in the headlamp examples. Preserve each row/path as evidence and, after validating common occurrence identity, attach the derived alternatives to that occurrence. Repetition alone is not a collision and does not require duplicate PARTs or unconditional quarantine. Distinguish raw row/path identity from logical occurrence identity.

If a unique logical occurrence mapping cannot be established, quarantine the unresolved identity rather than merging by part number, description, filename checksum or row position. A changed PART association requires explicit reconciliation and retained prior-version evidence.

Reprocessing replaces/supersedes the complete derived assertion set for the affected source scope atomically, retaining prior evidence. It must remove stale active relationships as well as upsert current ones. Preserve stable existing entity IDs; do not append duplicates on rerun. Missing or failed source files cannot imply deleted fit until the relevant discovery/reconciliation scope is known complete.

#### Persistence evolution

Persistence changes must preserve stable PART/occurrence identities, raw source evidence, stock references and unresolved semantics. Existing rows without enough grouping or evidence remain unresolved rather than being promoted to verified FIT. Fixtures and UI examples are never promoted to verified source assertions.

Published persistence revisions are immutable evidence. Persistence changes must not reinterpret retained source evidence in place.

### Evaluation examples

The three airbag cases and headlamp case below are observed source examples; the other combinations are deliberately synthetic requirement fixtures, not additional Jaguar facts.

| Case | Required outcome |
|---|---|
| XK 3187/category 11096/item 1, application 93491 HNA9670BA through 023699; 151439 HJB9670AA from 023700 | Preserve separate occurrences and source constraints. Intersect with model bounds: the latter ends at 042775, not infinity; the former begins at the cited model start. With a verified comparator and otherwise complete context, 023699 selects the former and 023700 the latter; neither applies outside the model interval. Do not make a single impossible interval. |
| HJB9670AA in applications 151439 and 151441 | One canonical PART; two model-scoped occurrences and intervals (023700–042775 and A00083–A00115). Reverse lookup returns both without asserting cross-format continuity. |
| HJE9042AB in applications 171081 and 171082 | One canonical PART across sub-models 3178 and 3173. With complete verified context, coverage includes both A30644 and A30645; retain model ownership/evidence and do not infer the final model endpoint or unconditional fitment from an unqualified item row. |
| LJA4513AF/application 145240 and LJA4501AG/application 145251 each repeat under several source paths | Preserve all path evidence, reconcile each common application to its occurrence, and retain alternative condition sets. Keep steering (LHD/RHD), `LH/RH` source-path descriptions, market and equipment evidence separate. Do not assign a physical-position meaning to `LH/RH` until verified. Do not infer the entire fit chain from the application sidecar alone. |
| LJA4511AG/application 145267 under model 3178/category 8059 `($)` | Retain the shared model identity and raw category marker; represent Canada/USA market conditions in occurrence alternatives. Do not require a separate North America model or derive a global meaning of `($)` from this sample. Preserve the `LH` source-path description separately from steering; do not assign it a physical-position semantic until verified. |
| Same PART: context M1 through S100, context M2 from S200 | Return only those two context/bound combinations; never M1/from S200 or M2/through S100. |
| Same occurrence: (body B1 AND engine E1) OR (body B2 AND engine E2) | Match B1/E1 and B2/E2; reject B1/E2 and B2/E1 when scope is complete. |
| Include one configuration but exclude option X within that set | X defeats that set only; another verified alternative may still match. |
| Required engine absent from supplied vehicle context | `unavailable`, even if source browsing keeps the candidate visible. |
| One complete false alternative and one unknown alternative | `unavailable`; an unknown is not silently false. |
| No assertion rows, incomplete source scope or parser produced an empty set | `unavailable`; no universal fitment or blanket negative. |
| Positive and explicit negative match the same occurrence/context | `unavailable` with conflict evidence. |
| Duplicate import; changed or removed assertion | No duplicate identities; atomic replacement; prior-version evidence retained; stale active claims removed only under verified reconciliation. |
| Two languages describe the same source application | One canonical PART. Preserve each language-specific source path/tree independently when structure differs; reconcile a shared logical occurrence only when deterministic source identity/correspondence is established. |

Source transformation must establish source identity, comparator and attribute mappings from complete selected-bundle evidence. Unknown patterns remain unresolved/quarantined rather than being inferred from isolated examples.

### Persistence contract

The persisted source-evidence graph uses the relations below. Physical `applicability_*`, `occurrence_applicability` and `part_fitment.applicability_state` identifiers are storage/source-evidence names; active application terminology is FIT.

Standalone IDs are integer primary keys; all ownership/evidence IDs below are real foreign keys. Every FK uses restrictive deletion so referenced source evidence cannot silently disappear. Versioned imports insert new snapshots/contexts and switch snapshots transactionally; in-place mutation of published evidence or meaning is not supported.

| Relation | Fields and meaning |
|---|---|
| `applicability_bundle` | `id`; nonblank `source_namespace`, `bundle_key`, unique together. Logical selected source scope, not checksum identity. The verified importer owns the exact filename/application-to-key mapping. |
| `applicability_snapshot` | `id`; `bundle_id`; positive integer `revision`, unique per bundle; nonblank `parser_version`, `mapping_version`; `coverage` complete/incomplete, default incomplete; `state` staged/active/superseded, default staged. At most one active snapshot per bundle. |
| `applicability_evidence` | `id`; `snapshot_id`; nonblank `relative_path`, lowercase 64-hex `file_sha256`, `record_locator`; required `raw_record` text. Unique snapshot/path/hash/locator. Different paths or row locators preserve repeated application evidence. A fingerprint format check is not verification of the source bytes. |
| `applicability_serial_range` | `id`; nonblank `serial_domain`, `comparator`; independent lower/upper state known/unbounded/unknown, default unknown; each known endpoint requires nonblank value and explicit inclusive 0/1, each other state requires both NULL; verification verified/unverified/conflict, default unverified; optional `vin_range_id` links an established complete legacy VIN range. Raw/source or normalized meaning is established by evidence plus mapping version, not string shape. |
| `applicability_model_context` | `id`; nonblank source namespace/model ID/context version, unique together; optional source parent ID and region reference; optional canonical `model_range_id`; optional `serial_range_id` for model bounds; verification with unverified default. Shared models can leave region absent and constrain market in condition sets. |
| `applicability_context_evidence` | Composite key `context_id`, `evidence_id`. Many source records can establish a context and its inherited bounds. |
| `occurrence_applicability` | `id`; `snapshot_id`; nonblank `source_key`, unique per snapshot; exactly one `part_occurrence_id` and `model_context_id`; include/exclude `effect`, default include; verification default unverified; coverage default incomplete. PART ownership is derived solely through occurrence, avoiding inconsistent duplicated PART IDs. Include is an assertion kind, not a positive evaluation. |
| `applicability_condition_set` | `id`; `assertion_id`; nonblank `set_key`, unique per assertion; coverage default incomplete; unconditional 0/1 default 0; optional `serial_range_id` for the item/source constraint; optional `effective_serial_range_id` for a separately verified model-intersection result. Set evidence and context evidence retain both derivation inputs. |
| `applicability_dimension` | `id`; unique nonblank `code`; verification default unverified. A controlled scalar dimension definition; does not automatically map JEPC attribute groups. |
| `applicability_dimension_value` | Composite key `dimension_id`, nonblank `value_code`. The permitted values for that specific dimension. |
| `applicability_attribute_condition` | `id`; `set_id`; dimension/value composite FK; equals/not_equals `operator`; unique set/dimension/operator/value. Only scalar equality/inequality is implemented. Multiple allowed values use verified alternative sets, not implicit array semantics. |
| `applicability_set_evidence` | Composite key `set_id`, `evidence_id`. Many source paths may support one set; one source record may support multiple sets. Predicate-level attribution can be made through the evidence locator/raw record, but a dedicated per-predicate evidence relation is not implemented. |

Sets within an assertion are alternatives; attribute predicates and the item serial predicate within a set are conjunctive, subject to the asserted model context. SQL stores this grouping, not a Boolean evaluator. A set marked unconditional must have complete coverage and cannot contain item serial or attribute predicates. A missing/empty conditional set remains incomplete evidence, not universal truth. A derived effective range may still bound an unconditional-in-model set.

Triggers reject incompatible established model/predicate serial domains or comparators on set insertion/update, context reassignment and range-domain mutation. An absent model bound remains unknown, and values/order/intersection correctness are not inferred by SQL. The importer must validate those semantics before marking records verified. The database allows incomplete drafts intentionally; verification fields are recorded claims and not automatic certification.

#### Incremental replacement and stable identity

Use the existing PART/occurrence IDs across reruns. Assertion logical identity is `(bundle identity, source_key)`; an assertion row ID identifies one snapshot's revision of that assertion. Do not expose that revision row ID as permanent catalogue identity. Use unique keys/upsert lookups for an unchanged snapshot rather than appending evidence or alternatives.

For a changed bundle, stage a new snapshot and its complete derived graph in a transaction. Retain stable PART/occurrence identities and previous source records. Only after required validation, supersede the previous active snapshot and activate the new snapshot in the same transaction. Failure must roll back both graph changes and the active-snapshot switch. The active snapshot determines the complete current assertion set, so old assertions omitted by verified reconciliation no longer leak into reads. A missing-file observation alone is not sufficient authorization to omit assertions or declare complete coverage.

Contexts, ranges and vocabulary entries referenced by prior snapshots must be versioned/reused according to evidence; do not edit their meaning in place during reprocessing. Referenced evidence must remain protected from deletion, and writers must enforce append-only interpretation revisions plus source-dependency reconciliation.

#### Internal read contract

The FIT evidence read contract returns active assertions grouped by occurrence and context, including alternatives, typed attribute predicates, model/item/effective ranges and linked raw evidence. Reads must observe one consistent persistence snapshot. PART IDs must be valid canonical identifiers. Empty reads remain unavailable evidence, not negative fitment.

The response always declares `evaluation: unavailable`, `reason: evidence_only_no_evaluator`, and `catalogue_coverage: not_established`. Stored verification and coverage claims are returned separately. The evidence reader does not itself certify complete catalogue coverage, interpret serials, resolve conflicts or determine FIT. Reverse context lookup uses the context index and occurrence relationship; evaluation remains a separate contract.

Fixture evidence must distinguish observed source-inspired IDs from synthetic mapping/coverage claims. Storage validation must cover ownership/FK integrity, uniqueness, separate alternatives and paths, scalar dimension membership, endpoint states, domain consistency, atomic snapshot replacement, retained prior-version evidence and indexed queries. Storage validation does not replace the source-to-vehicle evaluation examples above.

## PART diagram and hotspot

PART diagram and hotspot records preserve source evidence; they do not define normalized geometry.

The diagram/location structure keeps EPC illustration identity, hotspot evidence, and catalogue vehicle-location mapping separate from both canonical PART identity and physical stock storage.

`diagram` represents an EPC/exploded illustration reference.

`part_occurrence_diagram` links one or more `part_occurrence` records to a diagram so the same canonical PART can remain represented in multiple EPC contexts without duplication.

`diagram_hotspot` represents an item/hotspot on a diagram and may link to the corresponding `part_occurrence`.

Source coordinates are retained as source evidence; no normalized VIEPS geometry is implied by the PART model.

A hotspot without a verified occurrence mapping remains representable.

Neither a diagram hotspot nor a visual dashed enclosure establishes kit composition. A diagram may provide evidence that separately numbered component callouts appear inside an apparent kit boundary, but the relationship remains unverified until the image evidence, hotspot/item mapping, component occurrences and source-qualified kit-part context agree.

### Kit-composition evidence

Where a source has a kit PN but no explicit component list, the system may retain a source-qualified `kit_composition_evidence` observation. It is additive evidence, not stock/BOM truth. A verified relationship may connect the kit to a component that retains its own canonical PART and separate availability; membership does not replace the component's individual identity.

Before a verified kit-content link can be published, its additive representation must record: kit part occurrence or part identity; component occurrence or part identity where available; diagram and exact image checksum; dashed-enclosure/callout observation; source hotspot or item mapping; detector/OCR and coordinate-conversion versions; provenance; verification status; and a reason for unsupported or conflicting cases. A kit-only component with no independent PN/hotspot is represented as source evidence without a fabricated canonical PART or standalone availability. Repeated item numbers and multiple rectangles remain separate observations until their component mapping is verified.

The model must distinguish `candidate`, `verified`, `unsupported` and `conflicting` evidence. It must not infer a kit PN from a dashed line, infer all enclosed components as kit contents, or collapse this catalogue evidence into operational stock or a manufacturing bill of materials.

## Catalogue vehicle location

`part_vehicle_location` represents a catalogue-side vehicle-location mapping scoped to a PART occurrence and, where applicable, a `model_range`.

`mapping_state` is explicitly `verified` or `unavailable`.

A verified mapping requires a location reference.

An unavailable mapping records that no verified mapping is available and must not fabricate a zone or coordinate.

Physical stock/storage location is not stored in this entity; it remains part of the operational stock model.

## PART to operational stock

`stock_item` is an operational record and is not a catalogue PART identity.

Physical D1 placement and database topology are defined in [`MODEL_D1_jagports.md`](MODEL_D1_jagports.md). SQLite/D1 cannot enforce a foreign key across separate D1 databases.

A resolved stock-to-catalogue relationship therefore uses the logical catalogue reference:

```text
(catalogue_range, part_id)
```

`part_id` identifies the canonical PART within the resolved catalogue scope. `catalogue_range` is the stable configured Range slug used to route imported catalogue reads to `parts-<range_slug>`; it is a routing scope, not a FIT assertion.

Rules:

- imported JEPC PART: `catalogue_range` and `part_id` are both present; the pair is a logical cross-D1 reference and is **not** a SQL foreign key;
- catalogue fixture PART physically stored in `jagports`: `catalogue_range = NULL` and `part_id` may use a same-database foreign key;
- unresolved reusable identity: `catalogue_range = NULL` and `part_id = NULL`;
- `catalogue_range` must not be present when `part_id` is NULL.

`stock_item.part_id = NULL` does **not** mean merely "not found in Jaguar/JEPC". It is reserved for stock whose reusable product identity is genuinely unresolved. A known reusable third-party product must first resolve to either an existing Jaguar PART (verified 1:1 case) or a Jagports specified PART (non-1:1 reusable case).

The existing `stock_item.part_number` field is retained as the stocked or superseded part-number reference. It is supporting stock evidence, not the canonical relational identity.

Operational STOCK cardinality, donor-vehicle linkage, unresolved-stock handling, storage/location semantics and stock-process boundaries are defined in [`MODEL_STOCK.md`](MODEL_STOCK.md). `MODEL_PARTS.md` defines only the catalogue-side identity that STOCK may reference.

## Architectural boundary

`PART` contains catalogue/reference identity only.

It has no direct vehicle FIT field and no mutable stock state.

`PART_IMAGE` is evidence associated with that stable identity.

FIT belongs to occurrence/FIT/context relationships.

Diagram/hotspot/location evidence belongs to explicit relationships.

Operational inventory belongs to separate stock records.

Catalogue vehicle location and physical stock/storage location are distinct concepts.

The physical D1 boundary, Search Index placement and database-topology ASCII model are canonical in [`MODEL_D1_jagports.md`](MODEL_D1_jagports.md).

## Field dictionary

`?` means SQL NULL is allowed: absent/unknown/not supplied, never an inferred positive or negative claim.

Optional text is source evidence with no assumed taxonomy unless a special meaning is stated.

Required text may still be blank unless a CHECK is explicitly documented.

SQLite affinities are not strict types; application/import validation is still necessary.

All standalone `id` fields are `INTEGER PRIMARY KEY AUTOINCREMENT` unless a table uses a composite key.

### Shared evidence fields

| Field | SQL type / null / default | Purpose |
|---|---|---|
| `source` | TEXT ? | Source system/document identifier; required and nonblank on `part_occurrence`. |
| `source_ref` | TEXT ? | Evidence URL/reference; required and nonblank on `part_occurrence`. A reference is not necessarily a URL. |
| `verification_status` | TEXT required, default `unverified` | Source/manual verification claim, not a controlled enum. |
| `confidence` | TEXT ? on supersession/fitment/diagram/location; REAL ? on stock | Source confidence value. There is no shared vocabulary, numeric interval or conversion policy. |
| `created_at`, `updated_at` | TEXT required, default CURRENT_TIMESTAMP | On vehicle and stock only. Writers must maintain update semantics. |

### Canonical identity and context

| Entity | Fields and purposes |
|---|---|
| `part` | `id`; `part_number_raw`; `part_number_normalized`; `description`; `source`; `source_ref`; `verification_status`. |
| `part_occurrence` | `id`; `part_id`; `source`; `source_ref`; `context_type`; `context_ref`; `category_ref`; `item_number`; `diagram_ref`; `diagram_item_number`; `verification_status`. |
| `part_image` | `id`; `part_id`; `image_ref`; `image_kind`; `description`; `source`; `source_ref`; `verification_status`; `availability_status`. |

### Fit and supersession

| Entity | Fields and purposes |
|---|---|
| `model_range` | `id`; `range_code`; `name`; `source`; `source_ref`; `verification_status`. |
| `vin_range` | `id`; `vin_prefix`; `serial_start`; `serial_end`; `model_year`; `production_boundary`; `market`; `body`; `engine_variant`; `emissions`; `transmission_steering`; `source`; `source_ref`; `verification_status`. |
| `part_model_range` | Composite PK `part_id`, `model_range_id`; evidence fields describe the relationship. |
| `part_vin_range` | Composite PK `part_id`, `vin_range_id`; evidence fields describe the relationship. |
| `part_supersession` | Composite PK `superseded_part_id`, `superseding_part_id`; `source`; `source_ref`; `verification_status`; `confidence`; `effective_from`; `effective_to`. |
| `part_fitment` | `id`; `part_occurrence_id`; `part_id`; `vehicle_range_id`; `variation`; `qualifier`; `applicability_state`; `attribute_group`; `attribute_key`; `source_value`; `except_flag`; `source`; `source_ref`; `verification_status`; `confidence`. |

The occurrence-applicability persistence dictionary is defined above in this model. Dynamic JEPC-description mapping relations are defined in [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md).

### Diagrams, hotspots and catalogue location

| Entity | Fields and purposes |
|---|---|
| `diagram` | `id`; `source`; `source_ref`; `diagram_ref`; `title`; `image_ref`; `verification_status`; `confidence`. |
| `part_occurrence_diagram` | Composite PK `part_occurrence_id`, `diagram_id`. |
| `diagram_hotspot` | `id`; `diagram_id`; `part_occurrence_id`; `item_number`; `source_x`; `source_y`; `source_geometry`; `coordinate_system`; `source_ref`; `verification_status`; `confidence`. |
| `part_vehicle_location` | `id`; `part_occurrence_id`; `model_range_id`; `location_ref`; `system_ref`; `category_ref`; `mapping_state`; `source`; `source_ref`; `verification_status`; `confidence`. |

### Operational identity and stock link

| Entity | Fields and purposes |
|---|---|
| `vehicle` | `id`; `vin_raw`; `serial`; `model_range`; `market`; `identity_status`; `notes`; `created_at`; `updated_at`. |
| `vehicle_identifier` | `id`; `vehicle_id`; `identifier_type`; `location`; `raw_value`; `normalized_value`; `source_ref`; `verification_status`. |
| `stock_item` | `id`; `part_number`; `quantity`; `condition`; `status`; `location`; `donor_vehicle`; `source_ref`; `notes`; `created_at`; `updated_at`; `catalogue_range`; `part_id`; `donor_vehicle_id`; `source`; `verification_status`; `confidence`; `available`. `(catalogue_range, part_id)` is the logical reference to an imported PART; a local fixture PART in `jagports` may use `catalogue_range = NULL` with a same-database FK. Full stock model fields and controlled condition code semantics are defined in `MODEL_STOCK.md`. |

### Retained range and catalogue-tree entities

`vehicle_range` is not an alias for `model_range`; no unverified conversion or collapse is performed.

| Entity | Fields and purposes |
|---|---|
| `vehicle_range` | `id`; `range_code`; `name`; `verification_status`. |
| `part_tree_node` | `id`; `parent_id`; `label`; `sort_order`; source-qualified fields `source_namespace`, `source_model_id`, `source_category_id`, `source_item_id`, `source_language`, `source_node_id`, `parent_source_node_id`, `source_description`, `source_order`, `source_ref`, `verification_status`. Legacy browse rows may leave source-qualified fields NULL. |
| `part_tree_part` | Composite PK `tree_node_id`, `part_id`. Broad PART membership/browse summary only; it is not exact occurrence/path identity. |
| `part_occurrence_tree_path` | `id`; `part_occurrence_id`; `tree_node_id`; `source_namespace`; `source_path_id`; optional `application_id`; `source_ref`; `verification_status`. Exact occurrence/path evidence; multiple rows per occurrence are valid when source paths differ. |
| `part_diagram` | `id`; `part_id`; `title`; `image_url`; `availability_status`; `source_ref`; `verification_status`. |

## Cardinalities, identity and deletion

| Relationship / entity | Cardinality and key behavior |
|---|---|
| PART → occurrence / image | 1:N, each child has exactly one PART; cascade deletes children. |
| PART ↔ model / VIN range | N:M via composite link PKs. Deleting either endpoint removes links, not the other endpoint. |
| PART → superseding PART | Directed N:M graph, ordered pair PK; self-links rejected. Deleting either PART removes incident edges, not other PARTs or stock. |
| Occurrence → fitment | 1:N for occurrence-scoped rows. |
| PART / vehicle range → fitment | Both required for range-scoped rows; each parent 1:N. The occurrence must be NULL. |
| Occurrence ↔ diagram | N:M composite PK. Deleting either endpoint removes links. |
| Diagram → hotspot | 1:N required diagram; deleting diagram removes hotspots. |
| Occurrence → hotspot | 1:N optional occurrence; deleting occurrence SET NULL preserves hotspot/source evidence. |
| Occurrence → vehicle location | 1:N required occurrence; optional model range. Deleting occurrence or a referenced model removes the mapping. |
| PART / donor vehicle → stock | Each stock has 0..1 logical canonical-PART reference and 0..1 donor. Imported PART references use `(catalogue_range, part_id)` across D1 and are resolved by application/provider code; only same-database fixture PARTs may use a physical FK. `part_id = NULL` is reserved for genuinely unresolved reusable identity. Catalogue deletion or unavailability must not delete STOCK; the reference becomes unresolved/unavailable until reconciled. Supersession never mutates stock. |
| Vehicle → identifiers | 1:N; cascade on vehicle deletion. Identifier text is not unique. |
| Tree parent → nodes / tree ↔ PART | Parent 0..1 per node, 1:N children; cascade subtree deletion. Current N:M PART membership remains a broad browse summary. |
| Tree ↔ occurrence/path | `part_occurrence_tree_path` is N:M where necessary: one occurrence may retain multiple source paths; deleting occurrence or tree node cascades only the link rows. |
| PART → part diagram | 1:N; cascade on PART deletion. |

The normalized PART number has a partial unique index for non-NULL values; multiple NULL identities and duplicate descriptions are valid.

The database does not compute normalization on new writes.

## Index inventory and query contract

The executable tests inspect the actual index catalogue and column order, unique/partial flags, and EXPLAIN QUERY PLAN for principal equality/reverse lookups.

Autoindexes implement composite primary keys and unique range codes; SQLite assigns their internal names.

| Table | Named indexes |
|---|---|
| `part` | `idx_part_number_normalized_unique`; `idx_part_number_raw`. |
| `part_occurrence` | `idx_part_occurrence_identity`; `idx_part_occurrence_part`; `idx_part_occurrence_context`; `idx_part_occurrence_diagram`. |
| `part_image` | `idx_part_image_identity`; `idx_part_image_part`; `idx_part_image_source`. |
| `vin_range` | `idx_vin_range_prefix_serial`. |
| `part_model_range`, `part_vin_range` | `idx_part_model_range_range`; `idx_part_vin_range_range`. |
| `part_supersession` | `idx_part_supersession_superseding`; `idx_part_supersession_superseded`. |
| `part_fitment` | `idx_part_fitment_identity`; `idx_part_fitment_range_identity`; `idx_part_fitment_part`; `idx_part_fitment_occurrence`; `idx_part_fitment_range`; `idx_part_fitment_attribute`. |
| `diagram` | `idx_diagram_identity`. |
| `part_occurrence_diagram` | `idx_part_occurrence_diagram_diagram`. |
| `diagram_hotspot` | `idx_diagram_hotspot_diagram`; `idx_diagram_hotspot_occurrence`; `idx_diagram_hotspot_item`. |
| `part_vehicle_location` | `idx_part_vehicle_location_identity`; `idx_part_vehicle_location_model`; `idx_part_vehicle_location_state`. |
| `stock_item` | `idx_stock_item_part_number`; `idx_stock_item_status`; `idx_stock_item_location`; `idx_stock_item_part_id`; `idx_stock_item_available`; `idx_stock_item_donor_vehicle`; `idx_stock_item_source`. A composite lookup index over (`catalogue_range`, `part_id`) is required when the logical catalogue-reference fields are implemented; this specification does not assign its schema-object name. |
| `vehicle`, `vehicle_identifier` | `idx_vehicle_vin_raw`; `idx_vehicle_serial`; `idx_vehicle_identifier_normalized`. |
| `part_tree_node`, `part_tree_part`, `part_occurrence_tree_path` | `idx_part_tree_parent`; `idx_part_tree_part_part`; `idx_part_tree_source_node_identity`; `idx_part_tree_source_parent`; `idx_part_occurrence_tree_path_occurrence`; `idx_part_occurrence_tree_path_node`; `idx_part_occurrence_tree_path_source`. |
| `part_diagram` | `idx_part_diagram_part`. |

| occurrence fit | `idx_applicability_snapshot_active`; `idx_applicability_serial_domain`; `idx_applicability_context_range`; `idx_occurrence_applicability_occurrence`; `idx_occurrence_applicability_context`; `idx_applicability_attribute_lookup`. |
| source-qualified fit descriptions and mappings | `idx_applicability_source_description_group`; `idx_applicability_mapping_dimension`. Unique source identities and revision pairs have SQLite-managed autoindexes. |
| source-to-occurrence description evidence | `idx_applicability_set_description_mapping` for immutable mapping-revision-to-condition-set lookups; domain-label tables have language-qualified primary keys. |
| Fit catalogue Admin audit | `idx_suitability_admin_audit_created`; normalized dimension/value retirement uses primary-key indexes. |

Source-qualified descriptions, localized labels and mapping revisions remain separate evidence layers. Separately evidenced source-to-condition-set links keep occurrence contexts distinct and allow coexisting equipment values without inferring a condition operator. Synthetic fixture records are never production source evidence.

Normalized category/value retirement and Admin audit data preserve stable codes and append interpretation revisions. Retiring a category/value excludes it from newly published FIT without deleting retained source or occurrence evidence.


Principal canonical lookup is `WHERE part_number_normalized = ?`, then relationships by PART/occurrence ID.

Reverse range/supersession/diagram/donor queries use the reverse indexes.

Stock filters have independent indexes; combined predicates and sorts require query-plan measurement with representative inventory before adding composite indexes.

Search may combine normalized/raw/description matching; description lookup must not make descriptions unique merely to improve query performance.

## Representative model fixtures

Synthetic fixtures may demonstrate canonical relationships such as multiple occurrences, unidentified images, model/VIN links, positive/excluded/unavailable fitment, mapped/unmapped hotspots, verified/unavailable locations, supersession chains, many-to-one replacement, multiple stock records, donor identity and unresolved stock.

Occurrence-fit fixtures may exercise grouped model/item/effective serial evidence, alternative attribute sets, repeated source paths, market conditions below shared models, source-version replacement and retained prior-version evidence. Catalogue-tree fixtures may exercise source-qualified node identity, ordered parentage, multiple occurrence paths, language-specific structural divergence and idempotent source identities.

Fixtures are examples of the model contract, not verified Jaguar/JEPC facts. Synthetic vehicle zones, VINs, fit assertions or other test data must not be presented as verified domain evidence.


## Third-party and Jagports specified PARTs

A reusable product uses the same canonical `part(id)` namespace whether it originates from Jaguar/JEPC or is a Jagports specified PART. Vendor-product references remain evidence about that reusable identity; they do not create a second canonical PART namespace.

### Product cases

VIEPS distinguishes two common third-party cases.

#### Third-party product that is 1:1 equal to a Jaguar PART

A vendor may sell a product under its own part number even though it is a verified 1:1 match for an existing Jaguar PART.

In this case:

- the existing Jaguar PART remains the canonical PART;
- the vendor's part number is stored as a third-party/vendor reference to that Jaguar PART;
- a second canonical PART is not created merely because the vendor uses a different number;
- equality must be verified before the vendor product is presented as 1:1 equal to the Jaguar PART;
- STOCK for that product may reference the existing Jaguar PART while retaining the vendor part number/reference.

#### Third-party product with no 1:1 Jaguar PART

A vendor may supply a product that Jaguar does not list as the same standalone PART. Examples include an NSS component supplied separately or a vendor kit that contains more than the Jaguar PART to which it is related.

In this case VIEPS creates a **Jagports specified PART**.

A Jagports specified PART:

- is a canonical reusable PART record added by Jagports;
- is not a Jaguar-issued PART;
- must have a mandatory existing Jaguar PART as its parent reference;
- must retain the catalogue category/item/occurrence/PART reference used to identify that parent;
- must not be described as a Jagports product: the actual product is supplied by the recorded third party/vendor.

### Part-number rule for Jagports specified PARTs

A Jagports specified PART must be anchored to its mandatory Jaguar parent PART.

Its part number is formed as:

```text
<JaguarPN>+<3rdPartyPN>
```

where:

- `<JaguarPN>` is the mandatory parent Jaguar PART number;
- `<3rdPartyPN>` is the vendor's part number for the non-1:1 product;
- the combined number is a Jagports specified identifier and must never be presented as Jaguar-issued.

For a 1:1 third-party match, do not construct a combined Jagports specified number merely to preserve the vendor number. Store the vendor number as the vendor reference to the existing Jaguar PART.

Existing PART normalization rules apply to lookup values while the entered/displayed part number remains preserved according to the canonical PART model.

### Parent Jaguar PART reference

Every Jagports specified PART must have one mandatory Jaguar parent PART.

The operator may identify the parent by:

- selecting an existing Jaguar/JEPC PART directly; or
- browsing the imported PART tree/category/item structure and selecting the Jaguar PART from that context.

The saved reference must identify the known catalogue context, including:

- category;
- item;
- occurrence;
- Jaguar PART.

These references make the relationship auditable and allow VIEPS to use the same Jaguar fit context rather than inventing separate fitment rules for the third-party product.

### PART relationship semantics

The model distinguishes these relationships:

| Relationship | Meaning |
|---|---|
| `parent_part` | Mandatory Jaguar PART to which a non-1:1 Jagports specified PART is anchored. |
| `component_of` | The Jagports specified PART is physically a component of another PART or assembly where this is known. |
| `equivalent_to` | A vendor product or independently identified PART is verified as 1:1 interchangeable with a Jaguar PART for the referenced context. |

Jaguar supersession remains governed by `part_supersession` in `MODEL_PARTS.md`.

`parent_part`, `component_of`, `equivalent_to`, and supersession are different facts and must not be presented as one another.

### NSS / not-serviced-separately products

An NSS component may be visible in JEPC even though Jaguar does not provide it as its own Jaguar PART.

When a third-party vendor supplies that component as a reusable product, VIEPS may create a Jagports specified PART for it.

The Jagports specified PART must use the relevant existing Jaguar PART as its mandatory parent and must retain the known category/item/occurrence/PART reference.

Creating the Jagports specified PART does not modify the imported JEPC record and does not create a Jaguar part number.

### Third-party vendor entities

#### `third_party_vendor`

Minimum vendor data:

| Field | Requirement |
|---|---|
| `vendor_id` | Required identifier of the vendor. |
| `name` | Required vendor name. |
| home URL(s) | At least one vendor home URL may be stored. Multiple URLs are supported. |
| home URL description | Required for each URL when more than one home URL is stored, so the URLs can be distinguished. |

A normalized implementation may store the URLs in a child relation such as `third_party_vendor_home_url(vendor_id, home_url, description)`.

#### `third_party_part`

Represents the vendor's own product reference.

Minimum fields:

- `third_party_part_id` — identifier of this vendor-product reference record;
- `vendor_id` — identifies the vendor;
- canonical `part_id` — required FK to the VIEPS canonical reusable PART identity; it points to the existing Jaguar PART for a verified 1:1 vendor product, or to the Jagports specified PART for a non-1:1 reusable vendor product;
- vendor part number;
- `manufacturer` — manufacturer/brand of the vendor product, kept distinct from the vendor/seller;
- `description` — vendor-product description;
- one or more product/source URLs where available;
- `verification_status`;
- `verification_date`.

`verification_status` is a select field with these values:

- `unverified` — the vendor reference or its PART relationship has been entered but has not yet been checked;
- `verified` — the vendor reference and its claimed relationship to the Jaguar/Jagports specified PART have been checked against available evidence.

`verification_date` is a date-select field and defaults to the current day when the record is entered or verified. It records when the evidence/mapping was checked.

A third-party product that is verified 1:1 equal to a Jaguar PART links directly to that Jaguar canonical `part_id`.

A third-party product with no 1:1 Jaguar PART links to the Jagports specified canonical `part_id` created for it.

`third_party_part.part_id` is therefore never the vendor-product reference identity itself. It is the canonical VIEPS PART identity that the vendor reference describes. A vendor part number must not be copied into `stock_item.part_id`, and a new canonical PART must not be created for a verified 1:1 vendor reference.

### Third-party cross-references

`third_party_part` identifies the vendor product and the canonical PART used by VIEPS to represent that reusable product.

`third_party_part_xref` records the explicit Jaguar reference relationship behind that vendor product. It does not replace `third_party_part.part_id` and it is not operational STOCK.

#### `third_party_part_xref`

Minimum fields:

| Field | Requirement | Meaning |
|---|---|---|
| `third_party_part_xref_id` | required, unique | Stable identifier of the cross-reference record. |
| `third_party_part_id` | required FK | Vendor-product reference being related. |
| `jaguar_part_id` | required FK | Existing Jaguar/JEPC canonical PART used as the Jaguar reference. |
| `relationship_type` | required controlled value | `equivalent_to`, `parent_part`, or `component_of`. |
| `part_occurrence_id` | nullable FK | Exact imported occurrence/context when known. |
| `part_occurrence_tree_path_id` | nullable FK | Exact source-qualified catalogue tree path selected for the occurrence when available; references the canonical occurrence-tree persistence from `MODEL_PARTS.md`. |
| `category_ref` | nullable except as required below | Retained catalogue category reference for auditable parent/context selection. |
| `item_number` | nullable except as required below | Retained catalogue item reference for auditable parent/context selection. |
| `source_ref` | nullable | Evidence supporting this particular relationship. |
| `verification_status` | required | `unverified` or `verified`. |
| `verification_date` | nullable | Date on which this relationship was checked. |

Cardinality and behavior:

- one `third_party_part` may have many cross-reference records;
- one Jaguar PART may be referenced by many third-party products;
- a verified 1:1 vendor product has one or more `equivalent_to` records and may point directly to that Jaguar PART through `third_party_part.part_id`;
- a non-1:1 Jagports specified PART must have exactly one `parent_part` cross-reference used to anchor the required `<JaguarPN>+<3rdPartyPN>` identity;
- a product may additionally have `component_of` references where independently evidenced;
- `parent_part`, `component_of`, `equivalent_to`, and Jaguar supersession remain different relationship types.

For the mandatory `parent_part` record of a Jagports specified PART, the selected Jaguar PART and known catalogue context must be retained. When the imported occurrence exists, `part_occurrence_id` is required and the category/item values must identify that same selected context. When the operator selected the parent through a specific imported source tree path and canonical `part_occurrence_tree_path` evidence exists, `part_occurrence_tree_path_id` must retain that exact path. One occurrence may have several source paths, so occurrence identity alone must not be used to claim which catalogue path the operator selected. If an imported occurrence/tree path is unavailable, explicit synthetic/manual category/item context may be retained, but it must not be presented as imported JEPC evidence.

Logical uniqueness rules:

- `third_party_part_xref_id` is globally unique;
- the same logical tuple `(third_party_part_id, jaguar_part_id, relationship_type, part_occurrence_id/category/item context)` must not be duplicated;
- each non-1:1 `third_party_part` has at most one `parent_part` relationship;
- duplicate `equivalent_to` or `component_of` rows for the same evidenced context are invalid.

A generic `fits` relation is not part of this model and must not replace explicit relationship semantics.

### Identity, uniqueness and nullability

These rules are part of the implementation contract and must be enforced either by database constraints or deterministic application validation.

| Entity / field | Required / nullable | Uniqueness / validation |
|---|---|---|
| `third_party_vendor.vendor_id` | required | globally unique stable vendor identity. |
| `third_party_vendor.name` | required, nonblank | not assumed globally unique; different vendor identities may have similar names. |
| vendor home URL | at least one may be stored; additional URLs optional | exact duplicate URL rows for one vendor are invalid. |
| home URL description | nullable for a single URL; required/nonblank when one vendor has multiple home URLs | descriptive text is not an identity. |
| `third_party_part.third_party_part_id` | required | globally unique stable vendor-product reference identity. |
| `third_party_part.vendor_id` | required FK | many products may belong to one vendor. |
| vendor part number | required, nonblank | unique within one vendor after the defined deterministic normalization; the same text may exist under another vendor. |
| `manufacturer` | required, nonblank | manufacturer/brand of the vendor product; distinct from the vendor/seller identity and not assumed globally unique. |
| `description` | required, nonblank | human-readable vendor-product description; not identity. |
| `third_party_part.part_id` | required FK for a reusable represented product | points to the existing Jaguar PART for verified 1:1 products or to the Jagports specified PART for non-1:1 products. |
| product/source URL(s) | zero or more | evidence, not identity; several URLs may be retained for one vendor product. Exact duplicate URL rows for one vendor product are invalid. |
| `verification_status` | required | only `unverified` or `verified`. |
| `verification_date` | nullable while unverified; required when status is `verified` | one date value for the current verification claim. |
| `third_party_part_xref.third_party_part_xref_id` | required | globally unique. |
| `third_party_part_xref.third_party_part_id` | required FK | many xrefs per vendor product allowed. |
| `third_party_part_xref.jaguar_part_id` | required FK | many third-party products may reference one Jaguar PART. |
| `relationship_type` | required | only `equivalent_to`, `parent_part`, `component_of`. |
| xref occurrence/tree-path/category/item context | nullable generally; required as described for the mandatory parent context | cannot contradict the selected Jaguar PART/occurrence; when a source-qualified tree path is selected, the stored path must belong to that occurrence. |
| vendor price snapshot amount | required when a snapshot exists | non-negative numeric value. |
| vendor price snapshot currency | required when a snapshot exists | three-character uppercase currency code. |
| observed/check date | required when a snapshot exists | records evidence date, not price validity forever. |
| price source URL | nullable | evidence, not identity. |

A canonical PART remains unique according to `MODEL_PARTS.md`; these third-party records do not weaken PART-number uniqueness or create a second canonical identity namespace.

### Representative deterministic fixtures

At minimum, executable or specification-level fixtures must cover these two paths.

#### Fixture A — verified 1:1 vendor product

Use a fixture Jaguar PART `JLM21917-Fixture` and at least two vendor-product records that both resolve to that same canonical Jaguar PART.

Representative fixture values include:

- Jaguar PART: `JLM21917-Fixture`;
- vendor: `Nimark-fixture`;
- vendor PN: `2312601-fixture`;
- manufacturer: a separate nonblank manufacturer fixture value, for example `ManufacturerA-fixture`;
- description: `Nimark-Korjaussarja, jarrusatula (Etuakseli)-Fixture`;
- product URL: `https://www.nimark.fi/buy/autofrenseinsa_d41792c/`;
- a second vendor-product fixture for the same `JLM21917-Fixture`, for example vendor `Motonet-fixture`, with its own vendor PN, manufacturer, description and URL;
- second description: `Motonet-Jarrusatulan korjaussarja-Fixture`;
- second product URL: `https://www.motonet.fi/tuote/jarrusatulan-korjaussarja-23-00843?product=23-00843`;
- each `third_party_part.part_id` points to canonical `JLM21917-Fixture`;
- each verified `third_party_part_xref` uses `relationship_type = equivalent_to` and points to `JLM21917-Fixture`;
- no Jagports specified PART is created for either verified 1:1 product;
- operational STOCK may point to `JLM21917-Fixture` while vendor-product evidence remains separate.

Expected results:

- both vendor PNs may resolve to the same existing Jaguar PART while preserving their different vendor and manufacturer identities;
- multiple source/product URLs may be retained without collapsing vendor-product identity;
- no duplicate canonical PART is created merely because vendor, manufacturer, description or URL differs;
- STOCK identity remains operational and separate from the vendor/xref evidence.

#### Fixture B — non-1:1 Jagports specified PARTs

Use two vendor-product fixtures against the same Jaguar parent so numbering, vendor separation and canonical PART creation are deterministic.

Common Jaguar context:

- existing Jaguar parent PART: `MJD7843AA-Fixture`;
- each vendor product has exactly one `parent_part` xref to `MJD7843AA-Fixture`;
- each parent xref retains the selected category/item/occurrence context plus the exact `part_occurrence_tree_path` when such imported path evidence is available;
- separately evidenced `component_of` references may include `JLM20079-Fixture`, `JLM21466-Fixture`, `JLM20078-Fixture`, and `JLM21465-Fixture`;
- the reference image/source may retain `https://parts.jaguarlandroverclassic.com/jlm20079-brake-caliper.html` as evidence for the NSS + item-7 context.

Fixture B1:

- vendor: `Nimark-fixture`;
- vendor PN: `D41792C-fixture`;
- manufacturer: a separate nonblank manufacturer fixture value;
- description: `Nimark-Korjaussarja, jarrusatula (Etuakseli)-Fixture`;
- product URL: `https://www.nimark.fi/buy/autofrenseinsa_d41792c/`;
- new canonical Jagports specified PART: `MJD7843AA+D41792C-fixture`;
- `source_origin = AddedManually`;
- `third_party_part.part_id` points to `MJD7843AA+D41792C-fixture`.

Fixture B2:

- vendor: `Motonet-fixture`;
- vendor PN: `23-00843-fixture`;
- manufacturer: a separate nonblank manufacturer fixture value;
- description: `Motonet-Jarrusatulan korjaussarja-Fixture`;
- product URL: `https://www.motonet.fi/tuote/jarrusatulan-korjaussarja-23-00843?product=23-00843`;
- new canonical Jagports specified PART: `MJD7843AA+23-00843-fixture`;
- `source_origin = AddedManually`;
- `third_party_part.part_id` points to `MJD7843AA+23-00843-fixture`.

For both B1 and B2, operational STOCK points to the corresponding Jagports specified PART, not to `MJD7843AA-Fixture` or any `component_of` reference.

Expected results:

- the requested combined identifiers are visibly Jagports specified and never shown as Jaguar-issued;
- the two vendor products remain separate even though they share the same Jaguar parent/context;
- fit follows the selected Jaguar parent/context;
- deleting or changing operational STOCK does not alter the PART/xref evidence;
- unresolved STOCK is not used once either reusable identity has been established.

Fixtures must also include invalid cases for duplicate logical xrefs, a second `parent_part` for the same non-1:1 vendor product, missing mandatory parent context, missing manufacturer, missing description, invalid relationship type, verified status without verification date, duplicate vendor PN within one vendor, and duplicate product URL rows for one vendor product.

### Vendor pricing evidence

Vendor price information is external evidence and is not the Jagports operational STOCK sale price.

A price snapshot should retain:

- vendor ID;
- vendor product reference;
- amount;
- currency;
- observed/check date;
- source/product URL;
- verification status where used.

Price snapshots must not modify canonical PART identity.

### Fit

A third-party product does not define a separate vehicle-fit system.

Its fit is the same as the Jaguar PART/context to which it is referenced.

For a Jagports specified PART:

- its mandatory parent is the Jaguar PART whose fit it follows;
- the known category/item/occurrence/PART reference is retained;
- VIEPS uses the same fit as that referenced Jaguar PART/context;
- no independent third-party fit conditions are created or edited here.

For a verified 1:1 third-party product, fit is the fit of the existing Jaguar PART to which the vendor reference is attached.

Jaguar catalogue applicability remains governed by the canonical PART occurrence/context evidence in this model. Dynamic JEPC-description FIT filter mappings are defined by [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md).

### X100 brake-caliper cylinder example

The X100/XK8 front-brake example shows the non-1:1 case.

JEPC shows item 7, a brake caliper seal kit, while the illustration also shows an NSS cylinder/piston component. A third-party vendor can supply a product containing the cylinder/piston together with seals.

That vendor product is not treated as a new Jaguar PART and is not assumed to be 1:1 equal to the Jaguar seal kit because it contains additional content.

VIEPS therefore:

1. selects the relevant Jaguar seal-kit PART from the appropriate imported category/item/occurrence;
2. records that Jaguar PART as the mandatory parent;
3. records the vendor's own part number;
4. creates a Jagports specified PART number as `<JaguarSealKitPN>+<3rdPartyPN>`;
5. uses the same FIT as the referenced Jaguar PART/context;
6. links STOCK to the Jagports specified PART.

If a vendor instead sells a verified 1:1 equivalent of the Jaguar seal kit, its vendor part number is attached directly to the Jaguar PART and no Jagports specified PART is required.

### Optional visual-location evidence

Optional point/region references on imported JEPC illustrations and uploaded location/reference images are PART-side evidence associated with the relevant canonical PART/occurrence and source context. They must retain provenance and verification state, remain distinct from physical STOCK location, and do not change FIT or STOCK state.

### Canonical `part_id` contract

For all third-party relationships:

- `part.id` is the canonical reusable PART identity within its catalogue scope;
- `third_party_part.part_id` points to that canonical identity inside the catalogue domain;
- resolved operational STOCK records the same canonical identity through `stock_item.part_id` plus `stock_item.catalogue_range` when the PART resides in a `parts-<range_slug>` database;
- vendor product identity remains in `third_party_part` and its vendor part number/reference fields;
- a verified 1:1 vendor product reuses the existing Jaguar `part_id`;
- a non-1:1 reusable vendor product uses the Jagports specified `part_id`;
- `stock_item.part_id = NULL` is not an alternative representation for a known reusable third-party product;
- a cross-D1 stock relationship is logical and must not be represented as a SQLite foreign key.

```text
vendor product reference (third_party_part)
             |
             v
canonical reusable PART
(catalogue scope, part.id)
             |
             v
logical STOCK reference
(catalogue_range, stock_item.part_id)
```

The relationship direction does not imply that a vendor product is Jaguar-issued. Origin/provenance remains authoritative for that distinction.
