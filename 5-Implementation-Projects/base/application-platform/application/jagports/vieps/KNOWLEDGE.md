# VIEPS Domain Knowledge

## Scope

This file contains durable, reusable knowledge for the VIEPS application domain, with particular focus on the Parts Data Model and its database boundary. It records conclusions, design reasoning and lessons learned that should remain available to future implementation and research work.

Repository-wide workflow and governance remain defined by the repository root `KNOWLEDGE.md`, `00-Management/WORKFLOWS.md`, `00-Management/RULES.md` and `SKILL.md`.

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

Conceptually:

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

This separation prevents catalogue identity from becoming dependent on the way an individual source dataset happens to present the part.

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

VIN research has demonstrated that useful structured information can include:

- VIN prefix;
- serial start and end;
- model year;
- production or use-introduction boundary;
- market;
- body;
- engine or engine-variant discriminator;
- emissions discriminator;
- transmission/steering discriminator;
- source;
- confidence or verification state.

The database should normalize these concepts rather than copying an Excel worksheet structure directly.

Where a value is decoded or derived from source data, the model should preserve the distinction between the original source fact and the derived interpretation where practical. This allows later research to revise an interpretation without destroying the evidence from which it was derived.

## Fitment and source attributes

Fitment is a relationship, not merely descriptive text on a part.

The model must support the applicability information needed to determine whether a part fits a vehicle/model/variant. Where source data provides inclusion and exclusion semantics, both must be preserved.

Opaque JEPC attribute groups must not be given invented human meanings merely because a value appears suggestive. Preserve the source representation and add a separately verified semantic interpretation when research establishes one.

A fitment decision should therefore be reproducible from stored source information and accepted interpretation rather than from an undocumented implementation assumption.

## EPC occurrence and diagrams

A part occurrence may connect catalogue identity to EPC context such as category, item, illustration and diagram.

Conceptually:

```text
DIAGRAM
   │
   └── HOTSPOT
          │
          └── PART OCCURRENCE
```

Diagram and hotspot information belongs to the reference/context side of the model, not to mutable stock.

Hotspot coordinates must retain their source coordinate-system meaning until a verified coordinate conversion defines a normalized representation. Unverified geometry must not be silently presented as authoritative normalized coordinates.

## Vehicle location versus stock location

Two different meanings of location must remain separate.

**Catalogue/vehicle location** means where the part belongs on the vehicle.

**Stock/storage location** means where Jagports physically stores a stock item.

Vehicle location should therefore be represented through the catalogue/occurrence/location model, while physical storage belongs to operational stock.

Do not put vehicle-zone semantics into a stock record merely because both concepts are called `location`.

## Zone presentation and UI concepts

The VIEPS UI Concept images stored under the VIEPS implementation tree are useful visual samples for how vehicle zones can be presented to users.

They provide presentation guidance such as showing a vehicle silhouette and highlighted location/zone. They are not, by themselves, the final database taxonomy or complete geometric specification.

The database should therefore preserve enough structure to associate a part occurrence with a vehicle location/zone without prematurely hard-coding unresolved geometry or taxonomy decisions.

Zone semantics may be extended as the Range taxonomy and whole-car mapping research becomes authoritative.

Different model/range silhouettes may require different geometry even when the conceptual zone vocabulary is shared.

## VIEPS MVP Web UI knowledge

The agreed VIEPS part-detail UI is a concrete MVP implementation target, not merely a visual concept. Issue #360 is the requirements record and should remain the primary traceability point for UI behaviour.

The core interaction is a canonical Jaguar part-number search feeding a three-pane part-detail view:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Search part #: [ MJB7703AA ]                                                │
├───────────────────────┬────────────────────────┬─────────────────────────────┤
│ PARTS TREE             │ PART EXPLODING IMAGE   │ LOCATION AT CAR             │
│ category hierarchy     │ diagram + callouts     │ model-specific silhouette   │
│ highlighted path       │ item/hotspot selection │ + highlighted zone          │
│ nested item rows       │ drawing code           │ Fits to car models          │
└───────────────────────┴────────────────────────┴─────────────────────────────┘
```

The wheel-style parent/child table is another rendering of the same underlying parts tree and must not introduce a separate domain model.

### UI behaviour established so far

- Search uses the canonical Jaguar part number and resolves the catalogue part plus relevant occurrence/context.
- The parts tree is reconstructed from JEPC category parent/child relationships; the matched path is expanded/highlighted client-side.
- The exploded diagram is sourced from JEPC diagram/illustration data and uses numbered item hotspots from JEPC Flash data.
- Hotspot geometry must use the verified coordinate conversion from Issue #352. Do not invent or silently assume coordinate semantics.
- The round-arrow supersession icon means a newer/current supersession exists. It must not be inferred solely from JEPC's historical `isSuperSeded` flag.
- Current supersession should come from the Jagports supersession relationship and appropriate current-source adapter/evidence, including JLR Classic Parts where applicable.
- The Jaguar Classic shield represents JEPC `isClassic` status as of the JEPC release/snapshot, not necessarily current live Classic status.
- The car silhouette is dual-purpose: before search it can initiate a location/zone search; after search it displays the found part's vehicle location when a Jagports-owned zone/pin mapping exists.
- No location should be invented when no Jagports mapping exists.
- WDS/UFM silhouettes are presentation assets. SVG/PNG/VSG representations may be imported as appropriate, with zones authored per silhouette image.
- Different model/range silhouettes may have different geometry. The exact Range/model/variant selector granularity remains a decision unless resolved by accepted research.
- Model selection changes the silhouette set and the zone/search context.
- Fitment is evaluated from the whole JEPC application/attribute model. The UI shows only actual matches and exposes meaningful qualifiers such as `XK8 — 4.0L supercharged only`.
- Stock must remain linked to the actual stocked catalogue part. If that part is superseded, the UI may show the newer/current supersession without replacing the stocked part identity.

### UI-to-data mapping

| UI element | Required data | Source/boundary |
|---|---|---|
| Part search | canonical part number | JEPC/Jagports catalogue model |
| Parts tree | category id, parent category id, name, leaf state | JEPC category navigation |
| Highlighted tree path | occurrence/category ancestry | application/client traversal |
| Group headers | JEPC description/breakpoint text | JEPC item XML |
| Leaf item | part number, catalogue/item identifiers, internal PN | JEPC item XML |
| Classic shield | `isClassic` | JEPC snapshot |
| Supersession icon | newer/current relationship exists | Jagports supersession + current-source adapter |
| Exploded diagram | verified image/diagram identifier and asset | JEPC illustration data |
| Hotspots | item number and geometry | JEPC Flash hotspot XML + #352 conversion |
| Car location | zone/pin + model/silhouette | Jagports location schema + WDS/UFM assets |
| Model selector | Range/model/variant taxonomy | Jagports vehicle taxonomy |
| Fitment list | applicable models/variants | JEPC application + attribute rules |
| Fitment qualifier | required attributes such as supercharger | JEPC attribute constraints |
| Stock supersession | stocked PN → newer/current PN | inventory + catalogue supersession/xref |

### Implementation and testing boundary

The first concrete VIEPS UI vertical slice should build on the existing application MVP foundation where practical rather than creating a parallel application stack. An earlier merged MVP vertical slice (PR #281) demonstrated a generic browser UI/API/DB foundation, but it is not the VIEPS-specific three-pane implementation and must not be treated as completed VIEPS UI work.

VIEPS UI implementation must be incremental and testable. Each implementation PR should have a narrow purpose, explicit acceptance criteria and automated checks. Principal failure paths include invalid/nonexistent part numbers, missing diagram/hotspot data, missing vehicle-zone mapping, fitment exclusions, supersession absence, stale/historical Classic status, and stock linked to a superseded part.

The UI must not fabricate catalogue, fitment, location, hotspot or supersession facts merely to make the screen look complete. Missing source data must produce an explicit empty/unknown state appropriate to the UI.

Issue #360 remains the consolidated UI requirements record. Coordinate with #352 (hotspot conversion), #354 (Parts Data Model), #355 (JEPC importer), #361 (Range taxonomy/whole-car mapping research) and #362 (whole-car zones/third-party model specification).

## Stock model

Operational stock remains a separate mutable layer linked to the canonical catalogue part.

Conceptually:

```text
PART
 │
 ├── Stock record A
 ├── Stock record B
 └── Stock record C
```

One catalogue part may therefore have multiple independent stock records when required by the operational model.

MVP stock information includes, as supported by the accepted stock requirements:

- reference to the canonical catalogue part;
- quantity;
- condition/status;
- physical storage location;
- source/donor reference;
- availability;
- operational notes;
- provenance/manual-verification information where applicable.

Stock must reference catalogue identity rather than duplicate catalogue description, fitment, vehicle location or other reference knowledge.

## Supersession is a special relationship

Supersession is a catalogue relationship between part identities, not a replacement of one database part by another.

Historical part numbers remain addressable and may be connected by a directed supersession relationship.

However, supersession is **not a priority dependency for the basic Stock Management MVP**. It should be representable without allowing its research or richer semantics to block the core stock workflow.

Do not overwrite the stocked catalogue identity with a newer number. If a stocked part is superseded, the UI can later expose the newer relationship while the physical stock remains associated with the actual catalogue identity represented by that stock.

More detailed supersession provenance, verification and external-source synchronization are extension work unless separately required.

## Provenance and evidence

VIEPS combines source data, researched facts and derived interpretations. These must not be silently treated as equivalent.

For externally derived or interpreted information, preserve sufficient provenance to identify, where available:

- source;
- source reference;
- observed/raw value;
- derived interpretation;
- verification status;
- confidence where appropriate.

The database should make it possible to determine whether a value came directly from a source or was derived by Jagports logic.

Uncertain research findings must remain identifiable as uncertain rather than becoming hidden schema assumptions.

## Third-party parts

Third-party parts, vendor data and cross-reference semantics are an extension of the core catalogue/stock model.

They should not be allowed to distort the meaning of the canonical Jaguar catalogue part or cause `component_of`, equivalence and supersession to be treated as the same relationship.

The complete third-party model should follow its dedicated research/specification work. It is not a prerequisite for launching basic Jagports Stock Management unless explicitly approved as an MVP requirement.

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
7. operational stock linked to catalogue parts;
8. relational constraints, indexes and automated integrity tests.

The database should be extensible so later zone, hotspot, VIN, third-party and richer catalogue features can be added without redesigning the core stock boundary.

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

The purpose of this boundary is to avoid making unresolved research questions prerequisites for a feature whose essential requirement is persistent, searchable operational stock linked to stable catalogue identity.

## Database design lessons

### Normalize reusable concepts, not source documents

Source files such as JEPC exports and Excel research are evidence. Their columns and presentation should not automatically become database tables or fields.

Normalize entities and relationships that have stable domain meaning while retaining enough source information to validate the imported result.

### Do not model uncertainty as certainty

If research has not established a semantic mapping, store the source value and verification state rather than inventing a definitive interpretation.

### Separate stable identity from context

A catalogue part is an identity. Its occurrences, applications, diagrams and fitment contexts are relationships around that identity.

### Separate reference state from operational state

Catalogue/reference information changes according to source knowledge and product research. Stock changes according to Jagports operations. These lifecycles must remain independent.

### Prefer explicit relationships

Where the domain meaning is sufficiently known, use explicit typed relationships and foreign keys rather than a generic catch-all EAV structure.

### Make invalid states difficult to store

Use primary keys, foreign keys, uniqueness constraints, appropriate nullability, controlled values where justified, and indexes for expected searches.

Schema tests should deliberately exercise invalid references, duplicate identities and other integrity failures.

## Testing principles

Representative fixtures should exercise the relationships rather than merely prove that tables exist.

Useful fixture categories include:

- one catalogue part appearing in multiple EPC contexts;
- one part associated with multiple vehicle contexts;
- positive and exclusion fitment constraints;
- diagram/hotspot association where source geometry is established;
- one catalogue part with multiple independent stock records;
- stock linked to a donor vehicle/reference;
- source provenance on imported or derived data;
- invalid foreign-key references;
- duplicate catalogue identity attempts;
- invalid uniqueness cases;
- optional data omitted where the domain permits it.

Supersession can be tested as a relationship, but its richer semantics should not be allowed to become a prerequisite for basic stock tests.

## Implementation sequencing

A practical implementation sequence is:

```text
Stock research / accepted operational requirements
                    │
                    ▼
        Parts Data Model foundation
                    │
                    ├── vehicle reference
                    ├── canonical parts
                    ├── occurrences/context
                    ├── fitment
                    ├── provenance
                    └── stock relationship
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
                    ├── part search
                    ├── parts tree
                    ├── diagram/hotspots
                    ├── vehicle location/silhouette
                    ├── fitment
                    ├── supersession/classic indicators
                    └── stock integration
                    │
                    ▼
             richer VIEPS extensions
                    ├── complete zone taxonomy
                    ├── VIN decoding
                    └── third-party extensions
```

This sequencing allows the operational MVP to become useful without waiting for every long-term VIEPS research topic to be resolved, while establishing a concrete path to the VIEPS web UI.

## Decision discipline

When a consequential domain decision remains unresolved, it must remain explicitly unresolved and follow the project's decision workflow. Implementation must not silently choose a permanent semantic model merely to make coding possible.

At the same time, unresolved extension semantics should not be allowed to block a stable MVP boundary when the required core relationships are already sufficiently understood.

The objective is a database that is both implementable now and capable of receiving later VIEPS knowledge without corrupting catalogue identity or operational stock state.
