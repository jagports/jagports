# PART Model — MVP Steps

## Purpose

This document records the concrete MVP steps of Issue #354 for canonical catalogue `PART` identity and its image/identification evidence relationship.

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

A PART can initially have:

- no part number;
- a useful description, such as `Fir tree clip`;
- source/provenance information when available;
- later identification through a verified catalogue part number.

Descriptions must not be made unique. If human-readable unique labels are required for a workflow, that is a separate identification concern and should not be confused with catalogue description.

## Part-number normalization

The MVP normalization is deliberately deterministic and conservative:

1. Require a string value when a part number is supplied.
2. Trim surrounding whitespace.
3. Convert to uppercase.
4. Remove whitespace and hyphen separators.
5. Preserve the original representation in `part_number_raw`.

Examples:

- `MNA 7691-AA` → `MNA7691AA`
- `mna-7691-aa` → `MNA7691AA`
- `XR847031` → `XR847031`

When no part number is known, both part-number fields are NULL. When a part number is known, its normalized value must be unique. Two non-null raw values producing the same normalized value therefore conflict with the unique index unless they are intentionally reconciled later.

## PART image and identification evidence

`part_image` is a separate child entity of canonical `part`.

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable image-record identifier. |
| `part_id` | required | FK to the canonical `part(id)`. |
| `image_ref` | required, unique per PART | Opaque reference to an externally stored or otherwise addressable image. The storage technology is outside this model step. |
| `source` | optional | Source system/document identifier for the image. |
| `source_ref` | optional | Source reference where available. |
| `description` | optional, non-unique | Human-readable description of the image/evidence. |
| `verification_status` | required | Verification state; defaults to `unverified`. |

One PART may have multiple `part_image` records. The relationship uses the stable PART `id`, so an unidentified PART can have image evidence before a catalogue part number is known.

`image_ref` identifies the image resource for this relationship. The MVP does not prescribe a URL scheme, object-storage provider, binary column, upload service, OCR process, or image-recognition system.

Image descriptions are not identity fields. Duplicate image identity is constrained by `(part_id, image_ref)` so the same image reference is not attached repeatedly to the same PART while different descriptions remain possible.

## PART vehicle and VIN applicability

Vehicle applicability is represented outside the canonical `part` row. Model-range and VIN-range applicability are distinct relationships and are not collapsed into one entity.

### Model range

`model_range` represents a named vehicle/model-range classification. A PART may be linked to multiple model ranges through `part_model_range`.

### VIN range

`vin_range` represents an explicit VIN serial applicability range and retains source/derived discriminators without claiming complete VIN decoding. The MVP fields include VIN prefix, serial start/end, model year when established, production/use-introduction boundary when established, market, body, engine variant, emissions, transmission/steering discriminator, source, source reference and verification status.

A PART may be linked to multiple VIN ranges through `part_vin_range`.

VIN-derived interpretation must remain distinguishable from source facts. This model step does not use KOVuosi as a source for VIN decoding, VIN-range selection or model-year inference, and does not implement a complete VIN decoder.

## Architectural boundary

`PART` contains catalogue/reference identity only. It has no direct vehicle applicability field and no mutable stock state.

`PART_IMAGE` is evidence associated with that stable identity; it does not become part of the catalogue identity itself.

Applicability belongs to occurrence/fitment/context relationships. Operational inventory belongs to separate stock records.

`model_range` and `vin_range` are distinct concepts even where a VIN range happens to correspond to a particular model range.

## Migrations

Migration `0002_part_model.sql` establishes the canonical `part` identity and its nullable/unique part-number model.

Migration `0004_part_occurrence_context.sql` establishes the separate `part_occurrence` relationship for EPC/application/context data.

Migration `0005_part_image.sql` establishes `part_image` as a separate child entity of `part`, with a foreign key, required non-blank image reference, per-PART image-reference uniqueness, and lookup indexes.

Migration `0006_part_vehicle_vin_applicability.sql` establishes distinct `model_range` and `vin_range` entities and the `part_model_range` and `part_vin_range` relationships.

## Testing and fixtures

The PART model tests cover deterministic part-number normalization, nullable/unique part-number identity, non-unique descriptions, and separation from vehicle applicability.

The PART occurrence tests cover the separate EPC/application/context relationship.

The PART image tests cover separate `part_image` persistence, FK linkage, multiple image references, non-unique image descriptions, source/provenance and verification metadata, blank-reference rejection, and image evidence attached to an unidentified PART.

The vehicle/VIN applicability tests cover separate model-range and VIN-range entities, PART relationships, representative fixture links, foreign-key structure and relationship uniqueness.

## MVP boundary

The implemented vehicle/VIN applicability step is limited to explicit persistent relationships and structured VIN-range records needed by the MVP. It does not implement complete VIN decoding, automatic VIN-range inference, complete fitment semantics, vehicle-location/hotspot conversion, supersession, stock, or JEPC import.

Later model steps remain responsible for full fitment/attribute semantics, diagram/hotspot relationships, supersession, stock, and other Parts Data Model relationships.
