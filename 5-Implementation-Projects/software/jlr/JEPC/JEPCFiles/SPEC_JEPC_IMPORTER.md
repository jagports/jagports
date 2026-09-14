# SPEC_JEPC_IMPORTER

## Purpose

Define the implementation approach for importing JEPC source data into the VIEPS data model.

This document describes how JEPC files are processed.

Related:

- `SPEC_JEPC_DATA.md` — JEPC source data structure and findings.

## Import principles

The importer must:

- Preserve JEPC identifiers.
- Normalize data into VIEPS structures.
- Separate source interpretation from storage.
- Support incremental processing.
- Avoid loading the complete JEPC dataset into memory.

## Import architecture

```
JEPC Installation
        |
        v
File Inventory
(JEPC-files-TREE)
        |
        v
Inventory Parser
        |
        v
File Index
        |
        +----------------+
        |                |
        v                v
 XML Importer      Media Importer
        |                |
        v                v
 VIEPS Database    Media Storage
```

## Implementation phases

### Phase 0 — File inventory and parser foundation

Priority: P0

Input:

```
JEPC-files-TREE.zip
```

Generated with:

```
tree . /F /A > JEPC-files-TREE.txt
```

Tasks:

- Parse directory structure.
- Detect JEPC file types.
- Build internal file index.

Recognized files:

- `models_l_id_0.xml`
- `pl_id_*`
- `cat_*`
- `tl_*`
- `Itm_*`
- `*_attributes`
- media files

Output:

```
JEPC file index
```

### Phase 1 — Vehicle model hierarchy

Priority: P0

Input:

```
menus/models_l_id_0.xml
```

Import:

```
Range
 |
 +-- JEPC Model Family
       |
       +-- pl_id
```

Tasks:

- Import model IDs.
- Import parent relationships.
- Import names.
- Apply VIEPS Range normalization.

### Phase 2 — Initial supported ranges

Priority order:

1. XK Range (P0)

Models:

```
3175
3187
3183
3178
3173
7420
7422
```

Reason:

- Existing JEPC structure analysis.
- Known applicability examples.
- Good validation dataset.

2. XJ Range (P1)

Models:

```
2204
2220
2233
3215
```

Includes:

- XJ40
- X300
- X308

3. XF Range (P1)

Models:

```
1687
1689
16231
16261
```

4. Remaining ranges (P2)

- XJS Range
- S-TYPE
- X-TYPE
- XE Range
- F-TYPE
- F-Pace
- E-Pace
- E-Type
- Daimler Limousine
- Accessories

## Phase 3 — Catalogue import

Priority: P0

Process:

```
cat_Mxxxx_Cyyyy_L0.xml
        |
        v
Catalogue hierarchy

tl_Mxxxx_Cyyyy_L0.xml
        |
        v
Translated descriptions

Itm_Mxxxx_Cyyyy_Ix_L0.xml
        |
        v
Items and part references
```

## Phase 4 — Applicability import

Priority: P1

Applicability is imported as generic rules.

Do not initially decode attribute meanings.

Store:

```
ApplicabilityRule
 |
 +-- ConditionGroup
       |
       +-- AttributeCode
       +-- Value
       +-- Flags
```

Future work:

- Decode attribute codes.
- Add VIN/serial interpretation.
- Add equipment option interpretation.

## Phase 5 — Media import

Priority: P2

Media is converted during import.

Source:

```
GIF
JPG
SWF
```

Target:

```
Web compatible assets
```

Process:

```
Raw media
    |
    v
Converter
    |
    +-- SVG
    +-- PNG/WebP
    +-- Other web formats
```

Database stores:

- media identifier
- original filename
- processed filename
- checksum
- type

Binary assets are stored separately from relational data.

## Phase 6 — Validation and production import

Priority: P3

Validation:

- Missing references.
- Duplicate parts.
- Invalid catalogue links.
- Missing media references.

Import must support:

- Local test database.
- Production database migration.
- Future data partitioning.

## Database strategy

Separate:

```
Vehicle metadata

Catalogue structure

Parts

Applicability

Translations

Media references
```

Large media assets are not stored inside relational tables.

## Initial acceptance criteria

- [ ] File inventory parser implemented.
- [ ] JEPC model hierarchy imported.
- [ ] VIEPS Range mapping implemented.
- [ ] XK Range imported end-to-end.
- [ ] XJ Range imported end-to-end.
- [ ] XF Range imported end-to-end.
- [ ] Catalogue hierarchy imported.
- [ ] Part references resolved.
- [ ] Applicability stored as generic rules.
- [ ] Media conversion pipeline defined.
