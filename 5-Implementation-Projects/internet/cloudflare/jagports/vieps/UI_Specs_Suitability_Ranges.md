# VIEPS UI — Suitability Model Ranges filtering contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #477  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define how Concept View-1 presents model/range suitability for the searched part.

## Contract
Suitability is driven by approved PART occurrence/application/fitment data. The presented set contains applicable model/range results; non-matching vehicles are not merely shown as unchecked rows.

Selected model/range context scopes dependent vehicle/location and suitability presentation. Verified additional qualifiers remain visible when they affect applicability. Applicability is never inferred from model naming alone.

Distinguish `applicable`, `no_match`, `unavailable`, and processing `error`.

## UI/API contract
```text
SuitabilityRangeRequest
  canonical_part_id
  occurrence_context_id

SuitabilityRangeResult
  state
  applicable_ranges[]
  selected_range_id
  qualifiers[]
  unavailable/error information
```

## Deterministic fixtures
Cover multiple applicable ranges, one range with a qualifier, no applicable range, and unavailable application data.

## Boundaries
Full VIN evaluation is specified by #478. This issue consumes #354 fitment semantics and does not redefine them. Stock and supersession/Classic are separate concerns.

## Acceptance criteria
- [ ] Applicable-range filtering semantics are defined.
- [ ] Non-matching ranges are excluded from the applicable presented set.
- [ ] Range selection/scoping behavior is defined.
- [ ] Qualifier visibility is defined.
- [ ] No-match and unavailable states are distinct.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Suitability Range UI/API contract is defined for #368.
- [ ] No new domain-model semantics are invented.
