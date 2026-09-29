# VIEPS Admin Specification

## Purpose

This document defines the VIEPS Stock Admin workflow around the operational stock model.

The stock model authority is [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md). This workflow does not redefine canonical `PART` identity or catalogue relationships.

This file also owns the minimum Stock Admin Add/Edit/Delete UI contract.

## Scope

Stock Admin supports authorized creation and maintenance of operational stock records while keeping mutable inventory separate from catalogue/reference data.

The workflow covers:

- stock database readiness;
- authorized stock create/read/update/delete behavior;
- canonical PART-linked and explicitly unresolved stock;
- normalized A-E stock quality capture when quality is classified;
- explicit unclassified stock quality state;
- site and recursive rack/shelf/box storage selection;
- source party and donor vehicle capture as separate relationships;
- price/currency, availability and operational notes;
- stock search/filter behavior;
- validation and deterministic error handling;
- public-read versus authorized-mutation boundaries;
- test/acceptance environment identification and persisted-record verification.

Physical-stock photographs are optional operational evidence and are outside the minimum required stock-record persistence contract.

## Stock database readiness

The stock persistence environment uses Cloudflare D1 through the Worker `DB` binding and the ordered migration chain under `4-Production/internet/cloudflare/workers/jagports/migrations/`.

The executable D1 setup procedure is maintained in [`CloudFlareGit_DB_Migrations.md`](../../../../../../3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md). Stock Admin and acceptance work must consume that procedure rather than maintain another DDL/bootstrap sequence here.

For a clean local/test target, setup means:

1. start with an empty isolated local/test D1 target;
2. apply the complete ordered migration chain from the Worker root;
3. verify the migration ledger;
4. verify the resulting `stock_item`, `stock_site`, `stock_location` and `stock_source_party` structures and relevant STOCK indexes/triggers;
5. verify the Worker/API can read from the same target;
6. persist a stock record through the defined mutation path and read that record back from the same target.

The operational setup record must identify:

- the exact target environment: local, preview, test or deployed runtime;
- the Worker revision/configuration used;
- migration ledger state;
- whether loaded rows are deterministic fixtures/test records or evidenced real inventory;
- the verification queries/requests used.

Repository Markdown is specification, not mutable stock storage.

A successful stock database setup makes records queryable through the approved Worker/API/database path. Repository fixtures or seed records are inputs to that path; they are not a substitute for persisted operational records in the environment under test. Local/preview success is not production evidence.

## Test data and inventory evidence

Catalogue/search data and operational stock evidence have different trust boundaries.

Fixture-backed catalogue PARTs may be used to exercise Stock Admin when imported catalogue data is not yet available.

Stock records used for workflow or acceptance testing must be explicitly identifiable as test/seed records unless they are independently verified inventory evidence.

Synthetic or deterministic stock test data must not be described as real production Jagports inventory. Rows whose source/reference identifies them as fixtures remain fixture evidence even when persisted in D1.

Verified inventory facts must not be inferred from catalogue fixtures, repository examples or generated demo values. The linked repository workbooks `jagports-parts.xlsx` and `jagports-parts-stock.xlsx` are accepted current Jagports inventory input. Real-stock acceptance evidence may use a traced workbook row when the mapping records the exact source row, persists the mapped record through the stock mutation path, and leaves source fields that are absent or unknown as NULL/unclassified. Synthetic values must never fill missing workbook facts.

Mutable stock test records must remain separate from immutable catalogue/reference data.

## Stock identity paths

Stock Admin supports these stock-record paths:

1. resolved stock linked to an existing imported Jaguar/JEPC canonical `PART`;
2. verified 1:1 vendor product stock linked to that same existing Jaguar canonical `PART` while vendor identity remains separate;
3. non-1:1 reusable vendor product stock linked to a **Jagports specified PART** created through the canonical third-party PART workflow;
4. explicitly unresolved stock where reusable product identity is genuinely not yet established.

A canonical `PART` must not be fabricated merely to satisfy a stock relationship. A known reusable third-party product must follow `../SPEC/MODEL_PARTS.md`: a verified 1:1 vendor product uses the existing Jaguar canonical PART, while a non-1:1 product uses a Jagports specified PART with exactly one mandatory Jaguar parent and retained category/item/occurrence/PART context. When the parent was selected through a specific imported catalogue tree path and that source-qualified path is available, the exact selected `part_occurrence_tree_path` is retained by the third-party PART evidence. `stock_item.part_id = NULL` is reserved for items whose reusable product identity is genuinely not yet established.

Canonical PART identity and vendor-product identity remain separate. `part(id)` is the reusable canonical identity namespace for both Jaguar/JEPC PARTs and Jagports specified PARTs. Vendor PN, manufacturer, description, source/product URLs and `third_party_part_xref` evidence remain third-party PART data and must not be folded into mutable STOCK identity or replace canonical `part_id`. A Jagports specified identifier is not Jaguar-issued and must not be presented as such.

A failed PART lookup must leave the operator in the canonical-selection flow and report no match. It must not silently fabricate a PART, create a Jagports specified PART, or switch the record to `part_id = NULL`.

The STOCK acquisition/source party is a separate fact from vendor-product identity. The same vendor may appear in both roles only when both facts are independently true; one role must not be inferred from the other.

Third-party PART relationship semantics are owned by `../SPEC/MODEL_PARTS.md`. Stock Admin must not reinterpret `parent_part`, `component_of`, `equivalent_to`, or Jaguar supersession. Fit follows the referenced Jaguar PART/context defined by the third-party PART model.

## Stock management UI

The UI target is one functional Stock Admin page with search/list plus **Add, Edit and Delete**. Navigation, menus, dashboard, account/profile UI, breadcrumbs, decorative shell and exact reproduction of concept artwork are not requirements.

The authorized Stock Admin UI must support, where the current data contract exposes the field:

- search/list existing stock records;
- create a stock record;
- edit mutable stock fields;
- delete a selected mutable stock record after explicit confirmation;
- select a canonical PART reference where resolved, with `part_id` chosen from an existing PART record rather than manually fabricating an identifier;
- for a verified 1:1 vendor product, select the existing Jaguar canonical PART and retain the vendor reference;
- for a non-1:1 reusable vendor product, create/select the Jagports specified PART defined by `../SPEC/MODEL_PARTS.md` before creating stock, retaining the selected parent occurrence/tree-path context where available;
- retain an explicit unresolved path only where reusable product identity is genuinely not yet established; selecting that path must be deliberate and must clear canonical `part_id` rather than occurring as lookup fallback;
- keep vendor part-number/reference data distinct from canonical PART identity;
- capture integer quantity;
- select normalized stock quality `A` through `E` using the meanings in `MODEL_STOCK.md` when quality is classified;
- retain an explicit unclassified quality state when no A-E classification has yet been assigned;
- select physical site and rack/shelf/box storage location;
- capture source party separately from donor vehicle;
- capture donor vehicle where known;
- capture price and currency where supported;
- capture operational notes;
- show availability and validation state independently from stock-quality classification state;
- surface deterministic validation/error states;
- persist mutations through the administrator-protected Stock API path.

Delete applies only to the selected mutable stock record. It must not delete canonical PART/JEPC/reference identity or unrelated stock records.

The implementation may use simple form controls. Rich pickers, multi-page navigation and other convenience UI are not required for the minimum increment.

Public unauthenticated users must not gain stock mutation capability through the page or its supporting API path.

## Optional physical-stock photographs

A future Stock Admin extension may attach multiple photographs to a stock record. Images may be selected from device files/photo storage or captured directly with a mobile/device camera where supported.

Physical-stock photographs are operational evidence for the specific stock record. They are distinct from canonical PART/JEPC catalogue imagery and must not overwrite or redefine catalogue imagery or PART identity.

Media storage, upload API, transformations, retention and storage-provider architecture remain outside the minimum Admin contract and require separate approved implementation specification.

## Stock operations

### Add

```text
admin opens Stock Admin
  -> verifies stock database/environment
  -> selects an existing Jaguar/JEPC canonical PART, uses that same PART for a verified 1:1 vendor product, creates/selects a Jagports specified PART for a non-1:1 reusable vendor product, or explicitly leaves genuinely unidentified stock unresolved
  -> captures mutable stock facts
  -> classifies stock quality with A-E when known or leaves it explicitly unclassified
  -> validates quantity, location, source and availability rules
  -> persists the stock record through the defined Worker/D1 application path
  -> reads the persisted record back from the same D1 target
  -> public/read presentation exposes only permitted stock information
```

### Edit

```text
admin searches/lists stock
  -> selects a stock record
  -> edits approved mutable facts
  -> PATCHes through the defined application/database path
  -> omitted fields retain their current values
  -> reads the persisted updated record back
```

### Delete

```text
admin searches/lists stock
  -> selects Delete for one mutable stock record
  -> explicit confirmation identifies the target record
  -> confirmed DELETE uses the defined application/database path
  -> subsequent read/search no longer returns the deleted stock record
  -> canonical PART identity remains unchanged
```

Cancellation must leave the target record unchanged.

An operation is complete only when persistence is verified in the same environment through the defined data path. A UI-only state change or repository fixture change is not persistence evidence.

## Stock quality

When stock quality is classified, the stored identity is the normalized code:

```text
A New / Unused / Original Package
B Used / Good Working / Known History
C Used / Usable / No warranty
D Repairs / Needs Conditioning / Spares only
E Broken / Reference / Knowledge Gains
```

`condition_code = NULL` means the stock quality has not yet been classified.

Unclassified is a state, not a sixth quality class. No placeholder such as `U`, `Undefined`, or localized text is stored as the classification identity.

Localized label/description text is presentation and must not replace the stored code. The unclassified state must also be presented through localized UI text, for example `Condition not classified` / `Kunto luokittelematta`.

Stock availability and stock-quality classification are independent. A stock record may be available while `condition_code IS NULL`.

## Search/filter behavior

Operational stock search/filtering may use:

- part number / canonical PART reference;
- normalized stock quality code;
- explicit unclassified quality state;
- availability;
- physical site/location;
- source party;
- donor vehicle where known;
- supported operational notes/text.

Search/list is part of the minimum page because it provides target selection for Edit and Delete.

Search behavior must preserve the catalogue/stock boundary and authorization rules.

Search/filter validation should use known records from the target environment and confirm that expected records are returned without exposing restricted stock details to unauthorized users.

## Validation and errors

The UI/API must explicitly reject or report:

- fractional or otherwise invalid quantity;
- unknown stock-quality code other than the defined A-E set;
- missing physical location when availability requires it;
- unresolved stock without required source evidence;
- canonical stock identity where `part_id` does not resolve to an existing PART;
- silent fallback from a failed canonical PART lookup to unresolved stock;
- unauthorized Add, Edit or Delete;
- failed persistence;
- unavailable stock database/setup state.

A missing stock-quality classification is represented by `condition_code = NULL` and must not, by itself, make a stock record unavailable.

Delete requires explicit confirmation. A cancelled Delete must not mutate data.

## Validation environment and acceptance testing

A validation or acceptance record must identify the environment being exercised and distinguish repository fixtures from persisted stock records in that environment.

At minimum, validation should establish that:

- a known catalogue or fixture-backed PART can be resolved to canonical `part_id` when that is the chosen stock identity path;
- a verified 1:1 vendor product can use the existing Jaguar canonical PART while retaining its vendor reference;
- a non-1:1 reusable vendor product can use a Jagports specified PART with exactly one required Jaguar parent, retained occurrence/tree-path context where available, and stock can be persisted against it;
- an unidentified item can remain explicitly unresolved without fabricating Jaguar or Jagports specified identity;
- a failed canonical PART lookup does not create, fabricate, or silently downgrade identity to unresolved;
- permitted stock information can be read for known stock records;
- an authorized operator can create mutable stock fields;
- an authorized operator can edit a persisted stock record without omitted fields being silently reset;
- an authorized operator can delete a selected mutable stock record after explicit confirmation;
- deleting stock does not delete or mutate its canonical PART identity;
- Add/Edit persisted results can be read back through the defined application/database path;
- a deleted record is absent from subsequent approved read/search results;
- an unauthenticated or otherwise unauthorized user cannot Add, Edit or Delete stock;
- invalid stock operations fail deterministically;
- unavailable database/setup state is reported rather than simulated as success.

A local or preview result is evidence only for that environment. It must not be presented as deployed or production-runtime verification.

## Boundaries

This workflow does not define:

- catalogue PART identity or JEPC import;
- deletion of canonical PART/JEPC/reference identity;
- navigation/menu architecture for the Admin page;
- dashboard/account/profile UI;
- warehouse transaction/history ledger;
- reservations, checkout or sales workflow;
- individual physical-unit identity;
- payment or shipping;
- provider-specific synchronization;
- tenant/provider authentication architecture;
- detailed provenance beyond the defined stock evidence fields;
- physical-stock photo media storage/upload architecture unless separately specified.


## Third-party / Jagports specified PART behavior

### Stock Admin behavior

This section covers reusable third-party products.

#### Existing Jaguar PART / 1:1 third-party product

The operator:

1. finds the existing Jaguar PART, either directly or through the PART tree;
2. records the vendor and vendor part number;
3. verifies the 1:1 relationship where claimed;
4. creates operational STOCK linked to the existing Jaguar PART.

#### New Jagports specified PART / no 1:1 Jaguar PART

The operator:

1. selects the mandatory parent Jaguar PART directly or from the imported tree/category/item context;
2. records the required category/item/occurrence/PART references;
3. records the vendor and third-party part number;
4. creates the combined Jagports specified part number `<JaguarPN>+<3rdPartyPN>`;
5. enters the description;
6. records verification status and verification date;
7. creates operational STOCK linked to the new Jagports specified PART.

The operator must know the parent reference before the new Jagports specified PART is created. A missing parent Jaguar PART is a validation error for this path.

Unresolved stock handling belongs to `MODEL_STOCK.md` and is outside this third-party PART specification. Once a third-party product is known to be reusable, it is no longer an unresolved-stock identity case: it must resolve to an existing Jaguar `part_id` or to a newly created Jagports specified `part_id` before STOCK is linked.

### Catalogue-assisted parent selection

When creating or editing a Jagports specified PART, VIEPS should allow the operator to locate the mandatory Jaguar parent from the already imported catalogue.

Conceptually:

```text
model/sub-range
  -> category
     -> item
        -> occurrence
           -> Jaguar PART
```

The selector should show the imported context available for the selected reference, including:

- model/sub-range and breadcrumb;
- category and item;
- occurrence;
- Jaguar PART number and description;
- illustration/hotspot context where available;
- fit information such as engine/aspiration, `Except ...` conditions, LH/RH, VIN/revision bounds, market/Region;
- source/provenance and verification information;
- other relevant catalogue/fit fields that may become available from later imported data.

The category/item/occurrence/PART reference used for the parent must be stored with the Jagports specified PART.

## Minimum Stock Admin Add / Edit / Delete UI

### Purpose

This document defines the minimum UI required by the Stock Admin requirement to manage operational stock records.

The target is **one functional Stock Admin page** supporting search/list, Add, Edit and Delete. Navigation, menus, dashboards, account UI, decorative application shell, and visual polish are not requirements for this increment.

The operational stock model remains authoritative in [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md). The workflow and UI behavior in this file form one Admin specification.

### Visual reference

The concept image under `../UI_CONCEPTS/AdminUI-PartAdd.png` is an informative visual reference for the minimum page. It is not normative. Navigation, menus, branding, account controls, decorative layout details and example values shown in concept artwork are not implementation requirements.

The implementation should prefer the simplest page that completes the workflows below.

### Minimum page

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

### Add operation

```text
Add Part
  -> identify existing PART or explicitly choose unresolved
  -> enter stock details
  -> review/save
  -> POST through authorized /api/stock path
  -> show persisted success or deterministic error
```


### Edit operation

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

### Delete operation

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

### Part identification

Add must provide an explicit identity decision before save:

1. select an existing imported Jaguar/JEPC canonical PART;
2. for a verified 1:1 vendor product, select that same existing Jaguar canonical PART while vendor identity remains separate;
3. select an existing Jagports specified canonical PART for a non-1:1 reusable vendor product; or
4. explicitly choose unresolved stock with `part_id = NULL` only when reusable product identity is genuinely not yet established.

If a non-1:1 reusable vendor product does not yet have its required Jagports specified PART, that canonical identity is created through the third-party PART workflow defined by `../SPEC/MODEL_PARTS.md` before STOCK is linked. The minimum page does not silently fabricate that identity.

For an existing PART, search results need only enough information to select the intended record: part number, description and available fit/context. A separate contextual information panel is optional.

A failed PART search must remain a failed canonical lookup. It must not automatically create a Jagports specified PART or silently switch to unresolved stock.

### Stock details

The Add/Edit form must expose the mutable `/api/stock` fields defined by the stock model:

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

### Validation, authorization and persistence

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

### Catalogue Admin panel — Fit Categories and source descriptions

This is a separate catalogue-Admin section of the one-page Admin UI. It is separate from operational STOCK and `/api/stock`.

An authorized operator can create or retire stable normalized category/value IDs, provide language-qualified domain names and descriptions, and map **one selected JEPC source description** to one category/value. A source record must show its namespace, dataset/version, original text, source language, locator, group/value identifiers and model/category/item/tree-path scope. Linking creates an append-only interpretation revision; it never rewrites JEPC data.

The panel may list the defined fixture vocabulary—Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; Seat equipment: Memory Seat/Powered Seats—only as explicitly tagged synthetic source records. Fixture rows use the same provenance shape as the importer but are not JEPC facts and cannot publish production fit.

A mapping remains proposed or unavailable when its JEPC relation, source scope, language metadata, evidence or verification is missing. Raw description text, translated UI text and localized domain names are never foreign keys. There is no condition or predicate authored from this panel: every later condition must reference its persisted JEPC source-description mapping and resolvable i18n domain name/description.

#### Admin API contract

| Operation | Proposed route | Required safeguard |
|---|---|---|
| Browse categories/values | `GET /api/admin/fit/categories` | Authenticated stable IDs plus language-qualified domain metadata. |
| Manage categories/values | `POST/PATCH /api/admin/fit/categories` and `.../:id/values` | Validate codes and retire referenced values instead of deleting them. |
| Browse descriptions | `GET /api/admin/fit/descriptions?status=&language=&q=` | Return immutable source identity, provenance and mapping status. |
| Map/retire | `POST /api/admin/fit/mappings`; `POST /api/admin/fit/mappings/:id/retire` | Append a source-qualified revision; reject ambiguous or conflicting active mappings. |

All mutations require independent catalogue Admin authorization, validate on the server, and read back the persisted revision. A shared token alone does not establish an independent authorization context. The public filter consumes only published mappings with source and language metadata; it never consumes raw Admin form text.

### Physical-stock photos

Physical-stock photographs may support device files/photo library and camera capture, multiple previews and a primary image. These images belong to the physical stock record and are distinct from canonical PART/JEPC imagery.

Photo upload, storage and media-provider behavior is outside the minimum Stock Admin contract.

### Outside the minimum UI

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
- provider abstraction;
- reservations, sales, shipping, payment or warehouse ledger;
- individual physical-unit identity.

### Completion criterion

The minimum Stock Admin UI conforms when an authorized operator can use the single Admin page to find stock records and perform Add, Edit and Delete operations through the approved `/api/stock` path; Add supports an existing canonical Jaguar/JEPC or Jagports specified PART, verified 1:1 vendor products reuse the existing Jaguar PART, genuinely unresolved stock is explicitly selected, Edit preserves valid existing values when fields are omitted, Delete removes only the selected mutable stock record, and every operation produces persisted success evidence or a deterministic error.
