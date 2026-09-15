# JEPC Source Knowledge

## Scope

This file records durable, reusable knowledge specific to the JEPC source dataset and importer interpretation. Repository-wide workflow and VIEPS domain rules remain owned by their existing authoritative sources.

## Model/menu breadcrumb region semantics

JEPC model/menu names can encode market-region scope and must be preserved as source context during import.

For currently verified legacy Jaguar catalogue variants:

- `XK8 Coupe/Convertible - Canada/USA up to (V) 042775` maps to `Region = Americas`.
- `XJ Series (From (V)812317 to (V)F59525 (Canada/Mexico/USA)` maps to `Region = Americas`.
- The corresponding non-Americas variants are treated as `Region = Rest of world excluding Americas` for importer source selection and validation.

Region is vehicle/catalogue context. It is not a property of the canonical part identity. The same part may be referenced from multiple regions, VIN ranges, models, categories or catalogue roles.

## Importer selection principle

Importer source selection must be configurable below the broad VIEPS Range level where JEPC exposes distinct model/sub-range or market variants. A selected import profile may therefore target a specific JEPC model/sub-range together with region context instead of importing an entire Range at once.

This supports bounded, restartable importer development against representative source subsets while preserving the ability to expand coverage later.

## Evidence discipline

Preserve the original JEPC model/menu text and identifiers alongside normalized Region interpretation so later source discoveries can refine the mapping without losing evidence. New market-region mappings must be documented when verified rather than inferred silently from part usage.