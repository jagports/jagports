# VIEPS UI — Parts Tree hierarchy and selection contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #474  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective
Define the implementation-ready contract for Concept View-1 priority 2: Parts Tree shows the relevant hierarchical path and selected item.

## Data semantics
Tree nodes represent EPC/category/group context. They do not create duplicate canonical PART identities. A canonical PART may occur in multiple EPC contexts, and each occurrence can have a distinct tree path.

Each node has a stable UI identity and retains its parent/child relationship. The selected occurrence/item is separate from the canonical PART identity.

## Relevant-path presentation
The initial Concept-1 view exposes the relevant path and ancestors needed to understand the selected item. Unrelated catalogue branches are not required. Siblings may be shown when supplied by the context.

`show only relevant path(s)` is presentation/filter state over the same tree context. It is not a second data model.

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

PartsTreeResult
  state
  context
  nodes[]
  relevant_path[]
  selected_node_id / selected_occurrence_id
  unavailable/error information when applicable
```

## Deterministic fixtures
Fixtures must cover:
- a multi-level category path;
- ancestors and optional siblings;
- a selected leaf;
- the same canonical PART in multiple EPC contexts;
- unavailable tree context;
- selection and expand/collapse state.

Fixture values are deterministic test data and are not production provenance.

## Concept-1 integration
The Parts Tree component exists in its permanent Concept-1 position from the first implementation. Part Search supplies canonical PART and context. Fixture-backed hierarchy can later be replaced by imported data without changing the component's UI position or contract.

## Dependencies and boundaries
This specification consumes #354 semantics and follows #472 Part Search resolution. It does not redefine the Parts Data Model. Full JEPC import (#355), hotspot conversion (#352), vehicle location (#361/#362), full suitability/fitment, supersession/Classic, and stock are outside this priority.

## Acceptance criteria
- [ ] Tree identity and PART vs occurrence/context semantics are defined.
- [ ] Relevant-path hierarchy and ancestor visibility are defined.
- [ ] Selected-item and expand/collapse behavior are defined.
- [ ] Multiple EPC occurrences are represented without duplicate canonical identity.
- [ ] Missing/unavailable tree context is explicit and distinct from not-found.
- [ ] Deterministic fixture coverage is defined.
- [ ] Stable Parts Tree UI/API contract is defined for #368.
- [ ] Scope remains within #468 and does not redefine #354.

## Definition of done
A #368 implementation can build the Parts Tree and selection behavior without introducing a new domain-model decision.
