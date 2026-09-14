# VIEPS Range fixtures

## Purpose

This file records deterministic vehicle Range/model fixtures for VIEPS while authoritative imported JEPC range/model data is not yet available.

These fixtures are temporary product knowledge for search, suitability and UI testing. They must remain distinguishable from imported source data and may later be replaced or refined by verified JEPC and Jaguar/factory evidence without changing the conceptual separation between Range and model/variant values.

## XK Range

The current strong fixture taxonomy is:

```text
XK Range
├── XK
├── XK8
├── XKR
└── XKR 100
```

| Range | Model / market name | Fixture rule |
|---|---|---|
| `XK Range` | `XK` | Later XK market/model name within the XK Range. |
| `XK Range` | `XK8` | Model/market-name value within the XK Range. |
| `XK Range` | `XKR` | Model/market-name value within the XK Range. |
| `XK Range` | `XKR 100` | Rare model/market-name value; evidence-only identification. |

## Semantic rules

- `XK Range` is the Range.
- `XK`, `XK8`, `XKR`, and `XKR 100` are sibling model/market-name values within that Range.
- `XK` is not a parent category for `XK8`, `XKR`, or `XKR 100`.
- Do not collapse the Range name and the `XK` model/market name into one value.
- `XKR 100` is very rare and must not be inferred from ordinary VIN/model logic, engine/body configuration, or generic `XKR` classification.
- Assign `XKR 100` only when explicitly supported by individual-vehicle evidence or Jaguar/factory records.
- If explicit `XKR 100` evidence is absent, do not promote an `XKR` vehicle to `XKR 100`; retain the supported value or leave the more specific identification unresolved.

## Fixture boundary

These values are intentionally strong deterministic fixtures for the period before imported JEPC model/range data is available.

They define the temporary normalized vocabulary needed by VIEPS Range/model search and suitability testing, but they do not authorize invention of unsupported vehicle identities. Imported JEPC data and verified Jaguar/factory records may extend or refine the fixture set later; provenance and evidence must remain visible when doing so.

Other applicability dimensions such as body style, steering side, engine/supercharger state, seat equipment and similar qualifiers remain separate suitability dimensions. They are not children of the Range/model hierarchy defined here.

## Traceability

This fixture knowledge contributes to Issue #361, which owns VIEPS Range/model/variant taxonomy research and representative taxonomy fixtures.
