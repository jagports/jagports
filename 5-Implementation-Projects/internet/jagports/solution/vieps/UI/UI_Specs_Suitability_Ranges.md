# VIEPS UI — Applicable Models / Suitability Model Ranges contract

**Status:** #875 proposed target layout; independent specification review required  
**Controlling UI issue:** #468  
**Enhancement:** #875  
**Priority issue:** #477  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective

Define the model/range browse and verified applicability presentation inside the right-hand **Applicable Models** panel of the proposed Concept-11v1 layout. The previous Concept-11 full centre/right Model Ranges row remains the deployed baseline until #875 is reviewed and implemented.

This file owns the range presentation contract. `UI_Specs_Fitment.md` owns detailed fitment/qualifier semantics; `SPEC/MODEL_PART_APPLICABILITY.md` and #354 own the underlying evidence and identities. Do not create a competing model/range taxonomy or applicability evaluator in UI code.

## Proposed panel and modes

The right column places independently scrollable **Applicable Models** below the independently scrollable **Search Results PART List**.

- **No PART selected:** show a model/range browse index and approved filter controls. Display choices do not imply that a model fits any PART.
- **One canonical PART selected, verified context available:** display only the model/range combinations supported as applicable by the approved occurrence/application/fitment evidence for that PART and the selected vehicle/context constraints. Preserve qualifiers, exclusions and provenance.
- **One canonical PART selected, several source occurrences:** do not combine different occurrence-specific evidence into an invented universal fitment. Ask for context when needed, or show distinct verified contexts with their evidence.
- **Insufficient or unresolved evidence:** display `unavailable`, not a positive fitment claim. A confirmed nonmatch is `no_match`; a service or processing failure is `error`.
- **Explicitly excluded ranges:** never present them as fitting choices. Preserve their exclusion evidence in the supported detail/diagnostic view when appropriate.

The browse index and the selected-PART applicable set are different UI states. A checked browse filter is not itself a verified fitment indicator.

## Deterministic model-range fixture index

Before JEPC import, the browse/index fixture has these **13 exact display labels**, in order:

1. Jaguar Accessories
2. Daimler Limousine
3. E-Pace
4. E-Type
5. F-Pace
6. F-Type
7. S-Type
8. X-Type
9. XE Range
10. XF Range
11. XJ Range
12. XJS
13. XK Range

These are fixture/browse vocabulary, **not** a claim that every displayed model is applicable to a selected PART. Reuse verified existing normalized range/model identities where they exist; otherwise keep fixture-only identifiers explicitly synthetic and isolated from production evidence. The `XK Range` browse label does not replace its separate approved model/variant relationships.

## Filter controls and coordinated state

**Approved #875 interaction:** select multiple normalized model/range identities with **ANY (OR)** semantics. A canonical PART qualifies when **at least one surviving verified source occurrence** is positively applicable to **at least one selected range**, while satisfying all other active supported constraints. Multiple chosen ranges widen this one dimension; they do not negate VIN, stock or normalized variation constraints. When no ranges are checked, the range filter imposes no constraint. Explicit exclusions and unresolved/unavailable evaluation are never positive matches.

**Phase split:** the current increment installs the right-hand Applicable Models layout, a 13-label browse fixture/index and verified selected-PART presentation where supported. Advanced multi-range filtering requires its approved read adapter and tests and is deferred. A visible filter that cannot yet work must be disabled with an accessible explanation; it must not silently pretend to apply the OR rule.

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
  browse_ranges[]?          # available fixture/source-backed index, not fitment
  applicable_ranges[]?      # verified selected-PART/context matches only
  selected_range_ids[]?     # future enabled filter; do not expose an effective filter before support
  qualifiers[]?
  exclusions[]?
  evidence/provenance?
  unavailable_reason?
```

The public read adapter must preserve #354/#666 distinctions between stored applicability assertions and evaluated vehicle fitment. This UI result contract is presentation-oriented and does not itself create or certify a new fitment evaluator.

## Deterministic fixtures and tests

Cover all 13 exact browse labels and stable identities; one PART applicable to only a subset of the browse index; several genuine occurrences of one canonical PART; one verified qualifier; one explicit exclusion; no match; unavailable/incomplete evidence; error; and coordination with Parts Tree, Search Results selection and centre normalized variations. Verify current visible **disabled** bookmark checkboxes cannot change selection or fitment. For the deferred model filter, test two selected ranges matching either range (OR), no selection (unconstrained), an excluded range, unavailable evidence and conjunction with other active supported filters. Fixtures are test inputs, not Jaguar source facts.

## Viewport and accessibility

The panel scrolls internally in the fitted #616 desktop shell, independently of the Search Results list and Parts Tree. Use accessible region headings, labelled filter controls, visible keyboard focus and non-colour-only applicability indications. On narrow layouts, regions may reflow while preserving state. UI locale (#554) and source catalogue language (#620) remain independently governed.

## Boundaries

VIN evaluation and VIN-range reconstruction are governed by #478 and approved source evidence; do not infer applicability from model-year names or `KOVuosi`. Stock, supersession and Jaguar Classic remain independent of fitment.

## Acceptance criteria

- [ ] The right-hand Applicable Models panel is independent of the scrollable Search Results panel in the #875 layout.
- [ ] All 13 exact fixture browse labels appear without any implied per-PART applicability.
- [ ] A selected PART/context shows only verified applicable ranges; explicit exclusions do not appear as suitable.
- [ ] Multi-occurrence results preserve separate context/evidence rather than inventing combined positive fitment.
- [ ] Browse filters and verified fitment indicators remain semantically distinct.
- [x] Product Owner approved multiple model-range selection with ANY/OR combination and no constraint when none is selected.
- [ ] Advanced ANY/OR filtering remains deferred until the approved occurrence-level read path and tests are implemented; unsupported controls are visibly disabled.
- [ ] `no_match`, `unavailable` and `error` remain distinct.
- [ ] Visible current-phase bookmark checkboxes are disabled; later saved bookmarks remain independent of range filtering, PART selection, availability and fitment.
- [ ] Deterministic fixture, accessibility, language and internal scrolling tests are specified.
- [ ] Independent #875 specification review is completed.
