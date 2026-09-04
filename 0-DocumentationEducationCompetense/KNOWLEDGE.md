# Parts Supersession Knowledge

## Purpose

Parts supersession is durable catalogue knowledge describing how one catalogue part is replaced by another. It is distinct from current operational stock and from general claims that two parts are interchangeable.

## Supersession as a catalogue relationship

A superseded or obsolete catalogue part remains an independently addressable catalogue entity. Supersession must not overwrite or delete the historical part number.

A supersession relationship is directed: the source part is the superseded part and the target part is the replacement/superseding part. The model must represent the relationship itself rather than encoding supersession only as a single replacement field on the source part.

A relationship may be one-to-one, one-to-many, or part of a longer replacement chain. The representation must therefore support multiple replacement relationships and chains without losing the historical links.

### JEPC UI indication

The VIEPS concept UI / parts-list reference images preserve an important observation from the JEPC interface: supersession is visually indicated in the parts list by a **round-arrow icon** associated with the superseded part entry. This icon is a catalogue/UI indication of a supersession relationship and is therefore useful evidence when interpreting or validating JEPC parts-list data.

The icon should not be treated as a replacement for the underlying relationship data. The historical part number, replacement relationship, direction, and provenance remain explicit data requirements. The UI indication should be preserved as source-specific evidence/metadata where the imported source representation allows it.

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

Individual part numbers, individual test cases, temporary research identifiers, and task-specific evidence belong in the relevant research or task record unless they establish a reusable domain rule. This document should remain stable as a generalized source of knowledge while concrete supersession findings accumulate in their appropriate evidence records.

## Traceability

This knowledge consolidates and generalizes the supersession knowledge originally documented for JEPC and JLR Classic Parts in PR #364. The consolidation changes the knowledge location and organization; it does not change the underlying domain requirement that explicit catalogue/manufacturer supersession evidence must be represented as durable, directed catalogue knowledge separate from operational stock.
