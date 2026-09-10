# VIEPS UI — Part Search Specification

## Status

This document is the durable implementation-level specification for the first active VIEPS UI priority from Issue #468:

> Part search resolves a canonical part and relevant occurrence/context.

**Controlling UI specification:** #468 — VIEPS UI / Concept View-1 — Updated MVP UI specification  
**Implementation parent:** #368 — VIEPS UI / Implement MVP Web UI  
**Domain/data dependency:** #354 — Define and implement Parts Data Model  
**Specification work record:** #472 — VIEPS UI / Specification — Part search resolution and UI data contract

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
        ├── multiple contexts → preserve/display the applicable context
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
CONCEPT VIEW-1 PAGE
```

## 1. Search input

- The MVP search entry point is a Jaguar part-number search.
- Search input is treated as an identifier, not arbitrary natural-language search.
- Leading/trailing whitespace is ignored.
- Part-number matching is case-insensitive for lookup; the resolved canonical value is returned from the catalogue data.
- The user's original entered value is retained separately from the normalized lookup value for UI/error reporting.
- Internal punctuation or characters are not silently removed or rewritten unless an approved source-specific normalization rule establishes that behaviour.
- Validation rejects clearly invalid/empty input without inventing a part identity.

## 2. Canonical PART resolution

- A successful search resolves to one canonical catalogue `PART` identity from the approved Parts Data Model.
- The UI must not create or duplicate a catalogue part merely because it appears in multiple EPC contexts.
- Part description/name and other catalogue attributes come from the resolved PART/data contract rather than being independently reconstructed by the UI.
- A search result retains enough stable identity to be passed to subsequent Parts Tree, Main View, Suitability and fitment operations.
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
- If the available MVP data cannot deterministically choose one occurrence, the contract preserves the alternatives or explicitly reports that context selection is unavailable.
- Context selection must be stable and deterministic for fixtures/tests.
- Context identity must not be used as a replacement for canonical PART identity.

## 4. Result states

The UI/API contract distinguishes at least:

| State | Meaning | UI behaviour |
|---|---|---|
| `empty` | No search submitted | Show initial Concept-1 state |
| `invalid` | Input fails identifier validation | Show explicit validation state |
| `not_found` | Valid search but no canonical PART match | Show explicit not-found state |
| `resolved` | PART and relevant context resolved | Populate Concept-1 |
| `context_unavailable` | PART resolved but EPC context is unavailable | Show PART and explicit unavailable context |
| `error` | Resolution could not be completed | Show explicit error; do not fabricate data |

Exact API enum naming remains an implementation detail; the semantic states above are required.

## 5. Deterministic fixture requirements

The first implementation must be runnable without production/imported JEPC data.

Fixtures must include at minimum:

1. A valid Jaguar part number resolving to one canonical PART.
2. A canonical PART occurring in multiple EPC contexts.
3. A valid part number with no match.
4. Invalid/empty search input.
5. A PART with unavailable EPC context.
6. A resolved PART with enough context to populate the Parts Tree path.
7. A resolved PART with diagram/item context where available.

Fixture identities and values must be clearly marked as deterministic test data and must not be presented as verified Jaguar catalogue facts.

## 6. API/data boundary

The UI consumes a stable result contract. Conceptually:

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

## 7. Concept View-1 integration

The first real implementation establishes the complete Concept View-1 page under #368 even where later capabilities remain placeholders.

For this priority:

- Search control is real.
- Search result state is real.
- Canonical PART resolution is real against deterministic fixture data initially.
- The Parts Tree area receives the resolved context and may initially render the relevant path from fixture data.
- Main View, Suitability Model Ranges, vehicle location, diagram/hotspot and other later-priority areas have permanent component positions and explicit placeholder/unavailable states rather than temporary throwaway mockup locations.

This ensures the first implementation PR establishes the final information architecture while later priorities progressively replace placeholders with real behaviour.

## 8. Error and unavailable semantics

- Missing data is not equivalent to a negative fitment result.
- No EPC occurrence is not equivalent to no catalogue PART.
- No diagram is not equivalent to no part.
- No vehicle-location mapping is not equivalent to no fitment.
- Search failures must not silently fall back to guessed or partial identities.

## 9. Dependency boundary

This specification does not require completion of the entire Parts Data Model or JEPC importer before the first UI implementation can start.

The first implementation consumes the minimum approved read contract and deterministic fixtures. The authoritative domain model remains owned by #354 and source/import behaviour remains owned by #355.

Existing #368 guidance that the first UI PR should establish a small explicit read contract is incorporated here. The current #468 MVP entry point is the canonical part-number search; older alternative-entry sequencing does not replace that current MVP boundary.

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

## Implementation boundary

The implementation PR resulting from this specification should be titled with the required prefix:

`VIEPS UI / ...`

It must include automated tests, deterministic fixtures, and links to #472, #468, #368 and #354 as applicable.

The first implementation PR should establish the complete Concept View-1 page/shell with real search resolution and explicit placeholders/unavailable states for functionality belonging to later priorities.

## Out of scope

- Full Parts Tree implementation beyond the search result/context contract.
- Final diagram hotspot conversion (#352).
- Full vehicle-location mapping (#361/#362).
- Full fitment implementation beyond carrying the relevant context.
- Supersession/Classic integration.
- Operational stock integration.
- Production JEPC import implementation (#355).

Those remain subsequent priorities/dependencies under #368 and #468.

## Definition of done

The Part Search specification is implementation-ready when the search/result states, canonical PART versus occurrence/context boundary, deterministic fixtures and UI/API contract are sufficiently explicit that the first #368 implementation PR can implement the search without making a new domain-model decision.
