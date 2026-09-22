# VIEPS UI — Main part and diagram view synchronization contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #475  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective
Define the Main View contract from the Concept-11 SVG merged by PR #645 while preserving canonical PART, EPC occurrence/context and item synchronization.

## Merged Concept-11 geometry

```text
centre/right workspace
┌──────────────────────────────────────────────────────────────────┐
│ SUITABILITY MODEL RANGES                                         │
├──────────────────────────────┬───────────────────────────────────┤
│ LOCATION AT CAR              │ SUITABILITY / FILTER              │
│ one location canvas          │ filters or verified facts         │
├──────────────────────────────┴───────────────────────────────────┤
│ PART / IMAGE / STATUS                                            │
│ identity/status + one selected image/diagram                     │
└──────────────────────────────────────────────────────────────────┘
```

The important correction from the earlier interpretation is that **Location and Suitability are side-by-side**, not vertically stacked. PART / Image / Status spans the full lower centre/right workspace. Model Ranges is a separate row above them.

## Contract
The Main View receives canonical PART, selected EPC occurrence/context and selected item identity. It does not create a new part identity.

### Location at car
- Use one stable vehicle-location canvas in the left-middle workspace.
- A verified top, side, schematic, silhouette or other representation may render inside the canvas when supplied by the approved mapping/source contract.
- A highlighted zone/pin/location requires verified mapping evidence.
- Missing mapping remains visibly unavailable.
- Do not recreate the old permanent `Top view` / `Side view` split.
- Catalogue vehicle location is distinct from physical stock/storage location.

### Coordination with Suitability
- The adjacent right-middle Suitability region uses the same selected PART/context and vehicle/range applicability state.
- Location and Suitability remain semantically separate: absence of vehicle-location mapping does not mean absence of fitment, and vice versa.

### PART / Image / Status
The full lower centre/right region groups, where supported by approved data:

- warning/status;
- canonical PART number/identity;
- selected EPC item/callout identity;
- Jaguar Classic indication;
- supersession relationship;
- verified part name/details;
- one selected part image or exploded diagram.

The SVG examples such as `Fan warning label`, `MJB7703AA`, an item number, Classic and superseded text are illustrative only. They become runtime facts only when current result data supplies them.

Tree selection and diagram-item selection refer to the same occurrence/item context. Selection never mutates canonical PART identity.

PART selection is performed through the Parts Tree's terminal PART leaves when browsing/search yields multiple candidates. **PART / Image / Status must never render a multi-PART candidate list.** Until one PART leaf is selected, this region stays in an explicit no-selected-PART/context state. Once selected, it shows exactly that one canonical PART and its resolved occurrence/item context.

The Parts Tree itself retains the root index and complete selected ancestry; Main View must not require or encourage a duplicate flat PART list to compensate for tree presentation.

Missing image, diagram, hotspot or vehicle-location data is an explicit `unavailable` state. No geometry or relationship may be fabricated.

## MVP Part Image behaviour
- Show the resolved PART image when verified image data exists, otherwise an explicit unavailable state.
- Keep the visual associated with the selected canonical PART and occurrence/context.
- Do not substitute unrelated media.
- Preserve the full lower PART / Image / Status region so diagram/hotspot support can be integrated later without changing information architecture.

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
- `resolved`: one selected part/context is available for presentation.
- `no_selected_part`: browse/search context exists but no PART leaf is selected; no candidate list is rendered in Main View.
- `unavailable`: requested secondary visual/context data is absent.
- `error`: processing/API failure.
- Tree and diagram selection refer to the same item/occurrence identity.
- Missing geometry may still allow item identity to be shown without a hotspot.
- Missing Part Image or vehicle-location data does not change PART identity or applicability.

## Deterministic fixtures
Cover vehicle-location available/unavailable, Part Image available/unavailable, diagram available/unavailable, numbered items, hotspot unavailable, supported status/Classic/supersession examples, synchronized tree/diagram selection, multiple PART candidates with no Main View selection, and one PART selected through a terminal Parts Tree leaf. Preserve current main-branch non-numbered fixture identifiers without presenting them as Jaguar part numbers.

## Viewport and language
On desktop, Model Ranges is above the middle row, Location/Suitability are side-by-side, and PART/Image/Status spans the lower centre/right workspace. Long content scrolls inside permanent regions under #616.

UI text must be compatible with #554 localization. Parts/catalogue-data language remains independently selectable under #620. This specification does not implement either language selector by itself.

## Dependencies and boundaries
Follows Part Search and Parts Tree contracts. #352 owns hotspot coordinate conversion. Vehicle mapping, fitment, supersession/Classic, stock and import remain governed by their own specifications. This document consumes #354 semantics and does not redefine the domain model.

## Acceptance criteria
- [ ] Model Ranges / Location / Suitability / PART-region geometry matches merged Concept-11.
- [ ] Location and Suitability are side-by-side on the desktop information architecture.
- [ ] Single vehicle-location canvas is defined; permanent Top/Side boxes are superseded.
- [ ] PART / Image / Status spans the lower centre/right workspace.
- [ ] Part Image and diagram available/unavailable behaviour is defined.
- [ ] Tree/diagram selection synchronization is defined.
- [ ] PART / Image / Status never becomes a multi-PART result list; multiple candidates are selected through terminal Parts Tree leaves.
- [ ] Explicit no-selected-PART/context state is defined for multi-candidate browse/search.
- [ ] Warning/status, Classic and supersession remain evidence-backed concerns.
- [ ] Missing media/location states remain explicit.
- [ ] Viewport-fit and UI-vs-Parts language boundaries are preserved.
