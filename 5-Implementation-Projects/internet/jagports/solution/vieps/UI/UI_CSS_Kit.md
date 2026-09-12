# VIEPS MVP CSS / UI-kit selection

## Scope

This record implements the CSS/UI-kit selection requirement of Issue #565. The styling layer must improve visual hierarchy and responsive presentation without changing VIEPS domain semantics, API contracts or the Concept View-1 information architecture.

## Candidates

| Candidate | MVP integration | Markup impact | JavaScript requirement | Responsive/layout support | Assessment |
| --- | --- | --- | --- | --- | --- |
| Pico CSS | Low | Low; class-light semantic HTML remains usable | None | Built-in responsive forms/typography plus small VIEPS-specific grid CSS | Best fit for the current small static Worker frontend. |
| Bulma | Moderate | Moderate; more component/layout classes would be added throughout the page | None | Strong layout/component utilities | Good option, but more markup churn than needed for the present MVP shell. |
| Bootstrap | Moderate to high | Moderate; component classes would become part of most UI markup | Optional JS for interactive components | Mature responsive grid/components | More capability than the current styling-only requirement needs and a larger integration surface. |

## Selected option

**Pico CSS, major version 2**, loaded as a stylesheet from jsDelivr.

### Rationale

- The current VIEPS frontend is plain semantic HTML plus a small JavaScript renderer, so a class-light CSS layer avoids replacing the application structure or introducing a frontend framework.
- Pico requires no JavaScript runtime and therefore does not interfere with the existing Worker/API behavior.
- Its form, typography and basic component defaults provide a consistent baseline while keeping VIEPS-specific layout in a small local stylesheet.
- The integration works with Cloudflare Workers Static Assets because it is ordinary browser CSS; no build step is introduced.
- Responsive behavior can be handled with the kit defaults plus explicit VIEPS breakpoints for the three-column Concept View-1 layout.

## Integration boundary

The frontend loads:

1. Pico CSS v2 from jsDelivr for the general visual system.
2. `public/vieps.css` for VIEPS-specific panel, Concept View-1 grid, card, badge, image and narrow-screen rules.

The local stylesheet is deliberately limited to VIEPS-specific presentation. It does not encode fitment, PART, Parts Tree, image/diagram or availability decisions.

If the external stylesheet cannot be loaded, semantic HTML and the local stylesheet still leave the page usable; VIEPS functional behavior remains in `app.js` and the Worker/API.

## Visual target

The implementation uses the EMF placement authority and the aligned ASCII map in UI_Specs.md, with the #564 visualization guiding typography and panel treatment:

- tree on the left and model ranges on the right;
- search, vehicle top/side regions, combined part details/image and detailed suitability stacked in the centre;
- a complete visible shell before Search, with explicit empty/unavailable states;
- one image/diagram displayed at a time and variations filtered by selected range;
- consistent panel/card treatment, spacing and typography;
- explicit unavailable states remain visually distinct without inventing data;
- the layout collapses to two columns and then one column at narrower widths.

## Non-semantic rule

Styling must never infer, fabricate or transform VIEPS business data. Existing element IDs and rendering contracts remain the functional boundary; the CSS/UI kit changes presentation only.
