# VIEPS UI — Supersession and Classic indicator semantics

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #481  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define distinct semantics for supersession and Jaguar Classic indicators in Concept View-1.

## Supersession
A supersession indicator means a newer/current relationship exists according to approved supersession data. Historical JEPC `isSuperSeded` alone is not sufficient proof of current supersession.

Historical and current part identities remain separately addressable. A displayed relationship does not replace the identity of the searched or stocked historical part.

## Classic
Jaguar Classic status reflects the JEPC snapshot semantics unless independently established as current. Classic status is not treated as a synonym for supersession.

## Provenance
Where a status originates from a historical snapshot, source/provenance context must remain available so the UI does not present historical evidence as current truth.

## UI/API contract
```text
PartStatusContext
  canonical_part_id
  supersession[]
  classic_snapshot?
  provenance[]
```

## Deterministic fixtures
Cover no supersession, one supersession relationship, a supersession chain, historical `isSuperSeded` without current proof, and Classic snapshot status.

## Boundaries
Do not derive new supersession rules from incomplete data, replace historical identities, or mix stock behavior into catalogue status semantics. The contract consumes #354 data semantics and does not redefine them.

## Acceptance criteria
- [ ] Current supersession semantics are defined.
- [ ] Historical `isSuperSeded` limitation is explicit.
- [ ] Classic snapshot semantics are defined separately.
- [ ] Historical/current identities remain distinct.
- [ ] Provenance requirements are defined.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable status UI/API contract is defined for #368.
- [ ] Scope does not redefine #354.
