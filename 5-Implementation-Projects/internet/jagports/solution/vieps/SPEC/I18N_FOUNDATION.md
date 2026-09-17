# VIEPS i18n Foundation

## Purpose

This document defines the base repository foundation for VIEPS UI internationalization.

It implements the first repository-facing step of the architecture selected in Issue #554 without pre-implementing the stricter resource-format, governance, and validation contract owned by Issue #676.

## Architecture ownership

- **#554** owns the overall VIEPS UI i18n architecture, runtime locale behavior, fallback behavior, and TMS direction.
- **#678** owns repository/application implementation in staged rounds. The first round creates the shared resource foundation defined here.
- **#676** owns the detailed translation-resource format, deterministic ordering, governance, and structural/plural validation applied after this foundation exists.
- **#679** owns deployment and operation of the Weblate service and its live Git integration.
- **#620** separately owns multilingual JEPC catalogue/source data. Catalogue language is not UI translation identity.

## Canonical resource location

VIEPS UI translation resources are stored under:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

The initial resource set contains:

```text
i18n/
├── README.md
├── en.json
└── fi.json
```

`en.json` is the source/base UI resource. `fi.json` is the initial second locale resource.

Both files use the same semantic key hierarchy for the UI concepts represented in this foundation.

## Initial content boundary

The foundation starts with generic VIEPS UI presentation concepts already present in the application, such as Search and Availability.

Feature-owned translation content is not part of the base resource seed. In particular, stock-quality A-E labels/descriptions remain stock-domain presentation content and are added by the relevant stock/i18n implementation after the shared foundation exists.

This keeps the base resource layer neutral and reusable across VIEPS features.

## Data versus presentation

Translation resources contain human-visible UI presentation text.

Language-independent domain/source identifiers remain data and are not translated identities. Examples include:

- Jaguar part numbers;
- VINs;
- EPC/JEPC identifiers;
- model and Range identifiers;
- normalized stock-quality codes;
- JEPC source-language catalogue values where modeled as source data.

## Runtime boundary

This foundation round creates repository resources only. It does not yet change production VIEPS runtime behavior.

The later #678 runtime round will integrate the selected i18next-compatible localization layer, locale selection, fallback, document language metadata, plural behavior, and representative localized rendering.

## Weblate boundary

Repository translation resources remain authoritative inputs to the VIEPS build.

Weblate is an authoring/review integration selected by #554 and deployed under #679. It must not become a production request/runtime dependency.

This foundation does not configure or deploy Weblate.

## #676 boundary

This foundation intentionally does not define or enforce:

- recursive sibling-key ordering;
- repository-wide i18n governance rules;
- locale structural validation;
- plural-family validation;
- CI enforcement for the resource contract.

Those details belong to #676 and are applied on top of this base resource set.

## Sequencing

```text
#554 architecture
        ↓
#678 Round 1: base repository resources
        ↓
#676 resource format / governance / validation
        ↓
#678 later runtime integration
        ↓
#679 live Weblate deployment/integration
```

The live Weblate deployment may be prepared independently, but its repository component must ultimately consume the canonical resource contract established by #554/#676 rather than inventing a parallel resource layout.
