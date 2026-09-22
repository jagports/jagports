# VIEPS UI — Parts Tree hierarchy and selection contract

**Status:** #873 expanded-tree contract retained; #875 coordinated Search Results proposed for review  
**Controlling issue:** #468  
**Priority issue:** #474  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective
Define the implementation-ready Parts Tree contract from the Concept-11 SVG merged by PR #645: retain the catalogue main-level index while expanding/emphasizing only relevant descendant path(s) and the selected occurrence.

The #875 proposed layout keeps this tree in the permanent left column while adding right-hand Search Results and Applicable Models panels. Neither addition replaces the accepted #873 root-index, progressive expansion, stable-identity and terminal PART-leaf behavior.

## Data semantics
Tree nodes represent EPC/category/group context. They do not create duplicate canonical PART identities. A canonical PART may occur in multiple EPC contexts, each with a distinct tree path. Selected occurrence/item identity remains separate from canonical PART identity.

## Merged Concept-11 presentation
The SVG visibly shows a scrolling left-side catalogue index with many main categories and an expanded branch. Examples drawn in the concept include main levels such as `ENGINE`, `ENGINE COOLING SYSTEM`, `BRAKING SYSTEM` and others, while a relevant descendant such as `COOLING FAN AND COWL - 4.0 LITRE - V8` is emphasized.

These example labels are visual evidence of hierarchy, not a hard-coded production catalogue.

Required presentation:

- keep the first-level/root category index visible where supplied by the read contract, including after a deep branch or PART leaf is selected;
- expand the complete root-to-latest-selected-category/occurrence/PART-leaf path within that **same** tree, rather than replacing the index with a clicked subtree or a series of isolated paths;
- merge common ancestors by stable tree-node identity so each branch appears once at its correct depth; preserve legitimately distinct source-qualified contexts even when their labels are equal;
- show the selected category's available immediate children while leaving unrelated deeper descendants collapsed unless they are themselves relevant to the selected path or active search results;
- show matching or resolved canonical PARTs as selectable terminal **leaves under their evidenced catalogue branches**; the #875 target additionally offers a deduplicated right-hand Search Results PART List, while the centre Main View remains a one-selected-PART panel, never a multi-PART candidate list;
- use modest incremental indentation and progressively stronger font weight toward the root; underline the **one active category or PART leaf**, rather than marking every ancestor or repeated path as selected;
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
- Tree context coordinates with the right-hand Search Results and Applicable Models panels, centre-top VIN/normalized Variations filters, Location at car and the single selected-PART panel without creating another tree or PART identity.

## Unified hierarchy and progressive expansion (#873)

**Render one identity-keyed hierarchy, not independent `root → leaf` lists.** Build the visible tree by combining supplied path ancestors into shared branches keyed by stable `part_tree_node.id` (and its source-qualified identity where necessary). A shared ancestor appears only once; visually identical labels are not grounds for merging distinct source nodes. Re-selecting a child updates expansion and the active path instead of appending a second copy of the same ancestor.

- **No selected node:** present available first-level/root branches, collapsed by default. Never invent missing roots.
- **Category selected:** retain the first-level/root index, show its complete ancestry expanded, and reveal its available *immediate* child branches. Deeper unrelated descendants remain collapsed.
- **PART selected:** retain the root index, expand the complete chosen source occurrence path, and display the selected PART identity/name as the terminal leaf below its evidenced parent. An identical canonical PART in another real EPC occurrence may have its own leaf in that other occurrence path without creating another canonical PART.
- **Multiple PART candidates / search hits:** render all required matching paths and their ancestor branches in the same deduplicated hierarchy, with matching PARTs as clickable terminal leaves. Do not guess a selected PART or expand unrelated non-matching descendants. `PART / Image / Status` remains in its no-selection/context state until the user selects one PART, while exact single-result resolution may select its PART under the established Part Search contract.
- **Selection change and direct URLs:** whether entry is a click, identifier/free-text result, or `?tree=<id>` deep link, restore root index plus the full selected path; do not render only the clicked local subtree. Where PART and occurrence/tree context are known, preserve both across navigation and direct links without substituting a label for identity.
- **Unavailable evidence:** if the API has no root index, complete ancestry, or reliable parent/occurrence relationship, expose that part of the hierarchy as unavailable. Never manufacture an ancestor, attach a PART to a guessed branch, or treat a missing tree link as missing PART.

### Visual hierarchy and selected state

Use genuinely nested lists or equivalent accessible `tree` semantics with stable keys. Indent each child level by a modest, consistent increment so siblings align and ancestry is immediately legible. Font weight is strongest for root categories, somewhat lighter for intermediate branches, and normal for deeper branches/PART leaves. **Underline only the active node's text** (category or PART) and expose that selection through appropriate accessible state; hover and keyboard focus remain separately discernible. The appearance must not flatten the hierarchy into equal-weight, equal-indent rounded rows or repeat root labels for every matching path. Retain the independent internal tree scroll region in the desktop shell and usable reflow on narrow viewports.

### Coordination with #875 Search Results (proposed)

The tree and right-hand Search Results PN/name list are **two views of the same canonical PART candidates and one shared active PART selection**. Occurrence-first filtering still determines surviving source paths before deriving distinct canonical result rows. Preserve one real terminal leaf for each evidenced occurrence path and only one right-hand row per canonical PART; do not duplicate a canonical PART because it appears in several diagrams or model contexts.

- Selecting a **tree PART leaf** sets the active canonical PART **and its specific verified source occurrence/path**, when present. It updates the centre PART detail, Location, right-hand result-row selected state and evidence-backed Applicable Models.
- Selecting a **right-hand result row** sets the same canonical PART selection and updates relevant tree paths; if several verified occurrences exist, do not guess which leaf/path is active or show occurrence-specific location, diagram-item or VIN fitment until that context is chosen.
- The Parts Tree keeps the root index visible throughout, combines shared ancestors once by stable node identity and expands the latest genuinely selected leaf path. Search hits with several source paths remain visible without underlining several different leaves as one active occurrence.
- A result-row **bookmark checkbox** is visible but **disabled** in the current layout/shared-selection increment; no storage or simulated save behavior is implemented. A later activated bookmark must remain separate from row/leaf selection and never change selected PART, tree expansion, stock constraints or fitment.
- A result row or tree leaf that lacks a verified source relationship must not acquire invented ancestry or positive applicability. Show missing context as `unavailable`, distinct from search `no_match`.

## Clickable node navigation and tree entry path
- Every visible tree node that has a stable `part_tree_node.id` is rendered as a real hyperlink. A styled text node or JavaScript-only click target is not sufficient.
- The hyperlink target preserves the selected tree-node identity so the same catalogue context can be opened directly or reloaded. The current runtime uses `?tree=<part_tree_node.id>`; the broader URL-state design may later be generalized by #583 without changing tree-node identity.
- Human-readable labels are presentation/source data, never tree-node identity. A node without a stable identity remains non-clickable rather than receiving an invented target.
- Selecting a tree node enters browse mode over that node and its descendants using the approved `part_tree_part` browse relationship. This yields canonical PART candidates; it does not create PART identities and does not evaluate vehicle applicability.
- Tree browsing returns direct child nodes so navigation may continue deeper without rebuilding a parallel tree model.
- Selecting a PART candidate from tree browse returns to the existing canonical PART-resolution flow. Search-originated and tree-originated PART detail therefore converge on the same shared PART-selection state, selected occurrence when verified, right-hand Applicable Models, centre Location and single PART/Image/Status contracts.
- The selected tree context remains visible while candidate PARTs are presented. Navigating to an ancestor or descendant changes navigation context only; it never mutates canonical PART identity.

## Tree browse API contract
```text
PartsTreeBrowseRequest
  selected_node_id
  stock_only?              # optional public availability constraint when supported

PartsTreeBrowseResult
  state                    # resolved | empty
  selected_node
  main_levels[] / roots[]  # first-level index retained across selection, when source supplies it
  path[]                   # stable node ids + labels, root -> selected node (complete ancestry)
  children[]               # direct child nodes with stable ids
  parts[]                  # distinct canonical PART candidates below selected subtree
  part_leaf_context[]?     # evidenced PART-to-node/occurrence relationships for tree placement
  unavailable/error information
```

The existing PART-resolution response keeps `path[]` label compatibility and additionally supplies stable node identity for every path segment when available, so presentation can emit genuine node hyperlinks.

The fields above are logical read-contract requirements, not a mandate for a new table or one specific endpoint shape. If current `/api/vieps/tree` or PART-resolution payloads omit root index or evidenced PART-leaf placement, extend or compose approved reads before claiming the corresponding UI behavior; never reconstruct source identities from label strings.

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
Cover a root index retained after deep click/direct URL, complete root-to-active-leaf ancestry, progressive immediate-child expansion, two paths with shared ancestors rendered once, equal labels on distinct stable source nodes kept distinct, a selected PART terminal leaf, several matching PARTs without a default selection, one canonical PART in multiple EPC contexts, stable sibling ordering, unavailable root/path/placement evidence, indentation/weight/underline behavior, and viewport scrolling. Add #875 fixtures for one canonical PART represented by several real tree occurrence leaves but one right-hand result row, consistent selection from either surface, no guessed occurrence from a multi-path result row, and disabled current-phase bookmark checkbox (later activation tested separately). Preserve current `main` fixture identifiers such as `firtree1` / `firtree2` as non-numbered fixture identifiers, not Jaguar part numbers.

## Viewport and language
Long tree content scrolls internally in the fitted #616 desktop shell. Catalogue labels may come from independently selected Parts/catalogue-data language under #620; surrounding UI controls follow #554. Both must tolerate variable-length text.

## Acceptance criteria
- [ ] Persistent first-level/root index and complete root-to-latest-selected-leaf expansion are defined, including direct URL restoration.
- [ ] Shared ancestors are rendered once by stable node identity without merging distinct source-qualified nodes.
- [ ] Selected branch reveals immediate children; unrelated deeper descendants stay collapsed.
- [ ] Depth indentation, stronger root typography, and underlined single active selection are defined.
- [ ] Resolved and multiple matching PARTs occupy selectable terminal leaves under evidenced paths; the separate proposed #875 right-hand Search Results panel deduplicates by canonical PART, and the centre Main View never presents multiple PARTs.
- [ ] Tree-leaf and result-row selection synchronize one canonical PART without guessing a multi-occurrence row's active path.
- [ ] Current layout shows labelled disabled bookmark checkboxes, with no effect on tree selection, filters, stock or applicability; bookmark activation remains a later increment.
- [ ] Tree identity and PART vs occurrence/context semantics remain separate.
- [ ] Selected-item and expand/collapse behavior are defined.
- [ ] Stable tree nodes are real hyperlinks and direct-load tree context is defined.
- [ ] Tree-node browsing resolves canonical PART candidates through existing browse relationships and converges on the normal PART-resolution flow.
- [ ] Multiple EPC occurrences do not duplicate canonical identity.
- [ ] Missing tree context is explicit and distinct from not-found.
- [ ] Empty-search stock browsing is conditional on an approved contract.
- [ ] Main-branch deterministic fixtures remain semantically intact.
- [ ] Viewport and UI-vs-Parts language boundaries are preserved.
