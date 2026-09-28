# VIEPS UI — Fitment qualifiers and VIN fit contract

## Objective
Specify how the right-hand Applicable Models panel and centre-top normalized Fit / Variations filter consume the existing approved PART occurrence/fitment and VIN-fit contract. Geometry changes do not invent domain semantics or expand the current reduced-MVP gate.

## Concept-11 presentation
The target layout uses the following regions:

```text
LEFT                    CENTRE                                   RIGHT
Availability            VIN / normalized Variations             Search
Parts Tree              +----------------+-------------------+   Search Results PART List
                        | Location at car| One selected PART |   Applicable Models
                        | or unavailable | / Image / Status |   browse index / verified fit
                        +----------------+-------------------+
```

The Applicable Models panel scrolls independently below Search Results. The filter in the centre top narrows candidates by normalized fit dimensions; it is distinct from right-hand model filters and selected-PART fit facts.

## Contract
Fit is evaluated from approved PART occurrence/application/attribute relationships. Support model/range and VIN-range fit when evidence exists. Preserve constraints, exclusions and provenance.

### Fit Model Ranges
- **No PART selected:** the right-hand Applicable Models panel shows only evidenced ranges supported by the current browse/search candidates, with one optional active range filter. Explicit imported JEPC Model-to-Range mappings are authoritative; the historical 13-label fixture index is test compatibility only, not production membership or positive fitment.
- **One selected PART/context:** the panel becomes read-only. Preserve available context choices where supported; mark only the PART's evidenced `applicable` ranges as verified/lit, leave verified nonmatching options unlit, and show relevant unresolved range applicability with a yellow unknown warning. No selection silently activates a filter. Distinguish verified exclusion, no confirmed match, unavailable evidence and processing failure.
- When a right-hand result row identifies one PART with several valid source occurrences, require explicit occurrence/context selection before occurrence-dependent VIN fit is shown. Selecting another range/context must not mutate canonical PART identity.
- **Superseding Product Owner decision (2026-09-28):** choose **at most one** normalized model-range filter; hide competing ranges while it is active and restore evidenced choices when cleared. Combine with other groups using AND. Preserve selected filters across new Find submissions. Confirmed incompatible occurrences are excluded; otherwise eligible candidates with unknown required model evidence appear in the separate unresolved section with yellow warnings, not as verified matches. Unsupported controls stay disabled until the approved reader/evaluator can satisfy this contract; historical multiple-range ANY/OR is superseded.
- Empty-query stock-backed model browsing is permitted only when the approved stock/catalogue and fit contracts provide verified candidates; otherwise indicate unavailable/unsupported rather than fabricating ranges.

### Fit / Filter dual mode
The centre-top Fit / Variations filter (the normalized FIT contract) and right-bottom Applicable Models panel are distinct controls over one normalized fitment contract. The FIT filter initially has no checked values; category-group presentation is specified in [UI_Part_Search.md](../SPEC/UI_Part_Search.md#coordinated-searchfilter-interaction--product-owner-decisions-2026-09-28).

1. **Browse or multiple candidates:** show only evidence-backed normalized FIT values represented in current search/browse candidates; initial empty-Find browse derives them from browsable PARTs. Visibility is an availability indicator, not an active selection. At most one competing value per FIT group is active: hide other values in that group while selected, restore options on clearing, combine different groups using AND and preserve selections across new Find queries. This applies equally to VIN-range, colour and other normalized FIT groups. Only source-mapped options may be offered; preserve exclusions and unknown/unavailable states.
2. **Single selected PART/context:** FIT becomes read-only; mark evidence-backed values verified for the selected PART and leave other supported options unlit. Unknown required values receive yellow unknown-evidence indicators, not positive-fit assertions. Preserve occurrence/context scope for body, steering, engine, supercharger, market, transmission, equipment and VIN boundary. FIT and range exclusion deselect the PART; Stock exclusion may retain warned detail under the coordinated search contract.

VIN fit uses approved source VIN ranges, not inferred model years or KOVuosi. Result-row bookmark checkboxes are **visible but disabled** while bookmark support is unavailable; bookmark state cannot select a model, apply a filter or assert fitment.

### Normalized categories, JEPC descriptions and the fixture bridge (the normalized FIT contract / the source-description mapping contract)

A category/value shown by Fit is a normalized ID with an explicit source-qualified description mapping. The mapping retains JEPC namespace, dataset/version, record locator, language, original text and source scope. Equal displayed words are never used as identity.

UI headings, prompts and states use EN/FI i18next keys. Each published category/value also has language-qualified domain name/description metadata. Imported JEPC text remains catalogue-language data and is not translated through UI keys.

Before the importer evidence contract import, the fixture provider may expose source-shaped test descriptions for Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; and Seat equipment: Memory Seat/Powered Seats. Every fixture row must carry its synthetic namespace, dataset, language, locator and normalized mapping. It validates the public read and localization contract only; it cannot become a JEPC condition or production fitment fact.

The filter reads published mappings at occurrence scope. It never treats a raw description as a predicate, derives a condition from its text, or joins same-looking values across occurrences. If source relation, i18n domain metadata or occurrence scope is absent, return `unavailable`. Memory Seat and Powered Seats may appear together only when their separately sourced records identify that coexisting occurrence; no membership condition or evaluator may be inferred from fixture text.

The control is placed at centre-top and remains separate from right-hand Applicable Models. Its 13 model-range browse labels are not fit values.

The fixture examples—Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; Seat equipment: Memory Seat/Powered Seats—are independently sourced descriptions. Two seat labels may coexist only where separate source records identify the same occurrence.

### Information document link
The `(i)` control may link to verified **Model Family & Year Introduction** documentation when a valid source/document relationship exists.

- The link is optional and evidence-driven.
- Do not invent a document or URL to reproduce the icon.
- The document is contextual reference and does not by itself prove PART fit.

## UI/API contract
```text
FitmentRequest
  canonical_part_id?
  occurrence_context_id?
  vehicle_context?
  approved_browse_filters?
  normalized_variation_filters[]?    # when supported
  model_range_filter_id?             # deferred single-range filter: normalized ID, absent = unconstrained

FitmentResult
  state                               # applicable / no_match / unavailable / error as defined
  applicable
  model_ranges[]                      # confirmed applicable only for selected PART/context
  available_model_range_index[]?      # browse/index mode; not a fitment assertion
  vin_range[] when supported
  qualifiers[]
  exclusions[] when supported
  available_filter_dimensions[] when supported
  contextual_document? when verified
  provenance/unavailable information
```

Do not add a second domain taxonomy for the 13 fixture labels. Use normalized existing IDs where verified, or clearly isolated fixture IDs until imported/source-mapped evidence exists. Preserve `part_fitment.applicability_state` and the the fit evidence contract positive/negative/unavailable distinctions across UI and API.

## Deterministic fixtures
Cover the isolated historical 13-label TEST browse compatibility fixture independently of production source-derived Range membership and selected-PART fitment; include a PART fitting only some Ranges, read-only applicable/nonmatching/unknown indicators, exclusions, VIN-range match/unknown/exclusion, multi-occurrence context, unavailable evidence, context-only search and API error. The superseding single-range filter test matrix must include one active range, restoration of competing ranges on clear, unknowns separately from verified fits, and conjunction with normalized FIT filters. Fixture labels are never production Jaguar facts. Preserve established main-branch fixture identifier semantics.

## Viewport and language
Applicable Models is independently scrollable in the persistent right column below the separate Search Results list; centre VIN/Variations remain above Location and one selected PART. Keep the viewport-fit contract fitted desktop behavior with inner scroll and accessible links/labelled checkboxes. On narrow layouts reflow without mixing bookmark, model filter and verified fit indicators. UI text and source Parts-language remain independently governed by the UI-language contract and the Parts-language contract.

## Boundaries
VIN decoding and VIN-range reconstruction are separate enabling work. Do not invent VIN ranges or use KOVuosi as a substitute for VIN/evidence-based fit. This specification consumes the PART model semantics and does not redefine them.

