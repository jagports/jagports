# SPEC_JEPC_DATA

## JEPC data structure findings

Source location:

`5-Implementation-Projects/software/jlr/JEPC/JEPCFiles`

## Dataset hierarchy

JEPC data is organized through linked XML files. The importer must preserve JEPC identifiers while creating normalized VIEPS structures.

```
models_l_id_0.xml
        |
        v
pl_id_<model_id>
        |
        v
cat_Mxxxx_Cyyyy_L0.xml
        |
        +-- tl_Mxxxx_Cyyyy_L0.xml
        |
        +-- Itm_Mxxxx_Cyyyy_Ix_L0.xml
                    |
                    v
             Itm_*_attributes.xml
```

## Model hierarchy

`models_l_id_0.xml` contains:

```
[model_id,parent_id,model_name]
```

Fields:

- `model_id`: JEPC technical model identifier.
- `parent_id`: hierarchy relationship.
- `model_name`: display name.

Rules:

- Model names are not unique keys.
- Preserve model IDs and parent relationships.
- User-facing vehicle grouping is handled by VIEPS Range normalization.

## VIEPS Range normalization

JEPC model families collapse into VIEPS Ranges:

| VIEPS Range | JEPC model families |
|---|---|
| Accessories | Jaguar Accessories |
| Daimler Limousine | Daimler Limousine |
| E-Pace | E-Pace |
| E-Type | E-Type |
| F-Pace | F-Pace |
| F-TYPE | F-Type |
| S-TYPE | S-Type |
| X-TYPE | X-Type |
| XE Range | XE Range |
| XF Range | XF Range, XF (New) |
| XJ Range | XJ Series III, XJ40, X300, X308, later XJ Range |
| XJS Range | XJS Sports Coupe/Convertible |
| XK Range | XK8 Coupe/Convertible, XK Range |

Hierarchy:

```
Range
 |
 +-- JEPC Model Family
       |
       +-- JEPC pl_id model
             |
             +-- Catalogue
                   |
                   +-- Item
                         |
                         +-- Part
```

## Catalogue files

### cat_ files

Example:

`cat_M2220_C10657_L0.xml`

Purpose:

- catalogue hierarchy
- section/category information
- illustration references
- category identifiers

### tl_ files

Purpose:

- translated descriptions
- displayed names for catalogue entries

### Itm_ files

Purpose:

- item structure
- part references
- item decision trees

## Applicability model

Applicability is not only a VIN range. JEPC samples show reusable condition groups.

General model:

```
Part
 |
 +-- ApplicabilityRule
       |
       +-- ConditionGroup
             |
             +-- Condition
                    |
                    +-- AttributeCode
                    +-- Value
                    +-- StartFlag
                    +-- EndFlag
```

Rules:

- Store raw JEPC attribute codes and values.
- Do not hard-code meanings of attribute codes until verified.
- Keep applicability separate from part identity.

## JEPC file inventory snapshot

The complete JEPC installation contains a large number of files. A file inventory snapshot is included:

```
JEPC-files-TREE.zip
```

The inventory is generated from the original JEPC installation using:

```
tree . /F /A > JEPC-files-TREE.txt
```

Purpose:

- Document the analysed JEPC source installation.
- Provide a reproducible view of available files.
- Support parser development.
- Identify model, catalogue, XML and media structures.

The inventory is not imported directly as application data. It is an input for creating a parser index.

Import flow:

```
JEPC installation
        |
        v
JEPC file inventory
        |
        v
Inventory parser
        |
        v
File index
        |
        +-- XML parser
        |
        +-- Media converter
```

## Database sizing and import strategy

The complete JEPC dataset is expected to be larger than sample data. Import architecture must support staged import and future partitioning.

Recommended separation:

- Range and vehicle metadata.
- Catalogue hierarchy.
- Parts.
- Applicability rules.
- Translations.
- Illustration references.

Importer flow:

1. Extract JEPC files.
2. Import model hierarchy.
3. Normalize VIEPS Ranges.
4. Import catalogue structure.
5. Import parts.
6. Import applicability.
7. Import translations.
8. Validate references.

The importer must not assume that all future EPC data fits into one production database. Partitioning strategy should be based on measured imported size.

## Runtime source architecture and applicability evidence

The installed JEPC application is a frame-based application that joins several on-disk datasets and JavaScript components at runtime. The inspected files establish the client-side structure and data contract, but do not establish that any referenced `.jepc` operation required a remote server. Offline/on-disk implementations and resources must remain an open investigation target.

### Local catalogue data

The catalogue browsing and applicability path is recoverable from local files:

```text
menus/L0/models_l_id_0.xml
        |
        v
menus/L0/pl_id_<model>_l_id_0.xml
        |
        v
drilldown/pl_id_<model>/L0/cat_M<model>_C<category>_L0.xml
        |
        +-- tl_M<model>_C<category>_L0.xml
        |
        +-- Itm_M<model>_C<category>_I<item>_L0.xml
        |
        +-- *_attributes.xml sidecars
        |
        +-- flash/images/<diagram>.jpg
        +-- flash/xml/<diagram>.xml
```

The top-level model-menu path is `menus/L0/models_l_id_0.xml` in the observed installation. A third-party jPart reconstruction also shows that its top-level menu can be configured through `options.xml`; therefore importer discovery must not assume that every installation uses only one hard-coded path.

The third-party jPart reconstruction is useful for tree/file-reading behavior, but it does not read JEPC applicability sidecars. Its omission of `menus/pl_id_<model>_attributes.xml`, `tl_*_attributes.xml` and `Itm_*_attributes.xml` is not evidence that those files are irrelevant. The original JEPC JavaScript reads and evaluates applicability separately.

### VIN/search attribute handling

`VinDecode.js` references operations such as `getVinDecode.jepc` and processes a generic `VehicleAttributes` collection plus a `TokenString`. The inspected JavaScript does not establish where those operations were implemented or whether JEPC required network access. Do not classify them as remote/server-only without evidence; continue searching the installation for on-disk implementations, resources, caches or dictionaries.

Five attribute IDs are hard-coded because that VIN/search UI exposes editable selectors for them:

- `6` — Engine variant
- `21` — Market
- `23` — Steering
- `24` — Transmission
- `56` — Trim level

These five are examples used by that UI, not evidence of a complete JEPC attribute taxonomy. Other group IDs occur in applicability sidecars and must remain generic unless independently mapped.

## Decision-tree evidence and application-ID joins

Item files are decision trees, not flat part lists. Preserve the complete ancestry of each leaf.

A part leaf contains an application identifier that can be joined to its applicability sidecar record. Example from X100 model `3187`:

```text
tree ancestry:
main floor
  RH
    Coffee
      LHD
        GJA9460BJSDC
```

The leaf application ID is `142207`; the corresponding sidecar record is:

```text
142207,[A155,2932,0,0][A23,154,0,0]
```

This establishes two important source rules:

1. Tree ancestry and applicability sidecars must be interpreted together.
2. Catalogue position and vehicle applicability are distinct dimensions. `RH` above describes the physical right-hand part position, while `LHD` is a vehicle steering constraint represented by `A23`.

Do not collapse `LH/RH` part position into `LHD/RHD` steering.

## Generic attribute decoding

Raw JEPC group/value identifiers are canonical source evidence. Human-readable mappings may be recovered by correlating many application IDs against their tree ancestry.

For each application ID, retain both:

```text
application_id
  -> raw applicability tuples
  -> full catalogue ancestry
  -> part number / occurrence
```

A mapping may be promoted only when repeated, independent occurrences support the same interpretation. Unknown values remain opaque rather than guessed.

Recommended mapping fields:

```text
source_attribute_group_id
source_attribute_value_id
group_label            nullable
value_label            nullable
mapping_status         direct | derived | unknown
mapping_evidence
mapping_version
```

The original IDs must remain available even after labels are derived.

### X100 observed mapping evidence

The following values are current X100 evidence, not a universal hard-coded Jaguar taxonomy.

| Group/value | Evidence-supported interpretation | Status |
|---|---|---|
| `A23=154` | LHD steering | Direct UI group name + tree correlation |
| `A23=157` | RHD steering | Direct UI group name + tree correlation |
| `A155=2932` | Coffee | Derived from repeated part-tree/application joins |
| `A155=2924` | Flint grey | Derived |
| `A155=2901` | Sable | Derived |
| `A155=2908` | Teal | Derived |
| `A155=2927` | Warm charcoal | Derived |
| `A156=2793` | Oatmeal | Derived |
| `A156=2798` | Teal | Derived |
| `A156=2808` | Warm charcoal | Derived |
| `A156=2811` | Cream | Derived |
| `A156=2813` | Ivory | Derived |
| `A156=2816` | Coffee | Derived |
| `A156=2819` | Cashmere | Derived |
| `A157=2795` | cloth | Derived |
| `A157=6256` | leather | Derived |
| `A157=6258` | ambla/leather | Derived |
| `A157=6261` | sports cloth | Derived |
| `A37=614/615/617` | body/body-configuration variants observed across convertible/coupe branches | Derived; official group/value labels unresolved |

`A155` and `A156` are separate source groups even where their displayed value is the same, such as Warm charcoal. They must not be merged merely because their human-facing labels coincide.

## Applicability tuple behavior

Observed JEPC applicability uses at least two predicate families:

- `A` tuples for source attribute group/value predicates and flags.
- `C` tuples for serial/chassis breakpoints.

Within one applicability record, predicates combine as one condition set. Repeated records for the same displayed node/application scope can represent alternative applicability records and must not be flattened into a single conjunction without verifying the source scope.

Serial breakpoint interpretation and attribute include/exclude semantics must follow the original JEPC filtering implementation. Preserve the raw tuple and flags alongside any normalized interpretation so the mapping can be revalidated.

