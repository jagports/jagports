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
menus/L0/models_l_id_0.xml
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

Applicability must be imported from the JEPC sidecar files and interpreted together with the corresponding catalogue decision-tree path. A third-party indexer that omits `*_attributes.xml` is not sufficient for production applicability import.

Store the raw source first:

```text
ApplicabilityRule
 |
 +-- ConditionSet
       |
       +-- source attribute group/value
       +-- source flags
       +-- serial/chassis predicates
       +-- evidence path / application ID
```

The importer must:

- Preserve every raw `A` and `C` tuple and its source flags.
- Join item-tree leaves to sidecar rows by the source application identifier.
- Preserve the complete item-tree ancestry as evidence; do not keep only a flattened description.
- Keep catalogue installation side (`LH/RH`) distinct from vehicle steering (`LHD/RHD`).
- Preserve repeated application/tree paths. Do not infer that repeated paths are duplicates or merge them into one conjunction.
- Interpret alternative records and within-record conjunctions according to the original JEPC filtering behavior.
- Retain unknown attribute groups/values unchanged rather than guessing their meanings.
- Never depend on the obsolete `*.jepc` VIN-decoder/server endpoints.

### Attribute dictionary derivation

Attribute decoding is an importer/research operation, not a fixed five-field VIN schema.

For every application ID, correlate:

```text
raw applicability tuples
        +
full item-tree ancestry
        +
part occurrence
        =
attribute mapping evidence
```

Repeated independent correlations may establish a human-readable value mapping. Store the source IDs even after a label is established.

Recommended mapping representation:

```text
source_attribute_group_id
source_attribute_value_id
group_label        nullable
value_label        nullable
mapping_status     direct | derived | unknown
mapping_version
mapping_evidence
```

The five IDs hard-coded in `VinDecode.js` are only the selectors exposed by that historical VIN/search UI. They may provide evidence for those individual group names, but they are not the complete JEPC attribute universe.

Unknown mappings must remain available for later reconciliation and must not prevent importing the raw applicability evidence.

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

## Parser behavior learned from JEPC and jPart

The reconstructed jPart implementation is a useful comparison source, not the complete JEPC contract.

Importer behavior should incorporate these observed rules:

- The observed default top menu is `menus/L0/models_l_id_0.xml`; jPart may instead read a configured `TopLevelMenuFile`.
- Category data is read from `menus/L0/pl_id_<model>_l_id_0.xml`.
- Category detail uses `cat_M<model>_C<category>_L0.xml`.
- Top-level item labels use `tl_M<model>_C<category>_L0.xml`.
- Item trees use `Itm_M<model>_C<category>_I<item>_L0.xml`. jPart also contains a lowercase `itm_M` literal, so discovery must be case-safe across filesystems.
- A jPart record with field index 3 greater than zero is treated as a real part leaf. Preserve the original source row and ancestry when applying equivalent detection.
- Keep both the source description and any expanded/rolled-up description; do not overwrite the source wording irreversibly.
- Diagram media is referenced by the category data and resolves to `flash/images/<basename>.jpg` plus `flash/xml/<basename>.xml`.
- jPart does not read the applicability sidecars. That omission must not remove them from the DataImporter bundle.

### Applicability validation example

For X100 model `3187`, application `142207` resolves through the item tree as:

```text
Carpet
  main floor
    RH
      Coffee
        LHD
          GJA9460BJSDC
```

and the sidecar contains:

```text
142207,[A155,2932,0,0][A23,154,0,0]
```

The importer must preserve all of these facts. In particular, `RH` is physical part position while `LHD` is vehicle steering applicability; they are not interchangeable.

