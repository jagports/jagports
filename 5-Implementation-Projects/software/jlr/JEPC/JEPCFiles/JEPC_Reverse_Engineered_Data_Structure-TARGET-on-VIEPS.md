# JEPC source interpretation and VIEPS target relationships

## Scope and status

This note distinguishes source-file roles from the accepted VIEPS migration direction. It does not define a new production schema. Catalogue-role mapping and complete applicability transformation remain to be established against the approved Parts Data Model.

Source evidence and verification limits: [JEPC XK source audit](../../../../../7-Research/JEPC_XK_SOURCE_AUDIT.md).

## Source hierarchy and file roles

The source links models, categories, numbered catalogue items, decision nodes and part applications. Its decision-node structure is input to interpretation during migration, not the VIEPS operational model.

| Source file family | Role |
|---|---|
| `models_l_id_0.xml` | Model IDs and parent-linked model hierarchy. |
| `menus/.../pl_id_<model>_l_id_<language>.xml` | Parent-linked category records for a model; resolve the actual installed language path. |
| `cat_M<model>_C<category>_L<language>.xml` | Category-navigation context, breadcrumb and illustration reference. |
| `tl_M<model>_C<category>_L<language>.xml` | Numbered top-level items and localized descriptions; item numbers link to item files and diagram hotspots. |
| `Itm_M<model>_C<category>_I<item>_L<language>.xml` | Item decision structure and part/application references. |
| Category `*_attributes.xml` | Applicability keyed by category ID. |
| `tl_*_attributes.xml` | Applicability keyed by top-level item number. |
| `Itm_*_attributes.xml` | Applicability keyed by application ID. |

Preserve the key scopes, repeated records and grouping of applicability conditions. A raw condition can resemble `[Code,Value,Flag1,Flag2]`, but not every field or record variant has a verified interpretation.

## Vehicle context, catalogue role and fitment

VIN and configuration describe vehicle context. Fitment relates that context and a catalogue role to a part.

A part can fulfill a catalogue role in a particular vehicle configuration. “Catalogue role” describes the contextual item/function being fulfilled; it is not a part identity or, by itself, a requirement for a new table. Establish its mapping to the approved occurrence/category/item model before implementation.

Interpret the source decision logic during migration and expose the resulting relationships through VIEPS; do not reproduce JEPC decision-node traversal. A shared part retains its identity across multiple applicable contexts.

Vehicle-to-part selection and part-to-applicable-context lookup may query the same relationships. This does not require copying a vehicle list into each part record or prescribing a new user-interface workflow.

## Illustrative example — not verified fitment

    S-TYPE
    VIN L52823–M02948
    AIRBAG MODULE-PASSENGER
    XR817554

This example illustrates vehicle/VIN/catalogue-role context. It does not establish that every vehicle in the interval uses this part: other configuration conditions may apply. Validate the exact source rows and complete source conditions before treating it as a confirmed fitment mapping.

XK Range remains the first validation dataset. This S-TYPE illustration does not change that priority.

## Established behavior and remaining unknowns

Some flag behavior is established from the consuming code: C-condition boundary direction and A-condition exclusion are distinct. Other fields, code dictionaries and complete transformation semantics remain unresolved.

Outstanding work includes:

- Attribute-code dictionary and unresolved field meanings.
- Catalogue-role mapping to the approved model.
- Complete applicability transformation, including alternatives and exclusions.
- Supersession interpretation beyond already established source behavior.
- Media handling and independently validated hotspot-coordinate conversion.

Keep verified source behavior, accepted target direction and unresolved interpretation distinguishable.
