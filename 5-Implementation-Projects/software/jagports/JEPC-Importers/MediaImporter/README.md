# JEPC MediaImporter

This local Windows/Node.js 24 application inspects and preserves one JEPC illustration at a time. It uses an independent SQLite ledger, reads only bounded paths for the selected media ID, and does not alter JEPC source files or publish to R2/D1. See the [MediaImporter specification](SPEC_MediaImporter.md) for the operating responsibilities and relationships.

## Current application and complete solution

The current local application preserves bounded selected source assets only; it does not yet publish to R2 or D1. The [MediaImporter specification](SPEC_MediaImporter.md) defines the complete required solution: verified R2 objects, VIEPS/D1 diagram-media metadata and relationships, raw hotspot evidence, and geometry publication only after #352 and Parts Data Model approval.

Kit detection, dashed-enclosure analysis, kit composition, and kit-membership publication are excluded from the MediaImporter solution. Deferred JEPC source knowledge is recorded in `7-Research/jlr/JEPC/JEPC_KIT_EVIDENCE.md` and creates no application behavior.

```powershell
node src/MediaImporter.CLI.mjs --help
node src/MediaImporter.CLI.mjs inspect --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter" --media-id tu6333 --json
node src/MediaImporter.CLI.mjs preserve --source "C:\Program Files\JEPC\applications\JEPC" --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter" --destination-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaObjects" --media-id tu6333 --json
node src/MediaImporter.CLI.mjs status --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter"
node src/MediaImporter.CLI.mjs report --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter"
node src/MediaImporter.CLI.mjs doctor --state-dir "$env:LOCALAPPDATA\Jagports\JEPC-MediaImporter" --full
npm test
```

For `tu6333`, inspection reads at most `flash/images/tu6333.jpg`, `illustrations/png/tu6333.png`, and `flash/xml/tu6333.xml`. The ID is validated before path resolution; source-root escape is rejected. `preserve` stores verified bytes under checksum-derived local keys and reuses unchanged objects. The ledger retains byte checksums, detected image types and dimensions, raw hotspot XML, and repeated rectangles in source order. Hotspot coordinate conversion remains blocked pending issue #352 evidence.

`run` processes the next locally queued work item, if any. `inspect --media-id` creates or reuses the item directly. Q or the first Ctrl+C requests a safe stop after the current checkpoint; a second Ctrl+C exits. State and destination directories must be outside the source installation. `npm test` covers bounded resolution, replay, source preservation, missing/corrupt candidates, stopping, recovery, and CLI behavior.
