# VIEPS UI — Parts Tree hierarchy and selection contract

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #474  
**Implementation parent:** #368  
**Domain owner:** #354  

## Objective

Define the implementation-ready Parts Tree contract: show the relevant hierarchical path(s), selected occurrence/context and enough surrounding hierarchy to understand the selection.

The current placement authority is the **Concept-11 ASCII map in `UI_Specs.md`**, derived from `VIEPS UI-Concept-11.svg` reviewed in PR #645.

## Data semantics

Tree nodes represent EPC/category/group context. They do not create duplicate canonical PART identities. A canonical PART may occur in multiple EPC contexts, and each occurrence can have a distinct tree path.

Each node has a stable UI identity and retains its parent/child relationship. The selected occurrence/item is separate from the canonical PART identity.

## Concept-11 placement

The Parts Tree occupies the persistent **left column** of the desktop Concept-11 shell.

```text
┌──────────────────────────┬──────────────────────────────────┬──────────────────────────┐
│ PARTS TREE               │ centre workspace                 │ model/range context      │
│ relevant path(s)         │                                  │                          │
│  main level              │                                  │                          │
│   child                  │                                  │                          │
│    SELECTED CONTEXT      │                                  │                          │
│                          │                                  │                          │
│ scroll inside this region│                                  │                          │
└──────────────────────────┴──────────────────────────────────┴──────────────────────────┘
```

The selected/relevant path must remain visually strong in the Tailwind presentation. The old live Pico styling is not a visual target.

## Relevant-path presentation

The normal resolved-PART view exposes the relevant path and ancestors needed to understand the selected occurrence. Unrelated catalogue branches are not required. Siblings may be shown when supplied by the context.

`show only relevant path(s)` is presentation/filter state over the same tree context. It is not a second data model.

Concept-11 also illustrates an empty-search browsing state where stock/availability constraints may limit the tree to main/relevant levels represented by matching stock. That behaviour is valid only after an approved stock/catalogue query contract exists. Until then, show explicit unavailable guidance rather than fabricated stock-derived hierarchy.

## Selection and expansion

- The resolved occurrence/item is visibly selected.
- Selection exposes stable occurrence/item identity to the Main View.
- Tree selection does not mutate canonical PART identity.
- Expand/collapse is UI state only.
- Multiple valid occurrences remain distinguishable; no arbitrary silent replacement of context is permitted.
- The selected occurrence/context remains coordinated with suitability and part/image regions.

## Missing data

A resolved PART without tree context is not `not_found`. The tree result uses an explicit `unavailable` state. No hierarchy, category, stock relationship or context may be invented.

## UI/API contract

```text
PartsTreeRequest
  canonical_part_id
  occurrence_context_id
  optional approved browse/filter context

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
- a selected leaf/occurrence;
- the same canonical PART in multiple EPC contexts;
- unavailable tree context;
- selection and expand/collapse state.

Fixture values are deterministic test data and are not production provenance.

## Viewport and i18n

On the default desktop shell, long tree content scrolls inside the persistent left region as established by PR #616. Narrower layouts may reflow and use normal page scrolling.

Tree labels and surrounding UI controls must tolerate variable-length localized text. UI locale follows #554; JEPC catalogue-data language remains independently selectable under #620.

## Dependencies and boundaries

This specification consumes #354 semantics and follows the Part Search resolution contract. It does not redefine the Parts Data Model. Full JEPC import (#355), hotspot conversion (#352), vehicle location (#361/#362), fitment, supersession/Classic and stock remain separately governed concerns.

## Acceptance criteria

- [ ] Tree identity and PART vs occurrence/context semantics are defined.
- [ ] Relevant-path hierarchy and ancestor visibility are defined.
- [ ] Selected-item and expand/collapse behavior are defined.
- [ ] Multiple EPC occurrences are represented without duplicate canonical identity.
- [ ] Missing/unavailable tree context is explicit and distinct from not-found.
- [ ] Concept-11 left-column placement and selected-path emphasis are preserved.
- [ ] Stock-driven empty-search filtering is not fabricated without an approved contract.
- [ ] Viewport-fit and i18n-safe presentation are preserved.
- [ ] Stable Parts Tree UI/API contract is defined for #368.

## Definition of done

A #368 implementation can build the Parts Tree and selection behaviour without introducing a new domain-model decision and while conforming to the Concept-11 map in `UI_Specs.md`.
