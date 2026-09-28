# VIEPS UI — Applicable Models / Suitability Model Ranges contract

## Objective

Define model/range browse and verified FIT presentation inside the right-hand **Applicable Models** panel of the three-column layout. Production Range options require source-derived Model→Range relations; the temporary browse index is TEST compatibility only.

This file owns the range presentation contract. `UI_Specs_Fitment.md` owns detailed fitment/qualifier semantics; `SPEC/MODEL_PART.md` owns the underlying evidence and identities. Do not create a competing model/range taxonomy or applicability evaluator in UI code.

## Proposed panel and modes

The right column places independently scrollable **Applicable Models** below the independently scrollable **Search Results PART List**.

- **No PART selected:** show only source-derived Ranges backed by persisted imported JEPC Model-to-Range relations and approved public browse evidence. If the import or relationships are not yet available, show a truthful empty/unavailable state. Existing temporary browse-test labels in deployed code are a compatibility fixture, not production authority; remove them when the source-backed read contract replaces them.
- **One canonical PART selected, verified context available:** display only the model/range combinations supported as applicable by the approved occurrence/application/fitment evidence for that PART and the selected vehicle/context constraints. Preserve qualifiers, exclusions and provenance.
- **One canonical PART selected, several source occurrences:** do not combine different occurrence-specific evidence into an invented universal fitment. Ask for context when needed, or show distinct verified contexts with their evidence.
- **Insufficient or unresolved evidence:** display `unavailable`, not a positive fitment claim. A confirmed nonmatch is `no_match`; a service or processing failure is `error`.
- **Explicitly excluded ranges:** never present them as fitting choices. Preserve their exclusion evidence in the supported detail/diagnostic view when appropriate.

The browse index and the selected-PART applicable set are different UI states. A checked browse filter is not itself a verified fitment indicator.

## Source-derived Range browse and test isolation

The former hard-coded 13-label browse index is **superseded as the target product contract**. An authorized Admin creates normalized Ranges and explicitly assigns each imported JEPC Model at most one Range, preserving the Model's original source-qualified identity and description through the normalized Range mapping contract. The public browse adapter consumes these persisted relationships from persisted catalogue relations plus approved occurrence evidence; it does not create Range memberships from display strings, market-name fixtures or Part descriptions.

JEPC source-menu examples such as `models_l_id_0.xml` records 3187 and 3183 are input evidence only until they are actually imported and explicitly mapped. An imported but unassigned Model remains visible by its original description in Admin; it is not invented as a member of any public Range. With no source-backed Ranges yet, the public panel reports unavailable/empty data rather than exposing a normative static list. Explicitly synthetic, source-qualified Model and Range records can test the same contract in isolated CI without ever claiming real Jaguar fitment.

**Migration boundary:** the currently deployed HTML/JS still contains a legacy 13-label browse-only fixture and tests. This documentation correction does not pretend those runtime files have been removed. Replace that fixture only together with the new importer-backed public read adapter and updated model/browser regressions; preserve current application functionality until then.

## Filter controls and coordinated state

**Range filter:** at most one normalized Range identity is active at a time. Selecting one Range hides competing Range values until the active value is cleared. The active Range combines with Find, VIN, Stock, Parts Tree and FIT constraints. Only verified positive occurrence evidence qualifies as a verified match; unresolved evidence remains explicitly unresolved, and confirmed exclusions are not positive matches.

**Compatibility boundary:** the legacy browse-only fixture is TEST compatibility data only. Production reads use imported source-backed Model→Range relations. Unsupported filtering remains disabled rather than simulating a result.

The centre-top FIT / Variations filter consumes normalized source-backed categories and values. It must not be conflated with right-panel range selection, with bookmark checkboxes in Search Results, or with computed verified fitment indicators.

Search-result row selection and Parts Tree PART-leaf selection share **one canonical selected PART**. A result row representing several EPC occurrences does not guess the active occurrence; range applicability dependent on occurrence remains pending context selection. Availability/stock filters may constrain the candidate set only through approved stock-to-catalogue relationships, never by rewriting fitment facts.

## UI/API contract

```text
ApplicableModelsRequest
  canonical_part_id?         # absent means browse/index mode
  occurrence_context_id?
  vehicle_context?
  selected_range_ids[]?     # future enabled filter: several normalized IDs; ANY/OR; [] = unconstrained
  approved_variation_filters?
  stock_constraint?         # only where stock/catalogue browse is supported

ApplicableModelsResult
  state                     # browse | applicable | no_match | unavailable | error
  browse_ranges[]?          # source-derived explicit Model–Range index; test fixtures isolated
  applicable_ranges[]?      # verified selected-PART/context matches only
  selected_range_ids[]?     # future enabled filter; do not expose an effective filter before support
  qualifiers[]?
  exclusions[]?
  evidence/provenance?
  unavailable_reason?
```

The public read adapter must preserve the PART/FIT evidence distinction between stored applicability assertions and evaluated vehicle fitment. This UI result contract is presentation-oriented and does not itself create or certify a new fitment evaluator.

## Deterministic fixtures and tests

Cover explicitly created test Ranges, two distinct source-qualified JEPC Model examples with separate original descriptions and independently saved mappings, an unassigned Model kept visible by its original description, and empty/unavailable pre-import states. Include one PART applicable to only a verified subset, several source occurrences of one canonical PART, a verified qualifier, exclusion, no match, incomplete evidence, error, and coordination with Parts Tree, Search Results and centre normalized variations. Keep TEST-fixture coverage isolated from normal-mode source-backed reads. Verify disabled bookmarks remain independent. Range-filter tests cover one active Range, unconstrained empty selection, exclusions, unavailable evidence and conjunction with other supported filters. Synthetic tests never become Jaguar source facts.

## Viewport and accessibility

The panel scrolls internally in the fitted desktop shell, independently of the Search Results list and Parts Tree. Use accessible region headings, labelled filter controls, visible keyboard focus and non-colour-only applicability indications. On narrow layouts, regions may reflow while preserving state. UI locale and source catalogue language remain independently governed.

## Boundaries

VIN evaluation and VIN-range reconstruction require approved source evidence; do not infer applicability from model-year names or `KOVuosi`. Stock, supersession and Jaguar Classic remain independent of fitment.

