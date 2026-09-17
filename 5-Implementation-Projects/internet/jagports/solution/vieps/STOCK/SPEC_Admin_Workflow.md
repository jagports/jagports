# VIEPS Stock Admin and Operational Workflow Specification

## Purpose

This document defines the VIEPS Stock Admin workflow around the operational stock model.

The stock model authority is [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md). This workflow does not redefine canonical `PART` identity or catalogue relationships.

The Add Part information architecture and layout concept is defined in [`../UI/UI_NEWPART.md`](../UI/UI_NEWPART.md).

## Scope

Stock Admin supports authorized creation and maintenance of operational stock records while keeping mutable inventory separate from catalogue/reference data.

The workflow covers:

- stock database readiness;
- authorized stock create/read/update behavior;
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

A future extension may add photographs of the actual physical stock item from device files or a mobile/device camera. This future capability is documented in `UI_NEWPART.md`; it is intentionally not an MVP persistence requirement until separately approved.

## Stock database readiness

The environment must use the approved schema/migration path and make operational stock records queryable through the application data path.

The operational setup must identify:

- which schema/migration chain is active;
- how the target database is initialized;
- how stock test/seed records are loaded when applicable;
- how an operator can verify stock records before UI testing;
- which environment is being exercised, such as local, preview or deployed runtime.

Repository Markdown is specification, not mutable stock storage.

A successful stock database setup makes records queryable through the approved Worker/API/database path. Repository fixtures or seed records are inputs to that path; they are not a substitute for persisted operational records in the environment under test.

## Test data and inventory evidence

Catalogue/search data and operational stock evidence have different trust boundaries.

Fixture-backed catalogue PARTs may be used to exercise Stock Admin when imported catalogue data is not yet available.

Stock records used for workflow or acceptance testing must be explicitly identifiable as test/seed records unless they are independently verified inventory evidence.

Synthetic or deterministic stock test data must not be described as real production Jagports inventory.

Verified inventory facts must not be inferred from catalogue fixtures, repository examples or generated demo values.

Mutable stock test records must remain separate from immutable catalogue/reference data.

## Stock identity paths

Stock Admin supports these stock-record paths:

1. resolved stock linked to an existing canonical `PART`;
2. reusable product identity created through the applicable canonical PART/product workflow before stock linkage;
3. explicitly unresolved/non-catalogue stock where no canonical identity is yet established.

A canonical `PART` must not be fabricated merely to satisfy a stock relationship.

## Stock management UI

The authorized Stock Admin UI must support, where the current data contract exposes the field:

- create a stock record;
- edit approved mutable stock fields;
- select a canonical PART reference where resolved;
- retain an explicit unresolved path where appropriate;
- capture integer quantity;
- select normalized stock quality `A` through `E` using the meanings in `MODEL_STOCK.md` when quality is classified;
- retain an explicit unclassified quality state when no A-E classification has yet been assigned;
- select physical site and rack/shelf/box storage location;
- capture source party separately from donor vehicle;
- capture donor vehicle where known;
- capture price and currency where supported;
- capture operational notes;
- show availability and validation state independently from stock-quality classification state;
- surface deterministic validation/error states.

The Stock Admin UI should reuse the established EndUser VIEPS application shell and keep corresponding navigation, top search, working-area and contextual-panel relationships in similar positions where practical. The detailed Add Part layout is specified in `UI_NEWPART.md`.

Public unauthenticated users must not gain stock mutation capability through the page or its supporting API path.

## Future physical-stock photographs

A future Stock Admin extension may attach multiple photographs to a stock record. Images may be selected from device files/photo storage or captured directly with a mobile/device camera where supported.

Physical-stock photographs are operational evidence for the specific stock record. They are distinct from canonical PART/JEPC catalogue imagery and must not overwrite or redefine catalogue imagery or PART identity.

The future UI should support preview, removal/replacement and designation of one primary stock image before persistence. Media storage, upload API, transformations, retention and storage-provider architecture remain outside the current MVP workflow and require separate approved implementation specification.

## Operational workflow

```text
admin opens Stock Admin
  -> verifies stock database/environment
  -> resolves or explicitly leaves stock identity unresolved
  -> captures mutable stock facts
  -> classifies stock quality with A-E when known or leaves it explicitly unclassified
  -> validates quantity, location, source and availability rules
  -> persists the stock record through the approved application/database path
  -> reads the persisted record back
  -> public/read presentation exposes only permitted stock information
```

The workflow is complete only when the persisted record can be read back from the same environment through the approved data path. A UI-only state change or repository fixture change is not persistence evidence.

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

Search behavior must preserve the catalogue/stock boundary and authorization rules.

Search/filter validation should use known records from the target environment and confirm that expected records are returned without exposing restricted stock details to unauthorized users.

## Validation and errors

The UI/API must explicitly reject or report:

- fractional or otherwise invalid quantity;
- unknown stock-quality code other than the approved A-E set;
- missing physical location when availability requires it;
- unresolved stock without required source evidence;
- unauthorized mutation;
- failed persistence;
- unavailable stock database/setup state.

A missing stock-quality classification is represented by `condition_code = NULL` and must not, by itself, make a stock record unavailable.

## Validation environment and acceptance testing

A validation or acceptance record must identify the environment being exercised and distinguish repository fixtures from persisted stock records in that environment.

At minimum, validation should establish that:

- a known catalogue or fixture-backed PART can be resolved when that is the chosen stock identity path;
- permitted stock information can be read for known stock records;
- an authorized operator can create or update approved mutable stock fields;
- the persisted result can be read back through the approved application/database path;
- an unauthenticated or otherwise unauthorized user cannot mutate stock;
- invalid stock operations fail deterministically;
- unavailable database/setup state is reported rather than simulated as success.

A local or preview result is evidence only for that environment. It must not be presented as deployed or production-runtime verification.

## Boundaries

This workflow does not define:

- catalogue PART identity or JEPC import;
- warehouse transaction/history ledger;
- reservations, checkout or sales workflow;
- individual physical-unit identity;
- payment or shipping;
- provider-specific synchronization;
- tenant/provider authentication architecture;
- detailed provenance beyond the approved stock evidence fields;
- physical-stock photo media storage/upload architecture until separately approved.
