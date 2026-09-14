# VIEPS UI — Operational stock and catalogue separation

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #482  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective

Keep operational stock separate from immutable catalogue/reference information while supporting the Concept-11 Availability and empty-search browsing relationships.

The current placement authority is the **Concept-11 ASCII map in `UI_Specs.md`**.

## Contract

Catalogue PART/PART OCCURRENCE data and operational STOCK RECORD data are separate.

Stock quantity, condition/status, storage location, donor vehicle/reference, availability and operational notes do not mutate catalogue identity or fitment.

If stock is held under an older/superseded catalogue part number, the UI may show the supersession relationship while retaining the stocked identity. A stock record may reference resolved catalogue identity, but unresolved stock remains explicitly unresolved.

Catalogue vehicle location and physical stock/storage location are never conflated.

## Concept-11 Availability control

Concept-11 places an **Availability** constraint beside Search and illustrates selectable stock quality/status values.

This is an operational stock filter, not a catalogue attribute.

```text
Availability / stock constraint
          │
          ├── may constrain stock-backed result set
          ├── may constrain empty-search Parts Tree browsing
          └── may constrain empty-search applicable Model Ranges
```

This behaviour requires an approved stock/catalogue query contract. Until that contract exists:

- do not invent stock qualities or availability categories;
- do not fabricate stock-derived Parts Tree levels;
- do not infer model applicability merely from stock presence;
- present the control/state as unavailable or disabled where necessary.

## Empty-search browsing

Concept-11 illustrates a mode in which no specific PART has been entered and stock availability can be used to expose only catalogue/tree and model/range contexts represented by matching stock.

That mode must preserve the following separation:

```text
STOCK RECORDS
   ↓ constrain/query
CANONICAL PART references
   ↓ resolve through catalogue/fitment contracts
PARTS TREE / MODEL RANGES
```

Stock records must never directly manufacture catalogue hierarchy or fitment relationships.

## UI/API shape

```text
CataloguePart
  canonical identity/context

StockRecord
  stock_id
  part_reference?
  quantity
  quality/condition/status
  storage_location
  donor_reference?
  availability
  operational_notes

StockBrowseConstraint
  supported availability/quality values
  matching stock records / canonical part references
```

## Deterministic fixtures

Cover multiple stock records for one part, stock under a historical part number with supersession, unresolved stock, zero/unavailable stock and at least one supported availability/quality constraint when the browse contract is implemented.

## Viewport and i18n

Availability labels/descriptions must tolerate variable-length localized UI text under #554. Catalogue-data language remains separate under #620.

Stock result details may scroll inside their permanent Concept-11 region on the fitted PR #616 desktop shell.

## Boundaries

Stock is operational data. It does not redefine #354 catalogue identity or fitment semantics. Stock APIs may be implemented separately from catalogue lookup.

## Acceptance criteria

- [ ] Catalogue and stock boundaries are defined.
- [ ] Stock fields are defined as operational data.
- [ ] Concept-11 Availability is explicitly an operational constraint, not catalogue identity.
- [ ] Empty-search stock browsing resolves through canonical catalogue/fitment relationships.
- [ ] No stock-derived hierarchy or fitment is fabricated without an approved query contract.
- [ ] Historical/superseded stock identity is retained.
- [ ] Unresolved stock remains unresolved.
- [ ] Vehicle catalogue location and stock storage location are separated.
- [ ] Viewport-fit and i18n-safe presentation are preserved.
- [ ] Stable stock UI/API boundary is defined for #368.
