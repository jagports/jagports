# VIEPS UI — Part Search Specification

## Status
This document defines VIEPS search resolution and its UI/data contract.

**Controlling UI specification:** #468  
**Implementation parent:** #368  
**Domain/data dependency:** #354  
**Specification work record:** #472

The placement authority is the Concept-11 SVG merged by PR #645 and the normative map in `UI_Specs.md`.

## Search / Availability placement
Concept-11 places Search + Availability in the top workspace to the right of the branding/instructions/language block.

```text
BRANDING / LANGUAGE | SEARCH + AVAILABILITY
                    | Search: [ identifier ] [Search]
                    | Availability: [ stock quality A…E ▼ ]
```

Availability remains operational stock state, separate from catalogue identity. When unsupported by the approved stock browse contract it must remain disabled/unavailable rather than simulated.

## Search input
- Primary entry point is Jaguar part-number search.
- Approved deterministic non-numbered identifiers may also be accepted where the current read contract supports them.
- Current main-branch fixtures `firtree1` and `firtree2` are descriptive fixture identifiers, **not Jaguar part numbers**.
- Leading/trailing whitespace is ignored.
- Part-number matching is case-insensitive; canonical value comes from catalogue data.
- Original entered value remains available for UI/error reporting.
- Do not silently invent or normalize unsupported punctuation/characters.
- Empty/clearly invalid input produces an explicit state, not a guessed identity.

## Canonical PART and occurrence resolution
A successful Jaguar part-number lookup resolves one canonical `PART` identity. A non-numbered supported identifier resolves the approved non-numbered item/context without fabricating a Jaguar number.

A canonical PART may occur in multiple EPC contexts:

```text
PART
  └── OCCURRENCE / CONTEXT
        ├── vehicle/model context
        ├── Parts Tree path
        ├── diagram/item context
        └── applicability/qualifiers
```

Multiple occurrences remain distinguishable and do not duplicate canonical PART identity.

## Result states
| State | Meaning |
|---|---|
| `empty` | No search submitted; permanent Concept-11 shell remains visible |
| `invalid` | Identifier fails validation |
| `not_found` | Valid search has no supported match |
| `resolved` | Identity/context resolved |
| `context_unavailable` | Identity resolved but secondary EPC context unavailable |
| `error` | Processing/API failure |

## Result distribution into merged Concept-11
```text
resolved identity/context
   ├── Parts Tree main-level index + relevant path(s)
   ├── Suitability Model Ranges row
   ├── Location at car (left-middle)
   ├── Suitability / Filter or facts (right-middle)
   └── PART / Image / Status (full lower centre/right)
```

Missing secondary data stays as an explicit unavailable state in its permanent region.

## Empty-search stock browsing
The merged SVG states that when Search is empty, a supported Availability/quality constraint may update both the Parts Tree and Model Ranges to contexts represented by matching stock.

That behavior is valid only when an approved stock/catalogue browse contract resolves stock through canonical catalogue/fitment relationships. The illustrated A–E stock qualities are not defined by the artwork itself.

## API/data boundary
```text
PartSearchRequest
  query

PartSearchResult
  state
  canonical_part? / approved non-numbered identity?
  occurrences[]
  selected_occurrence/context
  tree context
  diagram/item context when available
  fitment/suitability context when available
  unavailable/error information
```

Presentation code must not encode JEPC database structure or reconstruct domain resolution logic.

## Deterministic fixtures
Cover at least:
- valid Jaguar part number;
- multiple EPC occurrences;
- valid no-match;
- invalid/empty input;
- unavailable EPC context;
- tree context;
- diagram/item context where available;
- non-numbered fixture identifiers including `firtree1` and `firtree2`.

Fixture values are test data, not verified Jaguar catalogue facts.

## Viewport and language
The default desktop shell retains #616 viewport-fit behavior. Search/Availability/status UI text follows #554 before final post-MVP approval. Parts/catalogue-data language remains independently selectable under #620, matching the separate `[UI]` and `[Parts]` language concerns drawn in Concept-11. This search spec does not implement a parallel localization mechanism.

## Error/unavailable semantics
- Missing context is not no PART.
- Missing image/diagram/location is not no PART.
- Missing fitment evidence is not a negative match unless the applicability contract says so.
- Missing Availability support is not zero stock.
- Search failures do not fall back to guessed identities.

## Acceptance criteria
- [x] Search/result states and canonical identity boundaries are documented.
- [x] Multiple EPC occurrences remain distinct from canonical PART identity.
- [x] Non-numbered fixture identifiers are not presented as Jaguar part numbers.
- [x] Search/Availability placement follows merged Concept-11.
- [x] Result distribution follows the corrected Model Ranges / Location / Suitability / PART geometry.
- [x] Unsupported stock-driven empty-search behavior is not fabricated.
- [x] UI-vs-Parts language separation is preserved.
- [x] Presentation does not redefine the Parts Data Model.
