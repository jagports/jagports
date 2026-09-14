# VIEPS UI Specifications

## Status

This document defines the durable VIEPS UI information architecture and presentation contract.

The domain/data behaviour remains controlled by the existing VIEPS specifications and Parts Data Model. For the Tailwind visual implementation, **Concept-11 supersedes the older Concept View-1 placement map** while preserving those contracts.

**Implementation parent:** #368 — VIEPS UI / Implement MVP Web UI  
**Controlling specification:** #468 — VIEPS UI specification  
**Tailwind implementation:** #642 / PR #647  
**Concept-11 visual review:** PR #645

## Visual authorities

The current visual implementation uses two distinct authorities:

- **Layout/content relationships:** `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/VIEPS UI-Concept-11.svg`
- **Tailwind style/theme:** `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/CSS-Kit-2ndRound-Tailwind-CSS.jpg`

Supporting direction remains `UI_Visualization_AI_Prompt.png`, repository `docs/*.png` Jagports imagery and the JEPC Parts Tree references/specifications.

The images define presentation direction. Existing VIEPS data/API specifications remain authoritative for behaviour. A control shown in concept artwork does not authorize fabricated data or unsupported application logic.

## Core interaction flow

```text
search / browse constraints
        ↓
resolve canonical PART or constrained catalogue/stock context
        ↓
show Parts Tree main-level context with relevant descendant path(s) expanded
        ↓
show applicable model/range context
        ↓
show suitability filters or verified facts supported by data
        ↓
show vehicle location, part status/details and one selected part image/diagram
```

## Concept-11 ASCII map

The following map is the normative text representation of the approved Concept-11 SVG. It follows the actual region geometry and labels; it defines placement and relationships, not exact pixel dimensions.

```text
┌──────────────────────────┬──────────────────────────────────────────────────────────┬──────────────────────────────┐
│ PARTS TREE               │ SEARCH + AVAILABILITY                                    │ SUITABILITY MODEL RANGES     │
│ main-level category index│ Search: [ part number / supported identifier ] [Search]  │ filter/check applicable fit  │
│                          │ Availability: [ stock quality A…E / descriptions ▼ ]      │                              │
│ Only relevant descendant │ Search / constraint status                                │ [ ] Jaguar Accessories       │
│ path(s) are expanded /   ├──────────────────────────────────────────────────────────┤ [ ] Daimler Limousine        │
│ emphasized.              │ LOCATION AT CAR                                          │ [ ] E-Pace                   │
│                          │ [ one vehicle-location canvas ]                           │ [ ] E-Type                   │
│ Catalogue main level     │ verified zone/pin/image or explicit unavailable state    │ [ ] F-Pace                   │
│  ├─ category             ├──────────────────────────────────────────────────────────┤ [ ] F-Type                   │
│  ├─ category             │ SUITABILITY / FILTER                                     │ [ ] S-Type                   │
│  ├─ relevant parent      │ browse/multiple-result mode: selection/filter list(s)    │ [ ] X-Type                   │
│  │   └─ selected context │ [Models] [Model year] [VIN ranges] [features] [...]      │ [ ] XE Range                 │
│  └─ category             │                                                          │ [ ] XF Range                 │
│                          │ one selected PART/context: verified applicability facts  │ [ ] XJ Range                 │
│ selected occurrence/path │ • model/range / VIN applicability                        │ [ ] XJS Coupe/Convertible    │
│ strongly highlighted     │ • body / engine / supercharger / market / other          │ [x] XK Range (Modern)        │
│                          │ • (i) verified Model Family & Year Introduction document │                              │
│                          ├──────────────────────────────────────────────────────────┴──────────────────────────────┤
│                          │ PART / IMAGE / STATUS                                                                    │
│                          │ [warning/status] [PART number] [item/callout]                                     │
│                          │ [Classic status] [supersession relationship]                                     │
│                          │ [part name/details]                                                                    │
│                          │ [one selected part image / exploded diagram] or explicit unavailable state       │
└──────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

### Geometry rules from the approved SVG

- Parts Tree is a persistent full-height left column.
- Search and Availability share the top-centre strip.
- `Location at car` is **one vehicle-location canvas**. The older Concept View-1 split into separate Top/Side boxes is not the Concept-11 layout.
- The centre Suitability / Filter region sits below Location.
- Suitability Model Ranges occupies the upper-right workspace through the Suitability boundary only.
- The right range region **does not continue beside** the lower PART / Image / Status region.
- PART / Image / Status occupies the lower-centre/right-width workspace shown in Concept-11, while the Parts Tree remains at left.

### Empty-search / browsing relationship

Concept-11 defines an empty-search relationship between stock availability, Parts Tree and model ranges:

```text
empty part search
      │
      ├── supported stock/availability/quality constraint
      │
      ├── Parts Tree → retain/show main levels represented by matching stock
      │                 and expand only relevant descendant paths as context is narrowed
      │
      └── Model Ranges → show/filter ranges represented by matching stock/applicability
```

The SVG illustrates stock-available part qualities as `A…E` with descriptions. Those labels/meanings are concept placeholders unless and until an approved stock contract defines them.

This relationship is **conditional on an approved stock/catalogue query contract**. Until that contract exists, the permanent regions remain visible with explicit unavailable guidance. Do not invent stock-derived hierarchy, quality meanings or fitment.

### Search-result relationship

```text
part search
   ↓
canonical PART
   ├── selected/relevant EPC occurrence(s) → Parts Tree
   │                                         keep main-level context;
   │                                         expand/emphasize relevant descendants
   ├── applicable model/ranges            → right-side range fit/check controls
   ├── qualifiers/VIN applicability       → centre suitability facts/filter region
   ├── verified vehicle location          → one Location-at-car canvas
   └── details/status/image/diagram        → lower PART / IMAGE / STATUS region
```

## Permanent shell and viewport behaviour

All major regions are permanent. Loading, empty, not-found and error states do not move the information architecture into temporary locations.

On the default desktop layout the application shell follows PR #616: the page itself remains fitted to the viewport and long content scrolls inside its permanent region. Narrower layouts may collapse/reflow and use normal page scrolling.

Variable-length localized text must not break the layout. Final post-MVP UI approval depends on the #554 i18n contract. UI locale and JEPC catalogue-data language remain independent concerns under #620.

## 1. Search and availability

- Canonical Jaguar part-number search remains a primary entry point.
- Supported alternative identifier/search modes may be added only through their approved specifications.
- Search status must distinguish empty, invalid, not-found, resolved, unavailable-context and error states.
- Concept-11 places Availability beside Search in the same top strip.
- The concept illustrates an availability selection list of stock-available part qualities `A…E` with descriptions.
- Actual quality codes/descriptions must come from the approved stock contract; concept labels are not source data.
- Availability/quality options are operational stock data; they do not mutate PART identity or fitment semantics.
- If availability filtering is not supported by the current read contract, present it as unavailable/disabled rather than simulate results.

## 2. Parts Tree

- The Parts Tree occupies the persistent left column.
- Concept-11 retains a main-level category index rather than replacing the entire tree with one isolated path.
- For a resolved PART/context, only relevant descendant path(s) need to be expanded/emphasized; unrelated descendant branches are not required.
- Preserve ancestors and enough hierarchy to understand the selected occurrence.
- Strongly highlight the selected/relevant occurrence/path.
- Expand/collapse and relevant-path filtering are presentation state over the same catalogue model.
- A canonical PART may occur in multiple EPC contexts without duplicating canonical identity.
- Empty-search stock-based tree filtering is only valid when supported by an approved stock/catalogue query contract.

## 3. Suitability Model Ranges

- The right-side region shows applicable model/range context.
- Concept-11 depicts fit/check controls so supported ranges can communicate or constrain fit according to the current mode.
- A single resolved PART may make range membership a factual applicability display rather than an arbitrary user filter.
- The desktop right-side region ends at the Suitability boundary and does not occupy the space beside the lower PART/Image/Status region.
- Show only verified applicable ranges unless a separate approved browsing mode explicitly asks for all ranges.
- Do not represent unsupported or unknown fitment as a positive match.

## 4. Suitability / filter region

The centre suitability region has two modes over the same applicability contract:

1. **Selection/filter mode** while browsing or when several candidate contexts/results remain.
2. **Fact mode** when one canonical PART/context is selected.

Concept-11 illustrates dimensions including Models, ModelYear, VINRanges, features and other qualifiers.

- Supported dimensions may include model, model year, VIN range and verified features/qualifiers such as body, engine, supercharger, market or transmission.
- VIN applicability must come from approved VIN-range evidence, not generic year inference.
- Unknown qualifier data remains explicit.
- Exclusions are preserved.
- The `(i)` information control may link to verified **Model Family & Year Introduction** documentation when such a source relationship exists.
- The information document is contextual reference; it does not itself prove applicability.

## 5. Location at car

- Vehicle/location presentation is model-specific.
- Concept-11 defines **one vehicle-location canvas** for this region.
- A verified top, side, schematic, silhouette or other location representation may be rendered inside that canvas when supplied by the approved mapping/source contract; the shell does not divide the region into permanent Top/Side sub-panels.
- After part selection, show a location only when a verified Jagports-owned mapping exists.
- Missing mapping is an explicit unavailable state.
- Catalogue vehicle location is distinct from physical Jagports stock/storage location.

## 6. PART / image / status region

The lower-centre region combines the selected identity/context with its primary visual/status presentation.

Concept-11 groups in this region:

- warning/status where supported;
- canonical PART number/identity;
- selected item/callout identity;
- Jaguar Classic indication where supported by its defined semantics;
- supersession relationship where supported;
- part name/details;
- one selected part image or exploded diagram.

Rules:

- Show canonical PART number/identity and verified name/description.
- Show selected item/callout identity where supplied by EPC context.
- Show warning/status information only when backed by approved data.
- Supersession and Jaguar Classic indicators retain their separate defined semantics; historical snapshot information must not be presented as current fact without evidence.
- Show one selected part image or exploded diagram at a time.
- Missing image/diagram/hotspot data is an explicit unavailable state.
- Tree/diagram item selection refers to the same occurrence/item context and does not mutate canonical PART identity.

## 7. Part identity and non-numbered parts

- The UI consumes the Parts Data Model and must not assume every physical/catalogue item has a Jaguar part number.
- A non-numbered item may use an approved unique description/identifier.
- Images may be associated with such items where supported.
- Never fabricate a Jaguar part number.

## 8. Stock relationship

- Operational stock remains separate from catalogue/reference data.
- Quantity, quality/condition, availability, storage and operational notes do not alter canonical catalogue identity.
- Stock held under an older/superseded part number retains its stocked identity while the UI may separately show the supersession relationship.
- Physical storage location must not be confused with vehicle/location context.

## Data/UI boundary

```text
SEARCH / BROWSE CONSTRAINTS
        │
        ▼
CATALOGUE PART / RESULT SET
        │
        ├── EPC OCCURRENCE / CONTEXT
        │      ├── Parts Tree main-level context + relevant path
        │      ├── Diagram / item
        │      └── selected occurrence
        │
        ├── VEHICLE / RANGE / VIN FITMENT
        │      └── qualifiers / exclusions
        │
        ├── VEHICLE LOCATION / ZONE
        │
        ├── SUPERSESSION / CLASSIC SNAPSHOT
        │
        └── MEDIA
        │
        ▼
JAGPORTS STOCK
        ├── quantity / availability
        ├── quality / condition / status
        ├── storage location
        └── operational information
```

The UI does not redefine the domain model. Styling/layout must not infer or manufacture business data.

## Implementation boundaries

- Use deterministic fixture data where production/imported data is not yet available.
- Replace fixtures with imported JEPC/Jagports data through the same stable UI/API contracts.
- Do not fabricate missing source data.
- Preserve source provenance and snapshot/release semantics.
- Keep catalogue/reference data separate from mutable operational stock.
- Preserve existing semantic IDs/data hooks where practical during visual migration.
- Tailwind controls presentation only; it does not create a parallel data model.

## Related specifications

- `UI_CSS_Kit.md` — Tailwind/style-theme direction.
- `UI_Specs_Part_Search.md` — search and result-state contract.
- `UI_Specs_Parts_Tree.md` — tree hierarchy/selection contract.
- `UI_Specs_Main_View.md` — part/image/diagram synchronization.
- `UI_Specs_Fitment.md` — fitment qualifiers and VIN applicability.
- `UI_Specs_Stock_Separation.md` — stock/catalogue boundary.

## Acceptance principles

A conforming implementation preserves:

- canonical PART identity and occurrence/context separation;
- persistent Parts Tree main-level context with relevant descendants expanded/emphasized;
- verified applicable model/range presentation with the approved upper-right geometry;
- supported suitability filters/facts and explicit unavailable states;
- one vehicle-location canvas with content only from verified mapping;
- combined part identity/status/image/diagram context in the lower region;
- distinct catalogue, fitment, supersession, Classic and stock semantics;
- Concept-11 layout relationships and Tailwind reference style/theme;
- viewport-fit behaviour from PR #616;
- i18n-safe variable-length presentation and independent catalogue-data language;
- deterministic fixture operation without changing the contract when real data replaces fixtures.
