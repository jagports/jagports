# VIEPS D1 Topology Model

## Purpose and authority

This document defines the physical/logical D1 database topology used by VIEPS.

It owns only:

- which VIEPS data domains live in the `jagports` D1 database;
- which data domains live in Range-routed `parts-<range_slug>` D1 databases;
- the Search Index placement and authority boundary;
- the cross-database routing boundary.

It does **not** duplicate detailed PART, STOCK, Search, FIT, Range-administration, JEPC-import, schema-field, index-field or interaction semantics.

Those remain authoritative in their domain specifications:

- [`MODEL_D1_DataImporter-JEPC.md`](MODEL_D1_DataImporter-JEPC.md) — JEPC source-to-D1 completeness, Range routing and accepted catalogue publication;
- [`MODEL_PARTS.md`](MODEL_PARTS.md) — canonical PART identity, catalogue-side PART relationships and non-dynamic catalogue applicability evidence;
- [`MODEL_STOCK.md`](MODEL_STOCK.md) — operational STOCK persistence and stock-to-PART reference semantics;
- [`SPEC_FIND.md`](SPEC_FIND.md) — Search Index contents, global search behavior and catalogue hydration;
- [`SPEC_SEARCH_RANGES.md`](SPEC_SEARCH_RANGES.md) — normalized Range assignment and `catalogue_range` publication source;
- [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md) — dynamic JEPC-description mapping and FIT filter semantics.

## D1 topology

```text
VIEPS
  |
  +--> jagports D1
  |      |
  |      +--> operational STOCK
  |      |
  |      +--> supporting operational tables
  |      |
  |      +--> deterministic TEST/fixture catalogue rows
  |      |
  |      `--> Search Index
  |             |
  |             +--> derived catalogue lookup/routing data
  |             |
  |             `--> (catalogue_range, part_id)
  |                          |
  |                          v
  |                 configured Range binding
  |                          |
  |                          v
  +------------------> parts-<range_slug> D1
                         |
                         +--> authoritative PART identity
                         +--> occurrences / tree
                         +--> FIT evidence
                         +--> diagrams / media references
                         `--> catalogue provenance
```

## Database responsibilities

### `jagports` D1

The `jagports` D1 database contains:

- operational STOCK and its supporting operational tables;
- deterministic TEST/fixture catalogue rows required by the TEST/fixture contract;
- the global Search Index.

The Search Index is derived lookup/routing data. It is not canonical PART storage and it is not authoritative catalogue evidence.

Operational STOCK fields are not Search Index fields.

### `parts-<range_slug>` D1

Each configured Range routes to one authoritative `parts-<range_slug>` catalogue database.

That database owns the imported catalogue data for its Range. The exact catalogue entities, evidence and completeness requirements are defined by the referenced PART, FIT and JEPC-to-D1 specifications rather than repeated here.

## Search Index boundary

The Search Index is stored in `jagports` D1.

Its database-level role is only to locate authoritative catalogue references across configured Range databases.

A Search Index result resolves to:

```text
(catalogue_range, part_id)
        |
        v
parts-<range_slug>
        |
        v
authoritative catalogue hydration
```

Accepted catalogue publication supplies the authoritative data from which Search Index entries are published or rebuilt.

Range assignment supplies the `catalogue_range` routing identity.

Detailed Search Index fields, completeness/staleness behavior, rebuilding rules, global deterministic/free-text search, supersession lookup and result semantics belong to [`SPEC_FIND.md`](SPEC_FIND.md).

## Cross-D1 relationship boundary

SQLite/D1 foreign keys do not cross database boundaries.

Therefore a reference from `jagports` D1 to an imported catalogue PART in `parts-<range_slug>` is a logical application-resolved reference, not a cross-D1 SQL foreign key.

The canonical logical address is:

```text
(catalogue_range, part_id)
```

The exact STOCK-side NULL rules, same-database fixture behavior, reconciliation semantics and indexing requirements are defined in [`MODEL_STOCK.md`](MODEL_STOCK.md) and [`MODEL_PARTS.md`](MODEL_PARTS.md).

## Authority rule

Database placement does not change domain authority:

```text
jagports D1
  Search Index  = derived lookup/routing authority only
  STOCK         = operational stock authority

parts-<range_slug> D1
  catalogue     = authoritative imported catalogue data
```

No complete imported catalogue is copied into `jagports` merely to simplify foreign keys or global lookup.

No Search Index row may be treated as sufficient evidence for current PART, occurrence, FIT, tree, diagram or provenance facts without hydration from the authoritative Range catalogue.
