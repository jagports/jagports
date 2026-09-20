# VIEPS Stock Admin and Operational Workflow Specification

## Purpose

This document defines the VIEPS Stock Admin workflow around the operational stock model.

The stock model authority is [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md). This workflow does not redefine canonical `PART` identity or catalogue relationships.

The minimum Stock Admin Add/Edit/Delete page is defined in [`../UI/UI_NEWPART.md`](../UI/UI_NEWPART.md).

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

A future extension may add photographs of the actual physical stock item from device files or a mobile/device camera. This is intentionally not an MVP persistence requirement until separately approved.

## Stock database readiness

The native MVP stock environment uses Cloudflare D1 through the Worker `DB` binding and the reviewed migration chain under `4-Production/internet/cloudflare/workers/jagports/migrations/`.

The executable D1 setup procedure is maintained in [`CloudFlareGit_DB_Migrations.md`](../../../../../../3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md). Stock Admin and acceptance work must consume that procedure rather than maintain another DDL/bootstrap sequence here.

For a clean local/test target, setup means:

1. start with an empty isolated local/test D1 target;
2. apply the complete ordered reviewed migration chain from the Worker root;
3. verify the migration ledger;
4. verify the resulting `stock_item`, `stock_site`, `stock_location` and `stock_source_party` structures and relevant STOCK indexes/triggers;
5. verify the Worker/API can read from the same target;
6. persist a stock record through the approved mutation path and read that record back from the same target.

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

Verified inventory facts must not be inferred from catalogue fixtures, repository examples or generated demo values. The linked repository workbooks `jagports-parts.xlsx` and `jagports-parts-stock.xlsx` are accepted current live Jagports inventory input. Real-stock acceptance evidence may use a traced workbook row when the mapping records the exact source row, persists the mapped record through the stock mutation path, and leaves source fields that are absent or unknown as NULL/unclassified. Synthetic values must never fill missing workbook facts.

Mutable stock test records must remain separate from immutable catalogue/reference data.

## Stock identity paths

Stock Admin supports these stock-record paths:

1. resolved stock linked to an existing imported Jaguar/JEPC canonical `PART`;
2. verified 1:1 vendor product stock linked to that same existing Jaguar canonical `PART` while vendor identity remains separate;
3. non-1:1 reusable vendor product stock linked to a **Jagports specified PART** created through the canonical third-party PART workflow;
4. explicitly unresolved stock where reusable product identity is genuinely not yet established.

A canonical `PART` must not be fabricated merely to satisfy a stock relationship. A known reusable third-party product must follow `MODEL_PART_THIRD_PARTY.md`: a verified 1:1 vendor product uses the existing Jaguar canonical PART, while a non-1:1 product uses a Jagports specified PART with exactly one mandatory Jaguar parent and retained category/item/occurrence/PART context. When the parent was selected through a specific imported catalogue tree path and that source-qualified path is available, the exact selected `part_occurrence_tree_path` is retained by the third-party PART evidence. `stock_item.part_id = NULL` is reserved for items whose reusable product identity is genuinely not yet established.

Canonical PART identity and vendor-product identity remain separate. `part(id)` is the reusable canonical identity namespace for both Jaguar/JEPC PARTs and Jagports specified PARTs. Vendor PN, manufacturer, description, source/product URLs and `third_party_part_xref` evidence remain third-party PART data and must not be folded into mutable STOCK identity or replace canonical `part_id`. A Jagports specified identifier is not Jaguar-issued and must not be presented as such.

A failed PART lookup must leave the operator in the canonical-selection flow and report no match. It must not silently fabricate a PART, create a Jagports specified PART, or switch the record to `part_id = NULL`.

The STOCK acquisition/source party is a separate fact from vendor-product identity. The same vendor may appear in both roles only when both facts are independently true; one role must not be inferred from the other.

Third-party PART relationship semantics are owned by `MODEL_PART_THIRD_PARTY.md`. Stock Admin must not reinterpret `parent_part`, `component_of`, `equivalent_to`, or Jaguar supersession. Suitability follows the referenced Jaguar PART/context defined by the third-party PART model.

## Stock management UI

For #612 MVP, the UI target is one functional Stock Admin page with search/list plus **Add, Edit and Delete**. Navigation, menus, dashboard, account/profile UI, breadcrumbs, decorative shell and exact reproduction of concept artwork are not requirements.

The authorized Stock Admin UI must support, where the current data contract exposes the field:

- search/list existing stock records;
- create a stock record;
- edit approved mutable stock fields;
- delete a selected mutable stock record after explicit confirmation;
- select a canonical PART reference where resolved, with `part_id` chosen from an existing PART record rather than manually fabricating an identifier;
- for a verified 1:1 vendor product, select the existing Jaguar canonical PART and retain the vendor reference;
- for a non-1:1 reusable vendor product, create/select the Jagports specified PART defined by `MODEL_PART_THIRD_PARTY.md` before creating stock, retaining the selected parent occurrence/tree-path context where available;
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

## Future physical-stock photographs

A future Stock Admin extension may attach multiple photographs to a stock record. Images may be selected from device files/photo storage or captured directly with a mobile/device camera where supported.

Physical-stock photographs are operational evidence for the specific stock record. They are distinct from canonical PART/JEPC catalogue imagery and must not overwrite or redefine catalogue imagery or PART identity.

Media storage, upload API, transformations, retention and storage-provider architecture remain outside the current MVP workflow and require separate approved implementation specification.

## Operational workflows

### Add

```text
admin opens Stock Admin
  -> verifies stock database/environment
  -> selects an existing Jaguar/JEPC canonical PART, uses that same PART for a verified 1:1 vendor product, creates/selects a Jagports specified PART for a non-1:1 reusable vendor product, or explicitly leaves genuinely unidentified stock unresolved
  -> captures mutable stock facts
  -> classifies stock quality with A-E when known or leaves it explicitly unclassified
  -> validates quantity, location, source and availability rules
  -> persists the stock record through the approved Worker/D1 application path
  -> reads the persisted record back from the same D1 target
  -> public/read presentation exposes only permitted stock information
```

### Edit

```text
admin searches/lists stock
  -> selects a stock record
  -> edits approved mutable facts
  -> PATCHes through the approved application/database path
  -> omitted fields retain their current values
  -> reads the persisted updated record back
```

### Delete

```text
admin searches/lists stock
  -> selects Delete for one mutable stock record
  -> explicit confirmation identifies the target record
  -> confirmed DELETE uses the approved application/database path
  -> subsequent read/search no longer returns the deleted stock record
  -> canonical PART identity remains unchanged
```

Cancellation must leave the target record unchanged.

A workflow is complete only when persistence is verified in the same environment through the approved data path. A UI-only state change or repository fixture change is not persistence evidence.

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
- unknown stock-quality code other than the approved A-E set;
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
- an authorized operator can create approved mutable stock fields;
- an authorized operator can edit a persisted stock record without omitted fields being silently reset;
- an authorized operator can delete a selected mutable stock record after explicit confirmation;
- deleting stock does not delete or mutate its canonical PART identity;
- Add/Edit persisted results can be read back through the approved application/database path;
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
- detailed provenance beyond the approved stock evidence fields;
- physical-stock photo media storage/upload architecture until separately approved.
