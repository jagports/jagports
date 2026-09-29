# VIEPS Search — FIT / dynamic JEPC description specification

## Scope

This specification defines how **dynamic JEPC descriptions** become source-qualified, normalized FIT / Variations filter values in VIEPS.

A dynamic description is imported catalogue text attached to a specific JEPC source record, occurrence and/or tree path. This specification covers only those dynamic descriptions and their normalized mappings. Other catalogue applicability semantics remain outside this file and are defined by the canonical PART model in [MODEL_PARTS.md](MODEL_PARTS.md).

[Search](SPEC_SEARCH.md) owns the combined candidate evaluator and cross-filter transitions. This file owns only the dynamic-description mapping and its centre-top FIT / Variations presentation contract.

## Dynamic description identity

Raw JEPC description text is evidence, not identity by itself. Every retained dynamic description must remain source-qualified by the available source identity, including:

- JEPC namespace and dataset/revision;
- source language;
- original text;
- record/group/value locator when present;
- model/category/item/tree-path or occurrence scope when present;
- source/provenance reference and verification state.

Equal displayed text from different source records remains distinct source evidence until an explicit mapping establishes a shared normalized meaning. Description text must never be used to reconstruct source identity or tree identity.

Source-language trees may differ structurally. Preserve language-qualified source paths independently unless deterministic equivalence is established.

### LH / RH descriptions

For the JEPC dynamic descriptions **LH** and **RH**:

- `LH` means **Left Hand / Left Side**;
- `RH` means **Right Hand / Right Side**.

These description meanings are distinct from vehicle steering descriptions such as `LHD` and `RHD`. A dynamic `LH`/`RH` description must not be reinterpreted as left-hand-drive/right-hand-drive steering unless separate source evidence explicitly establishes that relationship.

## Normalized categories and source-description mapping

A normalized FIT category is a stable VIEPS domain identifier backed by `fit_dimension` and `fit_dimension_value`. It is not a JEPC navigation category and is not identified by display text.

A normalized value may enter the public FIT filter only through a source-qualified dynamic-description mapping.

| Relation | Required purpose |
|---|---|
| `fit_source_description` | Immutable JEPC dynamic-description identity and provenance: namespace, dataset/revision, language, raw text, locator, source identifiers and occurrence/tree scope. |
| `fit_mapping_revision` | Append-only mapping revision from one source description to one normalized dimension/value, with evidence, verification state and effective/retired state. |
| `fit_dimension_label` and `fit_dimension_value_label` | Language-qualified domain names for stable normalized IDs. UI chrome uses EN/FI i18next resources; imported JEPC wording remains catalogue data. |

Mappings are additive and versioned. Reprocessing may add or retire a mapping revision but must not rewrite prior source-description evidence in place.

An unmapped, ambiguous or conflicting dynamic description remains retained source evidence and does not become a public normalized filter value.

There is no executable vehicle-applicability condition inferred from description text alone. Mapping a description to a normalized FIT category/value makes that description usable as a filter facet; it does not convert unrelated static JEPC applicability data into a dynamic description.

## Public FIT facet read boundary

The public FIT filter reads published normalized categories/values together with their source-description references, occurrence/tree scope and language metadata.

The read path must:

1. use source-qualified mapping identities rather than raw text equality;
2. filter occurrences first, then project the normalized description-derived facets represented by the surviving candidate universe;
3. keep descriptions from different occurrences distinct unless their verified mapping says they share the same normalized value;
4. return `unavailable` when required source relation, language metadata or occurrence scope is missing;
5. never infer semantics beyond the verified mapping of the dynamic description.

Facet counts and selectable values come from the surviving candidate universe under the active Search constraints. A selected zero-result value remains visible so it can be cleared, but it is not offered as an additional choice.

## FIT / Filter dual mode

The centre-top FIT / Variations control initially has no checked values. Group selection and coordinated filtering are specified in [Search](SPEC_SEARCH.md#coordinated-searchfilter-interaction).

1. **Browse or multiple candidates:** show only published normalized values backed by mapped dynamic descriptions in the current search/browse candidates. Visibility indicates availability; it does not activate a filter. At most one competing value per normalized group is active. Different groups combine with AND.
2. **Single selected PART/context:** the control becomes read-only and shows the mapped dynamic-description values evidenced for the selected occurrence/context. Unknown or unmapped descriptions remain unavailable rather than becoming positive FIT claims.

The FIT control exposes only normalized values backed by mapped dynamic descriptions.

## Admin mapping contract

The Admin mapping surface may map one retained source-qualified dynamic JEPC description to a normalized FIT category/value.

The editor must display enough source context to distinguish same-looking descriptions from different JEPC records. A mapping operation must retain its source-description identity and create a new mapping revision rather than overwriting prior interpretation evidence.

Only verified, active mappings are publishable to the normal FIT read path. Retired mappings remain auditable but are not offered for new filtering.

## Request and response contract

```text
FitDescriptionRequest
  canonical_part_id?
  occurrence_context_id?
  approved_browse_filters?
  normalized_description_filters[]?   # none active initially; at most one per competing group

FitDescriptionResult
  state                               # available / unavailable / error
  available_dimensions[]
    dimension_id
    localized_label
    values[]
      value_id
      localized_label
      source_description_refs[]
  selected_occurrence_descriptions[]?
  provenance/unavailable information
```

The contract exposes normalized description-derived facets and their provenance. It does not expose static JEPC applicability rows as dynamic FIT values.

## Synthetic TEST data

TEST fixtures must be source-shaped **dynamic-description** records only. Each fixture description carries a synthetic namespace, dataset/revision, language, locator/scope and normalized mapping identity.

Fixtures validate the dynamic-description read shape, grouping, mapping revisions, localization and unavailable states. They are never verified Jaguar facts and must not leak into normal parts-data responses.

The fixture vocabulary must not be treated as a hard-coded production list. Normal mode obtains available values only from verified imported dynamic descriptions and their published mappings.

## Information document link

The optional `(i)` control may link to verified contextual documentation when a valid source/document relationship exists. The link is evidence-driven and does not itself create or prove a FIT value.

## Viewport and language

The centre-top FIT panel is separate from the right-hand Applicable Models panel. Its grouped labelled controls are keyboard accessible, respect the fitted desktop shell and reflow on narrow layouts.

UI EN/FI translation resources and source Parts-language metadata remain independent. Imported JEPC descriptions remain in their catalogue/source language; normalized domain labels use the configured UI-language resources.
