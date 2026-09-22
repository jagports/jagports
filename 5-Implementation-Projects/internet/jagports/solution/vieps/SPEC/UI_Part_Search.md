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
                    | Search: [ part number, deterministic identifier, or free text ] [Search]
                    | Availability: [ ] Show only parts on stock
```

Availability remains operational stock state, separate from catalogue identity.

For the reduced MVP, the public Availability control is a boolean **Show only parts on stock** filter applied after a supported part-number, deterministic-identifier or free-text candidate set exists. A PART satisfies this public stock-backed filter only when at least one operational `stock_item` linked to that canonical PART has `available = 1` and `quantity > 0`.

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
- The search area uses one primary query field for a Jaguar part number, deterministic identifier or free text; it must not expose competing part-number and free-text fields.
- Deterministic identifiers mean exact/normalized lookup values that are intended to resolve deterministically before generic free-text matching, including Jaguar part numbers, raw part-number strings, normalized part-number strings, and approved deterministic non-numbered identifiers where the current read contract supports them.
- Deterministic identifiers are not excluded from search. They are handled first because their behavior is stricter than free-text matching: they should resolve the intended identity before the same query is allowed to fall back to general text matching.
- Search resolution is part-number / deterministic-identifier first: attempt the approved part-number / deterministic-identifier lookup first; only when it produces no match may the same query fall back to an available approved free-text search capability.
- Hybrid reduced-MVP free-text search is required before #280 closure. It is limited to the implemented searchable fields and result presentation in this document.
- Full multilingual/global free-text indexing/search remains owned by post-MVP #622. The reduced-MVP free-text path does not need to implement the complete #622 corpus, ranking, multilingual indexing, cross-Range search, or search architecture.
- If reduced-MVP free-text capability is unavailable in a runtime that exposes the general `Find` control, the runtime must not silently ignore the query and return ordinary `not_found` for descriptive text.
- Primary deterministic MVP behavior remains Jaguar part-number / deterministic-identifier search plus the limited free-text fallback defined here.
- Approved deterministic non-numbered identifiers may also be accepted where the current read contract supports them.
- Current main-branch fixtures `firtree1` and `firtree2` are descriptive fixture identifiers, **not Jaguar part numbers**.
- Leading/trailing whitespace is ignored.
- Part-number matching is case-insensitive; canonical value comes from catalogue data.
- Original entered value remains available for UI/error reporting and visible fragment highlighting.
- Do not silently invent or normalize unsupported punctuation/characters.
- Empty/clearly invalid input produces an explicit state, not a guessed identity.

## Reduced-MVP limited free-text search

Reduced-MVP free-text search is a pragmatic, current-data-path capability. It exists to make the exposed `Find` field useful for descriptive queries without waiting for the full post-MVP #622 multilingual/global search architecture.

Every free-text query is treated by the same general free-text rules. No specific example term, model label, body style, or category name is a special behavior key. Part numbers and deterministic identifiers are not excluded from search; they are resolved first by deterministic lookup. Generic free-text fallback runs only when that deterministic lookup produces no match.

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

Do not create a separate search-result page, modal, explanation view, independent row/table view, or any other multi-PART content element to explain free-text results. Multiple matching PARTs are represented as clickable leaf nodes in the Parts Tree. The PART / Image / Status region shows exactly one selected PART at a time.

## Canonical PART and occurrence resolution
A successful Jaguar part-number lookup resolves one canonical `PART` identity. A non-numbered supported deterministic identifier resolves the approved non-numbered item/context without fabricating a Jaguar number.

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

## Parts Tree default navigation and selection

The Parts Tree is the only multi-PART selection surface.

By default, with no branch selected, the Parts Tree shows first-level/root branches only.

When a branch is selected, the first-level/root index stays visible, the complete ancestry from its root to that selected branch remains expanded, and the selected branch shows all available immediate next-level branches.

The visible result is one identity-keyed hierarchy: shared ancestors are rendered once by stable node identity rather than repeated once for every matching path. Equal labels do not justify merging distinct source-qualified nodes.

Each deeper level is modestly indented. Root/upper-level branches use stronger typography than deeper branches, and the single active category or PART leaf is indicated by underlining its text.

This progressive tree navigation is separate from search-result filtering. Search may filter/highlight branches and PART leaf nodes, but it must not turn PART / Image / Status or any other content region into a multi-PART result list.

PARTs are shown as last leaf nodes of the tree when the current tree/search context reaches PART-level results.

When a search returns multiple PARTs, no PART is selected by default. The matching PARTs are visible as clickable PART leaf nodes in the Parts Tree. PART / Image / Status remains in an explicit no-selected-PART or context state until the user selects one PART leaf.

When exactly one PART is resolved deterministically or by free text, that PART may populate PART / Image / Status according to the single-result contract.

## Occurrence-first tree filtering

Catalogue browsing and source-description filters operate on occurrences first:

```text
selected Parts Tree branch
    -> all source occurrences below the branch
    -> optional description / VIN / applicability filters
    -> surviving occurrences
    -> distinct visible PARTs as last leaf nodes
```

A PART remains visible while at least one occurrence survives. The UI must not merge all occurrence paths into one synthetic applicability path.


Parts Tree browsing is an alternative entry path into this same resolution model. A stable tree-node link selects a `part_tree_node.id`, resolves the canonical PART candidates related to that node/subtree through `part_tree_part`, and presents those candidates without guessing one PART. Choosing a candidate then uses the normal canonical PART-resolution flow above. Tree labels are never used as identity, and tree navigation itself does not decide fitment/applicability.

Imported JEPC descriptions may be presented as filter candidates. Normalized semantic facets derived from those descriptions are a separate enrichment layer; the UI/API must not treat the facet label as the source-tree identity.

Language-specific JEPC tree structure may differ. Catalogue-data language selection therefore chooses among imported source-language tree contexts rather than assuming that UI translation resources translate one fixed source tree.

## Free-text result display cases

Free-text results use the existing VIEPS regions. The UI must not create a separate result list or explanation view to show free-text matches.

### Deterministic part-number / identifier match exists

Exact or partial part-number / deterministic-identifier matches are resolved first.

If a deterministic match exists, show the result through the existing deterministic search contract. If the same query also matches visible descriptive text, the matching part number / deterministic identifier and visible text fragments may both be highlighted, but free-text fallback must not replace the deterministic result.

If **Show only parts on stock** removes all deterministic-matched PARTs, return `stock_filtered_empty`; do not rerun free-text fallback merely because the stock filter removed deterministic candidates.

### One free-text PART match

When no deterministic match exists and free-text resolves to exactly one canonical PART, populate the existing Concept-11 regions for that PART.

The PART / Image / Status region shows the one resolved PART. Visible matched fragments are highlighted in the existing fields where they appear.

Parts Tree shows all matching tree branches where the matching PART occurs, with the PART shown as the last leaf node on each matching branch. Matching fragments are highlighted where visible. Tree rendering must not expand unrelated non-matching child leaves merely because their parent branch matched.

Model Ranges shows matching model/range/body-style evidence where available.

### Multiple free-text PART matches

When no deterministic match exists and free-text resolves to multiple canonical PART candidates, the matching PARTs must be shown as clickable last leaf nodes in the existing Parts Tree.

No PART is selected by default when a search returns multiple PARTs.

No content element should present many PARTs. In particular, PART / Image / Status must not become a multi-result list, row view, table, candidate list or search-results container. It shows exactly one selected PART after a user selects a PART leaf from the tree. Until a PART leaf is selected, it remains in an explicit no-selected-PART or context state.

The Parts Tree must show all matching tree branches where matching PARTs occur inside one deduplicated hierarchy. Required shared ancestors appear once, the root index remains visible, and matching PARTs are terminal leaves under their evidenced branches. Non-matching child leaves are not expanded merely because their parent branch matched.

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

If the match resolves to PART candidates through the current search/read contract, show those PART candidates as clickable last leaf nodes in the existing Parts Tree and show all matching Parts Tree branches.

If the match does not resolve to PART candidates, do not fabricate a selected PART.

### Operational stock text match

When free text matches operational stock text in the current searchable read path, the result must still preserve catalogue/reference versus operational-stock separation.

If stock text links to one or more canonical PARTs, show the linked PARTs as clickable last leaf nodes in the existing Parts Tree. Selecting a PART leaf populates PART / Image / Status for that one selected PART only. Matched visible text fragments are highlighted where they appear.

If stock text does not link to a canonical PART, do not create a fake PART. Show only the existing supported unresolved/no-result behavior for that data path.

### Stock-only filter removes free-text candidates

When free-text matches exist but **Show only parts on stock** removes all visible PART candidates, return `stock_filtered_empty` and show this wording:

```text
No matching parts currently on stock.
```

Do not show ordinary `Part not found.` for this case.

### No deterministic match and no free-text match

Only after deterministic part-number / identifier search and all applicable active free-text search modes have been evaluated may the UI show `Part not found.` / `not_found`.

### Free-text search error

Free-text search infrastructure or query-processing failure returns `error` or a specific search-failure state. Do not collapse search failure into `Part not found.`

## Result states
| State | Meaning |
|---|---|
| `empty` | No search submitted; permanent Concept-11 shell remains visible |
| `invalid` | Query fails supported validation |
| `not_found` | Valid search has no supported deterministic match and no available free-text match after all active search modes have been evaluated |
| `stock_filtered_empty` | Search matches exist, but the selected supported stock constraint removes all visible results; display `No matching parts currently on stock.` |
| `multiple_matches` | Deterministic or available free-text search produces multiple canonical PART candidates; matching PARTs are presented as clickable Parts Tree leaf nodes, no PART is selected by default, and results are not shown as a multi-PART content element |
| `unsupported` | Requested search/filter capability is unavailable in the current runtime and must not be silently ignored |
| `resolved` | Identity/context resolved |
| `context_only` | Free text matched a browse/tree/range/model/context value and is shown through the existing region that owns that context; no PART is selected unless the match resolves to a PART candidate |
| `context_unavailable` | Identity resolved but secondary EPC context unavailable |
| `error` | Processing/API/search failure |

Stock-quality presentation may additionally distinguish explicit stock-detail states such as classified, unclassified, unavailable/unresolved, and not included in current result presentation without changing canonical PART result identity.

## Result distribution into merged Concept-11
```text
resolved identity/context or candidate set
   ├── Parts Tree main-level index + matching branch/path ancestors + clickable matching PART leaf nodes
   ├── Suitability Model Ranges row + matched range/model/body-style context when available
   ├── Location at car (left-middle)
   ├── Suitability / Filter or facts (right-middle)
   └── PART / Image / Status (full lower centre/right; exactly one selected PART only)
```

Missing secondary data stays as an explicit unavailable state in its permanent region.

Matched query fragments are highlighted where visible in existing regions. Highlighting is applied to the fragment, not merely to the whole row/field.

The Parts Tree is the only multi-PART selection surface. No other content element should present many PARTs. PART / Image / Status shows one selected PART after a tree leaf selection and must not act as a search-results list. When multiple PARTs match, it remains in a no-selected-PART/context state until a PART leaf is selected.

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
  search_path?                    # deterministic | free_text when the distinction is applicable
  match_type?                     # exact_part_number | partial_part_number | deterministic_identifier | part_description | model_range | body_style | tree_context | stock_text | manufacturer | selected_language_i18n | mixed
  matched_fragments[]?            # fragment/value/source locations that may be highlighted where visible
  candidates[]?                   # multiple canonical PART candidates remain selectable as Parts Tree leaf nodes, never guessed and never shown as a separate multi-PART content list
  canonical_part? / approved non-numbered identity?
  occurrences[]                  # all matching source occurrences
  selected_occurrence/context
  tree context                    # complete source path, language-qualified where relevant
  tree_part_leafs[]?              # clickable matching PART leaves under their matching branch/path ancestors
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
- valid deterministic non-numbered identifier where supported;
- multiple EPC occurrences;
- valid no-match after deterministic and active free-text modes both fail;
- multiple deterministic candidates without guessed selection;
- deterministic miss with reduced-MVP free-text fallback;
- default Parts Tree view showing first-level/root branches only;
- selecting a Parts Tree branch retaining the root index, expanding its complete ancestry, and showing all available immediate next-level branches;
- shared path ancestors rendered once per stable tree identity, with distinct source-qualified nodes retained;
- depth indentation, stronger typography nearer the root, and underlined single active node;
- fragment highlighting in visible matched text;
- generic free-text query matching model, range, body-style or catalogue/context text;
- query matching PART description text;
- query matching manufacturer text where available;
- query matching searchable stock text including availability, quantity, quality, storage location, source/vendor/person, donor vehicle and notes where those fields exist;
- selected-language i18n text match where available;
- context-only match shown through the existing owning region without fabricating PART selection;
- all matching Parts Tree branches where matching PARTs occur, with matching PARTs presented as clickable last leaf nodes and without expanding unrelated child leaves;
- multiple-PART search result with no default selected PART;
- no multi-PART presentation in PART / Image / Status or any other content element;
- PART / Image / Status showing exactly one selected PART after a tree leaf is selected;
- Model Ranges reflecting matched model/range/body-style context where available without special Coupe/Convertible behavior;
- explicit unsupported state when requested free-text/stock filtering is unavailable;
- stock-filtered-empty distinct from total search no-match, with `No matching parts currently on stock.` wording;
- reduced-MVP `stock_only` success when a deterministic or free-text candidate has `available = 1` and `quantity > 0`;
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
- Deterministic miss falls back to the reduced-MVP free-text capability when that capability is active.
- Absence of free-text capability in a runtime exposing descriptive search must be explicit, not simulated.
- A stock-filtered-empty result is distinct from a total search no-match.
- A context-only free-text match is shown through the existing region that owns that context and must not fabricate a selected PART.
- Multiple PART matches are selectable as Parts Tree leaf nodes only; no content element should present many PARTs.
- Multiple-PART search results do not select any PART by default.

## Acceptance criteria
- [x] Search/result states and canonical identity boundaries are documented.
- [x] One primary query field supports deterministic part-number / identifier-first resolution with free-text fallback only after deterministic miss.
- [x] Deterministic identifiers are defined and are not excluded from search; they are resolved first because their behavior is stricter than generic free-text matching.
- [x] Reduced-MVP limited free-text search is required before #280 closure.
- [x] Full multilingual/global free-text indexing/search remains post-MVP under #622.
- [x] Default Parts Tree view shows first-level branches only.
- [x] Selecting a Parts Tree branch keeps the root index visible, expands the complete root-to-selected ancestry, and shows all available immediate next-level branches.
- [x] Shared Parts Tree ancestors are rendered once per stable tree identity, with distinct source-qualified nodes preserved.
- [x] Parts Tree hierarchy uses depth indentation, stronger typography nearer the root, and underlines only the active category or PART leaf.
- [x] Multiple canonical search candidates remain selectable as Parts Tree leaf nodes rather than being guessed into one PART or shown as a separate multi-PART content list.
- [x] Multiple-PART search results do not select any PART by default.
- [x] Free-text candidates are shown in existing Concept-11 regions, with multiple PARTs selectable only through clickable Parts Tree leaves.
- [x] PART / Image / Status shows exactly one selected PART and must not present many PARTs.
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
