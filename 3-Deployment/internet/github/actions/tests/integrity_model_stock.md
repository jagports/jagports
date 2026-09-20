# Stock model integrity test automation

## Purpose and boundary

This GitHub Actions workflow tests the Stock Model implementation against disposable SQLite databases.

SQL migrations define and create the executable schema.

`5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_STOCK.md` describes the stock model.

This workflow neither creates the production database nor inspects production database state.

## Repository contract

| Item | Value |
|---|---|
| Workflow | `.github/workflows/integrity_parts-model.yml` |
| Display name | VIEPS model integrity tests |
| Test working directory | `4-Production/internet/cloudflare/workers/jagports` |
| Stock model documentation | `5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_STOCK.md` |
| Sparse checkout | Worker directory plus VIEPS `SPEC` model documentation directory and pinned local Tailwind source |
| Build/install | `npm ci --ignore-scripts --no-audit --no-fund`, then `npm run build` |
| Test command | `npm test` |
| Runtime | Node.js 24, including built-in `node:sqlite` |
| Permissions | `contents: read` |

## Triggers

Run on pull-request opened, reopened and synchronize events, and pushes to main, when any of these change:

- Worker stock model, migration, test, runtime, or generated-asset inputs;
- VIEPS model `SPEC` documentation;
- pinned local Tailwind source;
- this specification;
- the workflow definition.

The Worker directory path remains required because the executable migrations, tests, Worker code and UI build package files still live there.

The VIEPS `SPEC` path remains required because tests read the moved model documentation from that path.

The pinned Tailwind source path remains required because the Worker build verifies locally generated deploy assets before tests execute.

## Execution and data isolation

Checkout the Worker directory, VIEPS `SPEC` model documentation directory, and pinned local Tailwind source.

Install Node 24 through the standard GitHub Actions setup action.

Restore the locked Worker build dependencies with `npm ci`, build and verify generated deploy assets with `npm run build`, then execute the full Worker test suite with `npm test`.

The model helper creates in-memory SQLite databases with foreign-key enforcement, executes the complete ordered migration chain using individual transactions, and loads deterministic fixtures only where a test explicitly requests them. Clean-schema tests therefore begin from an empty database rather than a prebuilt schema.

These databases are discarded when the process exits.

No Cloudflare credentials, Wrangler deployment, remote D1 migration, inventory data, or live database connection is required.

## Covered stock-model behavior

- Operational stock identity.
- Part/catalogue separation.
- Normalized A-E stock quality codes and deterministic meaning fixtures.
- Multi-site storage with optional rack/shelf/box hierarchy and recursive boxes.
- Donor vehicle and source party as separate relationships.
- Vendor/person/organization/tenant/other source-party vocabulary.
- Quantity, price, currency and availability constraints.
- Unresolved stock source evidence requirement.
- Stock search/filter indexes.
- Foreign-key failures, uniqueness and CHECK boundaries.
- Generated UI asset verification before the Worker tests run.
- Worker/D1-compatible stock create/read/update persistence using normalized stock fields.

## Results and review

Each job fails if the build/asset verification or `npm test` exits unsuccessfully.

A result on an older commit is historical evidence only.

The deployed-runtime test remains skipped unless `VIEPS_BASE_URL` is supplied; that skip is not evidence of deployed runtime success.

SQLite/D1-interface coverage does not certify Cloudflare D1 deployment behavior, its actual migration ledger, live data integrity, real Jagports inventory, or production-scale query performance. Environment-specific D1 verification follows the separate Cloudflare migration procedure.
