# VIEPS E2E JEPC-to-D1 Data Model

## Purpose and authority

This document is the canonical end-to-end specification for moving JEPC data into durable VIEPS D1 catalogue databases.

It owns the boundaries, completeness rules and durable source-to-D1 relationships for the whole import pipeline. It deliberately does not redefine lower-level PART, FIT, search, stock or media semantics.

Detailed domain authorities:

- [`MODEL_PARTS.md`](MODEL_PARTS.md) — global canonical PART identities and PART relationships;
- [`SPEC_SEARCH_FIT.md`](SPEC_SEARCH_FIT.md) — FIT evidence, evaluation and search/filter semantics;
- [`MODEL_STOCK.md`](MODEL_STOCK.md) — mutable operational stock;
- DataImporter and MediaImporter specifications — importer execution mechanics;
- D1 deployment specifications — physical database setup, partitioning and operational procedures.

Those lower-level specifications must conform to this E2E completeness contract, while this file remains independent of their internal table/entity designs.

## E2E pipeline

```text
JEPC installation
      |
      v
source discovery and parsing
      |
      +--> importer working/recovery state
      |
      v
durable source-qualified catalogue data
      |
      v
Range routing
      |
      v
Range catalogue D1
      # physical placement: MODEL_D1_jagports.md
      |
      +--> catalogue browsing/search
      +--> domain-specific PART/FIT/media reads
      +--> provenance and explanation
      +--> remapping/reprocessing
```

Normal runtime reads for a completely imported source scope terminate at durable D1-backed data. The original JEPC installation and local importer ledger are not runtime dependencies.

## Source scope and durable evidence

Every imported source scope must retain enough source-qualified evidence to identify what was imported, where it came from and how it can be reinterpreted from retained evidence.

At minimum the E2E model requires durable identity for:

- source namespace and dataset/release when known;
- source files and file families;
- checksums or equivalent source-byte identity;
- model/category/item/language scope;
- stable row/record locators or a lossless equivalent;
- source hierarchy and ordering;
- source relationships and references;
- unresolved/unknown source records;
- parser and semantic-mapping versions;
- import snapshot/version and completeness state.

A checksum identifies source bytes; it is not logical catalogue identity.

## Catalogue hierarchy preservation

The source hierarchy must survive import without being reduced to presentation strings.

```text
dataset
  -> model/menu ancestry
     -> category
        -> top-level item
           -> ordered catalogue structure
              -> source records and domain relationships
```

Exact lower-level identities and relationships are defined by the relevant domain specifications.

## D1 partitioning

Range routing is derived from reviewed source ancestry/configuration and resolves to the Range catalogue database selected by the canonical D1 topology in [`MODEL_D1_jagports.md`](MODEL_D1_jagports.md).

This E2E model owns the import-side requirement that partitioning must not discard source identity or provenance. Physical database placement, Search Index placement and cross-database topology are owned by `MODEL_D1_jagports.md`; Search Index behavior is owned by [`SPEC_SEARCH.md`](SPEC_SEARCH.md).

## Loss-preserving import

Unknown or unsupported JEPC structures must not be silently discarded.

When a new file family, field, record type, tuple, relationship or semantic code is encountered:

1. preserve its source-qualified evidence;
2. retain the scope needed to interpret it when semantics are available;
3. record unresolved/unsupported state;
4. do not invent semantics;
5. continue other safe import work where possible;
6. permit newly available parser/model knowledge to reprocess the durable evidence.

A complete import may contain unresolved semantics. It may not silently lose source data required for reinterpretation.

## Media and non-tabular source material

Where JEPC references diagrams, images, hotspots or other media, D1-backed catalogue data must retain stable identities, provenance and relationships needed to reconstruct their catalogue role. Binary bytes may live in an appropriate media store; the original JEPC file tree must not be required for normal runtime reconstruction after a complete import.

## Import snapshots and replacement

Logical source identity, byte-version identity, parser version and semantic-mapping version are distinct.

For changed source or interpretation:

```text
old active imported scope
        |
        +--> retained provenance and prior-version evidence

new staged scope
        |
        +--> source evidence
        +--> validation
        v
atomic activation/replacement
```

A failed replacement must not leave a mixed active dataset. Re-importing unchanged source evidence must be idempotent.

## Completeness

Completeness is explicit and scoped. A source scope may be discovered, staged, partial, complete, unresolved in one or more semantic domains, or superseded.

`complete` means that the source scope has been durably captured well enough that all supported lower-level domain models can be reconstructed or re-derived without reopening JEPC files. It does not mean every semantic code is already understood.

For a source scope reported complete:

```text
durable source hierarchy/evidence retained     YES
supported catalogue relationships reconstructable YES
unknown/unresolved source evidence retained    YES
provenance/version identity retained           YES
runtime needs original JEPC installation       NO
runtime needs local importer SQLite ledger     NO
```

If information required by a supported runtime/domain function exists only in JEPC files or only in the local ledger, the import is not complete.

## Runtime boundary

Runtime application code consumes D1-backed imported data through the relevant domain model.

```text
MODEL_JEPC_D1.md
      |
      +--> defines source-to-D1 completeness and ownership boundaries

domain models/specifications
      |
      +--> define detailed PART / FIT / search / media / stock semantics

importers
      |
      +--> implement the transformation and publication mechanics
```

## Importer working-state boundary

Local SQLite may contain scan records, progress, timing, retry state, transient discovery state, diagnostics and local recovery copies of source bytes.

Such operational information need not be copied verbatim to D1 unless it is required to reconstruct, explain, validate or reinterpret durable imported catalogue data.

```text
SQLite = importer execution/recovery state
D1     = durable imported JEPC catalogue data
```

## Conformance

An importer/schema implementation conforms to this E2E model only when representative complete source scopes demonstrate:

- durable source evidence and hierarchy;
- lossless preservation of unknown/unsupported structures;
- deterministic Range routing;
- idempotent re-import;
- safe changed-source replacement/versioning;
- provenance from runtime/domain data back to durable source evidence;
- no normal runtime dependency on the original JEPC installation or local importer ledger.
