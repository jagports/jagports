# VIEPS UI — Parts Tree hierarchy and selection contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #474  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective
Define the implementation-ready Parts Tree contract from the Concept-11 SVG merged by PR #645: retain the catalogue main-level index while expanding/emphasizing only relevant descendant path(s) and the selected occurrence.

## Data semantics
Tree nodes represent EPC/category/group context. They do not create duplicate canonical PART identities. A canonical PART may occur in multiple EPC contexts, each with a distinct tree path. Selected occurrence/item identity remains separate from canonical PART identity.

## Merged Concept-11 presentation
The SVG visibly shows a scrolling left-side catalogue index with many main categories and an expanded branch. Examples drawn in the concept include main levels such as `ENGINE`, `ENGINE COOLING SYSTEM`, `BRAKING SYSTEM` and others, while a relevant descendant such as `COOLING FAN AND COWL - 4.0 LITRE - V8` is emphasized.

These example labels are visual evidence of hierarchy, not a hard-coded production catalogue.

Required presentation:

- keep the main-level category index visible where supplied by the read contract;
- expand/emphasize only descendant path(s) relevant to the resolved PART/context;
- preserve ancestors and enough surrounding hierarchy to understand the occurrence;
- unrelated descendant branches need not be expanded merely to reproduce a complete legacy EPC;
- strongly distinguish selected/relevant occurrence/path from other visible categories;
- keep the tree as a scrolling permanent left region below the Concept-11 branding/instructions header block.

`show only relevant path(s)` in the SVG means relevant descendant paths are the ones expanded/emphasized. It does **not** mean replacing the main-level index with one isolated path.

## Empty-search / browse state
Concept-11 says an empty search plus supported stock constraint may update which Parts Tree main levels are shown. This is permitted only when an approved stock/catalogue browse contract resolves stock through canonical PART/catalogue relationships. Until then, keep the tree visible and show unsupported stock browsing as unavailable.

## Selection and expansion
- Resolved occurrence/item is visibly selected.
- Selection exposes stable occurrence/item identity to Main View.
- Tree selection never mutates canonical PART identity.
- Expand/collapse is UI state only.
- Multiple valid occurrences remain distinguishable.
- Tree context coordinates with Model Ranges, Location, Suitability and PART/Image/Status without creating another tree model.

## Missing data
A resolved PART without tree context is not `not_found`. Use explicit `unavailable` state. Do not invent hierarchy, categories or context.

## UI/API contract
```text
PartsTreeRequest
  canonical_part_id
  occurrence_context_id
  browse_constraints?   # only with approved browse/stock contract

PartsTreeResult
  state
  main_levels[]         # when supplied by catalogue/browse contract
  context
  nodes[]
  relevant_path[]
  selected_node_id / selected_occurrence_id
  unavailable/error information
```

## Deterministic fixtures
Cover a visible main-level index, multi-level relevant descendant path, ancestors/siblings, selected leaf/occurrence, same canonical PART in multiple EPC contexts, unavailable tree context, and expand/collapse state. Preserve current `main` fixture identifiers such as `firtree1` / `firtree2` as non-numbered fixture identifiers, not Jaguar part numbers.

## Viewport and language
Long tree content scrolls internally in the fitted #616 desktop shell. Catalogue labels may come from independently selected Parts/catalogue-data language under #620; surrounding UI controls follow #554. Both must tolerate variable-length text.

## Acceptance criteria
- [ ] Persistent main-level index vs relevant descendant expansion is defined from merged Concept-11.
- [ ] Tree identity and PART vs occurrence/context semantics remain separate.
- [ ] Selected-item and expand/collapse behavior are defined.
- [ ] Multiple EPC occurrences do not duplicate canonical identity.
- [ ] Missing tree context is explicit and distinct from not-found.
- [ ] Empty-search stock browsing is conditional on an approved contract.
- [ ] Main-branch deterministic fixtures remain semantically intact.
- [ ] Viewport and UI-vs-Parts language boundaries are preserved.
