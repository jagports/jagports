# VIEPS UI Specifications

## Status

This document defines the durable UI contract for the minimum demonstrable VIEPS UI MVP.

The current specification is established by Issue #468 and supersedes the earlier UI concept baseline represented by PR #366 / Issue #360.

**Implementation:** Issue #368 — VIEPS UI / Implement MVP Web UI

## MVP objective

The minimum demonstrable VIEPS UI flow is:

```text
enter Jaguar part number
        ↓
resolve PART
        ↓
show relevant Parts Tree branch
        ↓
show all vehicle ranges/models where the part is suitable
        ↓
show applicable variations/qualifiers
        ↓
show Part Image / vehicle-location representation when available
```

The UI must be usable with deterministic representative fixture data before all production/imported data is available.

## Concept View-1

The UI is driven by a part-number search and presents three coordinated areas:

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         Search part #: [ MJB7703AA ]                                  │
├───────────────────────┬──────────────────────────────────────┬───────────────────────┤
│ PARTS TREE             │              MAIN VIEW               │ SUITABILITY MODEL      │
│ relevant path(s)      │                                      │ RANGES                │
│ category hierarchy    │ Location at car / model context     │ model/range selection  │
│ nested item rows      │                                      │                       │
│ highlighted path      │       vehicle/location views         │ Jaguar Accessories    │
│                       │       + selected part context        │ Daimler Limousine     │
│ Engine                │                                      │ E-Pace                │
│  Cooling              │       PART / EXPLODED IMAGE          │ E-Type                │
│   Water Pump          │       diagram + item callouts       │ F-Pace                │
│    ...                │       selected item highlighted     │ F-Type                │
│                       │                                      │ S-Type                │
│                       │       [part name / drawing code]    │ X-Type / XE / XF / XJ │
│                       │                                      │ ...                   │
└───────────────────────┴──────────────────────────────────────┴───────────────────────┘
```

The exact visual arrangement may be refined during implementation without changing the information architecture or data contract.

### Concept View-1 visual source and minimum MVP ASCII map

**Concept UI image source:** `5-Implementation-Projects/internet/jagports/solution/vieps/VIEPS UI/VIEPS UI-Concept-1.emf`

The following map is the normative text representation of Concept View-1. The EMF is the placement authority: tree left; search, vehicle location, combined part details/image and detailed suitability in the centre; model ranges right. This supersedes the earlier minimum-MVP arrangement with PART left, tree middle and image right. It defines placement and relationships, not pixel dimensions.

```text
+-----------------------+--------------------------------------------+------------------------+
| Parts Tree            | Search part number [____________] [Search] | Suitability Model      |
| relevant path(s)      | Search status                              | Ranges                 |
|                       +--------------------------------------------+                        |
| Category              | Location at car                            | Model range selection  |
|   Parent              | [Top view]             [Side view]         | All applicable ranges  |
|     Selected context  | Verified location or explicit unavailable  |                        |
|                       +--------------------------------------------+                        |
|                       | PART details                               |                        |
|                       | Number / description / source / verification|                        |
|                       | One selected part image / diagram          |                        |
|                       | or explicit unavailable state              |                        |
|                       +--------------------------------------------+                        |
|                       | Suitability for selected range             |                        |
|                       | Variations / qualifiers / verification     |                        |
+-----------------------+--------------------------------------------+------------------------+

Search -> canonical PART -> relevant tree path
                         -> applicable ranges -> selected range -> variations
                         -> part details and one selected image/diagram
```

The minimum map establishes six information areas: part-number entry/search status, resolved PART identity/context, Parts Tree branch, suitable vehicle Ranges, selected Range with variations/qualifiers, and Main View with Part Image or explicit unavailable state.

### Initial and transitional states

All regions are visible before Search and remain in their permanent positions during loading, empty, not-found and error states. Initial content is explicit empty/unavailable guidance, not a preselected or fabricated part. Clearing the query resets the context. Responses to superseded queries must not overwrite the current view.

The EMF's empty-search stock browsing remains unavailable until an approved data contract supplies stock-based tree levels and model ranges; do not invent those entries. Vehicle top/side regions remain visible with unavailable states until verified model-specific views and location mapping are supplied. Image selection shows one image/diagram at a time, with part identity above it. Model-range selection filters the variations/qualifiers below without changing canonical PART identity.

## 1. Part search

- Search by canonical Jaguar part number.
- Resolve the catalogue PART and its relevant EPC occurrence/context.
- Explicitly represent empty and error states.
- The UI must not require production/imported data when deterministic fixture data can demonstrate the vertical slice.

## 2. Parts Tree

- Show the relevant category path for the selected part rather than requiring navigation through an unrelated full catalogue tree.
- Preserve parent/child hierarchy and nested item rows.
- Highlight the selected part/occurrence and its relevant path.
- Expand/collapse is presentation state over the same Parts Data Model; it is not a second data model.
- A canonical part may occur in multiple EPC contexts without duplicating its catalogue identity.

## 3. Main part / diagram view

- Show the selected part in its EPC context.
- Show the associated exploded diagram when available.
- Show numbered item callouts/hotspots when verified geometry is available.
- Keep tree and diagram item selection synchronized.
- Show drawing/diagram identification only where its semantics are verified.
- Missing diagram or hotspot data must produce an explicit unavailable state, never fabricated geometry.
- Initial deterministic fixture geometry may be used; the UI contract must later accept the verified #352 coordinate conversion without redesign.

## 4. Vehicle location

- Vehicle/location presentation is model-specific.
- It may provide vehicle top/side/location views and a highlighted zone for the selected part.
- Before a part search, vehicle zones may act as a location-based search entry point.
- After a part search, show the part location only when a Jagports-owned zone/pin mapping exists.
- Never invent a vehicle location when no verified mapping exists.
- Catalogue vehicle location is distinct from physical Jagports stock/storage location.

## 5. Suitability Model Ranges

- Provide model/range context and selection.
- The selected model/range scopes the vehicle/location presentation and suitability information.
- Show only ranges/models for which the searched part is applicable.
- Do not represent non-matching vehicles merely as unchecked rows.
- When applicability depends on additional attributes, show the relevant qualifier.

## 6. Fitment / applicability

- Evaluate applicability from the approved Parts Data Model and JEPC application/attribute relationships.
- Support model/range and VIN-range applicability where available.
- Preserve source constraints and exclusion semantics.
- Show relevant qualifiers such as engine, supercharger, body, market, or other verified applicability constraints when they affect the result.
- Do not silently invent meanings for unresolved attribute groups.

## 7. Part identity and non-numbered parts

- The UI consumes the Parts Data Model and must not assume every physical/catalogue item has a Jaguar part number.
- A part/item without a part number may be represented using a unique description/identifier where the approved data model permits it.
- Images may be associated with such an item for identification where supported by the model.
- The UI must never fabricate a Jaguar catalogue part number.

## 8. Supersession and Classic indicators

- A supersession indicator means a newer/current relationship exists according to the approved supersession data.
- Historical JEPC `isSuperSeded` alone is not sufficient proof of current supersession.
- Jaguar Classic status reflects JEPC snapshot semantics unless independently established as current.
- Historical and current part identities remain separately addressable.

## 9. Stock relationship

- Operational stock remains separate from catalogue/reference data.
- If stock is held under an older/superseded catalogue part number, the UI may show the newer/current supersession relationship without replacing the stocked identity.
- Stock quantity, condition, storage and other operational values must not be mixed into immutable catalogue reference data.

## Data/UI boundary

```text
PART NUMBER SEARCH
        │
        ▼
CATALOGUE PART
        │
        ├── EPC OCCURRENCE / CONTEXT
        │      ├── Parts Tree path
        │      ├── Diagram
        │      └── Hotspot / item
        │
        ├── VEHICLE / RANGE / VIN FITMENT
        │
        ├── VEHICLE LOCATION / ZONE
        │
        ├── SUPERSESSION
        │
        └── CLASSIC SNAPSHOT
        │
        ▼
JAGPORTS STOCK
        ├── quantity
        ├── condition/status
        ├── storage location
        └── operational information
```

The UI does not redefine the domain model. It consumes the stable API/data contract supplied by the Parts Data Model and related enabling work.

## Implementation boundaries

- Use deterministic fixture data for the first vertical slice where imported/production data is not yet available.
- Replace fixture data with imported JEPC/Jagports data through the same UI/API contract.
- Do not fabricate missing source data.
- Keep catalogue/reference data separate from mutable operational stock.
- Preserve source provenance and snapshot/release semantics.
- UI presentation changes must not silently change domain semantics.

## Related work

**Primary implementation**

- #368 — VIEPS UI / Implement MVP Web UI

**Specification / decision record**

- #468 — VIEPS UI / Concept View-1 — Updated MVP UI specification

**Dependencies / enabling work**

- #354 — Define and implement Parts Data Model
- #352 — RESEARCH / Determine JEPC Flash hotspot coordinate conversion
- #355 — Create JEPC Data Importer for MVP
- #358 — WDS/UFM whole-car silhouette image pull mechanism
- #361 — Range taxonomy and whole-car zone mapping research
- #362 — whole-car zones and image hotspot specification

**Superseded UI baseline**

- #360 — VIEPS UI MVP Draft
- PR #366 — previous VIEPS UI concept and WDS/UFM silhouette asset baseline

## Acceptance principles

The implementation is conforming when it can demonstrate:

- canonical Jaguar part-number search;
- canonical PART resolution and relevant occurrence/context;
- relevant Parts Tree hierarchy and selected-path highlighting;
- applicable vehicle ranges/models only;
- visible fitment variations/qualifiers where supported;
- part/exploded-image context when available;
- explicit unavailable states for missing diagrams, hotspots or vehicle mappings;
- non-numbered item representation without fabricated Jaguar part numbers;
- distinct catalogue, fitment, supersession, Classic and stock semantics;
- deterministic fixture operation without changing the UI contract when real imported data becomes available.
