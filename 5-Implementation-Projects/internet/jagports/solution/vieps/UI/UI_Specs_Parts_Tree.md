# VIEPS UI — Parts Tree hierarchy and selection contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #474  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define the implementation-ready contract for the Concept-11 Parts Tree: preserve the catalogue main-level context while expanding/emphasizing only the relevant descendant path(s) and selected occurrence.

## Data semantics
Tree nodes represent EPC/category/group context. They do not create duplicate canonical PART identities. A canonical PART may occur in multiple EPC contexts, and each occurrence can have a distinct tree path.

Each node has a stable UI identity and retains its parent/child relationship. The selected occurrence/item is separate from the canonical PART identity.

## Concept-11 presentation
The approved Concept-11 SVG shows a persistent left-column main-level category index with one relevant branch expanded to the selected context.

Therefore:

- keep the main-level category index visible where the read contract supplies it;
- when a PART/context is resolved, expand/emphasize only the descendant path(s) relevant to that result;
- preserve ancestors and enough surrounding hierarchy to understand the selected occurrence;
- unrelated descendant branches are not required merely to reproduce a full legacy EPC tree;
- strongly distinguish the selected occurrence/path from other visible main-level categories.

`show only relevant path(s)` means the relevant descendant path(s) are the ones expanded/emphasized. It does **not** require replacing the persistent main-level index with one isolated path.

## Empty-search / browse state
Concept-11 notes that an empty search may update Parts Tree main levels according to matching stock.

This is permitted only when an approved stock/catalogue browse contract exists. Until then, keep the permanent tree region visible and represent unsupported stock-driven browsing explicitly as unavailable rather than manufacturing categories from fixture assumptions.

## Selection and expansion
- The resolved occurrence/item is visibly selected.
- Selection exposes stable occurrence/item identity to the Main View.
- Tree selection does not mutate canonical PART identity.
- Expand/collapse is UI state only.
- Multiple valid occurrences remain distinguishable; no arbitrary silent replacement of context is permitted.

## Missing data
A resolved PART without tree context is not `not_found`. The tree result uses an explicit `unavailable` state. No hierarchy, category, or context may be invented.

## UI/API contract
```text
PartsTreeRequest
  canonical_part_id
  occurrence_context_id
  browse_constraints?   # only when an approved browse/stock contract exists

PartsTreeResult
  state
  main_levels[]         # when supplied by the catalogue/browse contract
  context
  nodes[]
  relevant_path[]
  selected_node_id / selected_occurrence_id
  unavailable/error information when applicable
```

## Deterministic fixtures
Fixtures must cover:
- a visible main-level category index;
- a multi-level relevant descendant path;
- ancestors and optional siblings;
- a selected leaf/occurrence;
- the same canonical PART in multiple EPC contexts;
- unavailable tree context;
- selection and expand/collapse state.

Fixture values are deterministic test data and are not production provenance.

## Concept-11 integration
The Parts Tree occupies the permanent full-height left column. Search, Model Ranges, Suitability and Main View consume or constrain the same occurrence context; they do not create a second tree model.

## Dependencies and boundaries
This specification consumes #354 semantics and follows #472 Part Search resolution. It does not redefine the Parts Data Model. Full JEPC import (#355), hotspot conversion (#352), vehicle location (#361/#362), full suitability/fitment, supersession/Classic, and stock are outside this priority unless explicitly linked through their approved contracts.

## Acceptance criteria
- [ ] Main-level index versus relevant descendant-path behavior is defined.
- [ ] Tree identity and PART vs occurrence/context semantics are defined.
- [ ] Selected-item and expand/collapse behavior are defined.
- [ ] Multiple EPC occurrences are represented without duplicate canonical identity.
- [ ] Missing/unavailable tree context is explicit and distinct from not-found.
- [ ] Empty-search stock-driven tree filtering is conditional on an approved contract.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Parts Tree UI/API contract is defined for #368.
- [ ] Scope remains within #468 and does not redefine #354.

## Definition of done
A #368 implementation can build the Concept-11 Parts Tree and selection behavior without introducing a new domain-model decision or reverting to the old isolated-path interpretation.
