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
             +-- catalogue/category ancestry
                   |
                   +-- top-level item description
                         |
                         +-- item-tree description nodes
                               |
                               +-- PART occurrence leaf
```

The catalogue/category ancestry, top-level item description and item-tree description nodes form one user-visible occurrence path. Preserve the source boundary between these scopes for provenance even when a UI presents them as one continuous tree. A flattened path string is diagnostic/presentation output, not structural identity.

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

## Occurrence and applicability model

Applicability is not only a VIN range, and the source PART leaf must not be detached from the exact tree occurrence in which it appears.

General source model:

```text
PART
 |
 +-- Occurrence
       |
       +-- catalogue/category ancestry
       +-- top-level item description
       +-- ordered item-tree descriptions
       +-- applicationId
       +-- ApplicabilityRule
             |
             +-- ConditionSet
                   |
                   +-- raw predicate tuple(s)
```

Rules:

- A canonical PART may have many occurrences.
- Preserve the complete ordered source path for each occurrence.
- Preserve source node IDs/parent IDs/order where available; do not use concatenated description text as the node identity.
- Store raw JEPC attribute codes, values and flags.
- Preserve the application identifier linking the PART leaf to applicability sidecars.
- Do not hard-code or invent meanings of attribute codes until verified.
- Do not require code-to-description decoding in order to import the human-readable occurrence tree: the JEPC tree already carries source-visible descriptions.
- Keep applicability separate from canonical PART identity while binding it to the exact occurrence/source context.

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
2. `RH` and `LHD` are separate labels in the source path. `LHD` correlates with `A23=154` in this application. `RH` is present as an explicit `Itm_*_L0.xml` tree node, but its source semantics and whether it is represented elsewhere by another predicate, scope or occurrence relationship remain unresolved.

Do not infer that `LH/RH` is merely presentation or a physical-position dimension from the absence of an extra tuple in one sidecar row. Preserve the tree node and investigate its relationship to applicability independently from `LHD/RHD`.

## Generic attribute decoding

Raw JEPC group/value identifiers are canonical source evidence. Human-readable meanings must be recovered through deterministic source joins, not statistical correlation or semantic guessing.

### VIN token normalization

The VIN decode response exposes vehicle attribute tokens without the applicability prefix, for example:

```text
[37,614]
```

The original JEPC `AJAX_Util.js` converts the first token element before filtering:

```text
[37,614]
   ->
[A37,614]
```

It does this by parsing `vinDecodeTokens` and prepending `"A"` to the attribute group ID. The normalized token is then compared against the `A<group>,<value>,...` predicates in category, top-level and item applicability sidecars.

The `A` prefix is therefore a runtime applicability namespace marker added by JEPC code; it is not part of the numeric `AttributeID` returned by VIN decode.

### Deterministic source-join procedure

When an unknown `A<group>,<value>` predicate is encountered, the importer/research tooling must attempt to resolve it from JEPC source evidence using exact joins:

```text
[A<group>,<value>,...]
        |
        v
find exact predicate occurrences in *_attributes.xml
        |
        v
retain owning scope and application/category/top-level ID
        |
        v
join the same source identifier to the corresponding *_L0.xml tree
        |
        v
walk that exact leaf's ancestor path
        |
        v
collect source-visible human-readable labels
```

Rules:

- The join key must be the exact source identifier for that scope, such as the item application ID.
- Tree labels are evidence only when they belong to the exact joined occurrence/path.
- Repetition across independent occurrences is useful validation, but repetition alone is not sufficient to invent a semantic mapping.
- If exact joins produce different candidate meanings, retain all evidence and mark the mapping unresolved/ambiguous.
- Do not infer group meaning from nearby labels, frequency, category membership, or absence of another predicate.
- Preserve the original group ID, value ID, raw tuple, source scope, application ID, model/category/item identity and full path even after a label is established.

Recommended mapping fields:

```text
source_attribute_group_id
source_attribute_value_id
group_label              nullable
value_label              nullable
resolution_status        exact_source_join | ambiguous | unresolved
mapping_evidence
mapping_version
```

The original IDs remain authoritative source identifiers.

### X100 source-resolved examples

These mappings are specific to the observed X100 JEPC source and must not be promoted into a universal Jaguar taxonomy without corresponding source evidence.

| Group/value | Source-resolved interpretation | Evidence |
|---|---|---|
| `A37=614` | Convertible 2+2 | Application `120140` in `Itm_M3187_C5681_I2_attributes.xml` joins exactly to the `Convertible 2+2` path in `Itm_M3187_C5681_I2_L0.xml`. |
| `A37=615` | Coupe | Application `120137` in `Itm_M3187_C5681_I1_attributes.xml` joins exactly to the `Coupe` path in `Itm_M3187_C5681_I1_L0.xml`. |
| `A37=617` | Convertible | Category/application evidence repeatedly joins this value to Convertible-only source paths/categories; retain exact source evidence with the mapping. |
| `A23=154` | LHD steering | VIN/search UI names group 23 as Steering; item application joins associate value 154 with exact LHD source paths. |
| `A23=157` | RHD steering | VIN/search UI names group 23 as Steering; item application joins associate value 157 with exact RHD source paths. |
| `A155=2932` | Coffee | Exact item application/path joins. |
| `A155=2924` | Flint grey | Exact item application/path joins. |
| `A155=2901` | Sable | Exact item application/path joins. |
| `A155=2908` | Teal | Exact item application/path joins. |
| `A155=2927` | Warm charcoal | Exact item application/path joins. |

Other observed groups and values remain unresolved unless an exact source join establishes their source-visible meaning. Equal display text in different groups does not make the groups equivalent.

## Applicability tuple behavior

Observed JEPC applicability uses at least two predicate families:

- `A` tuples for source attribute group/value predicates and flags.
- `C` tuples for serial/chassis breakpoints.

Within one applicability record, predicates combine as one condition set. Repeated records for the same displayed node/application scope can represent alternative applicability records and must not be flattened into a single conjunction without verifying the source scope.

Serial breakpoint interpretation and attribute include/exclude semantics must follow the original JEPC filtering implementation. Preserve the raw tuple and flags alongside any normalized interpretation so the mapping can be revalidated.



## Human-readable descriptions and filter candidates

The JEPC item tree itself supplies the source-visible descriptions used to present catalogue decisions and breakpoints. These descriptions are part of the imported occurrence context.

For a source occurrence, VIEPS must be able to reconstruct:

```text
catalogue/category ancestry
> top-level item description
> item-tree description
> item-tree description
> ...
> PART
```

The descriptions can later be exposed as filter candidates. VIN descriptions such as `To VIN (...)`, `From VIN (...)` and bounded `From ... To ...` forms may additionally be parsed into normalized convenience ranges, but the exact source text remains preserved.

Description-to-domain mappings are a separate enrichment layer. A source description may map to one or more normalized facets, and the mapping may be context-sensitive. Such mappings must not overwrite the source description or raw applicability evidence.

Raw applicability tuples remain mandatory even when a readable description exists. They provide provenance, source-equivalence evidence and a basis for later vehicle/VIN applicability evaluation.

## Browse and reverse-search behavior implied by the source model

The same imported occurrence model supports both catalogue browsing and PART-number reverse lookup.

Browse:

```text
selected catalogue branch
    -> all occurrences below that branch
    -> optional mapped-description / VIN / applicability filters
    -> surviving occurrences
    -> distinct PART numbers
```

Reverse lookup:

```text
PART number
    -> every imported occurrence
    -> full source path for each occurrence
    -> applicationId + raw rules/predicates + source evidence
```

Filtering removes occurrences first. A PART disappears from a filtered result only when no occurrence for that PART survives the selected conditions.

## Multilingual tree structure

Language must not be modeled as a simple translation table over one assumed universal tree unless source evidence proves that structure.

JEPC may provide structurally different trees for different languages or models. The importer must therefore preserve each language-specific source tree independently, including node IDs, parentage, order and descriptions. Canonical PART identity can remain shared.

Cross-language node or occurrence equivalence is derived data and may be added only when deterministic correspondence is established. Do not duplicate canonical PART identities merely because the same PART appears in several language trees, and do not collapse distinct language trees merely because descriptions appear equivalent.
