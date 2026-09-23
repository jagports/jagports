# JEPC Data Importer runtime skeleton

Implements the first runtime slice of issue #355 and [DataImporter specification](SPEC_DataImporter.md). Run this application **locally on Windows**, beside the installed JEPC files, using **Node.js 24 or later**. It uses Node's built-in SQLite module; no package installation, server, cloud deployment or browser is required. Node may print an experimental SQLite warning on stderr.

This version performs real, bounded **source inspection**, not catalogue import. It reads eight expected paths for one explicitly selected model/category/item/language bundle, records SHA-256 evidence in its own SQLite ledger, and reports missing files. It does not enumerate the million-file installation. This path template is the initial XK inspection recipe, not a claim that every JEPC bundle has exactly these eight files. Missing sidecars are evidence to investigate, not an inferred absence of conditions.

## Start on this computer

Open PowerShell in `5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/`. This application and its specification are Jagports software; the future `MediaImporter/` will live alongside it under `JEPC-Importers/`.

```powershell
node src/DataImporter.CLI.mjs --help
node src/DataImporter.CLI.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --model 3187 --category 11096 --item 1
node src/DataImporter.CLI.mjs status --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/DataImporter.CLI.mjs report --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/DataImporter.CLI.mjs doctor --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --full
node src/DataImporter.CLI.mjs select-xk --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --seed "xk-selection-1"
node src/DataImporter.CLI.mjs estimate-range --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --range xk --seed xk-inventory-1 --sample-size 100
npm test
```

The source directory is read-only to this application. Put state outside the installation; paths resolving through junctions into the source are rejected. Keep the source stable during inspection. Do not share one ledger between computers: the single-writer check uses local process IDs. One state directory supports different profiles and source roots; `status` and `report` show its latest run. State remains local and must not be committed.

## CLI contract v1

| Command | Contract |
| --- | --- |
| `inspect` | Requires `--source`, `--state-dir`, `--model`, `--category`, `--item`; optional `--language` defaults to `0`. IDs must be numeric. Reads the English model menu for exact parent/model labels. |
| `inspect --json` | One final JSON snapshot on stdout; diagnostics on stderr. No terminal control sequences. |
| `status` | Read-only latest persisted snapshot; `--json` returns its machine representation. |
| `report` | Read-only JSON with latest run and ordered detailed events, including paths/checksums. Redirect stdout to save a report. |
| `doctor` | Read-only `quick_check` and `foreign_key_check`; `--full` selects `integrity_check`. Requires an existing ledger. |
| `select-xk` | Selects 40 complete XK category bundles using `--seed`, with one from each source model before filling the remaining places by hash rank. Stores a manifest with model/category identities, candidate counts, menu checksums and selected file checksums. This is source selection only. |
| `estimate-range` | Optional source inventory using `--source`, `--state-dir`, and `--range`. XK uses the five Model_IDs from `select-xk`; another Range requires comma-separated `--models`. `--models` may narrow XK for a partial scan. Optional `--seed`, `--sample-size` (1–10000), `--calibration`, and `--json`. |

Exit codes: `0` successful inspection/read command, `1` invalid invocation or failure, `2` completed inspection with missing paths, `130` user stop/emergency exit. `COMPLETED` means the inspection recipe finished; it never means parts were imported. Unknown options and commands fail, including an unimplemented `run`/`migrate` command.

For `estimate-range`, exit `0` means the selected source scope was inventoried without observed filesystem errors, `2` means incomplete coverage, and `130` means interrupted. The command writes a separate `range-estimate-*.json` report outside the source installation; it does not touch the importer ledger or D1. It streams directory entries and keeps only the requested random sample in memory. Its scope is the selected `drilldown/pl_id_<Model_ID>` trees, model-specific menu files across available languages, and the shared English model menu. Shared media and files that cannot be attributed to a selected Model_ID are excluded. The report records the exact Model_IDs, so a narrowed scan is not a complete Range inventory.

The report gives file counts and bytes by model/extension/source-file family, elapsed scan time, a reproducible seeded sample of XML/CSV files, sample read time, and a count of record-like lines in that sample. Record-like lines are a format clue, not parsed catalogue rows. Files with the lowest SHA-256 score of `seed + path` form the sample, independent of filesystem enumeration order. These are source measurements, **not** D1-size or import-duration measurements. A provisional linear projection becomes available only when `--calibration measured.json` points to a real published sample measurement:

```json
{"range":"xk","sourceBytes":1000000,"d1BytesAdded":450000,"importSeconds":120}
```

`sourceBytes` is the XML/CSV byte count actually imported in that measured sample; `d1BytesAdded` is the observed increase in D1 storage; `importSeconds` is measured import/publication time. The estimator scales those measurements to inventoried XML/CSV bytes and labels the projection and its calibration basis. Without such evidence, projected D1 bytes and import seconds remain `null`. A source tree changed during a long scan can yield inconsistent counts; use a stable installation for capacity planning. First Ctrl+C requests a partial report after the current file; second Ctrl+C exits immediately.

## Progress-screen contract v1

Interactive stdout is redrawn in place with the application name, copyright, source parent/model labels, language, phase, run state and aggregate files checked/total, unchanged and missing. Filenames, bundle keys and deep breadcrumbs appear only in the persistent detailed events/report. Region explicitly says it is not interpreted; neither `($)` nor labels automatically become a market restriction.

The screen explicitly states that catalogue import, content/translation counts and media processing are not implemented. Future content tables will distinguish canonical parts from source occurrences and translations as specified in v0.1; this skeleton supplies no fabricated part counters. There is no percentage for the full installation: the denominator is only the eight selected paths. Piped output prints one final screen or JSON snapshot.

`Q` in an interactive terminal or the first Ctrl+C requests stopping after the current file's checksum and SQLite checkpoint commit. A second Ctrl+C exits immediately. Completed checkpoints survive. On the next `inspect`, a dead owner's `RUNNING` record becomes `CRASH_RECOVERED` after a full integrity check. A live owner blocks concurrent inspection. PID reuse may conservatively block recovery until that unrelated process exits; no force-unlock command is supplied.

## Persistence and incremental boundary

`ledger.sqlite` uses controlled schema/contract version 1. Each file result and event are committed together with run counters. Run states are `RUNNING`, `COMPLETED`, `STOPPED_BY_USER`, `FAILED`, and `CRASH_RECOVERED`. Inspection-file states are `INSPECTED` and `MISSING`; they deliberately do not mark importer-spec bundles `PROCESSED`. Startup checks database health and rejects unsupported ledger versions.

Repeating the same command rehashes just these eight paths, identifies unchanged bytes using source root + relative path + SHA-256 + inspector version, and refreshes evidence. It does not trust mtime as identity. This is restartable inspection, not yet incremental parsing or source-to-destination publication. The ledger is the continuously updated development record; `report` exports the latest run at any checkpoint. Nothing is written to VIEPS or to the source installation.

Next slices: lossless category/item parsing with unknown-structure reports, atomic whole-bundle transformation with occurrence-level applicability and grouped conditions, idempotent D1 publication, content/translation counters, and incremental MediaImporter with hotspot provenance. MediaImporter can share these operating conventions but has no executable implementation here. The separate applicability work in PR #659 is already merged into the destination model.

The `select-xk` command recognizes the five XK source Model_IDs documented in `xk_range_ids.tsv`: 3187, 3183, 3178, 3173 and 7420. It reads the model menu and the five corresponding category menus, then scans only those five model `L0` folders for category, top-level and item files. A candidate needs a leaf-category menu row plus category, top-level and at least one item file. The selection manifest is keyed by seed and language; the same seed must reproduce identical bytes or the command stops, prompting investigation of source changes. A new seed writes a separate manifest. A manifest is a selection/evidence record, not a claim that its item records were parsed or imported to D1.

## Verification

`npm test` uses temporary synthetic fixtures to exercise checksum reuse/change/missing handling, source preservation, safe stopping/resumption, writer exclusion/dead-owner recovery, failed runs, schema guards and CLI exit contracts. The installed XK bundle is a separate smoke check, not proof of full catalogue coverage. No recursive source traversal or production migration is required.
