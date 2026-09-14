# VIEPS UI — Part Search and Search Controls Specification

## Status

This document is the durable implementation-level specification for the first active VIEPS UI priority from Issue #468:

> Part search resolves a canonical part and relevant occurrence/context.

It also defines the coordinated VIEPS search-control area introduced by Issue #634.

**Controlling UI specification:** #468 — VIEPS UI / Concept View-1 — Updated MVP UI specification  
**Implementation parent:** #368 — VIEPS UI / Implement MVP Web UI  
**Domain/data dependency:** #354 — Define and implement Parts Data Model  
**Original specification work record:** #472 — VIEPS UI / Specification — Part search resolution and UI data contract  
**Identifier-search amendment:** #618 — VIEPS UI / Make part-number search partial and case-insensitive  
**Search-control amendment:** #634 — SPEC / VIEPS UI search controls: add free-word search and stock-only filter  
**Free-text architecture owner:** #622 — SPEC / [post-MVP] Implement multilingual free-text search across JEPC and stock data  
**Stock workflow/search owner:** #613 — VIEPS Stock / Specify operational stock workflow  
**Authorization boundary:** #448 — Implement public VIEPS access with administrator stock authorization

## Target flow

```text
USER ENTERS SEARCH CRITERIA
        │
        ├── part-number / identifier query
        ├── free-word query
        └── show only parts on stock filter
        │
        ▼
NORMALIZE / VALIDATE SEARCH INPUTS
        │
        ├── invalid → explicit validation/error state
        ├── unsupported combination → explicit unsupported state
        └── empty → initial Concept View-1 state
        │
        ▼
RESOLVE SEARCH CANDIDATES
        │
        ├── identifier path → canonical PART lookup
        ├── free-word path → approved text/search-index lookup
        └── stock-only filter → visible stock-availability filter
        │
        ▼
RESOLVE CANONICAL PART / RESULT IDENTITY
        │
        ├── no match → explicit not-found state
        ├── multiple matches → selectable candidate state
        └── restricted stock match → authorization-safe visible state
        │
        ▼
RESOLVE RELEVANT EPC OCCURRENCE / CONTEXT
        │
        ├── one context → select it
        ├── multiple contexts → preserve/display the applicable context
        └── no context → explicit unavailable-context state
        │
        ▼
STABLE UI/API RESULT
        │
        ├── search criteria and applied filters
        ├── match type: identifier / free-word / stock-filtered
        ├── canonical PART identity where resolved
        ├── stock-result identity where authorized and applicable
        ├── selected OCCURRENCE / CONTEXT where available
        ├── Parts Tree path/context
        ├── diagram/item context where available
        └── suitability/fitment context where available
        │
        ▼
CONCEPT VIEW-1 PAGE
```

## 1. Search-control area

The VIEPS search area contains coordinated controls rather than a single undifferentiated input.

Required controls:

- `Part number` or equivalent Jaguar part-number / identifier input.
- `Free-word search` or equivalent text-search input or mode.
- `Show only parts on stock` checkbox or equivalent boolean stock-availability filter.
- A `Search` action that applies the visible criteria together.

The existing part-number-first MVP path remains visible, first-class and clearly identifiable.

The free-word control must be visually and semantically distinguishable from the part-number / identifier control.

The stock-only checkbox belongs to the search/filter area. It must not be represented as catalogue data and must not imply that stock state is stored in JEPC/reference records.

The controls must preserve the user's original input values for UI state, repeatability and error reporting.

## 2. Part-number / identifier search input

- The MVP search entry point remains a Jaguar part-number / identifier search.
- Identifier search is optimized for canonical Jaguar part-number lookup.
- Leading/trailing whitespace is ignored.
- Part-number matching is case-insensitive for lookup; the resolved canonical value is returned from the catalogue data.
- Partial part-number input is supported where the approved search implementation can match known fixture/catalogue part numbers.
- Exact full part-number lookup must continue to work.
- Partial input that matches multiple PARTs must return a multiple-candidate/selectable state rather than inventing one selected PART.
- The user's original entered value is retained separately from the normalized lookup value for UI/error reporting.
- Internal punctuation or characters are not silently removed or rewritten unless an approved source-specific normalization rule establishes that behaviour.
- Validation rejects clearly invalid/empty identifier input without inventing a part identity.

Identifier search must not be weakened by the existence of free-word search. Exact identifier matches should be ranked or selected ahead of weaker text matches when both paths participate in one result set.

## 3. Free-word search input

Free-word search allows users to search by ordinary text, such as part names, descriptions, category labels, stock notes or other approved searchable text fields.

Free-word search is a discovery path. It must not replace canonical PART identity, create duplicate catalogue entities, or infer Jaguar part numbers from natural-language text.

The full post-MVP multilingual free-text search architecture, indexing strategy and benchmarked implementation choice are owned by #622. This UI specification defines the search-control contract that consumes such a capability when it is available.

Reduced-MVP implementations may support free-word search only against deterministic fixture/search data, or show an explicit unavailable/unsupported state, unless the required free-text backend is separately approved for the MVP boundary.

Free-word search must resolve matched catalogue/reference text to stable canonical entities where possible:

```text
localized/source text match
        ↓
canonical VIEPS entity
        ↓
search result with matched text/source context
```

When a free-word match comes from localized/imported JEPC text, the result must retain the matched language/source context without creating a language-specific duplicate PART.

Free-word search must respect the same authorization boundary as the underlying fields. Restricted stock notes, storage locations or other administrator-only fields must not become publicly discoverable merely because they are indexed.

## 4. Stock-only filter

The `Show only parts on stock` filter restricts search results to records that have approved visible stock availability.

The exact stock availability semantics are owned by the stock model/workflow specifications. At UI contract level:

- the filter is boolean;
- unchecked means catalogue/search results are not restricted to stocked items;
- checked means result candidates without visible approved stock availability are excluded or clearly not returned;
- the filter applies to identifier search, free-word search and combined search criteria;
- the filter must not mutate catalogue/reference state;
- the filter must not expose restricted stock details to unauthorized users;
- public-visible stock indication must be separated from administrator-only stock details;
- unresolved/non-catalogue stock records may be returned only through an explicitly authorized stock-result contract and must be labeled as unresolved rather than fabricated as canonical Jaguar PARTs.

A stock-filtered search can therefore produce one of these high-level outcomes:

- a canonical PART with public-visible or authorized stock availability;
- an authorized stock record linked to a canonical PART;
- an authorized unresolved stock record without fabricated catalogue identity;
- no result because matching catalogue items exist but no visible stock availability satisfies the filter;
- unavailable/unsupported because stock search/filter data is not available in the current runtime.

## 5. Combined search behavior

The search controls are applied as coordinated criteria.

| Inputs | Required behavior |
|---|---|
| Part-number input only | Run optimized identifier lookup. Preserve exact, case-insensitive and partial behavior. |
| Free-word input only | Run free-word search over approved searchable fields/indexes. |
| Stock-only checked with no query | Return or display stocked items only if the current UI/runtime intentionally supports stock browsing; otherwise show an explicit empty/unsupported state. |
| Part-number input + stock-only | Run identifier lookup, then restrict to visible stocked results. |
| Free-word input + stock-only | Run free-word search, then restrict to visible stocked results. |
| Part-number input + free-word input | Use both criteria as a narrowing/intersection search unless the current implementation explicitly declares the combination unsupported. It must not silently ignore either input. |
| Part-number input + free-word input + stock-only | Apply identifier and free-word criteria together, then apply the visible stock-availability filter. |

If a current implementation cannot safely support a combination, the UI must display a specific unsupported/unavailable state. It must not silently discard a user-entered criterion.

## 6. Canonical PART resolution

- A successful identifier or catalogue free-word search resolves to one canonical catalogue `PART` identity from the approved Parts Data Model where a catalogue identity exists.
- The UI must not create or duplicate a catalogue part merely because it appears in multiple EPC contexts or in multiple source languages.
- Part description/name and other catalogue attributes come from the resolved PART/data contract rather than being independently reconstructed by the UI.
- A search result retains enough stable identity to be passed to subsequent Parts Tree, Main View, Suitability and fitment operations.
- Unresolved input remains unresolved; no guessed Jaguar part number is permitted.
- The canonical identity is the data-model identity, not merely the search string.
- Stock-result identity remains separate from canonical PART identity where a stock record is unresolved or not linked to a catalogue PART.

## 7. EPC occurrence/context resolution

A canonical PART may occur in multiple EPC contexts. The search result therefore separates:

```text
PART
  │
  └── OCCURRENCE / CONTEXT
        ├── vehicle/model context
        ├── category / Parts Tree path
        ├── diagram context
        ├── item/hotspot context
        └── applicable attributes/fitment context
```

- The canonical PART identity remains singular.
- Occurrence/context identifies where and how that part is represented in EPC data.
- Multiple valid occurrences must not be collapsed into a false single context.
- If the available MVP data cannot deterministically choose one occurrence, the contract preserves the alternatives or explicitly reports that context selection is unavailable.
- Context selection must be stable and deterministic for fixtures/tests.
- Context identity must not be used as a replacement for canonical PART identity.

## 8. Result states

The UI/API contract distinguishes at least:

| State | Meaning | UI behaviour |
|---|---|---|
| `empty` | No query/filter has been submitted | Show initial Concept View-1 state |
| `invalid` | One or more inputs fail validation | Show explicit validation state and identify the invalid control |
| `unsupported` | A requested criterion or combination is not implemented in the current runtime | Show explicit unsupported/unavailable state; do not ignore criteria |
| `not_found` | Valid criteria were searched but no result matched | Show explicit not-found state |
| `stock_filtered_empty` | Catalogue/text matches exist, but the stock-only filter removed all visible results | Show explicit no-visible-stock result state |
| `multiple_matches` | Criteria match multiple candidates | Show selectable candidate set; do not invent a single result |
| `resolved` | A PART/result and relevant context are resolved | Populate Concept View-1 |
| `context_unavailable` | PART/result resolved but EPC context is unavailable | Show PART/result and explicit unavailable context |
| `authorization_limited` | Matching stock-related data exists but cannot be exposed to the current user | Show an authorization-safe limited result or no-result state according to #448 |
| `error` | Resolution could not be completed | Show explicit error; do not fabricate data |

Exact API enum naming remains an implementation detail; the semantic states above are required.

## 9. Deterministic fixture requirements

The first implementation must be runnable without production/imported JEPC data.

Fixtures must include at minimum:

1. A valid Jaguar part number resolving to one canonical PART.
2. Lowercase, uppercase and mixed-case variants resolving to the same canonical PART.
3. A partial part-number query that resolves to one PART.
4. A partial part-number query that returns multiple candidates.
5. A canonical PART occurring in multiple EPC contexts.
6. A valid part number with no match.
7. Invalid/empty search input.
8. A PART with unavailable EPC context.
9. A resolved PART with enough context to populate the Parts Tree path.
10. A resolved PART with diagram/item context where available.
11. A free-word query matching approved fixture text.
12. A free-word query with no match.
13. A combined identifier + free-word query.
14. A stocked PART included when `Show only parts on stock` is active.
15. A catalogue PART excluded when `Show only parts on stock` is active and no visible stock availability exists.
16. An authorization-safe stock-limited case that does not expose restricted stock details.

Fixture identities and values must be clearly marked as deterministic test data and must not be presented as verified Jaguar catalogue facts unless separately sourced.

## 10. API/data boundary

The UI consumes a stable result contract. Conceptually:

```text
SearchControlsRequest
    part_query?
    free_text_query?
    stock_only: boolean
    user_context / authorization context

        ↓

SearchControlsResult
    state
    criteria
    applied_filters[]
    candidates[]
        result_type
        match_type[]
        canonical_part?
        stock_context?
        occurrence_contexts[]
        matched_text?
        matched_language?
        visible_availability?
        authorization_limit?
    selected_result?
    selected_occurrence/context?
    tree_path/context?
    diagram/item context when available
    fitment/suitability context when available
    explicit unavailable/error information
```

The exact serialization and technology are implementation decisions, but the domain/UI boundary remains stable.

The UI must not directly encode JEPC database structure or reproduce domain resolution logic in presentation components.

The UI may expose convenience view-model fields, but those fields must be derived from the approved API/data contract and must not redefine the Parts Data Model, stock model, authorization model or search-index semantics.

## 11. Concept View-1 integration

The first real implementation establishes the complete Concept View-1 page under #368 even where later capabilities remain placeholders.

For the part-number-first MVP priority:

- Search control is real.
- Search result state is real.
- Canonical PART resolution is real against deterministic fixture data initially.
- The Parts Tree area receives the resolved context and may initially render the relevant path from fixture data.
- Main View, Suitability Model Ranges, vehicle location, diagram/hotspot and other later-priority areas have permanent component positions and explicit placeholder/unavailable states rather than temporary throwaway mockup locations.

For the #634 search-control amendment:

- the search area must have a defined place for part-number search, free-word search and stock-only filtering;
- unsupported current-runtime capabilities must be displayed explicitly rather than hidden;
- adding free-word and stock-only controls must not force redesign of Concept View-1 layout;
- part-number-first fixture-backed MVP behavior must remain usable.

This ensures the first implementation PR establishes the final information architecture while later priorities progressively replace placeholders with real behaviour.

## 12. Error and unavailable semantics

- Missing data is not equivalent to a negative fitment result.
- No EPC occurrence is not equivalent to no catalogue PART.
- No diagram is not equivalent to no part.
- No vehicle-location mapping is not equivalent to no fitment.
- No visible stock availability is not equivalent to no catalogue match.
- Lack of authorization to see restricted stock details is not equivalent to absence of stock.
- Search failures must not silently fall back to guessed or partial identities.
- Unsupported free-word or stock-filter capability must be stated as unsupported/unavailable and must not be silently ignored.

## 13. Dependency boundary

This specification does not require completion of the entire Parts Data Model or JEPC importer before the first UI implementation can start.

The first implementation consumes the minimum approved read contract and deterministic fixtures. The authoritative domain model remains owned by #354 and source/import behaviour remains owned by #355.

Existing #368 guidance that the first UI PR should establish a small explicit read contract is incorporated here. The current #468 MVP entry point is the canonical part-number search; older alternative-entry sequencing does not replace that current MVP boundary.

The free-word search control is specified here as a UI/search contract, but the broader indexed multilingual implementation is owned by #622 and remains post-MVP unless separately approved.

The stock-only filter is specified here as a UI/search contract, but stock workflow/search semantics are owned by #613 and authorization by #448.

## Acceptance criteria

- [x] A deterministic part-number search contract is documented.
- [x] Search input normalization and validation behaviour are defined.
- [x] Canonical PART identity is separated from EPC occurrence/context identity.
- [x] Multiple EPC occurrences can be represented without duplicating the canonical PART.
- [x] Empty, invalid, not-found, resolved, context-unavailable and error states are explicitly defined.
- [x] Deterministic fixtures cover successful, ambiguous/multiple-context, not-found and unavailable-context cases.
- [x] The UI/API boundary prevents presentation code from redefining the Parts Data Model.
- [x] The specification provides the contract required for the next Parts Tree priority without redefining the domain model.
- [x] Implementation is linked to #368 and remains within the MVP boundary defined by #468.
- [x] The search-control area defines part-number search, free-word search and stock-only filtering as coordinated controls.
- [x] Part-number-only, free-word-only, combined-input and stock-filtered behaviors are specified.
- [x] Search result states include multiple-match, stock-filtered-empty, authorization-limited and unsupported/unavailable cases.
- [x] The stock-only filter is defined as a filter over approved stock availability/search semantics, not as catalogue data.
- [x] The free-word search control is linked to the post-MVP multilingual search architecture without making the current reduced MVP dependent on it.
- [x] The search-control amendment traces dependencies to #634, #618, #622, #613, #448 and #354.

## Implementation boundary

The implementation PR resulting from this specification should be titled with the required prefix:

`VIEPS UI / ...`

It must include automated tests, deterministic fixtures, and links to #472, #468, #368 and #354 as applicable.

The first implementation PR should establish the complete Concept View-1 page/shell with real search resolution and explicit placeholders/unavailable states for functionality belonging to later priorities.

Implementation of the #634 amendment must not silently expand the reduced MVP gate. Free-word search and stock-only filtering may be implemented incrementally, but their unavailable/unsupported states must remain explicit until real search/index and stock semantics are available.

## Out of scope

- Full Parts Tree implementation beyond the search result/context contract.
- Final diagram hotspot conversion (#352).
- Full vehicle-location mapping (#361/#362).
- Full fitment implementation beyond carrying the relevant context.
- Supersession/Classic integration.
- Full operational stock workflow implementation.
- Production JEPC import implementation (#355).
- Full global multilingual free-text search architecture and library selection (#622).
- Administrator stock-management UI implementation (#612/#613).

Those remain subsequent priorities/dependencies under #368, #468 and their dedicated Issues.

## Definition of done

The Part Search and Search Controls specification is implementation-ready when the search/result states, canonical PART versus occurrence/context boundary, deterministic fixtures, coordinated search controls, stock-only filtering behavior and UI/API contract are sufficiently explicit that a #368 implementation PR can implement the search area without making a new domain-model, stock-model, authorization or free-text architecture decision.
