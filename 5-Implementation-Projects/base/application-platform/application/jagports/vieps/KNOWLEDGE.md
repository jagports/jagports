# VIEPS Domain Knowledge

## Scope

This file contains durable, reusable knowledge for the VIEPS application domain, with particular focus on the Parts Data Model and its database boundary. It records conclusions, design reasoning and lessons learned that should remain available to future implementation and research work.

Repository-wide workflow and governance remain defined by the repository root `KNOWLEDGE.md`, `00-Management/WORKFLOWS.md`, `00-Management/RULES.md` and `SKILL.md`.

## Source-of-truth hierarchy

VIEPS data-model work must use existing accepted research before starting new discovery. The following are the primary traceability sources for the current Parts/Stock model:

1. **Issue #354 — Define and implement Parts Data Model**: canonical implementation issue and owner of the Parts Data Model/schema implementation. It consumes accepted research rather than duplicating it.
2. **Issue #353 — Research Jagports stock data and operational stock model**: owner of the operational stock-model research and its acceptance/validation. Its role is not to rediscover whether Jagports has stock data; existing Jagports Excel work already provides direct evidence of the operational data structures.
3. **Existing Jagports Excel parts/stock research**: evidence for real fields, relationships, cardinality problems and operational terminology. This evidence must be reconciled into a normalized model rather than copied as a worksheet schema.
4. **Issue/PR #364 — JEPC parts supersession knowledge**: reusable catalogue supersession knowledge and explicit source/evidence rules. It complements #354 and #353.
5. **Issue #360 — VIEPS UI requirements**: UI data-consumption requirements that constrain the model, but does not replace the data-model source above.
6. **Issues #352, #361 and #362**: specialized research for hotspot conversion, vehicle zones/range taxonomy and whole-car/third-party extensions. These are not prerequisites for the basic stock model unless explicitly approved.

When existing research answers a question, future work should validate its applicability rather than repeat the same discovery. A new research task is justified only where the existing evidence leaves a consequential decision unresolved.

## Existing Jagports Excel stock/parts evidence

The operational stock model has already been investigated using Jagports Excel data. The spreadsheets are source evidence for the database design.

The researched structures include, among other things:

- a parts master/catalogue-oriented dataset containing Jaguar part number, model, description and additional catalogue/operational attributes;
- stock-oriented data containing part reference, physical shelf/box/sub-location information and stock quantities;
- lookup structures for physical storage locations and their operational values;
- real-world evidence that catalogue information and physical stock/location can become inconsistent when represented in separate spreadsheet structures;
- evidence that not every operational item necessarily has a normal Jaguar catalogue part number, so the model must not silently assume every stock key is a canonical Jaguar PN;
- operational fields such as quantity, condition/status, storage location, donor/source, price, availability and notes where present in the source material.

The important lesson is not to reproduce `PartsMaster`, `Stock`, `StockUnits` or other worksheet layouts as database tables. The database must normalize stable domain entities and relationships while retaining enough source/provenance information to explain and validate migrated values.

The known spreadsheet structure is therefore **evidence already researched**, while the normalized database representation remains the responsibility of #354 and the accepted stock-model conclusions from #353.

## Core architectural boundary

VIEPS must distinguish reference/catalogue knowledge from mutable Jagports operational data.

```text
JEPC / vehicle reference knowledge
              │
              ▼
      CATALOGUE / REFERENCE
              │
              ▼
        JAGPORTS STOCK
              │
              ▼
     mutable operational data
```

A catalogue part describes what a part is and where/how it applies. A stock record describes what Jagports currently possesses and how that physical stock is managed.

Mutable inventory state must not be embedded in JEPC reference records.

## Canonical part identity

A canonical `part` represents a catalogue identity. The same catalogue part can occur in several EPC contexts and must not be duplicated merely because it appears in multiple diagrams, categories, applications or model contexts.

Use a separate occurrence/context relationship when the same part appears in multiple contexts.

```text
PART
 │
 └── PART OCCURRENCE / CONTEXT
       ├── EPC application/context
       ├── model / range context
       ├── fitment context
       ├── category/item context
       └── diagram/hotspot context
```

## Vehicle and VIN model

Vehicle concepts must remain distinct:

```text
MODEL RANGE
    │
    └── MODEL / VARIANT

VIN RANGE
    │
    └── VIN applicability / boundary information
```

`model_range` and `vin_range` are different concepts and must not be collapsed into one entity.

VIN research has demonstrated useful structured information including VIN prefix, serial start/end, model year, production/use-introduction boundary, market, body, engine/engine-variant discriminator, emissions discriminator, transmission/steering discriminator, source and confidence/verification state.

Where a value is decoded or derived, preserve the distinction between source fact and derived interpretation where practical.

## Fitment and source attributes

Fitment is a relationship, not merely descriptive text on a part. The model must support the applicability information needed to determine whether a part fits a vehicle/model/variant.

Where source data provides inclusion and exclusion semantics, both must be preserved. Opaque JEPC attribute groups must not be given invented human meanings. Preserve the source representation and add separately verified semantic interpretation when research establishes it.

## EPC occurrence and diagrams

A part occurrence may connect catalogue identity to EPC context such as category, item, illustration and diagram.

```text
DIAGRAM
   │
   └── HOTSPOT
          │
          └── PART OCCURRENCE
```

Diagram and hotspot information belongs to the reference/context side, not mutable stock.

Hotspot coordinates must retain their source coordinate-system meaning until a verified conversion exists. Do not silently treat unverified geometry as authoritative normalized coordinates.

## Vehicle location versus stock location

Two meanings of location must remain separate:

- **Catalogue/vehicle location** — where the part belongs on the vehicle.
- **Stock/storage location** — where Jagports physically stores the stock.

Vehicle location belongs to catalogue/occurrence/location modelling. Physical storage belongs to operational stock.

Do not put vehicle-zone semantics into a stock record merely because both concepts are called `location`.

## Zone presentation and UI concepts

Existing VIEPS UI Concept images under the implementation tree are useful presentation samples for vehicle-zone display. They are not, by themselves, the final database taxonomy or complete geometry specification.

The database should preserve enough structure to associate a part occurrence with a vehicle location/zone without prematurely hard-coding unresolved geometry or taxonomy decisions.

## VIEPS MVP Web UI knowledge

Issue #360 is the consolidated UI requirements record. The UI consumes the canonical part, occurrence/context, fitment, diagram/hotspot, vehicle-location and stock relationships; it does not redefine their domain semantics.

The agreed part-detail concept includes canonical part-number search, parts-tree context, exploded diagram/hotspots, model-specific vehicle location, fitment and stock/supersession indicators. Missing source data must produce an explicit empty/unknown state rather than invented facts.

Hotspot geometry must use the verified conversion from #352. Vehicle-zone mapping follows the accepted Range/zone research from #361/#362 when available.

## Stock model

Operational stock remains a separate mutable layer linked to canonical catalogue identity.

```text
PART
 │
 ├── Stock record A
 ├── Stock record B
 └── Stock record C
```

The current accepted MVP stock information includes, as supported by the researched source material and operational requirements:

- reference to the canonical catalogue part where one exists;
- quantity;
- condition/status;
- physical storage location;
- source/donor reference;
- availability;
- operational notes;
- price information where its exact operational meaning is accepted;
- provenance/manual-verification information where applicable.

One catalogue part may have multiple stock records where the operational model requires separate physical records.

The model must also allow the source-data case where an operational item is not yet resolved to a canonical Jaguar catalogue part. Such an item must not be falsely assigned a catalogue identity merely to satisfy a foreign key.

### Stock research status

The existence and general shape of Jagports stock data are **already researched** from Jagports Excel material. #353 should therefore be treated as the formal validation/reconciliation task for the operational model, not as an instruction to rediscover the spreadsheets.

The remaining questions for #353 are implementation decisions such as normalized stock-record cardinality, exact storage-location entities, treatment of non-catalogue stock keys, controlled condition/status values, price semantics, donor versus vendor references, individual-item tracking and transaction history. These decisions must be made from the existing evidence and explicit product requirements.

## Supersession

Supersession is a first-class catalogue relationship between part identities, not replacement of one database part by another.

Historical part numbers remain addressable and may be connected by directed supersession relationships. The model should support one-to-many relationships and chains, with provenance/evidence and verification information.

Supersession is **not a priority dependency for the basic Stock Management MVP**. Do not overwrite the stocked catalogue identity with a newer number.

PR #364 supplies reusable JEPC supersession knowledge and the explicit `MNA7691AA → XR847031` test relationship. It complements #354; it does not replace the canonical Parts Data Model issue.

## Provenance and evidence

VIEPS combines source data, researched facts and derived interpretations. These must not be silently treated as equivalent.

For externally derived or interpreted information, preserve sufficient provenance to identify, where available:

- source;
- source reference/URL;
- observed/raw value;
- derived interpretation;
- verification status;
- confidence where appropriate.

The database should make it possible to determine whether a value came directly from a source or was derived by Jagports logic.

## Third-party parts

Third-party parts, vendor data and cross-reference semantics are extensions of the core catalogue/stock model. They must not distort the canonical Jaguar catalogue identity or conflate component-of, equivalence and supersession relationships.

Complete third-party modelling follows the dedicated specification/research and is not a prerequisite for basic Stock Management unless explicitly approved.

## MVP database scope

The first stable database foundation should implement the smallest coherent relational spine required for useful VIEPS and Stock Management:

```text
VEHICLE REFERENCE
       │
       ├──────────────┐
       ▼              ▼
      PART       PART OCCURRENCE
       │              │
       │         fitment/context
       │              │
       └──────┬───────┘
              ▼
         STOCK RECORDS
```

The MVP foundation should cover:

1. minimal vehicle/model/range/VIN reference;
2. canonical catalogue part;
3. part occurrence/context;
4. fitment/application relationships;
5. source/provenance information needed to distinguish source facts from interpretation;
6. diagram/location relationships where already supported by reliable source knowledge;
7. operational stock linked to catalogue parts, with an explicit handling path for unresolved/non-catalogue stock;
8. relational constraints, indexes and automated integrity tests.

## What must not block Stock Management MVP

The following are deliberately not prerequisites for a usable first Stock Management release:

- complete Flash hotspot coordinate conversion;
- complete whole-car zone taxonomy and geometry;
- complete silhouette/range mapping;
- complete third-party parts and vendor model;
- complete VIN decoding engine;
- full JEPC semantic interpretation;
- external catalogue synchronization;
- comprehensive inventory transaction history unless separately approved.

## Database design lessons

### Normalize reusable concepts, not source documents

JEPC exports and Jagports Excel research are evidence. Their columns and presentation should not automatically become database tables or fields.

### Separate stable identity from context

A catalogue part is an identity. Occurrences, applications, diagrams and fitment contexts are relationships around that identity.

### Separate reference state from operational state

Catalogue/reference information and stock have different lifecycles and must remain independently managed.

### Do not model uncertainty as certainty

If research has not established a semantic mapping, preserve the source value and verification state rather than inventing a definitive interpretation.

### Prefer explicit relationships

Where domain meaning is sufficiently known, use typed relationships and foreign keys rather than a generic catch-all EAV structure.

### Make invalid states difficult to store

Use primary keys, foreign keys, uniqueness constraints, appropriate nullability, controlled values where justified and indexes for expected searches. Tests must deliberately exercise invalid references and duplicate identities.

## Testing principles

Representative fixtures should exercise relationships rather than merely prove that tables exist. Include:

- one catalogue part in multiple EPC contexts;
- multiple vehicle contexts;
- positive and exclusion fitment constraints;
- diagram/hotspot association where geometry is established;
- one catalogue part with multiple stock records;
- stock linked to a donor vehicle/reference;
- an unresolved/non-catalogue operational stock item;
- source provenance on imported/derived data;
- invalid foreign-key references;
- duplicate catalogue identity attempts;
- invalid uniqueness cases.

Supersession can be tested as a relationship, but richer supersession semantics must not become a prerequisite for basic stock tests.

## Implementation sequencing

The practical sequence is:

```text
Existing Excel/source evidence
            │
            ▼
#353 Stock model validation / reconciliation
            │
            ▼
#354 Parts Data Model foundation
            │
            ▼
Database schema + tests
            │
            ▼
Stock Management MVP
            │
            ▼
#355 JEPC data importer
            │
            ▼
VIEPS UI vertical slice
            │
            ▼
richer VIEPS extensions
```

The sequence explicitly acknowledges that stock data discovery has already occurred. New research should address unresolved decisions, validation and normalization rather than repeat known source inspection.

## Decision discipline

When a consequential domain decision remains unresolved, keep it explicitly unresolved and follow the project's decision workflow. Do not silently convert an Excel convention, JEPC field or UI mock-up into an authoritative database rule.

Implementation issue ownership remains:

- **#353** — operational stock-model research/validation;
- **#354** — canonical Parts Data Model and schema implementation;
- **#355** — JEPC importer;
- **#360** — VIEPS UI requirements;
- **#364** — reusable JEPC supersession knowledge;
- **#352/#361/#362** — specialized hotspot, zone/taxonomy and third-party research.

These records form the traceability chain for the VIEPS data model. The domain knowledge file records the generalized conclusions so future agents do not repeat already-settled research.