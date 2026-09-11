# MVP Operational Stock Model

## Purpose

This document supplements `PART_MODEL.md` with the accepted operational-stock semantics required to complete Issue #570 and the final remaining stock criterion in Issue #354.

The source decisions are the accepted stock-model findings from #353 and the MVP scope from #280. The catalogue/reference boundary remains unchanged: mutable Jagports inventory belongs in operational stock records, not canonical PART or JEPC reference entities.

## Operational stock identity

`stock_item` remains the operational stock record. It may reference canonical `part(id)` when a catalogue match is established, but `part_id` remains nullable for unresolved/non-catalogue stock. One PART may have multiple independent stock records.

MVP stock does not assign a distinct persistent identity to every physical unit. `quantity` is the integer count of physical items represented by the stock record.

## Accepted condition values

`stock_item.condition_code` is the controlled MVP condition code:

| Code | Meaning |
|---|---|
| `A` | New |
| `B` | Good-Working |
| `C` | Fair-Working |
| `D` | Damaged-WorkingWithFixes |
| `E` | Damaged-NeedsRepair |

The legacy free-text `condition` column is retained as historical/source data. New operational logic must use the controlled `condition_code` where the accepted condition is known.

## Storage model

Named physical sites are represented by `stock_site`.

Physical storage locations are represented by `stock_location`:

- each location belongs to one named site;
- a root location may be a shelf;
- boxes may be children of a shelf or another box;
- recursive box nesting supports structures such as `Shelf → Box → BoxSub1 → BoxSub2` without a fixed maximum depth;
- location identity is constrained within its parent/site context.

`stock_item.storage_location_id` references the normalized physical location. The legacy free-text `location` field remains source/historical text and is not the normalized relationship.

## Donor vehicle and acquisition/source party

Donor vehicle and acquisition/source party are distinct concepts.

- `stock_item.donor_vehicle_id` references a donor `vehicle` when known.
- `stock_source_party` represents a vendor, person, organization, or other acquisition/source party.
- `stock_item.source_party_id` references that party when known.
- legacy `stock_item.source` remains usable evidence for unresolved stock where normalized party identity is not yet available.

An unresolved/non-catalogue stock record (`part_id IS NULL`) must retain source evidence through either `source_party_id` or a nonblank legacy `source` value. A canonical PART must not be fabricated merely to satisfy a relationship.

Detailed provenance remains outside this MVP step and is owned separately by #369.

## Quantity

`quantity` is an integer number of physical items and must be non-negative. Migration 0011 adds triggers that reject fractional values on insert or quantity update because SQLite INTEGER affinity alone does not guarantee integral storage for every numeric input.

## Price and currency

`stock_item.price` is the optional numeric sale value and must be non-negative when present.

`stock_item.currency` is a three-character uppercase currency code with MVP/default value `EUR`.

This step does not implement sales, reservations, payment, or price-history workflows.

## Availability

The accepted MVP meaning of availability is operational readiness of an inventoried stock record: its accepted condition and physical storage location are known.

For new or changed records, `available = 1` therefore requires both:

- non-NULL `condition_code`;
- non-NULL `storage_location_id`.

Existing pre-0011 rows are not silently reclassified or backfilled. Their state must be reconciled from evidence before availability is changed under the new rule.

Availability does not imply a sale transaction, reservation state, or positive quantity beyond the accepted #353 definition.

## Search/filter indexes

Migration 0011 adds indexes for the accepted MVP stock filters:

- condition code;
- normalized storage location;
- source party;
- currency and price.

Existing stock indexes continue to cover canonical PART, stocked part number, status, availability, donor vehicle, source, and legacy location.

## Integrity and fixtures

`tests/stock-model-mvp.mjs` executes the complete ordered migration chain and verifies:

- named multi-site storage;
- recursive shelf/box nesting;
- controlled condition values;
- integer quantity enforcement;
- donor vehicle and source party as separate relationships;
- EUR/default currency and non-negative price;
- availability integrity;
- unresolved stock source requirement;
- multiple stock records for one canonical PART;
- relevant stock indexes and invalid cases.

## MVP / later boundary

Implemented in this step:

- persistent operational stock quantity;
- controlled A–E condition;
- named multi-site recursive storage;
- separate donor and source-party relationships;
- optional sale price with EUR default currency;
- accepted availability integrity;
- unresolved stock source requirement;
- basic stock search/filter indexes and integrity tests.

Still outside this step:

- individual physical-unit identity;
- inventory transaction/history ledger;
- reservations and sales workflow;
- automated acquisition history;
- detailed provenance redesign (#369);
- PART_IMAGE implementation/deployment work (#566);
- production deployment or remote D1 migration execution.
