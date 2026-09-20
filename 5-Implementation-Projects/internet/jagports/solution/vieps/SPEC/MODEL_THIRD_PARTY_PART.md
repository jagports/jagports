# VIEPS Jagports-owned and Third-Party PART Model

## Purpose

This document defines how VIEPS represents Jagports-owned products, third-party/vendor products, NSS/not-serviced-separately service components, their relationships to Jaguar/JEPC catalogue PARTs and service-item scope, their applicability evidence, and their operational stock linkage.

It complements:

- [`MODEL_PART.md`](MODEL_PART.md) — canonical PART identity and catalogue relationships;
- [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md) — occurrence-bound grouped applicability and versioned source evidence;
- [`MODEL_STOCK.md`](MODEL_STOCK.md) — mutable operational stock.

The central rule is that a reusable stockable product has one stable canonical `PART` identity regardless of whether that identity originates from Jaguar/JEPC or Jagports. Vendor references and mutable inventory remain separate concerns.

## Canonical identity classes

### Jaguar / JEPC PART

A Jaguar/JEPC PART is a canonical `PART` whose identity is supported by Jaguar/JEPC source evidence.

Its namespace/source must identify Jaguar/JEPC provenance. VIEPS must not infer a Jaguar identity from a Jagports-created or vendor-created number.

### Jagports-owned PART

A Jagports-owned PART is a canonical `PART` created and maintained by Jagports for a reusable product that does not have an appropriate Jaguar/JEPC service identity.

Examples include:

- a serviceable subcomponent of a Jaguar assembly that JEPC depicts or treats as NSS;
- a repair component independently supplied by a third-party vendor;
- a Jagports kit or assembled product;
- another reusable non-Jaguar product managed through VIEPS.

A Jagports-owned PART must remain distinguishable from a Jaguar/JEPC PART by explicit namespace/source metadata. A Jagports-owned part number must never be presented as Jaguar-issued.

### Vendor / third-party reference

A vendor may have its own identifier for a product represented by a canonical PART.

A vendor-specific identity is external evidence, not a reason to duplicate canonical product identity unnecessarily.

Conceptually:

```text
third_party_vendor
        |
        v
third_party_part / vendor reference
        |
        v
canonical PART
```

### Unresolved stock

A physical stock record may exist with `stock_item.part_id = NULL` when the item is not yet identified well enough to assign a reusable canonical PART.

This is an explicit unresolved state. It is not the normal permanent representation for a known reusable non-Jaguar product.

Once reusable identity is established, the stock record should reference the appropriate Jaguar/JEPC or Jagports-owned canonical PART.

## Jagports namespace

Jagports-owned identifiers belong to a Jagports namespace.

The namespace must support both:

1. neutral Jagports identifiers independent of any Jaguar parent PART; and
2. optionally, human-meaningful identifiers derived from a related Jaguar number when that relationship is genuinely useful and unambiguous.

For example, `XR847031-JP1` may mean a Jagports-owned product related to Jaguar PART `XR847031`. It does not mean Jaguar issued that identifier, that it is equivalent to `XR847031`, or that it supersedes `XR847031`.

Where one Jagports product relates to several Jaguar parent PARTs or occurrences, a neutral Jagports identifier is preferred so identity does not imply one parent is authoritative.

Existing PART normalization rules apply to lookup values; display/raw identity and namespace ownership remain preserved separately.

## PART-to-PART relationship semantics

Relationships between canonical PARTs must be explicit and typed. They must not be represented by overloading supersession or by pretending distinct products share one identity.

At minimum the model distinguishes:

| Relationship | Meaning |
|---|---|
| `component_of` | The child PART is a physical component of the parent PART or assembly. |
| `service_subpart_of` | The child PART is a separately serviceable Jagports product for a component the source parent does not necessarily service separately. |
| `service_scope_extension_of` | The Jagports/third-party product expands the service content represented by a Jaguar/JEPC service PART/item by supplying additional serviceable content that Jaguar does not expose as an independent service PART in that scope. |
| `equivalent_to` | Two independently identified PARTs are verified as functionally interchangeable for the stated scope. |

Jaguar supersession remains governed by the dedicated `part_supersession` semantics in `MODEL_PART.md`.

`component_of`, `service_subpart_of`, and `service_scope_extension_of` must never be displayed or processed as supersession, aliasing, or equivalence.

A Jagports-owned PART may have multiple parent/service relationships.

## NSS / not-serviced-separately products

An NSS item visible in JEPC may be physically identifiable even though Jaguar does not supply it as an independently serviced Jaguar PART.

Jagports may create a canonical Jagports-owned PART for such an item when it is reusable as a product.

A third-party kit may also expand an existing Jaguar service item rather than merely correspond to an NSS component of a complete assembly. In that case `service_scope_extension_of` is the primary service-catalogue relationship, while `component_of` or `service_subpart_of` may additionally describe physical structure when separately verified.

The Jagports PART does not retroactively create a Jaguar service number and does not alter the JEPC source record.

## Third-party vendor entities

### `third_party_vendor`

Represents a supplier/manufacturer/source-party identity used for external product references and pricing evidence.

Required semantics include stable identity, name, optional source reference, and verification/provenance state.

### `third_party_part`

Represents a vendor-specific product reference associated with one canonical PART where that mapping is established.

Typical fields include:

- stable ID;
- vendor ID;
- canonical `part_id` when resolved;
- vendor part number;
- vendor product name/description;
- source URL/reference;
- verification/provenance state.

A vendor product may remain unresolved to canonical PART while evidence is being evaluated, but a resolved reusable product should reference canonical PART rather than create a competing product identity.

### `third_party_part_xref`

Represents a typed cross-reference where an external/vendor product needs an explicit relationship to another canonical or external reference.

Cross-reference semantics must not collapse `component_of`, `service_subpart_of`, `service_scope_extension_of`, `equivalent_to`, or `supersedes` into one generic `fits` relationship.

Where both endpoints are canonical VIEPS PARTs, the canonical PART-to-PART relation is preferred.

## Vendor pricing evidence

Vendor price information is external evidence linked to the vendor product/reference and canonical PART.

A price snapshot must preserve, where available:

- vendor/source identity;
- vendor product reference;
- amount;
- currency;
- observed/effective timestamp or source snapshot identifier;
- source URL/reference;
- verification/provenance state.

Vendor price snapshots are not operational Jagports stock sale-price state and must not mutate canonical PART identity.

## Suitability and applicability authority

A Jagports/third-party PART does not define an independent vehicle-applicability model when it is referenced as fitting an existing Jaguar/JEPC PART or service-item occurrence.

Its suitability is the same as the verified Jaguar/JEPC reference to which it is mapped.

Where one Jaguar PART appears in several JEPC occurrences with different conditions, the Jagports/third-party product must map to the specific supported occurrence or occurrences. For every selected occurrence, the third-party product reuses that occurrence's complete verified applicability; it must not rewrite, broaden, narrow, or reinterpret the occurrence's condition sets.

Therefore:

- a relationship to a canonical Jaguar PART is sufficient only when that PART has one unambiguous applicability scope for the intended use;
- where JEPC distinguishes applicability by occurrence, the mapping is occurrence-specific;
- if vendor/Jagports evidence supports only some occurrences of the Jaguar PART, map only those occurrences rather than creating third-party-specific fitment conditions;
- unselected Jaguar occurrences remain unsupported/unmapped for that third-party product; they are not implicitly excluded Jaguar fitments and are not copied into the third-party product;
- grouped applicability, source-version context, evidence and evaluation semantics remain owned by [`MODEL_PART_APPLICABILITY.md`](MODEL_PART_APPLICABILITY.md).

This model therefore stores the **reference/mapping to the Jaguar applicability authority**, not a second competing set of vehicle-fitment rules for the third-party product.

## JEPC service-item scope extension

`service_scope_extension_of` expresses that a Jagports/third-party product expands the repair/service content available around a Jaguar/JEPC service item.

It is distinct from physical containment, separately-serviceable-subpart structure, verified interchangeability, and Jaguar supersession.

The relation should be anchored as precisely as the catalogue evidence permits:

- the Jaguar/JEPC service PART provides the canonical service reference;
- when that service PART has multiple occurrence-specific applicability contexts, the Jagports/third-party product identifies the supported occurrence(s);
- suitability for each mapped occurrence is exactly the suitability of that Jaguar occurrence as defined by the canonical applicability authority;
- the third-party model does not duplicate the grouped conditions from the applicability specification.

Conceptually:

```text
Jagports PART
   |
   +--> service_scope_extension_of --> Jaguar service PART
   |
   +--> supports Jaguar occurrence A
   +--> supports Jaguar occurrence B
```

The meaning of each occurrence's conditions and evaluation is defined only by `MODEL_PART_APPLICABILITY.md`.

## Imported JEPC evidence boundary

Importer behavior is specified by the dedicated JEPC importer work and is not redefined here.

Authoritative importer references include:

- [Issue #355 — IMPL / JEPC Data Importer](https://github.com/jagports/jagports/issues/355);
- `5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/SPEC_DataImporter_v0.1.md`.

This third-party PART model consumes imported canonical PART, occurrence and applicability evidence through the owning VIEPS model specifications. It must not duplicate importer parsing, transformation, publication, source-version or recovery requirements.

## Transitional evidence boundary

Stock and product-management workflows may operate with deterministic fixture data and explicit manual catalogue-context evidence before full JEPC import coverage exists.

Permitted transitional states include:

- fixture Jaguar PART linked to operational stock;
- Jagports-owned PART linked to operational stock;
- explicit manual mapping to known JEPC model/category/item/occurrence context;
- fixture/manual applicability evidence clearly identified as such;
- unresolved stock with `part_id = NULL` where reusable identity is genuinely unknown.

When imported JEPC evidence becomes available, it replaces or validates fixture/manual catalogue-side evidence without redesigning canonical PART identity or stock records.

Fixture/manual evidence must never be presented as independently verified Jaguar catalogue evidence.

## Stock Admin product-entry workflow

Stock Admin must support three distinct entry paths.

### 1. Existing canonical PART

The operator selects an existing Jaguar/JEPC or Jagports-owned PART and creates a stock record linked to it.

### 2. Create reusable Jagports-owned PART

When the item is a known reusable product but no suitable canonical PART exists, Stock Admin may create a Jagports-owned PART and then create stock against it.

The workflow captures, as applicable:

- Jagports part number or generated identifier;
- description;
- Jagports namespace/source;
- vendor and vendor product reference;
- related Jaguar PART/service-item relationship(s);
- relationship type;
- selected JEPC category/item/occurrence context where known;
- occurrence-bound applicability evidence/status;
- verification state.

A failed Jaguar PART search must not silently create a Jaguar identity.

### 3. Explicit unresolved stock

When identity is not sufficient to establish a reusable product, the operator may create unresolved stock with `part_id = NULL` and the source evidence required by `MODEL_STOCK.md`.

This must be an explicit operator choice.

## Concrete X100 brake-caliper service-scope example

The X100/XK8 front-brake case demonstrates why service scope, physical structure and occurrence applicability remain separate.

Observed JEPC context supplied as source evidence is:

```text
XK8 Coupe/Convertible up to (V) 042775
  -> BRAKING SYSTEM
     -> BRAKE DISC AND CALIPERS
        -> item 7 Brake caliper seal kit
```

Visible JEPC branches include supercharged and `Except 4.0 Litre supercharged` conditions with VIN boundaries. The item includes Jaguar seal-kit identities such as `JLM12123` and `JLM21495`; exact occurrence mapping must be retained from JEPC rather than inferred globally from the part number.

A third-party supplier may provide cylinder/piston content together with seals even though Jaguar's service item is the brake-caliper seal kit and the added cylinder/piston content is NSS in that service scope.

The Jagports/vendor product is therefore modeled primarily as a `service_scope_extension_of` the relevant item-7 occurrence(s), with optional separately verified `component_of` / `service_subpart_of` relations to complete caliper assemblies.

Each supported Jaguar seal-kit occurrence is mapped independently. The Jagports/vendor product has exactly the same suitability as each mapped Jaguar occurrence, including its supercharged / `Except 4.0 Litre supercharged` and VIN-boundary conditions.

If the vendor product is verified for only a subset of the Jaguar seal-kit occurrences, VIEPS maps only that subset; it does not create a new third-party applicability rule by editing the Jaguar occurrence conditions.

This is a model example based on supplied JEPC evidence. It is not a claim that every visible occurrence has been independently verified as suitable for any specific vendor product.

## JEPC-assisted manual context linking

VIEPS should provide a catalogue-assisted selector when an operator manually creates or edits a Jagports/third-party/NSS PART.

Conceptually:

```text
JEPC model/sub-range
  -> category
     -> item / service item
        -> occurrence / Jaguar PART / hotspot context
```

The selector should expose enough source context to support deliberate mappings, including where available:

- JEPC breadcrumb/model/category/item identity;
- illustration/hotspot/item context;
- Jaguar PART number(s) at the occurrence;
- grouped applicability conditions;
- engine/aspiration qualifiers;
- source `Except ...` semantics;
- LH/RH;
- VIN/revision bounds;
- market/Region;
- source/provenance and verification status.

One Jagports product may map to multiple categories/occurrences. Each selected mapping remains independently traceable and must not broaden suitability beyond its evidence.

## Optional visual-location evidence

Optional visual-location evidence for Jagports-owned / third-party / NSS PARTs is separate follow-up functionality and is **not a blocking requirement for this specification**.

[Issue #827 — SPEC / Optional visual-location evidence for third-party PARTs](https://github.com/jagports/jagports/issues/827) owns that work.

That follow-up may support:

- a Jagports-created point/region reference to the relevant location on an imported JEPC illustration without altering the JEPC source image or claiming an imported Jaguar hotspot; and/or
- an uploaded Jagports location/reference image or other explanatory image.

Any such evidence must preserve provenance and remain distinguishable from imported JEPC diagram/hotspot evidence. Absence of visual-location evidence must not block Jagports PART or STOCK creation.
## Search and presentation requirements

Search may resolve Jaguar/JEPC numbers, Jagports-owned identifiers, vendor references and descriptions to canonical PART identity.

Presentation must keep namespaces distinct so vendor or Jagports identifiers are not represented as Jaguar-issued.

Relationship labels must remain semantically distinct; `component_of` or `service_scope_extension_of` must not be shown as replacement/supersession.

Applicability presentation must preserve `applicable`, `excluded`, `unavailable`, and unresolved/unevaluated evidence distinctions defined by the canonical applicability model.

## Implementation boundary

This document defines required domain semantics. It does not claim that the current migration set already implements every typed PART-to-PART, vendor, cross-reference, price-snapshot, or manual-selector entity described here.

Schema implementation must preserve:

- one canonical PART identity per reusable product;
- explicit source/namespace ownership;
- typed relationship semantics;
- occurrence-bound grouped applicability and provenance;
- vendor evidence separate from canonical identity;
- mutable stock separate from catalogue/product identity;
- unresolved states without fabricated facts.

## Acceptance criteria

- Jagports-owned and Jaguar/JEPC canonical PART identities are distinguishable by namespace/source.
- NSS/service products can be represented without invented Jaguar numbers.
- `component_of`, `service_subpart_of`, `service_scope_extension_of`, `equivalent_to`, and supersession remain distinct.
- Vendor identities, product references and price snapshots remain external evidence linked to canonical PART.
- Known reusable non-Jaguar products are not forced to remain unresolved solely because JEPC lacks an identity.
- `stock_item.part_id = NULL` remains available for genuinely unresolved stock.
- Parent/service relationships do not automatically grant vehicle suitability.
- Suitability preserves occurrence-bound grouped applicability, source-version context and provenance from `MODEL_PART_APPLICABILITY.md`.
- One Jagports product can map to multiple JEPC occurrences without flattening their independent constraints.
- Stock Admin supports existing-PART, Jagports-PART creation, and explicit-unresolved entry paths.
- Fixture/manual evidence is explicitly distinguishable from imported/verified JEPC evidence.
- JEPC-assisted manual context linking is defined without making full import coverage a prerequisite for product/stock workflows.
