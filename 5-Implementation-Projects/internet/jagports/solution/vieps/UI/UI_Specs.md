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
show relevant Parts Tree path(s)
        ↓
show applicable model/range context
        ↓
show suitability facts / selectable qualifiers supported by data
        ↓
show location, part status/details and one selected part image/diagram
```

## Concept-11 ASCII map

The following map is the normative text representation of Concept-11. It defines placement and relationships, not exact pixel dimensions.

```text
┌──────────────────────────┬──────────────────────────────────────────────────────────┬──────────────────────────────┐
│ PARTS TREE               │ SEARCH / AVAILABILITY                                   │ SUITABILITY MODEL RANGES     │
│ show relevant path(s)    │ Search: [ part number / supported identifier ] [Search] │ filter/check applicable fit  │
│                          │ Availability: [ supported stock qualities/status ▼ ]     │                              │
│ Catalogue hierarchy      │ Search status / active constraints                       │ [ ] Jaguar Accessories       │
│  ├─ main level           ├──────────────────────────────────────────────────────────┤ [ ] Daimler Limousine        │
│  │  └─ child             │ LOCATION AT CAR                                          │ [ ] E-Pace                   │
│  └─ selected context     │ [ top view / location context ] [ side view / context ] │ [ ] E-Type                   │
│      strongly highlighted│ verified zone/pin or explicit unavailable state          │ [ ] F-Pace                   │
│                          ├──────────────────────────────────────────────────────────┤ [ ] F-Type                   │
│                          │ SUITABILITY / FILTER                                     │ [ ] S-Type                   │
│                          │ when several results: selection/filter lists             │ [ ] X-Type                   │
│                          │ [Models] [Model year] [VIN ranges] [features] [...]      │ [ ] XE Range                 │
│                          │                                                          │ [ ] XF Range                 │
│                          │ when one PART is selected: verified applicability facts  │ [ ] XJ Range                 │
│                          │ • model/range / VIN applicability                        │ [ ] XJS Coupe/Convertible    │
│                          │ • body / engine / supercharger / market / other          │ [x] XK Range (Modern)        │
│                          │ • optional info link to verified model/year material     │                              │
│                          ├──────────────────────────────────────────────────────────┤                              │
│                          │ PART / IMAGE / STATUS                                    │                              │
│                          │ [warning/status] [PART number] [item/callout]            │                              │
│                          │ [Classic status] [supersession relationship]             │                              │
│                          │ [part name/details]                                      │                              │
│                          │ [one selected part image / exploded diagram]             │                              │
│                          │ or explicit unavailable state                            │                              │
└──────────────────────────┴──────────────────────────────────────────────────────────┴──────────────────────────────┘
```

### Empty-search / browsing relationship

Concept-11 also defines an empty-search relationship between stock availability, Parts Tree and model ranges:

```text
empty part search
      │
      ├── supported stock/availability constraint
      │
      ├── Parts Tree → show only main/relevant levels represented by matching stock
      │
      └── Model Ranges → show/filter ranges represented by matching stock/applicability
```

This relationship is **conditional on an approved stock/catalogue query contract**. Until that contract exists, the permanent regions remain visible with explicit unavailable guidance. Do not invent stock-derived hierarchy or fitment.

### Search-result relationship

```text
part search
   ↓
canonical PART
   ├── selected/relevant EPC occurrence(s) → Parts Tree
   ├── applicable model/ranges            → right-side range fit/check controls
   ├── qualifiers/VIN applicability       → centre suitability facts/filter region
   ├── vehicle location mapping           → Location at car
   └── details/status/image/diagram        → lower centre PART / IMAGE / STATUS
```

## Permanent shell and viewport behaviour

All major regions are permanent. Loading, empty, not-found and error states do not move the information architecture into temporary locations.

On the default desktop layout the application shell follows PR #616: the page itself remains fitted to the viewport and long content scrolls inside its permanent region. Narrower layouts may collapse/reflow and use normal page scrolling.

Variable-length localized text must not break the layout. Final post-MVP UI approval depends on the #554 i18n contract. UI locale and JEPC catalogue-data language remain independent concerns under #620.

## 1. Search and availability

- Canonical Jaguar part-number search remains a primary entry point.
- Supported alternative identifier/search modes may be added only through their approved specifications.
- Search status must distinguish empty, invalid, not-found, resolved, unavailable-context and error states.
- Concept-11 places availability beside Search as a constraint/filter concern.
- Availability/quality options are operational stock data; they do not mutate PART identity or fitment semantics.
- If availability filtering is not supported by the current read contract, present it as unavailable/disabled rather than simulate results.

## 2. Parts Tree

- The Parts Tree occupies the persistent left column.
- Show the relevant category path(s), ancestors and enough surrounding hierarchy to understand the selected occurrence.
- Strongly highlight the selected/relevant occurrence/path.
- Expand/collapse and relevant-path filtering are presentation state over the same catalogue model.
- A canonical PART may occur in multiple EPC contexts without duplicating canonical identity.
- Empty-search stock-based tree filtering is only valid when supported by an approved stock/catalogue query contract.

## 3. Suitability Model Ranges

- The right-side region shows applicable model/range context.
- Concept-11 depicts fit/check controls so one or more supported ranges can constrain the view.
- A single resolved PART may make range membership a factual applicability display rather than an arbitrary user filter.
- Show only verified applicable ranges unless a separate approved browsing mode explicitly asks for all ranges.
- Do not represent unsupported or unknown fitment as a positive match.

## 4. Suitability / filter region

The centre suitability region has two modes over the same applicability contract:

1. **Selection/filter mode** when several candidate contexts/results remain.
2. **Fact mode** when one canonical PART/context is selected.

Supported dimensions may include model, model year, VIN range and verified features/qualifiers such as body, engine, supercharger, market or transmission.

- VIN applicability must come from approved VIN-range evidence, not generic year inference.
- Unknown qualifier data remains explicit.
- Exclusions are preserved.
- Optional information links may point to verified model-family/year documentation when such a repository/source relationship exists.

## 5. Location at car

- Vehicle/location presentation is model-specific.
- It may provide top/side/location views and a highlighted zone for the selected part.
- After part selection, show a location only when a verified Jagports-owned mapping exists.
- Missing mapping is an explicit unavailable state.
- Catalogue vehicle location is distinct from physical Jagports stock/storage location.

## 6. PART / image / status region

The lower-centre region combines the selected identity/context with its primary visual presentation.

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
        │      ├── Parts Tree path
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
- relevant Parts Tree hierarchy and selected-path highlighting;
- verified applicable model/range presentation;
- supported suitability filters/facts and explicit unavailable states;
- vehicle-location presentation only from verified mapping;
- combined part identity/status/image/diagram context;
- distinct catalogue, fitment, supersession, Classic and stock semantics;
- Concept-11 layout relationships and Tailwind reference style/theme;
- viewport-fit behaviour from PR #616;
- i18n-safe variable-length presentation and independent catalogue-data language;
- deterministic fixture operation without changing the contract when real data replaces fixtures.
