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

This is a future extension of the existing one-page Admin UI. It is separate from operational STOCK and `/api/stock`.

An authorized operator can create or retire stable normalized category/value IDs, provide language-qualified domain names and descriptions, and map **one selected JEPC source description** to one category/value. A source record must show its namespace, dataset/version, original text, source language, locator, group/value identifiers and model/category/item/tree-path scope. Linking creates an append-only interpretation revision; it never rewrites JEPC data.

The panel may list the approved fixture vocabulary—Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; Seat equipment: Memory Seat/Powered Seats—only as explicitly tagged synthetic source records. Fixture rows use the same provenance shape as the future importer but are not JEPC facts and cannot publish production suitability.

A mapping remains proposed or unavailable when its JEPC relation, source scope, language metadata, evidence or review is missing. Raw description text, translated UI text and localized domain names are never foreign keys. There is no condition or predicate authored from this panel: every later condition must reference its persisted JEPC source-description mapping and resolvable i18n domain name/description.

### Future Admin API contract

| Operation | Proposed route | Required safeguard |
|---|---|---|
| Browse categories/values | `GET /api/admin/suitability/categories` | Authenticated stable IDs plus language-qualified domain metadata. |
| Manage categories/values | `POST/PATCH /api/admin/suitability/categories` and `.../:id/values` | Validate codes and retire referenced values instead of deleting them. |
| Browse descriptions | `GET /api/admin/suitability/descriptions?status=&language=&q=` | Return immutable source identity, provenance and mapping status. |
| Map/retire | `POST /api/admin/suitability/mappings`; `POST /api/admin/suitability/mappings/:id/retire` | Append a source-qualified revision; reject ambiguous or conflicting active mappings. |

All mutations require independent catalogue Admin authorization, validate on the server, and read back the persisted revision. A shared token alone does not prove an independent reviewer. The public filter consumes only published mappings with source and language metadata; it never consumes raw Admin form text.

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
