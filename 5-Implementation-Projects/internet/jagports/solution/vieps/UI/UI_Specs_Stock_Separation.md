# VIEPS UI — Operational stock and catalogue separation

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #482  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective
Keep operational stock separate from immutable catalogue/reference information while supporting the Concept-11 Search + Availability and conditional empty-search browsing relationships merged by PR #645.

## Contract
Catalogue PART/PART OCCURRENCE data and operational STOCK RECORD data are separate.

Stock quantity, quality/condition, status, physical storage location, donor/reference, availability and operational notes do not mutate catalogue identity or fitment.

Stock held under an older/superseded catalogue part number retains its stocked identity. Supersession may be shown separately when approved data supplies it. Unresolved stock remains explicitly unresolved.

Catalogue vehicle location and physical stock/storage location are never conflated.

## Merged Concept-11 Availability relationship
Concept-11 places **Availability beside Search in the top workspace spanning the centre/right area**.

The SVG illustrates a selection list of stock-available part qualities `A…E with descriptions`. This is presentation evidence only; it does not define the business meaning of A–E.

Rules:
- quality codes/descriptions come only from the approved operational stock contract;
- until that contract exists, Availability remains disabled/unavailable;
- availability/quality filtering never changes canonical PART identity or fitment semantics;
- constraints narrow results only through approved stock/catalogue query logic.

## Empty-search stock browsing
The merged SVG explicitly says that when Search is empty, a supported stock constraint may update both Model Ranges and Parts Tree suitability/main-level context.

```text
empty search + supported stock constraint
        │
        ├── matching stock records
        │      ↓ resolve canonical catalogue references
        ├── Parts Tree → applicable main levels / relevant paths
        └── Model Ranges → verified range/applicability contexts
```

Stock must not directly manufacture catalogue hierarchy or fitment. Until the join/query contract exists, keep these browse results unavailable rather than deriving them from demo stock values.

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

## Current fixture relationship
Existing main-branch stock values remain deterministic/demo operational data and must continue to be identified as such. Main-branch non-numbered fixture identifiers remain identifiers, not Jaguar part numbers. Presentation migration to Tailwind must not convert fixture stock/location data into catalogue facts.

## Language boundary
Availability labels and descriptions are UI/operational presentation and must be compatible with #554. Catalogue/parts-language data remains independently selectable under #620. The separate `[UI]` / `[Parts]` concept controls do not authorize a second ad-hoc localization mechanism.

## Acceptance criteria
- [ ] Catalogue and stock identities remain separate.
- [ ] Availability shares the merged Concept-11 Search workspace.
- [ ] A–E meanings remain illustrative until defined by the stock contract.
- [ ] Empty-search Tree/Model-Range browsing requires approved stock-to-catalogue resolution.
- [ ] Historical/superseded stocked identity is retained.
- [ ] Unresolved stock remains unresolved.
- [ ] Vehicle catalogue location and stock storage location remain distinct.
- [ ] Main-branch deterministic fixture semantics are preserved.
- [ ] UI-vs-Parts language boundary is preserved.
