# JEPC Data Importer runtime skeleton

Implements the first runtime slice of issue #355 and [importer specification v0.1](../SPEC_JEPC_IMPORTER_v0.1.md). Run this application **locally on Windows**, beside the installed JEPC files, using **Node.js 24 or later**. It uses Node's built-in SQLite module; no package installation, server, cloud deployment or browser is required. Node may print an experimental SQLite warning on stderr.

This version performs real, bounded **source inspection**, not catalogue import. It reads eight expected paths for one explicitly selected model/category/item/language bundle, records SHA-256 evidence in its own SQLite ledger, and reports missing files. It does not enumerate the million-file installation. This path template is the initial XK inspection recipe, not a claim that every JEPC bundle has exactly these eight files. Missing sidecars are evidence to investigate, not an inferred absence of conditions.

## Start on this computer

Open PowerShell in this `DataImporter` directory:

```powershell
node src/cli.mjs --help
node src/cli.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --model 3187 --category 11096 --item 1
node src/cli.mjs status --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/cli.mjs report --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/cli.mjs doctor --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --full
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

Exit codes: `0` successful inspection/read command, `1` invalid invocation or failure, `2` completed inspection with missing paths, `130` user stop/emergency exit. `COMPLETED` means the inspection recipe finished; it never means parts were imported. Unknown options and commands fail, including an unimplemented `run`/`migrate` command.

## Progress-screen contract v1

Interactive stdout is redrawn in place with the application name, copyright, source parent/model labels, language, phase, run state and aggregate files checked/total, unchanged and missing. Filenames, bundle keys and deep breadcrumbs appear only in the persistent detailed events/report. Region explicitly says it is not interpreted; neither `($)` nor labels automatically become a market restriction.

The screen explicitly states that catalogue import, content/translation counts and media processing are not implemented. Future content tables will distinguish canonical parts from source occurrences and translations as specified in v0.1; this skeleton supplies no fabricated part counters. There is no percentage for the full installation: the denominator is only the eight selected paths. Piped output prints one final screen or JSON snapshot.

`Q` in an interactive terminal or the first Ctrl+C requests stopping after the current file's checksum and SQLite checkpoint commit. A second Ctrl+C exits immediately. Completed checkpoints survive. On the next `inspect`, a dead owner's `RUNNING` record becomes `CRASH_RECOVERED` after a full integrity check. A live owner blocks concurrent inspection. PID reuse may conservatively block recovery until that unrelated process exits; no force-unlock command is supplied.

## Persistence and incremental boundary

`ledger.sqlite` uses controlled schema/contract version 1. Each file result and event are committed together with run counters. Run states are `RUNNING`, `COMPLETED`, `STOPPED_BY_USER`, `FAILED`, and `CRASH_RECOVERED`. Inspection-file states are `INSPECTED` and `MISSING`; they deliberately do not mark importer-spec bundles `PROCESSED`. Startup checks database health and rejects unsupported ledger versions.

Repeating the same command rehashes just these eight paths, identifies unchanged bytes using source root + relative path + SHA-256 + inspector version, and refreshes evidence. It does not trust mtime as identity. This is restartable inspection, not yet incremental parsing or source-to-destination publication. The ledger is the continuously updated development record; `report` exports the latest run at any checkpoint. Nothing is written to VIEPS or to the source installation.

Next slices: bounded bundle discovery, lossless parsing/raw preservation and unknown-structure reports, atomic whole-bundle transformations with occurrence-level applicability and grouped conditions, destination staging/publication, content/translation counters, and incremental MediaImporter with hotspot provenance. MediaImporter can share these operating conventions but has no executable implementation here. The separate applicability proposal PR #659 is not a runtime dependency.

## Verification

`npm test` uses temporary synthetic fixtures to exercise checksum reuse/change/missing handling, source preservation, safe stopping/resumption, writer exclusion/dead-owner recovery, failed runs, schema guards and CLI exit contracts. The installed XK bundle is a separate smoke check, not proof of full catalogue coverage. No recursive source traversal or production migration is required.
