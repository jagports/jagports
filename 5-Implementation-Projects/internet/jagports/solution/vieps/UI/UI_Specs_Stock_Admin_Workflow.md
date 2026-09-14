# VIEPS Stock Admin and Operational Workflow Specification

## Status

This document specifies the retained MVP stock functionality for #280 after the stock-retention decision.

Stock functionality remains inside the reduced MVP closure gate. The current priority path is #612/#613.

## Scope

The MVP must support a fixture-backed, part-number-first VIEPS path with stock functionality retained.

The stock scope includes:

- stock DB creation/setup for the MVP test environment;
- administrator stock-management UI page;
- operational stock workflow;
- stock create/read/update behavior where approved;
- public-read versus administrator-mutation boundary;
- stock functions testable with #607 fixture parts;
- non-fixture real stock information for the fixture parts used in MVP testing.

## Source model

The stock workflow consumes the accepted operational stock model from:

- #570 — VIEPS / Complete MVP operational stock model requirements;
- `4-Production/internet/cloudflare/workers/jagports/MVP_STOCK_MODEL.md`.

This document does not redefine the stock model. It specifies workflow and UI behavior around it.

## Stock DB creation and setup

The MVP test environment must have an operational stock database created from the approved schema/migration path.

The setup instructions or implementation evidence must identify:

- which migration chain creates the operational stock tables;
- how the MVP test database is initialized;
- how stock fixtures or real stock seed records are loaded;
- how an acceptance tester can confirm stock records exist before UI testing;
- which environment is being tested: local, preview, or deployed runtime.

A successful stock DB setup must make stock records queryable through the approved Worker/API/D1 path, not by reading mutable stock data from repository Markdown files.

## Fixture-part stock requirement

The #607 fixture parts remain valid as catalogue/search fixtures.

For MVP stock testing, those fixture parts must also have stock information that is treated as real stock information for the MVP test environment, not merely randomized synthetic demo stock.

Required rule:

- catalogue/search details may remain fixture-backed where full JEPC import is out of scope;
- stock records used for MVP stock workflow testing must be identified as operational stock test records;
- stock records must not be described as real production Jagports inventory unless independently verified;
- stock records must not be mixed into immutable catalogue/reference/JEPC data.

## Stock management administrator UI

The stock admin page must support administrator-only stock mutation.

Minimum MVP admin UI capabilities:

- create a stock record;
- edit approved mutable stock fields;
- select or enter canonical PART reference / part number where resolved;
- support unresolved/non-catalogue stock without fabricating a PART;
- capture quantity;
- capture controlled condition/status;
- select physical site and recursive storage location;
- capture source/vendor/person/organization separately from donor vehicle;
- capture donor vehicle where known;
- capture price/currency where supported;
- capture notes;
- show availability state and validation result;
- surface deterministic validation/error states.

Public unauthenticated users must not be able to mutate stock through this page or its supporting API path.

## Operational stock workflow

The MVP workflow is:

```text
admin opens stock-management UI
  -> verifies stock DB/environment
  -> searches or selects fixture-backed PART / part number
  -> creates or updates stock record
  -> stock record persists through Worker/API/D1
  -> public/read path can display or search permitted stock information
  -> admin-only mutation remains protected
```

## Search/filter behavior

The stock workflow must specify or implement basic stock search/filter operations for MVP acceptance.

Minimum filters/search inputs:

- part number / canonical PART reference;
- condition/status;
- availability;
- physical location;
- source/vendor/person/organization;
- donor vehicle where known;
- free-text notes where supported.

Search/filter behavior must return expected stock records for the fixture parts used in MVP stock testing.

## Validation and error behavior

The UI/API must visibly reject or report:

- invalid quantity;
- missing required condition/status when availability requires it;
- missing physical location when availability requires it;
- unresolved/non-catalogue stock without required source evidence;
- public mutation attempt;
- failed persistence;
- unavailable stock DB/setup state.

## Acceptance-test relationship

#546 must include retained stock functionality after #612/#613 scope is ready.

The reduced MVP acceptance test should verify:

- fixture part search still resolves the expected PART;
- stock information is available for fixture parts used in MVP stock testing;
- admin can create/update permitted stock records;
- public users cannot mutate stock;
- stock records persist and can be read back;
- invalid stock operations fail deterministically;
- no complete JEPC import, full VIN flow, full EPC navigation, or complete fitment explanation is required.

## Boundaries

Out of scope unless separately approved:

- warehouse transaction/history ledger;
- reservations and sales workflow;
- individual physical-unit identity;
- detailed provenance redesign beyond the MVP fields;
- complete JEPC import;
- complete VIN/vehicle-context flow;
- complete EPC range/model/category navigation;
- complete fitment explanation.

## Traceability

- #280 — Define and implement complete Jagports application MVP.
- #612 — VIEPS Stock / Specify and implement stock management admin UI page.
- #613 — VIEPS Stock / Specify operational stock workflow.
- #607 / PR #617 — fixture-backed searchable MVP dataset.
- #570 / PR #571 — completed operational stock model foundation.
- #546 — reduced end-to-end MVP acceptance test.
- #448 — public VIEPS access with administrator stock authorization.
