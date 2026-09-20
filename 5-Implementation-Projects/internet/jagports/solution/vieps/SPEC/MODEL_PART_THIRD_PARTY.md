# VIEPS Third-Party PART Model

## Purpose

This document defines how VIEPS represents third-party/vendor products and Jagports specified PARTs that are related to existing Jaguar/JEPC PARTs.

It complements:

- [`MODEL_PART.md`](MODEL_PART.md) — canonical PART identity and catalogue relationships;
- [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md) — applicability of Jaguar/JEPC PARTs and occurrences;
- [`MODEL_STOCK.md`](MODEL_STOCK.md) — mutable operational stock;
- [`MODEL_PART_THIRD_PARTY_LOCATION.md`](MODEL_PART_THIRD_PARTY_LOCATION.md) — optional visual-location evidence for third-party PARTs.

A reusable product has one canonical `PART` identity in the PART database. That identity may be an imported Jaguar/JEPC PART or a manually added Jagports specified PART. Both use the same canonical `part(id)` namespace. Vendor references and operational STOCK remain separate records.

## Product cases

VIEPS distinguishes two common third-party cases.

### Third-party product that is 1:1 equal to a Jaguar PART

A vendor may sell a product under its own part number even though it is a verified 1:1 match for an existing Jaguar PART.

In this case:

- the existing Jaguar PART remains the canonical PART;
- the vendor's part number is stored as a third-party/vendor reference to that Jaguar PART;
- a second canonical PART is not created merely because the vendor uses a different number;
- equality must be verified before the vendor product is presented as 1:1 equal to the Jaguar PART;
- STOCK for that product may reference the existing Jaguar PART while retaining the vendor part number/reference.

### Third-party product with no 1:1 Jaguar PART

A vendor may supply a product that Jaguar does not list as the same standalone PART. Examples include an NSS component supplied separately or a vendor kit that contains more than the Jaguar PART to which it is related.

In this case VIEPS creates a **Jagports specified PART**.

A Jagports specified PART:

- is a canonical reusable PART record added by Jagports;
- is not a Jaguar-issued PART;
- must have a mandatory existing Jaguar PART as its parent reference;
- must retain the catalogue category/item/occurrence/PART reference used to identify that parent;
- must not be described as a Jagports product: the actual product is supplied by the recorded third party/vendor.

## Part-number rule for Jagports specified PARTs

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

## Parent Jaguar PART reference

Every Jagports specified PART must have one mandatory Jaguar parent PART.

The operator may identify the parent by:

- selecting an existing Jaguar/JEPC PART directly; or
- browsing the imported PART tree/category/item structure and selecting the Jaguar PART from that context.

The saved reference must identify the known catalogue context, including:

- category;
- item;
- occurrence;
- Jaguar PART.

These references make the relationship auditable and allow VIEPS to use the same Jaguar applicability context rather than inventing separate fitment rules for the third-party product.

## PART relationship semantics

The model distinguishes these relationships:

| Relationship | Meaning |
|---|---|
| `parent_part` | Mandatory Jaguar PART to which a non-1:1 Jagports specified PART is anchored. |
| `component_of` | The Jagports specified PART is physically a component of another PART or assembly where this is known. |
| `equivalent_to` | A vendor product or independently identified PART is verified as 1:1 interchangeable with a Jaguar PART for the referenced context. |

Jaguar supersession remains governed by `part_supersession` in `MODEL_PART.md`.

`parent_part`, `component_of`, `equivalent_to`, and supersession are different facts and must not be presented as one another.

## NSS / not-serviced-separately products

An NSS component may be visible in JEPC even though Jaguar does not provide it as its own Jaguar PART.

When a third-party vendor supplies that component as a reusable product, VIEPS may create a Jagports specified PART for it.

The Jagports specified PART must use the relevant existing Jaguar PART as its mandatory parent and must retain the known category/item/occurrence/PART reference.

Creating the Jagports specified PART does not modify the imported JEPC record and does not create a Jaguar part number.

## Third-party vendor entities

### `third_party_vendor`

Minimum vendor data:

| Field | Requirement |
|---|---|
| `vendor_id` | Required identifier of the vendor. |
| `name` | Required vendor name. |
| home URL(s) | At least one vendor home URL may be stored. Multiple URLs are supported. |
| home URL description | Required for each URL when more than one home URL is stored, so the URLs can be distinguished. |

A normalized implementation may store the URLs in a child relation such as `third_party_vendor_home_url(vendor_id, home_url, description)`.

### `third_party_part`

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

## Third-party cross-references

`third_party_part` identifies the vendor product and the canonical PART used by VIEPS to represent that reusable product.

`third_party_part_xref` records the explicit Jaguar reference relationship behind that vendor product. It does not replace `third_party_part.part_id` and it is not operational STOCK.

### `third_party_part_xref`

Minimum fields:

| Field | Requirement | Meaning |
|---|---|---|
| `third_party_part_xref_id` | required, unique | Stable identifier of the cross-reference record. |
| `third_party_part_id` | required FK | Vendor-product reference being related. |
| `jaguar_part_id` | required FK | Existing Jaguar/JEPC canonical PART used as the Jaguar reference. |
| `relationship_type` | required controlled value | `equivalent_to`, `parent_part`, or `component_of`. |
| `part_occurrence_id` | nullable FK | Exact imported occurrence/context when known. |
| `part_occurrence_tree_path_id` | nullable FK | Exact source-qualified catalogue tree path selected for the occurrence when available; references the canonical occurrence-tree persistence from `MODEL_PART.md`. |
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

For the mandatory `parent_part` record of a Jagports specified PART, the selected Jaguar PART and known catalogue context must be retained. When the imported occurrence exists, `part_occurrence_id` is required and the category/item values must identify that same selected context. When the operator selected the parent through a specific imported source tree path and canonical `part_occurrence_tree_path` evidence exists, `part_occurrence_tree_path_id` must retain that exact path. One occurrence may have several source paths, so occurrence identity alone must not be used to claim which catalogue path the operator selected. If an imported occurrence/tree path is not yet available in the active MVP fixture path, explicit fixture/manual category/item context may be retained, but it must not be presented as imported JEPC evidence.

Logical uniqueness rules:

- `third_party_part_xref_id` is globally unique;
- the same logical tuple `(third_party_part_id, jaguar_part_id, relationship_type, part_occurrence_id/category/item context)` must not be duplicated;
- each non-1:1 `third_party_part` has at most one `parent_part` relationship;
- duplicate `equivalent_to` or `component_of` rows for the same evidenced context are invalid.

A generic `fits` relation is not part of this model and must not replace explicit relationship semantics.

## Identity, uniqueness and nullability

These rules are part of the implementation contract and must be enforced either by database constraints or deterministic application validation.

| Entity / field | Required / nullable | Uniqueness / validation |
|---|---|---|
| `third_party_vendor.vendor_id` | required | globally unique stable vendor identity. |
| `third_party_vendor.name` | required, nonblank | not assumed globally unique; different vendor identities may have similar names. |
| vendor home URL | at least one may be stored; additional URLs optional | exact duplicate URL rows for one vendor are invalid. |
| home URL description | nullable for a single URL; required/nonblank when one vendor has multiple home URLs | descriptive text is not an identity. |
| `third_party_part.third_party_part_id` | required | globally unique stable vendor-product reference identity. |
| `third_party_part.vendor_id` | required FK | many products may belong to one vendor. |
| vendor part number | required, nonblank | unique within one vendor after the implementation's deterministic normalization; the same text may exist under another vendor. |
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

A canonical PART remains unique according to `MODEL_PART.md`; these third-party records do not weaken PART-number uniqueness or create a second canonical identity namespace.

## Representative deterministic fixtures

At minimum, executable or specification-level fixtures must cover these two paths.

### Fixture A — verified 1:1 vendor product

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

### Fixture B — non-1:1 Jagports specified PARTs

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
- applicability follows the selected Jaguar parent/context;
- deleting or changing operational STOCK does not alter the PART/xref evidence;
- unresolved STOCK is not used once either reusable identity has been established.

Fixtures must also include invalid cases for duplicate logical xrefs, a second `parent_part` for the same non-1:1 vendor product, missing mandatory parent context, missing manufacturer, missing description, invalid relationship type, verified status without verification date, duplicate vendor PN within one vendor, and duplicate product URL rows for one vendor product.

## MVP / Post-MVP boundary

### Required for the retained MVP Stock Admin path

The MVP must be able to:

- distinguish verified 1:1 vendor products from non-1:1 reusable third-party products;
- use an existing Jaguar PART directly for a verified 1:1 vendor product;
- create/select a Jagports specified canonical PART for a non-1:1 reusable product;
- require exactly one Jaguar parent and retain the selected category/item/occurrence/PART context plus the exact selected occurrence-tree path when available for that Jagports specified PART;
- form and present the Jagports specified identifier as `<JaguarPN>+<3rdPartyPN>`;
- retain vendor identity, vendor PN, manufacturer, description, one-or-more source/product URLs where evidenced, verification state and the required cross-reference evidence;
- link operational STOCK to the correct canonical PART without mixing vendor reference data into mutable STOCK;
- preserve an unresolved STOCK path only when a reusable canonical product identity is genuinely not established.

The MVP may use deterministic fixture/manual parent-context evidence where imported JEPC context is not yet available, provided that evidence is explicitly distinguished from imported source data.

### Post-MVP / later extension

The following are not required to close the current reduced MVP unless separately approved:

- full vendor-price-history UI and automated refresh;
- external vendor synchronization or provider polling;
- marketplace ordering, reservations, payment, fulfillment or seller workflows;
- advanced many-reference visualization beyond the required parent/equivalence/component distinctions;
- broad third-party free-text discovery across external catalogues;
- automated verification of vendor equivalence;
- optional visual-location evidence beyond the separately approved location specification.

The data model may preserve fields needed for these later capabilities without making those workflows MVP blockers.

## Vendor pricing evidence

Vendor price information is external evidence and is not the Jagports operational STOCK sale price.

A price snapshot should retain:

- vendor ID;
- vendor product reference;
- amount;
- currency;
- observed/check date;
- source/product URL;
- verification status where used.

Price history must not modify canonical PART identity.

## Suitability and applicability

A third-party product does not define a separate vehicle-applicability system.

Its suitability is the same as the Jaguar PART/context to which it is referenced.

For a Jagports specified PART:

- its mandatory parent is the Jaguar PART whose suitability it follows;
- the known category/item/occurrence/PART reference is retained;
- VIEPS uses the same applicability as that referenced Jaguar PART/context;
- no independent third-party applicability conditions are created or edited here.

For a verified 1:1 third-party product, suitability is the suitability of the existing Jaguar PART to which the vendor reference is attached.

The meaning and evaluation of Jaguar applicability remain defined by `MODEL_PART_APPLICABILITY.md`.

## Stock Admin workflow

This specification covers reusable third-party products only.

### Existing Jaguar PART / 1:1 third-party product

The operator:

1. finds the existing Jaguar PART, either directly or through the PART tree;
2. records the vendor and vendor part number;
3. verifies the 1:1 relationship where claimed;
4. creates operational STOCK linked to the existing Jaguar PART.

### New Jagports specified PART / no 1:1 Jaguar PART

The operator:

1. selects the mandatory parent Jaguar PART directly or from the imported tree/category/item context;
2. records the required category/item/occurrence/PART references;
3. records the vendor and third-party part number;
4. creates the combined Jagports specified part number `<JaguarPN>+<3rdPartyPN>`;
5. enters the description;
6. records verification status and verification date;
7. creates operational STOCK linked to the new Jagports specified PART.

The operator must know the parent reference before the new Jagports specified PART is created. A missing parent Jaguar PART is a validation error for this path.

Unresolved stock handling belongs to `MODEL_STOCK.md` and is outside this third-party PART specification. Once a third-party product is known to be reusable, it is no longer an unresolved-stock identity case: it must resolve to an existing Jaguar `part_id` or to a newly created Jagports specified `part_id` before STOCK is linked.

## X100 brake-caliper cylinder example

The X100/XK8 front-brake example shows the non-1:1 case.

JEPC shows item 7, a brake caliper seal kit, while the illustration also shows an NSS cylinder/piston component. A third-party vendor can supply a product containing the cylinder/piston together with seals.

That vendor product is not treated as a new Jaguar PART and is not assumed to be 1:1 equal to the Jaguar seal kit because it contains additional content.

VIEPS therefore:

1. selects the relevant Jaguar seal-kit PART from the appropriate imported category/item/occurrence;
2. records that Jaguar PART as the mandatory parent;
3. records the vendor's own part number;
4. creates a Jagports specified PART number as `<JaguarSealKitPN>+<3rdPartyPN>`;
5. uses the same suitability/applicability as the referenced Jaguar PART/context;
6. links STOCK to the Jagports specified PART.

If a vendor instead sells a verified 1:1 equivalent of the Jaguar seal kit, its vendor part number is attached directly to the Jaguar PART and no Jagports specified PART is required.

## Catalogue-assisted parent selection

When creating or editing a Jagports specified PART, VIEPS should allow the operator to locate the mandatory Jaguar parent from the already imported catalogue.

Conceptually:

```text
model/sub-range
  -> category
     -> item
        -> occurrence
           -> Jaguar PART
```

The selector should show the imported context available for the selected reference, including:

- model/sub-range and breadcrumb;
- category and item;
- occurrence;
- Jaguar PART number and description;
- illustration/hotspot context where available;
- applicability information such as engine/aspiration, `Except ...` conditions, LH/RH, VIN/revision bounds, market/Region;
- source/provenance and verification information;
- other relevant catalogue/applicability fields that may become available from later imported data.

The category/item/occurrence/PART reference used for the parent must be stored with the Jagports specified PART.

## Optional visual-location evidence

Optional point/region references on imported JEPC illustrations and uploaded location/reference images are defined in:

[`MODEL_PART_THIRD_PARTY_LOCATION.md`](MODEL_PART_THIRD_PARTY_LOCATION.md)

This evidence is optional and does not change PART applicability or STOCK state.

## Canonical `part_id` contract

For all third-party workflows:

- `part.id` is the canonical reusable PART identity;
- `third_party_part.part_id` points to that canonical identity;
- `stock_item.part_id` points to the same canonical identity when stock is resolved;
- vendor product identity remains in `third_party_part` and its vendor part number/reference fields;
- a verified 1:1 vendor product reuses the existing Jaguar `part_id`;
- a non-1:1 reusable vendor product uses the Jagports specified `part_id`;
- `stock_item.part_id = NULL` is not an alternative representation for a known reusable third-party product.

```text
vendor product reference (third_party_part)
             |
             v
canonical reusable PART (part.id)
             |
             v
operational stock (stock_item.part_id)
```

The relationship direction does not imply that a vendor product is Jaguar-issued. Origin/provenance remains authoritative for that distinction.

## Search and presentation

Search may resolve:

- Jaguar part numbers;
- Jagports specified part numbers;
- vendor/third-party part numbers;
- supported product descriptions.

Presentation must clearly identify whether a displayed number is:

- Jaguar;
- Jagports specified; or
- a vendor's own part number.

A vendor number that is verified 1:1 equal to a Jaguar PART may resolve to that Jaguar PART while still showing the vendor identity and vendor part number.

Parent, component, equivalence and supersession relationships must remain visibly distinct.

## Implementation boundary

This document defines the third-party PART domain requirements. It does not redefine:

- Jaguar PART applicability;
- JEPC importing;
- operational STOCK fields;
- optional visual-location evidence.

Implementation must preserve:

- one canonical PART identity for each reusable product represented as its own PART;
- direct vendor-reference mapping to an existing Jaguar PART for verified 1:1 products;
- mandatory Jaguar parent reference for each non-1:1 Jagports specified PART;
- required category/item/occurrence/PART reference for the selected parent, plus exact source-qualified occurrence-tree path evidence when the parent is selected through such a path;
- combined `<JaguarPN>+<3rdPartyPN>` numbering for non-1:1 Jagports specified PARTs;
- third-party vendor identity and URLs;
- vendor-product manufacturer, description and multiple source/product URLs;
- verification status and verification date;
- suitability identical to the referenced Jaguar PART/context;
- vendor evidence separate from mutable STOCK.

## Acceptance criteria

- The specification uses the term **Jagports specified**, not Jagports-owned, for manually defined non-Jaguar PART records.
- A verified 1:1 third-party product with its own vendor part number can reference the existing Jaguar `part_id` without creating a duplicate canonical PART.
- A non-1:1 third-party product is represented by a Jagports specified PART with its own canonical `part_id` and a mandatory Jaguar parent.
- The parent category/item/occurrence/PART reference is known and retained, and an exact selected `part_occurrence_tree_path` is retained when available.
- The Jagports specified part number is formed as `<JaguarPN>+<3rdPartyPN>`.
- Third-party suitability is the same as the referenced Jaguar PART/context and does not create an independent applicability rule set.
- `third_party_vendor` supports vendor ID, name and one or more home URLs, with descriptions when several URLs are stored.
- `third_party_part` stores vendor product identity, manufacturer, description, one-or-more product/source URLs where evidenced, verification status and verification date.
- Verification status has clear `unverified` and `verified` meanings and the date selector defaults to the current day.
- `third_party_part.part_id` and resolved `stock_item.part_id` reference the same canonical reusable PART identity; vendor identity remains separate.
- Known reusable third-party products are never represented by `stock_item.part_id = NULL`.
- Stock Admin can select the Jaguar parent directly or through the imported PART tree.
- Only reusable products are created through this specification.
- Optional visual-location evidence is delegated to `MODEL_PART_THIRD_PARTY_LOCATION.md`.
- `third_party_part_xref` has an explicit record contract, relationship vocabulary, cardinality and logical uniqueness rules.
- Third-party vendor/product/xref fields have explicit required/nullability and uniqueness expectations, including separate manufacturer and description fields plus multiple product/source URLs.
- Representative deterministic fixtures cover both verified 1:1 and non-1:1 Jagports specified PART paths plus invalid cases.
- The retained MVP boundary is explicit and separates required Stock Admin identity/linkage behavior from Post-MVP vendor/marketplace extensions.
