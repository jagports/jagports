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

Defines drilldown UI and passes logical image identifiers.

Example:

    tk6123

is resolved as:

    flash/images/tk6123.jpg

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

## Attribute / description interpretation

Applicability rules contain raw codes and flags. Do not assume that language-menu rows form a complete attribute-code dictionary.

The item tree already carries the human-readable descriptions JEPC displays for many applicability decisions and breakpoints. A PART leaf's application ID links that readable occurrence path to the corresponding raw applicability sidecar.

Code-to-description mappings, when needed, must be established deterministically from exact source joins and must retain their raw code/value provenance. Tuple order must not be used as a semantic mapping rule.

## Media

Two namespaces exist.

Model images:

    images/<model_id>.jpg

EPC illustrations:

    flash/images/<image_id>.jpg

Images should be stored once and referenced.

## VIEPS Target Concepts

    model / catalogue hierarchy
    source-qualified tree node
    canonical part
    part occurrence
    occurrence-to-tree path
    applicability rule / raw predicate
    optional semantic mapping
    language-qualified source tree
    media asset

Import:

    cat_*_L0.xml
        -> category

    tl_*_L0.xml
        -> top-level item descriptions

    Itm_*_L0.xml
        -> ordered description/breakpoint nodes and PART occurrence leaves

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
-   media references

VIEPS should normalize this data and add direct VIN and part search
while preserving the original EPC tree context.


## Occurrence-first interpretation

The useful source object is a PART occurrence in a complete catalogue/tree context:

```text
catalogue/category ancestry
    -> top-level item description
    -> ordered item-tree descriptions
    -> PART occurrence
         + applicationId
         + raw applicability rules/predicates
```

The same canonical PART can have many occurrences. Catalogue filtering operates on occurrences first and then projects distinct PARTs. Reverse PART-number search returns every occurrence and its complete source path.

A flattened description path is for presentation and diagnostics only; it is not canonical node or occurrence identity.

Multilingual JEPC data may contain structurally different trees. Preserve language-qualified source tree structure independently where it differs rather than forcing all languages into one shared node graph.
