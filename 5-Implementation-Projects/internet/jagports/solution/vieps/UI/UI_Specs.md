# VIEPS UI Specifications

## Status

This document defines the durable VIEPS UI information architecture and presentation contract.

The domain/data behaviour remains controlled by the existing VIEPS specifications and Parts Data Model. For the Tailwind visual implementation, **the Concept-11 SVG merged by PR #645 is the authoritative layout/content reference** and supersedes the older Concept View-1 placement map.

**Implementation parent:** #368 — VIEPS UI / Implement MVP Web UI  
**Controlling specification:** #468 — VIEPS UI specification  
**Tailwind implementation:** #642 / PR #647  
**Merged Concept-11 visual:** PR #645

## Visual authorities

- **Layout/content relationships:** `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/VIEPS UI-Concept-11.svg`
- **Tailwind style/theme:** `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/CSS-Kit-2ndRound-Tailwind-CSS.jpg`

The images define presentation direction. Existing VIEPS data/API specifications remain authoritative for behaviour. Example values and controls shown in concept artwork are not production facts and do not authorize fabricated application logic.

## Normative Concept-11 map

The following is the normative text representation of the **merged** Concept-11 SVG. It follows the SVG's actual region geometry rather than the earlier simplified interpretation.

```text
┌──────────────────────────┬──────────────────────────────────────────────────────────────────────────┐
│ BRANDING / INSTRUCTIONS  │ SEARCH + AVAILABILITY                                                    │
│ Logos / instructions     │ Search: [ part number / supported identifier ] [Search]                 │
│ Flags / Language         │ Availability: [ stock quality A…E / descriptions ▼ ]                    │
│ [UI] [Parts]             │ empty-search stock constraint may narrow Tree + Model Ranges            │
├──────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ PARTS TREE               │ SUITABILITY MODEL RANGES                                                 │
│ scrolling main-level     │ filter/check fit across verified model/range context                     │
│ category index           │ [ ] … [x] applicable range(s)                                            │
│                          ├───────────────────────────────────┬──────────────────────────────────────┤
│ retain main levels;      │ LOCATION AT CAR                   │ SUITABILITY / FILTER                 │
│ expand/emphasize only    │ one vehicle-location canvas       │ browse/multiple-result: filters      │
│ relevant descendant      │ verified location or unavailable  │ one selected PART/context: facts     │
│ path(s)                  │                                   │ Models / ModelYear / VINRanges /     │
│                          │                                   │ features / qualifiers / exclusions   │
│ selected occurrence/path │                                   │ (i) verified Model Family & Year     │
│ strongly highlighted     │                                   │     Introduction document            │
│                          ├───────────────────────────────────┴──────────────────────────────────────┤
│                          │ PART / IMAGE / STATUS                                                    │
│                          │ warning/status + PART/item identity + Classic/supersession + details    │
│                          │ one selected part image / exploded diagram or unavailable state         │
└──────────────────────────┴──────────────────────────────────────────────────────────────────────────┘
```

### Geometry rules

- The Concept-11 top-left block is reserved for Jagports/VIEPS branding, instructions and language concerns.
- Search + Availability occupies the top workspace to the right of that block.
- Parts Tree is the persistent left column below the header block.
- Suitability Model Ranges is a **separate full-width row across the centre/right workspace** below Search/Availability.
- The next row has **Location at car on the left and Suitability / Filter on the right, side-by-side**.
- `Location at car` is one vehicle-location canvas, not permanent Top/Side sub-panels.
- PART / Image / Status spans the **full centre/right lower workspace**.
- On narrower layouts the regions may reflow while retaining the same semantic relationships.

## Language controls shown in Concept-11

Concept-11 explicitly shows `Language [UI] [Parts]` as separate concerns.

- **UI language** is governed by #554.
- **Parts/catalogue-data language** is independently selectable under #620.
- PR #647 must remain structurally compatible with both concerns, but must **not fabricate working language selectors** before the approved #554/#620 contracts are implemented.
- Variable-length localized text must not break the layout.
- The top-left concept block is therefore a durable information-architecture requirement even when the current runtime exposes only branding/instructions and no active language controls yet.

## Core interaction flow

```text
search / browse constraints
        ↓
resolve canonical PART or constrained catalogue/stock context
        ↓
retain one Parts Tree root index + expand the complete selected root-to-leaf path
        ↓
show / constrain verified Model Ranges
        ↓
show Location-at-car and Suitability/Filter side-by-side
        ↓
show PART / Image / Status across the lower workspace
```

## Deterministic vertical-slice contract

The full #368 UI implementation must support a narrow but coordinated end-to-end path before production/imported catalogue data is complete. This is a UI implementation contract; the current overall MVP closure gate may be narrower or may impose additional requirements through #280 and its active acceptance work.

```text
enter Jaguar part number or approved deterministic fixture identifier
        ↓
resolve canonical PART
        ↓
show PART's relevant Parts Tree branch
        ↓
show verified suitable vehicle Ranges/models when applicability data is available
        ↓
select a Range and show verified applicable variations/qualifiers where available
        ↓
show the PART image when available
        ↓
pass coordinated end-to-end acceptance validation
```

The selected canonical PART remains the central identity while Parts Tree, Range, variation/qualifier and image views change their contextual presentation. UI components consume approved API/data contracts and do not duplicate domain-resolution logic.

This UI slice does not by itself make diagram hotspots, whole-car vehicle-location mapping, operational stock, supersession/current-part indicators, Jaguar Classic indicators or alternative entry paths prerequisites. Those capabilities remain governed by their own specifications and by the current overall MVP scope.

The complete Concept-11 information architecture should remain visible early. Real behaviour is implemented where its contract is ready; components awaiting data or later implementation retain their permanent region and use explicit unavailable/not-supported states instead of throwaway layouts or fabricated behaviour.

## Deterministic fixture boundary and migration

Deterministic fixtures are an implementation substrate, not a second domain model. Fixture requests/results use the same UI/API contracts that imported data will later provide.

Fixture identifiers and values must be clearly marked as deterministic test data and must not be represented as production evidence.

Representative fixture coverage for the full #368 vertical-slice contract should include:

- successful part-number or approved fixture-identifier resolution;
- multiple EPC contexts;
- a relevant Parts Tree path;
- multiple applicable model/ranges when supported by the fitment fixture;
- a qualifier-bearing fitment/variation result when supported;
- Part Image available and unavailable cases;
- unavailable secondary data;
- not-found, invalid and processing-error input states.

Evidence-state rules are invariant across fixtures and imported data:

- Missing image data is an explicit unavailable state, not a fabricated image.
- Missing Range applicability is not a positive fitment result.
- Missing variation data is not equivalent to no variation.
- Missing Parts Tree context is not equivalent to no PART.
- Unresolved source semantics remain unresolved rather than being guessed by presentation code.

Replacing fixtures with imported data must not require a UI information-architecture rewrite. The backing adapter/data source may change; the UI/API boundary and canonical identity semantics remain stable.

## Empty-search / stock browsing

Concept-11 states that when Search is empty, a supported stock availability/quality constraint may update both Model Ranges and the Parts Tree to the models/main levels represented by matching stock.

```text
empty search + supported stock constraint
          │
          ├── resolve stock records through canonical PART references
          ├── Parts Tree → show applicable main levels / relevant branches
          └── Model Ranges → show/filter verified applicable ranges
```

The SVG illustrates stock qualities `A…E with descriptions`. The meanings of A–E must come from the approved stock contract. Until the stock/catalogue browse contract exists, Availability remains disabled/unavailable and no stock-derived hierarchy or fitment is invented.

### Empty search, clear and browse continuity

Clearing Search or submitting an empty/whitespace-only query invalidates earlier requests, clears selected PART/occurrence and dependent context, removes stale `?part`/`?tree` state from the current URL, and restores the available collapsed root index with no active selection. Preserve the supported stock filter and permanent Concept-11 regions. Empty search is a browse/prompt state, not a failed PART lookup.

Initial root load, clear, empty submit and empty-search Availability refresh use the same root/evidence-state contract. A late PART/tree/root response must not replace a newer user action. Root unavailable/error states do not fabricate categories or revive old PART details.

UI language changes preserve browse state even without a selected PART. Catalogue-language changes respect source-qualified identity and structural differences rather than mapping by label.

The normative transition, stock and URL rules and regression acceptance matrix are in [Part Search](../SPEC/UI_Part_Search.md#empty-search-and-clear-transition). [Parts Tree](UI_Specs_Parts_Tree.md#empty-search--browse-state) owns root presentation and [Main View](UI_Specs_Main_View.md#clearing-selected-context) owns cleared contextual-region presentation.

## Search-result distribution

```text
canonical PART / selected context
   ├── Parts Tree main level + relevant descendant path(s)
   ├── Suitability Model Ranges
   ├── Location at car
   ├── Suitability / Filter or verified facts
   └── PART / Image / Status
```

A canonical PART may have multiple EPC occurrences without duplicating canonical identity. Presentation selection never mutates canonical PART identity.

## 1. Search + Availability

- Canonical Jaguar part-number search remains a primary entry point.
- Approved alternative identifiers, including deterministic non-numbered fixture identifiers, may be supported without pretending they are Jaguar part numbers.
- Search status distinguishes empty, invalid, not-found, resolved, unavailable-context and error states.
- Availability is operational stock state and does not alter catalogue identity or fitment semantics.
- If stock-quality filtering is unsupported, the control remains disabled/unavailable rather than simulated.

### Occurrence-first Parts Tree filtering

Imported catalogue browsing is occurrence-first. A Parts Tree branch represents source occurrence contexts; filters narrow those occurrences, then the UI shows the distinct PARTs that still have at least one surviving occurrence.

Part-number reverse search may expose every occurrence/path for the canonical PART. Do not merge those paths into one synthetic applicability path.

JEPC catalogue-data language is distinct from VIEPS UI locale. If imported language trees differ structurally, the Parts Tree presents the selected source-language structure rather than assuming one fixed tree with translated labels.

## 2. Parts Tree

- Parts Tree is a scrolling persistent left-side region.
- The merged SVG visibly retains many first-level/root catalogue categories while expanding the relevant descendant branch.
- The visible tree is **one shared hierarchy**, not a stack of independent root-to-leaf path fragments. Common ancestors are merged by stable tree-node identity and a branch is rendered only once at its correct depth.
- With no selection, show available first-level/root branches. With a category or PART selected, keep that root index visible and expand the complete root-to-latest-selected-leaf ancestry in the same tree.
- Selecting a category reveals its available immediate children; unrelated deeper descendants remain collapsed unless required by the active selected path or active search result.
- Canonical PART identities/names are selectable **terminal leaves** under their evidenced catalogue branch. Multiple matching PARTs remain leaves in this tree rather than becoming a second result list elsewhere.
- Hierarchy must be visually legible: each deeper level receives modest additional indentation, typography is strongest near the root and progressively lighter toward deeper branches/PART leaves, and only the active category or PART text is underlined as the selection indicator.
- Ancestors and selected occurrence/context must remain clear after normal clicks and direct tree links.
- Expand/collapse is UI state over the catalogue model, not a new data model.
- Stable Parts Tree nodes are rendered as real hyperlinks using tree-node identity, not label text.
- Opening a tree-node link enters catalogue browse context for that node/subtree and may present canonical PART candidates through the approved browse relationship.
- Tree-originated PART selection converges on the same canonical PART-resolution and downstream presentation flow as identifier search.
- A node without stable identity remains non-clickable; the UI must not fabricate a link target.
- Missing tree context is `unavailable`, not `not_found`.

## 3. Suitability Model Ranges

- Model Ranges is its own row across the centre/right workspace.
- Concept-11 depicts filter/check-box semantics to communicate or constrain fit.
- Runtime interaction may use only the selection operations actually supported by the approved read contract; the artwork does not authorize invented multi-selection behaviour.
- A resolved PART may turn ranges into factual applicability rather than arbitrary filters.
- Unsupported/unknown fitment is never shown as a positive match.

## 4. Location at car

- The region is one model-specific location canvas.
- A verified top, side, schematic, silhouette or other mapping may render inside that canvas.
- A zone/pin/location is shown only when a verified Jagports-owned mapping exists.
- Missing mapping remains visibly unavailable.
- Vehicle catalogue location is distinct from physical stock/storage location.

## 5. Suitability / Filter

This right-middle region has two modes over one applicability contract:

1. **Filter/selection mode** while browsing or when multiple candidate contexts remain.
2. **Fact mode** when one canonical PART/context is selected.

The concept illustrates Models, ModelYear, VINRanges, features and example facts such as body, engine, supercharger, market and steering. All such values must come from approved fitment evidence.

- VIN applicability comes from approved VIN-range evidence, not generic model-year inference.
- Unknowns remain explicit and exclusions remain effective.
- The `(i)` control may link to a verified **Model Family & Year Introduction PDF/document** when an approved source relationship exists.
- That document is contextual information, not proof of fitment by itself.

## 6. PART / Image / Status

The full lower centre/right region represents **one selected canonical PART only**. It is not a candidate/search-result list. When several PARTs are available from Parts Tree browsing or search, selection occurs through terminal PART leaves in the Parts Tree; until one leaf is selected this region remains in its explicit no-selected-PART/context state.

It groups:

- warning/status when supported;
- canonical PART identity and selected item/callout identity;
- Jaguar Classic indication according to its defined semantics;
- supersession relationship according to approved supersession data;
- verified part name/details;
- one selected part image or exploded diagram.

The SVG's example `Fan warning label`, `MJB7703AA`, item number, Classic and superseded text are illustrative. Do not convert them into facts unless the current result data supplies them.

## 7. Part identity and non-numbered items

- The UI must not assume every catalogue/physical item has a Jaguar part number.
- A non-numbered item may use an approved unique descriptive identifier.
- Deterministic fixture identifiers such as `firtree1` / `firtree2` remain fixture identifiers, not Jaguar part numbers.
- Never fabricate a Jaguar part number.

## 8. Stock separation

Operational stock remains separate from catalogue/reference information. Quantity, quality/condition, availability, storage location and operational notes do not mutate canonical PART identity or fitment. Stock under an older/superseded part number retains its stocked identity while supersession is shown separately.

## Permanent shell and viewport behaviour

All major Concept-11 regions remain permanent through loading, empty, unavailable and error states.

On the default desktop layout, preserve PR #616 behaviour: the page itself fits the viewport and long content scrolls inside permanent regions. Narrower layouts may reflow and use normal page scrolling.

## Implementation boundaries

- Use deterministic fixtures where production/imported data is not yet available.
- Preserve current main-branch fixture/search behaviour while changing presentation.
- Replace fixtures with imported JEPC/Jagports data through stable UI/API contracts.
- Do not fabricate missing source data or concept-only example facts.
- Keep catalogue/reference data separate from mutable operational stock.
- Preserve semantic IDs/data hooks where practical.
- Tailwind controls presentation only; it does not create a parallel domain model.

## Related specifications

- `UI_CSS_Kit.md` — Tailwind/style-theme direction.
- [`../SPEC/UI_Part_Search.md`](../SPEC/UI_Part_Search.md) — search/result-state contract.
- `UI_Specs_Parts_Tree.md` — tree hierarchy/selection contract.
- `UI_Specs_Main_View.md` — Location and PART/Image/Status synchronization.
- `UI_Specs_Fitment.md` — Model Ranges and Suitability applicability contract.
- [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md) — stock/catalogue boundary and stock-quality authority.

## Acceptance principles

A conforming implementation preserves:

- clear/empty-submit behavior, preserved stock-filter state, clean selection URLs and race-safe root restoration under the Part Search contract;
- browse-mode language continuity without fabricated source-tree identity or a selected PART;
- the merged Concept-11 geometry above;
- canonical PART identity vs occurrence/context separation;
- one persistent Parts Tree root index with shared ancestors rendered once, the complete selected root-to-leaf path expanded, depth indentation/root-weight typography applied, and PARTs represented as terminal leaves;
- Model Ranges as a separate centre/right row;
- Location and Suitability side-by-side on desktop;
- one vehicle-location canvas;
- PART/Image/Status spanning the lower centre/right workspace;
- separate future UI-language and Parts-language concerns without premature fake controls;
- viewport-fit behaviour from PR #616;
- deterministic fixture behaviour from current `main`;
- explicit unavailable states and no fabricated concept-only facts.
