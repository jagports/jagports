# Jagports JEPC MediaImporter v0.1

(C)2026 by tlindi and ChatGPT

## Purpose

Define the operating contract for the Jagports JEPC MediaImporter.

MediaImporter incrementally discovers or receives references to JEPC illustrations, preserves the source assets and hotspot evidence, validates them, and publishes usable media plus catalogue references for VIEPS. It runs beside an installed JEPC source tree and owns a separate ledger. It follows the restart, checksum, provenance and reporting contract established with DataImporter.

This specification does not establish hotspot coordinate conversion, redefine the canonical PART model, or make an inventory system authoritative for JEPC catalogue media.

## Scope

Version 0.1 handles JEPC catalogue illustration media and its source hotspot evidence:

- logical illustration references recovered from selected JEPC catalogue bundles;
- existing JEPC JPEG and PNG representations;
- per-illustration hotspot XML;
- original dimensions and raw hotspot rectangles/items;
- checksums, byte sizes, media types and source provenance;
- publication of media bytes to an object-storage provider;
- publication of diagram/media metadata and relationships to the VIEPS catalogue destination;
- explicit missing, corrupt, unknown, unsupported and conversion-blocked states.

The initial validation scope is a bounded XK profile, beginning with model `3187`. The normal processing loop must never require enumeration of the complete JEPC installation.

The following are outside v0.1 unless separately approved:

- PART or stock photographs unrelated to JEPC illustrations;
- using InvenTree as catalogue or media authority;
- generating new illustrations where no source image exists;
- inventing hotspot geometry;
- complete catalogue parsing or applicability interpretation;
- deleting source files;
- automatic public exposure of every preserved source artifact;
- general-purpose digital-asset management.
- kit-content detection, kit composition or kit-membership publication.

## Architectural boundary

```text
JEPC source installation
        |
        | media-work reference
        v
MediaImporter local ledger
        |
        +--> original / selected media bytes --> object storage
        |
        +--> raw hotspot evidence ------------> preserved evidence storage
        |
        +--> diagram/media metadata ----------> VIEPS catalogue database
        |
        `--> run report / unresolved cases ---> operator
```

Media bytes must not be stored as D1 BLOBs. D1 stores catalogue entities, stable object keys, source references, checksums, dimensions, status and relationships. A delivery URL is derived at runtime from a stable object key; it is not media identity.

Cloudflare R2 is the initial object-storage provider because VIEPS is already Cloudflare-based. MediaImporter uses a storage-provider-neutral preservation contract, so changing an object-storage provider does not change JEPC source or catalogue semantics.

InvenTree remains a separate StockProvider investigation under issue #672. Its attachment feature may be evaluated later as a storage adapter, but it is not the v0.1 destination and must not become authoritative for JEPC diagram identity, PART occurrences, hotspot relationships or provenance.

## Source evidence and current limits

The bounded XK audit recovered 1,051 distinct logical illustration identifiers from the examined English category files. For those identifiers, all 1,051 same-name JPEG files existed, 951 same-name PNG files existed, and 1,007 same-name hotspot XML files existed and parsed. The 44 identifiers without a same-name hotspot XML are unresolved observations, not proof of damaged or incomplete source.

The audit also establishes:

- one logical illustration can have more than one binary representation;
- not every illustration has a hotspot file;
- one diagram item can have multiple hotspot regions;
- hotspot XML contains source dimensions and raw rectangle values;
- image presence, image decodability, hotspot presence, XML parseability and coordinate correctness are different verification results;
- the current `hotspotImageSizeX`, `hotspotImageSizeY` and `twipsPerInch` values do not by themselves prove a conversion formula.

MediaImporter must preserve these distinctions in its ledger and reports.

## Logical identities

Media import distinguishes four identities.

### Source reference identity

A source reference identifies the catalogue evidence that named an illustration. It includes the source namespace/release, selected model/category/item/language context where available, logical illustration identifier, referring file and record evidence.

Several source references may identify the same logical illustration.

### Logical illustration identity

A logical illustration is the source diagram concept identified by the JEPC illustration identifier, qualified by source namespace/release where needed. It is not identified by a public URL or by a PART number.

### Binary asset identity

A binary asset is identified by its SHA-256 checksum plus verified media type. Identical bytes referenced by several diagrams or source paths may share one stored object. Different JPEG and PNG representations remain separate assets even when they depict the same logical illustration.

### Catalogue diagram identity

The VIEPS `diagram` record represents the catalogue diagram and its source identity. It links to a selected presentation asset through a stable media key. Occurrence and hotspot relationships remain separate catalogue relationships.

The importer must not merge logical illustrations solely because their filenames, dimensions or pixels look similar.

## DataImporter coordination

DataImporter owns interpretation of catalogue files and discovery of logical illustration IDs. MediaImporter owns media-file resolution, byte validation, preservation, conversion status and eventual publication. The applications keep separate writable ledgers. For bounded local work, MediaImporter accepts an explicitly selected media identifier; any future automated hand-off requires a separately specified, reviewed contract.

## Source resolution

For a logical illustration `<id>`, v0.1 examines only the bounded known candidate paths required for that work item:

```text
flash/images/<id>.jpg
illustrations/png/<id>.png
flash/xml/<id>.xml
```

Candidate resolution is case-aware and source-relative. MediaImporter must prevent path traversal and junction/symlink escape from the selected source root, as DataImporter does.

The path recipe is versioned source knowledge. A newly discovered media family or naming convention is recorded as unknown/needs-reprocess evidence and requires a parser/resolver version change. It must not trigger an unbounded search of the entire source tree during the normal loop.

Both JPEG and PNG candidates are inspected when present. The importer records their relationship to the same logical illustration but does not assume pixel equivalence. The presentation representation is selected only by an approved rule supported by decoding and, for clickable hotspots, issue #352 evidence.

## Processing stages and independent states

Preservation, conversion and publication are separate dimensions. One composite status must not hide which step succeeded.

### Source state

```text
PENDING
FOUND
MISSING
CHANGED
CORRUPT
UNKNOWN_FORMAT
ERROR
```

### Preservation state

```text
PENDING
PRESERVED
NOT_AVAILABLE
ERROR
```

### Conversion state

```text
NOT_REQUIRED
PENDING
BLOCKED_UNVERIFIED
CONVERTED
UNSUPPORTED
ERROR
```

Copying an existing JPEG/PNG byte-for-byte is preservation and requires no geometric conversion. Transcoding, cropping, padding, rotation, resizing or rendering creates a derived representation and requires a versioned transformation record.

### Publication state

```text
PENDING
PUBLISHED
STALE
WITHDRAWN
ERROR
```

An image may be `PRESERVED`, `BLOCKED_UNVERIFIED` for hotspot conversion, and `PUBLISHED` for non-clickable display at the same time.

### Work state

```text
DISCOVERED
PROCESSING
PROCESSED
NEEDS_REPROCESS
ERROR
MISSING_OR_WITHDRAWN
```

The work state summarizes scheduling only. Detailed states remain authoritative for diagnostics.

## Incremental processing loop

Media import processes one logical illustration work item at a time:

1. Open the independent MediaImporter ledger.
2. verify ledger integrity before processing;
3. recover a stranded `PROCESSING` item only after the former owner is proven inactive and integrity is confirmed;
4. accept an explicit logical illustration ID or resume a locally queued item;
5. select the next `NEEDS_REPROCESS` item that current source or conversion knowledge can improve, otherwise the next `DISCOVERED` item in deterministic order;
6. mark the item `PROCESSING` and persist the attempt;
7. resolve only its bounded candidate paths;
8. hash and validate each existing source file without modifying it;
9. parse and preserve hotspot source evidence when present;
10. determine the selected presentation representation without discarding alternatives;
11. upload missing content-addressed objects and verify the provider result;
12. publish catalogue metadata/relationships only after their referenced object is verified;
13. commit the resulting states, checksums, versions and events;
14. honor a safe-stop request;
15. continue with the next item.

The normal process must not require a complete installation inventory before it can begin.

## Ledger requirements

MediaImporter owns a ledger separate from DataImporter. At minimum it records:

- run ID, state, ownership evidence, timestamps and media-import version;
- source root and non-secret source fingerprint;
- source references and logical illustration identities;
- candidate relative paths;
- checksums, byte sizes, modified time as informational evidence and detected media type;
- decoded width/height and validation result;
- hotspot-source checksum, original dimensions, raw item/rectangle records and parse status;
- binary asset checksum and stable object key;
- transformation name/version/parameters and parent asset checksum for derived assets;
- source, preservation, conversion, publication and work states;
- destination provider, verification result and catalogue publication identity;
- retry count, last error and detailed ordered events.

Checksums, not timestamps, determine byte identity. Source files are re-statted after hashing; a file changed during reading fails that attempt and is retried from a stable source.

## Object-storage contract

The selected object-storage service must support availability checking, conditional preservation, verification of object identity and metadata, delivery-reference derivation, and stale/withdrawn status reporting.

Object preservation must be idempotent and conditional. A recommended v0.1 object key is content-addressed:

```text
jepc/assets/sha256/<first-two-hex>/<sha256>.<verified-extension>
```

Raw hotspot XML and other non-public evidence use a separate evidence namespace and access policy, for example:

```text
jepc/evidence/sha256/<first-two-hex>/<sha256>.xml
```

The exact bucket name, account identifier, endpoint and public hostname are deployment configuration, not committed source semantics.

Upload success is not inferred from a request completing. The stored object is verified using provider evidence sufficient to compare key, size and checksum evidence. Credentials never appear in ledger events, reports or repository content.

If an upload succeeds but the local checkpoint fails, the next run checks the deterministic object key, verifies the existing bytes and continues without creating another object. If catalogue publication fails after object publication, the object remains preserved and publication is retried.

## Catalogue publication contract

MediaImporter publishes only metadata and relationships supported by the approved VIEPS model. It does not create canonical PART identities from filenames.

For each publishable logical illustration, publication supplies as applicable:

- source namespace/release and logical illustration identifier;
- stable object key for the selected presentation representation;
- source reference/provenance;
- checksum, verified media type and dimensions;
- availability and verification status;
- links to source-qualified catalogue diagram/occurrence context supplied by DataImporter;
- raw hotspot evidence and item number associations;
- coordinate-system and conversion status;
- converter version and target image checksum for verified derived geometry.

`diagram`, `part_occurrence_diagram` and `diagram_hotspot` retain their established meanings. A hotspot without a verified occurrence mapping remains representable. Multiple rectangles for one item remain separate hotspot records.

The current model preserves `source_x`, `source_y` and opaque `source_geometry`, but it does not yet define complete rectangle dimensions, normalized geometry or a transformation record. Before publishing verified clickable geometry, issue #352 must recommend and the Parts Data Model must approve any required additive fields/entities. MediaImporter may stage those values losslessly before production schema approval.

### Expected Parts Data Model refinement

The current model cannot express the complete MediaImporter result without overloading opaque fields. Before production catalogue publication, the Parts Data Model owner must approve an additive representation for:

- storage-provider-neutral object key;
- SHA-256, byte size and verified media type;
- decoded width and height;
- representation role such as original JPEG, source PNG or derived presentation asset;
- relationship between a derived asset and its parent asset/checksum;
- availability, preservation, conversion and publication states without collapsing them into one verification flag;
- complete raw hotspot rectangle (`x`, `y`, `width`, `height`) and declared source dimensions;
- converter/transform version and exact target asset checksum;
- normalized geometry/coordinate system only if #352 verifies it.

The approved Parts Data Model may use additive media/representation entities rather than adding every field to `diagram`. The final shape belongs to the Parts Data Model workflow. Until approved, MediaImporter stores the complete result in its staging ledger and publishes only fields the current model represents truthfully.

The current VIEPS API also projects `part_image.image_ref` and legacy `part_diagram.image_url` directly to browser image URLs. Media import must provide a stable delivery projection from object key to VIEPS URL. Expiring provider URLs and deployment hostnames must not be persisted as canonical asset identity.

## Hotspot evidence and #352 gate

MediaImporter parses hotspot XML defensively as data, never executable content. It preserves:

- hotspot file checksum and source-relative path;
- declared original width and height;
- every item number;
- every raw `x`, `y`, `width` and `height` value;
- source order and repeated item regions;
- parse warnings or unsupported elements;
- the exact source and selected target image checksums/dimensions;
- any transformation steps applied to the target image.

Raw values must not be labelled pixels unless verified. No normalized or clickable coordinates are published as verified until #352 establishes the source coordinate system and validates the transformation against the exact asset representation VIEPS consumes.

When #352 is unresolved, MediaImporter may publish the image and textual item association while reporting `BLOCKED_UNVERIFIED` for geometry. Later converter knowledge increments the converter version and marks affected items `NEEDS_REPROCESS`; the preserved source evidence is reprocessed without repeating catalogue discovery.

## Image validation and transformation

Each existing image candidate is decoded and validated. Validation records the format detected from bytes, dimensions, decode success and reasonable configured size/dimension limits. Filename extension alone is not proof of format.

The original source bytes are preserved before any lossy transformation. A derived asset must record:

- parent checksum;
- transformation name/version;
- crop rectangle;
- padding;
- rotation/orientation handling;
- source and target dimensions;
- scaling rule and resampling mode;
- output format and checksum.

For v0.1, prefer an existing verified JPEG or PNG representation over rendering or transcoding. Any transformation affecting geometry must be included in #352 validation.

## Missing, corrupt and unknown cases

The importer never invents an image, hotspot or relationship.

- Missing image candidate: record `MISSING`; continue checking other bounded representations.
- No usable representation: publish explicit unavailable metadata where a catalogue diagram exists.
- Missing hotspot XML: preserve absence as an observation; image publication can continue.
- Malformed hotspot XML: preserve checksum/bytes and parse error; do not publish invented records.
- Undecodable image: preserve checksum and failure evidence; do not expose it as an available image.
- Unknown media format/structure: preserve when safe, mark `NEEDS_REPROCESS` or `UNSUPPORTED`, and report it.
- Changed checksum: retain prior evidence, mark dependent conversion/publication stale, and reprocess deterministically.
- Source reference withdrawn: retain history; do not immediately delete a shared object.

## Replacement, withdrawal and deletion

MediaImporter is append-safe by default. A new source checksum creates or selects a new content-addressed object and updates metadata only after verification. Prior objects remain until a separate retention policy proves that no active catalogue reference, rollback need or evidence requirement depends on them.

Version 0.1 performs no automatic hard deletion from object storage. It may mark metadata stale or withdrawn. Any later garbage collector requires its own approved retention, reference-counting, backup and recovery contract.

## Serving, access and caching

The specification separates storage from delivery:

- source/evidence objects are private;
- presentation assets are served only through an approved VIEPS delivery route;
- public bucket listing is disabled;
- object keys are opaque content identifiers, not user-supplied paths;
- response `Content-Type` comes from verified type metadata;
- immutable checksum-keyed assets may use long-lived immutable caching;
- mutable catalogue metadata resolves the current asset and must use an appropriate shorter cache policy;
- browser delivery must not expose storage credentials;
- authorization requirements for catalogue images are a deployment/product decision and must be explicit.

Backup and restore must include both object bytes and the catalogue/ledger metadata needed to reconnect stable keys to logical illustrations. Restoring one without the other is not a complete recovery outcome.

## Operator-visible contract

Media import exposes the current phase, logical illustration, source/preservation/conversion/publication states, counters, detailed evidence and an integrity result. An operator may request a safe stop at a completed illustration checkpoint; a restart recovers only after verifying the prior owner is no longer active and the ledger is sound. Machine-readable reports identify the selected source scope, object identities, outcomes and unresolved cases without exposing credentials.

## Transaction and recovery boundaries

One logical illustration is the operator-visible checkpoint boundary. Object preservation and D1 publication cannot complete as one atomic action, so recovery uses deterministic identities and ordered verification:

1. persist intent and source checksums locally;
2. publish/verify content-addressed object;
3. persist verified object result locally;
4. publish/verify catalogue metadata;
5. persist publication result and complete work item.

Every stage is replay-safe. A crash at any boundary resumes by checking existing deterministic results rather than blindly repeating side effects.

Only one writer may own a state directory. Read-only operational visibility and integrity checks may operate under the same safety rules as DataImporter.

## Versioning and reprocessing

Track independently:

- source resolver version;
- image validator version;
- hotspot parser version;
- media transformation/converter version;
- ledger schema version;
- destination-provider contract version;
- catalogue publication schema/version.

A change increments only the affected component version and selects prior records that can benefit. New conversion knowledge must not require re-uploading unchanged original bytes. Changing the storage provider must not change logical illustration identity.

## Acceptance criteria

- [ ] One selected XK illustration can be processed without enumerating the full JEPC installation.
- [ ] DataImporter and MediaImporter use separate writable ledgers; their future hand-off contract is specified before automated integration.
- [ ] All found media candidates retain source path, checksum, size, verified type, dimensions and provenance.
- [ ] Multiple references and representations do not create uncontrolled duplicate bytes or catalogue identities.
- [ ] Original bytes and raw hotspot evidence survive conversion/parser changes.
- [ ] Missing, corrupt, unknown and unavailable cases are explicit and reportable.
- [ ] Preservation, conversion and publication states are independently visible.
- [ ] Object publication and catalogue publication are idempotent and recoverable across crashes.
- [ ] Stable media keys remain independent of public delivery URLs and storage credentials.
- [ ] D1 contains metadata/relationships rather than media BLOBs.
- [ ] Images can be published for textual/non-clickable use while hotspot geometry remains blocked.
- [ ] Verified clickable geometry is published only against the exact target asset and approved #352 transformation.
- [ ] Safe stop, restart, reconciliation, integrity checks and detailed reporting are available.
- [ ] Import preserves source files, avoids a full-tree scan during normal processing, and performs no automatic hard deletion.

## Traceability

- Issue #908 owns this MediaImporter specification.
- Issue #355 owns DataImporter and catalogue source interpretation.
- Issue #352 owns hotspot coordinate conversion evidence.
- Issue #664 owns broader JEPC source reverse engineering.
- Issue #354 and `MODEL_PART.md` own the normalized Parts Data Model.
- Issue #672 owns the separate InvenTree StockProvider proof of concept.
