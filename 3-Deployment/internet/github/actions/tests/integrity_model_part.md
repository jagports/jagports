# Part model integrity test automation

## Purpose and boundary

This GitHub Actions workflow tests the Part Model implementation against disposable SQLite databases.

SQL migrations define and create the executable schema.

`5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md` describes the part model.

This workflow neither creates the production database nor inspects production database state.

## Repository contract

| Item | Value |
|---|---|
| Workflow | `.github/workflows/integrity_parts-model.yml` |
| Display name | VIEPS model integrity tests |
| Test working directory | `4-Production/internet/cloudflare/workers/jagports` |
| Part model documentation | `5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md` |
| Sparse checkout | Worker directory plus VIEPS `SPEC` model documentation directory and pinned local Tailwind source |
| Build/install | `npm ci --ignore-scripts --no-audit --no-fund`, then `npm run build` |
| Test command | `npm test` |
| Runtime | Node.js 24, including built-in `node:sqlite` |
| Permissions | `contents: read` |

## Triggers

Run on pull-request opened, reopened and synchronize events, and pushes to main, when any of these change:

- Worker model, migration, test, runtime, or generated-asset inputs;
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

The model helper creates in-memory SQLite databases with foreign-key enforcement, executes migrations in order using individual transactions, and loads synthetic fixtures.

These databases are discarded when the process exits.

No Cloudflare credentials, Wrangler deployment, remote D1 migration, inventory data, or live database connection is required.

## Covered part-model behavior

- Canonical part identity and part-number normalization.
- Part occurrences and source context.
- Part images and unavailable image placeholders.
- Model-range and VIN-range applicability relationships.
- Supersession relationships.
- Fitment and exclusion representation.
- Diagrams, hotspots and catalogue vehicle-location mapping.
- Part-to-stock relationship boundary.
- Foreign-key failures, uniqueness and CHECK boundaries.
- Documented index inventory and representative SQLite query plans.
- Generated UI asset verification before the Worker tests run.

## Results and review

Each job fails if the build/asset verification or `npm test` exits unsuccessfully.

A result on an older commit is historical evidence only.

The deployed-runtime test remains skipped unless `VIEPS_BASE_URL` is supplied; that skip is not evidence of deployed runtime success.

SQLite coverage does not certify Cloudflare D1 deployment behavior, its actual migration ledger, live data integrity, or production-scale query performance.
