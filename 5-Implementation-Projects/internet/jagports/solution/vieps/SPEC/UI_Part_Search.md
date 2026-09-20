# VIEPS UI — Part Search Specification

## Status
This document defines VIEPS search resolution and its UI/data contract.

Durable specification authorities:

- [`../UI/UI_Specs.md`](../UI/UI_Specs.md) — controlling VIEPS UI information architecture and layout contract.
- [`MODEL_PART.md`](MODEL_PART.md) — canonical PART, occurrence/context and catalogue/reference identity.
- [`MODEL_STOCK.md`](MODEL_STOCK.md) — operational stock model and normalized stock-quality contract.
- [`../i18n/README.md`](../i18n/README.md) — VIEPS UI translation-resource contract and canonical resource path.

The placement authority is the Concept-11 SVG under `../UI_CONCEPTS/` together with the normative map in `../UI/UI_Specs.md`.

## Search / Availability placement
Concept-11 places Search + Availability in the top workspace to the right of the branding/instructions/language block.

```text
BRANDING / LANGUAGE | SEARCH + AVAILABILITY
                    | Search: [ identifier ] [Search]
                    | Availability: [ stock quality A…E ▼ ]
```

Availability remains operational stock state, separate from catalogue identity. When unsupported by the approved stock browse contract it must remain disabled/unavailable rather than simulated.

## Stock-quality filter and presentation contract

Stock-quality filtering and available-part presentation consume the normalized operational-stock contract from [`MODEL_STOCK.md`](MODEL_STOCK.md).

The stable classified filter identities are:

```text
A
B
C
D
E
```

`condition_code = NULL` is the explicit unclassified quality state. It is not a sixth quality class and must not be silently mapped to A–E or treated as unavailable stock.

Search/filter logic uses normalized codes as identity. Human-facing wording is resolved through semantic i18n resources, including:

```text
stock.quality.A.*
stock.quality.B.*
stock.quality.C.*
stock.quality.D.*
stock.quality.E.*
stock.quality.unclassified.*
```

The UI must not hard-code English or Finnish quality wording as domain identity.

When a stocked/available result is shown and the current authorization level permits stock-quality details, presentation must include:

- the normalized stock-quality code when classified;
- the localized quality label;
- a localized short description, with long description/help available where the UI provides explanatory detail;
- the explicit localized unclassified state when `condition_code IS NULL`.

Static help/explanation for A–E meanings must be available somewhere in the VIEPS UI before users are expected to interpret stock-quality filtering or available-part quality. The explanation must consume the same i18n resources rather than define a second wording/taxonomy.

If stock quality is unavailable, unresolved, or hidden by authorization, the UI must show an explicit state. It must not fabricate a confirmed A–E class.

Authorization-safe result states include at least:

- quality classified and visible;
- quality unclassified and visible;
- quality unavailable/unresolved;
- quality present but restricted from the current user.

Restricted stock details must not leak through filter labels, result snippets, help text, API-derived presentation, or alternate result paths.

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
        ├── complete catalogue/tree path
        ├── source language/tree scope
        ├── vehicle/model context
        ├── diagram/item context
        └── applicability/qualifiers
```

A part-number search returns all matching occurrences and their complete source paths. Multiple occurrences remain distinguishable and do not duplicate canonical PART identity.

## Occurrence-first tree filtering

Catalogue browsing and source-description filters operate on occurrences first:

```text
selected Parts Tree branch
    -> all source occurrences below the branch
    -> optional description / VIN / applicability filters
    -> surviving occurrences
    -> distinct visible PARTs
```

A PART remains visible while at least one occurrence survives. The UI must not merge all occurrence paths into one synthetic applicability path.

Imported JEPC descriptions may be presented as filter candidates. Normalized semantic facets derived from those descriptions are a separate enrichment layer; the UI/API must not treat the facet label as the source-tree identity.

Language-specific JEPC tree structure may differ. Catalogue-data language selection therefore chooses among imported source-language tree contexts rather than assuming that UI translation resources translate one fixed source tree.

## Result states
| State | Meaning |
|---|---|
| `empty` | No search submitted; permanent Concept-11 shell remains visible |
| `invalid` | Identifier fails validation |
| `not_found` | Valid search has no supported match |
| `resolved` | Identity/context resolved |
| `context_unavailable` | Identity resolved but secondary EPC context unavailable |
| `error` | Processing/API failure |

Stock-quality presentation may additionally distinguish explicit stock-detail states such as classified, unclassified, unavailable/unresolved, and authorization-limited without changing canonical PART result identity.

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

When stock-quality filtering is supported, filter identity is the normalized `A` through `E` code set defined by [`MODEL_STOCK.md`](MODEL_STOCK.md); localized labels/descriptions remain presentation only. An explicit unclassified state may be filterable when supported by the stock query contract, using `NULL` semantics rather than inventing a placeholder code.

## API/data boundary
```text
PartSearchRequest
  query
  stock_quality_codes[]?   # normalized A-E identities when supported
  include_unclassified_quality? # explicit NULL-state filter when supported

PartSearchResult
  state
  canonical_part? / approved non-numbered identity?
  occurrences[]                  # all matching source occurrences
  selected_occurrence/context
  tree context                    # complete source path, language-qualified where relevant
  diagram/item context when available
  fitment/suitability context when available
  stock presentation when authorized/available
    stock_quality_code?         # A-E only
    stock_quality_unclassified? # explicit NULL state
  unavailable/error/authorization information
```

Presentation code must not encode JEPC database structure or reconstruct domain resolution logic.

The API/UI boundary must preserve catalogue/reference versus operational-stock separation. A stock-quality value or its localized presentation must not redefine canonical PART identity or immutable JEPC/catalogue facts.

## Deterministic fixtures
Cover at least:
- valid Jaguar part number;
- multiple EPC occurrences;
- valid no-match;
- invalid/empty input;
- unavailable EPC context;
- tree context;
- diagram/item context where available;
- non-numbered fixture identifiers including `firtree1` and `firtree2`;
- classified stock-quality presentation using normalized A–E identity when the stock contract is exercised;
- explicit unclassified stock quality where `condition_code IS NULL`;
- unavailable or authorization-limited stock-quality presentation without fabrication.

Fixture values are test data, not verified Jaguar catalogue facts.

## Viewport and language
The default desktop shell follows the fitted-desktop behavior and responsive rules in [`../UI/UI_Specs.md`](../UI/UI_Specs.md). Search/Availability/status UI text follows the repository i18n contract in [`../i18n/README.md`](../i18n/README.md). Stock-quality labels/descriptions use the shared semantic i18next resources from the canonical `i18n/` path. UI locale and Parts/catalogue-data language remain separate concerns; this search specification does not implement a parallel localization mechanism.

## Error/unavailable semantics
- Missing context is not no PART.
- Missing image/diagram/location is not no PART.
- Missing fitment evidence is not a negative match unless the applicability contract says so.
- Missing Availability support is not zero stock.
- Missing stock-quality classification is explicit unclassified quality, not unavailable stock.
- Missing or restricted stock-quality information is not a confirmed A–E classification.
- Search failures do not fall back to guessed identities.

## Acceptance criteria
- [x] Search/result states and canonical identity boundaries are documented.
- [x] Multiple EPC occurrences remain distinct from canonical PART identity.
- [x] Part-number search can return every occurrence with its complete source tree path.
- [x] Catalogue/filter narrowing is occurrence-first; a PART remains while any occurrence survives.
- [x] Catalogue-data language may select structurally different imported source trees without conflating them with UI i18n.
- [x] Non-numbered fixture identifiers are not presented as Jaguar part numbers.
- [x] Search/Availability placement follows merged Concept-11.
- [x] Result distribution follows the corrected Model Ranges / Location / Suitability / PART geometry.
- [x] Unsupported stock-driven empty-search behavior is not fabricated.
- [x] UI-vs-Parts language separation is preserved.
- [x] Presentation does not redefine the Parts Data Model.
- [x] Normalized stock-quality codes A–E from `MODEL_STOCK.md` are the search/filter identity when stock-quality filtering is supported.
- [x] Available-part quality presentation uses localized label/description resources and preserves code identity.
- [x] The explicit `NULL` / unclassified quality state is represented without creating a sixth quality class.
- [x] Static A–E explanatory presentation is required to consume the same i18n resource contract.
- [x] Unavailable, unresolved and authorization-limited stock-quality states are explicit and must not fabricate a confirmed classification.
- [x] Catalogue/reference versus operational-stock separation is preserved through the search/result contract.
