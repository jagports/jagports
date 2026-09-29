# VIEPS JEPC PART Import Model

## Purpose

This document defines the canonical import contract for transforming Jaguar JEPC catalogue data into VIEPS PART databases.

It complements [MODEL_PART.md](MODEL_PART.md), which owns canonical PART, occurrence, catalogue-tree and FIT semantics. This document owns the JEPC-to-PART import boundary: what source evidence must survive import, what must be materialized into the Range-partitioned D1 databases, and what must remain derivable after import.

The import target is not merely a cache of selected PART rows. A successfully imported parts-<range_slug> D1 database is the durable JEPC-derived catalogue database for that Range.

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

The physical schema may evolve, but the persisted information graph must preserve the following relationships without flattening away source identity or logical grouping.

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

For every source scope reported as completely imported, D1 must satisfy this invariant:

~~~text
D1 complete source scope
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
