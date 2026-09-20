# SPEC_JEPC_IMPORTER

## Purpose

Define the implementation approach for importing JEPC source data into the VIEPS data model.

This document describes how JEPC files are processed.

Related:

- `SPEC_JEPC_DATA.md` — JEPC source data structure and findings.
- `../../../../internet/jagports/solution/vieps/SPEC/MODEL_PART_APPLICABILITY.md` — normalized VIEPS applicability model and persistence contract.

## Import principles

The importer must:

- Preserve JEPC identifiers and raw source records.
- Normalize data into VIEPS structures without destroying source semantics.
- Separate raw source identity from interpreted labels.
- Preserve complete catalogue decision-tree paths as evidence.
- Preserve applicability sidecars separately from tree text.
- Keep unknown applicability groups and values opaque rather than guessing.
- Support incremental processing and reproducible reprocessing.
- Avoid loading the complete JEPC dataset into memory.
- Never depend on obsolete JEPC server endpoints for production import or fitment.

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
        +---------------------+
        |                     |
        v                     v
 XML Importer           Media Importer
        |
        +-------------------------------+
        |                               |
        v                               v
 Raw catalogue/applicability      Attribute evidence
        |                               |
        +---------------+---------------+
                        |
                        v
                 VIEPS Database
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
- Preserve relative source paths.

Recognized files include:

- `models_l_id_0.xml`
- `pl_id_*`
- `cat_*`
- `tl_*`
- `Itm_*`
- `*_attributes.xml`
- local price XML
- illustration JPG
- hotspot XML
- other media files

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
- Preserve source model/sub-range identity separately from normalized Range.

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
Catalogue/category metadata

tl_Mxxxx_Cyyyy_L0.xml
        |
        v
Top-level decision tree

Itm_Mxxxx_Cyyyy_Ix_L0.xml
        |
        v
Item decision tree + part leaves + application IDs
```

Requirements:

- Preserve parent/child relationships.
- Preserve source order where required for reproducibility.
- Preserve every displayed tree label.
- Preserve part number and application ID on leaves.
- Treat repeated paths as source evidence; do not assume repeated part leaves are separate canonical PARTs.
- Do not describe `tl_*` as only translations; it is part of the catalogue decision tree.
- Preserve the complete ancestor path to each part leaf.

Example evidence path:

```
Carpet
  main floor
    RH
      Coffee
        LHD
          GJA9460BJSDC
```

The importer must retain enough source structure to distinguish:

- physical part position (`LH/RH`);
- steering configuration (`LHD/RHD`);
- colour/material labels;
- VIN/serial branches;
- other catalogue-only grouping.

## Phase 4 — Applicability import and attribute interpretation

Priority: P1

Applicability must first be imported as generic raw rules.

### Raw storage

Store:

```
ApplicabilityRule
 |
 +-- application_id
 +-- ConditionSet
       |
       +-- AttributeCode
       +-- Value
       +-- Flags
       +-- SerialConstraint
```

Requirements:

- Preserve raw `A<group>` IDs.
- Preserve raw attribute value IDs.
- Preserve include/exclude flags.
- Preserve `C` serial values as strings.
- Preserve every matching source row/path.
- Do not hard-code a closed attribute taxonomy.
- Unknown groups and values remain importable.

### Serial interpretation

Observed source behavior:

- `[C,<serial>,0,...]` = lower/FROM bound.
- `[C,<serial>,1,...]` = upper/TO bound.
- two `C` predicates on one record can form a range;
- repeated applicability records can form alternatives.

The importer must preserve the raw predicates and only mark a normalized interpretation verified when the comparator/domain is established for that source scope.

### Attribute-decoding evidence pipeline

Attribute interpretation is not a manual fixed lookup table.

For each part/application:

```
Itm/tl tree path
      |
      +-- application_id
              |
              +---------------------+
                                    |
                           *_attributes.xml
                                    |
                                    v
                         raw A-group/value rules
```

The importer or an analysis stage must correlate the raw rule with the full tree ancestry.

Example:

```
Tree:
Carpet > main floor > RH > Coffee > LHD > GJA9460BJSDC

Rule:
[A155,2932][A23,154]
```

This can support:

```
A155=2932 -> Coffee
A23=154   -> LHD
```

but does not make `RH` an applicability attribute.

### Correlation rules

A derived label may be stored only when evidence supports it.

Required behavior:

1. Join tree leaf and applicability record by source application ID.
2. Retain the complete tree ancestry.
3. Aggregate the same `A<group>=<value>` pair across independent occurrences.
4. Compare sibling values within the same attribute group.
5. Promote a value label only when repeated evidence is consistent.
6. Keep ambiguous or conflicting mappings unresolved.
7. Never infer a group label merely from one example.
8. Never merge two source groups because they share a display value.

### Attribute interpretation provenance

Store interpretations separately from raw predicates.

Recommended logical shape:

```
attribute_group_id
attribute_value_id
group_label          nullable
value_label          nullable
label_source         source-ui | derived-tree | unknown
confidence           verified | strong | provisional | unknown
```

Raw IDs remain canonical even if labels later change.

### Known X100 evidence

The current source study supports several useful mappings, but these are evidence for X100 and not a declaration of a universal closed schema.

Historical `VinDecode.js` exposes five editable UI groups:

```
A6  Engine variant
A21 Market
A23 Steering
A24 Transmission
A56 Trim level
```

These are specific UI mappings. The historical VIN service could return additional arbitrary vehicle attributes, so the importer must not model only these five groups.

Current repeated X100 tree/application correlations support value labels including:

```
A23=154   LHD
A23=157   RHD

A155=2787 Cream
A155=2899 Oatmeal
A155=2901 Sable
A155=2908 Teal
A155=2909 Green
A155=2923 Shadow grey
A155=2924 Flint grey
A155=2927 Warm charcoal
A155=2932 Coffee

A156=2793 Oatmeal
A156=2798 Teal
A156=2808 Warm charcoal
A156=2811 Cream
A156=2813 Ivory
A156=2816 Coffee
A156=2819 Cashmere

A157=2795 cloth
A157=6256 leather
A157=6258 ambla/leather
A157=6261 sports cloth
```

`A37` currently behaves as a body/body-configuration dimension in X100 evidence but its official label remains provisional.

The importer must keep `A155` and `A156` separate even when both resolve to the same visible colour such as Warm charcoal.

### Incomplete evidence

Application sidecars alone are not proof of complete visible applicability.

A condition can also be represented in:

- source model/category context;
- top-level tree path;
- item tree path;
- serial branch;
- ordinary physical-location branch.

Therefore:

- preserve the tree path separately;
- preserve raw sidecars separately;
- do not fabricate missing conditions;
- unresolved applicability must remain unavailable/unverified under the VIEPS applicability contract.

## Phase 5 — Media import

Priority: P2

Source media includes:

```
JPG
GIF
SWF
flash/xml hotspot data
```

The current JEPC catalogue uses separate illustration and hotspot resources where available.

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
- source path
- hotspot relation where applicable

Binary assets are stored separately from relational data.

## Phase 6 — Validation and production import

Priority: P3

Validation:

- Missing references.
- Duplicate canonical PART candidates.
- Application IDs not reconciling to expected source rows.
- Invalid catalogue links.
- Missing applicability sidecars where expected.
- Unknown or conflicting attribute mappings.
- Missing media references.
- Physical `LH/RH` accidentally conflated with steering `LHD/RHD`.
- Different source attribute groups accidentally merged by common label.
- Serial values altered by numeric conversion.

Import must support:

- Local test database.
- Production database migration.
- Future data partitioning.
- Repeatable import with stable source identity and retained evidence.

## Database strategy

Separate:

```
Vehicle metadata

Catalogue structure / tree evidence

Parts and occurrences

Applicability

Attribute dictionary + interpretation provenance

Translations

Media/hotspot references
```

Large media assets are not stored inside relational tables.

## Initial acceptance criteria

- [ ] File inventory parser implemented.
- [ ] JEPC model hierarchy imported.
- [ ] VIEPS Range mapping implemented.
- [ ] XK Range imported end-to-end.
- [ ] XJ Range imported end-to-end.
- [ ] XF Range imported end-to-end.
- [ ] Catalogue hierarchy and complete decision-tree paths imported.
- [ ] Part leaves retain source application IDs.
- [ ] Raw applicability stored without requiring decoded labels.
- [ ] Serial predicates preserve source string values and bound flags.
- [ ] Attribute decoding can join application IDs to tree ancestry.
- [ ] Derived labels retain raw group/value IDs and provenance.
- [ ] Unknown/ambiguous attribute mappings remain unresolved rather than guessed.
- [ ] Physical LH/RH and steering LHD/RHD remain distinct.
- [ ] Media conversion pipeline defined.
