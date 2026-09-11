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
enter Jaguar part number
        ↓
resolve canonical PART
        ↓
show PART's relevant Parts Tree branch
        ↓
show all suitable vehicle Ranges/models
        ↓
select a Range and show all suitable variations/qualifiers
        ↓
show the PART image when available
        ↓
pass end-to-end acceptance testing
```

This is the minimum demonstrable acceptance boundary. Diagram hotspots, whole-car vehicle-location mapping, operational stock, supersession/current-part indicators, Jaguar Classic indicators and alternative entry paths are not prerequisites for completing this minimum flow.

The page should establish the complete Concept-1 information architecture early. Real behavior is implemented where its contract is ready; remaining components use permanent explicit placeholder/unavailable states rather than throwaway layouts.

The selected canonical PART remains the central identity while Parts Tree, Range, variation/qualifier and image views change their contextual presentation. UI components consume the approved API/data contracts and do not duplicate domain-resolution logic.

## Fixture boundary
Deterministic fixtures are an implementation substrate, not a second domain model. Fixture requests/results use the same UI/API contracts that imported data will later provide.

Fixture identifiers and values must be clearly marked as deterministic test data and must not be represented as production evidence.

## Required fixture coverage
At minimum cover:
- successful part-number resolution;
- multiple EPC contexts;
- relevant tree path;
- multiple applicable model/ranges;
- qualifier-bearing fitment/variation result;
- Part Image available and unavailable;
- unavailable secondary data;
- not-found, invalid and processing-error input states.

## Unavailable and evidence rules
- Missing image data is an explicit unavailable state, not a fabricated image.
- Missing Range applicability is not a positive fitment result.
- Missing variation data is not equivalent to no variation.
- Missing Parts Tree context is not equivalent to no PART.
- Unresolved source semantics remain unresolved rather than being guessed by presentation code.

## Migration rule
Replacing fixtures with #355 imported data must not require a UI information-architecture rewrite. The adapter/data source changes; the UI contract remains stable.

## Acceptance criteria
- [ ] Complete minimum MVP vertical-slice path is defined.
- [ ] Canonical PART remains stable across tree, Range, variation and image presentation.
- [ ] Fixture data boundary is defined.
- [ ] Fixture and imported-data contracts are identical at the UI boundary.
- [ ] Deterministic representative cases cover positive, failure and unavailable states.
- [ ] Fixture data cannot be mistaken for production provenance.
- [ ] Migration from fixtures to imported data requires no UI architecture rewrite.
- [ ] Stable contract is usable by #368 and compatible with #354/#355.
