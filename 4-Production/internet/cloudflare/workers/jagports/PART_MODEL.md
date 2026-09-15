# PART Model — MVP Steps

## Purpose

This document records the concrete MVP steps of Issue #354 for canonical catalogue `PART` identity and its relationships to reference evidence and operational stock.

## Canonical PART identity

The migrations through 0010 establish stable internal PART identity and separate relationships for vehicle applicability, EPC occurrence/context, fitment, diagrams, hotspots, supersession and stock. A PART may be created before a catalogue part number is known, allowing unidentified reference parts to be recorded and subsequently identified. Unresolved physical stock does not require a PART row.

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

`part_image` is a separate child entity of canonical `part`. It stores a stable image record ID, `part_id`, opaque `image_ref` (required for available evidence), source/provenance, optional description, and verification status. One PART may have multiple images, including before its catalogue part number is known. Image descriptions are not identity fields and non-NULL image identity is constrained per PART by `(part_id, image_ref)`. An unavailable image placeholder has `image_ref = NULL` and `availability_status = unavailable`; no invented reference is needed.

## PART vehicle and VIN applicability

Migration `0014_occurrence_applicability.sql` adds occurrence-bound model context, alternative condition sets and versioned evidence. The existing PART-level links below remain intact. The [applicability persistence contract](../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART_APPLICABILITY.md#implemented-persistence-contract) defines the new relations and their verification limits; no legacy fitment row is automatically promoted into them.

Vehicle applicability is represented outside the canonical `part` row. Model-range and VIN-range applicability are distinct relationships and are not collapsed into one entity. `model_range` represents named vehicle/model-range classifications; `vin_range` represents explicit VIN serial applicability ranges with source/derived discriminators. A PART can link to multiple ranges through `part_model_range` and `part_vin_range`.

`model_range` and `vin_range` are distinct concepts. These legacy links apply at PART level. The 0014 extension binds an occurrence to a versioned source model context and its canonical model range; it does not introduce a complete global model/variant ontology. Legacy VIN discriminator columns retain source text, not decoder output with independently tracked derivation.

VIN-derived interpretation must remain distinguishable from source facts. This model does not use KOVuosi as a source for VIN decoding, VIN-range selection or model-year inference and does not implement a complete VIN decoder.

## PART supersession

`part_supersession` is a separate directed relationship between canonical `part` identities. `superseded_part_id → superseding_part_id` preserves both historical and replacement identities. One replacement may supersede multiple historical parts and chains such as `A → B → C` are representable. Source, source reference, verification, confidence and effective boundaries are retained where established. Supersession is not generic interchangeability and is not inferred solely from similar numbers, descriptions, fitment or historical `isSuperSeded` state. Stock identity remains separate.

Representative evidence fixture: `MNA7691AA → XR847031`.

This is an explicit directed relationship between catalogue parts, not a generic interchangeability assertion. Historical and current part identities remain separately addressable. Only direct self-links are prohibited; multi-hop cycles and effective-date ordering are not constrained.

## PART fitment and attribute applicability

`part_fitment` stores source occurrence constraints and retained PART/range qualifiers in one domain table. Every row has exactly one scope: an occurrence, or a PART plus `vehicle_range` pair. It cannot name both scopes. Retained range qualifiers remain source text; migration sets their canonical applicability state to `unavailable` rather than inventing verified attribute semantics.

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable fitment-record identifier. |
| `part_occurrence_id` | required for occurrence scope | FK to the EPC/application occurrence; NULL only for a PART/range row. |
| `applicability_state` | required | `applicable`, `excluded`, or `unavailable`. |
| `attribute_group` | optional | Original/source attribute group identifier. |
| `attribute_key` | optional | Original/source attribute key. |
| `source_value` | optional | Original/source attribute value; not interpreted unless established. |
| `except_flag` | optional | Original source exclusion indicator. |
| `source` / `source_ref` | optional | Provenance/evidence. |
| `verification_status` | required | Verification state. |
| `confidence` | optional | Confidence where appropriate. |

A PART occurrence may have multiple fitment constraints. Opaque JEPC attribute groups remain source data until semantic interpretation is verified. The MVP does not infer applicability from model naming, generic model year or KOVuosi.

The original source representation of `exceptFlag` is retained in `except_flag`. The database does not translate that value or check consistency with `applicability_state`; a verified importer must supply the state.

## PART diagram, hotspot and vehicle location

PART diagram and hotspot records preserve source evidence; they do not define normalized geometry.

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

## Migration reconciliation and upgrade contract

Apply `migrations/*.sql` once in filename order, with foreign keys enabled, using the D1 migration ledger. `schema.sql` is only the historical 0001 bootstrap, not a current schema snapshot. Never apply both it and the complete migration chain as independent schema definitions.

| Migration | Result / transition |
|---|---|
| 0001 | Operational `stock_item`, `vehicle`, `vehicle_identifier`; historical `part_reference`. |
| 0002 | Replaces `part_reference` with `part`, retaining IDs/provenance; normalizes known numbers and rejects collisions rather than merging records. |
| 0003 | VIEPS `vehicle_range`, tree, image, diagram and range/variation fitment presentation tables. |
| 0004 | Canonical PART occurrences with source identity. |
| 0005 | Rebuilds `part_image` using migration-only `temp_part_image_migration`; copies IDs, image URLs into `image_ref`, kind, caption and verification, marks NULL URLs unavailable, then drops staging. |
| 0006 | Canonical model/VIN ranges and PART links. |
| 0007 | Directed supersession. |
| 0008 | Rebuilds `part_fitment` using migration-only `temp_part_fitment_migration`; preserves PART/range qualifiers and IDs, adds occurrence scope, then drops staging. |
| 0009 | Canonical diagram, occurrence link, hotspot and vehicle-location evidence. |
| 0010 | Nullable PART/donor FKs plus provenance and availability on stock; existing stock remains unresolved, without an inferred backfill. |

The uncorrected 0005/0008 scripts collided with the tables already created by 0003. This consolidation repairs those transitions rather than adding a late migration that could never be reached. Supported paths are a fresh database and a database with the original ordered migrations applied through 0003/0004 (or later successfully completed prefixes). The upgrade tests load populated 0003 data and verify preservation, including multiple NULL image placeholders and duplicate NULL-bearing range qualifiers. Existing image placeholders are not converted to invented `image_ref` values, and range/variation rows are not interpreted as source fitment attributes. Persistent names describe the domain; migration-only staging uses `temp_*` and is dropped before completion.

Before upgrading an existing D1 database, inspect its migration ledger and table shapes. A database that skipped 0003, manually applied 0005/0008, or marked failed migrations as applied has a divergent history and needs an explicit reconciliation plan; do not replay scripts or rename tables blindly. No remote D1 migration or deployment is performed by this consolidation. Back up the database and deploy the updated Worker together with the migration upgrade. The updated Worker expects the evolved `part_image` and `part_fitment` shapes after 0008. A repeated non-NULL image reference for the same PART, or a blank legacy URL, needs explicit source reconciliation: 0005 rejects it transactionally and retains the original table/rows rather than silently discarding evidence. D1 migration application must retain its transaction boundary.

`src/vieps.js` reads images from `part_image`, projecting `image_ref AS image_url` and adding `availability_status`. It reads range qualifiers from PART-scoped `part_fitment` rows; occurrence constraints are not yet exposed by this endpoint. It also consumes `part_diagram`, `vehicle_range`, and tree tables. Existing response fields remain; image availability is now explicit. No UI behavior is added. A reference remains opaque evidence; the API alias alone does not guarantee a browser-renderable URL.

## Complete field dictionary

The dictionary describes the resulting schema through 0010, including retained range/tree/presentation entities. `?` means SQL NULL is allowed: absent/unknown/not supplied, never an inferred positive or negative claim. Unless a special meaning is stated below, optional text is source evidence with no assumed taxonomy. Required text may still be blank unless a CHECK is explicitly documented. SQLite affinities are not strict types; application/import validation is still necessary.

Every standalone `id` below is `INTEGER PRIMARY KEY AUTOINCREMENT`: a stable row identity, automatically assigned when omitted. Link tables use the listed composite primary key instead. All FKs reference integer IDs, never descriptions or part-number text. IDs must be preserved across imports/updates; AUTOINCREMENT does not make catalogue data immutable.

### Shared evidence fields

Where listed, these definitions apply individually to each field, not to entities that lack the field:

| Field | SQL type / null / default | Purpose |
|---|---|---|
| `source` | TEXT ? | Source system/document identifier; required and nonblank on `part_occurrence`. |
| `source_ref` | TEXT ? | Evidence URL/reference; required and nonblank on `part_occurrence`. A reference is not necessarily a URL. |
| `verification_status` | TEXT required, default `unverified` | Source/manual verification claim, not a controlled enum. Retained `vehicle_range` and `part_diagram` default to `fixture`; rebuilt image/fitment tables default to `unverified` and retain each migrated row's original status. No claim is independently verified merely by setting this field. |
| `confidence` | TEXT ? on supersession/fitment/diagram/location; REAL ? on stock | Source confidence value. There is no shared vocabulary, numeric interval or conversion policy. |
| `created_at`, `updated_at` | TEXT required, default CURRENT_TIMESTAMP | On vehicle and stock only. Creation/insertion defaults; `updated_at` has no automatic update trigger. Writers must maintain it. |

### Canonical identity and context

| Entity | Fields and purposes |
|---|---|
| `part` | `id`; `part_number_raw` TEXT ? original number; `part_number_normalized` TEXT ? lookup key; `description` TEXT ? non-unique description; `source`, `source_ref`, `verification_status`. Raw and normalized values are independently nullable; SQL does not derive or check agreement between them. |
| `part_occurrence` | `id`; `part_id` INTEGER required FK; `source`, `source_ref`; `context_type` TEXT required default `epc`, nonblank source context kind; `context_ref` TEXT ? source application reference; `category_ref` TEXT ? source category; `item_number` TEXT ? source item identifier; `diagram_ref` TEXT ? unresolved/source diagram identifier; `diagram_item_number` TEXT ? source diagram item; `verification_status`. Diagram text is evidence, not a relational FK. |
| `part_image` | `id`; `part_id` INTEGER required FK; `image_ref` TEXT ? nonblank opaque evidence reference when supplied; `image_kind` TEXT required default `representative`, unconstrained source kind; `description` TEXT ? caption; `source`, `source_ref`, `verification_status`; `availability_status` TEXT required default `available`, enum `available`/`unavailable`. NULL reference requires `unavailable`; an unavailable row may retain a non-NULL reference. Multiple unidentified views and NULL placeholders are permitted. No image encoding/storage format is prescribed. |

### Applicability and supersession

| Entity | Fields and purposes |
|---|---|
| `model_range` | `id`; `range_code` TEXT required unique nonblank range identifier; `name` TEXT required nonblank source label; `source`, `source_ref`, `verification_status`. |
| `vin_range` | `id`; `vin_prefix`, `serial_start`, `serial_end` TEXT required nonblank source prefix/boundaries; `model_year` TEXT ? stated year; `production_boundary` TEXT ? stated production/use-introduction boundary; `market`, `body`, `engine_variant`, `emissions`, `transmission_steering` TEXT ? source discriminators; `source`, `source_ref`, `verification_status`. There is no confidence field or structured source-versus-derived discriminator in this table. Text boundaries have no enforced order, width, VIN validity or inclusion policy. |
| `part_model_range` | Composite PK `part_id`, `model_range_id` (INTEGER required FKs); `source`, `source_ref`, `verification_status` describe evidence for this link. |
| `part_vin_range` | Composite PK `part_id`, `vin_range_id` (INTEGER required FKs); `source`, `source_ref`, `verification_status` describe evidence for this link. |
| `part_supersession` | Composite PK `superseded_part_id`, `superseding_part_id` (INTEGER required FKs); `source`, `source_ref`, `verification_status`, `confidence`; `effective_from`, `effective_to` TEXT ? source historical boundaries. NULL is an unknown/unsupplied boundary, not proof of unlimited validity. |
| `part_fitment` | `id`; `part_occurrence_id` INTEGER ? FK; `part_id` INTEGER ? FK; `vehicle_range_id` INTEGER ? FK to retained `vehicle_range`; `variation`, `qualifier` TEXT ? retained source range qualifiers. Exactly one scope is required: occurrence with both direct IDs NULL, or PART/range pair with occurrence NULL; `applicability_state` TEXT required default `applicable`, enum `applicable`/`excluded`/`unavailable`; `attribute_group`, `attribute_key` TEXT ? original attribute identifiers; `source_value` TEXT ? nonblank original value when supplied; `except_flag` TEXT ? nonblank original exclusion indicator; `source`, `source_ref`, `verification_status`, `confidence`. A row's default is not evidence of applicability: ingestion must choose the state explicitly. |

### Diagrams, hotspots and catalogue location

| Entity | Fields and purposes |
|---|---|
| `diagram` | `id`; `source`, `source_ref`; `diagram_ref` TEXT required nonblank source illustration identity; `title` TEXT ? caption; `image_ref` TEXT ? image evidence (NULL means no supplied image); `verification_status`, `confidence`. |
| `part_occurrence_diagram` | Composite PK `part_occurrence_id`, `diagram_id` (INTEGER required FKs). Explicit membership link; no extra provenance fields. |
| `diagram_hotspot` | `id`; `diagram_id` INTEGER required FK; `part_occurrence_id` INTEGER ? FK (NULL means unmapped/deleted occurrence); `item_number` TEXT ? nonblank source item when supplied; `source_x`, `source_y` REAL ? source coordinates; `source_geometry` TEXT ? opaque geometry; `coordinate_system` TEXT ? nonblank source coordinate reference when supplied; `source_ref`, `verification_status`, `confidence`. Requires geometry OR both coordinates; zero/negative coordinates are valid source data. SQL permits missing coordinate system and does not parse geometry. |
| `part_vehicle_location` | `id`; `part_occurrence_id` INTEGER required FK; `model_range_id` INTEGER ? FK (NULL means no supplied model scope, not universal applicability); `location_ref`, `system_ref`, `category_ref` TEXT ? nonblank evidence references when supplied; `mapping_state` TEXT required default `unavailable`, enum `verified`/`unavailable`; `source`, `source_ref`, `verification_status`, `confidence`. `verified` requires `location_ref`; SQL does not prohibit a reference on `unavailable`. Consumers must honor the state. |

### Operational identity and stock

| Entity | Fields and purposes |
|---|---|
| `vehicle` | `id`; `vin_raw` TEXT ? observed VIN; `serial` TEXT ? observed serial; `model_range` TEXT ? legacy source label, not FK to `model_range`; `market` TEXT ? source market; `identity_status` TEXT required default `unresolved`, unconstrained status; `notes` TEXT ? operational notes; `created_at`, `updated_at`. VIN/serial are indexed but not unique or validated. |
| `vehicle_identifier` | `id`; `vehicle_id` INTEGER required FK; `identifier_type` TEXT required source identifier kind; `location` TEXT ? where the identifier was observed on the vehicle; `raw_value` TEXT required observed value; `normalized_value` TEXT ? derived lookup representation; `source_ref`, `verification_status`. Multiple/conflicting observations remain representable. |
| `stock_item` | `id`; `part_number` TEXT required historical/stocked reference (not canonical identity); `quantity` INTEGER required default 0, CHECK >=0; `condition` TEXT required default `unknown`; `status` TEXT required default `available`; `location` TEXT ? physical storage; `donor_vehicle` TEXT ? original donor text; `source_ref`; `notes` TEXT ? operational notes; `created_at`, `updated_at`; `part_id` INTEGER ? FK (unresolved or deleted catalogue identity); `donor_vehicle_id` INTEGER ? FK (unresolved or deleted donor); `source`, `verification_status`, `confidence`; `available` INTEGER required default 1, enum 0/1. Status/condition are not enums; status, available and quantity are not automatically synchronized. Price is not implemented. |

### Retained range and presentation entities

These retain their original presentation semantics. `vehicle_range` is not an alias for `model_range`; no unverified conversion or collapse is performed. Rebuilt images and fitment use their normal domain tables documented above. There are no persistent deployment-specific or compatibility tables.

| Entity | Fields and purposes |
|---|---|
| `vehicle_range` | `id`; `range_code` TEXT required unique presentation range code; `name` TEXT required display name; `verification_status` default `fixture`. |
| `part_tree_node` | `id`; `parent_id` INTEGER ? self FK (NULL root); `label` TEXT required presentation label; `sort_order` INTEGER required default 0. No cycle CHECK. |
| `part_tree_part` | Composite PK `tree_node_id`, `part_id` (INTEGER required FKs); many-to-many presentation tree membership. |
| `part_diagram` | `id`; `part_id` INTEGER required FK; `title` TEXT required display title; `image_url` TEXT ? image URL; `availability_status` TEXT required default `available`, unconstrained status; `source_ref`; `verification_status` default `fixture`. |

## Cardinalities, identity and deletion

All parents may have zero children. FKs reject nonexistent non-NULL parents. All declared FKs use ON DELETE CASCADE except the three SET NULL relationships listed below; ON UPDATE is NO ACTION. SQL deletion is described here for consumer safety, not as an import deletion policy.

| Relationship / entity | Cardinality and key behavior |
|---|---|
| PART → occurrence / image | 1:N, each child has exactly one PART; cascade deletes children. Occurrence identity `(part_id, source, source_ref)`; image identity `(part_id, image_ref)`. |
| PART ↔ model / VIN range | N:M via composite link PKs. Deleting either endpoint removes links, not the other endpoint. |
| PART → superseding PART | Directed N:M graph, ordered pair PK; self-links rejected. Deleting either PART removes incident edges, not other PARTs or stock. |
| Occurrence → fitment | 1:N for occurrence-scoped rows. Partial expression unique index uses occurrence/state plus `COALESCE(..., '')` for all four attribute/value/exclusion fields. NULL and empty group/key therefore collide; different source references alone do not distinguish the same fitment identity. |
| PART / vehicle range → fitment | Both required for range-scoped rows; each parent 1:N. The occurrence must be NULL. Partial unique key `(part_id, vehicle_range_id, variation, qualifier)` retains ordinary nullable uniqueness. Deleting either parent cascades the row; the other parent remains. |
| Occurrence ↔ diagram | N:M composite PK. Deleting either endpoint removes links. |
| Diagram → hotspot | 1:N required diagram; deleting diagram removes hotspots. |
| Occurrence → hotspot | 1:N optional occurrence; deleting occurrence SET NULL preserves hotspot/source evidence. Independent FKs do not enforce occurrence-diagram membership in the link table. |
| Occurrence → vehicle location | 1:N required occurrence; optional model range. Deleting occurrence or a referenced model removes the mapping. |
| PART / donor vehicle → stock | Each parent 1:N; each stock has 0..1 PART and 0..1 donor. Deleting either parent SET NULL preserves stock identity, quantity, historical number, donor text and location. Supersession never mutates stock. |
| Vehicle → identifiers | 1:N; cascade on vehicle deletion. Identifier text is not unique. |
| Tree parent → nodes / tree ↔ PART | Parent 0..1 per node, 1:N children; cascade subtree deletion. N:M PART membership; deleting either endpoint removes memberships. |
| PART → part diagram | 1:N; cascade on PART deletion. |

The normalized PART number has a partial unique index for non-NULL values; multiple NULL identities and duplicate descriptions are valid. The database does not compute normalization on new writes. JS normalization removes Unicode whitespace/hyphens and uppercases; 0002's historical SQL removes ASCII space/tab/CR/LF/hyphen with SQLite UPPER. They are not a universal Unicode equivalence contract. Importers should use the approved normalization and detect collisions explicitly.

`diagram(source, source_ref, diagram_ref)`, `part_vehicle_location(part_occurrence_id, model_range_id, location_ref, system_ref, category_ref)` and the PART/range-scoped fitment unique index use SQLite's ordinary NULL semantics: duplicates are possible when any indexed component is NULL. These are not nullable-key deduplication guarantees. Empty strings and NULL may also differ. Fixture replay/import idempotency must not rely on `INSERT OR IGNORE` alone for these entities.

## Index inventory and query contract

The executable tests inspect the actual index catalogue and column order, unique/partial flags, and EXPLAIN QUERY PLAN for principal equality/reverse lookups. Autoindexes implement composite PKs and unique range codes; SQLite assigns their internal names. No production latency or selectivity claim is implied by these fixture-scale tests.

| Table | Named indexes (ordered columns) |
|---|---|
| `part` | `idx_part_number_normalized_unique` UNIQUE (`part_number_normalized`) WHERE non-NULL; `idx_part_number_raw` (`part_number_raw`). |
| `part_occurrence` | `idx_part_occurrence_identity` UNIQUE (`part_id`, `source`, `source_ref`); `idx_part_occurrence_part` (`part_id`); `idx_part_occurrence_context` (`context_type`, `context_ref`); `idx_part_occurrence_diagram` (`diagram_ref`, `diagram_item_number`). |
| `part_image` | `idx_part_image_identity` UNIQUE (`part_id`, `image_ref`) WHERE non-NULL reference; `idx_part_image_part` (`part_id`); `idx_part_image_source` (`source`, `source_ref`). |
| `vin_range` | `idx_vin_range_prefix_serial` (`vin_prefix`, `serial_start`, `serial_end`). Text ordering alone is not VIN applicability. |
| `part_model_range`, `part_vin_range` | `idx_part_model_range_range` (`model_range_id`); `idx_part_vin_range_range` (`vin_range_id`). Composite PKs support PART-first lookups. |
| `part_supersession` | `idx_part_supersession_superseding` (`superseding_part_id`); `idx_part_supersession_superseded` (`superseded_part_id`). The latter overlaps the PK prefix but remains present. |
| `part_fitment` | `idx_part_fitment_identity` UNIQUE expression key WHERE occurrence non-NULL; `idx_part_fitment_range_identity` UNIQUE (`part_id`, `vehicle_range_id`, `variation`, `qualifier`) WHERE PART/range non-NULL and occurrence NULL; `idx_part_fitment_part` (`part_id`); `idx_part_fitment_occurrence` (`part_occurrence_id`); `idx_part_fitment_range` (`vehicle_range_id`); `idx_part_fitment_attribute` (`attribute_group`, `attribute_key`, `source_value`). |
| `diagram` | `idx_diagram_identity` UNIQUE (`source`, `source_ref`, `diagram_ref`). Use a complete source identity or ID; `diagram_ref` alone is not globally unique/index-leading. |
| `part_occurrence_diagram` | `idx_part_occurrence_diagram_diagram` (`diagram_id`); PK supports occurrence-first lookup. |
| `diagram_hotspot` | `idx_diagram_hotspot_diagram` (`diagram_id`); `idx_diagram_hotspot_occurrence` (`part_occurrence_id`); `idx_diagram_hotspot_item` (`diagram_id`, `item_number`). |
| `part_vehicle_location` | `idx_part_vehicle_location_identity` UNIQUE nullable key described above; `idx_part_vehicle_location_model` (`model_range_id`); `idx_part_vehicle_location_state` (`mapping_state`). Identity prefix supports occurrence lookup. |
| `stock_item` | `idx_stock_item_part_number` (`part_number`); `idx_stock_item_status` (`status`); `idx_stock_item_location` (`location`); `idx_stock_item_part_id` (`part_id`); `idx_stock_item_available` (`available`); `idx_stock_item_donor_vehicle` (`donor_vehicle_id`); `idx_stock_item_source` (`source`). |
| `vehicle`, `vehicle_identifier` | `idx_vehicle_vin_raw` (`vin_raw`); `idx_vehicle_serial` (`serial`); `idx_vehicle_identifier_normalized` (`normalized_value`). No vehicle-first identifier index is present; assess separately at operational scale. |
| `part_tree_node`, `part_tree_part` | `idx_part_tree_parent` (`parent_id`, `sort_order`); `idx_part_tree_part_part` (`part_id`), plus membership PK. |
| `part_diagram` | `idx_part_diagram_part` (`part_id`). |

Principal canonical lookup is `WHERE part_number_normalized = ?`, then relationships by PART/occurrence ID. Reverse range/supersession/diagram/donor queries use the reverse indexes. Stock filters have independent indexes; combined predicates and sorts require query-plan measurement with representative inventory before adding composite indexes. The current VIEPS API combines normalized/raw/description with OR and ordering; unindexed description fallback can scan `part`. Canonical index presence does not prove that entire mixed query is indexed. Do not make descriptions unique to improve lookup.

## Executable acceptance evidence and fixture usage

Run `npm test` from this Worker directory using Node 24 or newer. Tests use built-in `node:sqlite` with FKs enabled, execute the ordered SQL migrations transactionally, and exercise Worker SQL via a small D1-compatible adapter. No package installation or remote database is needed for these tests. CI runs the same command on Linux and Windows. SQLite execution is not remote D1 deployment evidence; deployed end-to-end validation is separately skipped unless `VIEPS_BASE_URL` is supplied.

`tests/fixtures/part_model_integrity.sql` is a coherent single-load synthetic graph, not real inventory. It demonstrates all eleven representative fixture requirements in #354, with IDs in the 538xx/539xx range: multiple occurrences and unidentified images, model/VIN links, positive/excluded/unavailable fitment, mapped/unmapped hotspots, verified/unavailable locations, `MNA7691AA → XR847031` and a longer synthetic chain, many-to-one replacement, multiple stock records, donor identity and unresolved stock. Provenance is explicitly fixture evidence. Never present synthetic vehicle zones or VINs as verified domain facts.

`part_presentation.sql` contains MVP part-presentation fixtures targeting the completed normal schema. The upgrade test inserts original 0003-shaped rows and compares every retained field after rebuilding, including nullable duplicates and unavailable placeholders. A collision test proves transactional rollback retains original image records. Individual older step fixtures run in separate fresh databases; the occurrence fixture needs PART ID 1, and the VIN fixture needs `MNA7691AA`. They are not a combined or idempotent production seed set: some reuse numbers/IDs and nullable identities. The acceptance graph supplies coherent combined coverage instead.

Tests execute every declared FK against a nonexistent parent, concrete unique collisions, required/CHECK boundaries, nullable exceptions, cascading and SET NULL deletion, normalization-collision rollback, and principal indexed queries. The older SQL-text assertions remain supplemental structure checks, not proof that the schema can execute.

## Explicit unresolved decisions

These remain open boundaries, not silently selected product rules. They do not prevent testing the existing MVP representation.

The [PART applicability contract](../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART_APPLICABILITY.md) includes the added persistence dictionary, review requirements and remaining evaluator/importer boundaries. The [source validation record](../../../../../7-Research/JEPC_APPLICABILITY_MODEL_REFINEMENT.md) identifies the concrete evidence and verification limits. The original field dictionary above describes the pre-0014 entities; the companion contract describes the additive schema.

The added index inventory is: `idx_applicability_snapshot_active` (unique active snapshot per bundle); `idx_applicability_serial_domain` (serial domain/comparator); `idx_applicability_context_range` (canonical model range); `idx_occurrence_applicability_occurrence` and `idx_occurrence_applicability_context` (both relationship directions); `idx_applicability_attribute_lookup` (typed dimension/value). Primary/unique keys additionally index source bundle identity, snapshot revision, evidence locator, source model version, assertion source key, condition-set identity, dimension vocabulary and evidence memberships.

The 0014 persistence extension resolves storage of occurrence/context pairing, grouped conditions, evidence multiplicity and incomplete endpoint states. Approved source mappings, serial comparison/normalization, effective-range computation, fitment evaluation, importer execution and API/UI integration remain separate work. The new internal evidence reader returns `evaluation = unavailable` and is not exposed as a fitment endpoint.

| Decision / gap | Current representation and owner for later resolution |
|---|---|
| Dedicated model/variant and occurrence-scoped range links | PART-level links plus retained PART/vehicle-range qualifiers; source context text on occurrences. #354/#355 must approve richer source-to-model mapping. Range-partitioned D1 routing/cross-database identity remain separate follow-up #555; current local FKs are not a permanent single-D1 architecture. |
| VIN ordering, inclusion, decoding and derived provenance | Source TEXT fields only, no ordered-boundary CHECK or decoder, no confidence/derivation column. Dedicated VIN work and #354 own a future typed contract. KOVuosi is not an inference source. |
| Confidence and verification vocabularies | Uncontrolled text, with REAL affinity only on stock confidence. #353/#354/#355 must define any conversion or controlled states. |
| Nullable identity / import idempotency | NULL-bearing diagram/location keys allow repeats; importer #355 must define evidence identity/deduplication before imposing stronger uniqueness. |
| Hotspot membership and coordinate completeness | Separate FKs allow a hotspot occurrence without a corresponding occurrence-diagram link; source geometry is opaque and coordinate system may be NULL. Consumers cannot assume membership/normalization. #352/#355 own validation/conversion. |
| Vehicle zone/system/category taxonomy | Opaque references with explicit mapping state, not authoritative geometry/classification. #361/#362 own final taxonomy. |
| Fitment semantic interpretation | Source attributes/except flag retained; no consistency rule or typed interpretation relation. #355 must establish source semantics before mapping. |
| Supersession cycles, chronology and evidence multiplicity | Directed pair, no multi-hop cycle/date ordering checks; one evidence tuple per pair. #354/#364 own future graph/evidence policy. Traversal must bound/track visited IDs. |
| Occurrence versus PART/range fitment | One domain table with mutually exclusive scopes; retained range qualifiers are not verified source attributes. The current API projects range qualifiers only. Importer/API work must consume the scope and provenance explicitly. |
| JEPC source/release/snapshot identity | Source/reference text exists, but no dedicated release, snapshot or `isClassic` field/entity is implemented. #354/#355 own that contract; do not infer Classic state from supersession or stock. |
| Stock status, quantities and price | Quantity >=0 and available 0/1 only; SQLite INTEGER affinity does not reject every fractional value. No status/availability synchronization, price/currency, transactions or reservations implementation. #353/#280 own additions and approved operational validation. |
| Canonical normalization and raw agreement | Import/application responsibility; SQL accepts independently supplied values. Universal Unicode normalization and collision policy require explicit approval before broadening existing ASCII catalogue behavior. |

The implemented inventory fields cover the stated basic persistence requirements; this does not certify all accepted #353 stock workflows, price handling, full model/variant semantics or remote deployment. #354 acceptance must distinguish tested repository representation from those broader requirements and from independent review/merge completion.
