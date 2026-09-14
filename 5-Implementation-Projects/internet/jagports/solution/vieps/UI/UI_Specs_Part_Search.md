# VIEPS UI — Search Controls Specification

## Status

This document is the durable implementation-level specification for the VIEPS search-control area.

The original #468 / #472 part-search contract remains part of this specification, but the user-facing search area is now simplified around one primary search text box and one stock-quality filter control.

**Controlling UI specification:** #468 — VIEPS UI / Concept View-1 — Updated MVP UI specification  
**Implementation parent:** #368 — VIEPS UI / Implement MVP Web UI  
**Domain/data dependency:** #354 — Define and implement Parts Data Model  
**Original specification work record:** #472 — VIEPS UI / Specification — Part search resolution and UI data contract  
**Identifier-search amendment:** #618 — VIEPS UI / Make part-number search partial and case-insensitive  
**Search-control amendment:** #634 — SPEC / VIEPS UI search controls: add free-word search and stock-only filter  
**Free-text architecture owner:** #622 — SPEC / [post-MVP] Implement multilingual free-text search across JEPC and stock data  
**Stock workflow/search owner:** #613 — VIEPS Stock / Specify operational stock workflow  
**Authorization boundary:** #448 — Implement public VIEPS access with administrator stock authorization

## Search-control decision

The VIEPS search area uses:

1. One primary text box labeled `Part number or free text`.
2. One search action applying the text query and stock filter together.
3. One stock-quality multi-selection dropdown labeled `Show only stock parts`.

The UI must not expose separate competing text boxes for part-number search and free-word search.

The search execution order is fixed:

```text
query entered
      ↓
normalize and validate query
      ↓
search part-number / identifier index first
      ↓
part-number match exists?
      ├── yes → return identifier-search result candidates
      └── no  → run free-text search over the approved available database search index
                  ↓
              return free-text result candidates
```

Free-text search is therefore a fallback discovery path when the part-number / identifier index has no match. It is not a parallel path that weakens, overrides or competes with identifier lookup.

## Target flow

```text
USER ENTERS SEARCH CRITERIA
        │
        ├── text query: "Part number or free text"
        └── stock-quality filter: "Show only stock parts" A...E
        │
        ▼
NORMALIZE / VALIDATE CRITERIA
        │
        ├── empty query → initial Concept View-1 state or stock-browse state if supported
        ├── invalid query → explicit validation state
        └── invalid stock-quality selection → explicit validation state
        │
        ▼
IDENTIFIER-FIRST SEARCH
        │
        ├── part-number / identifier match found
        │       └── return canonical PART candidates from identifier path
        │
        └── no identifier match
                └── run free-text search over approved searchable index
        │
        ▼
APPLY STOCK-QUALITY FILTER
        │
        ├── selected quality categories A...E define visible stocked-result scope
        ├── non-stocked or non-visible stock results are excluded when the filter applies
        └── authorization-sensitive stock fields remain hidden
        │
        ▼
RESOLVE RESULT IDENTITY
        │
        ├── one canonical PART → populate Concept View-1
        ├── multiple candidates → show selectable results
        ├── unresolved stock record → show only through authorized stock-result contract
        ├── no result → explicit not-found or stock-filtered-empty state
        └── unavailable capability → explicit unsupported/unavailable state
```

## 1. Primary query field

The visible label for the search text box is:

```text
Part number or free text
```

The field accepts either:

- a Jaguar part number or other approved part identifier;
- ordinary text intended for discovery across the approved search index.

The UI must preserve the user's original entered value for UI state, repeatability and error reporting.

The backend or API may store a normalized lookup value, but the normalized value must remain distinguishable from the user's original input.

## 2. Identifier-first behavior

The first search path is always the part-number / identifier index.

Identifier search must support the behavior required by #618:

- leading and trailing whitespace are ignored;
- lookup is case-insensitive;
- exact full part-number lookup continues to work;
- partial part-number input is supported where the known fixture/catalogue data contains matching PART identifiers;
- multiple identifier matches return a selectable candidate state;
- no Jaguar part number is guessed or fabricated from partial input.

When identifier-search candidates exist, the UI/API returns those candidates and does not continue to free-text fallback for the same submitted query.

Exact identifier matches should be ranked ahead of partial identifier matches where both are returned by the identifier path.

## 3. Free-text fallback behavior

Free-text search runs only when the identifier search path returns no part-number / identifier match.

The fallback searches the approved available database search index for ordinary text matches. Candidate searchable content may include, subject to #622 and authorization boundaries:

- multilingual JEPC part names and descriptions;
- category, group, item and catalogue text;
- model/range labels where useful;
- approved stock text fields;
- approved source/provenance or reference text where useful.

Free-text search must resolve catalogue/reference matches to stable canonical VIEPS entities where possible.

A localized JEPC text match must not create a language-specific duplicate `PART`. It must retain matched-language/source context while resolving to the canonical entity.

A free-text match must not invent a Jaguar part number. If no canonical catalogue identity exists and a result is an unresolved stock record, the result must be explicitly typed as unresolved stock and shown only where authorized.

The full multilingual free-text indexing architecture, library selection and benchmark evidence remain owned by #622. This document defines how the UI consumes the search capability when available.

## 4. `Show only stock parts` multi-selection dropdown

The stock filter control is a multi-selection dropdown labeled:

```text
Show only stock parts
```

The dropdown lists stock quality categories `A` through `E` with descriptions.

Default selection:

```text
A, B, C, D, E
```

Default all selected means all approved visible stocked parts are included regardless of quality category. It does not mean that non-stocked catalogue-only parts are stock records.

The UI must show both the category code and a short description. The implementation must consume the approved stock-quality descriptions from the stock model/workflow when available.

Initial descriptive labels for the UI contract are:

| Category | UI description |
|---|---|
| `A` | New, unused or excellent |
| `B` | Good used |
| `C` | Usable with wear |
| `D` | Repairable or poor |
| `E` | Core, incomplete or for parts |

If #613 or another approved stock source defines different authoritative descriptions, those approved descriptions replace the initial UI labels without changing the search-control structure.

The selected categories define the included stock-quality set. A result with stock outside the selected categories is excluded from stock-filtered results.

An empty category selection must be handled explicitly. The implementation may either prevent deselecting the final category or show a validation/no-selected-quality state. It must not silently treat empty selection as all selected.

## 5. Stock/catalogue separation

The stock-quality dropdown filters operational stock results. It must not mutate or redefine catalogue/reference records.

The UI must keep these concepts separate:

```text
CATALOGUE / JEPC PART FACTS
        │
        └── canonical PART identity, description, occurrence, fitment, diagram, supersession

JAGPORTS STOCK FACTS
        │
        └── stock presence, quantity, quality category, condition/status, storage, notes, availability
```

A canonical `PART` may be returned with visible stock availability when stock exists and the current user is authorized to see the relevant stock indication.

A stock record linked to a canonical `PART` must not overwrite catalogue identity, description, fitment or supersession data.

An unresolved stock item may be returned only as an explicitly unresolved stock result. It must not be fabricated into a canonical Jaguar catalogue part.

## 6. Authorization behavior

Search results must obey #448.

The search index and UI must not expose restricted stock text, storage locations, notes, administrator-only fields or other non-public operational information to unauthorized users.

The `Show only stock parts` filter may expose public-visible availability only where the authorization model permits that.

When matching stock-related data exists but cannot be shown to the current user, the result must use an authorization-safe state or omit restricted details. Lack of authorization must not be presented as verified absence of stock.

## 7. Result states

The UI/API contract distinguishes at least these semantic states:

| State | Meaning | UI behavior |
|---|---|---|
| `empty` | No query has been submitted | Show initial Concept View-1 state, or stock-browse state if separately supported |
| `invalid` | Query or stock-quality selection fails validation | Identify the invalid criterion |
| `unsupported` | Requested free-text or stock-filter capability is unavailable in the current runtime | Show explicit unsupported/unavailable state; do not silently ignore criteria |
| `not_found` | Valid query produced no identifier or free-text match | Show explicit not-found state |
| `stock_filtered_empty` | Search matches exist, but selected stock-quality categories remove all visible results | Show explicit no-visible-stock result state |
| `multiple_matches` | Search produces multiple candidates | Show selectable candidate results; do not invent one selected PART |
| `resolved` | One result and relevant context are resolved | Populate Concept View-1 |
| `context_unavailable` | PART/result resolved but EPC occurrence/context is unavailable | Show result plus explicit unavailable context |
| `authorization_limited` | Matching stock-related data exists but cannot be exposed to the current user | Show an authorization-safe limited state |
| `error` | Search could not be completed | Show explicit error; do not fabricate data |

Exact API enum names may differ, but the semantics above are required.

## 8. Canonical PART and occurrence/context resolution

A successful identifier or catalogue free-text result resolves to one canonical catalogue `PART` identity where a catalogue identity exists.

The UI must not create or duplicate a catalogue part because it appears in:

- multiple EPC contexts;
- multiple diagrams;
- multiple model/range applications;
- multiple source languages;
- multiple stock records.

A canonical `PART` may occur in multiple EPC contexts. The search result therefore separates:

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

Multiple valid occurrences must remain distinguishable. If the available data cannot deterministically choose one occurrence, the result must preserve the alternatives or show explicit context-unavailable behavior.

## 9. API/data boundary

The UI consumes a stable result contract. Conceptually:

```text
SearchControlsRequest
    query
    stock_quality_categories: [A|B|C|D|E]
    user_context / authorization context

        ↓

SearchControlsResult
    state
    original_query
    normalized_query?
    search_path: identifier | free_text | unsupported
    selected_stock_quality_categories[]
    applied_filters[]
    candidates[]
        result_type: canonical_part | stock_record | unresolved_stock
        match_type: exact_identifier | partial_identifier | free_text | stock_quality_filtered
        canonical_part?
        stock_context?
        stock_quality_category?
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

The UI may expose convenience view-model fields, but those fields must be derived from the approved API/data contract and must not redefine the Parts Data Model, stock model, authorization model or search-index semantics.

## 10. Deterministic fixture requirements

The first implementation must be runnable without production/imported JEPC data.

Fixtures must include at minimum:

1. A valid Jaguar part number resolving to one canonical `PART`.
2. Lowercase, uppercase and mixed-case variants resolving to the same canonical `PART`.
3. A partial part-number query that resolves to one `PART`.
4. A partial part-number query that returns multiple candidates.
5. A query with no identifier match that falls back to free-text and returns a result.
6. A query with no identifier match and no free-text match.
7. A canonical `PART` occurring in multiple EPC contexts.
8. A `PART` with unavailable EPC context.
9. A resolved `PART` with enough context to populate the Parts Tree path.
10. A resolved `PART` with diagram/item context where available.
11. A stocked `PART` in each quality category `A` through `E` or an explicit fixture limitation explaining unavailable categories.
12. A stock-quality-filtered result that includes a selected category.
13. A stock-quality-filtered result that excludes an unselected category.
14. A stock-filtered-empty case.
15. An authorization-safe stock-limited case that does not expose restricted stock details.
16. An unresolved/non-catalogue stock item shown only as unresolved stock where authorized.

Fixture values must be clearly marked as deterministic test data and must not be presented as verified Jaguar catalogue facts unless separately sourced.

## 11. Concept View-1 integration

The search-control area remains part of the Concept View-1 page under #368.

The implementation must preserve the existing page structure:

- Search controls remain at the top or equivalent primary search area.
- Parts Tree receives the resolved canonical PART and occurrence/context where available.
- Main View receives the selected result/context where available.
- Suitability Model Ranges receives the resolved PART/context where available.
- Missing or unsupported data is represented explicitly, not with fabricated placeholders.

The revised controls must not force a redesign of the whole VIEPS layout or theme.

## 12. Dependency and MVP boundary

The part-number-first path remains the current reduced MVP path.

The single text field and identifier-first behavior may be implemented for the MVP using deterministic fixture data.

Free-text search over the full multilingual imported JEPC/stock corpus remains post-MVP under #622 unless separately approved for the MVP.

The `Show only stock parts` quality filter depends on approved stock workflow/search semantics under #613 and authorization behavior under #448.

Unsupported current-runtime capabilities must be displayed as unsupported/unavailable until the required backend/index/stock capability exists.

## 13. Out of scope

- Full Parts Tree implementation beyond consuming the resolved result/context.
- Final diagram hotspot conversion (#352).
- Full vehicle-location mapping (#361/#362).
- Full fitment implementation beyond carrying the relevant context.
- Supersession/Classic integration.
- Full operational stock workflow implementation.
- Production JEPC import implementation (#355).
- Full global multilingual free-text search architecture and library selection (#622).
- Administrator stock-management UI implementation (#612/#613).
- Any redesign of the VIEPS visual theme or whole layout.

## Acceptance criteria

- [x] The search-control area is specified as one primary text box labeled `Part number or free text`.
- [x] Identifier search is specified as the first search path.
- [x] Free-text search is specified as fallback only when identifier search finds no part-number / identifier match.
- [x] Exact, case-insensitive and partial identifier behavior from #618 remains preserved.
- [x] Multiple identifier or free-text matches return selectable candidates rather than an invented selected PART.
- [x] The stock filter is specified as a multi-selection dropdown labeled `Show only stock parts`.
- [x] Stock quality categories `A` through `E` are listed with UI descriptions.
- [x] The stock-quality default is all categories selected.
- [x] Empty stock-quality selection behavior is explicit and cannot silently mean all selected.
- [x] Search result states include invalid, unsupported, not-found, stock-filtered-empty, multiple-match, resolved, context-unavailable, authorization-limited and error cases.
- [x] Search results preserve canonical PART identity and do not create duplicate catalogue entities from localized/free-text matches.
- [x] Stock-only filtering respects stock/catalogue separation and the authorization boundary.
- [x] The specification traces dependencies to #634, #618, #622, #613, #448 and #354.
- [x] The amendment does not expand the current reduced MVP gate unless a separate decision approves that scope change.

## Implementation boundary

The implementation PR resulting from this specification should be titled with the required prefix:

```text
VIEPS UI / ...
```

It must include automated tests or documented validation appropriate to the implementation scope, deterministic fixtures where runtime behavior is added, and links to #634, #472, #468, #368 and #354 as applicable.

Documentation-only amendments may be validated by review and repository checks. Runtime behavior changes require automated tests for the affected search paths.

## Definition of done

The Search Controls specification is implementation-ready when a #368 implementation PR can build the search area using one `Part number or free text` input, identifier-first lookup, free-text fallback, and the `Show only stock parts` quality dropdown without making a new domain-model, stock-model, authorization or search-index architecture decision.
