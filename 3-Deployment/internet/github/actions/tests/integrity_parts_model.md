# Parts Model integrity test automation

## Purpose and boundary

This GitHub Actions workflow tests the Parts Model implementation. SQL migrations define and create the model; PART_MODEL.md describes it. This workflow runs the existing automated suite against disposable SQLite databases. It neither creates the production database nor inspects its condition periodically.

## Repository contract

| Item | Value |
|---|---|
| Workflow | `.github/workflows/integrity_parts-model.yml` |
| Display name | Parts model integrity tests |
| Test working directory | `4-Production/internet/cloudflare/workers/jagports` |
| Command | `npm test` |
| Runtime | Node.js 24, including built-in `node:sqlite` |
| Runners | `ubuntu-latest` and `windows-latest` |
| Permissions | `contents: read` |

## Triggers

Run on pull-request opened, reopened and synchronize events, and pushes to main, when the Worker directory, this specification or the workflow changes. There is no schedule. A pull-request run tests the proposed merge result; reviewers must also confirm that it belongs to the current PR head. Both OS jobs must complete; one failing job does not cancel the other.

## Execution and data isolation

Checkout the Worker directory and install Node 24 through the standard GitHub Actions setup action. The current tests use only Node built-ins, so dependency installation is unnecessary. If tests gain external dependencies, update the workflow and this specification together.

The model helper creates in-memory SQLite databases with foreign-key enforcement, executes migrations in order using individual transactions, and loads synthetic fixtures. Tests also build populated earlier migration prefixes to exercise upgrades and rollback. These databases are discarded when the process exits. No Cloudflare credentials, Wrangler deployment, remote D1 migration, inventory data, or live database connection is required.

## Covered behavior

- Complete migration chain and populated upgrades, including retention of source fields and nullable records.
- Representative part, occurrence, vehicle/VIN, fitment/exclusion, image, diagram/hotspot, supersession and stock relationships.
- Declared foreign-key failures, uniqueness and CHECK boundaries, deletion behavior and transactional rollback.
- Documented index inventory and representative SQLite query plans.
- Worker SQL through the test D1 adapter, plus existing normalization and model structure tests.

SQLite coverage does not certify Cloudflare D1 deployment behavior, its actual migration ledger, live data integrity, or query performance at production scale. Those require separately authorized validation.

## Results and review

Each OS job fails if `npm test` exits unsuccessfully. Open the PR Checks tab, identify the latest commit, then inspect both jobs and their test summary. A result on an older commit is historical evidence only. The workflow does not configure branch protection or designate itself a required check; repository administrators own that setting.

The deployed-runtime suite is skipped when `VIEPS_BASE_URL` is absent, as it is in this workflow. An explicit skip is not evidence of deployed runtime success. Test counts may evolve; review failures and skip reasons rather than relying on a fixed count. There must be no failed tests in either OS job.

To reproduce locally with Node 24, run `npm test` from the Worker directory. `npm run test:runtime` is a separate opt-in runtime check requiring a suitable VIEPS_BASE_URL; it is not periodic production monitoring.
