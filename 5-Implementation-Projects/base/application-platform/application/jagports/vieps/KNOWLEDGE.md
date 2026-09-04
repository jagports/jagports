# VIEPS Domain Knowledge

## Scope

This file contains durable, reusable knowledge for the VIEPS application domain, with particular focus on the Parts Data Model and database boundary. Repository-wide workflow and governance remain defined by the repository root `KNOWLEDGE.md`, `00-Management/WORKFLOWS.md`, `00-Management/RULES.md` and `SKILL.md`.

## Source-of-truth hierarchy

VIEPS data-model work must use existing accepted research before starting new discovery.

1. **Parts Data Model implementation** owns the canonical normalized model and schema implementation.
2. **Operational stock-model research** owns stock-model validation/reconciliation.
3. Existing Jagports Excel parts/stock research is direct source evidence.
4. Supersession research supplies reusable catalogue supersession knowledge.
5. VIEPS UI requirements constrain data consumption but do not redefine domain semantics.
6. Specialized hotspot, zone/taxonomy and third-party research supplies extensions and does not automatically block the basic Stock MVP.

When existing research answers a question, future work should validate applicability rather than repeat discovery.

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

A catalogue part describes what a part is and where/how it applies. A stock record describes what Jagports possesses and how that physical stock is managed. Mutable inventory state must not be embedded in JEPC reference records.

## Canonical part identity and batches

A canonical `part` represents a catalogue identity. The same catalogue part can occur in several EPC contexts and must not be duplicated merely because it appears in multiple diagrams, categories, applications or model contexts. Use a separate occurrence/context relationship for those cases.

A separate **part batch** concept is also required where source rows with the same part number represent distinct imported stock/provenance batches or otherwise need to remain separately traceable.

Therefore:

```text
CANONICAL PART IDENTITY
        │
        ├── PART OCCURRENCE / CONTEXT
        │      ├── EPC application/context
        │      ├── model / range context
        │      ├── fitment context
        │      └── diagram/hotspot context
        │
        └── PART BATCH / SOURCE INSTANCE
               └── batch-specific provenance
```

A duplicate Jaguar part number alone is **not** a data error requiring deletion or silent merging. Canonical part identity and batch/source identity are separate concerns. The normalized representation must preserve the distinction and traceability.

## Vehicle and VIN model

Vehicle concepts remain distinct:

```text
MODEL RANGE
    │
    └── MODEL / VARIANT

VIN RANGE
    │
    └── VIN applicability / boundary information
```

`model_range` and `vin_range` are different concepts and must not be collapsed. VIN research has demonstrated useful structured information including VIN prefix, serial start/end, model year, production/use-introduction boundary, market, body, engine/engine-variant discriminator, emissions discriminator, transmission/steering discriminator, source and confidence/verification state. Preserve the distinction between source facts and derived interpretation where practical.

## Fitment and source attributes

Fitment is a relationship, not merely descriptive text on a part. Where source data provides inclusion and exclusion semantics, both must be preserved. Opaque JEPC attribute groups must not be given invented meanings; preserve the source representation and add verified semantic interpretation only when established by research.

## EPC occurrence and diagrams

A part occurrence may connect catalogue identity to EPC context such as category, item, illustration and diagram.

```text
DIAGRAM
   │
   └── HOTSPOT
          │
          └── PART OCCURRENCE
```

Diagram and hotspot information belongs to reference/context, not mutable stock. Hotspot coordinates retain their source coordinate-system meaning until a verified conversion exists.

## Vehicle location versus stock location

Two meanings of location remain separate:

- **Catalogue/vehicle location** — where the part belongs on the vehicle.
- **Stock/storage location** — where Jagports physically stores the stock.

Vehicle location belongs to catalogue/occurrence/location modelling. Physical storage belongs to operational stock.

## Zone presentation and UI concepts

Existing VIEPS UI Concept images are presentation samples for vehicle-zone display. They are not the final database taxonomy or complete geometry specification. The database should preserve enough structure to associate a part occurrence with a vehicle location/zone without prematurely hard-coding unresolved geometry or taxonomy decisions.

## Stock model

Operational stock remains a separate mutable layer linked to canonical catalogue identity where one exists.

```text
PART
 │
 ├── STOCK RECORD A
 ├── STOCK RECORD B
 └── STOCK RECORD C
```

The accepted stock model includes:

- one catalogue part may have multiple stock records;
- quantity is an integer number of physical items; partial items are not required;
- condition/status uses the controlled values `A=New`, `B=Good-Working`, `C=Fair-Working`, `D=Damaged-WorkingWithFixes`, `E=Damaged-NeedsRepair`;
- physical storage is hierarchical as `Shelf → Box → BoxSub1 → BoxSub2`; the hierarchy may be recursive and boxes may contain multiple sub-boxes;
- physical sites are identified by name and the data model must support multiple sites even if MVP initially uses one;
- **Donor** means a car used to source parts from;
- **Vendor** means an organization or person;
- donor and vendor are separate concepts;
- availability means the item is inventoried and its location and condition are known;
- price is a numeric sale value in a currency; EUR is the MVP/default currency;
- non-catalogue stock is supported and must not be assigned a fabricated Jaguar part number;
- individual stock-unit IDs are not required for MVP;
- general transaction history is not required for MVP beyond adding an item to stock.

The physical storage location must remain separate from vehicle/catalogue location.

## Existing Excel stock/parts evidence

Jagports Excel parts/stock material is source evidence, not the database schema. The researched structures include a parts master/catalogue dataset, a physical stock dataset, and storage-location lookup data. Their fields and formulas must be normalized into domain entities and relationships while retaining enough provenance to explain migrated values.

Actual researched examples include:

- `Jaguar PN (S)` — Jaguar part number, mostly unique but with duplicate source rows;
- `Vendor PN` — vendor part number, which may equal or differ from Jaguar PN;
- `Price EU euro` and `Price Euro` — distinct historical price concepts;
- `Price PoundS` — genuine GBP source price;
- `URL` — link to a Jaguar part document where available;
- `Referrence Document` — third-party information URL; the spelling is historical source terminology;
- `Special Notes` — free-form text;
- `Vendor / Donor Car` — historical combined source field;
- `Donor Mileage Kilometers` — donor mileage retained as source data, with the existing source-unit conversion considered reliable;
- `Vendors` — still has value for stocked parts and was originally used to allocate sales share to the original part owner;
- `Stock value` — calculated monetary value of similar parts on stock, rather than a primary source price;
- stock examples including `CCC7028` and non-catalogue key `Balljoint-Boot`;
- storage examples including `R2A`, `B13`, `B01`, `Lokerikko`, `007`, `009`, `B13.008`, `_N/A`, `1/2`, `2/2`, `R1`, `R2`, and free-text `Valve Caps & Shims`.

The source storage vocabulary identifies at least two sites. Their accepted names are `ESPOO` and `Haaris`. The data model must therefore support explicit physical-site identity rather than infer a site from a shelf code.

`BoxSub2` is overloaded in the source data. Preserve all source values during migration and introduce normalized/unique values only where needed; do not silently discard or reinterpret the original value.

## Accepted provenance decisions

Provenance must preserve the ability to trace catalogue and stock data back to source evidence. Source facts, derived values and interpretations must remain distinguishable.

### Prices

- `Price EU euro` historically represented a planned EU-market sell price including shipping to the EU area; the shipping-inclusive idea was later abandoned.
- `Price Euro` was planned as a UK-sourced price converted from `Price PoundS` to EUR, but was not meaningfully used.
- `Price PoundS` contains genuine GBP prices.
- For MVP, a simple manually maintained `Price` in EUR is sufficient. A later model may retain source price, source currency and conversion rate separately and calculate a normalized price.

Do not treat the old spreadsheet price fields as three independent authoritative current prices.

### Notes and references

- `Special Notes` is free-form text with reasonable length.
- `URL` is a link to a Jaguar document for the part, where available.
- `Referrence Document` (historical spelling) is a third-party information URL for the part.

### Vendor versus donor

The historical combined `Vendor / Donor Car` field must be normalized into separate concepts. A row is treated as donor-car provenance when it contains a VIN number or the word `Dismantled`; otherwise it may represent a vendor. Ambiguous source values must remain traceable rather than being silently reclassified.

### Donor mileage

Donor mileage is retained. The researched source units/conversion are considered reliable for migration.

### Vendor ownership information

`Vendors` remains useful for stocked parts. Its original purpose was to identify the original part owner for allocation of a share of sales. It must not be discarded merely because sampled cells were empty.

### Stock value

`Stock value` is a calculated monetary value for similar parts held in stock. It is not the same concept as the manually maintained sale price. Condition classification and batch separation may be used as additional dimensions when calculating or grouping stock value.

### Non-catalogue/NSS provenance

`Balljoint-Boot` is an actual non-catalogue/ad-hoc/NSS stock key. Such stock is supported and requires the same provenance principle as catalogue stock: preserve source/vendor/provenance information and do not fabricate a Jaguar PN. A proposed normalized name such as `MNC1350AA+Boot` is a candidate convention, not an existing source value.

## Provenance representation principle

The normalized model should retain, where applicable:

- source/document identity;
- source URL or reference;
- raw/observed value;
- normalized value;
- derived interpretation or calculation;
- verification status and confidence where useful;
- vendor reference;
- donor vehicle/reference;
- batch/source-instance identity.

Source provenance belongs with the data entity or source instance it explains. A migrated value must remain explainable without relying on an obsolete spreadsheet formula or hidden agent knowledge.

## Supersession

Supersession is a first-class catalogue relationship between part identities, not replacement of one database part by another. Historical part numbers remain addressable and may be connected by directed relationships supporting chains and one-to-many relationships, with provenance/evidence and verification information.

Supersession is not a priority dependency for the basic Stock Management MVP. Do not overwrite the stocked catalogue identity with a newer number.

## Third-party parts

Third-party parts, vendor data and cross-reference semantics are extensions of the core catalogue/stock model. They must not distort canonical Jaguar catalogue identity or conflate component-of, equivalence and supersession relationships. Complete third-party modelling is not a prerequisite for basic Stock Management unless explicitly approved.

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
5. source/provenance information required for traceability;
6. diagram/location relationships where reliable source knowledge exists;
7. operational stock linked to catalogue parts, with an explicit path for unresolved/non-catalogue stock;
8. part-batch/source-instance representation where separate source/provenance identity must be retained;
9. relational constraints, indexes and automated integrity tests.

## What must not block Stock Management MVP

The following are deliberately not prerequisites for a usable first Stock Management release:

- complete hotspot coordinate conversion;
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

A catalogue part is an identity. Occurrences, applications, diagrams, fitment contexts and source instances are relationships around that identity.

### Separate canonical identity from source/batch identity

Duplicate source rows may legitimately represent distinct batches or provenance instances. Do not collapse them merely because their part number is identical.

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
- duplicate part-number source rows represented as separate batches where provenance requires it;
- stock linked to a donor vehicle/reference;
- an unresolved/non-catalogue operational stock item;
- source provenance on imported/derived data;
- invalid foreign-key references;
- duplicate canonical identity attempts;
- invalid uniqueness cases.

Supersession can be tested as a relationship, but richer supersession semantics must not become a prerequisite for basic stock tests.

## Implementation sequencing

The practical sequence is:

```text
Existing Excel/source evidence
            │
            ▼
Stock model validation / reconciliation
            │
            ▼
Parts Data Model foundation
            │
            ▼
Database schema + tests
            │
            ▼
Stock Management MVP
            │
            ▼
JEPC data importer
            │
            ▼
VIEPS UI vertical slice
            │
            ▼
richer VIEPS extensions
```

The sequence explicitly acknowledges that stock-data discovery has already occurred. New research should address unresolved decisions, validation and normalization rather than repeat known source inspection.

## Decision discipline

When a consequential domain decision remains unresolved, keep it explicitly unresolved and follow the project's decision workflow. Do not silently convert an Excel convention, JEPC field or UI mock-up into an authoritative database rule.

The domain knowledge file records generalized conclusions so future agents do not repeat already-settled research. Task-specific evidence and implementation history remain in their GitHub work records.