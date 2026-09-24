# VIEPS Stock Admin — Minimum Add / Edit / Delete UI

## Purpose

This document defines the minimum UI required by Issue #612 to manage operational stock records.

The target is **one functional Stock Admin page** supporting search/list, Add, Edit and Delete. Navigation, menus, dashboards, account UI, decorative application shell, and visual polish are not requirements for this increment.

The operational stock model remains authoritative in [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md), and workflow behavior remains governed by [`../STOCK/SPEC_Admin_Workflow.md`](../STOCK/SPEC_Admin_Workflow.md).

## Visual reference

The concept image under `../UI_CONCEPTS/AdminUI-PartAdd.png` is an informative visual reference for the minimum page. It is not normative. Navigation, menus, branding, account controls, decorative layout details and example values shown in concept artwork are not implementation requirements.

The implementation should prefer the simplest page that completes the workflows below.

## Minimum page

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PARTS / STOCK MANAGEMENT                                            │
│                                                                      │
│ [ Search part number / description / stock             ] [Search]   │
│                                                     [ + Add Part ]   │
├──────────────────────────────────────────────────────────────────────┤
│ EXISTING STOCK                                                       │
│ Part | Qty | Condition | Location | Price | Available | Actions      │
│ ...                                              [Edit] [Delete]     │
├──────────────────────────────────────────────────────────────────────┤
│ ADD / EDIT STOCK RECORD                                              │
│ PART IDENTIFICATION                                                  │
│ [ part number / description                       ] [Search]         │
│ Search results: Part number | Description | Context | [Select]       │
│ [ Use unresolved stock identity ]                                    │
│                                                                      │
│ STOCK DETAILS                                                        │
│ Quantity        [ ]        Available [ ]                             │
│ Condition       [ ]                                                  │
│ Location        [ ]                                                  │
│ Source party    [ ]        Donor vehicle [ ]                         │
│ Source          [ ]        Source reference [ ]                      │
│ Price           [ ]        Currency [ ]                              │
│ Notes           [                                      ]             │
│                                                    [Cancel] [Save]   │
├──────────────────────────────────────────────────────────────────────┤
│ RESULT / ERROR                                                       │
│ Persisted result or deterministic validation/API error               │
└──────────────────────────────────────────────────────────────────────┘
```

A separate page, wizard or visual stepper is not required. Search/list and the Add/Edit form may coexist on the same page.

## Add workflow

```text
Add Part
  -> identify existing PART or explicitly choose unresolved
  -> enter stock details
  -> review/save
  -> POST through authorized /api/stock path
  -> show persisted success or deterministic error
```


## Edit workflow

```text
search/list existing stock
  -> choose Edit
  -> load current mutable stock record
  -> change approved mutable fields
  -> PATCH through authorized /api/stock path
  -> preserve omitted values
  -> show persisted success or deterministic error
```

Edit operates on the mutable stock record. It does not redefine canonical PART identity or catalogue/reference data.

## Delete workflow

```text
search/list existing stock
  -> choose Delete
  -> show explicit confirmation identifying the stock record
  -> confirm
  -> DELETE through authorized /api/stock path
  -> verify the stock record is no longer returned
  -> show success or deterministic error
```

Delete means deletion of the **mutable stock record only**. It must not delete or mutate the linked canonical PART, JEPC/reference identity, or other stock records linked to that PART.

Cancellation must leave the record unchanged.

## Part identification

Add must provide an explicit identity decision before save:

1. select an existing imported Jaguar/JEPC canonical PART;
2. for a verified 1:1 vendor product, select that same existing Jaguar canonical PART while vendor identity remains separate;
3. select an existing Jagports specified canonical PART for a non-1:1 reusable vendor product; or
4. explicitly choose unresolved stock with `part_id = NULL` only when reusable product identity is genuinely not yet established.

If a non-1:1 reusable vendor product does not yet have its required Jagports specified PART, that canonical identity is created through the third-party PART workflow defined by `../SPEC/MODEL_PART_THIRD_PARTY.md` before STOCK is linked. The minimum #612 page does not silently fabricate that identity.

For an existing PART, search results need only enough information to select the intended record: part number, description and available applicability/context. A separate contextual information panel is optional.

A failed PART search must remain a failed canonical lookup. It must not automatically create a Jagports specified PART or silently switch to unresolved stock.

## Stock details

The Add/Edit form must expose the current #612 `/api/stock` mutable fields supported by the approved model:

- `part_id` when resolved, otherwise `NULL`;
- integer `quantity`;
- `available` independently from condition;
- `condition_code` A-E or unclassified `NULL`;
- `storage_location_id`;
- `source_party_id`;
- `donor_vehicle_id`;
- `source`;
- `source_ref`;
- `price`;
- three-letter `currency`;
- `notes`.

The UI may use simple inputs/selects. Rich pickers, visual location browsers, modal workflows and other convenience controls are not required.

## Validation, authorization and persistence

The page must:

- prevent Add until the operator has explicitly chosen resolved or unresolved identity;
- reject/report invalid quantity, condition, price and currency;
- surface database/model errors such as required location or unresolved-source evidence;
- send Add, Edit and Delete mutations through the administrator-protected Stock API path;
- reject unauthorized mutations;
- show clear persisted success results;
- show deterministic API/validation errors rather than simulating success;
- read back Add/Edit results from persistence;
- verify a successful Delete by subsequent read/search behavior.

Authorization remains an API requirement. Building an Admin login/account-management UI is outside this page specification.

## Future catalogue Admin panel — Suitability Categories and source descriptions (#877)

This is an **independent catalogue/reference administration extension** on the existing one-page Admin UI. It does not change #612 minimum STOCK Add/Edit/Delete scope, operational stock attributes, the #354 canonical PART model, or the protected `/api/stock` mutation path. No menus, dashboard or separate administration site are needed.

The word **Category** in this panel means a **normalized applicability dimension**, not a JEPC catalogue-navigation category, a STOCK quality grade or a translated heading. A JEPC *description* means source-qualified imported description evidence, not an already approved vehicle predicate.

```text
┌──────────────────────────────────────────────────────────────────┐
│ PARTS / STOCK MANAGEMENT — existing stock controls unchanged     │
├──────────────────────────────────────────────────────────────────┤
│ SUITABILITY CATEGORIES / DESCRIPTIONS                            │
│ Categories: [ Body ▼ ] [ + Add category ] [ Edit ] [ Retire ]      │
│ Values:     [ Coupe ▼ ] [ + Add value ] [ Edit label ]             │
│ Source:     [ imported JEPC / fixture description search      ]  │
│             [ Unmapped ] [ Mapped ] [ Needs review ]              │
│ Source description | Source group / model / language | Status    │
│ Coupe             | fixture:body / EN             | [Link]      │
│ [Link to category] [Body ▼] [Value: Coupe ▼] [Review] [Save]       │
│ Existing mappings: source identity → category + normalized value │
│ [Unlink] [Revision / evidence] [Validation or persisted result]   │
└──────────────────────────────────────────────────────────────────┘
```

### Category and description workflow

- An authorized operator can list, add, label/edit, and retire normalized categories and their permitted values. Stable category/value **codes** remain identity; changing a display label must not rewrite existing relationships. Retire referenced categories/values instead of silently deleting imported mappings or active occurrence predicates.
- A searchable **unmapped source descriptions** list comes from imported JEPC source evidence; before import, it comes from explicitly tagged fixture records with the same read shape.
- Selecting a source description exposes its **source-qualified identity**, available JEPC attribute group/value ID, source namespace/dataset, applicable source model/category/item/path scope, source language and original immutable wording. One displayed label may occur under different source identities.
- **Link** assigns a particular source identity to a normalized category **and** value with mapping version, verification/review state and operator provenance. **Unlink** retires that interpretation without deleting the original source. Admin editing never modifies source JEPC wording, tree hierarchy, path evidence or raw predicates.
- Unknown group semantics or ambiguous source descriptions remain **unmapped / needs review**. A presentational grouping alone does not create verified occurrence applicability; only approved source interpretation and complete condition-set evidence may authorize a predicate.
- Category/value management and source-link mutations use an **independently authorized catalogue Admin API**, not `/api/stock`. Persist, read back, validate duplicate codes and source-identity collisions, and expose deterministic forbidden/conflict/not-found/unavailable states. Do not pretend this panel is functional before its read and mutation paths exist.
- Labels, help, status and validation text follow the shared i18next EN/FI resources. JEPC descriptions are source-language catalogue data and must not be translated through UI-localization keys; where available use the separately selected Parts/catalogue language.

### Source-description identity and mapping acceptance

Creating a **normalized category** establishes one unique stable dimension code and its approved cardinality; adding a **value** establishes one unique value code *within that dimension*. The editor must separately offer language-qualified labels. Labels can be changed, but neither a translated category label nor a JEPC description is a foreign key or proof of semantic equivalence. Duplicate code and missing/retired-parent errors are reported without creating partial records.

Linking starts with **one explicitly selected source record** and must never search for all equal description strings and assign them en masse. Present the source record's immutable identity and available namespace, dataset/revision, group/value identifiers, source language and original text, record locator and model/tree/item scope **beside** the chosen normalized category and value before Save. If any identity or scope needed to disambiguate the chosen record is missing, keep the mapping proposed/unresolved and expose the evidence gap. The operation stores only a derived interpretation/revision; an imported JEPC record remains immutable and remains visible after a mapping is retired. Reimport of the same source logical identity must not create duplicate active mappings; changed source revisions require review before reactivation.

**Confirmation flow:** choose Category → choose Value → select one source-qualified description → inspect immutable evidence → create a `proposed` mapping → read back the persisted revision. Show `verified` only when the approved, independently attributable review and source-evidence gates have actually completed. A single shared `ADMIN_TOKEN` by itself cannot identify an independent reviewer. A conflicting active interpretation returns a conflict requiring human resolution rather than silently overwriting the previous target. A newly created category or label alone does not affect live PART applicability.

The same Admin page may also host the separately specified **Ranges & JEPC Models** section from #884 / PR #885. That feature maps JEPC Models to normalized Ranges; **this section maps JEPC source descriptions to applicability dimensions/values**. Share authorization and visual structure where practical but never reuse one feature's model IDs, editable form state, or inferred relationships as the other's source of truth.

### Admin API, persistence and authorization contract

The following paths are **specified future catalogue endpoints**, not claims that the current Worker implements them. Reuse the existing server-side `ADMIN_TOKEN` check as the initial authorization boundary; avoid putting mapping credentials or writable catalogue routes in the public application. Catalogue administration must not mutate or extend the operational `/api/stock` record schema.

| Operation | Proposed route | Result and safeguards |
|---|---|---|
| Browse categories/values | `GET /api/admin/suitability/categories` | Stable dimension/value codes, optional language-qualified display labels, cardinality, active/retired state and verification; authenticated. |
| Create/update category or label | `POST /api/admin/suitability/categories`; `PATCH /api/admin/suitability/categories/:id` | Validate unique stable code, locale-qualified label and `scalar`/`set` cardinality. A renamed display label cannot change code or active predicate semantics. |
| Create/retire category value | `POST /api/admin/suitability/categories/:id/values`; `PATCH /api/admin/suitability/categories/:id/values/:value_code` | Validate dimension/value FK and active use; referenced values are retired, not physically deleted. |
| Browse source descriptions | `GET /api/admin/suitability/descriptions?status=&language=&q=` | Search immutable JEPC/source records by source-qualified ID; preserve group/value code, language, record locator and source model/tree scope. Distinguish unmapped, proposed, verified, conflict and retired. |
| Link/unlink source descriptions | `POST /api/admin/suitability/mappings`; `POST /api/admin/suitability/mappings/:id/retire` | Append revision with `source_description_id`, `dimension_id`, `value_code`, mapping/evidence versions and status. Unlink records retirement; original JEPC text persists. Duplicate active incompatible mapping is `409`. |

All mutations require the Admin credential and validate again on the server; a UI-only hide/disable is not authorization. Persist then **read back** the actual category/value/mapping revision. Reject invalid codes, retired target values, ambiguous source scope, stale revisions, unsupported cardinality or missing evidence without partial mutation. Error/status payloads must be deterministic and UI-localizable; unauthorized operations must never write catalogue data. The initial single-token Admin mechanism does not establish an individual reviewer identity: until a separately verifiable approval mechanism is available, an Admin may submit a `proposed` mapping, but the UI/API must not fabricate independent human verification. Explicitly synthetic fixture mappings have their own `fixture` evidence state and are never presented as verified imported JEPC.

The mapping endpoint does **not** directly create, relax, delete or mark `verified` occurrence applicability assertions. #355/#354 own the evidence-backed transformation from approved mappings plus complete source condition paths into applicability predicates. Read-only public search consumes only the published normalized result, never draft Admin mappings.

### UI interaction and validation

The catalogue Admin section lives **below or alongside existing STOCK controls on the same simple page** and does not alter the Stock list/Add/Edit/Delete workflow. Separate its status and error region from the operational stock form so a failed mapping save cannot be presented as successful stock persistence.

On initial authorized load, list normalized dimensions/values and available source descriptions. Selecting a category shows its stable code, cardinality, labels and values. Selecting a description shows the original source text and complete available source reference; **Link** offers only active approved target categories/values compatible with the source evidence. Display an explicit `Needs review` state when the source group/value meaning, source context or evidence completeness is unresolved. Admins can browse such records, but cannot publish them as verified fitment.

Display `Body`/`Coupe` and the other temporary values as tagged fixture data when in fixture mode. When actual JEPC source descriptions become available, replace the source-list provider without replacing category/value IDs or changing the Admin workflow. For `seat_equipment`, display `set` cardinality and permit Memory Seat and Powered Seats to be present in one condition set; never silently enforce a scalar-exclusive dropdown for that dimension. Until the additive set-membership migration and evaluator are implemented, this use case must remain visibly **not supported**, not appear as completed functionality.

### Deterministic pre-JEPC records

Use the approved normalized dimension/value identities, with synthetic source descriptions explicitly marked as fixture evidence:

| Category | Normalized fixture values |
|---|---|
| Body | Coupe; Convertible |
| Steering | LHD; RHD |
| Engine aspiration | NA; Supercharged |
| Seat equipment | Memory Seat; Powered Seats |

**Memory Seat and Powered Seats can coexist**; these two descriptions must not be implemented as an exclusive toggle merely because the fixture list presents them together. Fixture values are illustrative of description→category/value linking; they are not verified Jaguar fitment.

The public #641 filter consumes the published normalized read contract and occurrence-scoped applicability, **not** this Admin form's raw strings. When #355 imports actual JEPC descriptions, the Admin mapper consumes the imported source identities; fixture rows remain test-only and must not silently persist as production JEPC assertions. The proposed #875 public-page layout is independent of this Admin extension.

## Future physical-stock photos

Physical-stock photographs remain a future extension. A later implementation may support device files/photo library and camera capture, multiple previews and a primary image. These images belong to the physical stock record and are distinct from canonical PART/JEPC imagery.

Photo upload, storage and media-provider work **must not block #612 MVP Stock Admin UI**.

## Not required for #612 minimum UI

- navigation or menus;
- sidebar;
- dashboard;
- global application search header;
- account/profile UI;
- breadcrumbs;
- visual stepper;
- exact reproduction of concept artwork;
- responsive/mobile optimization beyond basic usability;
- stock-item photo persistence;
- provider abstraction or #671 completion;
- reservations, sales, shipping, payment or warehouse ledger;
- individual physical-unit identity.

## Completion criterion

The minimum Stock Admin UI is complete when an authorized operator can use the single Admin page to find stock records and perform Add, Edit and Delete operations through the approved `/api/stock` path; Add supports an existing canonical Jaguar/JEPC or Jagports specified PART, verified 1:1 vendor products reuse the existing Jaguar PART, genuinely unresolved stock is explicitly selected, Edit preserves valid existing values when fields are omitted, Delete removes only the selected mutable stock record, and every operation produces persisted success evidence or a deterministic error.
