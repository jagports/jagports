# VIEPS URL data-mode specification

## Ownership and boundary

`TEST=1` is a VIEPS website URL parameter. It selects fixture-backed website responses for development and review. It is not a DataImporter parameter, a second importer, or a setting stored in the importer SQLite ledger. DataImporter reads JEPC files and updates the reviewed Range D1 through its one CLI command; the website reads its databases through its existing Worker and browser UI.

The operational `jagports` D1 retains fixtures and mutable stock. Imported JEPC catalogue records belong in the reviewed `jagports-<range_slug>` D1 databases. The website must never infer that a fixture is imported evidence.

## Selection contract

| Website request | Catalogue read | Stock read |
|---|---|---|
| `?TEST=1` | Existing fixture-backed part search, Parts Tree and suitability routes in `jagports` | Existing fixture-mode stock behavior |
| `TEST` absent or any value other than `1` | Reviewed Range D1 binding for real imported catalogue data | Operational stock from `jagports`, excluding rows identified as fixtures |

The browser must carry `TEST=1` from the page URL into every catalogue and stock API request made for that page. Direct API callers use the same parameter. The URL parameter is request-scoped; it must not rewrite, delete, seed or copy database rows. The website must not silently fall back to fixtures when a real Range binding is missing, invalid, or unavailable. It must return an explicit unavailable/error state instead.

With one reviewed Range binding, the website may select that Range by default. With several bindings, a caller supplies an approved `range=<slug>` until a separately specified cross-Range discovery path exists. A model-name `--parse` pattern is not a website Range selector. A Range-local numeric PART ID is never a global identity and must not be written into an operational-stock foreign key.

## Truthfulness of returned data

Real-mode part search and Parts Tree may present imported numbered PARTs, exact occurrences and source paths that DataImporter has written to Range D1. Source branch text and raw applicability sidecars remain unverified evidence. Until verified applicability has been imported, the website must represent real-mode suitability as unavailable, not as unrestricted fitment or a confirmed exclusion. Missing imported images or hotspots remain unavailable. Fixture-mode responses retain their explicit fixture provenance.

The website's existing Worker HTTP entrypoint and browser client own this read-time choice. They are separate from the DataImporter process. Do not add a web interface to DataImporter, another importer command, a second website router, or a second copy of the same browser functionality.

Website JavaScript source files belong under `4-Production/internet/cloudflare/workers/jagports/js`, with distinct filenames for Worker and browser roles. Move superseded JavaScript source files out of `src/` and `public/` rather than retaining a second checked-in implementation. Keep the static-asset build/deployment path safe: only the intended browser assets may be public, and Worker/server source must not be exposed as an asset. Do not add deeper directories for this work.

The Worker entry point is `js/vieps-worker.js`. The build copies uniquely named browser sources from `js/` to the existing asset URLs used by the HTML; those output files are generated and ignored by Git. Tests read the checked-in source files, and deployment verifies that the browser assets were generated. There is no second checked-in JavaScript implementation in `public/`.

## Deployment and verification

The real-mode website requires the reviewed Range D1 identity, schema, binding and imported records. Database creation/schema setup and the CLI import are governed by the Range D1 and DataImporter records. The website deployment must verify its Range bindings before claiming real imported data is available. The existing `jagports` fixture data stays available through `TEST=1`.

Acceptance checks must cover `TEST=1` fixture responses, omitted/other `TEST` values using real data, propagation from page to API, fixture exclusion from real stock, missing binding without fallback, and direct API use. The importer CLI and SQLite ledger must remain independent of this URL parameter.

Governing specification Issue: #955. The separate website implementation Issue is #956. Range D1 setup and DataImporter writes remain under #555 and #355 respectively.
