# JEPC DataImporter

DataImporter runs on the Windows computer that has the JEPC installation. **The current command parses source categories into local evidence files; it does not create VIEPS catalogue records or upload anything to D1.** The [operating specification](SPEC_DataImporter.md) covers the later transformation and publication stages.

## Before the first run

Install Node.js 24 or later and open PowerShell at the root of the Jagports repository. The JEPC source root must contain `menus/models_l_id_0.xml` and `drilldown/`. The default root on the installation computer is `C:\Program Files\JEPC\applications\JEPC`.

```powershell
Set-Location .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter
node --version
node .\src\DataImporter.CLI.mjs --help
```

No `npm install` is needed. The application reads the JEPC installation without changing it. By default it writes local state under `$env:LOCALAPPDATA\Jagports\JEPC-Importer`; keep state outside the source installation.

## Parse categories

From the DataImporter directory, run:

```powershell
node .\src\DataImporter.CLI.mjs --parse XK
```

`XK` is matched case-insensitively against the model names in the installed XML menu. A matching parent includes its leaf models. The command identifies complete categories in those models, then makes up to **40 fresh random picks per run**. Each pick chooses a model with remaining categories and one category in that model. A category cannot be picked twice in the same run. Progress appears while selection and parsing run; the final output gives the matched-model count, eligible and staged category counts, and local staging directory. Repeat the command to make another set of picks. Different runs may overlap, and repeated random runs do not guarantee eventual coverage of every category.

To see **which categories this run picked** and its evidence counts, use JSON output:

```powershell
$result = node .\src\DataImporter.CLI.mjs --parse XK --json | ConvertFrom-Json
$result | Select-Object modelPattern, eligible, selected, incompleteCategories
$result.sampledCategories | Format-Table model, category, categoryLabel
$result.staging | Select-Object reused, unknown, missingOptionalSidecars, outputDir
```

`reused` counts unchanged categories whose evidence was already written by an earlier run. The files for each picked category are under `$result.staging.outputDir\M<model>\C<category>\L<language>\<hash>.json`. For example, to open the first picked category's evidence folder:

```powershell
$first = $result.sampledCategories[0]
$folder = Join-Path $result.staging.outputDir ("M{0}\C{1}\L{2}" -f $first.model, $first.category, $first.language)
Get-ChildItem -LiteralPath $folder -Filter '*.json' | Select-Object -ExpandProperty FullName
```

Each evidence file retains source bytes, checksums, ordered records, line numbers, available applicability sidecars and unknown record locations. Missing sidecars and incomplete categories are reported rather than treated as unrestricted applicability. Selection is held only in memory; there is no selection file to save or pass to another command.

For a JEPC installation in a different location, set both paths explicitly:

```powershell
$source = 'D:\JEPC\applications\JEPC'
$state = Join-Path $env:LOCALAPPDATA 'Jagports\JEPC-Importer'
node .\src\DataImporter.CLI.mjs --parse X3 --source $source --state-dir $state
```

`X3` matches X300 and X308 source models. `XJ` also matches XJS names, while `XJS` narrows the selection. These patterns select **source models**, never a destination Range or D1 database. X300 and X308 still belong to VIEPS `XJ Range`; destination Range resolution is a future publication step.

## Optional source estimate

Add `--estimate` to a parse command if you want a separate file/byte inventory for the matched models:

```powershell
$result = node .\src\DataImporter.CLI.mjs --parse XK --estimate --json | ConvertFrom-Json
$result.estimate
```

The estimate scans the selected **models' source trees**, not just the 40 picked categories, so it can take much longer. It writes a report outside the JEPC installation and does not infer a D1 size or import duration without measured calibration. `estimate-range` is an advanced command for an explicit Range and comma-separated `--models`; see `--help`.

## Inspect one known item

`inspect` is a separate, narrower diagnostic command. Supply numeric model, category and item IDs:

```powershell
node .\src\DataImporter.CLI.mjs inspect --source 'C:\Program Files\JEPC\applications\JEPC' --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-Importer" --model 3187 --category 11096 --item 1
```

It writes checksum observations to `ledger.sqlite` in the state directory. `status`, `report` and `doctor` read that **inspection ledger**; they do not report the random `--parse` staging runs. For this interactive inspection command, Q or the first Ctrl+C requests a stop after the current checkpoint; a second Ctrl+C exits immediately.

Run `npm test` from this directory to execute the synthetic parser, selection, safety and CLI tests. The sibling MediaImporter handles images and hotspots separately.
