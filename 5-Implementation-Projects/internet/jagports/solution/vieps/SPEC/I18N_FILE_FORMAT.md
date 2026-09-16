# VIEPS i18n File Format

## Authority

This document is the canonical repository authority for the file format and deterministic ordering of VIEPS UI translation resources.

Translation resources are stored under:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

The broader runtime internationalization architecture, locale selection, fallback behavior, Translation Management System integration, and application behavior remain separate concerns.

## Resource layout

Use one JSON file per locale:

```text
i18n/
├── en.json
├── fi.json
└── <locale>.json
```

`en.json` is the current monolingual base/source-language resource.

All locale files must use the same translation-key hierarchy for the same UI concepts.

## JSON format

Use Weblate-compatible nested JSON.

For Weblate, configure the component file format explicitly as:

```text
JSON nested structure file
json-nested
```

Do not rely on automatic JSON-format detection when configuring the Weblate component.

The nested object path is the translation key. For example:

```text
stock.quality.A.label
stock.quality.A.long_description
stock.quality.A.short_description
```

## Alphabetical key ordering

All sibling JSON object keys in VIEPS translation-resource files must be stored in ascending alphabetical order.

This requirement applies recursively at every JSON object level.

Example:

```json
{
  "stock": {
    "quality": {
      "A": {
        "label": "...",
        "long_description": "...",
        "short_description": "..."
      },
      "B": {
        "label": "...",
        "long_description": "...",
        "short_description": "..."
      },
      "C": {
        "label": "...",
        "long_description": "...",
        "short_description": "..."
      },
      "D": {
        "label": "...",
        "long_description": "...",
        "short_description": "..."
      },
      "E": {
        "label": "...",
        "long_description": "...",
        "short_description": "..."
      },
      "unclassified": {
        "label": "...",
        "long_description": "...",
        "short_description": "..."
      }
    }
  }
}
```

The same key hierarchy and deterministic ordering must be preserved across locale files.

Ordering is repository structure only. It must not change translation-key identity or translated values.

## Key and value boundary

Translation keys identify presentation concepts. Localized values are presentation text.

Domain identifiers remain data and are not translated identities. Examples include:

- Jaguar part numbers;
- VINs;
- model and Range identifiers;
- normalized stock-quality codes;
- JEPC source identifiers and source-language catalogue data where separately modeled.

## Locale parity and structural consistency

Required locale resources must remain structurally compatible with `en.json`.

For a translation key present in the source resource, locale resources must preserve the same nested path and compatible JSON structure.

A locale must not invent another key path for the same UI concept.

## Validation

Repository validation must reject at least:

- invalid JSON;
- sibling object keys that are not alphabetically ordered;
- missing or mismatched required locale-resource structure;
- structural differences from the source resource for the same translation hierarchy.

Validation should distinguish translation-value changes from translation-key/schema changes.

## Weblate component contract

The intended component configuration is:

```text
File mask:
5-Implementation-Projects/internet/jagports/solution/vieps/i18n/*.json

Monolingual base language file:
5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json

File format:
JSON nested structure file

Format identifier:
json-nested
```

The Translation Management System is an authoring/review integration. It is not a production runtime dependency.

## Contributor and agent rule

Any human, agent, formatter, CI process, or TMS-related repository change that creates or modifies VIEPS locale JSON must preserve this file-format contract and recursive alphabetical key ordering.

The `i18n/` directory guidance references this document rather than restating the rule, so this specification remains the single authority for this scoped repository convention.
