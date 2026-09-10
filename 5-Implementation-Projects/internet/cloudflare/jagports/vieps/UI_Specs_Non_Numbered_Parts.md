# VIEPS UI — Non-numbered part identity and image contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #480  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define how Concept-1 represents items without a Jaguar part number without fabricating catalogue identity.

## Contract
The UI consumes the approved Parts Data Model and does not assume every physical or catalogue item has a Jaguar part number.

Where #354 permits it, a part/item without a part number may use a unique description/identifier. That identifier remains distinct from a Jaguar catalogue part number.

Images may be associated with such an item for identification when supported by the model and provenance. Search/result display must never invent a Jaguar part number from a description or image.

Unresolved physical stock remains unresolved until identity is established.

## Example deterministic identities
`firtree1` and `firtree2` can be unique descriptive identifiers with associated part images. They must not be displayed as Jaguar part numbers.

## UI/API contract
```text
PartIdentity
  canonical_part_id?
  part_number?
  descriptive_identifier?
  display_name
  images[]
  identity_state
  provenance
```

## Deterministic fixtures
Cover a numbered catalogue part, a non-numbered item with descriptive identifier and image, an item without image, and unresolved identity.

## Boundaries
This specification consumes #354 semantics and does not redefine canonical identity. It does not authorize inferred catalogue numbers or automatic identification from an image.

## Acceptance criteria
- [ ] Part-number-optional identity semantics are defined.
- [ ] Unique descriptive identifier semantics are defined.
- [ ] Image association semantics are defined.
- [ ] UI does not fabricate Jaguar part numbers.
- [ ] Unresolved identity remains distinguishable.
- [ ] Deterministic fixtures include numbered and non-numbered items.
- [ ] Stable contract aligns with #354 and is usable by #368.
- [ ] Scope does not redefine the canonical Parts Data Model.
