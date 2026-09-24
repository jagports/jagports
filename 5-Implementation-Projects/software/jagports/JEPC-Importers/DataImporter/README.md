# JEPC DataImporter v0.1a

DataImporter runs on the Windows computer that has the JEPC installation. **The current command parses source categories into local evidence files; it does not create VIEPS catalogue records or upload anything to D1.** The [operating specification](SPEC_DataImporter.md) covers the later transformation and publication stages.

## Before the first run

Install Node.js 24 or later and open PowerShell at the root of the Jagports repository. The JEPC source root must contain `menus/models_l_id_0.xml` and `drilldown/`. The default root on the installation computer is `C:\Program Files\JEPC\applications\JEPC`.

```powershell
Set-Location .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter
node --version
```

No `npm install` is needed. The application reads the JEPC installation without changing it. By default it writes local state under `$env:LOCALAPPDATA\Jagports\JEPC-Importer`; keep state outside the source installation.

## Parse categories

From the DataImporter directory, run with the required `--parse PATTERN` parameter:

```powershell
node .\src\DataImporter.CLI.mjs --parse XK
```

`XK` is matched case-insensitively against the model names in the installed XML menu. A matching parent includes its leaf models. The command identifies complete categories in those models, then makes up to **40 fresh random picks per run**. Each pick chooses a model with remaining categories and one category in that model. A category cannot be picked twice in the same run. Progress appears while selection and parsing run; the final output gives the matched-model count, eligible and staged category counts, and local staging directory. Repeat the command to make another set of picks. Different runs may overlap, and repeated random runs do not guarantee eventual coverage of every category.

The result is JSON. To see **which categories this run picked** and its evidence counts in PowerShell:

```powershell
$result = node .\src\DataImporter.CLI.mjs --parse XK | ConvertFrom-Json
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

For a JEPC installation in a different location, set its source root in the environment before running the same command:

```powershell
$env:JEPC_SOURCE = 'D:\JEPC\applications\JEPC'
node .\src\DataImporter.CLI.mjs --parse XK
```

`--parse` matches model names from the source XML.
The pattern must contain at least two characters.
The CLI accepts no other flags or positional commands. Progress appears on standard error; the final JSON result appears on standard output.

## Optional import estimates

Add the optional `--estimate` flag to a parse command if you want a separate file/byte inventory for the matched models. `--estimate` cannot run without `--parse PATTERN`:

```powershell
$result = node .\src\DataImporter.CLI.mjs --parse XK --estimate | ConvertFrom-Json
$result.estimate
```

The estimate inventories source files for the matched models, beyond the 40 parsed categories. Its report records measured file and byte counts and elapsed scan time. D1 storage and import-time projections require calibration from an actual published import; they are unavailable in v0.1a.

Run `npm test` from this directory to execute the synthetic parser, selection, safety and CLI tests. The sibling MediaImporter handles images and hotspots separately.
