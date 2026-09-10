# VIEPS UI — Main part and diagram view synchronization contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #475  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define the Concept View-1 Main View contract for the selected part, EPC occurrence/context, exploded diagram and synchronized item selection.

## Contract
The Main View receives the canonical PART, selected EPC occurrence/context and selected item identity. It does not create a new part identity.

When available, it shows the associated exploded diagram and verified drawing/diagram identification. Numbered item callouts/hotspots are shown only when geometry is available.

Tree selection and diagram-item selection update the same shared occurrence/item selection state. Selection never mutates canonical PART identity.

Missing diagram or hotspot data is an explicit `unavailable` state. No geometry or diagram relationship may be fabricated.

Deterministic fixture geometry is permitted initially and must use the same contract as future verified #352 hotspot conversion output.

## UI/API contract
```text
MainViewRequest
  canonical_part_id
  occurrence_context_id
  selected_item_id

MainViewResult
  state
  part_context
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

## Deterministic fixtures
Cover diagram available, diagram unavailable, diagram with numbered items, hotspot unavailable, and synchronized tree/diagram selection.

## Concept-1 integration
The Main View component exists in its permanent Concept-1 position from the first implementation. Fixture-backed content can later be replaced by imported/verified data without changing the UI contract.

## Dependencies and boundaries
Follows #472 Part Search and #474 Parts Tree. #352 owns hotspot coordinate conversion. Full vehicle location, suitability/fitment, supersession/Classic, stock and import are outside this priority. The specification consumes #354 semantics and does not redefine the domain model.

## Acceptance criteria
- [ ] Main View context contract is defined.
- [ ] Diagram identity and availability semantics are defined.
- [ ] Item/hotspot availability and selection semantics are defined.
- [ ] Tree and diagram selection synchronization is defined.
- [ ] Missing diagram/hotspot states are explicit.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Main View UI/API contract is defined for #368.
- [ ] Scope remains within #468 and #354 semantics.
