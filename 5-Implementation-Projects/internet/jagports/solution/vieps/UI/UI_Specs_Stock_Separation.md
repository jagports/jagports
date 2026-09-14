# VIEPS UI — Operational stock and catalogue separation

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #482  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Keep operational stock separate from immutable catalogue/reference information while supporting the approved Concept-11 Search + Availability and conditional empty-search browsing relationships.

## Contract
Catalogue PART/PART OCCURRENCE data and operational STOCK RECORD data are separate.

Stock quantity, condition/status, storage location, donor vehicle/reference, availability and operational notes do not mutate catalogue identity.

If stock is held under an older/superseded catalogue part number, the UI may show the supersession relationship while retaining the stocked identity. A stock record may reference resolved catalogue identity, but unresolved stock remains explicitly unresolved.

Catalogue vehicle location and physical stock/storage location are never conflated.

## Concept-11 availability relationship
Concept-11 places **Availability** beside Search in the top-centre strip.

The SVG illustrates a selection list of stock-available part qualities `A…E` with descriptions. This is a presentation concept, not a definition of quality-code meanings.

Rules:

- actual quality codes and descriptions must come from the approved operational stock contract;
- if no quality/availability contract is available, the control remains unavailable/disabled;
- availability filtering must not change canonical PART identity or fitment semantics;
- a selected availability/quality constraint may narrow result sets only through approved query logic.

## Empty-search stock browsing
The Concept-11 note states that when part search is empty, stock may constrain the Parts Tree and Model Ranges.

Approved interpretation:

```text
empty search + supported stock constraint
        │
        ├── Parts Tree main levels represented by matching stock
        └── Model Ranges represented by matching stock/applicability
```

This mode is conditional on an approved query contract joining operational stock to catalogue identity and applicability. It must not be simulated from unrelated fixture values or inferred solely from the visual concept.

## UI/API shape
```text
CataloguePart
  canonical identity/context

StockRecord
  stock_id
  part_reference?
  quantity
  quality_code?
  quality_description?
  condition/status
  storage_location
  donor_reference?
  availability
  operational_notes

StockBrowseConstraint
  availability?
  quality_codes[]?
```

## Deterministic fixtures
Cover multiple stock records for one part, stock under a historical part number with supersession, unresolved stock, zero/unavailable stock, stock quality/description data when supported, and an explicit unsupported empty-search browse state.

## Boundaries
Stock is operational data. It does not redefine #354 catalogue identity or fitment semantics. Stock APIs may be implemented separately from catalogue lookup.

The Concept-11 `A…E` illustration must not be treated as authoritative business meanings until those meanings are defined by the stock domain contract.

## Acceptance criteria
- [ ] Catalogue and stock boundaries are defined.
- [ ] Stock fields are defined as operational data.
- [ ] Concept-11 Availability placement and conditional behavior are defined.
- [ ] `A…E` is recorded as illustrative until defined by the approved stock contract.
- [ ] Historical/superseded stock identity is retained.
- [ ] Unresolved stock remains unresolved.
- [ ] Vehicle catalogue location and stock storage location are separated.
- [ ] Empty-search stock browsing requires an approved query contract.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable stock UI/API boundary is defined for #368.
- [ ] Scope does not redefine #354.
