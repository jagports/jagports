# VIEPS UI — Vehicle location at car contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #476  
**Implementation parent:** #368  
**Research dependencies:** #361, #362  

## Objective
Define the Concept View-1 vehicle/location contract. Location presentation is model-specific and must never fabricate a mapping.

## Contract
- Vehicle/location is scoped by selected model/range context.
- After part search, show a vehicle location only when a verified Jagports-owned part-to-zone/pin mapping exists.
- Before part search, vehicle zones may later serve as an alternative search entry point; this does not replace the MVP part-number entry point.
- Top/side vehicle views and highlighted zones are presentations of verified mappings, not inferred geometry.
- Missing mapping is explicit `unavailable`.
- Catalogue vehicle location and physical Jagports stock/storage location are separate concepts.

## UI/API contract
```text
VehicleLocationRequest
  canonical_part_id
  occurrence_context_id
  model_range_id

VehicleLocationResult
  state
  model_context
  view_assets[]
  zone/pin mapping when verified
  unavailable/error information
```

## Deterministic fixtures
Cover verified mapping, model-specific mapping, no mapping, and multiple view assets. Fixture data is not production evidence.

## Boundaries
#361 and #362 own the research/specification of range taxonomy and whole-car zones. This issue does not establish unsupported mappings or redefine stock location. Full asset extraction is outside this priority.

## Acceptance criteria
- [ ] Model-specific location context is defined.
- [ ] Verified part-to-zone mapping contract is defined.
- [ ] Top/side/location presentation semantics are defined.
- [ ] Missing mapping is explicit and distinct from missing part.
- [ ] Catalogue location is separated from stock/storage location.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Vehicle Location UI/API contract is defined for #368.
- [ ] No unverified mapping is introduced.
