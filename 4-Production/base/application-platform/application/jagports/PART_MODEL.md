# PART Model — MVP Step

## Purpose

This document defines the first concrete implementation step of Issue #354: the canonical catalogue `PART` identity.

## Scope

This step implements only the catalogue part identity. Vehicle applicability, EPC occurrence/context, fitment, diagrams, hotspots, supersession, and stock relationships remain separate model steps.

## PART fields

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable internal catalogue-part identifier. |
| `part_number_raw` | required | Original part-number representation supplied by the source. |
| `part_number_normalized` | required, unique | Stable lookup identity derived from the raw part number. |
| `description` | optional | Part description/name; may be empty or NULL. |
| `source` | optional | Source system/document identifier. |
| `source_ref` | optional | Source reference or URL where available. |
| `verification_status` | required | Provenance/verification state; defaults to `unverified`. |

## Part-number normalization

The MVP normalization is deliberately deterministic and conservative:

1. Require a string value.
2. Trim surrounding whitespace.
3. Convert to uppercase.
4. Remove whitespace and hyphen separators.
5. Preserve the original representation in `part_number_raw`.

Examples:

- `MNA 7691-AA` → `MNA7691AA`
- `mna-7691-aa` → `MNA7691AA`
- `XR847031` → `XR847031`

An empty normalized value is not a valid catalogue identity. Two raw values producing the same normalized value represent the same lookup identity for this MVP and therefore conflict with the unique constraint unless they are intentionally reconciled later.

## Architectural boundary

`PART` contains catalogue/reference identity only. It has no direct vehicle applicability field and no mutable stock state.

Applicability belongs to occurrence/fitment/context relationships. Operational inventory belongs to separate stock records.

## Migration

Migration `0002_part_model.sql` evolves the existing MVP `part_reference` table into `part`, preserving existing part numbers as `part_number_raw` and deriving `part_number_normalized`.

A normalization collision intentionally fails the migration rather than silently merging records.

## Testing

Automated tests verify:

- deterministic normalization;
- preservation of raw representation as a separate model concern;
- rejection of non-string normalization input;
- empty normalized identities;
- presence of the required PART migration fields and uniqueness/index constraints;
- absence of vehicle applicability in this PART-only migration.

## MVP boundary

This step does not implement the complete Parts Data Model from Issue #354. It establishes the canonical identity required by later occurrence, fitment, EPC, supersession, and stock relationships.
