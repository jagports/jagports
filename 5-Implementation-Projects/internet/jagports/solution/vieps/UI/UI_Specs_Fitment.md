# VIEPS UI — Fitment qualifiers and VIN applicability contract

## Objective
Specify how the right-hand Applicable Models panel and centre-top normalized Suitability / Variations filter consume the existing approved PART occurrence/fitment and VIN-applicability contract. Geometry changes do not invent domain semantics or expand the current reduced-MVP gate.

## Merged Concept-11 presentation
The target layout replaces the legacy Concept-11 full centre/right Model Ranges row and right-middle Suitability area:

```text
LEFT                    CENTRE                                   RIGHT
Availability            VIN / normalized Variations             Search
Parts Tree              +----------------+-------------------+   Search Results PART List
                        | Location at car| One selected PART |   Applicable Models
                        | or unavailable | / Image / Status |   browse index / verified fit
                        +----------------+-------------------+
```

The Applicable Models panel scrolls independently below Search Results. The filter in the centre top narrows candidates by normalized suitability dimensions; it is distinct from right-hand model filters and selected-PART fit facts.

## Contract
Applicability is evaluated from approved PART occurrence/application/attribute relationships. Support model/range and VIN-range applicability when evidence exists. Preserve constraints, exclusions and provenance.

### Suitability Model Ranges
- **No PART selected:** the right-hand Applicable Models panel shows an index of available model/range browse choices and supported filter controls. Its deterministic fixture display labels, in this order, are Jaguar Accessories; Daimler Limousine; E-Pace; E-Type; F-Pace; F-Type; S-Type; X-Type; XE Range; XF Range; XJ Range; XJS; XK Range. These are browse/test labels, NOT positive per-PART applicability claims.
- **One selected PART/context:** show all and only approved `applicable` ranges for that PART and supported selected occurrence/vehicle context. Preserve evidence and verified qualifiers; exclude confirmed `excluded` / not-applicable ranges from the suitable list. Distinguish no confirmed match, unavailable fitment evidence and processing failure.
- When a right-hand result row identifies one PART with several valid source occurrences, require explicit occurrence/context selection before occurrence-dependent VIN applicability is shown. Selecting another range/context must not mutate canonical PART identity.
- **Product Owner decision:** choose several model/range filters and match **ANY** selected range. Retain a candidate canonical PART when one or more verified surviving occurrences positively satisfy at least one selected normalized range ID plus every other active approved filter. No selection leaves ranges unconstrained. Never convert incomplete/unavailable evaluation or an exclusion into positive fitment. The advanced multi-range read/filter implementation is **deferred**: show unsupported checkboxes disabled until correctly backed by the approved read contract.
- Empty-query stock-backed model browsing is permitted only when the approved stock/catalogue and applicability contracts provide verified candidates; otherwise indicate unavailable/unsupported rather than fabricating ranges.

### Suitability / Filter dual mode
The centre-top Suitability / Variations filter and right-bottom Applicable Models panel are distinct controls over one normalized fitment contract.

1. **Browse or multiple candidates:** show only verified fitting normalized variation options derived from currently surviving occurrence contexts. Selecting one narrows candidates consistently in left Parts Tree, right Search Results and right Applicable Models. Preserve exclusions and unknown/unavailable states; raw imported descriptions are not automatically typed normalized facets.
2. **Single selected PART/context:** show evidence-backed qualifier/fact values where supported by the selected context (body, steering, engine, supercharger, market, transmission, equipment and VIN boundary). Missing values remain unknown; they never become default assumptions.

VIN applicability uses approved source VIN ranges, not inferred model years or KOVuosi. Result-row bookmark checkboxes are **visible but disabled** in the current layout increment; later bookmarking cannot select a model, apply a filter or assert fitment.

### Normalized categories, JEPC descriptions and the fixture bridge

A category/value shown by Suitability is a normalized ID with an explicit source-qualified description mapping. The mapping retains JEPC namespace, dataset/version, record locator, language, original text and source scope. Equal displayed words are never used as identity.

UI headings, prompts and states use EN/FI i18next keys. Each published category/value also has language-qualified domain name/description metadata. Imported JEPC text remains catalogue-language data and is not translated through UI keys.

Before imported JEPC descriptions are available, the fixture provider may expose source-shaped test descriptions for Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; and Seat equipment: Memory Seat/Powered Seats. Every fixture row must carry its synthetic namespace, dataset, language, locator and normalized mapping. It validates the public read and localization contract only; it cannot become a JEPC condition or production fitment fact.

The filter reads published mappings at occurrence scope. It never treats a raw description as a predicate, derives a condition from its text, or joins same-looking values across occurrences. If source relation, i18n domain metadata or occurrence scope is absent, return `unavailable`. Memory Seat and Powered Seats may appear together only when their separately sourced records identify that coexisting occurrence; this contract specifies no membership condition or evaluator.

The control is placed at centre-top and remains separate from right-hand Applicable Models. Its 13 model-range browse labels are not suitability values.

### FIT presentation contract

The persistent Parts Tree remains on the left; Search and upper FIT / Variations controls occupy the centre/top interaction area; Search Results and Applicable Models remain distinct on the right. Search-result rows and tree leaves share one canonical PART selection. Applicable Models displays evidence and does not become the FIT filter.

Only normalized category/value entries with a persisted source-qualified description mapping, language-qualified domain metadata and occurrence scope are publishable. Missing required relations produce `unavailable`; raw JEPC text is presentation evidence, never an API key or filter predicate. Synthetic fixtures require namespace, dataset, language, locator and mapping identity and never become JEPC fitment facts. The upper FIT control is keyboard-accessible, uses grouped checkboxes, and consumes this mapping contract without a hard-coded taxonomy or label-derived evaluator.

The known fixture labels—Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; Seat equipment: Memory Seat/Powered Seats—are examples of mapped descriptions. The two seat labels may appear together only when separately sourced description records identify the same occurrence. They do not justify a new condition operator or hard-coded suitability logic.

### Information document link
The `(i)` control may link to verified **Model Family & Year Introduction** documentation when a valid source/document relationship exists.

- The link is optional and evidence-driven.
- Do not invent a document or URL to reproduce the icon.
- The document is contextual reference and does not by itself prove PART applicability.

## UI/API contract
```text
FitmentRequest
  canonical_part_id?
  occurrence_context_id?
  vehicle_context?
  approved_browse_filters?
  normalized_variation_filters[]?    # when supported
  model_range_filters[]?              # deferred multi-range filter: normalized IDs, ANY/OR, [] = unconstrained

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

Do not add a second domain taxonomy for the 13 fixture labels. Use normalized existing IDs where verified, or clearly isolated fixture IDs until imported/source-mapped evidence exists. Preserve `part_fitment.applicability_state` and the positive/negative/unavailable distinctions across UI and API.

## Deterministic fixtures
Cover all 13 exact browse/index fixture display labels independently of selected-PART fitment, a single PART applicable to only some Ranges, an excluded Range not presented as suitable, verified source qualifiers, VIN-range match/exclusion, selected row with multiple source occurrences, unavailable evidence, context-only search and API error. The later multi-range filter test matrix must include **ANY/OR** across two or more ranges, empty-selection pass-through, exclusions/unknowns and conjunction with an approved normalized variation filter. Fixture labels are never production Jaguar facts. Preserve established main-branch fixture identifier semantics.

### Source-qualified fixture behavior

The normalized reader requires that each fixture value is returned only with its source namespace, dataset, locator, language and published mapping; that UI EN/FI chrome and language-qualified domain metadata resolve without changing the mapping ID; and that the fixture provider cannot leak into normal production reads. Test that same text from two source records remains distinct until separately mapped, that incomplete source relation returns `unavailable`, and that Body/Steering/Engine/Seat filters stay within one occurrence. Test coexistence of Memory Seat and Powered Seats only as two sourced descriptions of the same fixture occurrence, with no inferred condition or fabricated fitment.

## Viewport and language
Applicable Models is independently scrollable in the persistent right column below the separate Search Results list; centre VIN/Variations remain above Location and one selected PART. Keep fitted desktop behavior with inner scroll and accessible links/labelled checkboxes. On narrow layouts reflow without mixing bookmark, model filter and verified fit indicators. UI text and source Parts-language remain independently governed by their UI-language and Parts-language contracts.

## Boundaries
VIN decoding and VIN-range reconstruction are separate enabling work. Do not invent VIN ranges or use KOVuosi as a substitute for VIN/evidence-based applicability. This specification consumes the canonical PART/fit semantics and does not redefine them.

