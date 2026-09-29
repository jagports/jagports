# VIEPS Search — Find specification

## Scope

This document defines Find-specific behavior for VIEPS. Shared search/filter interaction, result-state semantics, Parts Tree behavior, FIT, VIN, Applicable Models, Stock integration and common Search contracts remain in [`SPEC_SEARCH.md`](SPEC_SEARCH.md).

This file owns only the Find-specific deterministic-identifier / limited free-text behavior and its deployed Chromium visual-acceptance requirements.

## Find resolution order

Find uses one input field.

Resolution order:

```text
Find query
  |
  +--> deterministic PART identifier lookup
  |       |
  |       `--> match -> deterministic result
  |
  `--> no deterministic candidates
          |
          v
     limited free-text fallback
          |
          +--> supported PART description/context candidates
          |
          +--> apply Stock only after candidate discovery
          |
          v
     existing Search Results / Parts Tree / selected-PART UI
```

Requirements:

- PART identifiers are evaluated before free-text.
- A deterministic candidate set prevents free-text fallback for that query.
- The limited fallback includes canonical PART description text in the current supported parts-data path.
- Description matching must not be classified as a deterministic identifier match.
- `stock_only` is applied after deterministic or free-text candidate discovery.
- If candidates existed before Stock-only filtering and none remain afterward, return `stock_filtered_empty`, not ordinary `not_found`.
- If free text resolves to multiple canonical PARTs, no PART is selected by default.
- A genuine `not_found` state is valid only after deterministic lookup and the active limited free-text fallback both produce no candidate.
- Existing Search Results, Parts Tree and selected-PART regions are reused. Find does not create a new result page or parallel UI.

Full multilingual/global free-text search remains outside this limited Find contract.

## Data-mode boundary

The deployed UI has two distinct Chromium visual-acceptance data modes:

| Mode | URL | Data authority |
|---|---|---|
| Normal | `https://vieps.parts-5ec.workers.dev/` | Current imported real parts data only |
| TEST | `https://vieps.parts-5ec.workers.dev/?TEST=1` | Synthetic TEST fixtures only |

Normal mode must not use fixture values or fixture expectations as acceptance evidence.

TEST mode must not use real imported parts data as acceptance evidence.

Both modes exercise the same Find interaction contract, but evidence from one data source must not be used to claim the other data source works.

## Deployed Chromium visual acceptance

The executable procedure is [`USAGE_FIND.md`](USAGE_FIND.md).

For #634, GitHub Actions Chromium rendering replaces the earlier repeated manual/human browser acceptance requirement.

Visual acceptance requires separate deployed evidence for:

1. Normal mode against current imported real parts data.
2. TEST=1 mode against synthetic fixtures.

Neither mode substitutes for the other.

Required screenshot viewports are only:

- **1368 × 768**
- **2560 × 1440 (2K)**

The deployed screenshots should render representative Find states for:

- deterministic PART identifier resolution;
- PART-description free-text fallback after identifier miss;
- existing Search Results / Parts Tree / selected-PART presentation;
- no default PART selection for multiple descriptive matches when such a state is available;
- Stock-only filtering after candidate discovery;
- true no-match behavior;
- Find clear/reset without stale Find result state.

For Normal mode, if current real data cannot produce a specific optional case, record that limitation rather than substituting TEST evidence or inferring production data.

For TEST mode, fixture evidence remains explicitly synthetic and must never be presented as production Jaguar facts.

No computed-CSS geometry assertion framework, screenshot pixel-diff framework or manual browser interaction is required for #634. The acceptance record is the set of deployed Chromium-rendered searched views and associated run metadata.

## Acceptance evidence

Keep Normal and TEST evidence separate. Record:

- deployed URL and mode;
- tested `main` SHA;
- viewport;
- rendered Find state;
- PNG filename/artifact;
- any real-data limitation preventing an optional state.

Local preview screenshots, PR-local fixtures and GitHub Pages rendering do not replace deployed Worker evidence.

## Boundaries

This Find-specific file does not redefine:

- global Search Index architecture;
- full multilingual/global free-text search;
- FIT semantics;
- VIN semantics;
- Applicable Models semantics;
- shared Parts Tree semantics;
- Stock eligibility rules;
- Admin or DataImporter behavior.

Those remain owned by their canonical specifications and models.
