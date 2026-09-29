# VIEPS Ranges — Search and Admin Specification

## Objective

Define the model/range browse and verified fit presentation inside the right-hand **Applicable Models** panel of the three-column layout. Production Range options require verified source-derived Model/Range relations; synthetic browse data is TEST fixture data only.

This specification defines normalized Range browse/filter presentation and Range-to-imported-Model administration. Do not create a competing model/range taxonomy or FIT evaluator in UI code.

## Panel and modes

The right column places independently scrollable **Applicable Models** below the independently scrollable **Search Results PART List**.

- **No PART selected:** show source-derived Ranges represented by current evidenced browse/search candidates, backed by persisted JEPC Model-to-Range relations and verified public browse evidence. Initial empty-Find browse can include all supported browsable candidate ranges. Displaying a range is not selecting its filter. If evidence is unavailable, show a truthful empty/unavailable state; static browse labels are TEST fixture data only.
- **One canonical PART selected:** the panel becomes read-only. Preserve evidenced available context options where backed by current results; illuminate only the PART's verified applicable ranges, leave evidenced nonmatching options unlit and display a yellow unknown warning for unresolved applicability. Never render a confirmed exclusion as a positive fit; preserve qualifiers, exclusions and provenance.
- **One canonical PART selected, several source occurrences:** do not combine different occurrence-specific evidence into an invented universal fitment. Ask for context when needed, or show distinct verified contexts with their evidence.
- **Insufficient or unresolved evidence:** when a required source relation or the entire applicable read contract is absent, display `unavailable`, not a positive fitment claim. When an evidenced candidate/context is present but a required individual Range value remains unresolved, keep that otherwise eligible candidate separate from verified matches and mark the displayed unresolved value yellow (`unknown`). A confirmed nonmatch is `no_match`; a service or processing failure is `error`.
- **Explicitly excluded ranges:** never present them as fitting choices. Preserve their exclusion evidence in the supported detail/diagnostic view when appropriate.

The browse/filter options and selected-PART applicable facts are different UI states over the same panel. Displayed availability is not a filter selection, and an explicit range filter is not itself evidence that any selected PART fits it. See the shared interaction rules in [Part Search](SPEC_SEARCH.md#coordinated-searchfilter-interaction).

## Source-derived Range browse and test isolation

Public Range browse is source-derived; hard-coded label lists are not normative. An authorized Admin creates normalized Ranges and explicitly assigns each imported JEPC Model at most one Range, preserving the Model's original source-qualified identity and description through the normalized Range mapping contract. The public browse adapter consumes these persisted relations and verified occurrence evidence; it does not create Range memberships from display strings, market-name fixtures or Part descriptions.

JEPC source-menu examples such as `models_l_id_0.xml` records 3187 and 3183 are input evidence only until they are actually imported and explicitly mapped. An imported but unassigned Model remains visible by its original description in Admin; it is not invented as a member of any public Range. With no source-backed Ranges yet, the public panel reports unavailable/empty data rather than exposing a normative static list. Explicitly synthetic, source-qualified Model and Range records can test the same contract in isolated CI without ever claiming real Jaguar fitment.

**Fixture boundary:** static browse-only labels are TEST fixture data only. Production reads use the source-backed public adapter; fixture data must not leak into normal mode.

## Filter controls and coordinated state

**Single-Range interaction:** select **at most one** normalized model/range identity at a time. Competing ranges are hidden while selected, then restored from the current evidenced search context when cleared. Combine the active range with Find, VIN, Stock, branch and FIT group constraints. New Find submissions preserve the selected range. Only verified positive occurrences qualify as verified matches; otherwise eligible unknown-applicability PARTs appear under separate unresolved candidates with warnings, not as verified fits. Explicitly incompatible PARTs are excluded.

**Source-backed behavior:** Only explicit imported JEPC Model-to-Range evidence supplies production Range options and read-only selected-PART facts. Single-Range filtering requires an defined occurrence-level read contract; otherwise disable the control with an accessible explanation.

The centre-top Fit / Variations filter consumes normalized FIT categories and values. It must not be conflated with right-panel range selection, with bookmark checkboxes in Search Results, or with computed verified fitment indicators.

Search-result row selection and Parts Tree PART-leaf selection share **one canonical selected PART**. A result row representing several EPC occurrences does not guess the active occurrence; range and VIN fit dependent on occurrence remain pending explicit context selection under [VIN](SPEC_SEARCH_VIN.md). Availability/stock filters may constrain the candidate set only through defined stock-to-catalogue relationships, never by rewriting fitment facts.

## UI/API contract

```text
ApplicableModelsRequest
  canonical_part_id?         # absent means browse/index mode
  occurrence_context_id?
  vehicle_context?
  selected_range_id?         # zero or one normalized ID; absent = unconstrained
  approved_variation_filters?
  stock_constraint?         # only where stock/catalogue browse is supported

ApplicableModelsResult
  state                     # browse | applicable | no_match | unavailable | error
  browse_ranges[]?          # source-derived explicit Model–Range index; test fixtures isolated
  applicable_ranges[]?      # verified selected-PART/context matches only
  selected_range_id?         # do not expose an effective filter when filtering is unsupported
  qualifiers[]?
  exclusions[]?
  evidence/provenance?
  unavailable_reason?
```

The public read adapter must preserve the PART/FIT evidence distinctions between stored fit assertions and evaluated vehicle fitment. This UI result contract is presentation-oriented and does not itself create or certify a new fitment evaluator.

## Deterministic fixture contract

Synthetic identities and mappings remain separate from production Model-to-Range evidence. A synthetic context can demonstrate one active Range, positive, excluded and unresolved evidence, and conjunction with other independent filters; multiple-Range OR filtering is not supported.

## Viewport and accessibility

The panel scrolls internally in the fitted desktop shell, independently of the Search Results list and Parts Tree. Use accessible region headings, labelled filter controls, visible keyboard focus and non-colour-only fit indications. On narrow layouts, regions may reflow while preserving state. UI locale (the UI-language contract) and source catalogue language (the Parts-language contract) remain independently governed.

## Boundaries

VIN evaluation and VIN-range reconstruction are governed by the VIN evidence contract and verified source evidence; do not infer fit from model-year names or `KOVuosi`. Stock, supersession and Jaguar Classic remain independent of fitment.


## Range administration

### Objective and boundary

The one-page VIEPS Admin UI includes **Ranges & JEPC Models**. An authorized administrator can create normalized Jagports Ranges and explicitly assign imported JEPC Models to one Range each. Range administration concerns vehicle/catalogue reference data. It does not redefine STOCK, normalized fit dimensions, JEPC navigation categories, or the original imported JEPC Model identity.

The **original imported JEPC Model description remains the visible Model name whether the Model is assigned or unassigned**. `Unassigned` is a mapping status or optional filter, never a substitute Model name and never a reason to hide the row. The UI must not turn missing Range mapping into a claim that the imported Model does not exist.

### Required semantics

| Concept | Definition |
|---|---|
| Normalized Range | One Jagports `model_range` with stable unique `range_code`, display name, identifier, status and provenance. |
| Imported JEPC Model | Source-qualified Model identity preserved by the importer, with original description(s), source namespace/dataset, source Model ID, import/version context, source language and available hierarchy/market evidence. |
| Explicit assignment | Explicit mapping between one source-qualified imported Model and one normalized Range, including operator, verification and change provenance. |
| Unassigned Model | Existing imported Model with no confirmed Range mapping; its original JEPC description and source identifier remain displayed and searchable. |
| Model/market name | A distinct notion from a Range and from an imported JEPC source Model ID. An imported label is not automatically a normalized name or proof of vehicle-specific identity. |

- One Range may contain **zero to many** imported JEPC Models.
- Each distinct imported JEPC Model identity may have **zero or one** confirmed Range assignment during curation. **Once assigned, exactly one Range applies**. Assigning a second Range requires an explicit reassignment that replaces the old relationship, not a second active link.
- Keep stable source-qualified identity. Models with the same displayed description but different JEPC source IDs, namespaces, market/source contexts or dataset identities must not be silently merged. A repeated version/context row for the **same** source Model should not produce contradictory active Range assignments.
- Do not infer Range assignments from equal or similar names, model year, VIN, engine, body, market, parent navigation label or fixture values.
- Map the imported **Model** to its Range; this action alone does not assert part fit, VIN fit, variant identification or verified fitment.
- Preserve the source Model description and original JEPC source records during creation, reassignment, unassignment, retirement and reimport. A Range name change must not rewrite original source labels or stable identifiers.
- The confirmed Range assignment is the source of the `catalogue_range` routing value published for that catalogue into the Search Index in the `jagports` D1 database. Assignment, reassignment, unassignment, retirement or accepted reimport must update or rebuild affected Search Index entries so stale Range routing is not exposed.

### One-page Admin layout

Add a section **Ranges & JEPC Models** on the Admin page, separate from **Existing STOCK / Add / Edit / Delete** and from **Fit Categories / Descriptions**. No separate dashboard, menu, page or new authentication experience is required.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ PARTS / STOCK MANAGEMENT — existing stock administration unchanged      │
├──────────────────────────────────────────────────────────────────────────┤
│ RANGES & JEPC MODELS                                                     │
│                                                                         │
│ RANGES                                                                  │
│ Range code [ XK_RANGE ]   Name [ XK Range          ] [Create Range]       │
│ Existing: XK Range [Edit name] [Retire when safe]                        │
│                                                                         │
│ IMPORTED JEPC MODELS                                                    │
│ Search original JEPC Model description / source ID [                ]   │
│ Filter: [All] [Unassigned] [Assigned] [Conflict]          │
│                                                                         │
│ Original JEPC Model description | Source ID / version | Assigned Range  │
│ <original imported description> | <source identity> | Unassigned       │
│ <original imported description> | <source identity> | XK Range         │
│                                                                         │
│ Selected source Model: <original imported JEPC description>             │
│ Source: <namespace / Model ID / dataset / version / language>           │
│ Range: [Choose one existing Range ▼]  [Assign / Reassign] [Unassign]    │
│ Mapping / provenance / conflict / persisted result             │
├──────────────────────────────────────────────────────────────────────────┤
│ FIT CATEGORIES — separate section when available           │
└──────────────────────────────────────────────────────────────────────────┘
```

The illustrative `XK_RANGE` / `XK Range` creation values above represent an administrator-entered example, not seeded Range or Model fixtures. The example row text in angle brackets denotes data read from the imported source, **not** a synthetic replacement title. If source Model description data is genuinely unavailable, show its stable source identifier and an explicit **description unavailable** notice; do not substitute `Unassigned` as the title.

#### Range management

- Display existing Ranges and permit an authorized administrator to create a Range using a unique nonempty stable code and nonempty display name.
- Permit editing a Range's display name without changing its stable code or linked Model identities. A code change is not a routine rename; it needs separately defined migration handling.
- A Range with linked imported Models cannot be destructively deleted or retired in a way that silently unassigns them. Require explicit reassignment/unassignment or block the operation with an informative count and error.
- Prevent duplicate code creation and unintended duplicate records. Validate empty/invalid input server-side and show a deterministic persisted result.
- Show active/retired state for retired state; do not offer retired Ranges as targets for new assignments.

#### Imported Model listing and mapping

- Search and list **all imported Models**, including unassigned ones. Display the **original JEPC Model description** prominently, and available source namespace/dataset, Model ID, version, source-language and parent/market scope alongside it.
- Provide explicit **All**, **Unassigned**, **Assigned** and **Conflict** filters. Filters change only visibility; they do not change or delete records. Empty import, empty search result and failed import are different states.
- Source Model rows remain present after assignment, reassignment, unassignment and refresh. Neither an unassigned state nor a missing normalized Range may blank or replace a source description.
- Select a source Model, choose **one** existing active Range and explicitly save the mapping. When a Model is already mapped, changing the Range is **Reassign** and requires clear confirmation of the old and new Range.
- **Unassign** deliberately removes the curated Range relationship, with confirmation. The Model returns to the Unassigned filter under exactly the same imported description and source identity.
- Display mapping status, last editor/action, source/provenance, verification state and any mapping conflict requiring resolution. Equal visible descriptions are never sufficient keys for mapping.
- Reimport of the same source-qualified Model preserves its curated mapping when identity is unchanged. If source identities, contextual grouping or evidence change incompatibly, flag a mapping conflict for resolution rather than silently assigning a Range or rewriting the imported record.
- EN/FI Admin controls, headings and validation use the established UI i18n resources. Source descriptions retain their independently imported JEPC language; switching the Admin UI locale must not rewrite them.

### Data and API contract

Use the canonical `model_range` identity. The persistence model also has `applicability_model_context` with source-qualified `(source_namespace, source_model_id, context_version)` and a nullable `model_range_id`. These relations form the persistence bridge and do not authorize an independent global JEPC Model taxonomy. Source-Model identity, original-description persistence, import reconciliation and mapping-version evidence must remain source-qualified.

Minimum normalized Admin read shape:

```text
RangeAdminRange
  id
  range_code                    stable / unique
  name
  active_or_retired_state
  source / verification

RangeAdminImportedModel
  source_namespace / dataset
  source_model_id
  source_context_version
  source_description_original
  source_description_language
  source_parent / region / market when available
  model_range_id                null until explicitly mapped
  assignment_status            unassigned | assigned | conflict
  mapping_verification / provenance
```

The original description is **source data**, not a derived `model_range.name`. Source Model identifiers, model contexts and normalized market/model display names may need distinct representations. The importer supplies actual source identities and descriptions; synthetic synthetic fixtures must carry a clear `fixture` origin.

Catalogue Admin operations: list/create/edit/retire Range; search imported Models including unmapped; create/change/remove an explicit Model→Range mapping; read back the mapping and audit/conflict state. Exact endpoint names and database additions are implementation details. All mutations must be protected **server-side** by the Admin authorization boundary and must **not** reuse STOCK `/api/stock`. Return deterministic validation, unauthorized, not-found, duplicate-code and conflicting-assignment errors. Read-back must reflect persisted state; no client-only fake success.

Consumer boundaries: an unassigned source Model can still appear under its original JEPC description in source-Model views. It must **not** appear as a verified member of an invented Range. Public Range-filtered browsing and FIT remain governed by the Range and FIT search specifications plus verified occurrence evidence; this Admin mapping alone does not establish part fitment.

### JEPC-derived Ranges and source-qualified test cases

There is **no fixed, authoritative or required XK Range/model-name fixture**. Normalized Ranges are created by authorized administrators and linked explicitly to imported JEPC Models using the one-Range-maximum relationship. Their existence, names and memberships must not be inferred from a list of market-name labels.

Actual JEPC source menu records are present at `5-Implementation-Projects/software/jlr/JEPC/JEPCFiles/menus/models_l_id_0.xml`. For example, the menu includes source-menu ID `3187`, parent `3175`, with original description `XK8 Coupe/Convertible up to (V) 042775`, and ID `3183`, parent `3175`, with original description `XK8 Coupe/Convertible - Canada/USA up to (V) 042775`. These are **source-menu records**, not proof that they have been imported into a production Model table or assigned to a Range. Persisted source-qualified identities and descriptions are established by the importer; the Admin then explicitly maps each imported Model to at most one Range. When imported source data is unavailable, the actual imported-Model list is empty/unavailable, not populated with invented imported IDs.

Isolated, explicitly synthetic source-shaped records remain permissible for deterministic Admin/API tests; they never seed a normative Range taxonomy or become production Jaguar or JEPC facts. An illustrative, operator-created `XK_RANGE` Range may be used in a test only as a deliberate create-and-read-back operation, not a migration seed. The rarely used `XKR 100` individual-vehicle classification cannot be inferred from a generic XKR source label, ordinary VIN logic or Range membership; explicit Jaguar/factory or vehicle-specific evidence remains required.

### Conformance tests

1. Create and read back `XK Range`; reject a duplicate `range_code`, invalid code or empty display name.
2. List and search imported Models **with no Range assignment**: every Model keeps its original imported description, source ID and language, with only its mapping status reading Unassigned.
3. Assign two distinct source Model IDs to one Range. The same visible source text under two distinct source IDs remains two rows and may be assigned independently.
4. Reject an attempt to give one Model two active Ranges. Require explicit reassignment; read-back shows one new Range, unchanged source Model description and retained mapping-version evidence.
5. Unassign a Model: it reappears in the Unassigned filter with the **same original JEPC description**, and the retired mapping remains auditable.
6. Retire a Range only if defined relationship constraints prevents dangling active assignments. A failed action leaves all records unchanged.
7. Reimport an unchanged source Model without duplicating or erasing its mapping; changed/ambiguous source identity produces an explicit mapping conflict.
8. Imported-data-unavailable and description-missing states never invent Model names, model IDs, Range memberships or fit evidence.
9. Unauthorized mutations are rejected server-side; Admin EN/FI locale switching changes controls but not imported source descriptions.
10. Exercise two distinct source-menu records with original descriptions (including IDs 3187 and 3183 only after the importer establishes their source-qualified Model identities), confirm no automatic Range mapping or invented import, and verify generic XKR or VIN evidence cannot assert individual XKR 100 identification.
