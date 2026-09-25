# JEPC DataImporter v0.1a

DataImporter runs on the Windows computer that has the JEPC installation. **The current command parses source categories into local evidence files; it does not create VIEPS catalogue records or upload anything to D1.** The [operating specification](SPEC_DataImporter.md) covers the later transformation and publication stages.

## Agent and operator procedure

Run on the Windows computer with the JEPC installation. From the Jagports repository root, the Product Owner needs one command:

```powershell
node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse XK
```

The computer needs Node.js 24 or later and the JEPC source root containing `menus/models_l_id_0.xml` and `drilldown/`. The default source root is `C:\Program Files\JEPC\applications\JEPC`; the local output goes under `$env:LOCALAPPDATA\Jagports\JEPC-Importer`. No `npm install` is needed. The application does not change the JEPC installation. When asked to run or investigate DataImporter, an agent with access to this computer should execute the command and report its findings instead of asking the human to transcribe chat instructions.

## Agent inspection of a run

From the repository root, run the same command **once** and keep its JSON result in `$result`:

```powershell
$result = node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse XK | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'DataImporter failed; inspect its error above.' }
$result | Select-Object modelPattern, modelIds, eligible, selected, incompleteCategories
$result.sampledCategories | Format-Table model, category, categoryLabel
$result.staging | Select-Object bundles, reused, files, records, unknown, missingOptionalSidecars, outputDir
```

`XK` is matched case-insensitively against the model names in the installed XML menu. A matching parent includes its leaf models. The command identifies complete categories in those models, then makes up to **40 fresh random picks per run**. Each pick chooses a model with remaining categories and one category in that model. A category cannot be picked twice in the same run. Progress appears while selection and parsing run. Repeat the command only when another random set is wanted. Different runs may overlap, and repeated random runs do not guarantee eventual coverage of every category.

The read sequence starts with `menus/models_l_id_0.xml`. For each matched leaf Model_ID, selection reads `menus/L0/pl_id_<Model_ID>_l_id_0.xml` and lists `drilldown/pl_id_<Model_ID>/L0/` to find complete categories. It then reads and checksums the randomly selected category's `cat_*`, `tl_*`, and `Itm_*` files. The parser rereads those selected files and checks for matching optional `_attributes.xml` sidecars. The exact category filenames vary with each random selection. `--estimate`, when present, scans all files under the matched model directories and their model menus after selection and before parsing; it does not inventory the whole JEPC installation or shared media.

`reused` counts unchanged categories whose evidence was already written by an earlier run. The files for each picked category are under `$result.staging.outputDir\M<model>\C<category>\L<language>\<hash>.json`. For example, to open the first picked category's evidence folder:

```powershell
$first = $result.sampledCategories[0]
$folder = Join-Path $result.staging.outputDir ("M{0}\C{1}\L{2}" -f $first.model, $first.category, $first.language)
Get-ChildItem -LiteralPath $folder -Filter '*.json' | Select-Object -ExpandProperty FullName
```

Open a staged JSON file from that folder to examine its `status`, `source`, `files`, `records`, `unknown`, and `missingOptionalSidecars` fields. Each file record includes the source path, checksum, raw bytes encoded as base64, and parsed or unrecognized lines. Review unknown records against the preserved source evidence before proposing a parser change.

For development follow-up, record the command and model pattern, the matched Model_IDs, eligible/selected/incomplete counts, the selected model/category IDs, staging totals, and any unknown records or missing sidecars in the relevant Issue or PR. Include the local evidence path so an agent on the installation computer can inspect the exact source bytes and line-numbered records. The JSON result and staged files are the evidence for the run; a successful parse does not imply catalogue import or D1 publication.

Each evidence file retains source bytes, checksums, ordered records, line numbers, available applicability sidecars and unknown record locations. Missing sidecars and incomplete categories are reported rather than treated as unrestricted applicability. Selection is held only in memory; there is no selection file to save or pass to another command.

For a JEPC installation in a different location, set its source root in the environment before running the same command:

```powershell
$env:JEPC_SOURCE = 'D:\JEPC\applications\JEPC'
node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse XK
```

`--parse` matches model names from the source XML.
The pattern must contain at least two characters.
The CLI accepts no other flags or positional commands. Progress appears on standard error; the final JSON result appears on standard output.

## Optional import estimates

Add the optional `--estimate` flag to a parse command if you want a separate file/byte inventory for the matched models. `--estimate` cannot run without `--parse PATTERN`:

```powershell
$result = node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse XK --estimate | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'DataImporter failed; inspect its error above.' }
$result.estimate
```

The estimate inventories source files for the matched models, beyond the 40 parsed categories. Check `$result.estimate.state`: `COMPLETED` means the scoped scan finished without recorded errors; `INCOMPLETE` or `FAILED` needs investigation. `$result.estimate.report`, when present, points to the local report with measured file and byte counts, elapsed scan time, scan errors, and a sample of source-file read statistics. An interrupted CLI process may not save a partial estimate report. D1 storage and import-time projections require calibration from an actual published import; they are unavailable in v0.1a.

Agents changing importer code should run `npm test` from the DataImporter directory to execute the synthetic parser, selection, safety and CLI tests. The sibling MediaImporter handles images and hotspots separately.
