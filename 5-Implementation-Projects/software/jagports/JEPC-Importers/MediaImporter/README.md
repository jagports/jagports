# JEPC MediaImporter — Slice 1

This local Windows/Node.js 24 application implements bounded media preservation for one JEPC illustration at a time. It is the first executable slice of the approved [MediaImporter specification](SPEC_MediaImporter.md).

It creates a separate local SQLite ledger named `media-ledger.sqlite`. The `preserve` command copies one validated illustration to a local filesystem object store under checksum-derived keys. It never shares DataImporter's ledger, changes a JEPC source file, scans the complete installation, publishes to R2/D1, creates public URLs or converts hotspot geometry.

## Run locally

Run from this directory on the computer where JEPC is installed:

```powershell
node src/MediaImporter.CLI.mjs --help
node src/MediaImporter.CLI.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter" --media-id tu6333 --json
node src/MediaImporter.CLI.mjs preserve --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter" --destination-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaObjects" --media-id tu6333 --json
node src/MediaImporter.CLI.mjs status --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter"
node src/MediaImporter.CLI.mjs report --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter"
node src/MediaImporter.CLI.mjs doctor --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter" --full
npm test
```

The installed source smoke test only reads these three bounded paths for `tu6333`:

```text
flash/images/tu6333.jpg
illustrations/png/tu6333.png
flash/xml/tu6333.xml
```

Use a state directory outside the source installation. The importer rejects a state path inside the source root, including a path that resolves through a junction. Do not share one state directory between active writers.

## Commands

| Command | Result |
| --- | --- |
| `import-manifest --manifest <file> --state-dir <directory>` | Streams and validates the versioned JSONL media-work manifest into the independent ledger. It does not inspect source bytes. |
| `inspect --source <root> --state-dir <directory> --media-id <id>` | Creates/reuses one explicit work item and inspects only its JPEG, PNG and hotspot-XML candidate paths. |
| `run --source <root> --state-dir <directory>` | Processes the next queued manifest work item only. Re-run to process the next item. |
| `status` | Shows the latest run and aggregate work states. |
| `report` | Emits the latest run and ordered persistent events as JSON. |
| `doctor` | Runs SQLite `quick_check` and `foreign_key_check`; `--full` selects `integrity_check`. |

`Q` in an interactive terminal, or the first Ctrl+C, requests a safe stop after the current illustration checkpoint. A second Ctrl+C exits immediately. Interrupted runs are recovered only after the prior owner is dead and a full database integrity check succeeds.

## Manifest v1

The first line is a `jagports.jepc.media-work` version-1 header. Each following line is a `mediaReference` with a stable `referenceId`, a logical illustration ID, source context and provenance. The importer verifies the specified canonical stable reference identity and rejects malformed, blank, unsupported or path-escaping records. Replaying an unchanged manifest retains one reference record.

DataImporter will publish immutable manifests through its own future source-interpretation work. Until then, `inspect --media-id` creates the same internal logical media work record without pretending this is a second permanent hand-off protocol.

## What Slice 1 records

- SHA-256, size, detected format and header-validated dimensions for JPEG/PNG candidates;
- raw hotspot XML, declared original dimensions and every item rectangle in source order;
- repeated item-number rectangles as separate records;
- explicit `MISSING`, `CORRUPT`, `PROCESSED` and `NEEDS_REPROCESS` outcomes, with repeated inspection recording unchanged candidates;
- `BLOCKED_UNVERIFIED` conversion status for all hotspot geometry.

Format/dimension inspection validates PNG `IHDR` and JPEG frame headers. It does not yet perform a full raster decode, publish an asset or claim that source values are pixels. Hotspot conversion remains governed by issue #352 and must be validated against the exact eventual presentation image.

## Verification

`npm test` uses temporary synthetic JPEG, PNG, hotspot XML and manifest fixtures. It covers bounded resolution, stable manifest identity, replay, raw repeated hotspot rectangles, checksum/type/dimension evidence, missing/corrupt inputs, source preservation, safe stop, recovery, integrity checks and CLI validation.

The `tu6333` command above is a real-source smoke test. It is bounded evidence, not a full installation scan or a claim of complete source coverage.

