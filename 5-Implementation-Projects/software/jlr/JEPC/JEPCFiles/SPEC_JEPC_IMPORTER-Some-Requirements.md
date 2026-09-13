# SPEC_JEPC_IMPORTER

VIN and vehicle applicability belong to the vehicle, not the part.

    Vehicle
     |
     +-- VIN / configuration
            |
            +-- Catalogue role
                   |
                   +-- Correct part

## Import phases

### Phase 0

Create JEPC file inventory index from JEPC-files-TREE.

### Phase 1

Import model hierarchy and VIEPS ranges.

Priority: - XK Range (X100, X150) - XJ Range (XJ40, X300, X308) - XF
Range - Remaining ranges

### Phase 2

Import catalogue hierarchy:

-   cat_Mxxxx_Cyyyy_L0.xml
-   tl_Mxxxx_Cyyyy_L0.xml
-   Itm_Mxxxx_Cyyyy_I\*.xml

### Phase 3

Normalize applicability into vehicle fitment.

Example:

    S-TYPE
    VIN L52823-M02948
    AIRBAG MODULE-PASSENGER
    XR817554

### Phase 4

Support many-to-many relationships.

A part can belong to many models, VIN ranges and catalogue roles.

Model:

    Vehicle
     |
    VIN Range
     |
    Fitment
     |
    Catalogue Role
     |
    Part

### Phase 5

Convert media during import.

Acceptance: - VIN search returns only valid parts. - Shared parts are
supported.
