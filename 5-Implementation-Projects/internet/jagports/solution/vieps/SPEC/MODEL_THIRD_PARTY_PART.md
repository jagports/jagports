# VIEPS Jagports and Third-Party PART Model

## Purpose

This document defines how VIEPS represents Jagports-owned products, third-party/vendor products, NSS/service subcomponents, their relationship to Jaguar/JEPC catalogue PARTs and service-item scope, their applicability, and their operational stock linkage.

It complements:

- [`MODEL_PART.md`](MODEL_PART.md) — canonical PART identity, JEPC occurrence/context and applicability;
- [`MODEL_STOCK.md`](MODEL_STOCK.md) — mutable operational stock.

The central rule is that a reusable stockable product needs one stable canonical `PART` identity regardless of whether its identity originated from Jaguar/JEPC, Jagports, or a third-party supplier. Mutable inventory remains a separate `stock_item` concern.

## Canonical identity classes

VIEPS distinguishes the following states explicitly.

### Jaguar / JEPC PART

A Jaguar/JEPC PART is a canonical `PART` whose identity is supported by Jaguar/JEPC source evidence.

Its source namespace must identify the Jaguar/JEPC source. VIEPS must not infer a Jaguar identity from a Jagports or vendor-created number.

### Jagports-owned PART

A Jagports-owned PART is a canonical `PART` created and maintained by Jagports for a reusable product that does not have an appropriate Jaguar/JEPC service identity.

Examples include:

- a serviceable subcomponent of a Jaguar assembly that JEPC marks or depicts as NSS / not serviced separately;
- a repair component supplied by a third-party vendor;
- a Jagports kit or assembled product;
- a reusable non-Jaguar product managed in Jagports stock.

A Jagports-owned PART must be distinguishable from a Jaguar/JEPC PART by explicit source/namespace metadata. A Jagports-owned part number must never be presented as a Jaguar-issued part number.

### Vendor / third-party reference

A vendor may have its own identifier for a product represented by a canonical PART.

A vendor-specific identity is a source/reference identity, not a reason to duplicate the canonical product unnecessarily. Conceptually:

```text
third_party_vendor
        |
        v
third_party_part / vendor offer
        |
        v
canonical PART
```

`third_party_part` therefore represents the vendor's product reference, vendor part number/name and source metadata, while the canonical `PART` remains the VIEPS product identity used by stock and applicability relationships.

### Unresolved stock

A physical stock record may exist with `stock_item.part_id = NULL` when the item is not yet identified well enough to assign a reusable canonical PART.

This is an explicit unresolved state. It is not the preferred permanent representation for a known reusable non-Jaguar product.

Once a reusable product identity is established, the stock record should reference the appropriate canonical Jaguar/JEPC or Jagports-owned PART rather than remain unresolved merely because the product is absent from JEPC.

## Jagports part-number namespace

Jagports-owned part numbers belong to a Jagports namespace.

The namespace must support both:

1. neutral Jagports identifiers independent of any Jaguar parent PART; and
2. optionally, human-meaningful identifiers derived from a related Jaguar part number when that relationship is genuinely useful and unambiguous.

For example, a Jagports-owned subcomponent could use a displayed identifier such as:

```text
XR847031-JP1
```

This means "Jagports-owned product related to XR847031". It does **not** mean that Jaguar issued `XR847031-JP1`, that it is equivalent to `XR847031`, or that it supersedes `XR847031`.

A parent-derived number should not be used when the same Jagports product belongs to multiple Jaguar parent PARTs or when the parent relationship would make the identity misleading. In those cases a neutral Jagports identifier is preferred, for example:

```text
JP-CALCYL-001
```

The exact production numbering syntax may be refined separately. The semantic requirements above are mandatory: namespace ownership and source must remain explicit.

Existing PART normalization rules apply to the normalized lookup value; display/raw identity remains preserved separately.

## PART-to-PART relationship semantics

Jagports-owned service products may relate to one or more Jaguar/JEPC PARTs.

These relationships must be explicit and typed. They must not be represented by overloading supersession or by pretending two different products share one identity.

At minimum the model must distinguish:

| Relationship | Meaning |
|---|---|
| `component_of` | The child PART is a physical component of the parent PART or assembly. |
| `service_subpart_of` | The child PART is a separately serviceable Jagports product for a component that the source parent does not necessarily service separately. |
| `service_scope_extension_of` | The Jagports/third-party product expands the service content represented by a Jaguar/JEPC service PART/item by supplying additional serviceable content that Jaguar does not expose as an independent service PART in that scope. This is a service-catalogue relationship, not merely physical containment. |
| `equivalent_to` | Two independently identified PARTs are verified as functionally interchangeable for the stated scope. This must not be inferred from similar descriptions or fitment. |

Jaguar supersession remains governed by the dedicated `part_supersession` semantics in `MODEL_PART.md`. A `component_of`, `service_subpart_of`, or `service_scope_extension_of` relationship must never be displayed or processed as supersession, aliasing, or equivalence.

A Jagports-owned PART may have multiple parent/service relationships. This is required for products such as a common piston/cylinder/seal repair component that services multiple Jaguar catalogue contexts.

`service_scope_extension_of` is specifically used when the important relationship is that the aftermarket/Jagports product extends what can be serviced around an existing Jaguar service item. A separate `component_of` or `service_subpart_of` relation may also exist when physically true, but it does not replace the service-scope relationship.

## NSS / not-serviced-separately products

An NSS item visible in JEPC may be physically identifiable even though Jaguar does not supply it as an independently serviced Jaguar PART.

Jagports may create a canonical Jagports-owned PART for such an item when it is reusable as a product, for example because a supplier can provide it independently.

An aftermarket kit can also expand an existing Jaguar service item rather than merely correspond to an NSS component of the complete assembly. For example, Jaguar may service a caliper through a `Brake caliper seal kit`, while a third-party product supplies those seals **plus** an NSS cylinder/piston component. In that case the aftermarket product is a `service_scope_extension_of` the Jaguar seal-kit service item/occurrence.

The Jagports PART must preserve the distinction between physical structure and service scope:

```text
Jaguar/JEPC service item / occurrence
        |
        | service_scope_extension_of
        v
Jagports-owned expanded service product
        |
        +--> optional component_of / service_subpart_of physical relation
        |
        v
third-party vendor reference(s)
        |
        v
operational STOCK RECORD(s)
```

The Jagports PART does not retroactively create a Jaguar service part number and does not alter the JEPC source record.

## Third-party vendor entities

The third-party/vendor layer must be able to represent at least:

### `third_party_vendor`

A supplier/manufacturer/source-party identity used for external product references and pricing evidence.

Typical fields include a stable ID, name, optional source URL/reference, and verification/provenance state.

### `third_party_part`

A vendor-specific product reference associated with one canonical PART where that mapping is established.

Typical fields include:

- stable ID;
- vendor ID;
- canonical `part_id` when resolved;
- vendor part number;
- vendor product name/description;
- source URL/reference;
- verification/provenance state.

A vendor product may remain unresolved to a canonical PART while its evidence is being evaluated, but a resolved reusable product should reference the canonical PART rather than create a second competing product identity.

### `third_party_part_xref`

A typed cross-reference when an external/vendor product needs an explicit relationship to another canonical or external reference.

Allowed relationship semantics must be controlled and must not collapse `component_of`, `service_subpart_of`, `service_scope_extension_of`, `equivalent_to`, or `supersedes` into one generic "fits" relationship.

Where the cross-reference concerns two canonical VIEPS PARTs, the canonical PART-to-PART relation should be preferred so stock, search and applicability have one stable product identity graph.

## Suitability and applicability authority

A relationship to a Jaguar parent PART or service item does **not** by itself prove that a Jagports/third-party product fits every vehicle context in which that Jaguar identity appears.

Third-party/NSS product suitability must ultimately be based on verified applicability evidence at the relevant JEPC occurrence/context level when the source differentiates fitment there.

Relevant constraints can include, for example:

- engine or engine variant;
- supercharged / non-supercharged or source `except` semantics;
- LH / RH position;
- body/market/Region where supplied;
- VIN serial boundaries;
- other JEPC application attributes or grouped conditions.

The model must preserve the difference between:

```text
canonical PART / service-scope relationship
```

and:

```text
verified occurrence/applicability relationship
```

A Jagports-owned PART may therefore relate to multiple Jaguar PARTs/service items while being suitable only for selected JEPC occurrences.

Applicability must not be guessed by copying a parent PART's or service PART's entire fitment set.

## JEPC service-item scope extension

`service_scope_extension_of` expresses that a Jagports/third-party product expands the repair/service content available around a Jaguar/JEPC service item.

This relation is intentionally distinct from:

- `component_of`, which describes physical containment;
- `service_subpart_of`, which describes a separately serviceable subpart of a parent product/assembly;
- `equivalent_to`, which describes verified replacement interchangeability; and
- Jaguar supersession.

A service-scope extension should be anchored as precisely as the JEPC evidence permits. A canonical relationship to a Jaguar PART can support search/discovery, but the authoritative applicability mapping is to the relevant JEPC `part_occurrence`/service-item context when JEPC branches that item by qualifiers.

One Jagports product may extend several occurrences of the same Jaguar service item, or occurrences in several catalogue categories, provided each mapping has its own source/provenance and applicability state.

Conceptually:

```text
Jagports PART
   |
   +--> service_scope_extension_of --> Jaguar service PART (search/reference relation)
   |
   +--> mapped to JEPC service-item occurrence A
   +--> mapped to JEPC service-item occurrence B
   +--> excluded/unavailable at occurrence C where evidence requires
```

The occurrence mappings prevent a generic Jaguar part number from incorrectly granting suitability across contexts with different VIN, engine, side, market, or exclusion qualifiers.

## JEPC importer relationship

The JEPC importer is responsible for importing source occurrence/context and applicability evidence accurately enough for downstream consumers to make these decisions.

The importer does not create Jagports product policy and does not import mutable Jagports stock. Its role here is to make the source constraints available, including unresolved source values where semantics are not yet verified.

The long-term flow is:

```text
JEPC source
   |
   v
JEPC importer
   |
   v
Jaguar PART + category/item + occurrence/context + applicability
   |
   +------------------------------+
                                  |
                           Jagports-owned PART
                           relationship/mapping
                                  |
                                  v
                          verified suitability
                                  |
                                  v
                           operational stock
```

Full JEPC production import is not a prerequisite for implementing the Stock Admin workflow.

## MVP fixture boundary

For the reduced MVP, stock functionality proceeds using deterministic fixture PARTs and fixture/manual-evidence applicability where necessary.

This allows the durable Stock Admin and Jagports-product workflows to be implemented before complete JEPC import coverage exists.

The MVP may therefore exercise:

```text
fixture Jaguar PART
        |
        +--> real operational stock

Jagports-owned PART
        |
        +--> fixture/manual verified relation/applicability
        |
        +--> real operational stock

unidentified item
        |
        +--> unresolved stock_item (part_id = NULL)
```

For MVP, limited explicit/manual mapping to known JEPC model/category/item/occurrence references is sufficient. A complete JEPC-assisted selector is a later whole-VIEPS requirement and is not an MVP blocker.

When real JEPC data becomes available, imported occurrence/applicability evidence replaces or validates the fixture/manual catalogue-side evidence without redesigning the Stock Admin or stock data model.

Fixture data must never be presented as independently verified Jaguar catalogue evidence.

## Stock Admin product-entry workflow

Stock Admin must support three distinct entry paths.

### 1. Existing canonical PART

The operator finds an existing Jaguar/JEPC, fixture, or Jagports-owned PART and creates a stock record linked to it.

### 2. Create a reusable Jagports-owned PART

When the item is a known reusable product but no suitable canonical PART exists, Stock Admin may create a Jagports-owned PART, then create stock against it.

The product-entry workflow should capture, as applicable:

- Jagports part number or generated Jagports identifier;
- description;
- Jagports source/namespace;
- vendor and vendor part reference;
- optional related Jaguar PART/service-item relationship(s);
- relationship type, including `service_scope_extension_of` when the product expands a Jaguar service item;
- selected JEPC model/category/item/occurrence references where known;
- applicability evidence/status;
- verification state.

A failed Jaguar PART search must not silently create a Jaguar identity.

### 3. Explicit unresolved stock

When identity is not yet sufficient to establish a reusable product, the operator may create unresolved stock with `part_id = NULL` and the source evidence required by `MODEL_STOCK.md`.

The UI must make this an explicit operator choice. A failed PART lookup is not by itself permission to fabricate a PART or silently classify the item as unresolved.

## Concrete X100 brake-caliper service-scope example

The representative X100/XK8 front-brake case demonstrates why service scope, physical structure and occurrence applicability must remain separate.

Observed JEPC context supplied as source evidence is:

```text
XK8 Coupe/Convertible up to (V) 042775
  -> BRAKING SYSTEM
     -> BRAKE DISC AND CALIPERS
        -> item 7 Brake caliper seal kit
```

Within item 7, JEPC visibly branches the service item by applicability conditions including:

```text
4.0 Litre supercharged
  To VIN (031302)
  From VIN (031303)

Except 4.0 Litre supercharged
  To VIN (037347)
  From VIN (037348)
```

The observed item also contains Jaguar seal-kit PART identities including `JLM12123` and `JLM21495`, with their exact occurrence mapping retained from JEPC rather than inferred globally from the part number.

The illustration for item 7 shows the seal-service context around a cylinder/piston-like NSS element. A third-party supplier can provide a cylinder/piston together with the seals even though Jaguar's JEPC service item is the **Brake caliper seal kit** and the additional cylinder/piston content is not independently serviced by Jaguar there.

The correct primary service relationship is therefore not merely "this cylinder is part of the whole caliper". The Jagports/vendor cylinder + seals product **expands the Jaguar seal-kit service scope**:

```text
Jagports PART: JP-CALCYL-001
Description: front caliper cylinder/piston + seals repair kit
Source namespace: JAGPORTS

service_scope_extension_of
  -> relevant JEPC item 7 Brake caliper seal-kit occurrence(s)

optional, when separately verified:
  component_of / service_subpart_of
  -> relevant complete caliper assembly PART(s)
```

The optional physical caliper relationship is useful structure, but it does not express the main catalogue/service fact and must not be used to infer suitability.

Each applicable seal-kit occurrence must be mapped independently. The same Jaguar seal-kit number appearing in several JEPC branches must not cause the Jagports repair kit to inherit every branch automatically.

Conceptually:

```text
Jagports cylinder + seals kit
  -> service_scope_extension_of occurrence A
  -> service_scope_extension_of occurrence B
  -> excluded/unavailable occurrence C as evidence requires
```

This allows VIEPS to preserve the exact supercharged/except-supercharged and VIN-boundary distinctions shown by JEPC while still maintaining one reusable Jagports product identity when the vendor product itself is common across several verified contexts.

This example is a model requirement/example based on the supplied JEPC evidence. It is not a claim that every visible occurrence has already been independently verified as suitable for a particular third-party vendor product.

## Future JEPC-assisted manual PART context linking

Whole-VIEPS operation should later provide JEPC-assisted context selection when an operator manually creates or edits a Jagports/third-party/NSS PART.

The operator should be able to browse or search through the imported catalogue structure, conceptually:

```text
JEPC model/sub-range
  -> category
     -> item / service item
        -> occurrence / Jaguar PART / hotspot context
```

The selection view should expose enough source context to make a deliberate mapping, including where available:

- JEPC breadcrumb/model/category/item identity;
- illustration/hotspot/item context;
- Jaguar PART number(s) at the occurrence;
- engine/aspiration qualifiers;
- source `Except ...` conditions;
- VIN boundaries;
- LH/RH or other positional qualifiers;
- market/Region and other source applicability attributes.

Manual PART creation must eventually support selecting **one or many** JEPC occurrence contexts, including relevant contexts located in more than one catalogue category. Each selected mapping must preserve its own provenance and verification/applicability state.

The UI should warn when the same Jaguar PART appears in multiple JEPC occurrences with materially different qualifiers, so an operator does not accidentally map a Jagports product to all contexts based only on the canonical Jaguar part number.

The workflow must distinguish the reason for the mapping, especially `service_scope_extension_of` versus physical `component_of`/`service_subpart_of` and versus equivalence/supersession.

Later JEPC importer knowledge may suggest candidate occurrence mappings and may reconcile existing manual/fixture mappings, but imported evidence must not silently broaden suitability or erase provenance.

This richer JEPC-assisted selector is a whole-VIEPS/post-MVP requirement. MVP may use a limited explicit selector or fixture/manual references to known contexts.

## Pricing snapshots

Vendor price information is external/vendor evidence and must not become mutable Jaguar catalogue identity.

A pricing snapshot should support at least:

- vendor / third-party product identity;
- observed numeric price;
- currency;
- source URL/reference;
- observation/check date;
- optional availability text/state from the vendor;
- verification/provenance status where applicable.

Price history is appendable evidence. Updating a vendor price must not overwrite the canonical PART identity or Jagports stock sale price semantics.

## Search and presentation

Search may find a product through:

- canonical Jaguar/JEPC part number;
- canonical Jagports part number;
- vendor/third-party part number;
- supported description/text search where separately implemented.

Presentation must identify the namespace/source of the displayed number so a Jagports or vendor number is not mistaken for a Jaguar part number.

For a Jagports NSS/service product, the UI may show Jaguar parent/service-item relationships and verified suitability context, but must not label `component_of`, `service_subpart_of`, or `service_scope_extension_of` as supersession or direct equivalence.

Unavailable applicability evidence must remain distinguishable from confirmed incompatibility.

## Integrity requirements

Implementation must enforce or validate at least the following:

- one stable canonical PART identity for each resolved reusable product;
- explicit source/namespace ownership for Jagports-created numbers;
- no automatic Jaguar identity from a Jagports/vendor identifier;
- typed PART-to-PART/service-scope relationship semantics;
- no self-referential component/service relation;
- no automatic fitment inheritance solely from a parent PART or service relation;
- `service_scope_extension_of` remains distinct from physical containment, equivalence and supersession;
- vendor part references remain distinguishable from canonical PART numbers;
- unresolved stock remains valid without a fabricated PART;
- stock continues to reference canonical PART by stable ID where resolved;
- catalogue/reference data never stores mutable stock quantity/location/condition state.

## Representative fixtures and tests

The deterministic test set should include at minimum:

1. a Jaguar/JEPC fixture PART with normal stock;
2. a Jagports-owned non-Jaguar product with stock;
3. a Jagports-owned NSS/service subpart related to one Jaguar parent PART;
4. a Jagports-owned service subpart related to multiple parent PARTs;
5. a vendor reference resolving to a Jagports-owned PART;
6. a vendor part number that must not be interpreted as a Jaguar number;
7. explicit `component_of`/`service_subpart_of` relations that are not treated as supersession;
8. a `service_scope_extension_of` example anchored to a Jaguar service item/occurrence;
9. one Jagports product mapped to multiple service-item occurrences without globally inheriting every occurrence of the Jaguar PART;
10. an occurrence-level applicability restriction such as "Except supercharged";
11. side/VIN-boundary applicability examples;
12. unavailable applicability distinguished from confirmed exclusion;
13. unresolved stock with `part_id = NULL` and required source evidence;
14. a later resolution of unresolved stock to an established canonical PART without changing the stock record's historical source evidence.

## MVP versus later boundary

### MVP

The MVP may use fixture Jaguar PARTs and fixture/manual-evidence applicability while implementing the durable product and Stock Admin workflows.

MVP work should support:

- stock linked to existing fixture/canonical PARTs;
- creation of reusable Jagports-owned PARTs;
- explicit unresolved stock;
- vendor/source reference capture;
- typed parent/service/service-scope relationships where needed for fixture examples;
- limited explicit/manual links to known JEPC contexts;
- applicability represented without inventing unsupported meaning.

Complete JEPC import coverage and the full JEPC-assisted manual context selector are not MVP blockers.

### Later / importer-backed operation

Later operation replaces or validates fixture/manual JEPC-side evidence with imported real JEPC occurrence/applicability data.

Whole-VIEPS operation should add the JEPC-assisted manual context selector described above so manually created Jagports/third-party PARTs can be linked precisely to all relevant model/category/item/occurrence contexts, with multi-context selection, qualifier visibility, provenance, warnings for differing occurrence semantics, and importer-assisted suggestion/reconciliation.

It may further add richer vendor synchronization, automated cross-reference discovery, broader product search, price-refresh automation and more detailed relationship evidence. Those extensions must preserve the identity and stock boundaries defined here.
