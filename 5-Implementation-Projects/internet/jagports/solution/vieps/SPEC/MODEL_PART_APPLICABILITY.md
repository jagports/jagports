# PART applicability requirements

## Status and scope

Proposed refinement for review. This document specifies the required domain behavior and a recommended relational shape; it does not describe an implemented migration or approved source translator.

Canonical PART identity, occurrence identity, catalogue/stock separation and existing evidence remain intact. The first implementation scope is the selected XK source model `3187`. Additional models require their own mapping validation. Full VIN decoding, hotspot conversion, stock workflows and multilingual user interfaces are outside this refinement.

The production model must answer both vehicle-context-to-PART and PART-to-applicable-context queries using the same relationships. JEPC decision nodes and navigation paths may be retained as import evidence, but VIEPS must not execute the source navigation tree to answer applicability.

## Required distinctions

| Concept | Meaning and boundary |
|---|---|
| PART | Canonical catalogue identity, independent of vehicle, language and stock. |
| Occurrence | A source application of one PART in a particular catalogue context. A matching part number does not merge separate occurrences. |
| Catalogue role | The contextual item/function fulfilled by an occurrence. Category/item/diagram scope identifies it where evidence supports that mapping. This term does not mandate a new role table. |
| Model context | A source-qualified model/subrange and its established relationship to a canonical model range. Source model ID, parent ID and market profile remain distinguishable. A source model ID is not automatically a globally canonical model/variant. |
| Applicability assertion | A positive or explicitly negative statement about one occurrence in a model context, conditional on a complete combination of constraints. |
| Evaluation | A result for a supplied vehicle context: `applicable`, `not_applicable` or `unavailable`, with reasons and evidence. It is not a permanent property of a PART or an individual attribute. |

Do not equate the existing presentation `vehicle_range` with canonical `model_range`. Preserve unmapped source contexts without inventing their canonical relationship. Source region/market text, engine attributes and model names must not be substituted for one another.

## Occurrence and combination requirements

1. Bind every applicability assertion to exactly one occurrence and one explicit model context. Model/VIN/attribute conditions must stay attached to that same assertion. Never combine independent PART-to-model and PART-to-VIN lists into their Cartesian product.
2. An occurrence can have several alternative complete condition sets. Sets are alternatives (`OR`); all predicates within one set must hold together (`AND`). An explicit exclusion within a set is a negative predicate, not a global exclusion of the PART.
3. Only a verified source mapping may establish set boundaries and operators. Duplicate source IDs are not sufficient evidence for either `AND` or `OR`; category, top-level item and application scopes behave differently.
4. A condition set can contain typed model/context constraints, serial bounds and verified attribute membership/nonmembership constraints. Known domain dimensions use typed relationships. Unknown source groups stay in evidence; do not turn arbitrary labels or generic EAV rows into verified domain facts.
5. A source omission is not an unconditional assertion. An unconditional set requires explicit verification that no further condition applies within its stated scope. Empty sets produced by parser failure or missing dependencies are unresolved, never automatically true.
6. Alternative occurrences of the same PART retain their catalogue roles, constraints and evidence when results are grouped under the PART. A negative result for one occurrence must not veto an independently applicable occurrence in another role/context.
7. Conflicting positive and explicit negative evidence for the same occurrence and matching context produces `unavailable` with a conflict reason until resolved. There is no implicit last-write-wins or global exclusion-wins rule. Source `exceptFlag` alone is not an explicit negative assertion.

The logical form is a finite collection of relational condition sets, not a persisted copy of the JEPC decision tree. If flattening verified logic would cause unbounded expansion, preserve the unresolved source case and report it; silently truncating alternatives is forbidden. Physical table names and representation optimizations remain subject to schema review.

## Serial and VIN requirements

- Preserve exact raw serial/boundary text, including leading spaces and zeros. Store normalized comparison values separately, with the parser/mapping version and evidence for the normalization.
- Support lower-only, upper-only and two-sided serial constraints. Do not fabricate a VIN prefix, a zero start, a maximum end or a model-year interval to satisfy a SQL `NOT NULL` constraint.
- Distinguish a known unbounded endpoint from an endpoint whose meaning or value is unknown. For a required-but-unknown endpoint, the constraint remains unresolved.
- Store boundary direction and inclusivity explicitly. For the audited C comparison, type `0` rejects smaller serials and type `1` rejects larger serials; equality survives. This is not an attribute-exclusion flag.
- Scope a serial comparison to its source model/domain and an approved comparator. A serial is not a full VIN. Do not compare across unrelated model domains or assume a universal numeric, lexical or alphanumeric ordering.
- A prefix may be unknown when a source model and serial condition are known. The evaluator must have an established context match; absence of a prefix is not a wildcard across all models.
- Validate bound compatibility and ordering under the selected comparator. Reject/quarantine impossible intervals, invalid values and unsupported comparators; preserve their raw evidence.

The initial decimal XK boundary fixture demonstrates the required representation. Production normalization, alphanumeric ordering and the actual parser-to-comparator path still require source validation. The isolated comparator probe is not evidence that trimming raw source tokens is universally safe.

## Attribute and exclusion requirements

Retain record family, key scope, group/code, tuple position, raw value and flag. A verified mapping identifies the target dimension, allowed value domain, operator, cardinality and missing-value behavior. Mapping versions must be independently identifiable from parser versions.

Within a verified dimension, a set of alternative included values can be represented by membership; explicit excluded values by nonmembership. Across dimensions, preserve the established combination rather than manufacturing all combinations. Multi-valued vehicle attributes need a defined quantifier/cardinality policy before evaluation; scalar `not equal` is not a safe default for a set.

Unknown group labels do not justify guessed names such as engine, body or market. An opaque source code can be retained, but evaluating it requires a verified mapping to comparable vehicle-context evidence. Unsupported tuples and flags must remain visible as unresolved conditions.

## Evaluation and query contract

Use three-valued predicate evaluation: true, false and unknown. A known false predicate defeats an `AND` set; otherwise any unknown makes that set unknown. A verified true alternative satisfies `OR`; otherwise an unknown alternative prevents an all-false conclusion.

These truth rules apply only to established predicates and grouping. Unresolved grouping, incomplete relevant source coverage, a failed source dependency or conflicting assertions adds an assertion-level availability gate. A partially imported assertion must not become a verified positive result merely because one retained predicate matched.

| State | Required meaning |
|---|---|
| `applicable` | At least one complete verified positive assertion matches, with no unresolved contradictory evidence in that assertion's scope. Return the matching occurrence/role and conditions. |
| `not_applicable` | A verified explicit negative assertion matches, or all positive alternatives in a declared complete relevant scope evaluate false. State which basis was used. |
| `unavailable` | No evidence; incomplete scope; missing required vehicle values; unsupported interpretation/comparator; or conflicting relevant assertions. Return specific reason codes and retained evidence. |

When querying a PART across occurrences, a verified applicable occurrence establishes applicability for that role/context. Retain other unresolved contexts in the response and report coverage separately. If none matches, any unresolved relevant occurrence/coverage prevents a blanket negative result.

The response must retain occurrence IDs, model contexts, complete condition-set grouping, exclusions, evidence/mapping version, availability reasons and coverage. Summary model/VIN lists may be returned for navigation but cannot replace the grouped facts used for fitment. Reverse lookup returns conditional contexts, not a fabricated exhaustive list of individual vehicles.

Keep candidate browsing separate from verified fitment. A source UI leaving a candidate visible when vehicle input is absent does not authorize an `applicable` result. Existing `part_fitment.applicability_state` values describe stored rows; they must not be silently renamed or exposed as this new evaluation contract without an explicit adapter/migration.

## Recommended relational refinement

These are logical entities for schema design, not executable DDL. Reuse existing entities where their semantics and integrity constraints fit.

| Relation | Required contents and cardinality |
|---|---|
| Source model context | Stable source-qualified identity; source model/parent IDs and profile evidence; optional verified canonical `model_range` relationship. One context has many assertions. |
| Applicability assertion | Stable identity; exactly one occurrence and model context; positive/explicit-negative effect; verification and coverage state. One assertion has zero or more condition sets; zero means unresolved. |
| Condition set | Belongs to exactly one assertion; alternative-set identity; completeness/unconditional state. Contains zero or more typed predicates; zero predicates require verified unconditional status. |
| Serial constraint | Belongs to one set; serial domain/comparator; optional established VIN prefix; separate endpoint states, values and inclusivity; raw-evidence links. |
| Attribute constraint | Belongs to one set; verified dimension/value-domain reference; membership/nonmembership operator and values; cardinality semantics; raw-evidence links. |
| Evidence and interpretation | Many evidence records may support one assertion/predicate and one source record may support several derived relationships. Preserve source dataset, relative path, checksum, row/tuple locator, source scope, parser and mapping versions, verification and unresolved reasons. |

Foreign keys and uniqueness must enforce scope ownership: a condition cannot leak into another assertion, and an assertion cannot name a different PART from its occurrence. Index occurrence, model context, serial domain/bounds and verified attribute lookup paths appropriate to both query directions. Reject references that mix domains; a free-text context label is insufficient for relational identity.

### Stable identity and reprocessing

Separate logical source identity from byte-version evidence. A checksum identifies source bytes, not a new PART or a new logical occurrence. The importer must establish a source key qualified by dataset namespace, model, category, item and application scope; qualify further where observed IDs collide. Language is evidence identity, not a new PART identity. Do not assume application IDs are globally unique or stable merely because they are numeric.

If a unique occurrence mapping cannot be established, quarantine the collision rather than merging by part number, description, filename checksum or row position. A changed PART association requires explicit reconciliation and retained history.

Reprocessing replaces/supersedes the complete derived assertion set for the affected source scope atomically, retaining prior evidence. It must remove stale active relationships as well as upsert current ones. Preserve stable existing entity IDs; do not append duplicates on rerun. Missing or failed source files cannot imply deleted applicability until the relevant discovery/reconciliation scope is known complete.

### Current model gaps and migration obligations

| Current representation | Required refinement |
|---|---|
| `part_model_range` and `part_vin_range` are independent PART-level links. | Occurrence-bound joint model/serial/attribute assertions. Keep existing links as evidence/navigation summaries until their scope is reconciled. |
| No dedicated source model context relation. | Preserve source model/subrange/market identity and explicit canonical mapping without forcing a full global vehicle ontology. |
| `vin_range` requires nonblank prefix/start/end. | Represent scoped one-sided constraints and distinguish unbounded from unknown; review whether to evolve that entity or add an assertion-scoped serial relation. |
| Flat occurrence `part_fitment` rows have no combination/group identity. | Represent complete alternatives and typed predicates; do not infer their grouping from row order. |
| Fitment uniqueness excludes evidence reference and collapses equal tuples. | Preserve evidence multiplicity and set membership separately from semantic predicate deduplication. |
| `applicable` is a stored default; missing scope/completeness is not modeled. | Explicit verification/coverage and evaluation results; never backfill positive truth from a default. |
| Source/raw/derived values and release history lack a complete shared contract. | Link versioned evidence to interpretations and replace derived sets atomically. |

Use a new controlled migration; do not rewrite already applied migrations. Preserve existing IDs, raw fitment rows, legacy range qualifiers and stock references. Existing rows without enough grouping/evidence remain unresolved. Fixtures and UI examples must not be promoted to verified source assertions. Keep API compatibility through a documented adapter until consumers support grouped results.

## Acceptance examples

The airbag source example is observed; other combinations below are deliberately synthetic requirement fixtures, not additional Jaguar facts.

| Case | Required outcome |
|---|---|
| XK 3187/category 11096/item 1, application 93491 HNA9670BA through 023699; 151439 HJB9670AA from 023700 | Preserve separate occurrences and one-sided constraints. With a verified comparator and otherwise complete context, 023699 selects the former and 023700 the latter. Do not make a single impossible interval. |
| Same PART: context M1 through S100, context M2 from S200 | Return only those two context/bound combinations; never M1/from S200 or M2/through S100. |
| Same occurrence: (body B1 AND engine E1) OR (body B2 AND engine E2) | Match B1/E1 and B2/E2; reject B1/E2 and B2/E1 when scope is complete. |
| Include one configuration but exclude option X within that set | X defeats that set only; another verified alternative may still match. |
| Required engine absent from supplied vehicle context | `unavailable`, even if source browsing keeps the candidate visible. |
| One complete false alternative and one unknown alternative | `unavailable`; an unknown is not silently false. |
| No assertion rows, incomplete source scope or parser produced an empty set | `unavailable`; no universal fitment or blanket negative. |
| Positive and explicit negative match the same occurrence/context | `unavailable` with conflict evidence. |
| Duplicate import; later changed or removed assertion | No duplicate identities; atomic replacement; history retained; stale active claims removed only under verified reconciliation. |
| Two languages describe the same source application | One canonical PART and logically reconciled occurrence, with separate language evidence. |

Before implementing production transformation, the schema review must settle the physical relation design, source identity key, endpoint representation, approved initial comparator and attribute mappings. Importer validation must exercise the complete selected bundle (menu, top-level and application evidence), not only these isolated examples. Unknown patterns can remain quarantined while verified subsets progress.

This specification is sufficient to draft the controlled schema amendment. It does not certify production JEPC equivalence, authorize deployment or resolve hotspot conversion.
