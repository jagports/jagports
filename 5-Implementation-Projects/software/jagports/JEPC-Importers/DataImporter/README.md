# JEPC DataImporter v0.1a

DataImporter runs on the Windows computer that has the JEPC installation. **The current command parses source categories into local evidence files; it does not create VIEPS catalogue records or upload anything to D1.** The [operating specification](SPEC_DataImporter.md) covers the later transformation and publication stages.

## Agent and operator procedure

Run these steps on the Windows computer with the JEPC installation. When asked to run or investigate DataImporter, an agent with access to that computer should execute this procedure and report its findings, rather than ask the human to transcribe a chat command. Install Node.js 24 or later, open PowerShell at the root of the Jagports repository, and check that the source root contains `menus/models_l_id_0.xml` and `drilldown/`. The default source root is `C:\Program Files\JEPC\applications\JEPC`.

```powershell
Set-Location .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter
node --version
```

No `npm install` is needed. The application reads the JEPC installation without changing it. By default it writes local state under `$env:LOCALAPPDATA\Jagports\JEPC-Importer`; keep state outside the source installation.

Run the importer **once** and keep that run's result in `$result`:

```powershell
$result = node .\src\DataImporter.CLI.mjs --parse XK | ConvertFrom-Json
$result | Select-Object modelPattern, modelIds, eligible, selected, incompleteCategories
$result.sampledCategories | Format-Table model, category, categoryLabel
$result.staging | Select-Object bundles, reused, files, records, unknown, missingOptionalSidecars, outputDir
```

`XK` is matched case-insensitively against the model names in the installed XML menu. A matching parent includes its leaf models. The command identifies complete categories in those models, then makes up to **40 fresh random picks per run**. Each pick chooses a model with remaining categories and one category in that model. A category cannot be picked twice in the same run. Progress appears while selection and parsing run. Repeat the command only when another random set is wanted. Different runs may overlap, and repeated random runs do not guarantee eventual coverage of every category.

`reused` counts unchanged categories whose evidence was already written by an earlier run. The files for each picked category are under `$result.staging.outputDir\M<model>\C<category>\L<language>\<hash>.json`. For example, to open the first picked category's evidence folder:

```powershell
$first = $result.sampledCategories[0]
$folder = Join-Path $result.staging.outputDir ("M{0}\C{1}\L{2}" -f $first.model, $first.category, $first.language)
Get-ChildItem -LiteralPath $folder -Filter '*.json' | Select-Object -ExpandProperty FullName
```

For development follow-up, record the command and model pattern, the matched Model_IDs, eligible/selected/incomplete counts, the selected model/category IDs, staging totals, and any unknown records or missing sidecars in the relevant Issue or PR. Include the local evidence path so an agent on the installation computer can inspect the exact source bytes and line-numbered records. The JSON result and staged files are the evidence for the run; a successful parse does not imply catalogue import or D1 publication.

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

The estimate inventories source files for the matched models, beyond the 40 parsed categories. `$result.estimate.report` points to the local report with measured file and byte counts, elapsed scan time, scan errors, and a sample of source-file read statistics. The scan excludes shared media. An interrupted CLI process may not save a partial estimate report. D1 storage and import-time projections require calibration from an actual published import; they are unavailable in v0.1a.

Run `npm test` from this directory when changing importer code to execute the synthetic parser, selection, safety and CLI tests. The sibling MediaImporter handles images and hotspots separately.
