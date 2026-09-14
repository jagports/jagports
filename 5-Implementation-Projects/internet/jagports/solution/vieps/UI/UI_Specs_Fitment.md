# VIEPS UI — Fitment qualifiers and VIN applicability contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #478  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define how Concept-11 exposes model-range fit, suitability filters/facts, qualifiers and VIN applicability where supported by approved data.

## Concept-11 presentation
Concept-11 separates applicability presentation into two coordinated regions:

1. **Suitability Model Ranges** at the upper right — range fit/check context.
2. **Suitability / Filter** in the centre — filter selections while browsing/multiple contexts remain, or factual applicability when one PART/context is selected.

The right Model Ranges region ends at the Suitability boundary on desktop. It does not continue beside the lower PART / Image / Status region.

## Contract
Applicability is evaluated from approved PART occurrence/application/attribute relationships. Support model/range and VIN-range applicability when available. Preserve source constraints and exclusions.

### Model Ranges
- Show verified applicable ranges for a selected PART/context.
- Concept-11 depicts check/filter controls. Their exact interaction depends on mode and the approved read contract.
- In browse/filter mode, supported range controls may constrain results.
- With one resolved PART/context, checked/matching range presentation is primarily an applicability fact, not permission to invent a new fitment rule.
- Empty-search stock-driven range filtering is only allowed through an approved stock/catalogue browsing contract.

### Suitability / Filter dual mode
**Browse or multiple-context mode:** expose approved selection/filter dimensions.

**Single selected PART/context:** expose verified applicability facts.

Concept-11 illustrates dimensions such as:

- Models;
- ModelYear;
- VINRanges;
- body/features/options and other verified qualifiers.

Show verified qualifiers such as engine, supercharger, body, market, transmission or other attributes when they affect the result. Unknown qualifier data remains explicit and is not treated as a positive match.

VIN applicability is a result of approved VIN ranges/evidence; generic model-year assumptions are not a substitute. Distinguish `applicable`, `not_applicable`, and `unavailable`.

### Information document link
The `(i)` control shown in Concept-11 may link to verified **Model Family & Year Introduction** documentation when a valid source/document relationship exists.

- The link is optional and evidence-driven.
- Do not invent a document or URL merely to reproduce the concept icon.
- The document provides contextual reference; it is not by itself proof of PART applicability.

## UI/API contract
```text
FitmentRequest
  canonical_part_id?
  occurrence_context_id?
  vehicle_context?
  browse_filters?

FitmentResult
  state
  applicable
  model_ranges[]
  vin_range[] when supported
  qualifiers[]
  exclusions[] when supported
  contextual_document? when verified
  provenance/unavailable information
```

## Deterministic fixtures
Cover range match, range browsing/filter mode, VIN range match, VIN range exclusion, engine/body qualifier, multiple qualifiers, contextual document present/absent, and unavailable fitment data.

## Boundaries
VIN decoding and VIN-range reconstruction are separate enabling work. This specification must not invent VIN ranges or use KOVuosi as a substitute for VIN/evidence-based applicability. It consumes #354 semantics and does not redefine them.

## Acceptance criteria
- [ ] Upper-right Model Ranges geometry and role are defined.
- [ ] Centre Suitability dual filter/fact modes are defined.
- [ ] Model/range and VIN-range applicability semantics are defined.
- [ ] Qualifier presentation is defined.
- [ ] Exclusion semantics are preserved.
- [ ] Applicable/not-applicable/unavailable states are distinct.
- [ ] Optional Model Family & Year Introduction document link is evidence-driven.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Fitment UI/API contract is defined for #368.
- [ ] VIN applicability does not depend on KOVuosi or unsupported inference.
- [ ] Scope remains within #468/#354 semantics.
