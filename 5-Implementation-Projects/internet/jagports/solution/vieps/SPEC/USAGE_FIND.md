# VIEPS Find — usage and Chromium visual verification

## Purpose

This file defines the end-user Find usage path and the deployed Chromium visual-verification procedure for **Find**.

Shared Search behavior remains in [`SPEC_SEARCH.md`](SPEC_SEARCH.md). Find-specific behavior remains in [`SPEC_SEARCH_FIND.md`](SPEC_SEARCH_FIND.md).

For #634, GitHub Actions Chromium screenshots replace the earlier requirement for repeated manual/human browser acceptance.

## Deployed test targets

Run the visual verification against both deployed modes:

| Mode | URL | Data |
|---|---|---|
| Normal | `https://vieps.parts-5ec.workers.dev/` | Current imported parts data only |
| TEST | `https://vieps.parts-5ec.workers.dev/?TEST=1` | Synthetic TEST fixtures only |

The two modes remain separate evidence sources. TEST fixture values must never be presented as production Jaguar facts.

## Required screenshot sizes

For #634, capture searched views only at:

- **1368 × 768**
- **2560 × 1440 (2K)**

No tablet, mobile, 900 px, 320 px or 220 px screenshot is required for #634 acceptance.

## Find views to render

Chromium should render representative deployed states for each data mode:

1. deterministic PART identifier result;
2. limited PART-description free-text result;
3. multiple-match / no-auto-selection result when the mode contains such a case;
4. Stock-only result or Stock-filtered-empty state;
5. genuine no-match;
6. cleared/reset Find state;
7. the corresponding Search Results, Parts Tree and selected-PART presentation visible in those states.

Normal mode uses only current imported data. TEST mode uses only TEST fixtures.

If current real data cannot produce a particular optional state, record that limitation instead of substituting TEST evidence into the Normal run.

## GitHub Actions execution

Use the existing **VIEPS browser acceptance evidence** workflow on `main`.

For a deployed #634 acceptance run:

1. dispatch the workflow on the merged `main` revision;
2. use the repository-default deployed URL unless an explicitly approved deployed URL override is required;
3. let Chromium operate the deployed Find UI;
4. preserve the generated PNG artifact;
5. keep Normal and TEST screenshots distinguishable by filename.

No manual browser interaction is required after the workflow starts.

## Visual acceptance

The PNGs are the #634 visual acceptance record.

Acceptance is based on the actual rendered searched views matching the specified VIEPS page structure and expected visible Find/result state.

Do not add a separate computed-CSS geometry framework or pixel-difference framework for #634.

A local preview, PR-local fixture page or GitHub Pages rendering does not replace the deployed Worker screenshots.

## Evidence record

Record with the workflow evidence:

- tested `main` SHA;
- deployed URL;
- Normal or TEST mode;
- viewport size;
- rendered Find state;
- PNG filename/artifact;
- any real-data limitation that prevented an optional state from being rendered.

The automated screenshots are sufficient #634 UI acceptance evidence when they show the specified deployed views and results.
