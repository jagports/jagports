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
