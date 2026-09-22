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

- keep the first-level/root category index visible where supplied by the read contract, including after a deep branch or PART leaf is selected;
- expand the complete root-to-latest-selected-category/occurrence/PART-leaf path within that **same** tree, rather than replacing the index with a clicked subtree or a series of isolated paths;
- merge common ancestors by stable tree-node identity so each branch appears once at its correct depth; preserve legitimately distinct source-qualified contexts even when their labels are equal;
- show the selected category's available immediate children while leaving unrelated deeper descendants collapsed unless they are themselves relevant to the selected path or active search results;
- show matching or resolved canonical PARTs as selectable terminal **leaves under their evidenced catalogue branches**; do not present multiple PARTs in a separate Main View list under the current approved #870 contract;
- use modest incremental indentation and progressively stronger font weight toward the root; underline the **one active category or PART leaf**, rather than marking every ancestor or repeated path as selected;
- keep the tree as a scrolling permanent left region below the Concept-11 branding/instructions header block.

`show only relevant path(s)` in the SVG means relevant descendant paths are the ones expanded/emphasized. It does **not** mean replacing the main-level index with one isolated path.

## Empty-search / browse state
Initial load without a deep link, explicit search clearing and empty/whitespace-only submission enter the same root browse state: available first-level/root categories remain visible, descendants are collapsed, and no category, occurrence or PART is selected or underlined. Clear removes previous query candidates, match highlights and selected-path expansion; it must not leave the permanent tree at a no-selection placeholder when roots are available.

The complete event, URL, stock-filter and request-invalidation contract is defined in [Part Search](../SPEC/UI_Part_Search.md#empty-search-and-clear-transition). An empty input while browsing a selected category does not alone mean the user has cleared that category; an explicit clear or empty submit does.

Root reads may be fetched or restored from valid data for the current stock constraint and source language. Only the latest state may update the tree, contextual regions, status, URL and loading indicators. Initial load, clear, empty submit and empty-search Availability refresh share these observable outcomes:

- **Loading:** clear obsolete selection/context immediately and show current root loading without collapsing the permanent shell.
- **Roots available:** display the evidenced first-level/root index collapsed, with no active selection; never auto-select a PART from root candidates.
- **Verified empty:** communicate an empty browse result without inventing roots or calling it a failed PART search.
- **Stock-filtered empty:** where supported filtering removes otherwise available candidates, use the established `stock_filtered_empty` semantics; do not claim the catalogue itself is empty.
- **Unavailable/unsupported:** missing root evidence or unsupported stock browsing remains explicit; it is not no PART, zero stock or a confirmed empty catalogue.
- **Error:** show the current browse failure distinctly from unavailable/empty and finish current loading; an obsolete request must not overwrite a newer state.

Concept-11 permits a supported stock constraint to narrow roots and Model Ranges only through approved canonical PART/catalogue/fitment relationships. Preserve the current stock setting through clear; do not silently disable it or simulate quality filtering. Valid browse-derived Model Ranges are filter context, not residual selected-PART facts.

UI locale changes preserve root/category browse state, expansion, stable selection and stock setting even when no PART is selected. Parts/catalogue-language changes use the selected source tree and preserve context only through evidenced identity/mapping; see [Part Search language switching](../SPEC/UI_Part_Search.md#language-switching-in-browse-mode).

## Selection and expansion
- Resolved occurrence/item is visibly selected.
- Selection exposes stable occurrence/item identity to Main View.
- Tree selection never mutates canonical PART identity.
- Expand/collapse is UI state only.
- Multiple valid occurrences remain distinguishable.
- Tree context coordinates with Model Ranges, Location, Suitability and PART/Image/Status without creating another tree model.

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

## Clickable node navigation and tree entry path
- Every visible tree node that has a stable `part_tree_node.id` is rendered as a real hyperlink. A styled text node or JavaScript-only click target is not sufficient.
- The hyperlink target preserves the selected tree-node identity so the same catalogue context can be opened directly or reloaded. The current runtime uses `?tree=<part_tree_node.id>`; the broader URL-state design may later be generalized by #583 without changing tree-node identity.
- Human-readable labels are presentation/source data, never tree-node identity. A node without a stable identity remains non-clickable rather than receiving an invented target.
- Selecting a tree node enters browse mode over that node and its descendants using the approved `part_tree_part` browse relationship. This yields canonical PART candidates; it does not create PART identities and does not evaluate vehicle applicability.
- Tree browsing returns direct child nodes so navigation may continue deeper without rebuilding a parallel tree model.
- Selecting a PART candidate from tree browse returns to the existing canonical PART-resolution flow. Search-originated and tree-originated PART detail therefore converge on the same downstream Parts Tree, Range, Location, Suitability and PART/Image/Status contracts.
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
Cover a root index retained after deep click/direct URL, complete root-to-active-leaf ancestry, progressive immediate-child expansion, two paths with shared ancestors rendered once, equal labels on distinct stable source nodes kept distinct, a selected PART terminal leaf, several matching PARTs without a default selection, one canonical PART in multiple EPC contexts, stable sibling ordering, unavailable root/path/placement evidence, indentation/weight/underline behavior, and viewport scrolling. Preserve current `main` fixture identifiers such as `firtree1` / `firtree2` as non-numbered fixture identifiers, not Jaguar part numbers.

## Viewport and language
Long tree content scrolls internally in the fitted #616 desktop shell. Catalogue labels may come from independently selected Parts/catalogue-data language under #620; surrounding UI controls follow #554. Both must tolerate variable-length text.

## Acceptance criteria
- [ ] Persistent first-level/root index and complete root-to-latest-selected-leaf expansion are defined, including direct URL restoration.
- [ ] Shared ancestors are rendered once by stable node identity without merging distinct source-qualified nodes.
- [ ] Selected branch reveals immediate children; unrelated deeper descendants stay collapsed.
- [ ] Depth indentation, stronger root typography, and underlined single active selection are defined.
- [ ] Resolved and multiple matching PARTs occupy selectable terminal leaves under evidenced paths, with no separate multi-PART Main View.
- [ ] Tree identity and PART vs occurrence/context semantics remain separate.
- [ ] Selected-item and expand/collapse behavior are defined.
- [ ] Stable tree nodes are real hyperlinks and direct-load tree context is defined.
- [ ] Tree-node browsing resolves canonical PART candidates through existing browse relationships and converges on the normal PART-resolution flow.
- [ ] Multiple EPC occurrences do not duplicate canonical identity.
- [ ] Missing tree context is explicit and distinct from not-found.
- [ ] Empty-search stock browsing is conditional on an approved contract.
- [ ] Main-branch deterministic fixtures remain semantically intact.
- [ ] Viewport and UI-vs-Parts language boundaries are preserved.
- [ ] Clear/empty submit restores evidenced collapsed roots with no active selection and preserves the supported stock constraint.
- [ ] Root loading/empty/stock-filtered-empty/unavailable/error outcomes and stale-response protection satisfy the Part Search regression matrix.
- [ ] UI-language switching preserves browse state without a selected PART; source-language changes preserve only evidenced mapped context.
