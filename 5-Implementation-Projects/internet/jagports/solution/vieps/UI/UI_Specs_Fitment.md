# VIEPS UI — Fitment qualifiers and VIN applicability contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #478  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective

Define how VIEPS exposes verified fitment qualifiers and VIN applicability in the Concept-11 suitability regions.

The current placement authority is the **Concept-11 ASCII map in `UI_Specs.md`**.

## Concept-11 suitability model

Concept-11 separates suitability into two coordinated presentation regions:

```text
RIGHT COLUMN
SUITABILITY MODEL RANGES
[fit/check applicable ranges]
          │
          └──────────────┐
                         ▼
CENTRE WORKSPACE
SUITABILITY / FILTER
[Models] [Model year] [VIN ranges] [features] [...]

when one PART/context is selected:
verified applicability facts / qualifiers / exclusions
```

The right-side range controls and centre filters/facts are two views of the same approved applicability data. They must not create separate fitment logic.

## Contract

Applicability is evaluated from approved PART occurrence/application/attribute relationships. Support model/range and VIN-range applicability when available. Preserve source constraints and exclusions.

Show verified qualifiers such as engine, supercharger, body, market, transmission or other attributes when they affect the result. Unknown qualifier data remains explicit and is not treated as a positive match.

VIN applicability is a result of approved VIN ranges/evidence; generic model-year assumptions are not a substitute. Distinguish `applicable`, `not_applicable`, and `unavailable`.

## Range selection and fact/filter modes

- When a single resolved PART determines applicable ranges, the right-side range list primarily communicates verified fitment facts and may allow supported range selection to scope the centre/vehicle view.
- When multiple candidate results/contexts remain, approved filter dimensions may narrow the result set.
- Concept artwork listing model year, VIN range or feature filters does not authorize unsupported inference. A dimension is interactive only when the read contract can evaluate it.
- Unknown/unavailable attributes are never silently converted into positive matches.
- Exclusions must remain effective when filters are applied.

## Optional model/year information link

Concept-11 illustrates an information link from applicability context to model-family/year introductory material. Such a link may be shown only when a verified repository/source relationship exists. It is informational and does not itself prove applicability.

## UI/API contract

```text
FitmentRequest
  canonical_part_id
  occurrence_context_id
  vehicle_context?
  approved_filter_constraints?

FitmentResult
  state
  applicable
  applicable_ranges[]
  vin_range[] when supported
  qualifiers[]
  exclusions[] when supported
  available_filter_dimensions[] when supported
  provenance/unavailable information
```

## Deterministic fixtures

Cover VIN range match, VIN range exclusion, engine/body qualifier, multiple qualifiers, multiple applicable ranges, unavailable fitment data and a filter dimension that is unavailable.

## Viewport and i18n

Range names, qualifier labels and values must tolerate variable-length localized presentation. UI labels follow #554; JEPC catalogue-data language remains independently selectable under #620.

The right range region and centre suitability region participate in the fitted PR #616 desktop shell and use internal scrolling where content exceeds available height.

## Boundaries

VIN decoding and VIN-range reconstruction are separate enabling work. This specification must not invent VIN ranges or use KOVuosi as a substitute for VIN/evidence-based applicability. It consumes #354 semantics and does not redefine them.

## Acceptance criteria

- [ ] Model/range and VIN-range applicability semantics are defined.
- [ ] Concept-11 right-side range and centre suitability regions share one applicability contract.
- [ ] Qualifier presentation is defined.
- [ ] Exclusion semantics are preserved.
- [ ] Applicable/not-applicable/unavailable states are distinct.
- [ ] Unsupported concept filter dimensions remain unavailable rather than inferred.
- [ ] Deterministic fixture coverage is defined.
- [ ] Viewport-fit and i18n-safe presentation are preserved.
- [ ] Stable Fitment UI/API contract is defined for #368.
- [ ] VIN applicability does not depend on KOVuosi or unsupported inference.
