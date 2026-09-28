# VIEPS i18n Foundation

## Purpose

This document defines the canonical repository and runtime boundaries for VIEPS UI internationalization.

## Canonical resource location

VIEPS UI translation resources are stored under:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

The resource set contains a shared semantic key hierarchy across supported UI locales. `en.json` is the source/base UI resource and `fi.json` provides Finnish UI presentation values.

Translation-resource identity is the semantic key, not the rendered text.

## Resource contract

Translation resources contain human-visible VIEPS UI presentation text.

Feature/domain presentation values may be maintained with their owning domain while still using the shared i18n contract. Stable domain identifiers must not become locale-specific identities.

Language-independent identifiers remain data. Examples include:

- Jaguar part numbers;
- VINs;
- EPC/JEPC identifiers;
- model and Range identifiers;
- normalized stock-quality codes;
- stable normalized FIT dimension/value identifiers;
- JEPC source-language catalogue values represented as source data.

Locale resources must preserve compatible semantic structure so the same UI concept resolves by key rather than by matching rendered text.

## Runtime contract

VIEPS runtime localization uses the repository translation resources as authoritative build/runtime inputs.

Locale selection, fallback, document-language metadata, plural behavior and localized rendering must operate on the shared semantic resource keys. Missing translations must follow the defined fallback behavior rather than changing domain identity or source data.

## Translation authoring boundary

External translation-management tooling may author or review repository translation resources, but it is not a production request/runtime dependency.

Repository resources remain the application contract regardless of the authoring tool used.

## Data versus presentation

UI locale and catalogue-data language are separate concerns.

- UI strings come from the VIEPS i18n resource contract.
- Imported JEPC descriptions remain source-language catalogue data.
- Semantic mappings may connect imported descriptions to normalized domain identities without rewriting either the source description or the UI translation identity.

Do not translate or normalize a source-data identifier merely to obtain a UI label.

## JEPC catalogue-language structure

Multilingual JEPC catalogue data is source data, not VIEPS UI translation-resource identity.

Do not assume that every JEPC language uses one identical catalogue/tree structure with only translated description strings. Source models/languages may differ structurally.

The JEPC importer preserves language-qualified source tree nodes, parentage, ordering, descriptions and occurrence paths where the source differs. Canonical PART identity remains shared where source identity proves it is the same PART.

Cross-language source-node or occurrence equivalence is derived data and must be established deterministically. Equal text, equal position or a shared part number alone must not force two source tree nodes to become one identity.
