# VIEPS UI — Fitment qualifiers and VIN applicability contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #478  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective
Define how the Concept-11 SVG merged by PR #645 exposes model-range fit, suitability filters/facts, qualifiers and VIN applicability using approved data.

## Merged Concept-11 presentation

```text
centre/right workspace
┌──────────────────────────────────────────────────────────────────┐
│ SUITABILITY MODEL RANGES                                         │
│ fit/check presentation across the full row                       │
├──────────────────────────────┬───────────────────────────────────┤
│ LOCATION AT CAR              │ SUITABILITY / FILTER              │
│                              │ filters or facts + optional (i)   │
└──────────────────────────────┴───────────────────────────────────┘
```

The correction from the earlier interpretation is structural: **Model Ranges is a full centre/right row above the middle workspace, while Suitability occupies the right side of the row beside Location at car.**

## Contract
Applicability is evaluated from approved PART occurrence/application/attribute relationships. Support model/range and VIN-range applicability when evidence exists. Preserve constraints, exclusions and provenance.

### Suitability Model Ranges
- Occupies its own centre/right row below Search/Availability.
- Concept-11 depicts filter/check-box semantics for model/range fit.
- The artwork includes example ranges and a checked XK Range; those are presentation examples, not a hard-coded range catalogue.
- In browse/filter mode, supported range controls may constrain candidate results.
- With one resolved PART/context, matching range presentation primarily communicates verified applicability facts.
- Runtime interaction must not exceed the capabilities of the approved read contract; a single-selection implementation must not pretend to support arbitrary multi-selection simply because the SVG depicts check boxes.
- Empty-search stock-driven range filtering is permitted only through an approved stock/catalogue browse contract.

### Suitability / Filter dual mode
The right-middle region has two modes over the same applicability contract:

1. **Browse / multiple-context mode:** expose supported selection/filter dimensions.
2. **Single selected PART/context:** expose verified applicability facts.

Concept-11 illustrates `Models`, `ModelYear`, `VINRanges`, `features` and other qualifiers. Its sample facts include XK, a VIN boundary, Coupe, Convertible, 4.0 Litre, supercharged, options, wheel size, market and steering. These are illustrative unless returned by approved data.

- Show verified qualifiers such as engine, supercharger, body, market, transmission/steering or other attributes when relevant.
- Unknown qualifier data remains explicit and is not treated as a positive match.
- VIN applicability comes from approved VIN ranges/evidence; generic model-year assumptions are not a substitute.
- Distinguish `applicable`, `not_applicable`, and `unavailable`.
- Preserve exclusions when filters are applied.

### Information document link
The `(i)` control may link to verified **Model Family & Year Introduction** documentation when a valid source/document relationship exists.

- The link is optional and evidence-driven.
- Do not invent a document or URL to reproduce the icon.
- The document is contextual reference and does not by itself prove PART applicability.

## UI/API contract
```text
FitmentRequest
  canonical_part_id?
  occurrence_context_id?
  vehicle_context?
  approved_browse_filters?

FitmentResult
  state
  applicable
  model_ranges[]
  vin_range[] when supported
  qualifiers[]
  exclusions[] when supported
  available_filter_dimensions[] when supported
  contextual_document? when verified
  provenance/unavailable information
```

## Deterministic fixtures
Cover range match, browse/filter mode, VIN range match/exclusion, engine/body qualifiers, multiple qualifiers, contextual-document present/absent and unavailable fitment data. Existing main-branch fixtures remain valid; presentation changes must not change their domain meaning.

## Viewport and language
Model Ranges and Suitability participate in the fitted #616 shell and scroll internally when needed. Labels/values must tolerate variable-length UI localization under #554 and independently selected catalogue-data language under #620.

## Boundaries
VIN decoding and VIN-range reconstruction are separate enabling work. Do not invent VIN ranges or use KOVuosi as a substitute for VIN/evidence-based applicability. This specification consumes #354 semantics and does not redefine them.

## Acceptance criteria
- [ ] Model Ranges is represented as the full centre/right row from merged Concept-11.
- [ ] Suitability / Filter is the right-middle region beside Location at car.
- [ ] Filter-vs-fact dual mode shares one applicability contract.
- [ ] Model/range and VIN-range applicability semantics are defined.
- [ ] Qualifiers/exclusions and unavailable states are preserved.
- [ ] Optional Model Family & Year Introduction link is evidence-driven.
- [ ] Concept sample values are not silently promoted into production facts.
- [ ] Viewport-fit and UI-vs-Parts language boundaries are preserved.
- [ ] VIN applicability does not depend on KOVuosi or unsupported inference.
