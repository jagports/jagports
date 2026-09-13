# JEPC_Reverse_Engineered_Data_Structure

## Hierarchy

    Model
     |
    pl_id
     |
    Catalogue Category
     |
    Catalogue Item
     |
    Part

## File roles

models_l_id_0.xml contains model hierarchy.

cat_Mxxxx_Cyyyy_L0.xml contains catalogue navigation.

tl_Mxxxx_Cyyyy_L0.xml contains translated labels.

Itm_Mxxxx_Cyyyy_I\*.xml contains item and part references.

Itm\_\*\_attributes.xml contains raw applicability:

    [Code,Value,Flag1,Flag2]

## Applicability

JEPC VIN conditions describe vehicles, not parts.

Example:

    From VIN (L52823) To VIN (M02948)
    XR817554

means that S-TYPE vehicles in that VIN range use XR817554.

## VIEPS model

    Vehicle
     |
    VIN Range
     |
    Catalogue Role
     |
    Part

## Many-to-many

A part may be referenced by many models, VIN ranges and catalogue roles.

Do not create Part -\> Vehicle. Create Vehicle + VIN + Catalogue Role
-\> Part.

## Remaining unknowns

-   Attribute code dictionary.
-   Flag meanings.
-   Supersession logic.
-   Media conversion details.
