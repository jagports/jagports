# VIEPS UI — Explicit unavailable-data handling

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #479  
**Implementation parent:** #368  

## Objective
Define explicit handling when secondary Concept-1 data is absent, while preserving the distinction between missing data, no match and processing failure.

## Contract
Missing diagram, hotspot, vehicle-location, tree, suitability or fitment data is represented as explicit `unavailable` where applicable.

`not_found` means the requested canonical PART cannot be resolved. It must not represent missing secondary context. Missing secondary data never becomes a negative fitment result.

No guessed diagram, geometry, location, hierarchy or applicability may be emitted. `error` is reserved for processing/API failure; `unavailable` is a valid domain state.

The component remains in its permanent Concept-1 position and communicates the unavailable state without collapsing the information architecture.

## State vocabulary
`empty`, `invalid`, `not_found`, `resolved`, `unavailable`, `error`.

Domain-specific unavailable details may identify the missing context, such as `diagram_unavailable` or `location_unavailable`, without changing the top-level state semantics.

## Deterministic fixtures
Cover a resolved part with missing diagram, hotspot, location, tree and suitability data, plus a processing/API error.

## Acceptance criteria
- [ ] Unavailable state semantics are defined.
- [ ] Not-found and unavailable are distinct.
- [ ] Missing secondary data cannot become a negative applicability result.
- [ ] No fabrication/fallback semantics are permitted.
- [ ] Error vs unavailable is defined.
- [ ] Permanent UI placement is defined.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable error/unavailable contract is usable by #368.
