# Jagports JEPC Importers

JEPC importer applications are Jagports software. Their implementation, tests and operating specifications belong under `5-Implementation-Projects/software/jagports/JEPC-Importers/`. Jaguar Land Rover source research and evidence belong under the corresponding `7-Research/jlr/` domain rather than inside Jagports application implementation directories.

- [DataImporter](DataImporter/README.md): executable local Windows/Node.js v0.1a parser and Range D1 publisher for issues #355 and #555. Its README is the agent/operator run procedure; its [operating specification](DataImporter/SPEC_DataImporter.md) separates current source-evidence publication from later verified applicability. A model-name pattern selects complete category bundles for parsing.
- [MediaImporter](MediaImporter/README.md): separate local Windows/Node.js application for bounded illustration inspection and preservation.

Keep application-specific code, tests and specifications inside the named application directory. Standard package metadata and README filenames remain scoped by that directory; executable modules and tests also carry the application name.

DataImporter stages up to 40 complete category bundles per model-pattern run in its local `ledger.sqlite`, retaining raw file bytes, ordered records, and available applicability sidecars. Current runs do not write separate category or estimator report files. When reviewed Range D1 identity, schema and Cloudflare credentials are available, it publishes numbered PARTs, occurrences, source tree paths and unverified applicability evidence; otherwise it reports local staging only. Future transformation must interpret source decision paths and produce verified destination application relationships. Source research remains in the [JLR JEPC research domain](../../../../7-Research/jlr/JEPC/KNOWLEDGE.md).

The local parsing input is a model-name pattern such as `--parse XK`. Match it as a case-insensitive literal substring against the installed source model XML and its parent links, include every matching leaf model, and report the exact Model_ID scope and incomplete categories. Selection remains in memory for the current run. The reviewed source-group-to-Range map, independent of the selector text, controls D1 publication. D1 publication is idempotent per category and retains its confirmed state in the same SQLite ledger.

The optional `--estimate` inventories source files for the selected models and reports measured file and byte counts and elapsed scan time. v0.1a does not project D1 size or import duration. MediaImporter owns image and hotspot processing separately.
