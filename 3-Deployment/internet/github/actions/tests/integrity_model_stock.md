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
| Display name | Parts model integrity tests |
| Test working directory | `4-Production/internet/cloudflare/workers/jagports` |
| Stock model documentation | `5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_STOCK.md` |
| Sparse checkout | Worker directory plus VIEPS `SPEC` model documentation directory |
| Command | `npm test` |
| Runtime | Node.js 24, including built-in `node:sqlite` |
| Permissions | `contents: read` |

## Triggers

Run on pull-request opened, reopened and synchronize events, and pushes to main, when any of these change:

- Worker stock model, migration, test, or runtime files;
- VIEPS model `SPEC` documentation;
- this specification;
- the workflow definition.

The Worker directory path remains required because the executable migrations, tests and Worker code still live there.

The VIEPS `SPEC` path remains required because tests read the moved model documentation from that path.

## Execution and data isolation

Checkout the Worker directory and VIEPS `SPEC` model documentation directory.

Install Node 24 through the standard GitHub Actions setup action.

The current tests use only Node built-ins, so dependency installation is unnecessary.

The model helper creates in-memory SQLite databases with foreign-key enforcement, executes migrations in order using individual transactions, and loads synthetic fixtures.

These databases are discarded when the process exits.

No Cloudflare credentials, Wrangler deployment, remote D1 migration, inventory data, or live database connection is required.

## Covered stock-model behavior

- Operational stock identity.
- Part/catalogue separation.
- Normalized stock quality codes.
- Recursive site, rack, shelf and box storage.
- Donor vehicle, acquisition/source party and vendor/tenant-oriented source-party semantics.
- Quantity, price, currency and availability constraints.
- Unresolved stock source evidence requirement.
- Stock search/filter indexes.
- Foreign-key failures, uniqueness and CHECK boundaries.

## Results and review

Each job fails if `npm test` exits unsuccessfully.

A result on an older commit is historical evidence only.

SQLite coverage does not certify Cloudflare D1 deployment behavior, its actual migration ledger, live data integrity, or production-scale query performance.