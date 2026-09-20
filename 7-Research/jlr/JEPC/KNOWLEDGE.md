# JEPC Supersession Knowledge

## Scope

This file records durable JEPC/source knowledge about parts supersession. It belongs with JLR/JEPC research because the relationship semantics, source evidence, and JEPC UI observations originate from catalogue/source investigation rather than from Jagports importer implementation.

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

## Generalization rule

Individual part numbers, individual test cases, temporary research identifiers, and task-specific evidence belong in the relevant research or task record unless they establish a reusable domain rule. This document should remain stable as generalized JEPC/source knowledge while concrete supersession findings accumulate in their appropriate evidence records.


## Catalogue tree, occurrences, and applicability

JEPC catalogue data must be treated as an occurrence tree, not as a flat PART list and not as a code dictionary that must be decoded before useful catalogue import can begin.

The source-visible path is assembled from linked JEPC scopes:

```text
model / catalogue ancestry
    -> category ancestry
    -> numbered top-level item description
    -> item-tree descriptions
    -> PART leaf
```

In the observed item-tree format, rows whose part/category-entry fields are zero are rendered by the original JEPC code as an **attribute or breakpoint** using the row description. A PART leaf carries its source application identifier. The corresponding applicability sidecar record is joined by that exact source identifier.

The importer therefore preserves both sides of the source:

```text
human-readable occurrence path
    +
application identifier
    +
raw applicability rules / predicates
    +
source-file and row/path evidence
```

The visible descriptions already provide the catalogue's human-readable browse and filter vocabulary. Raw `A...`, `C...`, and other applicability tuples remain mandatory provenance and machine-evaluation evidence; they are not discarded merely because the same occurrence has readable tree descriptions.

Do not derive description meaning from tuple order or from positional alignment between applicability tuples and tree ancestors. Raw tuple ordering is not a reliable semantic mapping. If a code-to-description mapping is needed, establish it only from deterministic source evidence and retain the underlying raw code/value and provenance.

### Occurrence identity and queries

A canonical PART may occur in many catalogue paths. Filtering and browsing operate on occurrences first; PART numbers are projected from the surviving occurrence set.

```text
browse branch
    -> all occurrences below the branch
    -> optional description / VIN / applicability filtering
    -> surviving occurrences
    -> distinct PART numbers
```

The reverse query is equally important:

```text
PART-number search
    -> all matching source occurrences
    -> complete catalogue/tree path for each occurrence
    -> application ID and raw applicability evidence
```

A PART number must not be reduced to one combined path or one combined applicability record merely because several occurrences share the same canonical PART.

### Source tree versus semantic enrichment

Source descriptions are imported verbatim as source data. VIEPS may later maintain a separate semantic mapping layer, for example mapping a source description into one or more normalized filter facets. Such mappings are enrichment, not JEPC source facts, and may be context-sensitive.

The source tree remains independently recoverable even after enrichment. Re-mapping semantic facets must not require re-importing or rewriting the original JEPC occurrence path.

### Full-path strings are presentation output

A flattened string such as `A > B > C > PART` is useful for diagnostics, exports and human validation. It is not the canonical structural identity of the imported tree.

Canonical import must retain source node identity, parent/child structure, ordering, source scope and occurrence linkage. Do not identify nodes or occurrences solely by concatenated description text.

### Multilingual source trees

Do not assume that all JEPC languages share one identical tree with only translated strings. Some models/languages may have structurally different trees.

Preserve each source-language tree losslessly, including its node identity, parentage, order and descriptions. Share canonical PART identity and other source identifiers only where they are demonstrably common. Cross-language tree-node or occurrence equivalence is an optional derived relationship and must be created only when deterministic correspondence is established.

This rule prevents i18n import from multiplying canonical PART identities while also preventing structurally different source trees from being falsely collapsed.
