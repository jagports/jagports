# VIEPS UI — Main part and diagram view synchronization contract

**Status:** #875 target geometry proposed for review; merged Concept-11 remains the runtime baseline  
**Layout enhancement issue:** #875 (follows #468's merged Concept-11)  
**Priority issue:** #475  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective
Specify the #875 selected-PART and Location at car workspace using existing canonical PART, verified occurrence and item synchronization. Search Results is a separate right-hand multi-PART panel; the centre Main View displays only one selected PART.

## Merged Concept-11 geometry
The #875 target places one Location canvas beside one selected-PART panel in the centre. Search and Applicable Models occupy the separate right column, replacing the old full-width Model Ranges row and full-width lower PART layout.

```text
LEFT                      CENTRE                                   RIGHT
Availability              VIN / normalized Variations             Search
Parts Tree                +----------------+-------------------+   Search Results PART List
(root/selected path)      | Location at car| Selected PART /   |   (many candidates)
                          | verified canvas| Image / Status    |   Applicable Models
                          | or unavailable | one PART only     |   (verified fit or browse)
                          +----------------+-------------------+
```

Selecting a right-hand row or a PART leaf in the left tree updates the same canonical PART selection. A tree leaf can also select its verified occurrence; choosing a row with multiple occurrences must not guess one. Responsive layout may reflow without changing these roles.

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
The right-bottom Applicable Models panel consumes the selected PART and, when available, selected occurrence and vehicle context. It shows only verified `applicable` ranges for a selected PART/context; without PART selection it may show the fixture browse index without implying fitment. Its model filtering is separate from centre-top normalized Suitability / Variations search filters. Missing Location mapping does not establish missing or negative fitment.

### PART / Image / Status
The centre-right panel groups **one canonical PART** and approved evidence for its selected source occurrence/item, warnings/status, Jaguar Classic, supersession, PN/name, and one part image or exploded diagram. When several PARTs match, no PART is selected by default. Tree leaves and results rows share canonical PART selection; bookmark checkboxes never select a PART. When one result row represents several genuine occurrences, present only verified PART-level details until the occurrence is chosen. Missing diagram, hotspot, media or location remains explicitly unavailable.

## MVP Part Image behaviour
- Show the resolved PART image when verified image data exists, otherwise an explicit unavailable state.
- Keep the visual associated with the selected canonical PART and occurrence/context.
- Do not substitute unrelated media.
- Keep the centre-right single-PART / Image / Status panel available for later diagram/hotspot integration without changing its one-selected-PART role or duplicating Search Results.

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
- `resolved`: a selected canonical PART and any explicitly selected occurrence is available.
- `no_selected_part`: multiple candidates exist but none has been selected.
- `context_required`: a PART is known, but its occurrence-dependent facts await explicit context selection.
- `unavailable`: secondary visual/context data is missing; it does not invalidate the PART.
- `error`: processing/API failure.
- Tree leaves and Search Results rows share one canonical PART selection. Tree occurrence, diagram item and PART identities remain distinct. Missing hotspot geometry can coexist with verified item identity.

## Deterministic fixtures
Cover vehicle-location available/unavailable, Part Image available/unavailable, diagram available/unavailable, numbered items, hotspot unavailable, supported status/Classic/supersession examples and synchronized tree/diagram selection. Preserve current main-branch non-numbered fixture identifiers without presenting them as Jaguar part numbers.

## Viewport and language
The #875 desktop shell retains left Availability and Parts Tree, centre VIN/Variations above side-by-side Location and one selected PART, and right Search/Results/Applicable Models. Preserve #616's fitted desktop layout: long tree, results and models lists scroll internally, while narrow layouts may reflow. UI-locale versus catalogue-language controls remain distinct under #554/#620; no unimplemented control pretends to work.

## Dependencies and boundaries
Follows Part Search and Parts Tree contracts. #352 owns hotspot coordinate conversion. Vehicle mapping, fitment, supersession/Classic, stock and import remain governed by their own specifications. This document consumes #354 semantics and does not redefine the domain model.

## Acceptance criteria
- [ ] #875 centre side-by-side Location canvas and one selected PART panel replace the prior full-width selected-PART row.
- [ ] Right Search Results rows and left PART tree leaves update the same canonical PART selection while preserving genuine source occurrences.
- [ ] Multiple matching PARTs have no default selected PART; the centre panel is never a candidate list.
- [ ] Occurrence-dependent facts are not guessed when the selected PART has several genuine contexts.
- [ ] One verified Location canvas is retained, without fabricated permanent Top/Side panels.
- [ ] Image, diagram, callout, warnings, Classic and supersession require approved source evidence.
- [ ] No-selected-PART, context-required, unavailable and error states remain distinct.
- [ ] Viewport-fit, language separation, fixtures and independent #875 specification review are covered.
