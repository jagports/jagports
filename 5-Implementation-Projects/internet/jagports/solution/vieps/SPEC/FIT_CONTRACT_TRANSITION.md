# Fit active-contract transition

## Purpose

VIEPS uses **Fit** as the product, UI, and active-contract term. This transition keeps existing published data readable while consumer routes and payload names move from legacy terminology.

## Persistence rule

Applied migrations are historical evidence and are never rewritten. Migration `0021_fit_contract_aliases.sql` adds read-only Fit views over the existing normalized relations. The views preserve the original IDs, foreign keys, source provenance, append-only mapping revisions, retirement records, and audit history; they do not duplicate or transform rows.

| Active Fit contract | Compatibility source |
| --- | --- |
| `fit_dimension` | `applicability_dimension` |
| `fit_dimension_value` | `applicability_dimension_value` |
| `fit_source_description` | `applicability_source_description` |
| `fit_mapping_revision` / `fit_mapping_current` | description-mapping revision/current view |
| Fit labels, retirement and audit views | existing corresponding relations |

## Route transition

The canonical administrator URL is `/admin-fit`. `/admin-suitability` and `/stock-admin.html` are compatibility redirects while active users transition. The Stock page remains `/admin-stock`.

The public and administrator Fit API transition must publish Fit-named paths and payload labels while accepting legacy paths only as documented compatibility aliases. A later removal migration may happen only after every deployed consumer has moved and a data/contract review has confirmed that no compatibility reader remains.

## Historical storage boundary

The read-only `fit_mapping_revision` alias is distinct from its physical `applicability_description_mapping_revision` table. Migration `0021` does **not** rename `part_fitment.applicability_state`, the occurrence source-evidence tables (`applicability_*` / `occurrence_applicability`), historical migrations or physical SQL indexes. Active Fit terminology must not be mistaken for physical schema names or permission to write through these views.

## Safety boundary

Fit is a presentation and active-contract name. It does not turn a fixture into JEPC evidence, does not infer a source condition, does not change an unavailable or excluded result, and does not authorize rewriting raw source descriptions. Write operations continue to enforce the existing server-side authorization, source provenance, immutable history, and independent-review requirements.
