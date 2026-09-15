# Jagports JEPC Importers

JEPC importer applications are Jagports software. Their implementation, tests and operating specifications belong under `5-Implementation-Projects/software/jagports/JEPC-Importers/`. The `software/jlr/` domain describes Jaguar Land Rover software and its source material, not applications developed by Jagports.

- [DataImporter](DataImporter/README.md): executable local Windows/Node.js starting skeleton, CLI and progress-screen contract for issue #355. Its [operating specification](DataImporter/SPEC_DataImporter_v0.1.md) describes the broader intended importer.
- `MediaImporter/`: reserved sibling location for the future media importer; no implementation exists yet.

Keep application-specific code, tests and specifications inside the named application directory. Standard package metadata and README filenames remain scoped by that directory; executable modules and tests also carry the application name.

DataImporter currently inspects a selected source bundle and persists checksum evidence in a separate local SQLite ledger. Inspection completion is not catalogue import completion. Future transformation must interpret source decision paths and produce explicit destination application relationships. Source research remains in the [JLR JEPC domain](../../jlr/JEPC/KNOWLEDGE.md).
