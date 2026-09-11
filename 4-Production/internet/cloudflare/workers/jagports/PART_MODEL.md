# PART Model — MVP Steps

## Purpose

This document records the concrete MVP steps of Issue #354 for canonical catalogue `PART` identity and its relationships to reference evidence and operational stock.

## Canonical PART identity

The first implementation step establishes a stable internal PART identity. A PART may be created before a catalogue part number is known, allowing unidentified physical/reference parts to be recorded and subsequently identified. Vehicle applicability, EPC occurrence/context, fitment, diagrams, hotspots, supersession, and stock relationships remain separate model steps.

## PART fields

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable internal catalogue-part identifier. |
| `part_number_raw` | optional | Original part-number representation supplied by the source, when known. |
| `part_number_normalized` | optional, unique when present | Stable lookup identity derived from the raw part number. Multiple NULL values are allowed. |
| `description` | optional, non-unique | Part description/name; may be empty or NULL. Descriptions are not identity because different parts can share the same description. |
| `source` | optional | Source system/document identifier. |
| `source_ref` | optional | Source reference or URL where available. |
| `verification_status` | required | Provenance/verification state; defaults to `unverified`. |

The internal `id` is the stable PART identity. A part number can be attached later without changing that identity.

## Unidentified parts

A PART can initially have no part number, a useful description such as `Fir tree clip`, and source/provenance information when available. It can later be identified through a verified catalogue part number. Descriptions are not unique identifiers.

## Part-number normalization

The MVP normalization is deterministic and conservative: require a string when supplied, trim surrounding whitespace, convert to uppercase, remove whitespace and hyphen separators, and preserve the original representation in `part_number_raw`.

Examples: `MNA 7691-AA` → `MNA7691AA`; `mna-7691-aa` → `MNA7691AA`; `XR847031` → `XR847031`.

## PART image and identification evidence

`part_image` is a separate child entity of canonical `part`. It stores a stable image record ID, `part_id`, required opaque `image_ref`, source/provenance, optional description, and verification status. One PART may have multiple images, including before its catalogue part number is known. Image descriptions are not identity fields and image identity is constrained per PART by `(part_id, image_ref)`.

## PART vehicle and VIN applicability

Vehicle applicability is represented outside the canonical `part` row. Model-range and VIN-range applicability are distinct relationships and are not collapsed into one entity. `model_range` represents named vehicle/model-range classifications; `vin_range` represents explicit VIN serial applicability ranges with source/derived discriminators. A PART can link to multiple ranges through `part_model_range` and `part_vin_range`.

VIN-derived interpretation must remain distinguishable from source facts. This model does not use KOVuosi as a source for VIN decoding, VIN-range selection or model-year inference and does not implement a complete VIN decoder.

## PART supersession

`part_supersession` is a separate directed relationship between canonical `part` identities. `superseded_part_id → superseding_part_id` preserves both historical and replacement identities. One replacement may supersede multiple historical parts and chains such as `A → B → C` are representable. Source, source reference, verification, confidence and effective boundaries are retained where established. Supersession is not generic interchangeability and is not inferred solely from similar numbers, descriptions, fitment or historical `isSuperSeded` state. Stock identity remains separate.

Representative evidence fixture: `MNA7691AA → XR847031`.

## PART fitment and attribute applicability

`part_fitment` is an occurrence-level relationship used to preserve applicability constraints without duplicating canonical PART identity.

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable fitment-record identifier. |
| `part_occurrence_id` | required | FK to the EPC/application occurrence whose applicability is being described. |
| `applicability_state` | required | `applicable`, `excluded`, or `unavailable`. |
| `attribute_group` | optional | Original/source attribute group identifier. |
| `attribute_key` | optional | Original/source attribute key. |
| `source_value` | optional | Original/source attribute value; not interpreted unless established. |
| `except_flag` | optional | Original source exclusion indicator. |
| `source` / `source_ref` | optional | Provenance/evidence. |
| `verification_status` | required | Verification state. |
| `confidence` | optional | Confidence where appropriate. |

A PART occurrence may have multiple fitment constraints. Opaque JEPC attribute groups remain source data until semantic interpretation is verified. The MVP does not infer applicability from model naming, generic model year or KOVuosi.

## PART diagram, hotspot and vehicle location

The diagram/location step keeps EPC illustration identity, hotspot evidence, and catalogue vehicle-location mapping separate from both canonical PART identity and physical stock storage.

### Diagram

`diagram` represents an EPC/exploded illustration reference. It may carry a source/source reference, diagram reference, title, image reference, verification state and confidence. A diagram is linked to one or more `part_occurrence` records through `part_occurrence_diagram` so the same canonical PART can remain represented in multiple EPC contexts without duplication.

### Hotspot

`diagram_hotspot` represents an item/hotspot on a diagram and may link to the corresponding `part_occurrence`. The MVP preserves `item_number`, source X/Y or source geometry, and `coordinate_system`/source reference. Source coordinates are retained as source evidence; no normalized VIEPS geometry is implied until the approved #352 coordinate-conversion semantics exist. A hotspot without a verified occurrence mapping remains representable.

### Catalogue vehicle location

`part_vehicle_location` represents a catalogue-side vehicle-location mapping scoped to a PART occurrence and, where applicable, a `model_range`. `mapping_state` is explicitly `verified` or `unavailable`. A verified mapping requires a location reference. An unavailable mapping records that no verified mapping is available and must not fabricate a zone or coordinate. System/category references remain separate fields where supported by evidence.

Physical stock/storage location is not stored in this entity; it remains part of the operational stock model.

## PART to operational stock

`stock_item` is an operational record and is not a catalogue PART identity. Migration `0010_part_stock_relationship.sql` adds a nullable `stock_item.part_id` foreign key to canonical `part(id)`, allowing a resolved stock record to point to the catalogue identity while leaving unresolved/non-catalogue stock with `part_id = NULL`.

The existing `stock_item.part_number` field is retained as the stocked/historical part-number reference. It is not the relational identity and does not require a matching canonical PART. This preserves old stocked numbers even when a catalogue PART is superseded or when the stock item cannot yet be identified.

One canonical PART may have multiple independent stock records. Each stock record may carry quantity, condition, status, physical `location`, historical/stocked part number, source/donor reference, notes, explicit `available` state, provenance, verification status and confidence.

Donor vehicle identity is represented separately by nullable `stock_item.donor_vehicle_id → vehicle(id)`. This is distinct from catalogue vehicle/model/VIN applicability and from physical stock/storage location. The legacy `donor_vehicle` text field is retained as a source/reference value.

Unresolved/non-catalogue operational stock is therefore representable without fabricating a canonical PART. The MVP does not require an unresolved item to be inserted into `part` merely to make it stockable.

The stock relationship does not implement warehouse transaction history, reservations, sales workflow, external catalogue synchronization, or automatic stock mutation from catalogue supersession.

## Architectural boundary

`PART` contains catalogue/reference identity only. It has no direct vehicle applicability field and no mutable stock state. `PART_IMAGE` is evidence associated with that stable identity. Applicability belongs to occurrence/fitment/context relationships. Diagram/hotspot/location evidence belongs to their explicit relationships. Operational inventory belongs to separate stock records. Catalogue vehicle location and physical stock/storage location are distinct concepts.

## Migrations

Migration `0002_part_model.sql` establishes canonical PART identity. Migration `0004_part_occurrence_context.sql` establishes EPC/application context. Migration `0005_part_image.sql` establishes `part_image`. Migration `0006_part_vehicle_vin_applicability.sql` establishes distinct model/VIN ranges and relationships. Migration `0007_part_supersession.sql` establishes directed supersession. Migration `0008_part_fitment.sql` establishes occurrence-level applicability constraints. Migration `0009_part_diagram_location.sql` establishes diagrams, occurrence-to-diagram links, source-preserving hotspots, and model-scoped catalogue vehicle-location mappings. Migration `0010_part_stock_relationship.sql` adds the canonical PART and donor-vehicle relationships to operational stock while preserving nullable resolution.

## Testing and fixtures

Tests and fixtures cover canonical PART identity, occurrences, images, model/VIN applicability, supersession, fitment/exclusion, diagram/hotspot/location relationships, and the PART-to-stock relationship. The stock fixtures include two independent stock records for one canonical PART, a donor vehicle relationship, and an unresolved/non-catalogue stock record with no fabricated PART identity. Integrity tests cover foreign keys, relationship uniqueness and key boundary constraints.

## MVP boundary

The implemented model steps provide the persistent spine required for part-number search, part detail, EPC context, explicit vehicle/model/VIN applicability, fitment constraints, diagram/hotspot references, verified catalogue vehicle-location mappings, supersession and catalogue-to-stock linkage. They do not implement complete VIN decoding, automatic VIN-range inference, complete JEPC semantic interpretation, hotspot coordinate conversion, final whole-car zone taxonomy, warehouse transaction history, sales/reservation workflows, or JEPC import.

#352 remains the authority for JEPC Flash hotspot coordinate conversion. #361/#362 remain the authority for final Range/whole-car zone taxonomy. Unresolved geometry or taxonomy decisions must not be encoded as authoritative schema semantics.
