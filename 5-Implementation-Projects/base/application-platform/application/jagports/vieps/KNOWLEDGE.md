# VIEPS Domain Knowledge

## Scope

This file contains durable, reusable VIEPS domain decisions that must survive individual Issues, PRs and implementation changes. It is not a second implementation specification. Detailed schema, stock, importer and UI requirements remain in their owning work records and authoritative specifications.

Repository-wide workflow and governance remain defined by the repository root `KNOWLEDGE.md`, `00-Management/WORKFLOWS.md`, `00-Management/RULES.md` and `SKILL.md`.

## Source-of-truth hierarchy

VIEPS work must use existing accepted research before starting new discovery.

1. **Parts Data Model / #354** owns the canonical normalized model and schema implementation.
2. **Stock research / #353** owns operational stock-model validation and reconciliation.
3. **JEPC importer / #355** owns JEPC source inspection, source-to-MVP mapping and importer behaviour.
4. **VIEPS UI requirements / #360** owns the implementation-ready UI requirements and data mapping.
5. **JEPC supersession knowledge / #364** owns the reusable supersession research.
6. **Specialized research / #352, #361, #362** owns hotspot, zone/taxonomy and third-party research respectively.
7. Existing Jagports Excel and other source material is evidence; it is not itself the database schema.

When an existing work record answers a question, future work should validate applicability rather than repeat discovery.

## Core architectural boundary

VIEPS distinguishes reference/catalogue knowledge from mutable Jagports operational data.

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

A catalogue part describes what a part is and its reference/application context. A stock record describes what Jagports possesses and how that physical stock is managed. Mutable inventory state must not be embedded in JEPC reference records.

## Canonical identity versus context

A canonical `part` represents a catalogue identity. The same catalogue part may occur in several EPC contexts and must not be duplicated merely because it appears in multiple diagrams, categories, applications or model contexts.

Use occurrence/context relationships for EPC, fitment, model, diagram and similar context. Preserve separate source/batch identity where source provenance requires it. A duplicate Jaguar part number is not by itself proof that source rows should be merged.

The detailed persistent entity definitions, constraints and fixtures belong to #354 and its authoritative implementation documentation.

## Vehicle and VIN boundary

`model_range`, `model`/`variant` and `vin_range` are distinct concepts. VIN decoding is a vehicle-context capability: decoded VIN information may constrain fitment/application selection, but VIN decoding itself is not part of the catalogue-part identity.

Source VIN facts and decoded/derived interpretation must remain distinguishable where practical so later research can revise an interpretation without destroying the source evidence.

The detailed VIN schema and decoder implementation are owned by their dedicated VIN work, not by this knowledge file.

## Fitment and source attributes

Fitment is a relationship, not merely descriptive text on a part. Where source data provides inclusion/exclusion semantics, those semantics must be preserved. Opaque JEPC attributes must not be assigned invented meanings; verified semantic interpretation may be stored separately from the original source representation.

The authoritative fitment implementation and JEPC attribute mapping belong to #354/#355 and the approved VIEPS UI contract in #360.

## Reference location versus stock location

Two meanings of location remain separate:

- **Vehicle/catalogue location** — where the part belongs on the vehicle.
- **Stock/storage location** — where Jagports physically stores the stock.

The first belongs to catalogue/occurrence/location modelling; the second belongs to operational stock. Do not infer one from the other.

## Provenance and evidence

Source facts, normalized values, derived interpretations and verification state must remain distinguishable where the distinction matters. Imported or migrated data must remain traceable to its source without depending on an obsolete spreadsheet formula or hidden agent knowledge.

Detailed field mappings and operational provenance rules are owned by #353/#354 and the relevant importer/research records. This file records the principle, not a duplicate field-by-field specification.

## UI and repository assets

The VIEPS UI concept package and WDS/UFM silhouette assets are repository-resident design/source material, not by themselves authoritative domain semantics. PR #366 established the asset/design baseline; #360 remains the authoritative UI requirements record.

UI implementation must consume the domain model rather than redefine it. Missing source data must remain explicitly unknown/empty rather than being invented to make the screen appear complete.

The detailed three-pane layout, parts-tree behaviour, fitment presentation, supersession indicators, hotspot mapping, silhouette behaviour and UI-to-data table belong to #360. Hotspot conversion remains governed by #352.

## Supersession boundary

Supersession is a catalogue relationship and must not overwrite the identity of an existing stocked part. The reusable supersession research is owned by #364; the persistent relationship is implemented under #354.

This file records only the architectural boundary so the same rule is not re-specified in multiple places.

## JEPC importer boundary

The JEPC importer populates the catalogue/reference layer from the defined JEPC source dataset. It is not an inventory importer and must not filter catalogue data by current Jagports stock state.

Source structure, mapping, validation, repeatability/idempotency and importer failure behaviour belong to #355. The importer must consume the approved #354 model rather than redefine it.

## MVP boundary

The VIEPS MVP should build on the smallest coherent reference/parts/occurrence/fitment/stock foundation needed by the approved MVP work. Specialized extensions must not silently become prerequisites.

In particular, unresolved hotspot conversion, complete whole-car zone taxonomy/geometry, complete third-party modelling, complete VIN decoding and external catalogue synchronization must not be introduced as hidden prerequisites for the basic Stock MVP unless separately approved.

Detailed MVP schema and acceptance criteria belong to #354; importer acceptance criteria belong to #355; UI acceptance criteria belong to #360.

## Decision discipline

When a consequential domain decision remains unresolved, keep it explicitly unresolved and follow the project's decision workflow. Do not silently convert an Excel convention, JEPC field, UI mock-up or derived research interpretation into an authoritative database rule.

Durable knowledge should capture the decision and its source-of-truth owner once. It should not duplicate detailed implementation specifications already maintained in the owning Issue, PR or authoritative repository document.

## Traceability

- **#353** — operational stock research and reconciliation.
- **#354** — canonical Parts Data Model and database implementation.
- **#355** — JEPC Data Importer.
- **#360** — VIEPS UI MVP requirements.
- **#364** — reusable JEPC supersession knowledge.
- **#366** — UI concept and WDS/UFM asset/design baseline.
- **#352 / #361 / #362** — specialized hotspot, zone/taxonomy and third-party research.

This file is intentionally the durable cross-cutting knowledge layer between those work records; it is not a replacement for them.