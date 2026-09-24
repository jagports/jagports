# Jagports JEPC Importers

JEPC importer applications are Jagports software. Their implementation, tests and operating specifications belong under `5-Implementation-Projects/software/jagports/JEPC-Importers/`. Jaguar Land Rover source research and evidence belong under the corresponding `7-Research/jlr/` domain rather than inside Jagports application implementation directories.

- [DataImporter](DataImporter/README.md): executable local Windows/Node.js v0.1a parser for issue #355. Its [operating specification](DataImporter/SPEC_DataImporter.md) describes the broader intended importer. A model-name pattern selects complete category bundles for local parsing.
- [MediaImporter](MediaImporter/README.md): separate local Windows/Node.js application for bounded illustration inspection and preservation.

Keep application-specific code, tests and specifications inside the named application directory. Standard package metadata and README filenames remain scoped by that directory; executable modules and tests also carry the application name.

DataImporter stages up to 40 complete category bundles per model-pattern run as local evidence, retaining raw file bytes, ordered records, and available applicability sidecars. Local staging is not catalogue import completion. Future transformation must interpret source decision paths and produce explicit destination application relationships. Source research remains in the [JLR JEPC research domain](../../../../7-Research/jlr/JEPC/KNOWLEDGE.md).

The local parsing input is a model-name pattern such as `--parse XK`. Match it as a case-insensitive literal substring against the installed source model XML and its parent links, include every matching leaf model, and report the exact Model_ID scope and incomplete categories. Selection remains in memory for the current run. Local staging does not publish to D1.

The optional `--estimate` inventories source files for the selected models. The advanced Range estimator reports D1 size and import-time projections only when given a measured published calibration. MediaImporter owns image and hotspot processing separately.
