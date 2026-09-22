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
                    | Search: [ identifier or free text ] [Search]
                    | Availability: [ ] Show only parts on stock
```

Availability remains operational stock state, separate from catalogue identity.

For the reduced MVP, the public Availability control is a boolean **Show only parts on stock** filter applied after a supported identifier or free-text candidate set exists. A PART satisfies this public stock-backed filter only when at least one operational `stock_item` linked to that canonical PART has `available = 1` and `quantity > 0`.

The boolean filter exposes the stock-backed eligibility needed to narrow visible PART results. It does not authorize stock add, edit or delete operations. The #448 authorization boundary is a mutation boundary unless another specification explicitly defines a read/display restriction for a specific field.

Do not invent a `public-safe`, hidden-stock-detail or admin-only-result taxonomy merely because stock data is operational data. Searchable and displayable stock fields are governed by this search/result contract and the implemented data path.

Normalized A–E stock-quality filtering remains governed by the stock-quality contract below and is not required to be silently simulated when a richer browse/filter contract is unavailable.

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

When a stocked/available result includes stock-quality presentation, presentation must include:

- the normalized stock-quality code when classified;
- the localized quality label;
- a localized short description, with long description/help available where the UI provides explanatory detail;
- the explicit localized unclassified state when `condition_code IS NULL`.

Static help/explanation for A–E meanings must be available somewhere in the VIEPS UI before users are expected to interpret stock-quality filtering or available-part quality. The explanation must consume the same i18n resources rather than define a second wording/taxonomy.

If stock quality is unavailable, unresolved, or not included in the current result presentation, the UI must show an explicit state. It must not fabricate a confirmed A–E class.

Stock-quality result states include at least:

- quality classified and visible;
- quality unclassified and visible;
- quality unavailable/unresolved;
- quality not included in the current result presentation.

## Search input
- The search area uses one primary query field for a Jaguar part number / approved identifier or free text; it must not expose competing identifier and free-text fields.
- Search resolution is identifier-first: attempt the approved part-number / identifier lookup first; only when it produces no identifier match may the same query fall back to an available approved free-text search capability.
- Hybrid reduced-MVP free-text search is required before #280 closure. It is limited to the implemented searchable fields and result presentation in this document.
- Full multilingual/global free-text indexing/search remains owned by post-MVP #622. The reduced-MVP free-text path does not need to implement the complete #622 corpus, ranking, multilingual indexing, cross-Range search, or search architecture.
- If reduced-MVP free-text capability is unavailable in a runtime that exposes the general `Find` control, the runtime must not silently ignore the query and return ordinary `not_found` for descriptive text.
- Primary deterministic MVP behavior remains Jaguar part-number / approved-identifier search plus the limited free-text fallback defined here.
- Approved deterministic non-numbered identifiers may also be accepted where the current read contract supports them.
- Current main-branch fixtures `firtree1` and `firtree2` are descriptive fixture identifiers, **not Jaguar part numbers**.
- Leading/trailing whitespace is ignored.
- Part-number matching is case-insensitive; canonical value comes from catalogue data.
- Original entered value remains available for UI/error reporting and visible fragment highlighting.
- Do not silently invent or normalize unsupported punctuation/characters.
- Empty/clearly invalid input produces an explicit state, not a guessed identity.

## Reduced-MVP limited free-text search

Reduced-MVP free-text search is a pragmatic, current-data-path capability. It exists to make the exposed `Find` field useful for descriptive queries without waiting for the full post-MVP #622 multilingual/global search architecture.

Every free-text query is treated by the same general free-text rules. No specific example term, model label, body style, or category name is a special behavior key. Part numbers and approved identifiers remain the exception because identifier-first search behavior is specified separately above.

The reduced-MVP free-text corpus includes matching text available through the approved current read path, including at least:

- PART descriptions;
- model, range, body-style, vehicle, tree, category, path and other catalogue/context text where present;
- manufacturer text where present;
- stock existence/availability text;
- quantity/availability text;
- normalized stock-quality text and localized stock-quality i18n text for the selected UI/catalogue language where available;
- storage-location text;
- source/vendor/person text;
- donor-vehicle text;
- notes text;
- any other current searchable field with matching text in the approved read path;
- i18n texts for the selected UI/catalogue language where those texts are part of the visible/searchable current UI or data presentation.

Searchable stock text does not make stock the catalogue identity. When a stock-text match resolves to a stocked item that is linked to a canonical PART, the visible result object remains the canonical PART or existing PART result region.

A free-text match fragment must be highlighted where the matched text is visible in an existing UI region. Highlighting is fragment-level, meaning the matched substring inside the visible value is highlighted, not merely the whole row.

Do not create a separate search-result page, modal, explanation view, or independent row/table view only to explain free-text results. Free-text results must be distributed through the existing Concept-11 VIEPS regions.

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

## Free-text result display cases

Free-text results use the existing VIEPS regions. The UI must not create a separate result list or explanation view to show free-text matches.

### Identifier match exists

Exact or partial identifier matches are resolved first.

If an identifier match exists, show the identifier result through the existing identifier search contract. If the same query also matches visible descriptive text, the matching identifier and visible text fragments may both be highlighted, but free-text fallback must not replace the identifier result.

If **Show only parts on stock** removes all identifier-matched PARTs, return `stock_filtered_empty`; do not rerun free-text fallback merely because the stock filter removed identifier candidates.

### One free-text PART match

When no identifier match exists and free-text resolves to exactly one canonical PART, populate the existing Concept-11 regions for that PART.

The PART / Image / Status region shows the PART result. Visible matched fragments are highlighted in the existing fields where they appear.

Parts Tree shows all matching tree branches where the matching PART occurs. Matching fragments are highlighted where visible. Tree rendering must not expand unrelated non-matching child leaves merely because their parent branch matched.

Model Ranges shows matching model/range/body-style evidence where available.

### Multiple free-text PART matches

When no identifier match exists and free-text resolves to multiple canonical PART candidates, show the candidates in the existing PART / Image / Status region or other existing Concept-11 result region that already presents PART choices. Do not create a new independent row/table view solely for search results.

The Parts Tree must show all matching tree branches where matching PARTs occur. Non-matching child leaves are not expanded merely because their parent branch matched.

Model Ranges must reflect matched model/range/body-style contexts when those contexts are part of the matched result evidence.

No model, range, body-style or example query has special hard-coded behavior. Coupe, Convertible and similar values are ordinary searchable text values under the same rules as any other text.

### Context-only free-text match

When free text matches a category, tree node, path, group, model/range/body-style label, suitability label, context or other browse/context value without directly resolving a PART, show the match only through the existing VIEPS region that owns that context.

For Parts Tree context, navigate/filter the existing Parts Tree to the matching branches and their required ancestors. Do not expand unrelated child leaves unless those leaves also match or are required to show the matched path.

The UI must not:

- create a separate context-result view;
- populate PART / Image / Status as though a PART has been selected;
- fabricate a selected PART;
- show `Part not found` merely because the match is context-only.

Matching fragments are highlighted in the existing region where visible.

### Vehicle/range/model/suitability text match

When free text matches vehicle/range/model/suitability text, show the match through existing Model Ranges and related Concept-11 regions where the current data path supports it.

If the match resolves to PART candidates through the current search/read contract, show those PART candidates in the existing PART result region and all matching Parts Tree branches.

If the match does not resolve to PART candidates, do not fabricate a selected PART.

### Operational stock text match

When free text matches operational stock text in the current searchable read path, the result must still preserve catalogue/reference versus operational-stock separation.

If stock text links to a canonical PART, show the linked PART through the existing PART result regions, with matched visible text fragments highlighted where they appear.

If stock text does not link to a canonical PART, do not create a fake PART. Show only the existing supported unresolved/no-result behavior for that data path.

### Stock-only filter removes free-text candidates

When free-text matches exist but **Show only parts on stock** removes all visible PART candidates, return `stock_filtered_empty` and show this wording:

```text
No matching parts currently on stock.
```

Do not show ordinary `Part not found.` for this case.

### No identifier match and no free-text match

Only after identifier search and all applicable active free-text search modes have been evaluated may the UI show `Part not found.` / `not_found`.

### Free-text search error

Free-text search infrastructure or query-processing failure returns `error` or a specific search-failure state. Do not collapse search failure into `Part not found.`

## Result states
| State | Meaning |
|---|---|
| `empty` | No search submitted; permanent Concept-11 shell remains visible |
| `invalid` | Query fails supported validation |
| `not_found` | Valid search has no supported identifier match and no available free-text match after all active search modes have been evaluated |
| `stock_filtered_empty` | Search matches exist, but the selected supported stock constraint removes all visible results; display `No matching parts currently on stock.` |
| `multiple_matches` | Identifier or available free-text search produces multiple canonical candidates; the UI must present candidates in existing Concept-11 regions rather than invent a selected PART |
| `unsupported` | Requested search/filter capability is unavailable in the current runtime and must not be silently ignored |
| `resolved` | Identity/context resolved |
| `context_only` | Free text matched a browse/tree/range/model/context value and is shown through the existing region that owns that context; no PART is selected unless the match resolves to a PART candidate |
| `context_unavailable` | Identity resolved but secondary EPC context unavailable |
| `error` | Processing/API/search failure |

Stock-quality presentation may additionally distinguish explicit stock-detail states such as classified, unclassified, unavailable/unresolved, and not included in current result presentation without changing canonical PART result identity.

## Result distribution into merged Concept-11
```text
resolved identity/context or candidate set
   ├── Parts Tree main-level index + matching branch/path ancestors; no unrelated child leaves expanded
   ├── Suitability Model Ranges row + matched range/model/body-style context when available
   ├── Location at car (left-middle)
   ├── Suitability / Filter or facts (right-middle)
   └── PART / Image / Status (full lower centre/right)
```

Missing secondary data stays as an explicit unavailable state in its permanent region.

Matched query fragments are highlighted where visible in existing regions. Highlighting is applied to the fragment, not merely to the whole row/field.

## Empty-search stock browsing
The merged SVG states that when Search is empty, a supported Availability/quality constraint may update both the Parts Tree and Model Ranges to contexts represented by matching stock.

That behavior is valid only when an approved stock/catalogue browse contract resolves stock through canonical catalogue/fitment relationships. The illustrated A–E stock qualities are not defined by the artwork itself.

When stock-quality filtering is supported, filter identity is the normalized `A` through `E` code set defined by [`MODEL_STOCK.md`](MODEL_STOCK.md); localized labels/descriptions remain presentation only. An explicit unclassified state may be filterable when supported by the stock query contract, using `NULL` semantics rather than inventing a placeholder code.

## API/data boundary
```text
PartSearchRequest
  query
  stock_only?               # reduced-MVP public boolean availability constraint
  stock_quality_codes[]?   # normalized A-E identities when supported
  include_unclassified_quality? # explicit NULL-state filter when supported

PartSearchResult
  state
  search_path?                    # identifier | free_text when the distinction is applicable
  match_type?                     # exact_identifier | partial_identifier | part_description | model_range | body_style | tree_context | stock_text | manufacturer | selected_language_i18n | mixed
  matched_fragments[]?            # fragment/value/source locations that may be highlighted where visible
  candidates[]?                   # multiple canonical candidates remain selectable, never guessed
  canonical_part? / approved non-numbered identity?
  occurrences[]                  # all matching source occurrences
  selected_occurrence/context
  tree context                    # complete source path, language-qualified where relevant
  diagram/item context when available
  fitment/suitability context when available
  model_range/body-style context when available
  stock presentation when available
    stock_quality_code?         # A-E only
    stock_quality_unclassified? # explicit NULL state
    availability/quantity/location/source/vendor/person/donor/notes/manufacturer fields where included by current searchable read path
  unavailable/error information
```

Presentation code must not encode JEPC database structure or reconstruct domain resolution logic.

The API/UI boundary must preserve catalogue/reference versus operational-stock separation. A stock-quality value, stock-text match, manufacturer match or localized presentation must not redefine canonical PART identity or immutable JEPC/catalogue facts.

## Deterministic fixtures
Cover at least:
- valid Jaguar part number;
- multiple EPC occurrences;
- valid no-match after identifier and active free-text modes both fail;
- multiple identifier candidates without guessed selection;
- identifier miss with reduced-MVP free-text fallback;
- fragment highlighting in visible matched text;
- generic free-text query matching model, range, body-style or catalogue/context text;
- query matching PART description text;
- query matching manufacturer text where available;
- query matching searchable stock text including availability, quantity, quality, storage location, source/vendor/person, donor vehicle and notes where those fields exist;
- selected-language i18n text match where available;
- context-only match shown through the existing owning region without fabricating PART selection;
- all matching Parts Tree branches where matching PARTs occur, without expanding unrelated child leaves;
- Model Ranges reflecting matched model/range/body-style context where available without special Coupe/Convertible behavior;
- explicit unsupported state when requested free-text/stock filtering is unavailable;
- stock-filtered-empty distinct from total search no-match, with `No matching parts currently on stock.` wording;
- reduced-MVP `stock_only` success when an identifier or free-text candidate has `available = 1` and `quantity > 0`;
- reduced-MVP `stock_only` filtered-empty when candidates exist but none satisfy that operational STOCK condition;
- invalid/empty input;
- unavailable EPC context;
- tree context;
- diagram/item context where available;
- non-numbered fixture identifiers including `firtree1` and `firtree2`;
- classified stock-quality presentation using normalized A–E identity when the stock contract is exercised;
- explicit unclassified stock quality where `condition_code IS NULL`;
- unavailable, unresolved, or not-included stock-quality presentation without fabrication.

Fixture values are test data, not verified Jaguar catalogue facts.

## Viewport and language
The default desktop shell follows the fitted-desktop behavior and responsive rules in [`../UI/UI_Specs.md`](../UI/UI_Specs.md). Search/Availability/status UI text follows the repository i18n contract in [`../i18n/README.md`](../i18n/README.md). Stock-quality labels/descriptions use the shared semantic i18next resources from the canonical `i18n/` path. UI locale, selected catalogue-data language and source-data language remain separate concerns. Reduced-MVP free-text may search selected-language i18n texts where those texts are part of the visible/searchable current data path; full cross-language/global multilingual search remains post-MVP #622.

## Error/unavailable semantics
- Missing context is not no PART.
- Missing image/diagram/location is not no PART.
- Missing fitment evidence is not a negative match unless the applicability contract says so.
- Missing Availability support is not zero stock.
- Missing stock-quality classification is explicit unclassified quality, not unavailable stock.
- Missing stock-quality presentation is not a confirmed A–E classification.
- Search failures do not fall back to guessed identities.
- Identifier miss falls back to the reduced-MVP free-text capability when that capability is active.
- Absence of free-text capability in a runtime exposing descriptive search must be explicit, not simulated.
- A stock-filtered-empty result is distinct from a total search no-match.
- A context-only free-text match is shown through the existing region that owns that context and must not fabricate a selected PART.

## Acceptance criteria
- [x] Search/result states and canonical identity boundaries are documented.
- [x] One primary query field supports identifier-first resolution with free-text fallback only after identifier miss.
- [x] Reduced-MVP limited free-text search is required before #280 closure.
- [x] Full multilingual/global free-text indexing/search remains post-MVP under #622.
- [x] Multiple canonical search candidates remain selectable rather than being guessed into one PART.
- [x] Free-text candidates are shown in existing Concept-11 regions, not in a separate result page/table/view.
- [x] Matching text fragments are highlighted where visible.
- [x] `stock_filtered_empty` is distinct from a total `not_found` result and uses `No matching parts currently on stock.` wording.
- [x] Search-path/match provenance may cross the API boundary without redefining canonical PART identity.
- [x] Multiple EPC occurrences remain distinct from canonical PART identity.
- [x] Part-number search can return every occurrence with its complete source tree path.
- [x] Free-text PART matches show all matching Parts Tree branches where matching PARTs occur without expanding unrelated child leaves.
- [x] Context-only free-text matches are shown through existing owning regions and do not fabricate PART selection.
- [x] Catalogue/filter narrowing is occurrence-first; a PART remains while any occurrence survives.
- [x] Catalogue-data language may select structurally different imported source trees without conflating them with UI i18n.
- [x] Reduced-MVP free-text may search selected-language i18n text where it is part of the current searchable read path.
- [x] Non-numbered fixture identifiers are not presented as Jaguar part numbers.
- [x] Search/Availability placement follows merged Concept-11.
- [x] Reduced-MVP public `stock_only` filtering is defined over canonical PART candidates using operational STOCK availability plus positive quantity without redefining catalogue identity.
- [x] Result distribution follows the corrected Model Ranges / Location / Suitability / PART geometry.
- [x] Generic model/range/body-style free-text matches are reflected in Model Ranges where available, without special Coupe/Convertible behavior.
- [x] Searchable stock text includes the current data-path stock fields specified for reduced-MVP free-text, without inventing an unspecified admin-only field taxonomy.
- [x] Unsupported stock-driven empty-search behavior is not fabricated.
- [x] UI-vs-Parts language separation is preserved.
- [x] Presentation does not redefine the Parts Data Model.
- [x] Normalized stock-quality codes A–E from `MODEL_STOCK.md` are the search/filter identity when stock-quality filtering is supported.
- [x] Available-part quality presentation uses localized label/description resources and preserves code identity.
- [x] The explicit `NULL` / unclassified quality state is represented without creating a sixth quality class.
- [x] Static A–E explanatory presentation is required to consume the same i18n resource contract.
- [x] Unavailable, unresolved and not-included stock-quality states are explicit and must not fabricate a confirmed classification.
- [x] Catalogue/reference versus operational-stock separation is preserved through the search/result contract.
