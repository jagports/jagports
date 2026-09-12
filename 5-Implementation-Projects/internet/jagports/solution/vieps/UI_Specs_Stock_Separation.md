# VIEPS UI — Operational stock and catalogue separation

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #482  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Keep operational stock separate from immutable catalogue/reference information in Concept View-1.

## Contract
Catalogue PART/PART OCCURRENCE data and operational STOCK RECORD data are separate.

Stock quantity, condition/status, storage location, donor vehicle/reference, availability and operational notes do not mutate catalogue identity.

If stock is held under an older/superseded catalogue part number, the UI may show the supersession relationship while retaining the stocked identity. A stock record may reference resolved catalogue identity, but unresolved stock remains explicitly unresolved.

Catalogue vehicle location and physical stock/storage location are never conflated.

## UI/API shape
```text
CataloguePart
  canonical identity/context

StockRecord
  stock_id
  part_reference?
  quantity
  condition/status
  storage_location
  donor_reference?
  availability
  operational_notes
```

## Deterministic fixtures
Cover multiple stock records for one part, stock under a historical part number with supersession, unresolved stock, and zero/unavailable stock.

## Boundaries
Stock is operational data. It does not redefine #354 catalogue identity or fitment semantics. Stock APIs may be implemented separately from catalogue lookup.

## Acceptance criteria
- [ ] Catalogue and stock boundaries are defined.
- [ ] Stock fields are defined as operational data.
- [ ] Historical/superseded stock identity is retained.
- [ ] Unresolved stock remains unresolved.
- [ ] Vehicle catalogue location and stock storage location are separated.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable stock UI/API boundary is defined for #368.
- [ ] Scope does not redefine #354.
