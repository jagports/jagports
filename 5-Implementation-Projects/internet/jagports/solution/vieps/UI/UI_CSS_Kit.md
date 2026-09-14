# VIEPS CSS / UI-kit selection

## Status

This record documents the current VIEPS styling direction after the second-round CSS-kit evaluation and the Concept-11 decision.

The earlier MVP choice of Pico CSS is historical. The selected post-MVP/current visual implementation path is **local Tailwind CSS**, implemented under Issue #642 / PR #647.

## Selected option

**Tailwind CSS 4.1.13**, used as a local build-time dependency.

The browser must load only the VIEPS-owned generated stylesheet. No Tailwind CDN, remote stylesheet, remote script or other runtime third-party Tailwind dependency is part of the VIEPS UI contract.

## Design authorities

The Tailwind implementation has two separate visual authorities:

1. **Layout/content relationship authority**
   - `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/VIEPS UI-Concept-11.svg`
   - reviewed through PR #645.

2. **Tailwind style/theme authority**
   - `5-Implementation-Projects/internet/jagports/solution/vieps/UI_CONCEPTS/CSS-Kit-2ndRound-Tailwind-CSS.jpg`
   - selected from the second-round comparison under #632 / PR #640.

Supporting direction remains:

- `UI_Visualization_AI_Prompt.png` for visual treatment;
- repository `docs/*.png` images for Jagports colour/theme direction;
- JEPC screenshots/specifications for Parts Tree interaction and hierarchy lessons, without copying the full legacy JEPC application;
- the old live Pico rendering only as historical/negative comparison evidence.

## Concept-11 relationship

Concept-11 supersedes the old Concept View-1 placement map for the Tailwind visual implementation while preserving the same domain and data contracts.

The authoritative text equivalent is maintained in `UI_Specs.md` as the **Concept-11 ASCII map**.

Key placement relationships are:

- Parts Tree occupies the persistent left column;
- Search and stock-availability filtering share the upper centre workspace;
- vehicle/location context appears below the search strip;
- Suitability Model Ranges occupy the upper/right column as fit/check controls;
- detailed suitability/variation filtering appears in the centre workspace;
- part identity, warning/status, Classic/supersession presentation and the selected part image/diagram occupy the lower centre workspace.

Concept artwork may illustrate controls before their data contracts are implemented. Such controls must remain disabled/unavailable or omitted until supported by approved data/API contracts; the UI must not fabricate behaviour.

## Tailwind implementation principles

- Use reusable VIEPS tokens/components for colours, typography, spacing, panels, controls, tree selection, suitability, status and visual regions.
- Preserve semantic IDs/data hooks and domain/API boundaries.
- Preserve PR #616 viewport-fit behaviour: normal desktop use has a fitted shell with scrolling inside permanent regions; narrower layouts may use normal page scrolling.
- Keep the Parts Tree selected/relevant path strongly visible.
- Allow variable-length localized UI text and consume the approved #554 i18n contract before final approval/merge.
- Keep UI locale independent from JEPC catalogue-data language as specified by #620.
- Do not encode fitment, PART identity, stock, availability or other business decisions in CSS.

## Local build and versioned source record

The VIEPS Worker build pins:

- `tailwindcss` `4.1.13`;
- `@tailwindcss/cli` `4.1.13`.

A versioned source/documentation record is retained under:

`6-Development/libraries/css/tailwind/4.1.13/`

Future Tailwind upgrades must create a new version directory rather than overwrite the retained release record.

## Historical decision

Pico CSS v2 was selected for the earlier small MVP shell because it minimized markup/build changes. That choice is superseded for the Concept-11 visual implementation. Pico must not remain as a parallel runtime styling path.
