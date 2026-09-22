# VIEPS UI Specifications

## Status

This document defines the VIEPS UI presentation and information architecture. The #875 layout below is the target for the search-results and Applicable Models enhancement; the currently deployed Concept-11 implementation remains the runtime baseline until this specification is reviewed and implemented.

Domain/data semantics remain governed by the approved search, fitment, PART and STOCK contracts. The enhancement changes display placement and interaction without creating another PART identity or expanding the reduced-MVP completion gate by itself.

**Implementation parent:** #368 — VIEPS UI / Implement MVP Web UI  
**Layout enhancement:** #875 — Search-results PART list and Applicable Models panel  
**Parts Tree coordination:** #873 — one shared-root tree with PART leaves  
**Visual foundation:** PR #645 — Concept-11

## Visual authorities

- **#875 target layout/content:** `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/Concept-11v1.svg` (the `UI-/-Enchancement` branch).
- **Tailwind style/theme:** `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/CSS-Kit-2ndRound-Tailwind-CSS.jpg`.
- **Implemented layout baseline:** `VIEPS UI-Concept-11.svg` remains evidence of the deployed presentation until the new layout is implemented and validated.

The #875 SVG and Product Owner's annotated screenshot establish region placement, not verified runtime sample PART/status/fitment data. Existing data/API specifications continue to control behaviour.

## Normative Concept-11v1 complete desktop page map (#875)

The following **Product Owner-supplied ASCII map** is the normative target desktop arrangement for #875. Preserve these region positions and relative relationships when implementing the Concept-11v1 enhancement; the accompanying geometry rules govern interaction and responsive behavior. It replaces the earlier expanded ASCII approximation rather than creating a competing layout. Concept-11 remains the deployed baseline until the enhancement is reviewed and implemented.

~~~text
┌────────────────────────┬──────────────────────────────────────────────────┬────────────────────────┐
│ Logo / instructions    │ Banner / header                                  │                        │
│ UI + Parts languages   │                                                  │                        │
├────────────────────────┼──────────────────────────────────────────────────┼────────────────────────┤
│ Availability           │ VIN                                               │ Search                 │
│ stock quality list     │ [input / range picker]                            │ [PN / free text]       │
│                        │ Filter                                            │                        │
│ Parts Tree             │ [suitability / variations]                        │ Search Results PART    │
│ scrollable             ├───────────────────────┬──────────────────────────┤ List                   │
│ root → branch → leaf   │ Location at car       │ Selected PART            │ scrollable             │
│ expanded path only     │                       │ status / part name       │ row = select PART      │
│ PART leafs selectable  │                       │ exploded diagram/image   │ checkbox = bookmark    │
│                        │                       │                          ├────────────────────────┤
│                        │                       │                          │ Applicable Models      │
│                        │                       │                          │ fixture list / fit     │
│                        │                       │                          │ filter checkboxes      │
│                        │                       │                          │ scrollable             │
└────────────────────────┴───────────────────────┴──────────────────────────┴────────────────────────┘
~~~

**Reading the map:** the centre-top VIN and normalized variations controls span the centre workspace. Directly below them, Location at car occupies centre-left and the single selected PART/Image/Status panel occupies centre-right. The permanent right column is split vertically into Search, Search Results and Applicable Models. The left Availability block remains above the persistent Parts Tree. Branding/instructions and the banner occupy the header. The illustration does not assert working language, stock, VIN or fitment controls where their read contracts are not implemented.

**Exact browse fixture index:** Jaguar Accessories; Daimler Limousine; E-Pace; E-Type; F-Pace; F-Type; S-Type; X-Type; XE Range; XF Range; XJ Range; XJS; XK Range. These are model-range browse/test labels, not a declaration of fitment to the selected PART.

**Current increment:** implement this shell, separately scrolling Parts Tree / Search Results / Applicable Models, accessible selectable PN/name rows and **one shared PART selection** across tree, result rows and centre detail. Bookmark checkboxes are visible but **disabled**, with no saving. Advanced model-range checkbox filtering is also deferred; its approved future semantics are **multiple selections matching ANY (OR)** with only positively evidenced surviving occurrences. The initial layout may display the 13-entry browse index and verified selected-PART applicability where an approved read contract exists, but must not invent fitment, VIN evidence or data-driven filters.

### Geometry rules

- The left column shows Availability above the persistent root-index Parts Tree. The latter scrolls internally and preserves the root-to-selected-node/PART context, stable identities and path de-duplication required by #873.
- The centre top contains VIN entry and the normalized Suitability/Variations filter; a blank VIN or filter may show supported browse choices only where the approved read contract provides them.
- The centre workspace places one vehicle-location canvas on the left and one selected PART/diagram/status panel on the right. The selected PART panel never presents multiple candidate PARTs.
- The persistent right column contains one primary part-number/free-text search input, a separate scrollable Search Results PART List with bookmark checkboxes, and an independently scrollable Applicable Models panel below it.
- Results rows and tree PART leaves are two views over **one shared canonical PART selection**. Their visible duplication never creates duplicate PART records or synthetic occurrence paths.
- The banner, branding and distinct UI versus catalogue-data language controls remain reserved; unimplemented controls must not pretend to work.
- The desktop shell fits the viewport, while long tree/results/models content scrolls in its own region. Narrow layouts may reflow without changing region semantics or the single-selection contract.

## Language controls shown in Concept-11

Concept-11 explicitly shows `Language [UI] [Parts]` as separate concerns.

- **UI language** is governed by #554.
- **Parts/catalogue-data language** is independently selectable under #620.
- PR #647 must remain structurally compatible with both concerns, but must **not fabricate working language selectors** before the approved #554/#620 contracts are implemented.
- Variable-length localized text must not break the layout.
- The top-left concept block is therefore a durable information-architecture requirement even when the current runtime exposes only branding/instructions and no active language controls yet.

## Core interaction flow

~~~text
Search or supported browse/VIN/variation/stock constraints
        ↓
Resolve verified canonical PART candidates and occurrence contexts
        ├─ left Parts Tree: retain root index, show relevant paths and clickable PART leaves
        └─ right Search Results: show distinct canonical PART rows + disabled bookmark placeholders
        ↓
Select ONE PART from either surface (same shared selection)
        ↓
Synchronize selected tree path/occurrence, Location at car and centre PART/image/status
        ↓
Show verified applicable ranges in right Applicable Models panel
~~~

When a PART has several source occurrences, preserve each source-qualified path. A result-row selection must not guess an occurrence or positive fitment. A PART with no selected occurrence may display verified PART-level fields while occurrence-dependent facts await explicit context selection.

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

- the exact 13-label #875 Applicable Models **browse index** independently of any chosen PART, with fixture-only provenance and no inferred positive fitment;
- a PART visible under multiple genuine occurrence paths but only once in the right-hand result list;
- two linked selection surfaces that synchronize one selected PART while bookmarking remains independent;

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

When the primary Search field is empty, supported stock/catalogue browsing may narrow the left Parts Tree and right Applicable Models index only if the approved stock-to-PART and applicability read contracts provide the evidence.

~~~text
empty Search + supported stock constraints
  ├─ resolve stock records through canonical PART references
  ├─ Parts Tree → show supported root branches and relevant paths
  ├─ Search Results → supported stock-backed PART candidates, if the browse contract supplies them
  └─ Applicable Models → only verified applicable ranges for those candidate contexts
~~~

Without a supporting browse contract, preserve the permanent regions and display unavailable/unsupported state; do not infer catalogue fitment or fabricate stock-backed ranges. Normalized A–E quality meanings are defined in `../SPEC/MODEL_STOCK.md`, not in the artwork.

## Search-result distribution

~~~text
shared search / browse / fitment state
  ├─ left Availability → supported stock-only/quality controls
  ├─ left Parts Tree → root index, matching paths + real canonical PART leaves
  ├─ centre VIN / variation Filter → supported normalized facets only
  ├─ centre Location at car → verified single vehicle location or unavailable
  ├─ centre PART / Image / Status → exactly ONE selected canonical PART
  ├─ right Search Results PART List → distinct selectable PN/name rows + disabled bookmark placeholders
  └─ right Applicable Models → verified ranges/fit, or browsing fixture index without fit claims
~~~

Filter occurrence contexts first, then derive distinct canonical PART candidates. Keep all legitimate source paths in the Parts Tree, but deduplicate right result rows by stable canonical PART identity. A row and a tree leaf share selected PART state; choosing an occurrence-specific tree leaf additionally selects that exact occurrence. If a row maps to more than one occurrence, require an explicit occurrence/context choice before showing context-specific location or fitment.

Search-result bookmark checkboxes are visible in the current layout increment but **disabled and labelled as coming later**: no bookmark storage, saved-list UI, account requirement or simulated working toggle is introduced now. When implemented in a later approved phase, bookmark state is independent of PART selection, filtering, availability, applicability and catalogue state.

## 1. Search + Availability

- The single primary part-number/deterministic-identifier/free-text Search field is in the right-hand column above Search Results; its resolution order, match highlighting and stock-filtered-empty semantics remain controlled by `../SPEC/UI_Part_Search.md`.
- The left Availability area consumes approved operational STOCK controls and does not change catalogue identity, fitment or source evidence.
- Centre VIN and suitability/variations filters are separate narrowing inputs, populated from approved data. Blank input browse lists, including VIN ranges, are shown only when the supporting contract exists.
- Invalid, not-found, multiple-match, context-only, unsupported, unavailable and error states remain explicit; neither search-results rows nor filters may fabricate a PART.
- The #875 layout adds a second PART-selection surface; it does not add a second search engine or change deterministic-first/free-text-fallback resolution.

### Occurrence-first Parts Tree filtering

Imported catalogue browsing is occurrence-first. A Parts Tree branch represents source occurrence contexts; filters narrow those occurrences, then the UI shows the distinct PARTs that still have at least one surviving occurrence.

Part-number reverse search may expose every occurrence/path for the canonical PART. Do not merge those paths into one synthetic applicability path.

JEPC catalogue-data language is distinct from VIEPS UI locale. If imported language trees differ structurally, the Parts Tree presents the selected source-language structure rather than assuming one fixed tree with translated labels.

## 2. Parts Tree

- The Parts Tree remains a persistent, independently scrolling left-side catalogue hierarchy with the root index visible.
- A selected category or PART shows one expanded root-to-selection path with stable-node ancestor de-duplication. Show immediate children of the active branch and avoid expanding unrelated descendants.
- Present canonical PART names/identities as selectable terminal tree leaves under supported catalogue contexts. Real stable node/PART links preserve the context; selected text is underlined, with modest indentation and root-to-leaf font-weight progression.
- A search may display the same canonical PART both as a tree leaf (potentially at several genuine occurrence paths) and as one right-hand Search Results row. Both surfaces update one shared selected PART; tree leaves may also select the exact occurrence.
- Never infer a tree path, occurrence, PART identity or fitment. The implementation details and direct-link guarantees remain owned by #873 and `UI_Specs_Parts_Tree.md`.

## 3. Suitability Model Ranges

The #875 **Applicable Models** panel occupies the right column below Search Results. It has two distinct modes:

1. **No selected PART — browse/filter index:** display the available model-range fixture/index entries without asserting that an unselected PART fits them. Supported model selection may constrain candidate occurrences, independently of centre variations filters. Filter state must be distinguishable from fitment state.
2. **Selected PART/context — verified applicability:** display only ranges with approved `applicable` evidence for the selected PART/occurrence and vehicle context. Excluded/not-applicable ranges are not presented as suitable. Distinguish no confirmed match, unavailable evidence and processing errors. A range may show verified contextual qualifiers without promoting unknowns to fit.

The required deterministic **browse fixture display labels**, in order, are: Jaguar Accessories; Daimler Limousine; E-Pace; E-Type; F-Pace; F-Type; S-Type; X-Type; XE Range; XF Range; XJ Range; XJS; XK Range. These labels test the index, not any PART's per-range applicability; use verified existing normalized IDs when available and fixture-only IDs otherwise.

**Approved model-range filter rule:** users may select multiple ranges, with **ANY (OR)** matching: a canonical PART qualifies when at least one surviving evidenced occurrence is positively applicable to at least one selected range, subject to all other active supported constraints. Deselecting every range removes the range constraint. Never treat unavailable/unknown fitment as a positive match or apply filters using labels as identities. The advanced multi-range filtering backend is deferred; until a supported read contract exists, controls may appear in the approved layout but remain disabled rather than silently filtering incorrectly.

## 4. Location at car

- The region is one model-specific location canvas.
- A verified top, side, schematic, silhouette or other mapping may render inside that canvas.
- A zone/pin/location is shown only when a verified Jagports-owned mapping exists.
- Missing mapping remains visibly unavailable.
- Vehicle catalogue location is distinct from physical stock/storage location.

## 5. Suitability / Filter

The centre-top Filter is a normalized Suitability / Variations *search narrowing* control (#641); it is distinct from the right-hand Applicable Models panel's browse filters and evidence-backed fit indicators.

- During browsing or multi-candidate search, show only distinct fitting normalized options returned for the current result universe. Selecting an option narrows surviving occurrence contexts and consequently the Parts Tree, Search Results and applicable range presentation.
- For one selected PART/context, show verified qualifiers and exclusions through the existing fitment/detail contract; do not turn browse-filter labels into fitment facts.
- VIN-range applicability comes from approved VIN evidence; unavailable data stays explicit and is not a negative match. Preserve source qualifiers such as body, steering, market and engine only when verified.
- The optional `(i)` reference may open a verified Model Family & Year Introduction document; it never proves fitment on its own.

## 6. PART / Image / Status

The selected PART panel occupies the centre-right workspace beside Location at car, never the right-hand multi-PART Search Results column.

It groups one verified selected PART's identity/name, EPC item/callout, warnings, Jaguar Classic and supersession where sourced, plus one relevant image or exploded diagram or an explicit unavailable state. A multi-match search selects no PART by default; choosing a result row or tree leaf updates this *one* panel. Selection changes do not mutate canonical identity.

The concept's `Fan warning label`, `MJB7703AA`, item number, Classic and superseded text are illustrative only. Missing media, location or occurrence-dependent details remain unavailable rather than guessed.

## 7. Part identity and non-numbered items

- The UI must not assume every catalogue/physical item has a Jaguar part number.
- A non-numbered item may use an approved unique descriptive identifier.
- Deterministic fixture identifiers such as `firtree1` / `firtree2` remain fixture identifiers, not Jaguar part numbers.
- Never fabricate a Jaguar part number.

## 8. Stock separation

Operational stock remains separate from catalogue/reference information. Quantity, quality/condition, availability, storage location and operational notes do not mutate canonical PART identity or fitment. Stock under an older/superseded part number retains its stocked identity while supersession is shown separately.

## Permanent shell and viewport behaviour

All major #875 regions retain their allocated space during loading, empty, unavailable and error states. On the default desktop layout, preserve #616's viewport-fit shell: the page itself fits the viewport, with **separate internal scrolling for the Parts Tree, Search Results list and Applicable Models panel**. Avoid nested scroll traps; preserve keyboard scrolling, visible focus, accessible region headings, row links and separately labelled bookmark/filter checkboxes. Narrower layouts may reflow and use normal page scrolling while preserving selected PART/tree context.

## Approved #875 Product Owner decisions — 2026-09-22

1. **Bookmarks:** show a separate checkbox beside each PART result now, **disabled and labelled for a future release**. Do not implement session/browser/account persistence, saved lists, or a misleading local-only bookmark toggle in this increment. Future bookmarking remains independent of shared PART selection, fitment and stock.
2. **Model range filtering:** support selecting several ranges with **ANY (logical OR)** semantics in the later supported filtering increment. A PART survives when at least one of its evidenced surviving occurrences is positively applicable to at least one chosen range, together with all other active approved constraints; zero ranges selected means no range constraint. Missing/unavailable evidence is not a match. Checkboxes may be shown disabled until the read contract supports this correctly; do not simulate an effective filter.
3. **Phase split:** implement the approved three-column **layout and synchronized Parts Tree / right-hand Search Results PART selection now**, without changing #280's existing reduced-MVP closure gate by itself. Defer bookmark activation/persistence and advanced model-range filtering to later, separately governed implementation work. The 13-label fixture browse index and verified selected-PART applicability presentation remain in the layout increment where existing supported data permits.

The current implementation acceptance is limited to page regions/scrolling/accessibility, distinct PN/name rows and shared selection with one centre PART, retained #873 tree semantics, visible disabled bookmark controls, and non-fabricated Applicable Models browse/fact states. Later increments require their own API, storage, authorization and integration tests; these are **not** acceptance blockers for the layout increment.

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

A conforming #875 implementation preserves:

- the three-column target layout, including distinct left Availability/Parts Tree, centre VIN/Variations and one Location/PART pair, and right Search/Results/Applicable Models;
- one canonical PART identity shared by the Parts Tree and right-hand Search Results, with genuine source-qualified occurrences and no guessed default PART for multi-match;
- persistent tree root index, stable links, no repeated shared ancestors, expanded path to selected PART, clear indentation and underlined selection as specified under #873;
- independently selectable PN/name result rows, with separately labelled **disabled** bookmark checkboxes until later activation/storage is approved;
- the exact 13-label fixture browse index without treating every label as evidence of fitment;
- right Applicable Models showing only verified fitting ranges for a selected PART/context; unavailable, no-match, excluded and error remain separate;
- normalized centre variation filters from #641 rather than a second presentation-only taxonomy;
- evidence-backed single Location canvas and one selected PART/image/status panel;
- UI-vs-Parts language independence, internal scrolling, keyboard/screen-reader support and #616 viewport-fit behavior;
- existing deterministic-first/free-text-fallback, stock-only semantics, canonical PART vs occurrence boundaries and explicit missing-data states.

The three Product Owner decisions are recorded above. Layout/shared-selection acceptance is separate from deferred bookmark activation and advanced ANY-range filtering.
