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

The installed application additionally shows that catalogue content, applicability, prices and media are separate data layers joined at runtime.

```
catalogue tree/content
        |
        +-- applicability sidecars
        |
        +-- price sidecars
        |
        +-- catalogue illustration/media resources
        |
        +-- hotspot resources
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

- top-level catalogue decision-tree rows
- displayed descriptions/names
- top-level applicability targets

A `tl_*` file is not just a translation dictionary. It participates in the browse tree and can have a matching `tl_*_attributes.xml` applicability sidecar.

### Itm_ files

Purpose:

- item structure
- part references
- item decision trees
- application IDs linking visible leaf rows to applicability rules

A typical leaf row contains a part number and an application ID. The application ID is the key used to correlate the displayed tree path with the matching applicability sidecar row.

## Installed application structure and source/runtime boundary

Analysis of the installed JEPC JavaScript and HTML shows two distinct layers.

### Local/static catalogue runtime

The core catalogue browser is primarily driven by local files:

- model menus
- category menus
- `cat_*`, `tl_*` and `Itm_*` XML
- `*_attributes.xml` applicability sidecars
- catalogue illustration/media resources
- hotspot resources
- local price XML where present

The frame-based UI and JavaScript join these files at runtime.

### Historical server-backed functions

Some functions use obsolete `*.jepc` server endpoints, including VIN decoding and some search/administrative functions. The installed client code documents the historical response contract but does not contain the old server implementation.

VIN decode historically returned data shaped approximately as:

```
VINDecodeAndMVS
  +-- ModelId
  +-- SerialNumber
  +-- TokenString
  +-- Attributes
       +-- VehicleAttributes[]
            +-- AttributeID
            +-- AttributeDescription
            +-- AttributeValueID
            +-- AttributeValueDescription
```

The application then copied `TokenString` into shared frame state and used it for local applicability filtering.

Implication:

- Do not make VIEPS import or fitment depend on obsolete JEPC server endpoints.
- Client-side JavaScript may still be used as evidence for source syntax and historical field semantics.
- Human-readable labels that only came from the dead server must not be invented if they cannot be reconstructed from local evidence.

## Applicability model

Applicability is not only a VIN range. JEPC samples show reusable condition groups.

General model:

```
Part occurrence / tree path
 |
 +-- application_id
       |
       +-- ApplicabilityRule
             |
             +-- ConditionGroup
                   |
                   +-- Condition
                          |
                          +-- AttributeCode
                          +-- Value
                          +-- Flags
```

Observed sidecar syntax includes:

```
application_id,[A<group>,<value>,<include/exclude flag>,...][C,<serial>,<bound flag>,...]
```

### Serial constraints

Observed `C` rules behave as serial/chassis boundaries:

- `[C,<serial>,0,...]` acts as a FROM/lower boundary.
- `[C,<serial>,1,...]` acts as a TO/upper boundary.
- Two `C` entries on one applicability record form a range.
- Alphanumeric serials must remain strings.
- Repeated applicability records for the same top-level node can represent alternatives.

Do not normalize serials by numeric conversion.

### Attribute constraints

Observed `A` rules are generic attribute group/value predicates.

Rules:

- Preserve raw JEPC attribute group IDs and value IDs.
- Preserve include/exclude flags.
- Conditions within one applicability record are conjunctive unless source evidence proves otherwise.
- Repeated records for the same source node/application can represent alternatives.
- Do not hard-code a closed list of attribute groups.
- Do not discard unknown groups or values.

## Universal attribute-decoding method

Human-readable JEPC attributes can often be reconstructed from local catalogue evidence without the obsolete server.

The primary join is:

```
Itm_*_L0.xml leaf
  application_id
       |
       +-----------------------+
                               |
*_attributes.xml               |
application_id,[A...][C...]    |
                               |
                               v
                    tree ancestry / labels
```

For each application ID, retain both:

1. the raw applicability predicates; and
2. the full catalogue-tree ancestry that led to that part leaf.

Across many occurrences, correlate a raw `A<group>=<value>` pair with repeated tree labels. A value label is considered derived only when the same mapping is supported consistently by repeated independent application/tree joins.

Do not assign every ancestor label to every applicability predicate. A tree can include ordinary part-position structure that has no matching `A` condition.

Example:

```
Carpet
  main floor
    RH
      Coffee
        LHD
          GJA9460BJSDC
```

with raw applicability:

```
[A155,2932][A23,154]
```

supports:

- one attribute value mapping to `Coffee`;
- one attribute value mapping to `LHD`;
- `RH` remains a physical part-position branch because no matching applicability predicate represents it.

This distinction is mandatory:

- `LH/RH` can describe the physical side/location of a part.
- `LHD/RHD` describes steering configuration.
- They must not be collapsed into a single `side` field.

## Attribute label provenance

Store attribute interpretation separately from raw source identity.

Recommended logical fields:

```
attribute_group_id
attribute_value_id
group_label          nullable
value_label          nullable
label_source         source-ui | derived-tree | unknown
confidence           verified | strong | provisional | unknown
```

Rules:

- Raw group/value IDs remain canonical source facts.
- Human-readable labels are annotations and may be improved later.
- Two distinct JEPC groups may legitimately use the same display label.
- Never merge groups solely because their values have the same text.
- Unknown values remain opaque rather than guessed.

## Current X100 reverse-engineering evidence

The following mappings are evidence from X100 local source/tree correlation. They are not a declaration that these groups are universal across every JEPC model family.

### UI-exposed groups in VinDecode.js

The historical VIN/search page hard-codes five editable groups:

| Group | UI label |
|---|---|
| A6 | Engine variant |
| A21 | Market |
| A23 | Steering |
| A24 | Transmission |
| A56 | Trim level |

These mappings are strong evidence for those specific IDs in that JEPC application UI, but they do not define the complete JEPC attribute taxonomy.

The same UI accepts additional arbitrary vehicle attributes returned by the historical VIN service.

### X100 derived group/value mappings

Repeated application/tree joins currently support:

| Group | Value | Derived label/evidence |
|---|---:|---|
| A23 | 154 | LHD |
| A23 | 157 | RHD |
| A155 | 2787 | Cream |
| A155 | 2899 | Oatmeal |
| A155 | 2901 | Sable |
| A155 | 2908 | Teal |
| A155 | 2909 | Green |
| A155 | 2923 | Shadow grey |
| A155 | 2924 | Flint grey |
| A155 | 2927 | Warm charcoal |
| A155 | 2932 | Coffee |
| A156 | 2793 | Oatmeal |
| A156 | 2798 | Teal |
| A156 | 2808 | Warm charcoal |
| A156 | 2811 | Cream |
| A156 | 2813 | Ivory |
| A156 | 2816 | Coffee |
| A156 | 2819 | Cashmere |
| A157 | 2795 | cloth |
| A157 | 6256 | leather |
| A157 | 6258 | ambla/leather |
| A157 | 6261 | sports cloth |

A37 currently behaves as a body/body-configuration dimension in X100 evidence, with values `614`, `615` and `617` separating convertible/coupe configurations and VIN-era changes. Keep its official group/value labels provisional until more direct evidence is found.

A155 and A156 are distinct source groups even where both map to the same visible colour, for example Warm charcoal. Preserve them independently.

## Applicability evidence completeness

Application sidecars do not necessarily contain every visible branch condition.

A displayed decision tree may encode conditions in:

- category/model context;
- top-level tree ancestry;
- item-tree ancestry;
- application sidecar predicates;
- serial boundaries;
- physical part-location branches.

Therefore:

- preserve the complete tree path as source evidence;
- preserve raw applicability sidecars separately;
- do not assume sidecars alone fully describe the human-visible path;
- do not infer an applicability predicate from an ordinary tree label without repeated correlation evidence;
- unresolved conditions remain unresolved rather than becoming broad positive applicability.

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
- Attribute dictionary/provenance.
- Translations.
- Illustration references.

Importer flow:

1. Extract JEPC files.
2. Import model hierarchy.
3. Normalize VIEPS Ranges.
4. Import catalogue structure and complete decision-tree paths.
5. Import parts and application IDs.
6. Import raw applicability.
7. Derive evidence-backed attribute labels without changing raw IDs.
8. Import translations.
9. Import media/hotspot references.
10. Validate cross-file references and unresolved evidence.

The importer must not assume that all future EPC data fits into one production database. Partitioning strategy should be based on measured imported size.
