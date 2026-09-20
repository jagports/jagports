# JEPC Reverse Engineered Data Structure

## Purpose

Reverse engineered notes from JEPC HTML, JavaScript and XML files.

The key finding is that JEPC is a conditional tree system. Parts are
reached through a navigation tree containing VIN/chassis and vehicle
attribute decisions.

## UI Flow

    Model
     |
    Category tree
     |
    Breadcrumb navigation
     |
    Drilldown tree
     |
    Applicability filtering
     |
    Part

## Main Files

### JEPCProductDrillDown.html

Defines the drilldown UI.

### JEPC.js

Contains image lookup logic.

### categoryMenu.js

Creates category navigation.

Category structure:

    category_id
    parent_category_id
    description

### JEPCFiltering.js

Contains:

    filterCategoryMenu()
    filterDrillDownTopLevel()
    filterDrillDownItem()
    filterOnBreakPoint()
    filterOnAttributes()

Filtering uses:

    tree data
    +
    applicability rules
    +
    serial/chassis
    +
    vehicle attributes

## XML Structure

### cat\_\*\_L0.xml

Category tree.

Example:

    [12355,ROAD WHEEL BADGE,1]

Fields:

    category_id
    description
    has_children

### tl\_\*\_L0.xml

Translations.

### Itm\_\*\_L0.xml

Drilldown tree and parts.

Contains:

    node IDs
    descriptions
    part IDs
    part numbers
    image references

Rows are not always parts. Some are navigation/application nodes.

## Applicability Rules

Category:

    menus/pl_id_xxxx_attributes.xml

Part:

    drilldown/pl_id_xxxx/Itm_*/_attributes.xml

Example:

    12333,[A6,3271,0,0][A23,154,0,0][C,M78314,0,0]

Meaning:

    object_id
    attribute group/value rules
    chassis rules

## Attribute Dictionary

Rules contain codes only.

Definitions are in language menu XML files:

    menus/L-*/pl_id_*/_l_id_*.xml

Example:

    [3470,3204,'SPEED CONTROL ACTUATOR-6.0 LITRE',1]

Meaning:

    value = 3470
    text_id = 3204
    description = SPEED CONTROL ACTUATOR-6.0 LITRE

## VIEPS Target Schema

    model
    category
    epc_node
    part
    applicability_rule
    attribute_value
    translation
    media_asset

Import:

    cat_*_L0.xml
        -> category

    tl_*_L0.xml
        -> translations

    Itm_*_L0.xml
        -> nodes and parts

    *_attributes.xml
        -> applicability rules

    language XML
        -> attribute dictionary

## Conclusion

JEPC already contains the required information:

-   model hierarchy
-   category hierarchy
-   drilldown tree
-   VIN/chassis conditions
-   vehicle attributes
-   part numbers
-   translations

VIEPS should normalize this data and add direct VIN and part search
while preserving the original EPC tree context.
