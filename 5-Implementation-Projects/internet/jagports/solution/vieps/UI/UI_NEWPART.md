# VIEPS Stock Admin — Minimum Add Part UI

## Purpose

This document defines the minimum UI required by Issue #612 to create an operational stock record.

The target is **one functional Admin Add Part page**. Navigation, menus, dashboards, account UI, decorative application shell, and visual polish are not requirements for this increment.

The operational stock model remains authoritative in [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md), and workflow behavior remains governed by [`../STOCK/SPEC_Admin_Workflow.md`](../STOCK/SPEC_Admin_Workflow.md).

## Visual reference

A concept image may be kept under `../UI_CONCEPTS/` as `UI_Admin_Part_Add.png`, `.jpg`, or another normal web image format. It is a loose visual reference for the Add Part form only. Navigation, menus, branding, account controls, layout decoration, and example values shown in the artwork are not implementation requirements.

The implementation should prefer the simplest page that completes the workflow below.

## Minimum workflow

```text
Add Part
  -> identify existing PART or explicitly choose unresolved
  -> enter stock details
  -> review/save
  -> POST through authorized /api/stock path
  -> show success or deterministic error
```

A multi-step visual stepper is optional. The three logical stages may be implemented on one page.

## Minimum page

```text
┌──────────────────────────────────────────────────────────────┐
│ ADD PART                                                     │
│                                                              │
│ PART IDENTIFICATION                                          │
│ [ part number / description                       ] [Search] │
│                                                              │
│ Search results                                               │
│ Part number | Description | Applicability | [Select]         │
│                                                              │
│ [ Create unresolved part ]                                   │
├──────────────────────────────────────────────────────────────┤
│ STOCK DETAILS                                                │
│ Quantity        [ ]        Available [ ]                     │
│ Condition       [ ]                                          │
│ Location        [ ]                                          │
│ Source party    [ ]        Donor vehicle [ ]                 │
│ Source          [ ]        Source reference [ ]              │
│ Price           [ ]        Currency [ ]                      │
│ Notes           [                                      ]     │
├──────────────────────────────────────────────────────────────┤
│ REVIEW / RESULT                                              │
│ Selected PART or unresolved identity + entered stock facts   │
│                                                [ Save stock ]│
│ Success or deterministic validation/API error               │
└──────────────────────────────────────────────────────────────┘
```

## Part identification

The page must provide an explicit identity decision before save:

1. select an existing canonical PART returned by the applicable PART-search path; or
2. explicitly choose unresolved stock with `part_id = NULL`.

A failed search must not silently create a Jaguar identity, create another canonical identity, or silently choose unresolved stock.

For an existing PART, search results need only enough information to select the intended record: part number, description and available applicability/context. A separate contextual information panel is optional.

## Stock details

The page must expose the current #612 `/api/stock` create fields needed by the approved model:

- `part_number`;
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

The UI may use simple inputs/selects. Rich pickers, visual location browsers, modal workflows and other convenience controls are not required for this increment.

## Validation and persistence

The page must:

- prevent save until the operator has explicitly chosen resolved or unresolved identity;
- reject/report invalid quantity, condition, price and currency;
- surface database/model errors such as required location or unresolved-source evidence;
- send mutation through the existing administrator-protected Stock API path;
- show a clear success result after persistence;
- show deterministic API/validation errors rather than simulating success.

Authorization remains an API requirement. Building an Admin login/account-management UI is outside this page specification.

## Future physical-stock photos

Physical-stock photographs remain a future extension. A later implementation may support device files/photo library and camera capture, multiple previews and a primary image. These images belong to the physical stock record and are distinct from canonical PART/JEPC imagery.

Photo upload, storage and media-provider work **must not block #612 MVP Add Part UI**.

## Not required for #612 minimum UI

- navigation or menus;
- sidebar;
- dashboard;
- global search header;
- account/profile UI;
- breadcrumbs;
- visual stepper;
- exact reproduction of the concept artwork;
- responsive/mobile optimization beyond basic usability;
- stock-item photo persistence;
- provider abstraction or #671 completion;
- reservations, sales, shipping, payment or warehouse ledger;
- individual physical-unit identity.

## Completion criterion

The minimum Add Part UI is complete when an authorized operator can use this single page to explicitly choose a resolved or unresolved PART identity, enter valid stock facts, persist the record through the approved `/api/stock` path, and receive a clear success or deterministic error result.
