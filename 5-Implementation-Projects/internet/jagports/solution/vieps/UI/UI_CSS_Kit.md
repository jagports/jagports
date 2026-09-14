# VIEPS CSS / UI-kit selection

## Status
This record documents the current VIEPS styling direction after the second-round CSS-kit evaluation and the Concept-11 decision.

The earlier Pico CSS choice is historical. The selected visual implementation path is **local Tailwind CSS**, implemented under #642 / PR #647.

## Selected option
**Tailwind CSS 4.1.13**, used as a local build-time dependency. The browser loads only the VIEPS-owned generated stylesheet; no Tailwind CDN/runtime third-party styling dependency is part of the contract.

## Design authorities
1. **Layout/content relationship authority**
   - `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/VIEPS UI-Concept-11.svg`
   - merged to `main` by PR #645.
2. **Tailwind style/theme authority**
   - `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/CSS-Kit-2ndRound-Tailwind-CSS.jpg`
   - selected under #632 / PR #640.

Supporting visual direction remains the AI visualization prompt, repository Jagports imagery and JEPC hierarchy/interaction references. The old Pico rendering is historical/negative comparison evidence only.

## Merged Concept-11 geometry
`UI_Specs.md` is the normative text equivalent of the merged SVG.

Desktop relationships:

```text
Branding / instructions | Search + Availability (centre/right)
Parts Tree              | Suitability Model Ranges (centre/right)
Parts Tree              | Location at car | Suitability / Filter
Parts Tree              | PART / Image / Status (centre/right)
```

Important consequences:
- Search + Availability spans the top centre/right workspace.
- Model Ranges is a distinct row spanning centre/right below Search.
- Location and Suitability are side-by-side in the middle row.
- PART / Image / Status spans the full lower centre/right workspace.
- Parts Tree remains the scrolling left region below the branding/instructions block.
- Location uses one canvas, not permanent Top/Side panels.
- The concept's `Language [UI] [Parts]` means UI locale (#554) and Parts/catalogue-data language (#620) are separate concerns.

Concept controls/sample facts must remain disabled/unavailable or absent until supported by approved contracts. Styling must never manufacture business data.

## Tailwind implementation principles
- Use reusable VIEPS tokens/components for colour, typography, spacing, panels, controls, tree selection, applicability, status and visual regions.
- Preserve semantic IDs/data hooks and API/domain boundaries.
- Preserve PR #616 viewport-fit behavior: fitted desktop shell with internal region scrolling; narrower layouts may scroll normally.
- Keep Parts Tree main-level context and selected/relevant path visually clear.
- Preserve current `main` fixture/search behavior while replacing presentation.
- Support variable-length #554 UI localization and independent #620 catalogue-data language without creating a parallel localization mechanism.
- Do not encode PART identity, fitment, stock, availability, Classic/supersession or other domain decisions in CSS.

## Local build and versioned source record
The Worker build pins `tailwindcss` and `@tailwindcss/cli` to `4.1.13`.

A versioned source/documentation record is retained under:
`6-Development/libraries/css/tailwind/4.1.13/`

Future upgrades create new version directories rather than overwriting retained releases.

## Historical decision
Pico CSS v2 was selected for the earlier small MVP shell because it minimized build/markup changes. That choice is superseded for Concept-11. Pico must not remain as a parallel runtime styling path.
