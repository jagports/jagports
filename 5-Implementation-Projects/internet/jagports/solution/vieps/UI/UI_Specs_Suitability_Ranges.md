# VIEPS UI — Applicable Models / Suitability Model Ranges contract

**Status:** #875 layout merged; source-derived Range browse refinement in #949; advanced OR filter deferred  
**Controlling UI issue:** #468  
**Enhancement:** #875  
**Priority issue:** #477  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective

Define the model/range browse and verified applicability presentation inside the right-hand **Applicable Models** panel of the merged #875 three-column layout. The production transition from the temporary browse test index to source-derived model/Range relations remains a separate implementation task.

This file owns the range presentation contract. `UI_Specs_Fitment.md` owns detailed fitment/qualifier semantics; `SPEC/MODEL_PART_APPLICABILITY.md` and #354 own the underlying evidence and identities. Do not create a competing model/range taxonomy or applicability evaluator in UI code.

## Proposed panel and modes

The right column places independently scrollable **Applicable Models** below the independently scrollable **Search Results PART List**.

- **No PART selected:** show only source-derived Ranges backed by persisted imported JEPC Model-to-Range relations and approved public browse evidence. If the import or relationships are not yet available, show a truthful empty/unavailable state. Existing temporary browse-test labels in deployed code are a compatibility fixture, not production authority; remove them when the source-backed read contract replaces them.
- **One canonical PART selected, verified context available:** display only the model/range combinations supported as applicable by the approved occurrence/application/fitment evidence for that PART and the selected vehicle/context constraints. Preserve qualifiers, exclusions and provenance.
- **One canonical PART selected, several source occurrences:** do not combine different occurrence-specific evidence into an invented universal fitment. Ask for context when needed, or show distinct verified contexts with their evidence.
- **Insufficient or unresolved evidence:** display `unavailable`, not a positive fitment claim. A confirmed nonmatch is `no_match`; a service or processing failure is `error`.
- **Explicitly excluded ranges:** never present them as fitting choices. Preserve their exclusion evidence in the supported detail/diagnostic view when appropriate.

The browse index and the selected-PART applicable set are different UI states. A checked browse filter is not itself a verified fitment indicator.

## Source-derived Range browse and test isolation

The former hard-coded 13-label browse index is **superseded as the target product contract**. An authorized Admin creates normalized Ranges and explicitly assigns each imported JEPC Model at most one Range, preserving the Model's original source-qualified identity and description under #884 / merged PR #885. The public browse adapter consumes these persisted relationships from #354/#355 plus approved occurrence evidence; it does not create Range memberships from display strings, market-name fixtures or Part descriptions.

JEPC source-menu examples such as `models_l_id_0.xml` records 3187 and 3183 are input evidence only until they are actually imported and explicitly mapped. An imported but unassigned Model remains visible by its original description in Admin; it is not invented as a member of any public Range. With no source-backed Ranges yet, the public panel reports unavailable/empty data rather than exposing a normative static list. Explicitly synthetic, source-qualified Model and Range records can test the same contract in isolated CI without ever claiming real Jaguar fitment.

**Migration boundary:** the currently deployed HTML/JS still contains a legacy 13-label browse-only fixture and tests. This documentation correction does not pretend those runtime files have been removed. Replace that fixture only together with the new importer-backed public read adapter and updated model/browser regressions; preserve current application functionality until then.

## Filter controls and coordinated state

**Approved #875 interaction:** select multiple normalized model/range identities with **ANY (OR)** semantics. A canonical PART qualifies when **at least one surviving verified source occurrence** is positively applicable to **at least one selected range**, while satisfying all other active supported constraints. Multiple chosen ranges widen this one dimension; they do not negate VIN, stock or normalized variation constraints. When no ranges are checked, the range filter imposes no constraint. Explicit exclusions and unresolved/unavailable evaluation are never positive matches.

**Phase split:** the merged #875 increment installed the right-hand Applicable Models layout and retained a temporary browse-only compatibility fixture. The next source-backed implementation must replace that fixture with imported JEPC Model–Range relations. Advanced multi-range filtering requires its approved read adapter and tests and is deferred. A visible filter that cannot yet work must be disabled with an accessible explanation; it must not silently pretend to apply the OR rule.

The centre-top Suitability / Variations filter consumes the normalized #641 categories and values. It must not be conflated with right-panel range selection, with bookmark checkboxes in Search Results, or with computed verified fitment indicators.

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

The public read adapter must preserve #354/#666 distinctions between stored applicability assertions and evaluated vehicle fitment. This UI result contract is presentation-oriented and does not itself create or certify a new fitment evaluator.

## Deterministic fixtures and tests

Cover explicitly created test Ranges, two distinct source-qualified JEPC Model examples with separate original descriptions and independently saved mappings, an unassigned Model kept visible by its original description, and empty/unavailable pre-import states. Include one PART applicable to only a verified subset, several source occurrences of one canonical PART, a verified qualifier, exclusion, no match, incomplete evidence, error, and coordination with Parts Tree, Search Results and centre normalized variations. Keep regression coverage for the deployed legacy browse-only fixture until its source-backed replacement is implemented. Verify disabled bookmarks remain independent. The deferred OR filter needs two selected Ranges, unconstrained empty selection, exclusions, unavailable evidence and other supported filters. Synthetic tests never become Jaguar source facts.

## Viewport and accessibility

The panel scrolls internally in the fitted #616 desktop shell, independently of the Search Results list and Parts Tree. Use accessible region headings, labelled filter controls, visible keyboard focus and non-colour-only applicability indications. On narrow layouts, regions may reflow while preserving state. UI locale (#554) and source catalogue language (#620) remain independently governed.

## Boundaries

VIN evaluation and VIN-range reconstruction are governed by #478 and approved source evidence; do not infer applicability from model-year names or `KOVuosi`. Stock, supersession and Jaguar Classic remain independent of fitment.

## Acceptance criteria

- [ ] The right-hand Applicable Models panel is independent of the scrollable Search Results panel in the #875 layout.
- [ ] Source-derived browse returns only explicitly linked imported Model/Range identities; before import or assignment, report empty/unavailable and never infer membership from fixture labels.
- [ ] A selected PART/context shows only verified applicable ranges; explicit exclusions do not appear as suitable.
- [ ] Multi-occurrence results preserve separate context/evidence rather than inventing combined positive fitment.
- [ ] Browse filters and verified fitment indicators remain semantically distinct.
- [x] Product Owner approved multiple model-range selection with ANY/OR combination and no constraint when none is selected.
- [ ] Advanced ANY/OR filtering remains deferred until the approved occurrence-level read path and tests are implemented; unsupported controls are visibly disabled.
- [ ] `no_match`, `unavailable` and `error` remain distinct.
- [ ] Visible current-phase bookmark checkboxes are disabled; later saved bookmarks remain independent of range filtering, PART selection, availability and fitment.
- [ ] Deterministic fixture, accessibility, language and internal scrolling tests are specified.
- [ ] Independent #875 specification review is completed.
