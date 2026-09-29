# JEPC DataImporter v0.1a

DataImporter is a command-line program for the Windows computer that has the JEPC installation. It selects and parses JEPC XML/CSV category bundles, preserves their source evidence in a local SQLite ledger, and can inject the selected catalogue data into the approved D1 parts database.

The CLI has two parsing selectors:

- `--category MODEL_ID:CATEGORY_ID` selects one category. Optional `--item ID` limits the D1 update to that item; without it, every item in the category is updated.
- `--parse PATTERN` matches source model names from JEPC's model XML and selects up to 40 random complete category bundles across all matching models.

Both selectors require `--source` and `--state-dir`. `--language N` is optional and defaults to `0`. Output is readable text by default; add `--json` for machine-readable output. Parsing stages source evidence locally. Add `--import` to request the D1 update. Add `--estimate` after `--import` to run the optional per-run estimate over the selected source-model scope.

## Run from Git Bash

Change to the Jagports project root first. Replace the example path with the absolute Git Bash path of your checkout:

```bash
PROJECT_ROOT="/c/path/to/jagports"
cd "$PROJECT_ROOT"
pwd
```

The printed directory must be the repository root. Then set the JEPC source and SQLite ledger location. The `ledger.sqlite` file is stored directly in `5-Implementation-Projects/software/jagports/JEPC-Importers/`; keep this same `state_dir` for every run. Git ignores the SQLite database and its journal/sidecar files. Since the repository is in a synced folder, use one DataImporter process at a time and do not operate concurrently from another synced checkout against the same ledger.

```bash
source_root='/c/Program Files/JEPC/applications/JEPC'
state_dir="$PWD/5-Implementation-Projects/software/jagports/JEPC-Importers"
```

If an earlier run created a ledger under `%LOCALAPPDATA%\Jagports\JEPC-Importer`, preserve its history by moving it once after DataImporter has exited. Stop if the old file is missing or the destination already exists:

```bash
old_ledger="$(cygpath -u "$LOCALAPPDATA")/Jagports/JEPC-Importer/ledger.sqlite"
new_ledger="$state_dir/ledger.sqlite"
if [[ ! -f "$old_ledger" ]]; then
  echo "Old ledger not found; stop and check its path."
elif [[ -e "$new_ledger" ]]; then
  echo "Destination ledger already exists; stop and inspect both files."
else
  mv "$old_ledger" "$new_ledger"
fi
```

Verify the moved ledger before importing:

```bash
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs doctor --state-dir "$state_dir" --full
```

For a random XK run that stages locally and injects up to 40 complete category bundles into their mapped D1 parts database:

```bash
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs \
  --source "$source_root" --state-dir "$state_dir" --parse XK --import
```

For a single category and one item:

```bash
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs \
  --source "$source_root" --state-dir "$state_dir" --category 3187:11096 --item 1 --import
```

Omit `--item 1` to update every item in that category. Omit `--import` to parse and stage the source evidence in SQLite without contacting D1. Add `--language 2` to select another JEPC language (the default is `0`). Add `--json` if the result will be consumed by another program.

For example, to include the optional estimate on an import run:

```bash
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs \
  --source "$source_root" --state-dir "$state_dir" --parse XK --import --estimate --json
```

The estimate inventories files for the selected models, samples source-file read throughput, and estimates the selected bundles' source parsing duration for this run. It reports total inventory bytes and scan time as well. A D1 write-duration projection requires measured calibration and is reported unavailable until such calibration exists; the estimator never invents a D1 time.

## Terminal progress and result

In an interactive terminal, category selection and parsing refresh a progress screen automatically. No keys or other input are needed. Redirected output receives periodic progress lines. The screen, help output, and final text show `v0.1a-<short commit hash>` from the current Git checkout; JSON includes this value as `build` alongside release `version`. If Git metadata is unavailable, the build label ends in `unknown`. The final result is plain text unless `--json` is supplied. Safe stopping is available on the original `inspect` command; catalogue parsing is resumable from its SQLite evidence ledger.

A `d1Import.phase=PARTS_D1_IMPORT` result means the remote update completed and was confirmed. `NOT_REQUESTED` means only SQLite staging occurred. `NOT_CONFIGURED` means `--import` was requested but `CLOUDFLARE_API_TOKEN` was absent, so no D1 write occurred. A remote identity, schema or confirmation failure is an error; it is never reported as a successful import.

## Database setup and routing

Before using `--import`, follow the repository [D1 operations guide](../../../../../3-Deployment/internet/cloudflare/d1/OPERATIONS.md) and the [parts database deployment specification](../../../../../3-Deployment/internet/cloudflare/d1/SPEC_DATABASES.md). The reviewed JEPC source ancestry mapping selects the destination database named `parts-<approved_range_slug>`. Neither `--parse` nor `--category` chooses a database. Set `CLOUDFLARE_API_TOKEN` in the same shell that runs DataImporter; never put the token in a command argument or repository file.

DataImporter validates the reviewed database identity and schema before writing. A whole-category update replaces that category atomically. An item-scoped update replaces only that item's D1 rows and removes the category-wide completion marker, so a partial update is not represented as a complete category import. The local SQLite ledger retains source bytes and evidence and distinguishes staged data from confirmed D1 updates. Each `--parse --import` run injects only the up to 40 category bundles selected for that run; bundles already staged outside the selection remain in SQLite for later runs. Repeated runs preserve unrelated imported categories and safely retry incomplete updates.

## Other commands

The original bounded eight-file source scan remains available with the same CLI file. It uses the compound category selector and an explicit item ID:

```bash
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs inspect \
  --source "$source_root" --state-dir "$state_dir" --category 3187:11096 --item 1
```

It checks the selected source files and records their checksums in SQLite; it does not update D1. The ledger commands are:

```bash
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs status --state-dir "$state_dir"
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs report --state-dir "$state_dir"
node 5-Implementation-Projects/software/jagports/JEPC-Importers/DataImporter/src/DataImporter.CLI.mjs doctor --state-dir "$state_dir" --full
```

Add `--json` to any command for machine-readable output. `doctor --full` runs the full SQLite integrity check.

Node.js 24 or later is required. No npm install is needed. The default example JEPC source path is `C:\\Program Files\\JEPC\\applications\\JEPC`; pass the actual installation path explicitly with `--source`.
