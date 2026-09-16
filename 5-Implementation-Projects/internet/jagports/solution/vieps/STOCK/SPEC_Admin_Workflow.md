# VIEPS Stock Admin and Operational Workflow Specification

## Purpose

This document defines the VIEPS Stock Admin workflow around the operational stock model.

The stock model authority is [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md). This workflow does not redefine canonical `PART` identity or catalogue relationships.

## Scope

Stock Admin supports authorized creation and maintenance of operational stock records while keeping mutable inventory separate from catalogue/reference data.

The workflow covers:

- stock database readiness;
- authorized stock create/read/update behavior;
- canonical PART-linked and explicitly unresolved stock;
- normalized A-E stock quality capture;
- site and recursive rack/shelf/box storage selection;
- source party and donor vehicle capture as separate relationships;
- price/currency, availability and operational notes;
- stock search/filter behavior;
- validation and deterministic error handling;
- public-read versus authorized-mutation boundaries;
- test/acceptance environment identification and persisted-record verification.

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
- select normalized stock quality `A` through `E` using the meanings in `MODEL_STOCK.md`;
- select physical site and rack/shelf/box storage location;
- capture source party separately from donor vehicle;
- capture donor vehicle where known;
- capture price and currency where supported;
- capture operational notes;
- show availability and validation state;
- surface deterministic validation/error states.

Public unauthenticated users must not gain stock mutation capability through the page or its supporting API path.

## Operational workflow

```text
admin opens Stock Admin
  -> verifies stock database/environment
  -> resolves or explicitly leaves stock identity unresolved
  -> captures mutable stock facts
  -> validates quantity, quality, location, source and availability rules
  -> persists the stock record through the approved application/database path
  -> reads the persisted record back
  -> public/read presentation exposes only permitted stock information
```

The workflow is complete only when the persisted record can be read back from the same environment through the approved data path. A UI-only state change or repository fixture change is not persistence evidence.

## Stock quality

The stored identity is the normalized code:

```text
A New / Unused / Original Package
B Used / Good Working / Known History
C Used / Usable / No warranty
D Repairs / Needs Conditioning / Spares only
E Broken / Reference / Knowledge Gains
```

Localized label/description text is presentation and must not replace the stored code.

## Search/filter behavior

Operational stock search/filtering may use:

- part number / canonical PART reference;
- normalized stock quality code;
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
- unknown stock-quality code;
- missing required quality when availability requires it;
- missing physical location when availability requires it;
- unresolved stock without required source evidence;
- unauthorized mutation;
- failed persistence;
- unavailable stock database/setup state.

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
- detailed provenance beyond the approved stock evidence fields.
