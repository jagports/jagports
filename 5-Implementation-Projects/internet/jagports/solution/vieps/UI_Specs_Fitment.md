# VIEPS UI — Fitment qualifiers and VIN applicability contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #478  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define how Concept View-1 exposes fitment qualifiers and VIN applicability where supported by approved data.

## Contract
Applicability is evaluated from approved PART occurrence/application/attribute relationships. Support model/range and VIN-range applicability when available. Preserve source constraints and exclusions.

Show verified qualifiers such as engine, supercharger, body, market, transmission or other attributes when they affect the result. Unknown qualifier data remains explicit and is not treated as a positive match.

VIN applicability is a result of approved VIN ranges/evidence; generic model-year assumptions are not a substitute. Distinguish `applicable`, `not_applicable`, and `unavailable`.

## UI/API contract
```text
FitmentRequest
  canonical_part_id
  occurrence_context_id
  vehicle_context?

FitmentResult
  state
  applicable
  vin_range[] when supported
  qualifiers[]
  exclusions[] when supported
  provenance/unavailable information
```

## Deterministic fixtures
Cover VIN range match, VIN range exclusion, engine/body qualifier, multiple qualifiers, and unavailable fitment data.

## Boundaries
VIN decoding and VIN-range reconstruction are separate enabling work. This specification must not invent VIN ranges or use KOVuosi as a substitute for VIN/evidence-based applicability. It consumes #354 semantics and does not redefine them.

## Acceptance criteria
- [ ] Model/range and VIN-range applicability semantics are defined.
- [ ] Qualifier presentation is defined.
- [ ] Exclusion semantics are preserved.
- [ ] Applicable/not-applicable/unavailable states are distinct.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Fitment UI/API contract is defined for #368.
- [ ] VIN applicability does not depend on KOVuosi or unsupported inference.
- [ ] Scope remains within #468/#354 semantics.
