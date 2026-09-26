# JEPC DataImporter v0.1a

DataImporter runs on the Windows computer that has the JEPC installation. The required `--parse PATTERN` command stages source categories in its local SQLite ledger and, when a reviewed Range D1 target and Cloudflare token are configured, publishes parsed catalogue records to that Range database. The [operating specification](SPEC_DataImporter.md) defines the current publication boundary and later verified-applicability requirements.

## Agent and operator procedure

Run on the Windows computer with the JEPC installation. From the Jagports repository root, the Product Owner needs one command:

```powershell
node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse XK
```

The computer needs Node.js 24 or later and the JEPC source root containing `menus/models_l_id_0.xml` and `drilldown/`. The default source root is `C:\Program Files\JEPC\applications\JEPC`; the local output goes under `$env:LOCALAPPDATA\Jagports\JEPC-Importer`. No `npm install` is needed. The application does not change the JEPC installation. When asked to run or investigate DataImporter, an agent with access to this computer should execute the command and report its findings instead of asking the human to transcribe chat instructions.

For **D1 publication**, an agent first follows the repository [Range D1 deployment procedure](../../../../../3-Deployment/internet/cloudflare/d1/ranges/README.md): review the source-group mapping, create and review `config/<slug>.json`, apply `schema.sql`, and bind the Worker. Set `CLOUDFLARE_API_TOKEN` in the local environment; do not pass it as a CLI argument or commit it. The Product Owner's importer command remains the one shown above. With no token, the command still stages locally and reports `publication.phase=NOT_CONFIGURED`; it must not be called a completed D1 import. With a token but missing or mismatched reviewed Range identity, it fails closed after retaining local staging.

## Agent inspection of a run

From the repository root, run the same command **once** and keep its JSON result in `$result`:

```powershell
$result = node .\5-Implementation-Projects\software\jagports\JEPC-Importers\DataImporter\src\DataImporter.CLI.mjs --parse XK | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'DataImporter failed; inspect its error above.' }
$result | Select-Object modelPattern, modelIds, eligible, selected, incompleteCategories
$result.sampledCategories | Format-Table model, category, categoryLabel
$result.staging | Select-Object bundles, reused, files, records, unknown, missingOptionalSidecars, database, runId
$result.publication | Select-Object phase, selected, stagedBundles, published, reused, skippedUnknown, occurrences, ranges
```

`XK` is matched case-insensitively against the model names in the installed XML menu. A matching parent includes its leaf models. The command identifies complete categories in those models, then makes up to **40 fresh random picks per run**. Each pick chooses a model with remaining categories and one category in that model. A category cannot be picked twice in the same run. Progress appears while selection and parsing run. Repeat the command only when another random set is wanted. Different runs may overlap, and repeated random runs do not guarantee eventual coverage of every category.

The read sequence starts with `menus/models_l_id_0.xml`. For each matched leaf Model_ID, selection reads `menus/L0/pl_id_<Model_ID>_l_id_0.xml` and lists `drilldown/pl_id_<Model_ID>/L0/` to find complete categories. It then reads and checksums the randomly selected category's `cat_*`, `tl_*`, and `Itm_*` files. The parser rereads those selected files and checks for matching optional `_attributes.xml` sidecars. The exact category filenames vary with each random selection. `--estimate`, when present, scans all files under the matched model directories and their model menus after selection and before parsing; it does not inventory the whole JEPC installation or shared media.

`reused` counts unchanged categories already present in `ledger.sqlite` from an earlier run. The `bundle_evidence` table stores the parsed category evidence, including `status`, `source`, `files`, `records`, `unknown`, and `missingOptionalSidecars`. Each file record includes its source path, checksum, raw bytes encoded as base64, and parsed or unrecognized lines. Agents can inspect `evidence_json` for a selected model/category/language with a SQLite reader; the Product Owner only needs the one command above. Review unknown records against the preserved source evidence before proposing a parser change.

For development follow-up, record the command and model pattern, the matched Model_IDs, eligible/selected/incomplete counts, the selected model/category IDs, staging totals, publication state and any unknown records or missing sidecars in the relevant Issue or PR. Include the local ledger path and run ID so an agent on the installation computer can inspect the exact source bytes and line-numbered records. `publication.published` counts newly written D1 bundles; `publication.reused` counts confirmed or previously recorded unchanged bundles. A successful parse without a completed publication phase does not imply D1 publication.

The SQLite ledger retains source bytes, checksums, ordered records, line numbers, available applicability sidecars, run history and unknown record locations. Missing sidecars and incomplete categories are reported rather than treated as unrestricted applicability. Selection is held only in memory; there is no selection file to save or pass to another command. Earlier JSON staging files, if present from a previous build, are not moved or deleted; current runs do not create more of them.

Range publication creates numbered PART identities, exact occurrences, source tree nodes, and preserved condition/predicate evidence in `jagports-<range_slug>`. It does not convert source branches into verified fitment or publish media. The approved source-group mapping, rather than the `--parse` text, determines the destination. The local `range_publications` table records confirmed bundle hashes and D1 IDs so repeated random runs retain earlier imported categories and retry unpublished local evidence. No selection manifests or extra source-copy files are written.

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

The estimate inventories source files for the matched models, beyond the 40 parsed categories. Check `$result.estimate.state`: `COMPLETED` means the scoped scan finished without recorded errors; `INCOMPLETE` or `FAILED` needs investigation. `$result.estimate.reportId` identifies the report in `ledger.sqlite`'s `source_estimates` table, with measured file and byte counts, elapsed scan time, scan errors, and a sample of source-file read statistics. An interrupted CLI process may not save a partial estimate report. D1 storage and import-time projections require calibration from an actual published import; they are unavailable in v0.1a.

Agents changing importer code should run `npm test` from the DataImporter directory to execute the synthetic parser, selection, safety and CLI tests. The sibling MediaImporter handles images and hotspots separately.

For the Worker, open VIEPS with `?TEST=1` to use the preserved fixture experience. Without `TEST=1`, the Parts Tree and part search use the Range D1 binding and stock rows marked `fixture` are excluded. When several Ranges are bound, supply `range=<slug>` in API requests until cross-Range discovery is implemented. A missing binding is an error, not a fixture fallback.
