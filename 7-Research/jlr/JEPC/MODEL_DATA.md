# MODEL_DATA — JEPC applicability data model evidence

## Bounded source evidence

The [XK audit](../../JEPC_XK_SOURCE_AUDIT.md) is the evidence baseline. The following installed files provide the bounded source sample under `C:/Program Files/JEPC/applications/JEPC`:

- `drilldown/pl_id_3187/L0/Itm_M3187_C11096_I1_L0.xml`;
- `drilldown/pl_id_3187/Itm_M3187_C11096_I1_attributes.xml`;
- `drilldown/pl_id_3187/tl_M3187_C11096_attributes.xml`.

The item file again contains HNA9670BA/application 93491 beneath `To VIN (023699)` and HJB9670AA/application 151439 beneath `From VIN (023700)`. The applicability rows are:

```text
93491,[C,  023699,1,0]
151439,[C,  023700,0,0]
```

The top-level file repeats item key `1` for those two boundaries. This does not justify collapsing them into one interval. The source record identity, application identity and canonical PART identity are different.

### Model bounds

One-sided item conditions must be combined with model breadcrumbs and JLHT production/VIN documentation. Inspection of `JEPCFiles/menus/models_l_id_0.xml` confirms:

| Model | Source label boundary |
|---|---|
| 3187 | XK8 Coupe/Convertible up to (V) 042775 |
| 3178 | XK8 Coupe/Convertible From (V) A00083 To (V) A30644 |
| 3173 | XK8 Coupe/Convertible From (V) A30645 |

JLHT documentation supplies model 3187's start and model 3173's end. Where exact values/pages are not present in this bounded evidence set, retain the boundary as unresolved rather than inventing a value.

For the airbag example, application 151439 can have a derived effective interval 023700 through 042775 under verified model ownership and comparator rules. Application 93491 can be bounded from the documented model start through 023699. Preserve the original item conditions and inherited model evidence alongside these derived intervals.

This corrects the initial assessment: a one-sided item record alone does **not** prove a required `vin_range` schema redesign. Existing complete-range records may be reused when their required fields are established. The remaining model gap is explicit occurrence/context pairing, derivation provenance and combination semantics, including unresolved cases.

### Item versus application terminology

Item `1` is the numbered Passenger airbag module position/function in category `11096` and its diagram. Application `93491` supplies HNA9670BA for that item under one condition; application `151439` supplies HJB9670AA under another. JEPC's top-level filtering determines whether the numbered item remains visible; application filtering distinguishes candidate part rows. Neither terminology requires a destination decision-node entity.

The repository sample `JEPCFiles/menus/pl_id_3187_attributes.xml` includes `11149,[A6,913,1,0,1]` and positive A6/A23 tuples. This establishes raw group/value/flag examples, not human names for those groups.

No whole-installation traversal, full importer run or stock mutation was performed.

## Reproducible source probes

Run from the repository root:

```text
node 7-Research/jlr/JEPC/probe_jepc_applicability.mjs
```

The script runs the repository's `JEPCFiltering.js` functions in a bounded VM context. It does not implement a replacement evaluator. Its SHA-256 on the inspected source is `552c548a01e31cecfc416dc5452d659a5a5f645041ee1abb5ef05463c0fc96dd`, matching the prior installed-source audit fingerprint.


| Probe | Observed result | Requirement implication |
|---|---|---|
| Four padded serial inputs around 023699/023700 | Upper comparison accepts equality at 023699; lower comparison accepts equality at 023700. | Preserve one-sided bounds and explicit inclusivity. |
| Repeated top-level item key with opposite bounds | Item remains visible when one boundary record passes. | Preserve alternatives and filter scope. |
| Same repeated boundary arrays at application scope | Candidate is removed when a boundary fails. | Duplicate IDs cannot imply one universal combination rule. |
| Unpadded serial against padded raw boundary | The isolated function returns application 151439 for string `023699`. | Raw formatting/coercion matters; validate the complete parser/input path before choosing normalization. |
| Synthetic matching A6 exclusion plus matching A23 group | Application is removed, but category candidate survives. | Category visibility is not an occurrence fitment assertion. |
| Required A6 source group absent from supplied vehicle attributes | Source leaves application candidate visible. | Unknown vehicle input must remain distinct from verified applicability. |
| Six padded A-series inputs at application boundaries and the 3178 model end | 151441 through A00115, 150742 from A00116 through A11050, 171081 from A11051; the isolated function still returns 171081 for A30645. | Application filtering alone does not apply the parent model's A30644 endpoint. Effective scope requires the model intersection. |

The attribute combinations are synthetic function inputs using observed token vocabulary. They are not asserted to occur as a combined record in JEPC. Padded serial probes deliberately isolate comparison behavior; the unpadded result is not evidence of a live JEPC UI defect. Source parsing, user-input normalization and complete end-to-end execution are outside these probes.

## Verified model gaps

Inspected migrations `0004_part_occurrence_context.sql`, `0006_part_vehicle_vin_applicability.sql` and `0008_part_fitment.sql`, and the current PART field dictionary.

1. Independent PART-level model and VIN links cannot encode which model/VIN/attribute combination belongs to which occurrence.
2. `vin_range` requires prefix, start and end. It can hold complete effective intervals when all fields are established, including inherited model bounds. It cannot by itself preserve a one-sided source predicate and the evidence chain used to derive the complete interval. This is a source/derivation requirement, not proof that every effective interval needs a schema change.
3. `part_fitment` has no condition-set identity, Boolean grouping, interpretation version or completeness state. Rows can preserve source tuples but do not define a verified evaluation algorithm.
4. Fitment uniqueness includes occurrence/state/group/key/value/flag but excludes evidence identity. Identical tuples from distinct source rows cannot retain evidence multiplicity in that row structure alone.
5. Existing `applicable` default and `verification_status` text do not establish complete source coverage or positive vehicle fitment.

These are representation gaps, not claims that basic stock/part search is broken or that breadcrumbs cannot establish model boundaries. The model requires reuse of established range entities with explicit occurrence binding and derivation evidence.

## Data-model requirements

Adopt occurrence-bound applicability assertions with complete alternative condition sets, typed serial/attribute predicates, independent source evidence and explicit incomplete/unavailable states. Keep the current PART identity and stock boundary.

Rejected simplifications:

- Independent PART-to-range lists are smaller, but lose combinations and can manufacture applicability through cross-joining.
- Source tree entities are now retained for catalogue browsing, occurrence context and human-readable filter candidates. They remain separate from the normalized applicability evaluator and must not substitute for grouped source predicates.
- A general arbitrary Boolean expression engine adds scope and can hide source structure in opaque payloads. The proposal starts with finite, inspectable relational sets and quarantines mappings that cannot be safely represented within bounded processing.

Source identity mapping, comparator semantics and attribute mappings must remain evidence-qualified. No universal JEPC translation may be inferred from the bounded samples.

## Evaluation cases

The evidence set covers one-sided bounds, PART coverage across sub-models, repeated headlamp application paths, market scope below a shared model, occurrence/model pairing, correlated alternatives, scoped exclusion, missing input, unknown alternatives, incomplete evidence, conflicts, repeat import and language-independent PART identity with language-qualified source-tree evidence.

These cases define the required evaluation boundaries; unresolved semantics remain explicitly unresolved.

## Cross-sub-model evidence

Catalogue extracts and targeted installed-file reads show HJB9670AA and HJE9042AB continuing into another sub-model without requiring installation-wide enumeration:

| Model/category/item | Application | PART | Displayed serial condition |
|---|---|---|---|
| 3178/9504/1 | 151441 | HJB9670AA | Through A00115 |
| 3178/9504/1 | 150742 | HJB9670AB | From A00116 through A11050 |
| 3178/9504/1 | 171081 | HJE9042AB | From A11051 |
| 3173/9502/1 | 171082 | HJE9042AB | No additional serial condition on the item row |

Model 3187's HJB9670AA/application 151439 is established above. The new evidence demonstrates why PART identity must span sub-models while source occurrences and model-bounded assertions remain distinct. It does not establish a continuous numeric-to-A-series interval, supersession or interchangeability.

The exact same-name application-attribute sidecar for 3173/category 9502/item 1 was not present at the checked path. Its item row has no serial header. Neither observation proves absence of parent/category/other conditions; complete context validation remains necessary before marking its derived applicability verified.

Paths below are relative to the installation root; SHA-256 identifies the inspected bytes.

| Path | SHA-256 |
|---|---|
| `drilldown/pl_id_3178/L0/Itm_M3178_C9504_I1_L0.xml` | `defba12cc7214dcc6f178b28f758d6735c1e4c0fdaf953d5fba781e50fa50e3d` |
| `drilldown/pl_id_3178/Itm_M3178_C9504_I1_attributes.xml` | `4fa3b6dc28c7357086c2ce2b9aaa8464c5e97c459d8e2b9f69a1f0a0f029ba61` |
| `drilldown/pl_id_3173/L0/Itm_M3173_C9502_I1_L0.xml` | `66b092bf3a508c8c4a0d1ab1612cbe3cbba62922b2e77b7be167c12027b0654b` |
| `drilldown/pl_id_3178/L0/tl_M3178_C9504_L0.xml` and `drilldown/pl_id_3173/L0/tl_M3173_C9502_L0.xml` | `0cff6d8f457f28206752d9408ca4c3561a9093c179eefa687c5b5a84199c49c0` |

## Headlamp terminology and bundle trace

A bounded local `rg -l -F` search for `LJA4513AF` and `LJA4501AG` in model folders 3183/L0 and 3187/L0 returned only these two item files in that selected language/profile scope. This is not an installation-wide coverage claim. Only matching files and their explicit dependencies are part of this evidence set.

| Bundle scope | Canada/USA powerwash example | Other early-XK non-powerwash example |
|---|---|---|
| Model/category/item/language | 3183 / 8067 / 1 / L0 | 3187 / 8069 / 1 / L0 |
| PART / application | LJA4513AF / 145240 | LJA4501AG / 145251 |
| Category menu | `menus/L0/pl_id_3183_l_id_0.xml`, category parent 8065 | `menus/L0/pl_id_3187_l_id_0.xml`, category parent 8068 |
| Category popup | `drilldown/pl_id_3183/L0/cat_M3183_C8067_L0.xml` | `drilldown/pl_id_3187/L0/cat_M3187_C8069_L0.xml` |
| Numbered items | `drilldown/pl_id_3183/L0/tl_M3183_C8067_L0.xml` | `drilldown/pl_id_3187/L0/tl_M3187_C8069_L0.xml` |
| Item/application rows | `drilldown/pl_id_3183/L0/Itm_M3183_C8067_I1_L0.xml` | `drilldown/pl_id_3187/L0/Itm_M3187_C8069_I1_L0.xml` |
| Top-level sidecar | `drilldown/pl_id_3183/tl_M3183_C8067_attributes.xml` | `drilldown/pl_id_3187/tl_M3187_C8069_attributes.xml` |
| Application sidecar | Same-name `Itm_M3183_C8067_I1_attributes.xml` absent at checked model-root path | `drilldown/pl_id_3187/Itm_M3187_C8069_I1_attributes.xml` present |
| Illustration reference | `tm6269c` | `tm6173d` |

Both `menus/pl_id_<model>_attributes.xml` files exist. The bundle also depends on model-list bounds and ancestor evidence. The exact `flash/images/<illustration>.jpg` and `flash/xml/<illustration>.xml` paths are present for both references. Presence does not establish decoding or hotspot coordinate correctness.

LJA4513AF/application 145240 occurs four times: Canada or USA, each with `Except headlamp levelling` or `headlamp powerwash`, followed by LH side. The selected USA/except-levelling row ID is 1100110001. The top-level sidecar contains item 1 with A21 values 120 and 121; no dictionary mapping of these codes is claimed here.

LJA4501AG/application 145251 occurs twice: `headlamp levelling → Except Japan → RHD → LH side` (row 110080001), and `Except headlamp powerwash → Except Japan → RHD → LH side` (row 1100310001). Its application sidecar contains `145251,[A23,157,0,0]`, while the corresponding LHD rows use A23/154. This is corroborating context, not a universal code dictionary. The sidecar does not encode all the visible ancestor descriptions.

The raw source headings, selected row IDs and sidecar tuples are observed. Their complete Boolean translation, equipment semantics across category/title and option branches, and applicability beyond the selected scope still require mapping validation. Do not flatten the displayed alternatives indiscriminately or label missing application sidecars as missing all conditions.


Selected source-file SHA-256 fingerprints:

| File, relative to installation | SHA-256 |
|---|---|
| `drilldown/pl_id_3183/L0/Itm_M3183_C8067_I1_L0.xml` | `82de7620c3896e0c54381e01e14e18c287f3a6543e4bb4556cd82986b95a9460` |
| `drilldown/pl_id_3183/tl_M3183_C8067_attributes.xml` | `a12287fd9a79448dcc64200266512ad188f15d4d31dba77b6ecd907fd8ee4bbf` |
| `drilldown/pl_id_3187/L0/Itm_M3187_C8069_I1_L0.xml` | `1c9a04792c6bdd53b8525380dbb36866d323c83b9a6e18cb0e5a0a96c3ba5887` |
| `drilldown/pl_id_3187/Itm_M3187_C8069_I1_attributes.xml` | `5c9794038c3e821e69b7efe4849da5d2d62a8d6efcc3d28a6fced994ee0265df` |

### Later-model market scope

A later-model headlamp example with `($)` in the category title is present in model `3178`, category `8059`, `HEADLAMP ASSEMBLY-NON POWERWASH ($)`, image `tm6269b`, in `drilldown/pl_id_3178/L0/cat_M3178_C8059_L0.xml`.

`drilldown/pl_id_3178/L0/Itm_M3178_C8059_I1_L0.xml` contains Canada and USA branches. Application 145267/LJA4511AG occurs under LH-side paths for both markets and the alternative `Except headlamp levelling` / `Except headlamp powerwash` headings. RH-side rows use application 145265/LJA4510AG. The source row is `RH side`; the `RG side` form is a transcription error.

The top-level sidecar `drilldown/pl_id_3178/tl_M3178_C8059_attributes.xml` contains item 1 with A21/120 and A21/121. The sample supports Canada/USA association at category/application level; it does not establish a universal expansion of `($)` or the treatment of Mexico/other markets. Original text is retained while geographic vocabulary mapping remains open.

## Occurrence-tree clarification

Subsequent JEPC tree investigation established a simpler and safer import boundary than attempting to decode every raw applicability tuple into display text.

The source item tree already contains the human-readable descriptions JEPC presents to the user. A PART leaf is linked to an application identifier, and the corresponding applicability sidecar preserves the raw machine predicates. The importer can therefore preserve both without manufacturing a positional code-to-description mapping:

```text
catalogue/category ancestry
    -> top-level item description
    -> ordered item-tree descriptions
    -> PART occurrence
         + applicationId
         + raw applicability rule/predicates
         + source evidence
```

The complete occurrence path is first-class browse/evidence data. Raw applicability remains the source for verified Boolean evaluation. The tree is not itself the predicate evaluator.

The same model supports reverse lookup: a PART-number search returns every source occurrence and full path for that PART. Catalogue filtering operates on occurrences first and projects distinct PARTs from the surviving set.

Semantic mappings from source descriptions into normalized VIEPS facets are a later enrichment layer and must not alter the source descriptions or raw predicates.

Multilingual source import must not assume one identical tree with translated labels. Preserve language-specific tree structure independently where JEPC differs, while keeping canonical PART identity shared when source identity supports it. Cross-language path/occurrence reconciliation is derived and must be deterministic.
