# VIEPS UI — Part Search Specification

## Status

This document is the durable implementation-level specification for VIEPS PART search resolution and its UI/data contract.

**Controlling UI specification:** #468  
**Implementation parent:** #368  
**Domain/data dependency:** #354  
**Specification work record:** #472  

The current placement authority is the **Concept-11 ASCII map in `UI_Specs.md`**, derived from `VIEPS UI-Concept-11.svg` reviewed in PR #645.

## Target flow

```text
USER ENTERS JAGUAR PART NUMBER
        │
        ▼
NORMALIZE / VALIDATE SEARCH INPUT
        │
        ├── invalid → explicit validation/error state
        │
        ▼
RESOLVE CANONICAL PART
        │
        ├── no match → explicit not-found state
        │
        ▼
RESOLVE RELEVANT EPC OCCURRENCE / CONTEXT
        │
        ├── one context → select it
        ├── multiple contexts → preserve/display applicable contexts
        └── no context → explicit unavailable-context state
        │
        ▼
STABLE UI/API RESULT
        │
        ├── canonical PART identity
        ├── selected OCCURRENCE / CONTEXT where available
        ├── Parts Tree path/context
        ├── diagram/item context where available
        └── suitability/fitment context where available
        │
        ▼
CONCEPT-11 PAGE
```

## Concept-11 Search / Availability region

Concept-11 places Search in the top-centre workspace together with an adjacent Availability/stock constraint concern.

```text
SEARCH / AVAILABILITY
Search:       [ part number / supported identifier ] [Search]
Availability: [ supported stock qualities/status ▼ ]
Status:       [ search/result/constraint state ]
```

Canonical PART search and operational availability filtering remain separate contracts:

- entering a PART number resolves canonical catalogue identity;
- an availability/quality constraint is operational stock state and must not mutate PART identity;
- stock-driven empty-search browsing is permitted only when an approved stock/catalogue query contract can resolve stock records through canonical PART references into Parts Tree and model/range context;
- until such a contract exists, the Availability control/state must be disabled, unavailable or omitted rather than simulated.

## 1. Search input

- The primary search entry point is a Jaguar part-number search.
- Search input is treated as an identifier, not arbitrary natural-language search unless a separately approved search specification extends it.
- Leading/trailing whitespace is ignored.
- Part-number matching is case-insensitive for lookup; the resolved canonical value is returned from catalogue data.
- The user's original entered value is retained separately from the normalized lookup value for UI/error reporting.
- Internal punctuation or characters are not silently removed or rewritten unless an approved source-specific normalization rule establishes that behaviour.
- Validation rejects clearly invalid/empty input without inventing a part identity.

## 2. Canonical PART resolution

- A successful search resolves to one canonical catalogue `PART` identity from the approved Parts Data Model.
- The UI must not create or duplicate a catalogue part merely because it appears in multiple EPC contexts.
- Part description/name and other catalogue attributes come from the resolved PART/data contract rather than being independently reconstructed by the UI.
- A search result retains enough stable identity to be passed to Parts Tree, Main View, Suitability and fitment operations.
- Unresolved input remains unresolved; no guessed Jaguar part number is permitted.
- The canonical identity is the data-model identity, not merely the search string.

## 3. EPC occurrence/context resolution

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
- If available data cannot deterministically choose one occurrence, the contract preserves alternatives or explicitly reports that context selection is unavailable.
- Context selection must be stable and deterministic for fixtures/tests.
- Context identity must not replace canonical PART identity.

## 4. Result states

The UI/API contract distinguishes at least:

| State | Meaning | UI behaviour |
|---|---|---|
| `empty` | No search submitted | Show permanent Concept-11 shell and supported browse/unavailable state |
| `invalid` | Input fails identifier validation | Show explicit validation state |
| `not_found` | Valid search but no canonical PART match | Show explicit not-found state |
| `resolved` | PART and relevant context resolved | Populate Concept-11 regions |
| `context_unavailable` | PART resolved but EPC context unavailable | Show PART and explicit unavailable context |
| `error` | Resolution could not be completed | Show explicit error; do not fabricate data |

Exact API enum naming remains an implementation detail; the semantic states above are required.

## 5. Concept-11 result distribution

A resolved result populates the permanent regions without changing their placement:

```text
canonical PART
   ├── relevant EPC occurrence/path      → Parts Tree
   ├── applicable model/ranges           → Suitability Model Ranges
   ├── VIN/feature qualifiers            → Suitability / Filter or facts
   ├── verified vehicle location         → Location at car
   └── identity/status/image/diagram     → PART / IMAGE / STATUS
```

Missing secondary data produces explicit unavailable states inside those permanent regions.

## 6. Deterministic fixture requirements

Fixtures must include at minimum:

1. A valid Jaguar part number resolving to one canonical PART.
2. A canonical PART occurring in multiple EPC contexts.
3. A valid part number with no match.
4. Invalid/empty search input.
5. A PART with unavailable EPC context.
6. A resolved PART with enough context to populate the Parts Tree path.
7. A resolved PART with diagram/item context where available.

Fixture identities and values must be clearly marked as deterministic test data and must not be presented as verified Jaguar catalogue facts.

## 7. API/data boundary

```text
PartSearchRequest
    query

        ↓

PartSearchResult
    state
    canonical_part
    occurrences[]
    selected_occurrence/context
    tree_path/context
    diagram/item context when available
    fitment/suitability context when available
    explicit unavailable/error information
```

The exact serialization and technology are implementation decisions, but the domain/UI boundary remains stable.

The UI must not directly encode JEPC database structure or reproduce domain resolution logic in presentation components.

## 8. Permanent shell, viewport and i18n

Search is real while other Concept-11 regions may initially use explicit placeholders/unavailable states. Later priorities replace those states through the same positions and contracts.

On the default desktop layout, PR #616 viewport-fit behaviour is preserved: the page itself remains fitted while permanent regions scroll internally as needed. Narrower layouts may reflow and use normal page scrolling.

All user-facing Search/Availability/status text must consume the approved #554 i18n contract before final post-MVP approval and tolerate variable-length localized strings. JEPC catalogue-data language remains independently selectable under #620.

## 9. Error and unavailable semantics

- Missing data is not equivalent to a negative fitment result.
- No EPC occurrence is not equivalent to no catalogue PART.
- No diagram is not equivalent to no part.
- No vehicle-location mapping is not equivalent to no fitment.
- Search failures must not silently fall back to guessed or partial identities.
- Missing stock/availability support must not be represented as zero stock unless the operational contract explicitly establishes that fact.

## Dependency boundary

This specification does not require completion of the entire Parts Data Model or JEPC importer before deterministic UI implementation can proceed.

The implementation consumes the minimum approved read contract and deterministic fixtures. Domain identity remains owned by #354 and source/import behaviour by #355.

## Acceptance criteria

- [x] A deterministic part-number search contract is documented.
- [x] Search input normalization and validation behaviour are defined.
- [x] Canonical PART identity is separated from EPC occurrence/context identity.
- [x] Multiple EPC occurrences can be represented without duplicating canonical PART.
- [x] Empty, invalid, not-found, resolved, context-unavailable and error states are explicitly defined.
- [x] Concept-11 result distribution is defined against permanent UI regions.
- [x] Availability/stock constraints are kept separate from canonical PART search semantics.
- [x] Unsupported stock-driven empty-search behaviour is not fabricated.
- [x] Viewport-fit and i18n-safe presentation constraints are documented.
- [x] The UI/API boundary prevents presentation code from redefining the Parts Data Model.

## Out of scope

- Full Parts Tree implementation beyond the search result/context contract.
- Final diagram hotspot conversion (#352).
- Full vehicle-location mapping (#361/#362).
- Full fitment implementation beyond carrying relevant context.
- Supersession/Classic implementation.
- Operational stock query/browse implementation beyond defining its separation from PART search.
- Production JEPC import implementation (#355).

## Definition of done

The Part Search specification is implementation-ready when search/result states, canonical PART versus occurrence/context boundaries, fixtures and the UI/API contract are sufficiently explicit that implementation can populate the Concept-11 shell without making a new domain-model decision.
