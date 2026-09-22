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

The panel's model/range checkboxes constrain candidates only when the approved read contract supports that filtering operation. Single- versus multi-selection and combination semantics remain an explicit #875 Product Owner decision; an illustration of checkboxes alone does not authorize unsupported multi-select behavior.

The centre-top Suitability / Variations filter consumes the normalized #641 categories and values. It must not be conflated with right-panel range selection, with bookmark checkboxes in Search Results, or with computed verified fitment indicators.

Search-result row selection and Parts Tree PART-leaf selection share **one canonical selected PART**. A result row representing several EPC occurrences does not guess the active occurrence; range applicability dependent on occurrence remains pending context selection. Availability/stock filters may constrain the candidate set only through approved stock-to-catalogue relationships, never by rewriting fitment facts.

## UI/API contract

```text
ApplicableModelsRequest
  canonical_part_id?         # absent means browse/index mode
  occurrence_context_id?
  vehicle_context?
  selected_range_ids[]?     # only where filter operation is approved
  approved_variation_filters?
  stock_constraint?         # only where stock/catalogue browse is supported

ApplicableModelsResult
  state                     # browse | applicable | no_match | unavailable | error
  browse_ranges[]?          # available fixture/source-backed index, not fitment
  applicable_ranges[]?      # verified selected-PART/context matches only
  selected_range_ids[]?     # only where read/filter contract supports it
  qualifiers[]?
  exclusions[]?
  evidence/provenance?
  unavailable_reason?
```

The public read adapter must preserve #354/#666 distinctions between stored applicability assertions and evaluated vehicle fitment. This UI result contract is presentation-oriented and does not itself create or certify a new fitment evaluator.

## Deterministic fixtures and tests

Cover all 13 exact browse labels and stable identities; one PART applicable to only a subset of the browse index; several genuine occurrences of one canonical PART; one verified qualifier; one explicit exclusion; no match; unavailable/incomplete evidence; error; and coordination with Parts Tree, Search Results selection and centre normalized variations. Verify bookmarks never change filter, selection or fitment state. Fixtures are test inputs, not Jaguar source facts.

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
- [ ] Model-filter checkbox combination semantics receive explicit approval before implementation.
- [ ] `no_match`, `unavailable` and `error` remain distinct.
- [ ] Search Results bookmarks do not mutate range filtering, PART selection, availability or fitment.
- [ ] Deterministic fixture, accessibility, language and internal scrolling tests are specified.
- [ ] Independent #875 specification review is completed.
