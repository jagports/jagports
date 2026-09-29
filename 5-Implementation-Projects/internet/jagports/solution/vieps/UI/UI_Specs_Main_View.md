# VIEPS UI — Main part and diagram view synchronization contract

## Objective
Specify the the three-column layout selected-PART and Location at car workspace using existing canonical PART, verified occurrence and item synchronization. Search Results is a separate right-hand multi-PART panel; the centre Main View displays only one selected PART.

## Main View geometry
The the three-column layout target places one Location canvas beside one selected-PART panel in the centre. Search and Applicable Models occupy the separate right column, replacing the old full-width Model Ranges row and full-width lower PART layout.

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

### Coordination with Fit
The right-bottom Applicable Models panel consumes the selected PART and, when available, selected occurrence and vehicle context. It shows only verified `applicable` ranges for a selected PART/context; without PART selection it shows only evidenced source-backed candidate Ranges in production; TEST fixture ranges never assert real fit. Its model filtering is separate from centre-top normalized Fit / Variations search filters. Missing Location mapping does not establish missing or negative fitment.

### PART / Image / Status
The centre-right panel groups **one canonical PART** and approved evidence for its selected source occurrence/item, warnings/status, Jaguar Classic, supersession, PN/name, and one part image or exploded diagram. When several PARTs match, no PART is selected by default. Tree leaves and results rows share canonical PART selection; bookmark checkboxes never select a PART. When one result row represents several genuine occurrences, present only verified PART-level details until the occurrence is chosen. Missing diagram, hotspot, media or location remains explicitly unavailable.

## Clearing selected context

Apply the [Part Search clear transition](../SPEC/SPEC_FIND.md#empty-search-and-clear-transition) before loading roots. Remove the previous canonical PART selection, occurrence/item, warning/status, Classic/supersession presentation, image/diagram and visual choice, selected-PART range facts, fit facts and vehicle-location marker/context. The permanent regions remain visible in their no-selected-PART/browse state.

A root browse response must not select a PART automatically or restore the cleared PART's contextual facts. Supported stock-derived Applicable Models may be shown as fresh browse/filter context only. Missing tree data or a root-load error does not retain old PART details as a fallback.

Late success, failure and completion callbacks from superseded PART/tree/context reads cannot repopulate these regions, change the current status or end a newer request's loading state. UI language switching with no selected PART re-localizes the current browse/no-selection state without losing its tree context or restoring old PART data.

## MVP Part Image behaviour
- Show the resolved PART image when verified image data exists, otherwise an explicit unavailable state.
- Keep the visual associated with the selected canonical PART and occurrence/context.
- Do not substitute unrelated media.
- Keep the centre-right single-PART / Image / Status panel compatible with diagram/hotspot integration without changing its one-selected-PART role or duplicating Search Results.

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
Cover vehicle-location available/unavailable, Part Image available/unavailable, diagram available/unavailable, numbered items, hotspot unavailable, supported status/Classic/supersession examples and synchronized tree/diagram selection. Preserve approved non-numbered fixture identifiers without presenting them as Jaguar part numbers.

Clear/reset fixtures must additionally verify every affected region immediately after clear and after delayed PART/tree responses, root success/empty/unavailable/error, and EN↔FI switching in browse mode. Use the [empty-search and clear transition](../SPEC/SPEC_FIND.md#empty-search-and-clear-transition) as the cross-region acceptance contract; specification examples are not proof that runtime behavior has passed.

## Viewport and language
The the three-column layout desktop shell retains left Availability and Parts Tree, centre VIN/Variations above side-by-side Location and one selected PART, and right Search/Results/Applicable Models. Preserve the viewport-fit contract's fitted desktop layout: long tree, results and models lists scroll internally, while narrow layouts may reflow. UI-locale versus catalogue-language controls remain distinct under the separate UI and Parts-language contracts; no unimplemented control pretends to work.

## Dependencies and boundaries
Follows Part Search and Parts Tree contracts. the hotspot evidence contract owns hotspot coordinate conversion. Vehicle mapping, fitment, supersession/Classic, stock and import remain governed by their own specifications. This document consumes the PART model semantics and does not redefine the domain model.

