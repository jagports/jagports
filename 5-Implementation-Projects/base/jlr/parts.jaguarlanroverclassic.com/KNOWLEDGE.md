# JLR Classic Parts Website Knowledge

## Purpose

This knowledge file records reusable research knowledge for using the JLR Classic Parts website as a source for Jaguar/Land Rover catalogue part information, including supersession evidence.

## Website URL format

JLR Classic Parts catalogue product pages use the following observed URL pattern:

`https://parts.jaguarlandroverclassic.com/<part-number>-<url-slug>.html`

The part number is included at the beginning of the product-page path. The remainder is a descriptive URL slug derived from the part description.

Example:

`https://parts.jaguarlandroverclassic.com/mna7691aa-fan-warning-label.html`

Part number: `MNA7691AA`

## Supersession test/sample

The following page has been used as a JEPC supersession research/test sample:

- `MNA7691AA` — Fan Warning Label
- URL: `https://parts.jaguarlandroverclassic.com/mna7691aa-fan-warning-label.html`
- Observed replacement/superseding part: `XR847031`
- Relationship: `MNA7691AA` superseded by `XR847031`

The page is useful as a test case because the source explicitly communicates a supersession relationship. Such explicit source statements should be retained as evidence when importing or validating parts supersession knowledge.

## Data capture guidance

When recording information obtained from JLR Classic Parts, retain at minimum:

- source website/domain;
- source URL;
- source part number;
- displayed part description;
- explicitly stated superseding/replacement part number(s), when present;
- the source wording or evidence supporting the relationship;
- retrieval/discovery date where required by the implementation.

Do not infer a supersession relationship solely from a similar description, URL, availability state, or apparent compatibility. Explicit supersession statements are stronger evidence and should be distinguished from inferred interchangeability or generic cross-reference relationships.

## Known test data

| Part number | Description | Example URL | Superseded by |
|---|---|---|---|
| MNA7691AA | Fan Warning Label | `https://parts.jaguarlandroverclassic.com/mna7691aa-fan-warning-label.html` | XR847031 |

This file is intended to accumulate verified sample/test part numbers and URL-format observations as JLR Classic Parts research continues.
