# JEPC Source Knowledge

## Scope

This file records durable JEPC/source knowledge established from catalogue/source investigation, including parts supersession and source market/Region semantics. It belongs with JLR/JEPC research because these relationships, source evidence, and JEPC UI observations originate from catalogue/source investigation rather than from Jagports importer implementation.

Jagports-developed importer applications, tests, and operating specifications belong under `5-Implementation-Projects/software/jagports/JEPC-Importers/`.

## Model/menu Region and market semantics

JEPC model/menu names can encode market scope and must be preserved as source context during import.

Verified source examples include:

- XK8 model `3183`: `XK8 Coupe/Convertible - Canada/USA up to (V) 042775`.
- X308 model `3213`: `XJ Series (From (V)812317 to (V)F59525 (Canada/Mexico/USA)`.

These explicit source names support a normalized broad Region grouping such as `Americas` for importer source selection and validation. Their corresponding non-Americas variants may be represented as `Rest of world excluding Americas` when that mapping has been established for the selected import profile.

The normalized Region label is interpretation layered over retained source evidence. Preserve the original JEPC model/menu text and IDs so vocabulary can be refined without losing source identity.

Region is vehicle/catalogue context, not canonical PART identity. The same canonical PART may occur in multiple Region, market, model, VIN, category and occurrence contexts.

### `($)` marker boundary

A category marker such as `($)` must be retained verbatim as source evidence.

In the examined later-XK headlamp category, `HEADLAMP ASSEMBLY-NON POWERWASH ($)` contains explicit Canada and USA branches. This demonstrates that market scope can exist below a shared JEPC model, but does **not** establish that `($)` universally means `North America`, `Americas`, Canada/USA, or any other geographic vocabulary.

Do not derive a normalized Region from `($)` alone. Use explicit model/menu/branch evidence and preserve the raw marker separately.

Likewise, choosing a normalized vocabulary label such as `North America` versus `Americas` is a controlled mapping decision. It must not be inferred from the marker itself.

Region, country/market, steering, aspiration/supercharger state and equipment options remain separate dimensions.

Source traceability: [PR #621 — JEPC source Region breadcrumb semantics](https://github.com/jagports/jagports/pull/621).

## Importer selection principle

Importer source selection must be configurable below the broad VIEPS Range level where JEPC exposes distinct model/sub-range or market variants. A selected import profile may target a specific JEPC model/sub-range together with Region/market context rather than importing an entire Range at once.

This supports bounded, restartable importer development while preserving original source scope and the ability to expand coverage later.

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

## Generalization rule

Individual part numbers, individual test cases, temporary research identifiers, and task-specific evidence belong in the relevant research or task record unless they establish a reusable domain rule. This document should remain stable as generalized JEPC/source knowledge while concrete supersession findings accumulate in their appropriate evidence records.
