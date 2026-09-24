# Deferred JEPC Kit-Evidence Specification

(C)2026 by tlindi and ChatGPT

## Status and boundary

This specification preserves deferred JEPC research knowledge. It defines no active MediaImporter behavior and does not authorize kit detection, dashed-enclosure analysis, kit composition, kit-membership publication, canonical PART creation, stock relationships, or Parts Data Model changes.

The active MediaImporter operating contract remains limited to media preservation, hotspot evidence preservation, and supported VIEPS catalogue relationships.

## Research observation

Some JEPC exploded diagrams appear to enclose several component callouts within dashed boundaries. A kit part number may exist in related catalogue context even where the source has no explicit machine-readable list of kit contents.

This pattern is a research signal. It is not source-of-truth evidence of a kit composition.

## Evidence to retain if this work is reopened

A future investigation may retain an observation only with its source context:

- exact source image checksum and representation;
- enclosure boundary evidence;
- visible callout text and evidence location;
- raw hotspot records associated with the callouts, where present;
- source-qualified catalogue item and component-occurrence context;
- candidate kit part-number context;
- source release and logical illustration identity;
- analysis provenance and ambiguity or conflict state.

The observation remains tied to the exact image representation. A change of source bytes, selected representation, or interpretation context requires fresh evaluation.

## Verification threshold

A candidate kit-content relationship requires all of the following to agree:

1. enclosure and callout observation;
2. validated mapping from the visual callout to a hotspot or catalogue item;
3. distinct component occurrence and PART identity where the source supplies one;
4. source-qualified kit part-number context;
5. approved coordinate and target-image evidence from issue #352 where spatial assertions are needed;
6. Parts Data Model approval for any relationship that will be persisted or published.

If any required evidence is missing, ambiguous, conflicting, unreadable, or has multiple plausible kit part numbers, retain an unresolved observation. Do not publish kit composition.

## Component identity rules

A component with its own part number remains its own PART and source-qualified occurrence even if a future verified relationship also identifies it as belonging to a kit. Kit membership must not replace individual identity or individual availability.

A diagram can show component shapes inside a possible kit enclosure that have no independent hotspot, callout, or part number. Preserve that fact only as unnamed kit-only component evidence. Do not invent a canonical PART, part number, standalone availability, or quantity.

## Relationship model if approved later

```text
source diagram evidence
       │
       ▼
candidate enclosure + callouts
       │
       ├── callout → hotspot/catalogue item → component occurrence → PART
       │
       └── source-qualified kit PN context
                         │
                         ▼
                 evidence threshold met?
                    │              │
                   yes             no
                    │              │
                    ▼              ▼
         verified kit membership   unresolved evidence only
```

A future relationship is source-qualified and evidence-qualified. It is not a manufacturing BOM, stock relationship, or universal part-substitution claim.

## Prerequisites to activate work

Before any implementation or publication work begins:

- issue #352 must establish the required image/hotspot coordinate evidence;
- the Parts Data Model workflow must approve a truthful additive representation;
- an explicitly approved MediaImporter scope must reintroduce the work;
- validation evidence must demonstrate that the source-specific rules do not create invented relationships.

## Traceability

- Issue #352 owns JEPC hotspot coordinate conversion evidence.
- Issue #354 and `MODEL_PART.md` own Parts Data Model changes.
- PR #913 records the earlier evidence-gated kit-group research.
- Issue #946 owns this deferred specification.
