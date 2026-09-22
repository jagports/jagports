# VIEPS UI — Complete ASCII desktop layout (#875)

**Status:** Product Owner-approved target desktop geometry, subject to independent review in PR #883.  
**Owning UI layout specification:** [`../UI/UI_Specs.md`](../UI/UI_Specs.md#normative-concept-11v1-complete-desktop-page-map-875).  
**Concept asset:** [`../UI_CONCEPTS/Concept-11v1.svg`](../UI_CONCEPTS/Concept-11v1.svg).  
**Implementation:** Initial layout/shared-selection increment under #875. The previously merged Concept-11 remains the current implementation until this target is delivered.

## Complete page ASCII map

This is the complete, verbatim Product Owner-supplied page map. The existing map in the owning `UI/UI_Specs.md` is the controlling UI geometry; the two copies **must remain identical**. This standalone file makes the entire map directly discoverable from `SPEC/` and from Part Search and the other component specifications.

```text
┌────────────────────────┬──────────────────────────────────────────────────┬────────────────────────┐
│ Logo / instructions    │ Banner / header                                  │                        │
│ UI + Parts languages   │                                                  │                        │
├────────────────────────┼──────────────────────────────────────────────────┼────────────────────────┤
│ Availability           │ VIN                                               │ Search                 │
│ stock quality list     │ [input / range picker]                            │ [PN / free text]       │
│                        │ Filter                                            │                        │
│ Parts Tree             │ [suitability / variations]                        │ Search Results PART    │
│ scrollable             ├───────────────────────┬──────────────────────────┤ List                   │
│ root → branch → leaf   │ Location at car       │ Selected PART            │ scrollable             │
│ expanded path only     │                       │ status / part name       │ row = select PART      │
│ PART leafs selectable  │                       │ exploded diagram/image   │ checkbox = bookmark    │
│                        │                       │                          ├────────────────────────┤
│                        │                       │                          │ Applicable Models      │
│                        │                       │                          │ fixture list / fit     │
│                        │                       │                          │ filter checkboxes      │
│                        │                       │                          │ scrollable             │
└────────────────────────┴───────────────────────┴──────────────────────────┴────────────────────────┘
```

## Region ownership and current implementation

| Position | Region | Behavior |
|---|---|---|
| Header left | Logo / instructions; UI + Parts languages | Reserve the region; activate language controls only through approved #554/#620 contracts. |
| Header centre | Banner / header | Preserve the full-width centre header slot shown in the map. |
| Left top | Availability | Approved operational stock-quality controls; unsupported choices remain unavailable, never simulated. |
| Left below | Parts Tree | Independent scrolling, persistent root index, complete expanded root-to-selected-leaf ancestry, stable links, deduplicated shared ancestors, selectable PART leaves (#873). |
| Centre top | VIN; Filter | VIN input/supported range picker and normalized suitability/variations (#641), only when backed by approved data. |
| Centre lower left | Location at car | One evidence-backed location canvas or explicit unavailable state. |
| Centre lower right | Selected PART | One canonical PART with verified name/status and image/diagram where available; never a candidate list. |
| Right top | Search | Part-number/deterministic-identifier-first search with reduced-MVP free-text fallback. |
| Right middle | Search Results PART List | Independent scrolling; one selectable PN/name row per distinct canonical PART, synchronized with tree selection. |
| Right bottom | Applicable Models | Independent scrolling; unselected browse index of 13 exact requested fixture labels or verified fit for selected PART/context. |

## Approved #875 phase split

- **Implement now:** this page layout, three independent scroll regions, right Search Results rows, one synchronized canonical selected PART shared with the left Parts Tree, and non-fabricated available Applicable Models browse/fit display.
- **Bookmarks later:** display a separately labelled checkbox per result row **disabled** until an approved later storage/activation contract is implemented; clicking/keyboard interaction must not fake saving or alter PART selection.
- **Advanced model filtering later:** the approved future behavior is selecting multiple normalized ranges with **ANY (OR)** matches. Until that query/read path works, filter checkboxes remain disabled; unknown fitment cannot qualify as a positive match.
- **Fixture browse labels, in order:** Jaguar Accessories; Daimler Limousine; E-Pace; E-Type; F-Pace; F-Type; S-Type; X-Type; XE Range; XF Range; XJ Range; XJS; XK Range. This fixture index is not proof of any PART's fitment.

## Coordination and boundaries

Search-result row selection and a Parts Tree leaf select the **same canonical PART**. A tree leaf may also select a source-qualified occurrence; a result row representing several occurrences must not guess an active occurrence or fabricate occurrence-specific location or fitment.

Clearing Search preserves the stock-filter setting, invalidates stale requests, clears selected PART/occurrence and old Search Results selection, removes stale `part`/`tree` URL parameters and restores evidenced collapsed roots. The right results panel returns to its empty/browse state; Applicable Models returns to an available browse index, not stale selected-PART fitment. The event and regression contract remains in [`UI_Part_Search.md`](UI_Part_Search.md#empty-search-and-clear-transition).

This file is a visual-reference specification, **not** a parallel schema, search evaluator, fitment evaluator, or new acceptance gate for the existing reduced MVP. Implementation and acceptance details remain in the owning component specifications.
