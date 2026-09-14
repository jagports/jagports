# VIEPS UI — Main part and diagram view synchronization contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #475  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective

Define the selected PART, EPC occurrence/context, vehicle-location, status and image/diagram presentation contract used by the Concept-11 Main View.

The current placement authority is the **Concept-11 ASCII map in `UI_Specs.md`**, derived from `VIEPS UI-Concept-11.svg` reviewed in PR #645.

## Concept-11 regions

Concept-11 separates the Main View into coordinated centre-workspace regions:

```text
SEARCH / AVAILABILITY
        ↓
LOCATION AT CAR
        ↓
SUITABILITY / FILTER OR FACTS
        ↓
PART / IMAGE / STATUS
```

The regions share the same canonical PART and occurrence/context state. They are not independent identities or data models.

## Contract

The Main View receives the canonical PART, selected EPC occurrence/context and selected item identity. It does not create a new part identity.

When available, it shows the associated part image or exploded diagram and verified drawing/diagram identification. Numbered item callouts/hotspots are shown only when geometry is available.

Tree selection and diagram-item selection update the same shared occurrence/item selection state. Selection never mutates canonical PART identity.

Missing diagram, image, hotspot or vehicle-location data is an explicit `unavailable` state. No geometry, vehicle location or diagram relationship may be fabricated.

Deterministic fixture geometry is permitted initially and must use the same contract as future verified #352 hotspot conversion output.

## Location at car

Concept-11 places the vehicle-location region directly below Search/Availability.

- Show model-specific top/side/location context only when verified assets/mapping exist.
- A selected range/context may scope the vehicle presentation.
- A highlighted zone/pin requires an approved Jagports-owned mapping.
- Vehicle catalogue location is distinct from physical stock/storage location.
- Missing mapping remains visibly unavailable rather than moving or removing the region.

## PART / image / status

The lower-centre Concept-11 region combines selected identity/context and the primary visual:

- canonical PART number/identity;
- verified name/description;
- selected EPC item/callout identity where available;
- warning/status only from approved data;
- Jaguar Classic snapshot/status according to its defined semantics;
- supersession relationship according to approved supersession data;
- one selected part image or exploded diagram at a time;
- explicit unavailable state when media is absent.

The Concept-11 example text such as warning labels, item numbers, Classic or superseded state is illustrative unless supported by the current result data. The UI must not turn example artwork into fabricated facts.

## UI/API contract

```text
MainViewRequest
  canonical_part_id
  occurrence_context_id
  selected_item_id
  selected_vehicle_or_range_context?

MainViewResult
  state
  part_context
  part_image when available
  diagram
  items[] / hotspots[]
  selected_item_id
  vehicle_location when verified
  warning/status when verified
  classic_snapshot/status when supported
  supersession when supported
  unavailable/error information
```

## State and synchronization

- `resolved` means the selected part/context is available for presentation.
- `unavailable` means requested secondary visual/context data is absent.
- `error` means processing/API failure.
- Tree and diagram selection refer to the same item/occurrence identity.
- If geometry is absent, item identity may still be presented without a hotspot.
- Missing media/location/status data does not change PART identity or applicability.

## Deterministic fixtures

Cover Part Image available/unavailable, diagram available/unavailable, diagram with numbered items, hotspot unavailable, synchronized tree/diagram selection, vehicle location unavailable and representative status/supersession states where supported by the data model.

## Viewport and i18n

On the default desktop layout, the Main View participates in the fitted PR #616 shell; long content scrolls inside its permanent regions. Narrower layouts may reflow and use normal page scrolling.

Labels/status text must tolerate variable-length localization and use the approved #554 i18n contract before final post-MVP approval. Catalogue-data language remains separate under #620.

## Dependencies and boundaries

Follows Part Search and Parts Tree contracts. #352 owns hotspot coordinate conversion. Vehicle mapping, fitment, supersession/Classic, stock and import remain governed by their respective specifications. This document consumes #354 semantics and does not redefine the domain model.

## Acceptance criteria

- [ ] Main View context contract is defined.
- [ ] Concept-11 location and PART/image/status regions are represented.
- [ ] Part Image available/unavailable behaviour is defined.
- [ ] Diagram identity and availability semantics are defined.
- [ ] Item/hotspot availability and selection semantics are defined.
- [ ] Tree and diagram selection synchronization is defined.
- [ ] Example concept labels are not treated as factual data without evidence.
- [ ] Viewport-fit and i18n-safe presentation are preserved.
- [ ] Stable Main View UI/API contract is defined for #368.
