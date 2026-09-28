# VIEPS Admin UI — Range creation and JEPC Model mapping

**Status:** Specification for independent review  
**Controlling issue:** #884  
**Range taxonomy owner:** #361  
**Normalized model and persistence owner:** #354  
**JEPC import/source-evidence owner:** #355  
**Existing one-page Admin UI:** [UI_Specs_StockAdmin.md](UI_Specs_StockAdmin.md)  
**Parallel, separate suitability-category specification:** #877 / PR #879

## Objective and boundary

Extend the **existing one-page VIEPS Admin UI** with **Ranges & JEPC Models**. An authorized administrator can create normalized Jagports Ranges and explicitly assign imported JEPC Models to one Range each. Range administration concerns vehicle/catalogue reference data. It does not redefine STOCK, normalized suitability dimensions, JEPC navigation categories, or the original imported JEPC Model identity.

The **original imported JEPC Model description remains the visible Model name whether the Model is assigned or unassigned**. `Unassigned` is a mapping status or optional filter, never a substitute Model name and never a reason to hide the row. The UI must not turn missing Range mapping into a claim that the imported Model does not exist.

## Required semantics

| Concept | Definition |
|---|---|
| Normalized Range | One Jagports `model_range` with stable unique `range_code`, display name, identifier, status and provenance. |
| Imported JEPC Model | Source-qualified Model identity preserved by #355, with original description(s), source namespace/dataset, source Model ID, import/version context, source language and available hierarchy/market evidence. |
| Explicit assignment | Approved mapping between one source-qualified imported Model and one normalized Range, including operator, verification and change provenance. |
| Unassigned Model | Existing imported Model with no confirmed Range mapping; its original JEPC description and source identifier remain displayed and searchable. |
| Model/market name | A distinct notion from a Range and from an imported JEPC source Model ID. An imported label is not automatically a normalized name or proof of vehicle-specific identity. |

- One Range may contain **zero to many** imported JEPC Models.
- Each distinct imported JEPC Model identity may have **zero or one** confirmed Range assignment during curation. **Once assigned, exactly one Range applies**. Assigning a second Range requires an explicit reassignment that replaces the old relationship, not a second active link.
- Keep stable source-qualified identity. Models with the same displayed description but different JEPC source IDs, namespaces, market/source contexts or dataset identities must not be silently merged. A repeated version/context row for the **same** source Model should not produce contradictory active Range assignments.
- Do not infer Range assignments from equal or similar names, model year, VIN, engine, body, market, parent navigation label or fixture values.
- Map the imported **Model** to its Range; this action alone does not assert part applicability, VIN applicability, variant identification or verified fitment.
- Preserve the source Model description and original JEPC source records during creation, reassignment, unassignment, retirement and reimport. A Range name change must not rewrite original source labels or stable identifiers.

## One-page Admin layout

Add a section **Ranges & JEPC Models** on the current Admin page, separate from **Existing STOCK / Add / Edit / Delete** and from **Suitability Categories / Descriptions** (#877 / PR #879). No separate dashboard, menu, page or new authentication experience is required.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ PARTS / STOCK MANAGEMENT — existing stock administration unchanged      │
├──────────────────────────────────────────────────────────────────────────┤
│ RANGES & JEPC MODELS                                                     │
│                                                                         │
│ RANGES                                                                  │
│ Range code [ XK_RANGE ]   Name [ XK Range          ] [Create Range]       │
│ Existing: XK Range [Edit name] [Retire when safe]                        │
│                                                                         │
│ IMPORTED JEPC MODELS                                                    │
│ Search original JEPC Model description / source ID [                ]   │
│ Filter: [All] [Unassigned] [Assigned] [Conflict / needs review]          │
│                                                                         │
│ Original JEPC Model description | Source ID / version | Assigned Range  │
│ <original imported description> | <source identity> | Unassigned       │
│ <original imported description> | <source identity> | XK Range         │
│                                                                         │
│ Selected source Model: <original imported JEPC description>             │
│ Source: <namespace / Model ID / dataset / version / language>           │
│ Range: [Choose one existing Range ▼]  [Assign / Reassign] [Unassign]    │
│ Current mapping / provenance / conflict / persisted result             │
├──────────────────────────────────────────────────────────────────────────┤
│ SUITABILITY CATEGORIES — separate #877 section when available           │
└──────────────────────────────────────────────────────────────────────────┘
```

The example row text in angle brackets denotes data read from the imported source, **not** a synthetic replacement title. If source Model description data is genuinely unavailable, show its stable source identifier and an explicit **description unavailable** notice; do not substitute `Unassigned` as the title.

### Range management

- Display existing Ranges and permit an authorized administrator to create a Range using a unique nonempty stable code and nonempty display name.
- Permit editing a Range's display name without changing its stable code or linked Model identities. A code change is not a routine rename; it needs separately defined migration handling.
- A Range with linked imported Models cannot be destructively deleted or retired in a way that silently unassigns them. Require explicit reassignment/unassignment or block the operation with an informative count and error.
- Prevent duplicate code creation and unintended duplicate records. Validate empty/invalid input server-side and show a deterministic persisted result.
- Show active/retired state when retirement is implemented; do not offer retired Ranges as targets for new assignments.

### Imported Model listing and mapping

- Search and list **all imported Models**, including unassigned ones. Display the **original JEPC Model description** prominently, and available source namespace/dataset, Model ID, version, source-language and parent/market scope alongside it.
- Provide explicit **All**, **Unassigned**, **Assigned** and **Needs review/conflict** filters. Filters change only visibility; they do not change or delete records. Empty import, empty search result and failed import are different states.
- Source Model rows remain present after assignment, reassignment, unassignment and refresh. Neither an unassigned state nor a missing normalized Range may blank or replace a source description.
- Select a source Model, choose **one** existing active Range and explicitly save the mapping. When a Model is already mapped, changing the Range is **Reassign** and requires clear confirmation of the old and new Range.
- **Unassign** deliberately removes the curated Range relationship, with confirmation. The Model returns to the Unassigned filter under exactly the same imported description and source identity.
- Display mapping status, last editor/action, source/provenance, verification state and any conflict requiring review. Equal visible descriptions are never sufficient keys for mapping.
- Reimport of the same source-qualified Model preserves its curated mapping when identity is unchanged. If source identities, contextual grouping or evidence change incompatibly, flag a mapping conflict for review rather than silently assigning a Range or rewriting the imported record.
- EN/FI Admin controls, headings and validation use the established UI i18n resources. Source descriptions retain their independently imported JEPC language; switching the Admin UI locale must not rewrite them.

## Data and API contract

Use the **existing canonical** `model_range` identity from #354. The present persistence subset also has `applicability_model_context` with source-qualified `(source_namespace, source_model_id, context_version)` and a nullable `model_range_id`. These are a starting bridge, not permission to invent an independent global JEPC Model taxonomy. #354 and #355 must approve the final source-Model identity, original-description persistence, import reconciliation and mapping-history representation.

Minimum normalized Admin read shape:

```text
RangeAdminRange
  id
  range_code                    stable / unique
  name
  active_or_retired_state
  source / verification

RangeAdminImportedModel
  source_namespace / dataset
  source_model_id
  source_context_version
  source_description_original
  source_description_language
  source_parent / region / market when available
  model_range_id                null until explicitly mapped
  assignment_status            unassigned | assigned | conflict
  mapping_verification / provenance
```

The original description is **source data**, not a derived `model_range.name`. Source Model identifiers, model contexts and normalized market/model display names may need distinct representations. The importer supplies actual source identities and descriptions; synthetic pre-import fixtures must carry a clear `fixture` origin.

Proposed operations for the eventual catalogue Admin API: list/create/edit/retire Range; search imported Models including unmapped; create/change/remove an explicit Model→Range mapping; read back current mapping and audit/conflict state. Exact endpoint names and database additions are implementation choices owned by #354/#355. All mutations must be protected **server-side** by the Admin authorization boundary and must **not** reuse STOCK `/api/stock`. Return deterministic validation, unauthorized, not-found, duplicate-code and conflicting-assignment errors. Read-back must reflect persisted state; no client-only fake success.

Consumer boundaries: an unassigned source Model can still appear under its original JEPC description in source-Model views. It must **not** appear as a verified member of an invented Range. Public Range-filtered browsing and suitability remain governed by #609, #641 and approved occurrence-applicability evidence; this Admin mapping alone does not establish part fitment.

## XK Range pre-JEPC fixture

The normalized fixture described by #361 / [PR #651](https://github.com/jagports/jagports/pull/651) is:

```text
XK Range
├── XK
├── XK8
├── XKR
└── XKR 100
```

These are **sibling market/model-name fixture values** under one Range, not four assumed JEPC source Model IDs. Use real #355-imported Model IDs/descriptions when present; until then, any Model records used to test assignment must be explicitly **synthetic, source-qualified fixtures** and must never masquerade as imported JEPC records.

`XK` is the later market/model name, not the Range parent. `XKR 100` remains a rare, evidence-only individual-vehicle classification; generic XKR models, ordinary VIN interpretation and Range assignment do not prove an individual vehicle is an XKR 100.

## Required specification/implementation tests

1. Create and read back `XK Range`; reject a duplicate `range_code`, invalid code or empty display name.
2. List and search imported Models **before any Range assignment**: every Model keeps its original imported description, source ID and language, with only its mapping status reading Unassigned.
3. Assign two distinct source Model IDs to one Range. The same visible source text under two distinct source IDs remains two rows and may be assigned independently.
4. Reject an attempt to give one Model two active Ranges. Require explicit reassignment; read-back shows one new Range, unchanged source Model description and an audit record.
5. Unassign a Model: it reappears in the Unassigned filter with the **same original JEPC description**, and the retired mapping remains auditable.
6. Retire a Range only if approved relationship handling prevents dangling active assignments. A failed action leaves all records unchanged.
7. Reimport an unchanged source Model without duplicating or erasing its mapping; changed/ambiguous source identity produces an explicit review conflict.
8. Imported-data-unavailable and description-missing states never invent Model names, model IDs, Range memberships or applicability evidence.
9. Unauthorized mutations are rejected server-side; Admin EN/FI locale switching changes controls but not imported source descriptions.
10. Exercise the XK Range sibling fixture vocabulary, including a negative test that generic XKR or ordinary VIN evidence cannot promote an individual vehicle to XKR 100.

## Scope and related work

**This PR is specification-only**; no production Admin UI, migrations, endpoints or fixture importers are claimed implemented. Implementation can proceed against this contract once independently reviewed, with schema/import decisions retained by #354/#355.

- #884 — controlling Admin Range specification Issue.
- #361 / PR #651 — Range taxonomy and accepted XK fixture proposal.
- #354 — canonical model and persistence owner.
- #355 — source import, original Model descriptions and provenance.
- #877 / PR #879 — separate Suitability Categories Admin extension on the same one-page Admin UI.
- #609 — separate future public EPC Range/model/category navigation.
- #641 — normalized suitability filter; does not derive fitment from Range assignments.
