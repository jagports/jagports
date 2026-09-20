# JEPC Knowledge

## Scope

This file records durable, reusable JEPC/source knowledge. It belongs with JLR/JEPC research because the source relationships, semantics and verified runtime behavior originate from catalogue/source investigation rather than from Jagports importer implementation.

Jagports-developed importer applications, tests, and operating specifications belong under `5-Implementation-Projects/software/jagports/JEPC-Importers/`.

## Supersession as a catalogue relationship

Parts supersession describes how one catalogue part is replaced by another. It is distinct from current operational stock and from general claims that two parts are interchangeable.

A superseded or obsolete catalogue part remains an independently addressable catalogue entity. Supersession must not overwrite or delete the historical part number.

A supersession relationship is directed: the source part is the superseded part and the target part is the replacement/superseding part. The model must represent the relationship itself rather than encoding supersession only as a single replacement field on the source part.

A relationship may be one-to-one, one-to-many, or part of a longer replacement chain. The representation must therefore support multiple replacement relationships and chains without losing the historical links.

## JEPC UI indication

JEPC parts-list evidence shows supersession visually with a **round-arrow icon** associated with the superseded part entry. This icon is a catalogue/UI indication of a supersession relationship and is useful source evidence when interpreting or validating JEPC parts-list data.

The icon is not a replacement for the underlying relationship data. The historical part number, replacement relationship, direction, and provenance remain explicit data requirements. The UI indication should be preserved as source-specific evidence or metadata where the imported source representation allows it.

## Evidence and relationship strength

Authoritative catalogue or manufacturer statements that explicitly identify a replacement are strong evidence for a supersession relationship.

Explicit supersession must be distinguished from weaker relationships, including:

- inferred interchangeability;
- generic cross-reference;
- apparent compatibility;
- similar description or specification;
- availability or product-page observations that do not explicitly state replacement.

A supersession relationship must not be inferred solely from similarity, compatibility, URL structure, availability, or other indirect observations.

## Provenance and verification

Supersession knowledge should preserve enough provenance to establish where and how the relationship was learned. A relationship record should be capable of recording at least:

- source catalogue part;
- target catalogue part;
- relationship type and direction;
- source or provenance;
- source URL where applicable;
- evidence or source statement;
- verification status or confidence;
- discovery/retrieval date where required by the implementation.

When information is obtained from an external parts catalogue, retain the source information needed to reproduce or verify the observation. Source-specific observations are evidence for the generalized rule; they should not be treated as generalized facts unless the source actually supports that generalization.

## JLR Classic Parts as a source

JLR Classic Parts product pages can provide supersession evidence when the page explicitly identifies a replacement part. The observed product-page URL pattern places the catalogue part number at the beginning of the path, followed by a descriptive slug.

For research and validation, capture the source page, displayed part information, explicitly stated replacement part number(s), and the evidence supporting the relationship. Do not infer supersession from the URL or page structure alone.

## Separation from operational stock

Supersession is reference/catalogue knowledge. It must remain separate from mutable Jagports operational stock.

Existing stock may legitimately reference a superseded catalogue part number. A supersession relationship does not by itself mean that an existing stock record should be rewritten, deleted, or converted to the replacement part.

## Data-model implication

The parts data model must support historical catalogue parts as entities and represent supersession as a relationship between those entities. The relationship must retain direction, relationship type, provenance, evidence, and verification information.

The knowledge described here defines the domain requirement. It does not prescribe a particular database schema or implementation technology.

## Catalogue illustration and hotspot media

JEPC category drilldown data carries a **logical illustration identifier**. The identifier is source linkage, not itself a file format. Where the corresponding assets exist, the same logical identifier relates the category to separate media families:

```text
logical illustration ID
   ├─ flash/images/<ID>.jpg
   ├─ flash/xml/<ID>.xml
   └─ illustrations/png/<ID>.png
```

The roles are distinct:

- `flash/images/<ID>.jpg` is the small raster illustration used by the legacy Flash diagram viewer.
- `flash/xml/<ID>.xml` contains conventional XML hotspot geometry and item-number associations for the diagram when hotspot data exists.
- `illustrations/png/<ID>.png` is the full-resolution raster illustration used by the non-Flash full-size-image view when that asset exists.
- Model watermark/background images under `images/` are a separate media namespace and must not be conflated with catalogue illustration IDs.

Asset-family presence is not guaranteed to be one-to-one. A logical illustration can have one or more of these corresponding files. Import and validation must therefore preserve the logical identifier and record each discovered asset independently rather than infer that all same-name assets exist.

Hotspot XML relates image regions to catalogue item numbers. One item number can have multiple hotspot regions in the same illustration, so diagram-to-item linkage is not a one-rectangle-per-item relationship.

The legacy Flash viewer has configuration values for its own hotspot coordinate space. Those values and the presence of same-name JPG/XML/PNG assets do not prove pixel identity, coordinate equivalence, or a conversion formula between the Flash-viewer image and the full-resolution PNG. Coordinate conversion must remain evidence-based and separately validated.

For import and VIEPS use:

- preserve the logical illustration identifier as source provenance;
- preserve asset family, source path, checksum and relationship to the catalogue occurrence/category;
- preserve hotspot item-number and geometry records losslessly;
- allow media processing to be separate from catalogue-data processing without losing their source relationship;
- do not derive missing media, hotspot geometry, or coordinate transformations from filename similarity alone.

## Generalization rule

Individual part numbers, individual test cases, temporary research identifiers, and task-specific evidence belong in the relevant research or task record unless they establish a reusable domain rule. This document should remain stable as generalized JEPC/source knowledge while concrete supersession findings accumulate in their appropriate evidence records.
