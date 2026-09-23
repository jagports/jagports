# JEPC Data Importer runtime skeleton

Implements the first runtime slice of issue #355 and [DataImporter specification](SPEC_DataImporter.md). Run this application **locally on Windows**, beside the installed JEPC files, using **Node.js 24 or later**. It uses Node's built-in SQLite module; no package installation, server, cloud deployment or browser is required. Node may print an experimental SQLite warning on stderr.

This version performs **source inspection and local parsing**, not catalogue publication. `--parse XK` finds matching leaf models in the installed XML menu and stages every complete category bundle in those models, including available applicability sidecars. `inspect` checks one explicit bundle; `select --range xk` remains a bounded forty-bundle validation path. Parsing scans only selected model directories, while the optional estimator inventories the selected source scope. Missing sidecars and incomplete categories are recorded evidence, not inferred unrestricted applicability.

## Start on this computer

Open PowerShell in `5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/`. This application and its specification are Jagports software; the future `MediaImporter/` will live alongside it under `JEPC-Importers/`.

```powershell
node src/DataImporter.CLI.mjs --help
node src/DataImporter.CLI.mjs --parse XK
node src/DataImporter.CLI.mjs --parse X3 --json
node src/DataImporter.CLI.mjs --parse XJS
node src/DataImporter.CLI.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --model 3187 --category 11096 --item 1
node src/DataImporter.CLI.mjs status --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/DataImporter.CLI.mjs report --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/DataImporter.CLI.mjs doctor --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --full
$selection = node src/DataImporter.CLI.mjs select --range xk --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --seed "xk-selection-1" --json | ConvertFrom-Json
node src/DataImporter.CLI.mjs parse --manifest $selection.manifest --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --json
node src/DataImporter.CLI.mjs select --range xk --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --seed "xk-selection-1" --estimate
node src/DataImporter.CLI.mjs estimate-range --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --range xk --seed xk-inventory-1 --sample-size 100
npm test
```

For `--parse`, the default Windows source is `C:\Program Files\JEPC\applications\JEPC` and the default state directory is `%LOCALAPPDATA%\Jagports\JEPC-Importer`; override them with `--source` and `--state-dir` when needed. The source directory is read-only to this application. Put state outside the installation; paths resolving through junctions into the source are rejected. Keep the source stable during inspection. Do not share one ledger between computers: the single-writer check uses local process IDs. One state directory supports different profiles and source roots; `status` and `report` show its latest run. State remains local and must not be committed.

## CLI contract v1

| Command | Contract |
| --- | --- |
| `--parse <model-name-pattern>` | Primary local parsing entry point. Case-insensitive literal substring matching over the installed model XML names includes every matching leaf model and descendants of a matching parent, then stages every complete category bundle. `XK` includes the five XK leaf models; `X3` includes X300 and X308. The broader `XJ` also matches XJS, while `XJS` selects only XJS. The manifest lists matched Model_IDs and incomplete categories. It never publishes to D1. |
| `inspect` | Requires `--source`, `--state-dir`, `--model`, `--category`, `--item`; optional `--language` defaults to `0`. IDs must be numeric. Reads the English model menu for exact parent/model labels. |
| `inspect --json` | One final JSON snapshot on stdout; diagnostics on stderr. No terminal control sequences. |
| `status` | Read-only latest persisted snapshot; `--json` returns its machine representation. |
| `report` | Read-only JSON with latest run and ordered detailed events, including paths/checksums. Redirect stdout to save a report. |
| `doctor` | Read-only `quick_check` and `foreign_key_check`; `--full` selects `integrity_check`. Requires an existing ledger. |
| `select --range xk` | Selects 40 complete XK category bundles using `--seed`, with one from each source model before filling the remaining places by hash rank. Stores the Range, model/category identities, candidate counts, menu checksums and selected file checksums in a manifest. Other Ranges are rejected until their model mappings and selection rules are implemented. This is source selection only. |
| `parse --manifest` | Lower-level rerun of a saved selection. Reads and validates its model scope and checks each selected source checksum. Parses selected category, top-level and item-tree records plus existing applicability sidecars. Writes one local evidence file per bundle and reports unrecognized records. |
| `select --range xk --estimate` | After selection, optionally runs the Range estimator against that run's source and Model_ID set. Without `--estimate`, selection does no Range inventory. `--sample-size` and `--calibration` require this flag. Estimate failure is reported separately and does not erase the selection manifest. |
| `estimate-range` | Optional source inventory using `--source`, `--state-dir`, and `--range`. XK uses the five Model_IDs from `select`; another Range requires comma-separated `--models`. `--models` may narrow XK for a partial scan. Optional `--seed`, `--sample-size` (1–10000), `--calibration`, and `--json`. |

Exit codes: `0` successful inspection/read command, `1` invalid invocation or failure, `2` completed inspection with missing paths, `130` user stop/emergency exit. `COMPLETED` means the inspection recipe finished; it never means parts were imported. Unknown options and commands fail, including an unimplemented `run`/`migrate` command.

For `estimate-range`, exit `0` means the selected source scope was inventoried without observed filesystem errors, `2` means incomplete coverage, and `130` means interrupted. The command writes a separate `range-estimate-*.json` report outside the source installation; it does not touch the importer ledger or D1. It streams directory entries and keeps only the requested random sample in memory. Its scope is the selected `drilldown/pl_id_<Model_ID>` trees, model-specific menu files across available languages, and the shared English model menu. Shared media and files that cannot be attributed to a selected Model_ID are excluded. The report records the exact Model_IDs, so a narrowed scan is not a complete Range inventory.

The `--parse` pattern selects source models only. It does not name a destination Range or D1 database: `X3` selects X300/X308 models that belong to `XJ Range`, while broad `XJ` can also select models belonging to the separate `XJS` Range. This local phase preserves source model identities; later publication must resolve each model through the canonical VIEPS Range registry and refuse unresolved assignments. With `--parse ... --estimate`, the estimator reports the selected model pattern and `range: null`; no D1 projection is inferred from that source-only scope.

The report gives file counts and bytes by model/extension/source-file family, elapsed scan time, a reproducible seeded sample of XML/CSV files, sample read time, and a count of record-like lines in that sample. Record-like lines are a format clue, not parsed catalogue rows. Files with the lowest SHA-256 score of `seed + path` form the sample, independent of filesystem enumeration order. These are source measurements, **not** D1-size or import-duration measurements. A provisional linear projection becomes available only when `--calibration measured.json` points to a real published sample measurement:

```json
{"range":"xk","sourceBytes":1000000,"d1BytesAdded":450000,"importSeconds":120}
```

When an actual catalogue `run` command is implemented, its `--estimate` flag will call the same estimator before publication and will be off by default. There is no import `run` command yet. `select --range xk --estimate` provides the opt-in pre-import path now; the standalone `estimate-range` command remains available for an explicit Range scope. Every invocation scans its selected source anew. No result from one installation is bundled into the importer or used as a default calibration.

`sourceBytes` is the XML/CSV byte count actually imported in that measured sample; `d1BytesAdded` is the observed increase in D1 storage; `importSeconds` is measured import/publication time. The estimator scales those measurements to inventoried XML/CSV bytes and labels the projection and its calibration basis. Without such evidence, projected D1 bytes and import seconds remain `null`. A source tree changed during a long scan can yield inconsistent counts; use a stable installation for capacity planning. First Ctrl+C requests a partial report after the current file; second Ctrl+C exits immediately.

## Progress-screen contract v1

Interactive stdout is redrawn in place with the application name, copyright, source parent/model labels, language, phase, run state and aggregate files checked/total, unchanged and missing. Filenames, bundle keys and deep breadcrumbs appear only in the persistent detailed events/report. Region explicitly says it is not interpreted; neither `($)` nor labels automatically become a market restriction.

The screen explicitly states that catalogue import, content/translation counts and media processing are not implemented. Future content tables will distinguish canonical parts from source occurrences and translations as specified in v0.1; this skeleton supplies no fabricated part counters. There is no percentage for the full installation: the denominator is only the eight selected paths. Piped output prints one final screen or JSON snapshot.

`Q` in an interactive terminal or the first Ctrl+C requests stopping after the current file's checksum and SQLite checkpoint commit. A second Ctrl+C exits immediately. Completed checkpoints survive. On the next `inspect`, a dead owner's `RUNNING` record becomes `CRASH_RECOVERED` after a full integrity check. A live owner blocks concurrent inspection. PID reuse may conservatively block recovery until that unrelated process exits; no force-unlock command is supplied.

## Persistence and incremental boundary

`ledger.sqlite` uses controlled schema/contract version 1. Each file result and event are committed together with run counters. Run states are `RUNNING`, `COMPLETED`, `STOPPED_BY_USER`, `FAILED`, and `CRASH_RECOVERED`. Inspection-file states are `INSPECTED` and `MISSING`; they deliberately do not mark importer-spec bundles `PROCESSED`. Startup checks database health and rejects unsupported ledger versions.

Repeating `inspect` rehashes just its eight paths, identifies unchanged bytes using source root + relative path + SHA-256 + inspector version, and refreshes evidence. It does not trust mtime as identity. The SQLite ledger records inspection runs; `parse` uses separate local JSON staging files and does not mark ledger bundles as imported. Nothing is written to VIEPS or to the source installation.

Next slices: atomic whole-bundle transformation with occurrence-level applicability and grouped conditions, idempotent D1 publication, content/translation counters, and incremental MediaImporter with hotspot provenance. MediaImporter can share these operating conventions but has no executable implementation here. The separate applicability work in PR #659 is already merged into the destination model.

The `select --range xk` command recognizes the five XK source Model_IDs documented in `xk_range_ids.tsv`: 3187, 3183, 3178, 3173 and 7420. It reads the model menu and the five corresponding category menus, then scans only those five model `L0` folders for category, top-level and item files. A candidate needs a leaf-category menu row plus category, top-level and at least one item file. The selection manifest is keyed by Range, seed and language; the same selection must reproduce identical bytes or the command stops, prompting investigation of source changes. A new seed writes a separate manifest. A manifest is a selection/evidence record, not a claim that its item records were parsed or imported to D1.

`--parse <fragment>` reads `menus/models_l_id_0.xml` each run and resolves the fragment from source names and parent links; it does not use a fixed Range-to-Model_ID table. It checks every matching leaf model's category menu and model directory, recording incomplete leaf categories explicitly. Selection and parsing are repeatable: the first run writes a manifest and one evidence file per complete bundle, while an unchanged second run reuses them. `parse --manifest` is the lower-level rerun of a saved manifest. The parser reads each selected file and its corresponding `_attributes.xml` sidecar when present. It retains exact bytes, SHA-256, line numbers and opaque predicate tuples; absent sidecars appear in `missingOptionalSidecars`. Unknown records retain their location and set bundle status `UNKNOWN_STRUCTURE`. Parser-v3 evidence goes under `state-dir/model-staging/<manifest-hash>/parser-v3/` for model-fragment runs; older XK manifests remain readable in their own staging path. Source drift stops rather than silently replacing evidence. These files are local development evidence, not a D1 import or a finished occurrence model.

## Verification

`npm test` uses temporary synthetic fixtures to exercise model-name matching, checksum reuse/change/missing handling, exact parser byte preservation, sidecar capture, unrecognized records, safe stopping/resumption, writer exclusion/dead-owner recovery, failed runs, schema guards and CLI exit contracts. The installed XK forty-bundle run is a separate smoke check, not proof of full catalogue coverage. No recursive traversal of the entire source installation or production migration is required.
