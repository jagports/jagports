# VIEPS Search — FIT specification

## Scope
Define the centre-top normalized FIT / Variations filter and read-only selected-PART FIT evidence. [Search](SPEC_SEARCH.md) owns the combined candidate evaluator and filter transitions; [Ranges](SPEC_SEARCH_RANGES.md) owns the separate right-hand Applicable Models control; [VIN](SPEC_SEARCH_VIN.md) owns VIN evidence.

### Fit / Filter dual mode
The centre-top Fit / Variations filter (the normalized FIT contract) and right-bottom Applicable Models panel are distinct controls over one normalized fitment contract. The FIT filter initially has no checked values; group selection and coordinated filtering are specified in [Search](SPEC_SEARCH.md#coordinated-searchfilter-interaction--product-owner-decisions-2026-09-28).

1. **Browse or multiple candidates:** show only evidence-backed normalized FIT values represented in current search/browse candidates; initial empty-Find browse derives them from browsable PARTs. Visibility is an availability indicator, not an active selection. At most one competing value per FIT group is active: hide other values in that group while selected, restore options on clearing, combine different groups using AND and preserve selections across new Find queries. This applies equally to VIN-range, colour and other normalized FIT groups. Only source-mapped options may be offered; preserve exclusions and unknown/unavailable states.
2. **Single selected PART/context:** FIT becomes read-only; mark evidence-backed values verified for the selected PART and leave other supported options unlit. Unknown required values receive yellow unknown-evidence indicators, not positive-fit assertions. Preserve occurrence/context scope for body, steering, engine, supercharger, market, transmission, equipment and VIN boundary. FIT and range exclusion deselect the PART; Stock exclusion may retain warned detail under the coordinated search contract.

Result-row bookmark checkboxes are independent of FIT and do not apply filters or assert fitment.

### Normalized categories, JEPC descriptions and the fixture bridge (the normalized FIT contract / the source-description mapping contract)

A category/value shown by Fit is a normalized ID with an explicit source-qualified description mapping. The mapping retains JEPC namespace, dataset/version, record locator, language, original text and source scope. Equal displayed words are never used as identity.

UI headings, prompts and states use EN/FI i18next keys. Each published category/value also has language-qualified domain name/description metadata. Imported JEPC text remains catalogue-language data and is not translated through UI keys.

For explicitly synthetic TEST data, the fixture provider may expose source-shaped test descriptions for Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; and Seat equipment: Memory Seat/Powered Seats. Every fixture row must carry its synthetic namespace, dataset, language, locator and normalized mapping. It validates the public read and localization contract only; it cannot become a JEPC condition or production fitment fact.

The filter reads published mappings at occurrence scope. It never treats a raw description as a predicate, derives a condition from its text, or joins same-looking values across occurrences. If source relation, i18n domain metadata or occurrence scope is absent, return `unavailable`. Memory Seat and Powered Seats may appear together only when their separately sourced records identify that coexisting occurrence; no membership condition or evaluator may be inferred from fixture text.

The FIT control is placed at centre-top, separate from Applicable Models. The 13 historical model-range browse labels are not FIT values.

The fixture examples—Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; Seat equipment: Memory Seat/Powered Seats—are independently sourced descriptions. Two seat labels may coexist only where separate source records identify the same occurrence.

### Information document link
The `(i)` control may link to verified **Model Family & Year Introduction** documentation when a valid source/document relationship exists.

- The link is optional and evidence-driven.
- Do not invent a document or URL to reproduce the icon.
- The document is contextual reference and does not by itself prove PART fit.

## FIT request and response contract
```text
FitRequest
  canonical_part_id?
  occurrence_context_id?
  approved_browse_filters?
  normalized_variation_filters[]?   # no active selections initially; at most one per competing group

FitResult
  state                             # verified / unresolved / unavailable / error as applicable
  qualifiers[]                      # evidence-backed values per selected occurrence
  exclusions[] when supported
  available_filter_dimensions[] when supported
  contextual_document? when verified
  provenance/unavailable information
```

Stored `part_fitment.applicability_state` values remain source/persistence evidence; active FIT must not infer verified FIT from missing source evidence or expose storage terminology as a separate application contract.

## Source-qualified fixture semantics
Synthetic FIT values require independent source descriptions and occurrence-specific mapping identities. Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; Seat equipment: Memory Seat/Powered Seats are fixture vocabulary, never verified Jaguar facts. Different descriptions may coexist only when separately evidenced on the same occurrence. TEST data cannot leak into real parts-data responses.

## Viewport and language
The centre-top FIT panel is separate from the right-hand Applicable Models panel. Its grouped labelled controls are keyboard accessible, respect the fitted desktop shell and reflow on narrow layouts. UI EN/FI translation resources and source Parts-language metadata remain independent.
