# JEPC DataImporter

Run locally on Windows with Node.js 24 or later, beside the installed JEPC files. The current application inspects source files and stages lossless category evidence locally. It does not transform catalogue relationships or publish to D1. See the [operating specification](SPEC_DataImporter.md) for the intended later stages.

```powershell
node src/DataImporter.CLI.mjs --help
node src/DataImporter.CLI.mjs --parse XK
node src/DataImporter.CLI.mjs --parse X3 --json
node src/DataImporter.CLI.mjs --parse XK --seed second-sample
node src/DataImporter.CLI.mjs --parse XJS --estimate
node src/DataImporter.CLI.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --model 3187 --category 11096 --item 1
node src/DataImporter.CLI.mjs status --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/DataImporter.CLI.mjs report --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer"
node src/DataImporter.CLI.mjs doctor --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --full
npm test
```

`--parse PATTERN` reads the installed `menus/models_l_id_0.xml` on every run. It matches a case-insensitive literal substring of source model names and includes descendants when a parent row matches. For example, `X3` matches X300 and X308; `XJ` also matches XJS, while `XJS` narrows to that family. It stages **at most 40 complete category bundles per run** across the matched models. Selection is repeatable: a hash ranks category identities, with one category per model chosen first when the cap permits, then the remaining places filled by rank. The default seed is stable; `--seed TEXT` chooses another repeatable sample for a later run. The result reports eligible, selected and incomplete category counts. There is no fixed model-ID mapping. The default source is `C:\Program Files\JEPC\applications\JEPC`; the default state directory is `%LOCALAPPDATA%\Jagports\JEPC-Importer`. Override either with `--source` or `--state-dir`.

Selection exists only in memory during the command. One bundle is a complete source category: its category, top-level and item files, plus available sidecars. The parser checks the selected file hashes and writes one evidence JSON file for each bundle. It calculates a SHA-256 hash of the current selection, including file checksums, to choose a repeatable output folder under `state-dir/model-staging/`. No selection file is saved. A repeated run against unchanged source reuses exact evidence; changed source produces a new selection and staging location. Evidence preserves source bytes, line numbers, ordered records, optional applicability sidecars and unknown record locations. Missing sidecars do not imply unrestricted applicability. The source installation is read-only and state must live outside it.

The pattern selects source models, not a destination Range or database. X300 and X308 belong to `XJ Range` even when selected with `X3`; XJS remains a separate Range even when selected by `XJ`. A future publication stage must resolve each Model_ID through the canonical VIEPS Range registry and reject unresolved assignments. Local staging does not claim that this resolution or D1 publication has happened.

`--estimate` is optional on `--parse`. It scans the selected model scope and writes a source inventory report, including file counts, bytes, elapsed time and a seeded sample of XML/CSV files. It makes no D1 size or import-duration projection without measured calibration, and a model-pattern scope has no inferred destination Range. `estimate-range` remains available for an explicit Range and comma-separated `--models`; its report stays outside the source installation. No measurements from one computer are bundled as defaults.

`inspect` examines one explicitly named model/category/item bundle and records checksums in the local SQLite ledger. `status`, `report`, and `doctor` read that ledger. `inspect` displays a bounded progress screen; Q or the first Ctrl+C stops after the current checkpoint, and a second Ctrl+C exits. Repeating inspection rehashes its selected paths. The ledger is separate from parser staging and neither marks catalogue bundles imported.

Future slices cover transformation into explicit part occurrences and applicability conditions, idempotent D1 publication, translations and content counts. The sibling MediaImporter handles images and hotspots independently. Run `npm test` for synthetic parsing, source safety, repeatability, and CLI checks.
