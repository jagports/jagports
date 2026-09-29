# VIEPS PARTS Model

## Purpose

This document is the global canonical specification for reusable PART identity and PART relationships across imported Jaguar/JEPC PARTs, Jagports specified PARTs and verified third-party/vendor references. Detailed search/FIT evaluation behavior is owned by [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md); mutable operational stock remains owned by [`MODEL_STOCK.md`](MODEL_STOCK.md).

This document defines canonical catalogue `PART` identity and the catalogue-side relationships needed by VIEPS part search, part detail, EPC context, fit, diagrams, hotspots, supersession and operational stock linkage.

Operational stock semantics are defined separately in [`MODEL_STOCK.md`](MODEL_STOCK.md).

Occurrence-bound grouped fit and versioned source-evidence semantics are defined in [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md).

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

Occurrence-bound model context, alternative condition sets and versioned evidence complement the PART-level model/VIN links. The companion [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md#persistence-contract) defines these relations and their verification limits; PART-level fitment rows are not automatically promoted into grouped occurrence evidence.

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

`superseded_part_id → superseding_part_id` preserves both superseded and replacement identities.

One replacement may supersede multiple superseded parts and chains such as `A → B → C` are representable.

Supersession is not a generic interchangeability assertion.

A superseded PART remains a canonical PART and remains separately addressable from the PART that supersedes it. Historical and current part identities remain separately addressable.

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

Before a verified kit-content link can be published, its additive representation must record: kit part occurrence or part identity; component occurrence or part identity where available; diagram and exact image checksum; dashed-enclosure/callout observation; source hotspot or item mapping; detector/OCR and coordinate-conversion versions; provenance; verification status; and a reason for unsupported or conflicting cases. A kit-only component with no independent PN/hotspot is represented as source evidence without a fabricated canonical PART or standalone availability. Repeated item numbers and multiple rectangles remain separate observations until their component mapping is verified.

The model must distinguish `candidate`, `verified`, `unsupported` and `conflicting` evidence. It must not infer a kit PN from a dashed line, infer all enclosed components as kit contents, or collapse this catalogue evidence into operational stock or a manufacturing bill of materials.

## Catalogue vehicle location

`part_vehicle_location` represents a catalogue-side vehicle-location mapping scoped to a PART occurrence and, where applicable, a `model_range`.

`mapping_state` is explicitly `verified` or `unavailable`.

A verified mapping requires a location reference.

An unavailable mapping records that no verified mapping is available and must not fabricate a zone or coordinate.

Physical stock/storage location is not stored in this entity; it remains part of the operational stock model.

## PART to operational stock

`stock_item` is an operational record and is not a catalogue PART identity.

Physical D1 placement and database topology are defined in [`MODEL_D1_jagports.md`](MODEL_D1_jagports.md). SQLite/D1 cannot enforce a foreign key across separate D1 databases.

A resolved stock-to-catalogue relationship therefore uses the logical catalogue reference:

```text
(catalogue_range, part_id)
```

`part_id` identifies the canonical PART within the resolved catalogue scope. `catalogue_range` is the stable configured Range slug used to route imported catalogue reads to `parts-<range_slug>`; it is a routing scope, not a FIT assertion.

Rules:

- imported JEPC PART: `catalogue_range` and `part_id` are both present; the pair is a logical cross-D1 reference and is **not** a SQL foreign key;
- catalogue fixture PART physically stored in `jagports`: `catalogue_range = NULL` and `part_id` may use a same-database foreign key;
- unresolved reusable identity: `catalogue_range = NULL` and `part_id = NULL`;
- `catalogue_range` must not be present when `part_id` is NULL.

`stock_item.part_id = NULL` does **not** mean merely "not found in Jaguar/JEPC". It is reserved for stock whose reusable product identity is genuinely unresolved. A known reusable third-party product must first resolve to either an existing Jaguar PART (verified 1:1 case) or a Jagports specified PART (non-1:1 reusable case).

The existing `stock_item.part_number` field is retained as the stocked or superseded part-number reference. It is supporting stock evidence, not the canonical relational identity.

Operational STOCK cardinality, donor-vehicle linkage, unresolved-stock handling, storage/location semantics and stock-process boundaries are defined in [`MODEL_STOCK.md`](MODEL_STOCK.md). `MODEL_PARTS.md` defines only the catalogue-side identity that STOCK may reference.

## Architectural boundary

`PART` contains catalogue/reference identity only.

It has no direct vehicle FIT field and no mutable stock state.

`PART_IMAGE` is evidence associated with that stable identity.

FIT belongs to occurrence/FIT/context relationships.

Diagram/hotspot/location evidence belongs to explicit relationships.

Operational inventory belongs to separate stock records.

Catalogue vehicle location and physical stock/storage location are distinct concepts.

The physical D1 boundary, Search Index placement and database-topology ASCII model are canonical in [`MODEL_D1_jagports.md`](MODEL_D1_jagports.md).

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

The occurrence-fit persistence dictionary is maintained in [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md#persistence-contract) rather than duplicated here.

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
| `stock_item` | `id`; `part_number`; `quantity`; `condition`; `status`; `location`; `donor_vehicle`; `source_ref`; `notes`; `created_at`; `updated_at`; `catalogue_range`; `part_id`; `donor_vehicle_id`; `source`; `verification_status`; `confidence`; `available`. `(catalogue_range, part_id)` is the logical reference to an imported PART; a local fixture PART in `jagports` may use `catalogue_range = NULL` with a same-database FK. Full stock model fields and controlled condition code semantics are defined in `MODEL_STOCK.md`. |

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
| PART / donor vehicle → stock | Each stock has 0..1 logical canonical-PART reference and 0..1 donor. Imported PART references use `(catalogue_range, part_id)` across D1 and are resolved by application/provider code; only same-database fixture PARTs may use a physical FK. `part_id = NULL` is reserved for genuinely unresolved reusable identity. Catalogue deletion or unavailability must not delete STOCK; the reference becomes unresolved/unavailable until reconciled. Supersession never mutates stock. |
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
| `stock_item` | `idx_stock_item_part_number`; `idx_stock_item_status`; `idx_stock_item_location`; `idx_stock_item_part_id`; `idx_stock_item_available`; `idx_stock_item_donor_vehicle`; `idx_stock_item_source`. A composite lookup index over (`catalogue_range`, `part_id`) is required when the logical catalogue-reference fields are implemented; this specification does not assign its schema-object name. |
| `vehicle`, `vehicle_identifier` | `idx_vehicle_vin_raw`; `idx_vehicle_serial`; `idx_vehicle_identifier_normalized`. |
| `part_tree_node`, `part_tree_part`, `part_occurrence_tree_path` | `idx_part_tree_parent`; `idx_part_tree_part_part`; `idx_part_tree_source_node_identity`; `idx_part_tree_source_parent`; `idx_part_occurrence_tree_path_occurrence`; `idx_part_occurrence_tree_path_node`; `idx_part_occurrence_tree_path_source`. |
| `part_diagram` | `idx_part_diagram_part`. |

| occurrence fit | `idx_applicability_snapshot_active`; `idx_applicability_serial_domain`; `idx_applicability_context_range`; `idx_occurrence_applicability_occurrence`; `idx_occurrence_applicability_context`; `idx_applicability_attribute_lookup`. |
| source-qualified fit descriptions and mappings | `idx_applicability_source_description_group`; `idx_applicability_mapping_dimension`. Unique source identities and revision pairs have SQLite-managed autoindexes. |
| source-to-occurrence description evidence | `idx_applicability_set_description_mapping` for immutable mapping-revision-to-condition-set lookups; domain-label tables have language-qualified primary keys. |
| Fit catalogue Admin audit | `idx_suitability_admin_audit_created`; normalized dimension/value retirement uses primary-key indexes. |

Source-qualified descriptions, localized labels and mapping revisions remain separate evidence layers. Separately evidenced source-to-condition-set links keep occurrence contexts distinct and allow coexisting equipment values without inferring a condition operator. Synthetic fixture records are never production source evidence.

Normalized category/value retirement and Admin audit data preserve stable codes and append interpretation revisions. Retiring a category/value excludes it from newly published FIT without deleting retained source or occurrence evidence.


Principal canonical lookup is `WHERE part_number_normalized = ?`, then relationships by PART/occurrence ID.

Reverse range/supersession/diagram/donor queries use the reverse indexes.

Stock filters have independent indexes; combined predicates and sorts require query-plan measurement with representative inventory before adding composite indexes.

Search may combine normalized/raw/description matching; description lookup must not make descriptions unique merely to improve query performance.

## Representative model fixtures

Synthetic fixtures may demonstrate canonical relationships such as multiple occurrences, unidentified images, model/VIN links, positive/excluded/unavailable fitment, mapped/unmapped hotspots, verified/unavailable locations, supersession chains, many-to-one replacement, multiple stock records, donor identity and unresolved stock.

Occurrence-fit fixtures may exercise grouped model/item/effective serial evidence, alternative attribute sets, repeated source paths, market conditions below shared models, source-version replacement and retained prior-version evidence. Catalogue-tree fixtures may exercise source-qualified node identity, ordered parentage, multiple occurrence paths, language-specific structural divergence and idempotent source identities.

Fixtures are examples of the model contract, not verified Jaguar/JEPC facts. Synthetic vehicle zones, VINs, fit assertions or other test data must not be presented as verified domain evidence.


## Third-party and Jagports specified PARTs

A reusable product uses the same canonical `part(id)` namespace whether it originates from Jaguar/JEPC or is a Jagports specified PART. Vendor-product references remain evidence about that reusable identity; they do not create a second canonical PART namespace.

### Product cases

VIEPS distinguishes two common third-party cases.

#### Third-party product that is 1:1 equal to a Jaguar PART

A vendor may sell a product under its own part number even though it is a verified 1:1 match for an existing Jaguar PART.

In this case:

- the existing Jaguar PART remains the canonical PART;
- the vendor's part number is stored as a third-party/vendor reference to that Jaguar PART;
- a second canonical PART is not created merely because the vendor uses a different number;
- equality must be verified before the vendor product is presented as 1:1 equal to the Jaguar PART;
- STOCK for that product may reference the existing Jaguar PART while retaining the vendor part number/reference.

#### Third-party product with no 1:1 Jaguar PART

A vendor may supply a product that Jaguar does not list as the same standalone PART. Examples include an NSS component supplied separately or a vendor kit that contains more than the Jaguar PART to which it is related.

In this case VIEPS creates a **Jagports specified PART**.

A Jagports specified PART:

- is a canonical reusable PART record added by Jagports;
- is not a Jaguar-issued PART;
- must have a mandatory existing Jaguar PART as its parent reference;
- must retain the catalogue category/item/occurrence/PART reference used to identify that parent;
- must not be described as a Jagports product: the actual product is supplied by the recorded third party/vendor.

### Part-number rule for Jagports specified PARTs

A Jagports specified PART must be anchored to its mandatory Jaguar parent PART.

Its part number is formed as:

```text
<JaguarPN>+<3rdPartyPN>
```

where:

- `<JaguarPN>` is the mandatory parent Jaguar PART number;
- `<3rdPartyPN>` is the vendor's part number for the non-1:1 product;
- the combined number is a Jagports specified identifier and must never be presented as Jaguar-issued.

For a 1:1 third-party match, do not construct a combined Jagports specified number merely to preserve the vendor number. Store the vendor number as the vendor reference to the existing Jaguar PART.

Existing PART normalization rules apply to lookup values while the entered/displayed part number remains preserved according to the canonical PART model.

### Parent Jaguar PART reference

Every Jagports specified PART must have one mandatory Jaguar parent PART.

The operator may identify the parent by:

- selecting an existing Jaguar/JEPC PART directly; or
- browsing the imported PART tree/category/item structure and selecting the Jaguar PART from that context.

The saved reference must identify the known catalogue context, including:

- category;
- item;
- occurrence;
- Jaguar PART.

These references make the relationship auditable and allow VIEPS to use the same Jaguar fit context rather than inventing separate fitment rules for the third-party product.

### PART relationship semantics

The model distinguishes these relationships:

| Relationship | Meaning |
|---|---|
| `parent_part` | Mandatory Jaguar PART to which a non-1:1 Jagports specified PART is anchored. |
| `component_of` | The Jagports specified PART is physically a component of another PART or assembly where this is known. |
| `equivalent_to` | A vendor product or independently identified PART is verified as 1:1 interchangeable with a Jaguar PART for the referenced context. |

Jaguar supersession remains governed by `part_supersession` in `MODEL_PARTS.md`.

`parent_part`, `component_of`, `equivalent_to`, and supersession are different facts and must not be presented as one another.

### NSS / not-serviced-separately products

An NSS component may be visible in JEPC even though Jaguar does not provide it as its own Jaguar PART.

When a third-party vendor supplies that component as a reusable product, VIEPS may create a Jagports specified PART for it.

The Jagports specified PART must use the relevant existing Jaguar PART as its mandatory parent and must retain the known category/item/occurrence/PART reference.

Creating the Jagports specified PART does not modify the imported JEPC record and does not create a Jaguar part number.

### Third-party vendor entities

#### `third_party_vendor`

Minimum vendor data:

| Field | Requirement |
|---|---|
| `vendor_id` | Required identifier of the vendor. |
| `name` | Required vendor name. |
| home URL(s) | At least one vendor home URL may be stored. Multiple URLs are supported. |
| home URL description | Required for each URL when more than one home URL is stored, so the URLs can be distinguished. |

A normalized implementation may store the URLs in a child relation such as `third_party_vendor_home_url(vendor_id, home_url, description)`.

#### `third_party_part`

Represents the vendor's own product reference.

Minimum fields:

- `third_party_part_id` — identifier of this vendor-product reference record;
- `vendor_id` — identifies the vendor;
- canonical `part_id` — required FK to the VIEPS canonical reusable PART identity; it points to the existing Jaguar PART for a verified 1:1 vendor product, or to the Jagports specified PART for a non-1:1 reusable vendor product;
- vendor part number;
- `manufacturer` — manufacturer/brand of the vendor product, kept distinct from the vendor/seller;
- `description` — vendor-product description;
- one or more product/source URLs where available;
- `verification_status`;
- `verification_date`.

`verification_status` is a select field with these values:

- `unverified` — the vendor reference or its PART relationship has been entered but has not yet been checked;
- `verified` — the vendor reference and its claimed relationship to the Jaguar/Jagports specified PART have been checked against available evidence.

`verification_date` is a date-select field and defaults to the current day when the record is entered or verified. It records when the evidence/mapping was checked.

A third-party product that is verified 1:1 equal to a Jaguar PART links directly to that Jaguar canonical `part_id`.

A third-party product with no 1:1 Jaguar PART links to the Jagports specified canonical `part_id` created for it.

`third_party_part.part_id` is therefore never the vendor-product reference identity itself. It is the canonical VIEPS PART identity that the vendor reference describes. A vendor part number must not be copied into `stock_item.part_id`, and a new canonical PART must not be created for a verified 1:1 vendor reference.

### Third-party cross-references

`third_party_part` identifies the vendor product and the canonical PART used by VIEPS to represent that reusable product.

`third_party_part_xref` records the explicit Jaguar reference relationship behind that vendor product. It does not replace `third_party_part.part_id` and it is not operational STOCK.

#### `third_party_part_xref`

Minimum fields:

| Field | Requirement | Meaning |
|---|---|---|
| `third_party_part_xref_id` | required, unique | Stable identifier of the cross-reference record. |
| `third_party_part_id` | required FK | Vendor-product reference being related. |
| `jaguar_part_id` | required FK | Existing Jaguar/JEPC canonical PART used as the Jaguar reference. |
| `relationship_type` | required controlled value | `equivalent_to`, `parent_part`, or `component_of`. |
| `part_occurrence_id` | nullable FK | Exact imported occurrence/context when known. |
| `part_occurrence_tree_path_id` | nullable FK | Exact source-qualified catalogue tree path selected for the occurrence when available; references the canonical occurrence-tree persistence from `MODEL_PARTS.md`. |
| `category_ref` | nullable except as required below | Retained catalogue category reference for auditable parent/context selection. |
| `item_number` | nullable except as required below | Retained catalogue item reference for auditable parent/context selection. |
| `source_ref` | nullable | Evidence supporting this particular relationship. |
| `verification_status` | required | `unverified` or `verified`. |
| `verification_date` | nullable | Date on which this relationship was checked. |

Cardinality and behavior:

- one `third_party_part` may have many cross-reference records;
- one Jaguar PART may be referenced by many third-party products;
- a verified 1:1 vendor product has one or more `equivalent_to` records and may point directly to that Jaguar PART through `third_party_part.part_id`;
- a non-1:1 Jagports specified PART must have exactly one `parent_part` cross-reference used to anchor the required `<JaguarPN>+<3rdPartyPN>` identity;
- a product may additionally have `component_of` references where independently evidenced;
- `parent_part`, `component_of`, `equivalent_to`, and Jaguar supersession remain different relationship types.

For the mandatory `parent_part` record of a Jagports specified PART, the selected Jaguar PART and known catalogue context must be retained. When the imported occurrence exists, `part_occurrence_id` is required and the category/item values must identify that same selected context. When the operator selected the parent through a specific imported source tree path and canonical `part_occurrence_tree_path` evidence exists, `part_occurrence_tree_path_id` must retain that exact path. One occurrence may have several source paths, so occurrence identity alone must not be used to claim which catalogue path the operator selected. If an imported occurrence/tree path is unavailable, explicit synthetic/manual category/item context may be retained, but it must not be presented as imported JEPC evidence.

Logical uniqueness rules:

- `third_party_part_xref_id` is globally unique;
- the same logical tuple `(third_party_part_id, jaguar_part_id, relationship_type, part_occurrence_id/category/item context)` must not be duplicated;
- each non-1:1 `third_party_part` has at most one `parent_part` relationship;
- duplicate `equivalent_to` or `component_of` rows for the same evidenced context are invalid.

A generic `fits` relation is not part of this model and must not replace explicit relationship semantics.

### Identity, uniqueness and nullability

These rules are part of the implementation contract and must be enforced either by database constraints or deterministic application validation.

| Entity / field | Required / nullable | Uniqueness / validation |
|---|---|---|
| `third_party_vendor.vendor_id` | required | globally unique stable vendor identity. |
| `third_party_vendor.name` | required, nonblank | not assumed globally unique; different vendor identities may have similar names. |
| vendor home URL | at least one may be stored; additional URLs optional | exact duplicate URL rows for one vendor are invalid. |
| home URL description | nullable for a single URL; required/nonblank when one vendor has multiple home URLs | descriptive text is not an identity. |
| `third_party_part.third_party_part_id` | required | globally unique stable vendor-product reference identity. |
| `third_party_part.vendor_id` | required FK | many products may belong to one vendor. |
| vendor part number | required, nonblank | unique within one vendor after the defined deterministic normalization; the same text may exist under another vendor. |
| `manufacturer` | required, nonblank | manufacturer/brand of the vendor product; distinct from the vendor/seller identity and not assumed globally unique. |
| `description` | required, nonblank | human-readable vendor-product description; not identity. |
| `third_party_part.part_id` | required FK for a reusable represented product | points to the existing Jaguar PART for verified 1:1 products or to the Jagports specified PART for non-1:1 products. |
| product/source URL(s) | zero or more | evidence, not identity; several URLs may be retained for one vendor product. Exact duplicate URL rows for one vendor product are invalid. |
| `verification_status` | required | only `unverified` or `verified`. |
| `verification_date` | nullable while unverified; required when status is `verified` | one date value for the current verification claim. |
| `third_party_part_xref.third_party_part_xref_id` | required | globally unique. |
| `third_party_part_xref.third_party_part_id` | required FK | many xrefs per vendor product allowed. |
| `third_party_part_xref.jaguar_part_id` | required FK | many third-party products may reference one Jaguar PART. |
| `relationship_type` | required | only `equivalent_to`, `parent_part`, `component_of`. |
| xref occurrence/tree-path/category/item context | nullable generally; required as described for the mandatory parent context | cannot contradict the selected Jaguar PART/occurrence; when a source-qualified tree path is selected, the stored path must belong to that occurrence. |
| vendor price snapshot amount | required when a snapshot exists | non-negative numeric value. |
| vendor price snapshot currency | required when a snapshot exists | three-character uppercase currency code. |
| observed/check date | required when a snapshot exists | records evidence date, not price validity forever. |
| price source URL | nullable | evidence, not identity. |

A canonical PART remains unique according to `MODEL_PARTS.md`; these third-party records do not weaken PART-number uniqueness or create a second canonical identity namespace.

### Representative deterministic fixtures

At minimum, executable or specification-level fixtures must cover these two paths.

#### Fixture A — verified 1:1 vendor product

Use a fixture Jaguar PART `JLM21917-Fixture` and at least two vendor-product records that both resolve to that same canonical Jaguar PART.

Representative fixture values include:

- Jaguar PART: `JLM21917-Fixture`;
- vendor: `Nimark-fixture`;
- vendor PN: `2312601-fixture`;
- manufacturer: a separate nonblank manufacturer fixture value, for example `ManufacturerA-fixture`;
- description: `Nimark-Korjaussarja, jarrusatula (Etuakseli)-Fixture`;
- product URL: `https://www.nimark.fi/buy/autofrenseinsa_d41792c/`;
- a second vendor-product fixture for the same `JLM21917-Fixture`, for example vendor `Motonet-fixture`, with its own vendor PN, manufacturer, description and URL;
- second description: `Motonet-Jarrusatulan korjaussarja-Fixture`;
- second product URL: `https://www.motonet.fi/tuote/jarrusatulan-korjaussarja-23-00843?product=23-00843`;
- each `third_party_part.part_id` points to canonical `JLM21917-Fixture`;
- each verified `third_party_part_xref` uses `relationship_type = equivalent_to` and points to `JLM21917-Fixture`;
- no Jagports specified PART is created for either verified 1:1 product;
- operational STOCK may point to `JLM21917-Fixture` while vendor-product evidence remains separate.

Expected results:

- both vendor PNs may resolve to the same existing Jaguar PART while preserving their different vendor and manufacturer identities;
- multiple source/product URLs may be retained without collapsing vendor-product identity;
- no duplicate canonical PART is created merely because vendor, manufacturer, description or URL differs;
- STOCK identity remains operational and separate from the vendor/xref evidence.

#### Fixture B — non-1:1 Jagports specified PARTs

Use two vendor-product fixtures against the same Jaguar parent so numbering, vendor separation and canonical PART creation are deterministic.

Common Jaguar context:

- existing Jaguar parent PART: `MJD7843AA-Fixture`;
- each vendor product has exactly one `parent_part` xref to `MJD7843AA-Fixture`;
- each parent xref retains the selected category/item/occurrence context plus the exact `part_occurrence_tree_path` when such imported path evidence is available;
- separately evidenced `component_of` references may include `JLM20079-Fixture`, `JLM21466-Fixture`, `JLM20078-Fixture`, and `JLM21465-Fixture`;
- the reference image/source may retain `https://parts.jaguarlandroverclassic.com/jlm20079-brake-caliper.html` as evidence for the NSS + item-7 context.

Fixture B1:

- vendor: `Nimark-fixture`;
- vendor PN: `D41792C-fixture`;
- manufacturer: a separate nonblank manufacturer fixture value;
- description: `Nimark-Korjaussarja, jarrusatula (Etuakseli)-Fixture`;
- product URL: `https://www.nimark.fi/buy/autofrenseinsa_d41792c/`;
- new canonical Jagports specified PART: `MJD7843AA+D41792C-fixture`;
- `source_origin = AddedManually`;
- `third_party_part.part_id` points to `MJD7843AA+D41792C-fixture`.

Fixture B2:

- vendor: `Motonet-fixture`;
- vendor PN: `23-00843-fixture`;
- manufacturer: a separate nonblank manufacturer fixture value;
- description: `Motonet-Jarrusatulan korjaussarja-Fixture`;
- product URL: `https://www.motonet.fi/tuote/jarrusatulan-korjaussarja-23-00843?product=23-00843`;
- new canonical Jagports specified PART: `MJD7843AA+23-00843-fixture`;
- `source_origin = AddedManually`;
- `third_party_part.part_id` points to `MJD7843AA+23-00843-fixture`.

For both B1 and B2, operational STOCK points to the corresponding Jagports specified PART, not to `MJD7843AA-Fixture` or any `component_of` reference.

Expected results:

- the requested combined identifiers are visibly Jagports specified and never shown as Jaguar-issued;
- the two vendor products remain separate even though they share the same Jaguar parent/context;
- fit follows the selected Jaguar parent/context;
- deleting or changing operational STOCK does not alter the PART/xref evidence;
- unresolved STOCK is not used once either reusable identity has been established.

Fixtures must also include invalid cases for duplicate logical xrefs, a second `parent_part` for the same non-1:1 vendor product, missing mandatory parent context, missing manufacturer, missing description, invalid relationship type, verified status without verification date, duplicate vendor PN within one vendor, and duplicate product URL rows for one vendor product.

### Vendor pricing evidence

Vendor price information is external evidence and is not the Jagports operational STOCK sale price.

A price snapshot should retain:

- vendor ID;
- vendor product reference;
- amount;
- currency;
- observed/check date;
- source/product URL;
- verification status where used.

Price snapshots must not modify canonical PART identity.

### Fit

A third-party product does not define a separate vehicle-fit system.

Its fit is the same as the Jaguar PART/context to which it is referenced.

For a Jagports specified PART:

- its mandatory parent is the Jaguar PART whose fit it follows;
- the known category/item/occurrence/PART reference is retained;
- VIEPS uses the same fit as that referenced Jaguar PART/context;
- no independent third-party fit conditions are created or edited here.

For a verified 1:1 third-party product, fit is the fit of the existing Jaguar PART to which the vendor reference is attached.

The meaning and evaluation of Jaguar FIT remain defined by [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md).

### X100 brake-caliper cylinder example

The X100/XK8 front-brake example shows the non-1:1 case.

JEPC shows item 7, a brake caliper seal kit, while the illustration also shows an NSS cylinder/piston component. A third-party vendor can supply a product containing the cylinder/piston together with seals.

That vendor product is not treated as a new Jaguar PART and is not assumed to be 1:1 equal to the Jaguar seal kit because it contains additional content.

VIEPS therefore:

1. selects the relevant Jaguar seal-kit PART from the appropriate imported category/item/occurrence;
2. records that Jaguar PART as the mandatory parent;
3. records the vendor's own part number;
4. creates a Jagports specified PART number as `<JaguarSealKitPN>+<3rdPartyPN>`;
5. uses the same FIT as the referenced Jaguar PART/context;
6. links STOCK to the Jagports specified PART.

If a vendor instead sells a verified 1:1 equivalent of the Jaguar seal kit, its vendor part number is attached directly to the Jaguar PART and no Jagports specified PART is required.

### Optional visual-location evidence

Optional point/region references on imported JEPC illustrations and uploaded location/reference images are PART-side evidence associated with the relevant canonical PART/occurrence and source context. They must retain provenance and verification state, remain distinct from physical STOCK location, and do not change FIT or STOCK state.

### Canonical `part_id` contract

For all third-party relationships:

- `part.id` is the canonical reusable PART identity within its catalogue scope;
- `third_party_part.part_id` points to that canonical identity inside the catalogue domain;
- resolved operational STOCK records the same canonical identity through `stock_item.part_id` plus `stock_item.catalogue_range` when the PART resides in a `parts-<range_slug>` database;
- vendor product identity remains in `third_party_part` and its vendor part number/reference fields;
- a verified 1:1 vendor product reuses the existing Jaguar `part_id`;
- a non-1:1 reusable vendor product uses the Jagports specified `part_id`;
- `stock_item.part_id = NULL` is not an alternative representation for a known reusable third-party product;
- a cross-D1 stock relationship is logical and must not be represented as a SQLite foreign key.

```text
vendor product reference (third_party_part)
             |
             v
canonical reusable PART
(catalogue scope, part.id)
             |
             v
logical STOCK reference
(catalogue_range, stock_item.part_id)
```

The relationship direction does not imply that a vendor product is Jaguar-issued. Origin/provenance remains authoritative for that distinction.
