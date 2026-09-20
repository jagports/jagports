# VIEPS PART Model

## Purpose

This document defines canonical catalogue `PART` identity and the catalogue-side relationships needed by VIEPS part search, part detail, EPC context, applicability, diagrams, hotspots, supersession and operational stock linkage.

Operational stock semantics are defined separately in [`MODEL_STOCK.md`](MODEL_STOCK.md).

Occurrence-bound grouped applicability and versioned source-evidence semantics are defined in [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md).

## Canonical PART identity

`PART` is the stable catalogue/reference identity.

The internal `id` is the stable PART identity. A part number can be attached later without changing that identity.

A PART may be created before a catalogue part number is known, allowing unidentified reference parts to be recorded and subsequently identified.

Unresolved physical stock does not require a PART row.

## PART fields

| Field | Requirement | Meaning |
|---|---|---|
| `id` | required | Stable internal catalogue-part identifier. |
| `part_number_raw` | optional | Original part-number representation supplied by the source, when known. |
| `part_number_normalized` | optional, unique when present | Stable lookup identity derived from the raw part number. Multiple NULL values are allowed. |
| `description` | optional, non-unique | Part description/name; may be empty or NULL. Descriptions are not identity because different parts can share the same description. |
| `source_origin` | required | How the PART record entered the PART database. Controlled values: `ImportJEPC` or `AddedManually`. |
| `source` | optional | Source system/document identifier. |
| `source_ref` | optional | Source reference or URL where available. |
| `verification_status` | required | Provenance/verification state; defaults to `unverified`. |

## PART record origin

`part.source_origin` records how the PART record entered the PART database.

Allowed values are:

- `ImportJEPC` — the PART record was created from JEPC importer output;
- `AddedManually` — the PART record was created manually in VIEPS, including Jagports specified third-party PARTs.

This field records record origin only. It does not replace detailed `source`, `source_ref`, verification, occurrence, or importer provenance evidence.

A later verification or enrichment step must not change `source_origin`; the value describes how the canonical PART record was first created.

## Unidentified parts

A PART can initially have no part number, a useful description such as `Fir tree clip`, and source/provenance information when available.

It can later be identified through a verified catalogue part number.

Descriptions are not unique identifiers.

## Part-number normalization

Part-number normalization is deterministic and conservative: require a string when supplied, trim surrounding whitespace, convert to uppercase, remove whitespace and hyphen separators, and preserve the original representation in `part_number_raw`.

Examples:

| Raw input | Normalized value |
|---|---|
| `MNA 7691-AA` | `MNA7691AA` |
| `mna-7691-aa` | `MNA7691AA` |
| `XR847031` | `XR847031` |

## PART image and identification evidence

`part_image` is a separate child entity of canonical `part`.

It stores a stable image record ID, `part_id`, opaque `image_ref`, source/provenance, optional description, and verification status.

One PART may have multiple images, including before its catalogue part number is known.

Image descriptions are not identity fields.

An unavailable image placeholder has `image_ref = NULL` and `availability_status = unavailable`; no invented reference is needed.

## PART vehicle and VIN applicability

Migration `0016_occurrence_applicability.sql` adds occurrence-bound model context, alternative condition sets and versioned evidence. Existing PART-level model/VIN links remain intact. The companion [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md#implemented-persistence-contract) defines these additive relations and their verification limits; no legacy fitment row is automatically promoted into them.

Vehicle applicability is represented outside the canonical `part` row.

`model_range` and `vin_range` are distinct concepts.

Model-range and VIN-range applicability are not collapsed into one entity.

A PART can link to multiple ranges through `part_model_range` and `part_vin_range`.

Those legacy links apply at PART level. The `0016` extension binds an occurrence to a versioned source model context and its optional canonical `model_range`; it does not introduce a complete global model/variant ontology.

Discriminator columns retain source text, not decoder output with independently tracked derivation.

VIN-derived interpretation must remain distinguishable from source facts.

This model does not use KOVuosi as a source for VIN decoding, VIN-range selection or model-year inference and does not implement a complete VIN decoder.

## PART supersession

`part_supersession` is an explicit directed relationship between catalogue parts.

`superseded_part_id → superseding_part_id` preserves both historical and replacement identities.

One replacement may supersede multiple historical parts and chains such as `A → B → C` are representable.

Supersession is not a generic interchangeability assertion.

Historical and current part identities remain separately addressable.

Only direct self-links are prohibited; multi-hop cycles and effective-date ordering are not constrained.

Representative evidence fixture: `MNA7691AA → XR847031`.

## PART fitment and attribute applicability

`part_fitment` stores source occurrence constraints and retained PART/range qualifiers in one domain table.

Every row has exactly one scope:

- an occurrence; or
- a PART plus `vehicle_range` pair.

It cannot name both scopes.

Retained range qualifiers remain source text.

Opaque JEPC attribute groups remain source data until semantic interpretation is verified.

The original source representation of `exceptFlag` is retained in `except_flag`.

The database does not translate that value or check consistency with `applicability_state`; a verified importer must supply the state.

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

The occurrence-bound grouped applicability extension is additive to `part_fitment`. Its internal reader returns evidence with evaluation explicitly unavailable; it does not silently reinterpret existing stored `applicability_state` rows as the richer evaluator contract.

## PART diagram and hotspot

PART diagram and hotspot records preserve source evidence; they do not define normalized geometry.

The diagram/location structure keeps EPC illustration identity, hotspot evidence, and catalogue vehicle-location mapping separate from both canonical PART identity and physical stock storage.

`diagram` represents an EPC/exploded illustration reference.

`part_occurrence_diagram` links one or more `part_occurrence` records to a diagram so the same canonical PART can remain represented in multiple EPC contexts without duplication.

`diagram_hotspot` represents an item/hotspot on a diagram and may link to the corresponding `part_occurrence`.

Source coordinates are retained as source evidence; no normalized VIEPS geometry is implied by the PART model.

A hotspot without a verified occurrence mapping remains representable.

## Catalogue vehicle location

`part_vehicle_location` represents a catalogue-side vehicle-location mapping scoped to a PART occurrence and, where applicable, a `model_range`.

`mapping_state` is explicitly `verified` or `unavailable`.

A verified mapping requires a location reference.

An unavailable mapping records that no verified mapping is available and must not fabricate a zone or coordinate.

Physical stock/storage location is not stored in this entity; it remains part of the operational stock model.

## PART to operational stock

`stock_item` is an operational record and is not a catalogue PART identity.

`stock_item.part_id` is a nullable foreign key to canonical `part(id)`, allowing a resolved stock record to point to the catalogue identity while leaving unresolved/non-catalogue stock with `part_id = NULL`.

The existing `stock_item.part_number` field is retained as the stocked or historical part-number reference.

It is not the relational identity and does not require a matching canonical PART.

One canonical PART may have multiple stock records.

Donor vehicle identity is represented separately by nullable `stock_item.donor_vehicle_id → vehicle(id)`.

This is distinct from catalogue vehicle/model/VIN applicability and from physical stock/storage location.

Unresolved/non-catalogue stock is representable without fabricating a canonical PART.

The stock relationship does not implement warehouse transaction history, reservations, sales workflow, external catalogue synchronization, or automatic stock mutation from catalogue supersession.

## Architectural boundary

`PART` contains catalogue/reference identity only.

It has no direct vehicle applicability field and no mutable stock state.

`PART_IMAGE` is evidence associated with that stable identity.

Applicability belongs to occurrence/fitment/context relationships.

Diagram/hotspot/location evidence belongs to explicit relationships.

Operational inventory belongs to separate stock records.

Catalogue vehicle location and physical stock/storage location are distinct concepts.

## Field dictionary

`?` means SQL NULL is allowed: absent/unknown/not supplied, never an inferred positive or negative claim.

Optional text is source evidence with no assumed taxonomy unless a special meaning is stated.

Required text may still be blank unless a CHECK is explicitly documented.

SQLite affinities are not strict types; application/import validation is still necessary.

All standalone `id` fields are `INTEGER PRIMARY KEY AUTOINCREMENT` unless a table uses a composite key.

### Shared evidence fields

| Field | SQL type / null / default | Purpose |
|---|---|---|
| `source` | TEXT ? | Source system/document identifier; required and nonblank on `part_occurrence`. |
| `source_ref` | TEXT ? | Evidence URL/reference; required and nonblank on `part_occurrence`. A reference is not necessarily a URL. |
| `verification_status` | TEXT required, default `unverified` | Source/manual verification claim, not a controlled enum. |
| `confidence` | TEXT ? on supersession/fitment/diagram/location; REAL ? on stock | Source confidence value. There is no shared vocabulary, numeric interval or conversion policy. |
| `created_at`, `updated_at` | TEXT required, default CURRENT_TIMESTAMP | On vehicle and stock only. Writers must maintain update semantics. |

### Canonical identity and context

| Entity | Fields and purposes |
|---|---|
| `part` | `id`; `part_number_raw`; `part_number_normalized`; `description`; `source`; `source_ref`; `verification_status`. |
| `part_occurrence` | `id`; `part_id`; `source`; `source_ref`; `context_type`; `context_ref`; `category_ref`; `item_number`; `diagram_ref`; `diagram_item_number`; `verification_status`. |
| `part_image` | `id`; `part_id`; `image_ref`; `image_kind`; `description`; `source`; `source_ref`; `verification_status`; `availability_status`. |

### Applicability and supersession

| Entity | Fields and purposes |
|---|---|
| `model_range` | `id`; `range_code`; `name`; `source`; `source_ref`; `verification_status`. |
| `vin_range` | `id`; `vin_prefix`; `serial_start`; `serial_end`; `model_year`; `production_boundary`; `market`; `body`; `engine_variant`; `emissions`; `transmission_steering`; `source`; `source_ref`; `verification_status`. |
| `part_model_range` | Composite PK `part_id`, `model_range_id`; evidence fields describe the relationship. |
| `part_vin_range` | Composite PK `part_id`, `vin_range_id`; evidence fields describe the relationship. |
| `part_supersession` | Composite PK `superseded_part_id`, `superseding_part_id`; `source`; `source_ref`; `verification_status`; `confidence`; `effective_from`; `effective_to`. |
| `part_fitment` | `id`; `part_occurrence_id`; `part_id`; `vehicle_range_id`; `variation`; `qualifier`; `applicability_state`; `attribute_group`; `attribute_key`; `source_value`; `except_flag`; `source`; `source_ref`; `verification_status`; `confidence`. |

The implemented occurrence applicability persistence dictionary is maintained in [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md#implemented-persistence-contract) rather than duplicated here.

### Diagrams, hotspots and catalogue location

| Entity | Fields and purposes |
|---|---|
| `diagram` | `id`; `source`; `source_ref`; `diagram_ref`; `title`; `image_ref`; `verification_status`; `confidence`. |
| `part_occurrence_diagram` | Composite PK `part_occurrence_id`, `diagram_id`. |
| `diagram_hotspot` | `id`; `diagram_id`; `part_occurrence_id`; `item_number`; `source_x`; `source_y`; `source_geometry`; `coordinate_system`; `source_ref`; `verification_status`; `confidence`. |
| `part_vehicle_location` | `id`; `part_occurrence_id`; `model_range_id`; `location_ref`; `system_ref`; `category_ref`; `mapping_state`; `source`; `source_ref`; `verification_status`; `confidence`. |

### Operational identity and stock link

| Entity | Fields and purposes |
|---|---|
| `vehicle` | `id`; `vin_raw`; `serial`; `model_range`; `market`; `identity_status`; `notes`; `created_at`; `updated_at`. |
| `vehicle_identifier` | `id`; `vehicle_id`; `identifier_type`; `location`; `raw_value`; `normalized_value`; `source_ref`; `verification_status`. |
| `stock_item` | `id`; `part_number`; `quantity`; `condition`; `status`; `location`; `donor_vehicle`; `source_ref`; `notes`; `created_at`; `updated_at`; `part_id`; `donor_vehicle_id`; `source`; `verification_status`; `confidence`; `available`. Full stock model fields and controlled condition code semantics are defined in `MODEL_STOCK.md`. |

### Retained range and presentation entities

`vehicle_range` is not an alias for `model_range`; no unverified conversion or collapse is performed.

| Entity | Fields and purposes |
|---|---|
| `vehicle_range` | `id`; `range_code`; `name`; `verification_status`. |
| `part_tree_node` | `id`; `parent_id`; `label`; `sort_order`. |
| `part_tree_part` | Composite PK `tree_node_id`, `part_id`. |
| `part_diagram` | `id`; `part_id`; `title`; `image_url`; `availability_status`; `source_ref`; `verification_status`. |

## Cardinalities, identity and deletion

| Relationship / entity | Cardinality and key behavior |
|---|---|
| PART → occurrence / image | 1:N, each child has exactly one PART; cascade deletes children. |
| PART ↔ model / VIN range | N:M via composite link PKs. Deleting either endpoint removes links, not the other endpoint. |
| PART → superseding PART | Directed N:M graph, ordered pair PK; self-links rejected. Deleting either PART removes incident edges, not other PARTs or stock. |
| Occurrence → fitment | 1:N for occurrence-scoped rows. |
| PART / vehicle range → fitment | Both required for range-scoped rows; each parent 1:N. The occurrence must be NULL. |
| Occurrence ↔ diagram | N:M composite PK. Deleting either endpoint removes links. |
| Diagram → hotspot | 1:N required diagram; deleting diagram removes hotspots. |
| Occurrence → hotspot | 1:N optional occurrence; deleting occurrence SET NULL preserves hotspot/source evidence. |
| Occurrence → vehicle location | 1:N required occurrence; optional model range. Deleting occurrence or a referenced model removes the mapping. |
| PART / donor vehicle → stock | Each parent 1:N; each stock has 0..1 PART and 0..1 donor. Deleting either parent SET NULL preserves stock identity, quantity, historical number, donor text and location. Supersession never mutates stock. |
| Vehicle → identifiers | 1:N; cascade on vehicle deletion. Identifier text is not unique. |
| Tree parent → nodes / tree ↔ PART | Parent 0..1 per node, 1:N children; cascade subtree deletion. N:M PART membership. |
| PART → part diagram | 1:N; cascade on PART deletion. |

The normalized PART number has a partial unique index for non-NULL values; multiple NULL identities and duplicate descriptions are valid.

The database does not compute normalization on new writes.

## Index inventory and query contract

The executable tests inspect the actual index catalogue and column order, unique/partial flags, and EXPLAIN QUERY PLAN for principal equality/reverse lookups.

Autoindexes implement composite primary keys and unique range codes; SQLite assigns their internal names.

| Table | Named indexes |
|---|---|
| `part` | `idx_part_number_normalized_unique`; `idx_part_number_raw`. |
| `part_occurrence` | `idx_part_occurrence_identity`; `idx_part_occurrence_part`; `idx_part_occurrence_context`; `idx_part_occurrence_diagram`. |
| `part_image` | `idx_part_image_identity`; `idx_part_image_part`; `idx_part_image_source`. |
| `vin_range` | `idx_vin_range_prefix_serial`. |
| `part_model_range`, `part_vin_range` | `idx_part_model_range_range`; `idx_part_vin_range_range`. |
| `part_supersession` | `idx_part_supersession_superseding`; `idx_part_supersession_superseded`. |
| `part_fitment` | `idx_part_fitment_identity`; `idx_part_fitment_range_identity`; `idx_part_fitment_part`; `idx_part_fitment_occurrence`; `idx_part_fitment_range`; `idx_part_fitment_attribute`. |
| `diagram` | `idx_diagram_identity`. |
| `part_occurrence_diagram` | `idx_part_occurrence_diagram_diagram`. |
| `diagram_hotspot` | `idx_diagram_hotspot_diagram`; `idx_diagram_hotspot_occurrence`; `idx_diagram_hotspot_item`. |
| `part_vehicle_location` | `idx_part_vehicle_location_identity`; `idx_part_vehicle_location_model`; `idx_part_vehicle_location_state`. |
| `stock_item` | `idx_stock_item_part_number`; `idx_stock_item_status`; `idx_stock_item_location`; `idx_stock_item_part_id`; `idx_stock_item_available`; `idx_stock_item_donor_vehicle`; `idx_stock_item_source`. |
| `vehicle`, `vehicle_identifier` | `idx_vehicle_vin_raw`; `idx_vehicle_serial`; `idx_vehicle_identifier_normalized`. |
| `part_tree_node`, `part_tree_part` | `idx_part_tree_parent`; `idx_part_tree_part_part`. |
| `part_diagram` | `idx_part_diagram_part`. |
| occurrence applicability | `idx_applicability_snapshot_active`; `idx_applicability_serial_domain`; `idx_applicability_context_range`; `idx_occurrence_applicability_occurrence`; `idx_occurrence_applicability_context`; `idx_applicability_attribute_lookup`. |

Principal canonical lookup is `WHERE part_number_normalized = ?`, then relationships by PART/occurrence ID.

Reverse range/supersession/diagram/donor queries use the reverse indexes.

Stock filters have independent indexes; combined predicates and sorts require query-plan measurement with representative inventory before adding composite indexes.

The current VIEPS API combines normalized/raw/description with OR and ordering; unindexed description fallback can scan `part`.

Do not make descriptions unique to improve lookup.

## Executable acceptance evidence and fixture usage

Run `npm test` from the Worker directory using Node 24 or newer.

Tests use built-in `node:sqlite` with FKs enabled, execute the ordered SQL migrations transactionally, and exercise Worker SQL via a small D1-compatible adapter.

No package installation or remote database is needed for these tests.

SQLite execution is not remote D1 deployment evidence.

Synthetic fixtures demonstrate occurrences, unidentified images, model/VIN links, positive/excluded/unavailable fitment, mapped/unmapped hotspots, verified/unavailable locations, `MNA7691AA → XR847031`, a longer synthetic supersession chain, many-to-one replacement, multiple stock records, donor identity and unresolved stock.

Occurrence-applicability fixtures additionally exercise grouped model/item/effective serial evidence, alternative attribute sets, repeated source paths, market conditions below shared models, active snapshot replacement/rollback and retained history. These are evidence-storage tests; they do not claim a complete fitment evaluator or production JEPC import.

Provenance is explicitly fixture evidence. Never present synthetic vehicle zones or VINs as verified domain facts.

## Explicit unresolved decisions

These remain open boundaries, not silently selected product rules.

The companion [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md) records the detailed persistence dictionary, evaluation requirements and remaining importer/evaluator boundaries. Supporting source validation is recorded in [`7-Research/jlr/JEPC/JEPC_APPLICABILITY_MODEL_REFINEMENT.md`](../../../../../../7-Research/jlr/JEPC/JEPC_APPLICABILITY_MODEL_REFINEMENT.md).

The `0016` persistence extension resolves storage of occurrence/context pairing, grouped conditions, evidence multiplicity and incomplete endpoint states. Approved source mappings, serial comparison/normalization, effective-range computation, fitment evaluation, importer execution and API/UI integration remain separate work. The internal evidence reader returns `evaluation = unavailable` and is not exposed as a fitment endpoint.

| Decision / gap | Current representation |
|---|---|
| Dedicated model/variant and occurrence-scoped range links | Legacy PART-level links remain; `0016` adds source-qualified occurrence applicability through model context and grouped predicates without claiming a complete global model/variant ontology. |
| VIN ordering, inclusion, decoding and derived provenance | Source TEXT fields only, no ordered-boundary CHECK or decoder, no confidence/derivation column. KOVuosi is not an inference source. |
| Confidence and verification vocabularies | Uncontrolled text, with REAL affinity only on stock confidence. |
| Nullable identity / import idempotency | NULL-bearing diagram/location keys allow repeats; evidence identity/deduplication needs an explicit approved rule before stronger uniqueness is imposed. |
| Hotspot membership and coordinate completeness | Separate FKs allow a hotspot occurrence without a corresponding occurrence-diagram link; source geometry is opaque and coordinate system may be NULL. |
| Vehicle zone/system/category taxonomy | Opaque references with explicit mapping state, not authoritative geometry/classification. |
| Fitment semantic interpretation | Source attributes/except flag retained; grouped occurrence evidence is stored separately but no production evaluator maps it to final fitment. |
| Supersession cycles, chronology and evidence multiplicity | Directed pair, no multi-hop cycle/date ordering checks; one evidence tuple per pair. Traversal must bound/track visited IDs. |
| Occurrence versus PART/range fitment | Existing `part_fitment` remains; occurrence-applicability adds grouped evidence without silently replacing stored fitment states. |
| JEPC source/release/snapshot identity | `0016` adds bundle/snapshot/evidence identity for occurrence applicability; broader importer/source-release policy remains governed by the importer contract. |
| Stock status, quantities and price | PART model documents only the stock relationship boundary; detailed stock semantics are in `MODEL_STOCK.md`. |
| Canonical normalization and raw agreement | Import/application responsibility; SQL accepts independently supplied values. Universal Unicode normalization and collision policy require explicit approval before broadening existing ASCII catalogue behavior. |
