# VIEPS UI — Deterministic MVP vertical-slice contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #483  
**Implementation parent:** #368  
**Domain/import dependencies:** #354, #355  

## Objective
Define the smallest demonstrable VIEPS Concept-1 vertical slice that can operate before production/imported data is available.

## Required path
```text
part number
 → canonical PART
 → EPC occurrence/context
 → relevant Parts Tree
 → Main View/diagram
 → applicable ranges
 → fitment qualifiers
 → location/image where available
```

The page should establish the complete Concept-1 information architecture early. Real behavior is implemented where its contract is ready; remaining components use permanent explicit placeholder/unavailable states rather than throwaway layouts.

## Fixture boundary
Deterministic fixtures are an implementation substrate, not a second domain model. Fixture requests/results use the same UI/API contracts that imported data will later provide.

Fixture identifiers and values must be clearly marked as deterministic test data and must not be represented as production evidence.

## Required fixture coverage
At minimum cover:
- successful part-number resolution;
- multiple EPC contexts;
- relevant tree path;
- diagram/item context;
- applicable model/ranges;
- qualifier-bearing fitment;
- unavailable secondary data;
- not-found and invalid input.

## Migration rule
Replacing fixtures with #355 imported data must not require a UI information-architecture rewrite. The adapter/data source changes; the UI contract remains stable.

## Acceptance criteria
- [ ] Complete MVP vertical-slice path is defined.
- [ ] Fixture data boundary is defined.
- [ ] Fixture and imported-data contracts are identical at the UI boundary.
- [ ] Deterministic representative cases cover positive and unavailable states.
- [ ] Fixture data cannot be mistaken for production provenance.
- [ ] Migration from fixtures to imported data requires no UI architecture rewrite.
- [ ] Stable contract is usable by #368 and compatible with #354/#355.
