# PART Model — MVP Step

## Purpose

This document defines the first concrete implementation step of Issue #354: the canonical catalogue `PART` identity.

## Scope

This step implements the catalogue part identity. A PART may be created before a catalogue part number is known, allowing unidentified physical/reference parts to be recorded and subsequently identified. Vehicle applicability, EPC occurrence/context, fitment, diagrams, hotspots, supersession, and stock relationships remain separate model steps.

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

## Images and identification evidence

Part images should be attached to the PART through a separate `PART_IMAGE` relationship/table rather than stored as image data inside the PART row.

This allows multiple images to document one PART and keeps the stable PART identity independent of the eventual image-storage technology. Image metadata can later include an external/storage reference, source, description, verification status, and provenance.

The current migration establishes the PART identity only; `PART_IMAGE` is a subsequent model step. The schema is intentionally structured so that image evidence can be added without changing the PART identity.

## Architectural boundary

`PART` contains catalogue/reference identity only. It has no direct vehicle applicability field and no mutable stock state.

Applicability belongs to occurrence/fitment/context relationships. Operational inventory belongs to separate stock records.

## Migration

Migration `0002_part_model.sql` evolves the existing MVP `part_reference` table into `part`, preserving existing part numbers as `part_number_raw` and deriving `part_number_normalized`.

The resulting model permits new PART records without a part number. A partial unique index enforces uniqueness only for known normalized part numbers. Invalid existing blank part-number data fails the migration rather than being silently converted into a usable identity.

## Testing

Automated tests verify:

- deterministic normalization;
- preservation of raw representation as a separate model concern;
- rejection of non-string normalization input;
- empty normalized identities;
- nullable PART number fields;
- uniqueness only for non-null normalized part numbers;
- absence of description uniqueness;
- absence of vehicle applicability in this PART migration.

## MVP boundary

This step establishes the canonical PART identity required by later occurrence, fitment, EPC, supersession, stock, and image-evidence relationships. `PART_IMAGE` and other relationships remain separate model steps.
