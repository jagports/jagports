# VIEPS Third-Party PART Model

## Purpose

This document defines how VIEPS represents third-party/vendor products and Jagports specified PARTs that are related to existing Jaguar/JEPC PARTs.

It complements:

- [`MODEL_PART.md`](MODEL_PART.md) — canonical PART identity and catalogue relationships;
- [`MODEL_PART_FIT.md`](MODEL_PART_FIT.md) — fit of Jaguar/JEPC PARTs and occurrences;
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

These references make the relationship auditable and allow VIEPS to use the same Jaguar fit context rather than inventing separate fitment rules for the third-party product.

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

Vendor home URLs may be normalized into a child relation such as `third_party_vendor_home_url(vendor_id, home_url, description)`.

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

For the mandatory `parent_part` record of a Jagports specified PART, the selected Jaguar PART and known catalogue context must be retained. When the imported occurrence exists, `part_occurrence_id` is required and the category/item values must identify that same selected context. When the operator selected the parent through a specific imported source tree path and canonical `part_occurrence_tree_path` evidence exists, `part_occurrence_tree_path_id` must retain that exact path. One occurrence may have several source paths, so occurrence identity alone must not be used to claim which catalogue path the operator selected. If an imported occurrence/tree path is unavailable, explicit manual category/item context may be retained, but it must not be presented as imported JEPC evidence.

Logical uniqueness rules:

- `third_party_part_xref_id` is globally unique;
- the same logical tuple `(third_party_part_id, jaguar_part_id, relationship_type, part_occurrence_id/category/item context)` must not be duplicated;
- each non-1:1 `third_party_part` has at most one `parent_part` relationship;
- duplicate `equivalent_to` or `component_of` rows for the same evidenced context are invalid.

A generic `fits` relation is not part of this model and must not replace explicit relationship semantics.

## Identity, uniqueness and nullability

These rules are part of the model contract and must be enforced by database constraints or deterministic application validation.

| Entity / field | Required / nullable | Uniqueness / validation |
|---|---|---|
| `third_party_vendor.vendor_id` | required | globally unique stable vendor identity. |
| `third_party_vendor.name` | required, nonblank | not assumed globally unique; different vendor identities may have similar names. |
| vendor home URL | at least one may be stored; additional URLs optional | exact duplicate URL rows for one vendor are invalid. |
| home URL description | nullable for a single URL; required/nonblank when one vendor has multiple home URLs | descriptive text is not an identity. |
| `third_party_part.third_party_part_id` | required | globally unique stable vendor-product reference identity. |
| `third_party_part.vendor_id` | required FK | many products may belong to one vendor. |
| vendor part number | required, nonblank | unique within one vendor after deterministic normalization; the same text may exist under another vendor. |
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

## Fit and fit

A third-party product does not define a separate vehicle-fit system.

Its fit is the same as the Jaguar PART/context to which it is referenced.

For a Jagports specified PART:

- its mandatory parent is the Jaguar PART whose fit it follows;
- the known category/item/occurrence/PART reference is retained;
- VIEPS uses the same fit as that referenced Jaguar PART/context;
- no independent third-party fit conditions are created or edited here.

For a verified 1:1 third-party product, fit is the fit of the existing Jaguar PART to which the vendor reference is attached.

The meaning and evaluation of Jaguar fit remain defined by `MODEL_PART_FIT.md`.


## X100 brake-caliper cylinder example

The X100/XK8 front-brake example shows the non-1:1 case.

JEPC shows item 7, a brake caliper seal kit, while the illustration also shows an NSS cylinder/piston component. A third-party vendor can supply a product containing the cylinder/piston together with seals.

That vendor product is not treated as a new Jaguar PART and is not assumed to be 1:1 equal to the Jaguar seal kit because it contains additional content.

VIEPS therefore:

1. selects the relevant Jaguar seal-kit PART from the appropriate imported category/item/occurrence;
2. records that Jaguar PART as the mandatory parent;
3. records the vendor's own part number;
4. creates a Jagports specified PART number as `<JaguarSealKitPN>+<3rdPartyPN>`;
5. uses the same fit/fit as the referenced Jaguar PART/context;
6. links STOCK to the Jagports specified PART.

If a vendor instead sells a verified 1:1 equivalent of the Jaguar seal kit, its vendor part number is attached directly to the Jaguar PART and no Jagports specified PART is required.

## Catalogue-assisted parent selection

The mandatory Jaguar parent may be resolved from imported catalogue context.

Conceptually:

```text
model/sub-range
  -> category
     -> item
        -> occurrence
           -> Jaguar PART
```

The retained/resolvable imported context may include:

- model/sub-range and breadcrumb;
- category and item;
- occurrence;
- Jaguar PART number and description;
- illustration/hotspot context where available;
- fit information such as engine/aspiration, `Except ...` conditions, LH/RH, VIN/revision bounds, market/Region;
- source/provenance and verification information;
- other relevant catalogue/Fit fields present in the retained source context.

The category/item/occurrence/PART reference used for the parent must be stored with the Jagports specified PART.

## Optional visual-location evidence

Optional point/region references on imported JEPC illustrations and uploaded location/reference images are defined in:

[`MODEL_PART_THIRD_PARTY_LOCATION.md`](MODEL_PART_THIRD_PARTY_LOCATION.md)

This evidence is optional and does not change PART fit or STOCK state.

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

## Model boundary

This document defines reusable third-party PART identity and relationship semantics. It does not redefine Jaguar PART Fit, JEPC importing, operational STOCK fields or optional visual-location evidence.

Vendor evidence remains separate from mutable STOCK, and third-party relationships never imply Jaguar-issued identity.

