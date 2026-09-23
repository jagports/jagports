# Jagports JEPC Importers

JEPC importer applications are Jagports software. Their implementation, tests and operating specifications belong under `5-Implementation-Projects/software/jagports/JEPC-Importers/`. Jaguar Land Rover source research and evidence belong under the corresponding `7-Research/jlr/` domain rather than inside Jagports application implementation directories.

- [DataImporter](DataImporter/README.md): executable local Windows/Node.js starting skeleton, CLI and progress-screen contract for issue #355. Its [operating specification](DataImporter/SPEC_DataImporter.md) describes the broader intended importer. The bounded XK selector produces a reproducible forty-category manifest for later parsing and publication.
- `MediaImporter/`: reserved sibling location for the future media importer; no implementation exists yet.

Keep application-specific code, tests and specifications inside the named application directory. Standard package metadata and README filenames remain scoped by that directory; executable modules and tests also carry the application name.

DataImporter inspects a selected source bundle and persists checksum evidence in a separate local SQLite ledger. Its bounded XK selector and parser stage forty category bundles as local evidence, retaining raw file bytes, ordered records, and available applicability sidecars. Inspection or staging completion is not catalogue import completion. Future transformation must interpret source decision paths and produce explicit destination application relationships. Source research remains in the [JLR JEPC research domain](../../../../7-Research/jlr/JEPC/KNOWLEDGE.md).
