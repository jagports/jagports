# JEPC XK source audit

## Work identity and scope

**Source study**
[Issue #585 — [STUDY] Fetch initial JEPC files for JEPC data format analysis](https://github.com/jagports/jagports/issues/585)

**Research branch**
[PR #586 — [SOURCE] JEPC Code - Add JEPC data structure findings](https://github.com/jagports/jagports/pull/586)

**Downstream importer**
[Issue #355 — IMPL / JEPC Data Importer](https://github.com/jagports/jagports/issues/355)

**Coordinate-conversion research**
[Issue #352 — RESEARCH / Determine JEPC Flash hotspot coordinate conversion](https://github.com/jagports/jagports/issues/352)

Observation date: 2026-09-12. The installation inspected is rooted at `C:/Program Files/JEPC/applications/JEPC`. Source files were read, not modified. The installation includes owner changes and research artifacts; it is not claimed to be an untouched vendor release.

## Accepted product direction

The Product Owner directed this investigation to prioritize XK Range and explicitly rejected reproducing JEPC decision-tree traversal in the new system. Source decision logic must be taken into account during import, then transformed into relationships consumed by VIEPS. This is an accepted destination boundary, not evidence that the transformation is implemented or validated.

[Decision and research continuation record](https://github.com/jagports/jagports/issues/585#issuecomment-5648158099)

Language coverage and final packaging as two or four tools remain open. An intermediate SQL representation is an option, not an approved replacement for the canonical production model.

## Source identity and measured subset

The installed `menus/models_l_id_0.xml` identifies groups 3175 and 7422. The four children of 3175 are 3187, 3183, 3178 and 3173; the child of 7422 is 7420. These five IDs define this audit's drilldown scope.

| Source model ID | L0 files | Shared root files | L0 bytes | Shared root bytes |
|---|---:|---:|---:|---:|
| 3187 | 3,202 | 1,252 | 1,338,353 | 336,169 |
| 3183 | 2,889 | 1,139 | 1,126,033 | 266,387 |
| 3178 | 4,516 | 1,567 | 1,894,521 | 449,211 |
| 3173 | 3,154 | 1,163 | 1,420,523 | 328,789 |
| 7420 | 4,350 | 2,642 | 2,830,607 | 942,346 |

L0 plus files directly in those five model folders: **25,874 files / 10,932,939 bytes** (10.93 decimal MB). Shared root files contain the applicability sidecars; these counts are physical-file counts, not validated canonical record counts.

All language folders and shared root files in the same five model directories total **93,520,436 bytes**. Language folders observed: L0, L-2, L-3, L-4, L-5, L-6, L-7, L-10 and L-11. File counts differ between language folders; equal coverage is not established.

These byte totals exclude menu files, illustrations, hotspot files, pricing and other shared dependencies. They are not an estimate of the final database or complete import package size.

An earlier installation-wide enumeration returned 1,249,873 files, of which 1,137,600 were under drilldown. That enumeration was unnecessarily broad for this study. Use the existing `JEPC-files-TREE.txt` inventory and bounded reads for continued discovery; do not repeat a whole-installation traversal merely to reproduce those totals.

## Verified relationship example

For model 3187, category 11096:

- `menus/L0/pl_id_3187_l_id_0.xml` uses category ID, parent ID, description and a flag. The study samples may place menu files directly in `menus`; installed paths must be resolved.
- `drilldown/pl_id_3187/L0/cat_M3187_C11096_L0.xml` contains a breadcrumb, illustration identifier `tu6333`, and category navigation records. It is not the complete parent-linked model category menu.
- `tl_M3187_C11096_L0.xml` maps numbered items to descriptions, including item 1, Passenger airbag module.
- `Itm_M3187_C11096_I1_L0.xml` contains source decision headers and part rows. Application 93491 links to part HNA9670BA under the To VIN (023699) header; application 151439 links to HJB9670AA under From VIN (023700).
- The item applicability file contains `93491,[C,  023699,1,0]` and `151439,[C,  023700,0,0]`.
- The top-level applicability file contains two records keyed by item 1, one for each boundary. Combining those two records into a single mandatory interval would produce an impossible range and lose the source's alternatives.
- The hotspot resource for illustration `tu6333` associates regions with item numbers, including repeated item 4. Diagram-to-item is not a one-rectangle-per-item relationship.

This describes source evidence only. It does not prescribe decision nodes as VIEPS entities.

## Filtering evidence and remaining semantic work

The inspected PR source `JEPCFiles/js/JEPCFiltering.js` distinguishes category, top-level and application filtering.

For C conditions, the code rejects serials below a type-0 boundary and above a type-1 boundary. Equality therefore survives that comparison. Other attribute conditions use the third field as an exclusion flag. The code handles repeated valid/invalid IDs differently for the filtering levels and only evaluates attribute groups present in the supplied vehicle attributes.

This establishes why a universal start/end pair or universal except-flag interpretation is insufficient. It does not establish a complete Boolean translation, a VIN decoder, attribute dictionaries, source correctness for every case, or production-equivalent fitment. Preserve raw spacing and values while investigating serial comparison semantics.

## Media coverage

The second bracket record of each L0 `cat_*` file yielded **1,051 distinct logical image identifiers**.

| Targeted logical-illustration asset check | Result |
|---|---:|
| Small raster illustration exists | 1,051 |
| Full-resolution raster illustration exists | 951 |
| Hotspot resource exists | 1,007 |
| Existing hotspot XML parsed successfully | 1,007 |
| Hotspot XML parse failures | 0 |
| Hotspot item regions across those files | 8,972 |
| Image/item-number groups containing multiple regions | 404 |

Presence checks do not verify image decoding, image dimensions, pixel identity, hotspot alignment or all item references. The 44 absent same-name hotspot files are unresolved dependency observations, not proof of irrecoverable missing source data. Alternate identifiers, installation completeness and intended noninteractive diagrams have not been investigated.

Absent same-name hotspot identifiers:

```text
ax11065
fb00109
gb00017
pb11482c
pb11486b
pc10798b
pd11476d
pe10838c
pe11074f
pg11013
pg11500
pg13000
ph10832c
ph10837c
ph10842b
ph10856c
ph10857f
ph11588c
ph12099a
pj10840c
pj11230d
pj11343b
pj13001a
pk10877e
pm10878e
pn10975e
pn11039f
pr10624f
pt10819f
pw10573f
pw10773b
pw10789q
pw11773c
pw13003
pw13004
px10779d
px10806f
py10746d
py10844c
td9993a
tw13000
tw6689d
tw7232b
yn13004
```

The local `flash/jepc.xml` declares hotspotImageSizeX 8175, hotspotImageSizeY 8010 and twipsPerInch 1440. Those configuration values alone do not prove a conversion formula. The decompiled viewer's `frame_1/DoAction.as` reports a decompilation error and does not establish executable conversion logic. Coordinate conversion remains with Issue #352.

## Research reliability and prototype limits

The latest inspected commit, `ac46eb0fb4633c771df3d410e801c7ca0560d0bc`, is titled “JEPC Break througth!!!” and dated 2026-09-12 18:21:42 UTC. Its new reverse-engineering note labels top-level item files as translations and proposes an epc_node destination entity. Those claims must not override source evidence or the accepted destination boundary.

Earlier research in `Jagports_vehicle_knowledge 1 research.md`, sections 4.4–4.10, already describes the menu/popup distinction, top-level items and separate hotspot files more precisely. Consult both source evidence and dated research; newest does not automatically mean most accurate.

The inspected `import_to_sqlite.py` is exploratory: it reads only the first two category-popup records, omits menu and top-level applicability imports, discards item field index 9, silently skips non-12-field item records, and appends item/attribute records again on rerun. Its output is not proof of a lossless source representation, validated relational coverage or the approved VIEPS schema.

## Method and verification limits

1. Read the installed model list and resolve the five XK model folders.
2. Enumerate only those five folders for the subset counts, grouping files by language subfolder or model root; sum logical file sizes with stat.
3. Read L0 category popup records and collect their second bracket-record values as logical image identifiers.
4. Check the three known same-identifier illustration/hotspot asset families per identifier.
5. Parse existing hotspot XML with Python ElementTree; count `hotspots/item` elements and repeated `itemno` values within each image.
6. Trace the airbag sample and compare the relevant source filtering code and research descriptions.
7. Keep the measured findings separate from unverified transformation and coordinate assumptions.

No production importer, database migration, full relational validation, idempotency test or visual hotspot-conversion test was completed by this audit. No language exclusion or new storage architecture was approved. The full installation and source media are not copied into this evidence record.

## Selected local source fingerprints

SHA-256 fingerprints identify the inspected bytes, including original line endings. Paths are relative to the installation root. They provide research reproducibility without imposing a production provenance schema.

| Relative source path | SHA-256 |
|---|---|
| `menus/models_l_id_0.xml` | `8efccda972ff571edf205d9cd78cdf7505815cc14be07c64c1eb34df84ce62ce` |
| `menus/L0/pl_id_3187_l_id_0.xml` | `d437dc667bddcae4fe2bcac49a85d03bf3d6cb22a5fcdf1f6a568b0fd4d999bb` |
| `drilldown/pl_id_3187/L0/cat_M3187_C11096_L0.xml` | `c23bbcfac5e62cee2b3688ef27806c0a558a07b4a7d7f998b30e0d0c43301879` |
| `drilldown/pl_id_3187/L0/tl_M3187_C11096_L0.xml` | `09233b4add3e710a6bfec662bb6c467628c384cd4105bce4d9e3daa5834122ef` |
| `drilldown/pl_id_3187/L0/Itm_M3187_C11096_I1_L0.xml` | `f596f1bd8aaeb9114cc0068390ef52e3b01bcc4b4833f93a1383069c3cc81f2d` |
| `drilldown/pl_id_3187/Itm_M3187_C11096_I1_attributes.xml` | `d93bec056bb3095a67583bec3e781c195b75acab27fad18d3891a6169ae86480` |
| `drilldown/pl_id_3187/tl_M3187_C11096_attributes.xml` | `4dc534fb2ecd7847bfaa732054191f8c70abc8af9b987a0ae347ccdcdcc6bc4e` |
| `js/JEPCFiltering.js` | `552c548a01e31cecfc416dc5452d659a5a5f645041ee1abb5ef05463c0fc96dd` |
| `flash/xml/tu6333.xml` | `3a737dc4947fb3f19dcdaf01cad151cb48f80f983008aa42410149c24bbdc464` |
| `flash/jepc.xml` | `091d9b455b837559af3d354843d05c39acf725c24284ca3abc6319b9e1c67b45` |
