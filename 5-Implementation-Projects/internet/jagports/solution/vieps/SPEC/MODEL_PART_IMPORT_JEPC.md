# VIEPS E2E JEPC-to-D1 Data Model

## Purpose

This document is the canonical end-to-end data-model specification for transforming Jaguar JEPC source data into VIEPS Range-partitioned D1 catalogue databases.

It owns the complete semantic path from JEPC source evidence through import identity, durable D1 persistence, normalized catalogue relationships, unresolved source evidence and runtime reconstruction/query behavior. It is not limited to FIT, PART rows, the current DataImporter implementation, or the current physical D1 schema.

[MODEL_PART.md](MODEL_PART.md) owns detailed PART, occurrence, catalogue-tree and FIT semantics inside this larger E2E model. JEPC source-research documents describe observed source behavior. DataImporter specifications own execution mechanics. D1 deployment specifications own physical setup and partitioning. Those narrower documents must not reduce this E2E completeness contract.

The import target is not merely a cache of selected PART rows. A successfully imported parts-<range_slug> D1 database is the durable JEPC-derived catalogue database for that Range.

## E2E model ownership

This model owns the JEPC-to-D1 data contract across all JEPC-derived catalogue domains, including domains that are not yet fully implemented.

It includes:

- source dataset/release identity and source-file evidence;
- model/menu ancestry and Range routing;
- categories, top-level items and ordered catalogue tree structure;
- canonical PARTs and source occurrences;
- application IDs, raw applicability/attribute evidence and normalized FIT;
- multilingual source structures and descriptions;
- diagrams, illustrations, hotspots, item callouts and media relationships where present;
- supersession, catalogue location and other verified source relationships where present;
- unknown or unsupported JEPC file families, rows, fields, tuples and semantic codes;
- parser/mapping versions, provenance, snapshots and completeness state;
- D1 runtime reconstruction and query requirements.

The current importer may implement these domains incrementally. Incremental implementation does not narrow the target model.

~~~text
JEPC source
    |
    v
durable source evidence
    |
    +--> source hierarchy / scope
    +--> catalogue structure
    +--> PART / occurrence
    +--> FIT / applicability
    +--> multilingual structure
    +--> media / diagram / hotspot relationships
    +--> supersession / location / other source relationships
    +--> unresolved source structures
    |
    v
parts-<range_slug> D1
    |
    +--> browse / Parts tree
    +--> reverse PART search
    +--> FIT evaluation
    +--> diagram/location reconstruction
    +--> provenance/explanation
    +--> future remapping/reprocessing
~~~

## Durable source-evidence layer

D1 must retain enough source-qualified evidence to re-derive normalized catalogue relationships without reopening JEPC files. This is broader than retaining only FIT evidence.

At minimum the durable source layer must represent, as applicable:

| Concept | Required durable identity/evidence |
| --- | --- |
| Source dataset | source namespace, dataset/release identity when known, import/snapshot identity |
| Source file | relative path, file family/type, checksum, language and model/category/item scope |
| Source record | file identity, stable record/row locator, raw record or lossless equivalent |
| Source bundle | model/category/item/language scope and dependency membership |
| Source relationship | source-qualified relationship, including unresolved relationship type when semantics are not verified |
| Interpretation | parser version, mapping/semantic version, verification state |
| Completeness | complete, partial, incomplete or unresolved state for the relevant source scope |

Unknown source records must remain recoverable with enough context to be interpreted later. A checksum identifies source bytes; it is not logical catalogue identity.

## Complete JEPC-to-D1 information graph

~~~text
JEPC dataset
  |
  +--> model/menu hierarchy
  |      +--> model / parent / ancestor context
  |             +--> accepted Range routing
  |
  +--> category
  |      +--> top-level item
  |             +--> ordered source tree
  |                    +--> branch/group/condition node
  |                    +--> PART occurrence
  |                           +--> canonical PART
  |                           +--> exact path identity
  |                           +--> applicationId
  |                           +--> raw predicates/sidecars
  |                           +--> normalized FIT assertions
  |                           +--> diagram/location relationships
  |
  +--> language-qualified source structure/text
  |
  +--> media / illustration / hotspot references
  |
  +--> supersession / location / other source relationships
  |
  +--> unknown or unsupported source structures
  |
  +--> source files / raw records / checksums / provenance
  |
  +--> import snapshot / parser version / mapping version / completeness
~~~

Every normalized relationship must remain traceable to durable source-qualified evidence.


## Runtime independence requirement

After a complete, successful import for an accepted source scope, normal VIEPS catalogue behavior must not require the original JEPC installation or the local DataImporter SQLite ledger.

The D1 parts database must independently contain enough source-qualified and normalized information to:

- reconstruct the catalogue Parts tree;
- return every retained occurrence and its exact source path;
- perform reverse PART-number to occurrence/path lookup;
- derive and evaluate FIT from the canonical grouped FIT model;
- retain raw source predicates and evidence needed to explain, remap or re-evaluate FIT later;
- reproduce language-qualified source descriptions and structurally distinct language trees;
- resolve supported diagrams, hotspots and catalogue location relationships where those domains have been imported;
- retain provenance sufficient to distinguish source facts, normalized interpretation and unresolved source semantics.

The local SQLite ledger is importer working, recovery, discovery and audit state. It may contain additional source bytes, processing events and temporary discovery information, but it is not a runtime dependency and must not be the only surviving store of information required to recreate catalogue tree or FIT behavior.

## Import architecture

~~~text
JEPC installation
      |
      v
DataImporter
      |
      +------------------------------+
      |                              |
      v                              v
local SQLite ledger             parts-<range_slug> D1
(import working state)          (durable catalogue state)
      |                              |
      |                              +--> Parts tree
      |                              |
      |                              +--> FIT derivation/evaluation
      |                              |
      |                              +--> reverse PART search
      |                              |
      |                              +--> source evidence/explanation
      |                              |
      |                              +--> future remapping/re-evaluation
      |
      +--> restart / progress / recovery / diagnostics

Runtime catalogue reads must terminate at D1.
JEPC files or the local ledger are not required after a complete accepted import.
~~~

## Required D1 information graph

The physical schema may evolve, but the persisted information graph must preserve the complete JEPC-derived source and catalogue relationships without flattening away source identity, unresolved data or logical grouping.

~~~text
JEPC source scope
  |
  +--> source model / parent ancestry
  |      |
  |      +--> category
  |             |
  |             +--> top-level item
  |                    |
  |                    +--> ordered source tree nodes
  |                           |
  |                           +--> PART occurrence
  |                                  |
  |                                  +--> canonical PART
  |                                  |
  |                                  +--> exact occurrence tree path
  |                                  |
  |                                  +--> applicationId
  |                                  |
  |                                  +--> raw source conditions
  |                                  |
  |                                  +--> raw applicability sidecar evidence
  |                                  |
  |                                  +--> normalized FIT assertion
  |                                         |
  |                                         +--> model context
  |                                         |
  |                                         +--> alternative condition set(s)
  |                                                |
  |                                                +--> VIN/serial constraints
  |                                                |
  |                                                +--> typed attribute conditions
  |                                                |
  |                                                +--> exclusions
  |                                                |
  |                                                +--> evidence links
  |
  +--> language-qualified source descriptions
  |
  +--> diagrams / hotspots / catalogue locations, where supported
  |
  +--> checksums, source references and versioned provenance
~~~

A flattened description path, a PART-level range flag, or an opaque JSON blob by itself is not a substitute for the required structural identities and grouped FIT relationships.

## Source bundle preservation

JEPC files that share model/category/item/language identity form one logical source scope. The importer must preserve the identifiers and relationships needed to reconstruct that scope.

At minimum, imported evidence needed by catalogue behavior must retain:

~~~text
source namespace
source model identity and ancestry
source category identity
source item identity
source language
source node identity
parent source node identity
source order
source descriptions
PART leaf identity
applicationId
raw source condition rows
available application/attribute sidecar rows
source file identity/checksum
record locator or equivalent provenance
~~~

Unknown or unsupported source rows must not be converted into invented semantics. If they can affect catalogue tree, occurrence identity, FIT or future interpretation, their source-qualified evidence must remain recoverable from the durable imported dataset or from a source-evidence relation referenced by it.

## Catalogue tree contract

Tree import is occurrence-first.

~~~text
model/catalogue ancestry
    -> category ancestry
    -> top-level item
    -> ordered source branch nodes
    -> PART occurrence
~~~

The D1 representation must preserve:

- source-qualified node identity;
- parent/child ancestry;
- source ordering;
- source language;
- exact occurrence-to-path linkage;
- multiple paths for one occurrence where JEPC contains them;
- shared canonical PART identity across multiple occurrences;
- structural divergence between language-specific trees.

Description text is presentation evidence, not tree identity.

part_tree_part or equivalent broad membership may accelerate browsing, but it cannot replace the exact occurrence/path relationship.

## FIT import contract

JEPC source navigation and FIT are related but not identical.

Source tree branches remain catalogue evidence. Verified FIT is represented through the grouped occurrence-bound model defined by [MODEL_PART.md](MODEL_PART.md#fit-model).

The D1 database must retain both layers:

~~~text
raw JEPC evidence
    |
    +--> branch/path descriptions
    +--> applicationId
    +--> attribute/application sidecars
    +--> raw tuples/predicates
    +--> source scope/provenance
             |
             v
verified interpretation
    |
    +--> occurrence FIT assertion
           |
           +--> model context
           |
           +--> condition set A
           |      +--> predicate
           |      +--> predicate
           |
           +--> condition set B
                  +--> predicate
                  +--> exclusion
~~~

Alternative source paths must remain alternatives when verified as such. They must not be collapsed into one impossible conjunction.

An unresolved predicate, grouping rule, comparator or semantic mapping remains unresolved evidence. Missing interpretation must not become unrestricted applicability or a blanket negative.

## FIT derivability from D1

A complete imported D1 dataset must support the following runtime derivation without reopening JEPC source files:

~~~text
vehicle/configuration input
          |
          v
model context + serial/VIN context
          |
          v
occurrence FIT assertions
          |
          v
alternative condition sets
          |
          v
three-valued predicate evaluation
    true / false / unknown
          |
          v
applicable / not_applicable / unavailable
          |
          v
surviving occurrences
          |
          v
distinct canonical PARTs
~~~

Reverse lookup must use the same persisted relationships:

~~~text
PART number
    |
    v
canonical PART
    |
    v
all occurrences
    |
    +--> complete source paths
    +--> model contexts
    +--> condition sets
    +--> serial/VIN limits
    +--> raw and normalized FIT evidence
~~~

FIT must not depend on reparsing source XML during a normal request.

## Raw evidence and normalized data

D1 must preserve enough raw evidence to make normalized results explainable and replaceable.

Raw evidence and normalized entities have different purposes:

| Layer | Required purpose |
| --- | --- |
| Raw source evidence | Preserve what JEPC actually stated, including unknown or not-yet-mapped information. |
| Source structural graph | Preserve model/category/item/tree/occurrence identity and ordering. |
| Normalized PART model | Provide stable canonical PART and occurrence identities. |
| Normalized FIT model | Preserve verified model contexts, alternatives, predicates, exclusions and serial/VIN constraints. |
| Mapping/version provenance | Identify which parser/mapping interpretation produced normalized relationships. |

Normalized records must link back to retained evidence. A later mapping correction must be possible without fabricating source facts.

## Language contract

Language-specific JEPC trees may differ structurally.

The import must therefore preserve source-language tree and occurrence identities independently where the source differs. Matching labels or matching numeric node IDs do not establish cross-language equivalence.

Canonical PART identity remains language-independent when source evidence establishes the same PART.

Localized presentation may derive from mapped descriptions, but the original source-language description and provenance remain available.

## JEPC media and non-PART catalogue domains

Media, diagrams and hotspots are part of the E2E catalogue model even when binary media bytes are stored outside D1.

D1 must retain stable source identity, checksum/reference metadata and catalogue relationships sufficient to reconstruct how imported media participates in JEPC. A specialized MediaImporter may ingest binary assets, but that does not move ownership of JEPC media relationships out of this E2E model.

Other JEPC-derived relationships such as supersession, replacement, catalogue location or future newly understood domains must follow the same rule: preserve raw source-qualified evidence first; create normalized semantics only when verified; never discard a source relationship merely because the current schema does not yet understand it.

~~~text
source evidence
    |
    +--> known semantic mapping --> normalized D1 relationship
    |
    +--> unknown semantic mapping --> durable unresolved evidence
~~~

## Unknown and unsupported source structures

A complete E2E import is loss-preserving. When a new file family, field, record type, tuple, relationship or code is encountered:

1. preserve the source-qualified raw evidence;
2. retain dataset/file/bundle/context identity;
3. record parser/mapping version and unresolved state;
4. do not invent a normalized meaning;
5. continue other safe import work where possible;
6. allow later schema/mapping knowledge to reprocess the durable evidence.

Complete import does not require every JEPC semantic to be understood. It requires unknown semantics to be retained rather than silently lost.


## Diagram and hotspot contract

Where diagram, illustration, hotspot or catalogue-location source data is supported by the importer, D1 must retain the relationships required by [MODEL_PART.md](MODEL_PART.md):

~~~text
PART occurrence
      |
      +--> diagram
      |      |
      |      +--> hotspot / item callout
      |
      +--> catalogue vehicle location
~~~

Unsupported media interpretation must remain explicitly unsupported or unresolved rather than being inferred from geometry alone.

## Reprocessing and replacement

Import is restartable and idempotent.

For unchanged source evidence, rerunning the importer must not create duplicate canonical identities, occurrences, tree nodes, paths or FIT assertions.

For changed source evidence:

1. stage the new source evidence;
2. derive the complete replacement graph for the affected source scope;
3. validate identity, provenance and FIT grouping;
4. replace or version the affected D1 graph atomically;
5. retain required historical/version evidence;
6. ensure stale active relationships from the replaced scope no longer participate in runtime reads.

A partial import must never be represented as complete coverage.

## D1 completeness invariant

For every source scope reported as completely imported, D1 must satisfy this E2E invariant:

~~~text
D1 complete source scope
        |
        +--> durable source hierarchy/evidence       YES
        |
        +--> complete retained Parts tree             YES
        |
        +--> all imported PART occurrences            YES
        |
        +--> exact occurrence paths                   YES
        |
        +--> raw FIT-relevant source evidence         YES
        |
        +--> normalized verified FIT graph            YES, where interpretation is verified
        |
        +--> explicit unresolved FIT evidence         YES, where interpretation is not verified
        |
        +--> media/other source relationships         YES, where present
        |
        +--> unresolved source structures retained    YES
        |
        +--> provenance and mapping/version identity  YES
        |
        +--> runtime needs JEPC installation          NO
        |
        +--> runtime needs local SQLite ledger        NO
~~~

If required information exists only in the local ledger, the D1 import for that scope is not complete.

## Partitioning boundary

Catalogue data is partitioned by the accepted vehicle Range routing contract. Each parts-<range_slug> database must preserve the same model semantics.

Partitioning must not change canonical PART/FIT meaning. Cross-Range discovery and identity resolution are separate query/routing concerns; the importer must not discard source evidence merely because one logical PART may appear in more than one Range database.

## Runtime read model

The runtime catalogue is a D1-derived view of the complete imported E2E graph.

~~~text
D1
 |
 +--> browse source model/category/item/tree
 +--> selected branch -> occurrences -> distinct PARTs
 +--> PART -> all occurrences -> all source paths
 +--> vehicle context -> FIT -> surviving occurrences/PARTs
 +--> occurrence -> diagram/hotspot/location
 +--> PART -> supersession / related catalogue facts
 +--> source fact -> provenance / raw evidence / interpretation version
~~~

Runtime application code must not need JEPC source files for a query whose source scope is completely imported.

## Importer working-state boundary

The local SQLite ledger may retain information that is useful only to importer operation, for example:

- scan/checksum history;
- progress and timing;
- retry/recovery state;
- temporary discovery records;
- diagnostics;
- source bytes retained for reprocessing.

These operational records do not need to be copied verbatim to D1 unless they are required to reconstruct, explain or re-evaluate the durable catalogue model.

The distinction is:

~~~text
SQLite = importer execution state
D1     = durable runtime catalogue state
~~~

The boundary must be decided by data semantics, not by implementation convenience.
