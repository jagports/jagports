# VIEPS CSS Kit Selection — 2nd Round

## Status

Second-round CSS/UI-kit comparison specification and visual evidence record for Issue #632.

The Product Owner has reviewed the four contestant concepts and selected **Tailwind CSS** as the preferred / best-looking post-MVP visual direction.

This round supersedes the assumption that the current Pico-styled live VIEPS page is a target to refine. The current live page is retained only as a **negative visual baseline** showing the present Pico result that the Product Owner is not satisfied with.

Post-MVP implementation is tracked separately in Issue #642 so this specification does not expand the current reduced MVP gate.

## Design authorities

The second-round comparison uses separate authorities for layout, style, colour and Parts Tree interaction:

1. **High-level layout / element placement** — `VIEPS UI-Concept-1.svg` is the primary placement authority. It defines the permanent Concept View-1 regions and their relationships, not exact pixel dimensions.
2. **Visual style / polish** — `UI_Visualization_AI_Prompt.png` is the principal reference for the desired modern, polished visual language.
3. **Jagports colour direction** — repository `docs/*.png` images define the preferred colour/theme mood rather than any framework's default brand palette.
4. **Parts Tree interaction/context** — JEPC screenshots merged in PR #631 plus `UI_Specs_Parts_Tree.md` inform hierarchy presentation and interaction.
5. **Current live Pico rendering** — comparison-only evidence of the current styling to move away from; it is not a source for target content placement or information architecture.

## Concept View-1 layout contract

All contestant concepts preserve the same VIEPS high-level information architecture:

- Parts Tree on the left.
- Part-number search at the top of the centre area.
- Whole-car top and side location views in the centre.
- PART details and one selected part/exploded-image area in the centre.
- Selected-range suitability / variations / qualifiers below the part details.
- Applicable model ranges on the right.
- No invented global application menu.

The concepts may differ in component styling, density, spacing, visual hierarchy and framework-native interaction patterns. The purpose is to show what each contestant can produce naturally and with relatively little custom fighting against its defaults, not to force all four mockups to look identical.

## JEPC study and Parts Tree conclusions

Original JEPC is catalogue-navigation-led. Its hierarchy preserves model IDs and parent relationships, then catalogue/category/item structure and item decision trees. The screenshots imported by PR #631 show progressive model/range selection, child selection, breadcrumb context and an expanded fitment/Parts Tree view.

VIEPS deliberately differs from JEPC:

- VIEPS is primarily **part-number-search-led**, not a reproduction of the complete JEPC application.
- VIEPS normalizes JEPC model families into Jagports vehicle Ranges rather than exposing raw JEPC hierarchy as the primary product taxonomy.
- Canonical PART identity is separate from EPC occurrence/context; one PART may have multiple valid tree paths without duplicating PART identity.
- Concept View-1 normally shows the **relevant path(s)** and selected context rather than forcing the user through an unrelated full catalogue tree.
- Main View, vehicle location, part/exploded image, suitable ranges and qualifiers remain coordinated with the selected tree occurrence.

Useful JEPC interaction ideas to carry into VIEPS:

- obvious indentation and parent/child hierarchy;
- clear expand/collapse affordances;
- strongly highlighted selected row/context;
- visible ancestry/path context comparable to JEPC breadcrumbs;
- enough supplied siblings/context to explain where the selected item sits while keeping the relevant path dominant;
- fitment/qualifier context associated with the selected occurrence rather than silently changing canonical PART identity;
- persistent context when moving between selected range, tree occurrence and diagram/detail content.

VIEPS should **not** copy JEPC's full dense catalogue browser by default. The VIEPS contract remains authoritative: relevant path, ancestors, optional supplied siblings, selected occurrence and explicit unavailable state.

## Contestants and generated concept evidence

Four comparable concept screenshots were generated and saved for this round:

- `CSS-Kit-2ndRound-Pico-CSS.jpg`
- `CSS-Kit-2ndRound-Bulma.jpg`
- `CSS-Kit-2ndRound-Bootstrap.jpg`
- `CSS-Kit-2ndRound-Tailwind-CSS.jpg`

The initial generated repository copies were partial / too low-resolution for durable comparison use. The Product Owner replaced them in PR #640 with improved repository reference images. The images remain design exploration evidence; they are not literal claims that every decorative detail, vehicle image, label or value is already implemented or verified production data.

### Pico CSS concept

Natural strengths:

- low markup/class overhead;
- semantic forms and controls;
- simple cards and grid;
- straightforward CSS-variable theming;
- low migration cost from the current VIEPS frontend.

Limitation for this target: the desired AI-concept polish requires a larger VIEPS-specific styling layer because Pico intentionally supplies a restrained visual system rather than a rich dashboard component vocabulary.

### Bulma concept

Natural strengths:

- panels, cards, menus and helpers fit a multi-region application layout well;
- stronger visual grouping than Pico with less custom CSS;
- CSS variables / themes / colour palettes support Jagports branding;
- Parts Tree and dense hierarchical navigation can be expressed cleanly with menu/panel patterns.

Trade-off: migration requires more framework-specific class structure than Pico, and a custom Jagports theme is still required to avoid a generic framework appearance.

### Bootstrap concept

Natural strengths:

- mature responsive grid;
- extensive utilities and component library;
- strong form, table, badge, list-group, card and navigation primitives;
- easy implementation of dense fitment tables and contextual controls.

Trade-off: Bootstrap's default visual conventions are recognizable and can dominate the target unless deliberately themed; component breadth may also be more framework than VIEPS needs.

### Tailwind CSS concept

Natural strengths:

- highest freedom to reproduce the Concept View-1 geometry and AI-reference visual style;
- design-token driven Jagports colours, spacing, typography, shadows and radii;
- easy bespoke Parts Tree selection, badges, contextual panels and image-led composition;
- least pressure to look like the framework's default demos.

Trade-off: larger utility-class footprint and a stronger design-system responsibility for the VIEPS implementation; it is less of a pre-styled component kit than Pico/Bulma/Bootstrap.

## Evaluation criteria

The four concepts and implementation implications were evaluated against:

1. visual similarity to the desired AI-reference style;
2. natural support for the Concept View-1 three-column workspace;
3. Parts Tree clarity and dense hierarchical navigation;
4. theming/design-token flexibility for Jagports colours;
5. amount of custom CSS/classes needed to reach the target;
6. responsiveness and viewport-fit behaviour;
7. migration effort from the existing VIEPS frontend;
8. maintainability and unnecessary framework complexity.

## Second-round result

The Product Owner's selection after reviewing the contestant concepts is:

1. **Tailwind CSS — selected/preferred.** Best-looking result and strongest fit to the custom Jagports / AI-reference visual direction.
2. **Bulma — strongest classic CSS-framework alternative.**
3. **Bootstrap — highly capable for structured/dense UI but requires deliberate re-theming.**
4. **Pico CSS — lowest migration cost but least naturally aligned with the richer target visual direction.**

Tailwind is therefore the approved **post-MVP implementation direction** for the VIEPS visual system. This selection does not automatically approve every decorative element shown in the concept image; the approved VIEPS information architecture, data contracts and verified source information remain authoritative.

## Post-MVP implementation boundary

Implementation is tracked in Issue #642 and should:

- replace the current Pico-based styling after MVP rather than expanding the current MVP gate;
- preserve semantic IDs/data hooks and functional behavior;
- use Tailwind as a VIEPS design-system/utility layer rather than copying a generic Tailwind demo;
- establish reusable Jagports design tokens/components for colours, typography, spacing, elevation, cards, controls, Parts Tree states, status badges, vehicle-location views, part details and suitability tables;
- preserve or improve responsive and viewport-fit behavior;
- retain the Concept View-1 layout authority and JEPC-informed Parts Tree interaction lessons.

## References

- Issue #632 — second-round CSS kit re-selection work record
- PR #640 — second-round reference images and this specification
- Issue #642 — post-MVP Tailwind implementation follow-up
- PR #631 — JEPC screenshots for reference use
- PR #586 — JEPC data-structure findings
- Issue #468 — controlling Concept View-1 specification
- PR #485 / `UI_Specs_Parts_Tree.md` — Parts Tree contract
- #565 / PR #577 — previous Pico selection and implementation
- `UI_Specs.md`
- `UI_Visualization_AI_Prompt.md`
- `VIEPS UI-Concept-1.svg`
- repository `docs/*.png` visual theme references
