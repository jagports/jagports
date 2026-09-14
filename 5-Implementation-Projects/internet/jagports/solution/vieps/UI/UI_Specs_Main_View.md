# VIEPS UI — Main part and diagram view synchronization contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #475  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define the Concept-11 Main View contract for vehicle location plus the lower PART / Image / Status region while preserving selected PART, EPC occurrence/context and item synchronization.

## Concept-11 geometry
The approved Concept-11 SVG defines two distinct Main View concerns:

1. **Location at car** — one centre vehicle-location canvas.
2. **PART / Image / Status** — one lower region grouping part identity/status and the selected image/diagram.

The older Concept View-1 permanent split into separate `Top view` and `Side view` boxes is not the Concept-11 layout. A verified top/side/schematic representation may still be rendered inside the single location canvas when the approved source/mapping contract supplies it.

## Contract
The Main View receives the canonical PART, selected EPC occurrence/context and selected item identity. It does not create a new part identity.

### Location at car
- Use one stable vehicle-location canvas.
- Show a verified vehicle/location representation and highlighted zone/pin only when supplied by the approved mapping contract.
- Missing vehicle/location data is an explicit unavailable state.
- Do not fabricate a top/side split or location mapping merely because the concept reserves visual space.

### PART / Image / Status
Concept-11 groups the following in the lower region where supported by approved data:

- warning/status;
- canonical PART number/identity;
- selected item/callout;
- Jaguar Classic indication;
- supersession relationship;
- verified part name/details;
- one selected part image or exploded diagram.

When available, show the associated exploded diagram and verified drawing/diagram identification. Numbered item callouts/hotspots are shown only when geometry is available.

Tree selection and diagram-item selection update the same shared occurrence/item selection state. Selection never mutates canonical PART identity.

Missing diagram or hotspot data is an explicit `unavailable` state. No geometry or diagram relationship may be fabricated.

Deterministic fixture geometry is permitted initially and must use the same contract as future verified #352 hotspot conversion output.

## MVP Part Image behaviour
For the minimum demonstrable flow, the Main View must be capable of showing the image associated with the resolved PART when verified image data exists.

- Show the resolved PART image or an explicit unavailable state.
- Keep the image associated with the selected canonical PART and occurrence/context.
- Do not substitute an unrelated image merely because one is available.
- Preserve the lower PART / Image / Status region as the stable visual container so verified diagram/hotspot rendering can be integrated without changing the information architecture.
- Verified diagram/hotspot rendering and vehicle-location mapping are not prerequisites for demonstrating the Part Image step when suitable image data exists.

## UI/API contract
```text
MainViewRequest
  canonical_part_id
  occurrence_context_id
  selected_item_id
  selected_vehicle_context?

MainViewResult
  state
  part_context
  status/warnings when supported
  classic/supersession when supported
  vehicle_location when supported
  part_image when available
  diagram
  items[] / hotspots[]
  selected_item_id
  unavailable/error information
```

## State and synchronization
- `resolved` means the selected part/context is available for presentation.
- `unavailable` means the requested secondary visual/context data is absent.
- `error` means processing/API failure.
- Tree and diagram selection refer to the same item/occurrence identity.
- If geometry is absent, item identity may still be presented without a hotspot.
- Missing Part Image data is an unavailable visual state; it does not change PART identity or applicability.
- Missing vehicle location is independent from fitment and image availability.

## Deterministic fixtures
Cover vehicle-location available/unavailable, Part Image available/unavailable, diagram available/unavailable, diagram with numbered items, hotspot unavailable, supported status/Classic/supersession examples, and synchronized tree/diagram selection.

## Concept-11 integration
The single Location-at-car canvas sits above Suitability. The lower PART / Image / Status region sits below Suitability and is not accompanied by the right-side Model Ranges panel on desktop.

## Dependencies and boundaries
Follows #472 Part Search and #474 Parts Tree. #352 owns hotspot coordinate conversion. Vehicle-location mapping remains governed by its dedicated data/spec work. Suitability/fitment, supersession/Classic, stock and import remain separate semantic contracts. This specification consumes #354 semantics and does not redefine the domain model.

## Acceptance criteria
- [ ] Single Concept-11 vehicle-location canvas is defined.
- [ ] Permanent Top/Side sub-panel layout is explicitly superseded.
- [ ] PART / Image / Status grouping is defined.
- [ ] Part Image available/unavailable behaviour is defined.
- [ ] Diagram identity and availability semantics are defined.
- [ ] Item/hotspot availability and selection semantics are defined.
- [ ] Tree and diagram selection synchronization is defined.
- [ ] Warning/status, Classic and supersession remain evidence-backed semantic concerns.
- [ ] Missing diagram/hotspot/location states are explicit.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Main View UI/API contract is defined for #368.
- [ ] Scope remains within #468 and #354 semantics.
