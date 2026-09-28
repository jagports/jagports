# VIEPS Search — VIN specification

## Scope
Define the VIN input and its evidence-bounded interaction with Search, FIT, Parts Tree and Applicable Models. [Search](SPEC_SEARCH.md) governs shared filter state and invalidation; [FIT](SPEC_SEARCH_FIT.md) and [Ranges](SPEC_SEARCH_RANGES.md) govern their distinct controls. VIN does not create new canonical PART identities.

## Verified VIN evidence
VIN fit uses approved source VIN ranges, not inferred model years or KOVuosi. VIN filtering consumes approved occurrence-specific model, source VIN ranges and serial-bound evidence. Unverified model years or `KOVuosi` must never substitute for VIN-backed evidence. No default fit, guessed boundary or inferred compatibility is permitted.

A selected canonical PART may have several independently sourced occurrences. An occurrence-dependent VIN fit is not shown as verified until the relevant occurrence/context has been identified. VIN filtering and context selection must never mutate canonical PART identity or combine predicates from unrelated occurrences.

When VIN or serial evidence required to evaluate an otherwise eligible occurrence is missing or incomplete, keep the candidate in the distinct unresolved section with a yellow unknown indicator rather than asserting a positive fit or confirmed exclusion. Confirmed incompatible occurrences do not count as positive candidates. An unsupported VIN comparison returns unavailable instead of a guessed result.

## VIN interaction contract
VIN filtering combines with Find, Stock, FIT, selected Parts Tree branch and at most one active Range. Changing VIN recalculates candidates and evidenced option visibility without clearing independently selected filters. Asynchronous responses from previous VIN/query states must not replace newer results.

```text
VINFitRequest
  vehicle_context?                # VIN and verified discriminator input
  canonical_part_id?
  occurrence_context_id?
  active_search_filters?

VINFitResult
  state                           # applicable / no_match / unavailable / error
  vin_range[] when source-backed
  matched_occurrence_contexts[]
  exclusions[] when verified
  provenance/unavailable information
```

## Source evidence and capability boundary
VIN decoding and VIN-range reconstruction remain distinct from the search UI and must be based on approved source data. Unsupported comparisons and missing source mappings remain explicit unavailable states. The UI may preserve the VIN input while deselecting a PART that no longer matches under the shared search contract.

## Presentation and test semantics
The VIN input occupies the centre above Location and the one selected PART. Verify bounded VIN matches, documented exclusions, unknown or conflicting evidence, multi-occurrence ambiguity, cross-filter conjunction, EN/FI states, empty input and stale-response invalidation using source-qualified fixtures. Fixtures do not establish Jaguar fit facts.
