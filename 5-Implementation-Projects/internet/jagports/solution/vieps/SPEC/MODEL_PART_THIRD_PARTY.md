# VIEPS Third-Party PART Model

## Purpose

This document defines how VIEPS represents third-party/vendor products and Jagports specified PARTs that are related to existing Jaguar/JEPC PARTs.

It complements:

- [`MODEL_PART.md`](MODEL_PART.md) — canonical PART identity and catalogue relationships;
- [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md) — applicability of Jaguar/JEPC PARTs and occurrences;
- [`MODEL_STOCK.md`](MODEL_STOCK.md) — mutable operational stock;
- [`MODEL_PART_THIRD_PARTY_LOCATION.md`](MODEL_PART_THIRD_PARTY_LOCATION.md) — optional visual-location evidence for third-party PARTs.

A reusable product has one canonical `PART` identity in the PART database. That identity may have been imported or added manually. Vendor references and operational STOCK remain separate records.

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
- canonical `part_id`;
- vendor part number;
- vendor product name/description;
- product/source URL where available;
- `verification_status`;
- `verification_date`.

`verification_status` is a select field with these values:

- `unverified` — the vendor reference or its PART relationship has been entered but has not yet been checked;
- `verified` — the vendor reference and its claimed relationship to the Jaguar/Jagports specified PART have been checked against available evidence.

`verification_date` is a date-select field and defaults to the current day when the record is entered or verified. It records when the evidence/mapping was checked.

A third-party product that is verified 1:1 equal to a Jaguar PART links directly to that Jaguar canonical `part_id`.

A third-party product with no 1:1 Jaguar PART links to the Jagports specified canonical PART created for it.

## Third-party cross-references

A third-party/vendor reference may point to:

- an existing Jaguar PART when the vendor product is verified 1:1 equal;
- a Jagports specified PART when the vendor product has no 1:1 Jaguar PART;
- other external references where separately required.

Cross-references must preserve the reason for the relationship. A generic `fits` relation must not replace the explicit parent/equality/component facts defined here.

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

Unresolved/non-reusable stock handling belongs to `MODEL_STOCK.md` and is outside this third-party PART specification.

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
- required category/item/occurrence/PART reference for the selected parent;
- combined `<JaguarPN>+<3rdPartyPN>` numbering for non-1:1 Jagports specified PARTs;
- third-party vendor identity and URLs;
- verification status and verification date;
- suitability identical to the referenced Jaguar PART/context;
- vendor evidence separate from mutable STOCK.

## Acceptance criteria

- The specification uses the term **Jagports specified**, not Jagports-owned, for manually defined non-Jaguar PART records.
- A verified 1:1 third-party product with its own vendor part number can reference the existing Jaguar PART without creating a duplicate canonical PART.
- A non-1:1 third-party product is represented by a Jagports specified PART with a mandatory Jaguar parent.
- The parent category/item/occurrence/PART reference is known and retained.
- The Jagports specified part number is formed as `<JaguarPN>+<3rdPartyPN>`.
- Third-party suitability is the same as the referenced Jaguar PART/context and does not create an independent applicability rule set.
- `third_party_vendor` supports vendor ID, name and one or more home URLs, with descriptions when several URLs are stored.
- `third_party_part` stores vendor product identity, verification status and verification date.
- Verification status has clear `unverified` and `verified` meanings and the date selector defaults to the current day.
- Stock Admin can select the Jaguar parent directly or through the imported PART tree.
- Only reusable products are created through this specification.
- Optional visual-location evidence is delegated to `MODEL_PART_THIRD_PARTY_LOCATION.md`.
