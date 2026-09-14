# VIEPS CSS / UI-kit selection

## Purpose

This is the durable VIEPS CSS/UI-kit selection record. It consolidates the original MVP Pico CSS decision and the second-round re-selection work from Issue #632 / PR #640 instead of creating a parallel CSS-kit specification file.

Styling may change presentation, layout, hierarchy and responsive behavior, but it must not change VIEPS domain semantics, API/data contracts, canonical PART identity, EPC occurrence/context semantics, or verified source information.

## Decision history

### First-round MVP decision

The original MVP selection under Issue #565 chose **Pico CSS v2** because the VIEPS frontend was a small static/semantic HTML application where low markup churn, no JavaScript dependency and a simple stylesheet integration were useful.

The MVP frontend used:

1. Pico CSS v2 as the general visual baseline.
2. `public/vieps.css` for VIEPS-specific layout and presentation.

That choice remains useful implementation history, but the resulting visual treatment became the negative baseline for the second-round review: it was functional and low-cost, but too restrained for the desired VIEPS visual identity.

### Second-round re-selection

Issue #632 and PR #640 compared four contestants using generated VIEPS concept screens:

- Pico CSS
- Bulma
- Bootstrap
- Tailwind CSS

The Product Owner reviewed the four concepts and selected **Tailwind CSS** as the preferred / best-looking direction.

The initial generated repository copies were partial / too low-resolution for durable comparison use. The Product Owner replaced them in PR #640 with improved repository reference images:

- `../UI_CONCEPTS/CSS-Kit-2ndRound-Pico-CSS.jpg`
- `../UI_CONCEPTS/CSS-Kit-2ndRound-Bulma.jpg`
- `../UI_CONCEPTS/CSS-Kit-2ndRound-Bootstrap.jpg`
- `../UI_CONCEPTS/CSS-Kit-2ndRound-Tailwind-CSS.jpg`

These images are design exploration evidence. They do not automatically approve every decorative element, vehicle image, label, value or generated feature shown in a concept.

## Current selected option

**Tailwind CSS**, implemented locally for VIEPS.

The implementation path is:

`Current Pico UI → local Tailwind CSS → Concept-11 layout/visual target`

There is no local-Pico intermediate phase.

Implementation is tracked in Issue #642.

## Current visual/layout authority

The current implementation target is **Concept-11**, introduced by PR #645:

`../UI_CONCEPTS/VIEPS UI-Concept-11.svg`

Concept-11 is the current layout/visual target where element ordering, composition or functionality differs from the earlier Concept View-1 material.

Earlier `VIEPS UI-Concept-1.svg` remains useful historical evidence for the second-round comparison, but it is no longer the controlling target where Concept-11 changes the layout or interaction model.

Where Concept-11 is illustrative rather than explicit, the durable VIEPS UI/data specifications remain authoritative. No unsupported behavior or data should be invented solely from the concept image.

## Visual style and colour direction

The implementation should combine:

1. **Concept-11** for the current target layout/visual composition.
2. `../UI_CONCEPTS/UI_Visualization_AI_Prompt.png` for the desired modern, polished visual language.
3. Repository `docs/*.png` imagery for Jagports colour/theme direction rather than framework-default branding.
4. Current VIEPS functional/data specifications for behavior and data meaning.
5. Current Pico live rendering only as historical/negative comparison evidence; it is not a target content/layout source.

## JEPC study and Parts Tree conclusions

The original JEPC interface is catalogue-navigation-led and differs substantially from VIEPS, but its hierarchy/navigation behavior provides useful Parts Tree lessons.

VIEPS should carry forward:

- obvious indentation and parent/child hierarchy;
- clear expand/collapse affordances;
- strongly highlighted selected occurrence/context;
- visible ancestry/path context comparable to breadcrumbs;
- enough surrounding sibling/context information to explain where the selected occurrence sits while keeping the relevant path dominant;
- fitment/qualifier context visually associated with the selected occurrence rather than changing canonical PART identity;
- persistent context when moving among selected range, tree occurrence, diagram/location and detail content.

VIEPS must **not** copy JEPC's full dense legacy catalogue browser by default. Canonical PART identity remains separate from EPC occurrence/context, and one PART may have multiple valid tree paths.

## Contestant assessment

| Candidate | Natural strengths | Main trade-off for VIEPS | Second-round result |
| --- | --- | --- | --- |
| Pico CSS | Low markup/class overhead, semantic forms, simple grid/cards, low migration cost | Rich AI-concept polish requires a substantial VIEPS-specific styling layer | Not selected |
| Bulma | Strong panels/cards/menus/helpers, good dense application grouping, CSS-only | More framework-specific markup and still needs a Jagports theme | Strongest classic-framework alternative |
| Bootstrap | Mature grid, utilities, forms, tables, badges and dense UI primitives | Recognizable defaults and larger framework surface require deliberate re-theming | Capable alternative |
| Tailwind CSS | Highest freedom for bespoke layout, tokens, spacing, typography, shadows, hierarchy and Parts Tree states | Requires deliberate VIEPS design-system/component discipline | **Selected** |

## Why Tailwind was selected

Tailwind provided the strongest route to the desired VIEPS visual result because it imposes less default component appearance and makes it easier to reproduce a custom Jagports design system.

The selected direction should support:

- Jagports-specific design tokens;
- Concept-11 geometry and composition;
- polished panel/card surfaces;
- dense but clear Parts Tree presentation;
- selected/expanded/context states without fighting framework defaults;
- suitability/range tables and compact data presentation;
- vehicle-location and image-led content;
- responsive/viewport-fit behavior;
- reusable component/style abstractions instead of uncontrolled one-off utilities.

## Tailwind implementation boundary

Tailwind must be local to the VIEPS project/build:

- install and pin Tailwind and its CLI as project dependencies;
- compile a VIEPS-owned static stylesheet;
- do not load Tailwind from a CDN, remote stylesheet, remote script or other runtime third-party dependency;
- remove the current external Pico dependency as part of the migration;
- preserve application behavior, API/data contracts, semantic IDs and data hooks used by the renderer/tests;
- keep the build/deployment compatible with the Cloudflare Worker/static-asset structure;
- preserve or improve responsive and viewport-fit behavior;
- keep existing functional tests passing and add suitable layout/styling regression coverage.

## Reusable VIEPS design-system areas

The Tailwind implementation should define reusable VIEPS abstractions/tokens for at least:

- Jagports colour palette;
- typography hierarchy;
- spacing scale;
- panel/card surfaces;
- borders, radius and elevation/shadows;
- search controls and buttons;
- Parts Tree branch, expansion, ancestry and selected-occurrence states;
- badges/status/verification indicators;
- vehicle-location views;
- PART details and part/exploded-image areas;
- suitability/range presentation;
- responsive and viewport-fit behavior.

Avoid scattering arbitrary utility combinations throughout the codebase where a reusable VIEPS component/style abstraction is clearer and more maintainable.

## Non-semantic rule

Styling must never infer, fabricate or transform VIEPS business data. Visual concepts are not data authorities. Existing UI/data specifications remain the functional boundary.

## References

- Issue #565 — original Pico CSS selection
- PR #577 — original Pico implementation history
- Issue #632 — second-round CSS-kit comparison and selection
- PR #640 — second-round reference images and consolidation into this file
- Issue #642 — Tailwind migration / Concept-11 implementation
- PR #645 — Concept-11 target visual
- `../UI_CONCEPTS/VIEPS UI-Concept-11.svg` — current layout/visual target
- `../UI_CONCEPTS/VIEPS UI-Concept-1.svg` — historical second-round comparison reference
- `../UI_CONCEPTS/UI_Visualization_AI_Prompt.png` — visual-style direction
- `UI_Specs.md` — VIEPS UI behavior/information architecture specification
- `UI_Specs_Parts_Tree.md` — durable Parts Tree contract
- PR #631 — JEPC screenshots used as Parts Tree interaction/context reference
- PR #586 / `SPEC_JEPC_DATA.md` — JEPC data-structure findings
- Issue #615 — viewport-fit requirement
