# VIEPS UI — Concept View-1 MVP implementation specification

## Status

This document defines the implementation-level UI element and behaviour contract for the minimum demonstrable VIEPS Concept View-1 MVP.

**Controlling UI specification:** #468 — VIEPS UI / Concept View-1 — Updated MVP UI specification

**Implementation parent:** #368 — VIEPS UI / Implement MVP Web UI

**Visual source artifact:** PR #467 — UI concept 1

**Concept UI image:** `5-Implementation-Projects/internet/cloudflare/jagports/vieps/VIEPS UI/VIEPS UI-Concept-1.emf`

**Baseline UI specification:** `UI_Specs.md`

## MVP flow

```text
Part-number entry
        ↓
PART resolution
        ↓
PART → Parts Tree branch
        ↓
PART → all suitable vehicle Ranges
        ↓
Range → all suitable variations
        ↓
PART → Part Image
        ↓
End-to-end MVP acceptance test
```

This is the implementation boundary for the minimum demonstrable Concept View-1 UI. Older broader requirements in #368 remain useful architectural context, but diagram hotspots, whole-car location search, stock, supersession and Classic indicators are not required to complete this minimum flow unless needed to support one of these six steps.

## Concept View-1 UI elements

### Search / Part-number entry

The page provides a persistent part-number entry control at the top of the Concept View-1 layout.

Required behaviour:

- accept a Jaguar part-number identifier;
- normalize only according to the approved search contract;
- submit the search without leaving the Concept View-1 page;
- show empty, invalid, not-found, resolved and error states explicitly;
- preserve the entered value separately from the canonical resolved value where required for reporting.

### PART result context

A successful search establishes a canonical PART result and the relevant occurrence/context needed by the remaining UI.

The UI must distinguish the canonical PART identity from an EPC occurrence. Multiple occurrences must not create duplicate catalogue PART identities.

### Parts Tree area

The left-side Parts Tree area shows the relevant category/branch for the resolved PART.

Required behaviour:

- render the resolved branch from the approved data contract;
- preserve parent/child hierarchy;
- expand the path needed to expose the resolved part;
- highlight the selected part/occurrence;
- keep presentation state separate from the underlying Parts Data Model.

### Suitability Model Ranges area

The right-side Suitability Model Ranges area shows all vehicle Ranges/models for which the resolved PART is actually suitable.

Required behaviour:

- list applicable Ranges/models returned by the approved applicability contract;
- exclude non-matching Ranges from the suitable-result list rather than presenting them as suitable;
- preserve enough context to select a Range for the variation view;
- distinguish a missing applicability result from a confirmed non-match.

### Variations area / Range selection

Selecting a suitable Range exposes the applicable variations/qualifiers for that PART within the selected Range.

Required behaviour:

- show only variations supported by the applicability data;
- preserve the selected PART and Range context;
- display relevant qualifiers when they materially determine applicability;
- distinguish no applicable variation from unavailable variation data;
- never infer unresolved qualifier meanings in the UI.

### Main View / Part Image

The central Main View is the primary visual area of Concept View-1.

For the minimum MVP it must be capable of showing the PART image associated with the resolved item when verified image data exists.

Required behaviour:

- show the resolved PART image or an explicitly unavailable state;
- keep the image associated with the selected PART/context;
- avoid substituting an unrelated image merely because one is available;
- preserve a stable visual container so later verified diagram/location views can be integrated without changing the Concept View-1 information architecture.

Verified diagram/hotspot rendering and vehicle-location mapping are later capabilities. Their absence must not prevent the Part Image step from being implemented where suitable image data exists.

## Concept View-1 visual reference and ASCII UI map

**Concept UI image source:** `5-Implementation-Projects/internet/cloudflare/jagports/vieps/VIEPS UI/VIEPS UI-Concept-1.emf`

**Visual source PR:** [PR #467 — UI concept 1](https://github.com/jagports/jagports/pull/467)

The following map is the normative text representation of the minimum demonstrable Concept View-1 UI derived from the Concept UI image. It describes UI element placement and relationships; it is not intended to define pixel dimensions.

```text
+------------------------------------------------------------------------------------------------+
| VIEPS — Concept View-1                                                                         |
|                                                                                                |
|  [ Jaguar part number __________________________ ] [ Search ]                                 |
|  Search status:  [empty / invalid / not found / resolved / error]                              |
+------------------------------------------------------------------------------------------------+
|                                                                                                |
|  PART / identity                 Parts Tree branch                    Main View / Part Image   |
|  +-------------------------+     +--------------------------------+    +---------------------+ |
|  | Canonical PART          |     | Category                         |    |                     | |
|  | Part number / desc.     |     |   └─ Parent                      |    |    PART IMAGE       | |
|  | Raw number (if any)     |     |      └─ Selected PART            |    |                     | |
|  | Verification / source   |     |         └─ occurrence/context    |    |  or                 | |
|  |                         |     |                                  |    |  [Image unavailable] | |
|  | EPC occurrence context  |     +--------------------------------+    |                     | |
|  +-------------------------+                                             +---------------------+ |
|                                                                                                |
+------------------------------------------------------------------------------------------------+
|  Suitability Model Ranges                       |  Selected Range / Variations               |
|  +----------------------------------------------+---------------------------------------------+|
|  | All suitable Ranges/models                   |  Range: [selected suitable Range]          ||
|  |                                              |                                             ||
|  |  [Range A]                                   |  Applicable variations / qualifiers:       ||
|  |  [Range B]                                   |                                             ||
|  |  [Range C]                                   |   [Variation 1]  [Qualifier]              ||
|  |  ...                                         |   [Variation 2]  [Qualifier]              ||
|  |                                              |   ...                                       ||
|  |  [No applicability / unavailable state]     |  [No variations / unavailable state]      ||
|  +----------------------------------------------+---------------------------------------------+|
+------------------------------------------------------------------------------------------------+

Interaction / identity flow:

  Search
    │
    ▼
  canonical PART
    ├──────────────► Parts Tree branch / selected occurrence
    ├──────────────► all suitable Ranges ──► selected Range ──► variations / qualifiers
    └──────────────► Part Image in Main View
```

The ASCII map establishes the six MVP information areas and their relationships:

1. Part-number entry and search status;
2. resolved PART identity/context;
3. Parts Tree branch;
4. all suitable vehicle Ranges;
5. selected Range and applicable variations/qualifiers;
6. Main View containing the verified Part Image or an explicit unavailable state.

The map must remain consistent with the six-step MVP flow and must not imply that post-MVP entry paths are part of the current acceptance boundary.

### Previous implementation lineage by UI element

The following references identify earlier specification, domain-model, API and browser-UI work that has participated in establishing each Concept View-1 element. These links provide implementation lineage; they do not by themselves mark the current #541–#546 work complete.

| Concept View-1 element | Participating Issues | Participating PRs |
|---|---|---|
| Part-number entry / Search status | [#280](https://github.com/jagports/jagports/issues/280), [#354](https://github.com/jagports/jagports/issues/354), [#435](https://github.com/jagports/jagports/issues/435), [#472](https://github.com/jagports/jagports/issues/472), [#499](https://github.com/jagports/jagports/issues/499), [#500](https://github.com/jagports/jagports/issues/500), [#541](https://github.com/jagports/jagports/issues/541) | [#281](https://github.com/jagports/jagports/pull/281), [#433](https://github.com/jagports/jagports/pull/433), [#504](https://github.com/jagports/jagports/pull/504), [#505](https://github.com/jagports/jagports/pull/505), [#547](https://github.com/jagports/jagports/pull/547) |
| Canonical PART / identity and EPC occurrence context | [#354](https://github.com/jagports/jagports/issues/354), [#435](https://github.com/jagports/jagports/issues/435), [#525](https://github.com/jagports/jagports/issues/525), [#472](https://github.com/jagports/jagports/issues/472), [#499](https://github.com/jagports/jagports/issues/499), [#541](https://github.com/jagports/jagports/issues/541) | [#433](https://github.com/jagports/jagports/pull/433), [#526](https://github.com/jagports/jagports/pull/526), [#504](https://github.com/jagports/jagports/pull/504), [#547](https://github.com/jagports/jagports/pull/547) |
| Parts Tree branch / selected occurrence | [#360](https://github.com/jagports/jagports/issues/360), [#368](https://github.com/jagports/jagports/issues/368), [#474](https://github.com/jagports/jagports/issues/474), [#499](https://github.com/jagports/jagports/issues/499), [#500](https://github.com/jagports/jagports/issues/500), [#542](https://github.com/jagports/jagports/issues/542) | [#467](https://github.com/jagports/jagports/pull/467), [#469](https://github.com/jagports/jagports/pull/469), [#526](https://github.com/jagports/jagports/pull/526), [#504](https://github.com/jagports/jagports/pull/504), [#505](https://github.com/jagports/jagports/pull/505) |
| Suitability Model Ranges | [#354](https://github.com/jagports/jagports/issues/354), [#477](https://github.com/jagports/jagports/issues/477), [#529](https://github.com/jagports/jagports/issues/529), [#499](https://github.com/jagports/jagports/issues/499), [#500](https://github.com/jagports/jagports/issues/500), [#543](https://github.com/jagports/jagports/issues/543) | [#469](https://github.com/jagports/jagports/pull/469), [#530](https://github.com/jagports/jagports/pull/530), [#535](https://github.com/jagports/jagports/pull/535), [#504](https://github.com/jagports/jagports/pull/504), [#505](https://github.com/jagports/jagports/pull/505) |
| Selected Range / Variations and qualifiers | [#354](https://github.com/jagports/jagports/issues/354), [#477](https://github.com/jagports/jagports/issues/477), [#478](https://github.com/jagports/jagports/issues/478), [#499](https://github.com/jagports/jagports/issues/499), [#500](https://github.com/jagports/jagports/issues/500), [#544](https://github.com/jagports/jagports/issues/544) | [#469](https://github.com/jagports/jagports/pull/469), [#530](https://github.com/jagports/jagports/pull/530), [#535](https://github.com/jagports/jagports/pull/535), [#504](https://github.com/jagports/jagports/pull/504), [#505](https://github.com/jagports/jagports/pull/505) |
| Main View / Part Image | [#354](https://github.com/jagports/jagports/issues/354), [#475](https://github.com/jagports/jagports/issues/475), [#527](https://github.com/jagports/jagports/issues/527), [#499](https://github.com/jagports/jagports/issues/499), [#500](https://github.com/jagports/jagports/issues/500), [#545](https://github.com/jagports/jagports/issues/545) | [#467](https://github.com/jagports/jagports/pull/467), [#469](https://github.com/jagports/jagports/pull/469), [#528](https://github.com/jagports/jagports/pull/528), [#536](https://github.com/jagports/jagports/pull/536), [#504](https://github.com/jagports/jagports/pull/504), [#505](https://github.com/jagports/jagports/pull/505) |
| Coordinated end-to-end Concept View-1 flow | [#368](https://github.com/jagports/jagports/issues/368), [#468](https://github.com/jagports/jagports/issues/468), [#483](https://github.com/jagports/jagports/issues/483), [#496](https://github.com/jagports/jagports/issues/496), [#501](https://github.com/jagports/jagports/issues/501), [#546](https://github.com/jagports/jagports/issues/546) | [#467](https://github.com/jagports/jagports/pull/467), [#469](https://github.com/jagports/jagports/pull/469), [#504](https://github.com/jagports/jagports/pull/504), [#505](https://github.com/jagports/jagports/pull/505), [#506](https://github.com/jagports/jagports/pull/506), [#540](https://github.com/jagports/jagports/pull/540) |

## Cross-element interaction

The six implementation steps form one coordinated workflow, not six independent screens.

```text
Search control
    ↓
Canonical PART
    ├── Parts Tree branch
    ├── Suitable Ranges
    │      └── Selected Range → variations
    └── Part Image
```

The selected PART remains the central identity while tree, Range, variation and image views change their contextual presentation.

The UI must not duplicate domain resolution logic between components. Components consume the approved API/data contracts.

## Implementation sequence

1. **Part-number entry → PART resolution**
   Establish the page shell, search control, deterministic fixture read contract, canonical PART resolution and explicit result states.

2. **PART → Parts Tree branch**
   Feed the resolved PART/occurrence context into the Parts Tree and render the relevant hierarchy and selected path.

3. **PART → all suitable vehicle Ranges**
   Resolve applicability and populate the Suitability Model Ranges area with only actual matches.

4. **Range → all suitable variations**
   Use the selected Range plus PART context to display the supported variations/qualifiers.

5. **PART → Part Image**
   Resolve and display the appropriate PART image, with an explicit unavailable state when no verified image exists.

6. **End-to-end MVP acceptance test**
   Verify the complete flow from entered part number through PART, Parts Tree, suitable Ranges, variations and Part Image, including principal failure/unavailable paths.

Each step must leave the application working and must include automated tests appropriate to its scope.

## Deterministic fixture contract

The implementation may use deterministic representative fixture data before all production/imported data is available.

Fixtures must be explicitly test data and must cover enough relationships to demonstrate the complete six-step flow. Fixture values must not be represented as verified Jaguar catalogue facts.

The UI/API contract must remain stable when imported JEPC/Jagports data replaces fixtures.

## Unavailable-data rules

- Missing image data is an explicit unavailable state, not a fabricated image.
- Missing Range applicability is not a positive fitment result.
- Missing variation data is not equivalent to no variation.
- Missing Parts Tree context is not equivalent to no PART.
- Unresolved source semantics must remain unresolved rather than being guessed by presentation code.

## Out of minimum MVP scope

The following are not required to complete the six-step minimum Concept View-1 flow:

- alternative entry points from Vehicle Range, Part Location On Car or Parts Tree Context;
- final JEPC Flash hotspot coordinate conversion;
- whole-car vehicle-zone mapping;
- operational stock integration;
- supersession/current-part indicators;
- Jaguar Classic indicators;
- third-party parts search.

These may remain represented by stable placeholders or explicit unavailable states where the Concept View-1 shell requires them.

## Traceability

**Controlling specification**

#468 — VIEPS UI / Concept View-1 — Updated MVP UI specification

**Implementation parent**

#368 — VIEPS UI / Implement MVP Web UI

**Visual source artifact**

PR #467 — UI concept 1

**Concept UI image**

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/VIEPS UI/VIEPS UI-Concept-1.emf`

**Existing durable UI contracts**

- `UI_Specs.md`
- `UI_Specs_Part_Search.md`
- `UI_Specs_Parts_Tree.md`
- `UI_Specs_Suitability_Ranges.md`
- `UI_Specs_Fitment.md`
- `UI_Specs_Non_Numbered_Parts.md`
- `UI_Specs_Unavailable_Data.md`
- `UI_Specs_MVP_Vertical_Slice.md`

## Definition of done

The minimum Concept View-1 implementation is complete when the six work-list steps can be demonstrated as one deterministic, tested workflow:

```text
enter Jaguar part number
→ resolve canonical PART
→ show PART's Parts Tree branch
→ show all suitable vehicle Ranges
→ select a Range and show all suitable variations
→ show the PART image when available
→ pass end-to-end acceptance testing
```

No fabricated catalogue, fitment, variation or image information may be used to make the flow appear complete.