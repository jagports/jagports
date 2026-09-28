# VIEPS PART Model

## Purpose

This document defines canonical catalogue `PART` identity and the catalogue-side relationships needed by VIEPS part search, part detail, EPC context, fit, diagrams, hotspots, supersession and operational stock linkage.

Operational stock semantics are defined separately in [`MODEL_STOCK.md`](MODEL_STOCK.md).

Occurrence-bound grouped fit and versioned source-evidence semantics are defined in [`MODEL_PART_FIT.md`](MODEL_PART_FIT.md).

## Canonical PART identity

`PART` is the stable reusable product/reference identity used by VIEPS.

The same canonical `part(id)` namespace contains both imported Jaguar/JEPC PARTs and manually created Jagports specified PARTs. A Jagports specified PART is canonical inside VIEPS but is not Jaguar-issued and must remain distinguishable by origin/provenance.

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

## Catalogue occurrence tree

A canonical PART may appear in multiple EPC/JEPC source paths. VIEPS therefore treats catalogue browsing as an occurrence-tree problem rather than assigning one tree path to the PART itself.

The imported source path can include:

```text
model/catalogue ancestry
    -> category ancestry
    -> top-level item description
    -> ordered source description/breakpoint nodes
    -> PART occurrence
```

The tree provides browse structure, human-readable occurrence context and source filter candidates. It is not itself the Boolean fit evaluator.

Migration `0017_part_tree_occurrence.sql` extends the existing tree storage additively. It preserves legacy browse rows while allowing source-qualified imported nodes to retain source namespace, model/category/item scope, source language, stable source node identity, parent source node identity, source description, source order, source reference and verification state.

Description text and flattened full-description paths are not structural identity.

`part_tree_part` remains the broad tree-node ↔ canonical PART browse/navigation summary.

`part_occurrence_tree_path` is the exact occurrence/path relation. It links a `part_occurrence` to the source tree node/path evidence and preserves source namespace, stable source path identity, optional application ID, source reference and verification state. One occurrence may have multiple path rows where the source does so.

Filtering is occurrence-first: select the branch, retain occurrences satisfying requested description/VIN/fit filters, then project distinct PART identities. Reverse PART-number search can therefore return every occurrence with its complete retained tree context.

JEPC language trees are not assumed to be structurally identical. Language-qualified source nodes are preserved independently and canonical PART identity is shared across them. Cross-language path equivalence is not inferred from matching labels.

Source-description-to-domain mappings are a separate enrichment layer and do not alter source tree identity or raw fit evidence.

## PART vehicle and VIN fit

Occurrence-bound model context, alternative condition sets and versioned evidence complement the PART-level model/VIN links. The companion [`MODEL_PART_FIT.md`](MODEL_PART_FIT.md#persistence-contract) defines these relations and their verification limits; PART-level fitment rows are not automatically promoted into grouped occurrence evidence.

Vehicle fit is represented outside the canonical `part` row.

`model_range` and `vin_range` are distinct concepts.

Model-range and VIN-range fit are not collapsed into one entity.

A PART can link to multiple ranges through `part_model_range` and `part_vin_range`.

Those links apply at PART level. Occurrence fit binds an occurrence to a versioned source model context and its optional canonical `model_range`; it does not introduce a complete global model/variant ontology.

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

## PART fitment and attribute fit

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

Occurrence-bound grouped fit is separate from `part_fitment`. Grouped evidence does not silently reinterpret stored `applicability_state` rows as an evaluated fit result.

## PART diagram and hotspot

PART diagram and hotspot records preserve source evidence; they do not define normalized geometry.

The diagram/location structure keeps EPC illustration identity, hotspot evidence, and catalogue vehicle-location mapping separate from both canonical PART identity and physical stock storage.

`diagram` represents an EPC/exploded illustration reference.

`part_occurrence_diagram` links one or more `part_occurrence` records to a diagram so the same canonical PART can remain represented in multiple EPC contexts without duplication.

`diagram_hotspot` represents an item/hotspot on a diagram and may link to the corresponding `part_occurrence`.

Source coordinates are retained as source evidence; no normalized VIEPS geometry is implied by the PART model.

A hotspot without a verified occurrence mapping remains representable.

Neither a diagram hotspot nor a visual dashed enclosure establishes kit composition. A diagram may provide evidence that separately numbered component callouts appear inside an apparent kit boundary, but the relationship remains unverified until the image evidence, hotspot/item mapping, component occurrences and source-qualified kit-part context agree.

### Kit-composition evidence

Where a source has a kit PN but no explicit component list, the system may retain a source-qualified `kit_composition_evidence` observation. It is additive evidence, not stock/BOM truth. A verified relationship may connect the kit to a component that retains its own canonical PART and separate availability; membership does not replace the component's individual identity.

Before a verified kit-content link can be published, the Parts Data Model owner must approve an additive representation that records: kit part occurrence or part identity; component occurrence or part identity where available; diagram and exact image checksum; dashed-enclosure/callout observation; source hotspot or item mapping; detector/OCR and coordinate-conversion versions; provenance; verification status; and a reason for unsupported or conflicting cases. A kit-only component with no independent PN/hotspot is represented as source evidence without a fabricated canonical PART or standalone availability. Repeated item numbers and multiple rectangles remain separate observations until their component mapping is verified.

The model must distinguish `candidate`, `verified`, `unsupported` and `conflicting` evidence. It must not infer a kit PN from a dashed line, infer all enclosed components as kit contents, or collapse this catalogue evidence into operational stock or a manufacturing bill of materials.

## Catalogue vehicle location

`part_vehicle_location` represents a catalogue-side vehicle-location mapping scoped to a PART occurrence and, where applicable, a `model_range`.

`mapping_state` is explicitly `verified` or `unavailable`.

A verified mapping requires a location reference.

An unavailable mapping records that no verified mapping is available and must not fabricate a zone or coordinate.

Physical stock/storage location is not stored in this entity; it remains part of the operational stock model.

## PART to operational stock

`stock_item` is an operational record and is not a catalogue PART identity.

`stock_item.part_id` is a nullable foreign key to canonical `part(id)`. When reusable identity is established it points to that canonical PART, whether the PART is an imported Jaguar/JEPC PART or a Jagports specified PART created under `MODEL_PART_THIRD_PARTY.md`.

`stock_item.part_id = NULL` does **not** mean merely "not found in Jaguar/JEPC". It is reserved for stock whose reusable product identity is genuinely unresolved. A known reusable third-party product must first resolve to either an existing Jaguar PART (verified 1:1 case) or a Jagports specified PART (non-1:1 reusable case).

The existing `stock_item.part_number` field is retained as the stocked or historical part-number reference.

It is not the relational identity and does not require a matching canonical PART.

One canonical PART may have multiple stock records.

Donor vehicle identity is represented separately by nullable `stock_item.donor_vehicle_id → vehicle(id)`.

This is distinct from catalogue vehicle/model/VIN fit and from physical stock/storage location.

Unresolved stock is representable without fabricating a canonical PART. Conversely, known reusable third-party products must not be kept unresolved merely because Jaguar did not issue the vendor product number.

The stock relationship does not implement warehouse transaction history, reservations, sales workflow, external catalogue synchronization, or automatic stock mutation from catalogue supersession.

## Architectural boundary

`PART` contains catalogue/reference identity only.

It has no direct vehicle fit field and no mutable stock state.

`PART_IMAGE` is evidence associated with that stable identity.

Fit belongs to occurrence/fitment/context relationships.

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

### Fit and supersession

| Entity | Fields and purposes |
|---|---|
| `model_range` | `id`; `range_code`; `name`; `source`; `source_ref`; `verification_status`. |
| `vin_range` | `id`; `vin_prefix`; `serial_start`; `serial_end`; `model_year`; `production_boundary`; `market`; `body`; `engine_variant`; `emissions`; `transmission_steering`; `source`; `source_ref`; `verification_status`. |
| `part_model_range` | Composite PK `part_id`, `model_range_id`; evidence fields describe the relationship. |
| `part_vin_range` | Composite PK `part_id`, `vin_range_id`; evidence fields describe the relationship. |
| `part_supersession` | Composite PK `superseded_part_id`, `superseding_part_id`; `source`; `source_ref`; `verification_status`; `confidence`; `effective_from`; `effective_to`. |
| `part_fitment` | `id`; `part_occurrence_id`; `part_id`; `vehicle_range_id`; `variation`; `qualifier`; `applicability_state`; `attribute_group`; `attribute_key`; `source_value`; `except_flag`; `source`; `source_ref`; `verification_status`; `confidence`. |

The occurrence-fit persistence dictionary is maintained in [`MODEL_PART_FIT.md`](MODEL_PART_FIT.md#persistence-contract) rather than duplicated here.

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

### Retained range and catalogue-tree entities

`vehicle_range` is not an alias for `model_range`; no unverified conversion or collapse is performed.

| Entity | Fields and purposes |
|---|---|
| `vehicle_range` | `id`; `range_code`; `name`; `verification_status`. |
| `part_tree_node` | `id`; `parent_id`; `label`; `sort_order`; source-qualified fields `source_namespace`, `source_model_id`, `source_category_id`, `source_item_id`, `source_language`, `source_node_id`, `parent_source_node_id`, `source_description`, `source_order`, `source_ref`, `verification_status`. Legacy browse rows may leave source-qualified fields NULL. |
| `part_tree_part` | Composite PK `tree_node_id`, `part_id`. Broad PART membership/browse summary only; it is not exact occurrence/path identity. |
| `part_occurrence_tree_path` | `id`; `part_occurrence_id`; `tree_node_id`; `source_namespace`; `source_path_id`; optional `application_id`; `source_ref`; `verification_status`. Exact occurrence/path evidence; multiple rows per occurrence are valid when source paths differ. |
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
| PART / donor vehicle → stock | Each parent 1:N; each stock has 0..1 canonical PART and 0..1 donor. The PART may be Jaguar/JEPC-imported or Jagports specified. `part_id = NULL` is reserved for genuinely unresolved reusable identity. Deleting either parent SET NULL preserves stock identity, quantity, historical number, donor text and location. Supersession never mutates stock. |
| Vehicle → identifiers | 1:N; cascade on vehicle deletion. Identifier text is not unique. |
| Tree parent → nodes / tree ↔ PART | Parent 0..1 per node, 1:N children; cascade subtree deletion. Current N:M PART membership remains a broad browse summary. |
| Tree ↔ occurrence/path | `part_occurrence_tree_path` is N:M where necessary: one occurrence may retain multiple source paths; deleting occurrence or tree node cascades only the link rows. |
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
| `part_tree_node`, `part_tree_part`, `part_occurrence_tree_path` | `idx_part_tree_parent`; `idx_part_tree_part_part`; `idx_part_tree_source_node_identity`; `idx_part_tree_source_parent`; `idx_part_occurrence_tree_path_occurrence`; `idx_part_occurrence_tree_path_node`; `idx_part_occurrence_tree_path_source`. |
| `part_diagram` | `idx_part_diagram_part`. |
Physical SQLite column, migration and index identifiers retain their historical names while migration `0021_fit_contract_aliases.sql` adds read-only Fit views. Fit terminology in headings does not rename storage.

| occurrence fit | `idx_applicability_snapshot_active`; `idx_applicability_serial_domain`; `idx_applicability_context_range`; `idx_occurrence_applicability_occurrence`; `idx_occurrence_applicability_context`; `idx_applicability_attribute_lookup`. |
| source-qualified fit descriptions and mappings (`0019`) | `idx_applicability_source_description_group`; `idx_applicability_mapping_dimension`. Unique source identities and revision pairs have SQLite-managed autoindexes. |
| source-to-occurrence description evidence (`0019`) | `idx_applicability_set_description_mapping` for immutable mapping-revision-to-condition-set lookups; domain-label tables have language-qualified primary keys. |
| Fit catalogue Admin audit (`0020`) | `idx_suitability_admin_audit_created`; normalized dimension/value retirement uses primary-key indexes. |

`0019` adds immutable source-qualified description text, language-qualified normalized labels, append-only mapping revisions and a current-revision view. Separately evidenced source-to-condition-set links keep occurrence contexts distinct and allow coexisting seat-equipment values without inferring a condition operator. Production migrations seed no synthetic fixture records.

`0020_suitability_admin.sql` adds separate category/value retirement tables and an immutable catalogue-Admin audit. Their additive structure preserves existing `0016` inserts. Normalized codes are stable while EN/FI labels may be renamed; description-to-value interpretation changes append mapping revisions. A retired category/value is excluded from newly published fit without deleting historical source or occurrence evidence.


Principal canonical lookup is `WHERE part_number_normalized = ?`, then relationships by PART/occurrence ID.

Reverse range/supersession/diagram/donor queries use the reverse indexes.

Stock filters have independent indexes; combined predicates and sorts require query-plan measurement with representative inventory before adding composite indexes.

Search may combine normalized/raw/description matching; description lookup must not make descriptions unique merely to improve query performance.

## Representative model fixtures

Synthetic fixtures may demonstrate canonical relationships such as multiple occurrences, unidentified images, model/VIN links, positive/excluded/unavailable fitment, mapped/unmapped hotspots, verified/unavailable locations, supersession chains, many-to-one replacement, multiple stock records, donor identity and unresolved stock.

Occurrence-fit fixtures may exercise grouped model/item/effective serial evidence, alternative attribute sets, repeated source paths, market conditions below shared models, source-version replacement and retained evidence history. Catalogue-tree fixtures may exercise source-qualified node identity, ordered parentage, multiple occurrence paths, language-specific structural divergence and idempotent source identities.

Fixtures are examples of the model contract, not verified Jaguar/JEPC facts. Synthetic vehicle zones, VINs, fit assertions or other test data must not be presented as verified domain evidence.
