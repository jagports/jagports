# JEPC importer requirements — vehicle context and fitment

## Scope and model boundary

VIN and configuration describe vehicle context. Fitment relates that context and a catalogue role to a part.

“Catalogue role” describes the contextual item/function being fulfilled. It is not a part identity or a requirement for a new table. Establish its mapping to the approved occurrence/category/item model before implementation.

Interpret the source decision logic during import/migration, then expose the resulting relationships through the approved VIEPS Parts Data Model. VIEPS must not require JEPC decision-node traversal to reach applicable parts.

A shared part retains its identity across multiple applicable contexts. Vehicle-to-part selection and part-to-applicable-context lookup may query the same relationships, without copying a vehicle list into every part record or prescribing a new UI workflow.

See [source interpretation and target relationships](JEPC_Reverse_Engineered_Data_Structure-TARGET-on-VIEPS.md) for source-file roles and the distinction between established and unresolved flag meanings. These requirements do not establish a complete VIN decoder.

## Import phases

### Phase 0 — Inventory

Create a JEPC file inventory index from the existing JEPC-files-TREE inventory. Use bounded source reads to resolve the dependencies of the selected dataset.

### Phase 1 — Vehicle scope

Import model hierarchy and VIEPS ranges.

Priority:

1. XK Range (X100, X150).
2. XJ Range (XJ40, X300, X308).
3. XF Range.
4. Remaining ranges.

Language coverage and final tool packaging remain separate decisions.

### Phase 2 — Source catalogue relationships

Process the parent-linked model category menus, category-navigation files, numbered top-level items, item/part records and applicability sidecars at all relevant levels.

- `cat_*`: navigation context and illustration references.
- `tl_*`: numbered top-level items with localized descriptions, not merely a translation lookup.
- `Itm_*`: source decision structure and part/application references.

Preserve category, item and application key scopes and source condition grouping while interpreting the relationships.

### Phase 3 — Fitment transformation

Normalize applicability into vehicle-context/catalogue-role/part relationships. Preserve alternatives, exclusions and unresolved information rather than converting every source branch into an unconditional fitment match.

Illustrative example, not verified fitment:

    S-TYPE
    VIN L52823–M02948
    AIRBAG MODULE-PASSENGER
    XR817554

Other configuration conditions may apply. Cite and validate the exact source rows and complete conditions before treating this as a confirmed mapping. XK remains the first validation dataset.

### Phase 4 — Shared parts

Support a part's relationships to multiple models, VIN/configuration contexts and catalogue roles without unintended duplication of its identity.

Use the approved Parts Data Model; the conceptual relationship does not authorize a parallel schema or a new catalogue-role table.

### Phase 5 — Media

Index related image, item and hotspot associations. Preserve multiple hotspot regions for an item where supplied. Prepare required media conversion during import, but validate hotspot-coordinate conversion separately before claiming correct alignment.

## Acceptance criteria

These are requirements for future implementation, not completed test claims.

- [ ] Verified configuration/context cases return the expected applicable parts and reject explicitly excluded cases.
- [ ] Missing vehicle/configuration information is represented as unresolved applicability, not a confirmed fit.
- [ ] A shared part remains linked to its distinct applicable contexts without unintended duplication.
- [ ] Import/migration tests exercise alternatives, exclusions and condition grouping without requiring source decision-node traversal in VIEPS.
- [ ] Media indexing preserves image, item and hotspot associations; coordinate conversion is validated separately before claiming alignment.

## Evidence and ownership

[JEPC XK source audit](../../../../../7-Research/JEPC_XK_SOURCE_AUDIT.md) records measured source evidence and outstanding validation limits.

The Parts Data Model owns persistent entity definitions. The importer work owns source-to-model transformation and its tests. VIN decoding and hotspot-coordinate research remain separate capabilities; neither is claimed complete by this note.
