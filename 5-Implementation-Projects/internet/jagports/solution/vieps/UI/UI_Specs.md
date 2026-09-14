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
retain Parts Tree main-level index + expand relevant descendant path(s)
        ↓
show / constrain verified Model Ranges
        ↓
show Location-at-car and Suitability/Filter side-by-side
        ↓
show PART / Image / Status across the lower workspace
```

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

## 2. Parts Tree

- Parts Tree is a scrolling persistent left-side region.
- The merged SVG visibly retains many main-level catalogue categories while expanding the relevant descendant branch.
- A resolved context therefore keeps the main-level category index where supplied by the read contract and expands/emphasizes only relevant descendant path(s).
- Ancestors and selected occurrence/context must remain clear.
- Expand/collapse is UI state over the catalogue model, not a new data model.
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

The full lower centre/right region groups:

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
- `UI_Specs_Part_Search.md` — search/result-state contract.
- `UI_Specs_Parts_Tree.md` — tree hierarchy/selection contract.
- `UI_Specs_Main_View.md` — Location and PART/Image/Status synchronization.
- `UI_Specs_Fitment.md` — Model Ranges and Suitability applicability contract.
- `UI_Specs_Stock_Separation.md` — stock/catalogue boundary.

## Acceptance principles

A conforming implementation preserves:

- the merged Concept-11 geometry above;
- canonical PART identity vs occurrence/context separation;
- persistent Parts Tree main-level context with relevant descendants expanded/emphasized;
- Model Ranges as a separate centre/right row;
- Location and Suitability side-by-side on desktop;
- one vehicle-location canvas;
- PART/Image/Status spanning the lower centre/right workspace;
- separate future UI-language and Parts-language concerns without premature fake controls;
- viewport-fit behaviour from PR #616;
- deterministic fixture behaviour from current `main`;
- explicit unavailable states and no fabricated concept-only facts.
