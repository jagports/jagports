# VIEPS UI — Fitment qualifiers and VIN fit contract

**Status:** #875 target geometry proposed for review; existing fitment contract retained  
**Layout enhancement issue:** #875 (follows #468)  
**Priority issue:** #478  
**Implementation parent:** #368  
**Domain owner:** #354

## Objective
Specify how the right-hand #875 Applicable Models panel and centre-top normalized Fit / Variations filter consume the existing approved PART occurrence/fitment and VIN-fit contract. Geometry changes do not invent domain semantics or expand the current reduced-MVP gate.

## Merged Concept-11 presentation
The #875 target replaces the merged Concept-11 full centre/right Model Ranges row and right-middle Fit area:

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
The centre-top Fit / Variations filter (#641) and right-bottom Applicable Models panel are distinct controls over one normalized fitment contract.

1. **Browse or multiple candidates:** show only evidence-backed normalized FIT values represented in current search/browse candidates; initial empty-Find browse derives them from browsable PARTs. Visibility is an availability indicator, not an active selection. At most one competing value per FIT group is active: hide other values in that group while selected, restore options on clearing, combine different groups using AND and preserve selections across new Find queries. This applies equally to VIN-range, colour and other normalized FIT groups. Only source-mapped options may be offered; preserve exclusions and unknown/unavailable states.
2. **Single selected PART/context:** FIT becomes read-only; mark evidence-backed values verified for the selected PART and leave other supported options unlit. Unknown required values receive yellow unknown-evidence indicators, not positive-fit assertions. Preserve occurrence/context scope for body, steering, engine, supercharger, market, transmission, equipment and VIN boundary. FIT and range exclusion deselect the PART; Stock exclusion may retain warned detail under the coordinated search contract.

VIN fit uses approved source VIN ranges, not inferred model years or KOVuosi. Result-row bookmark checkboxes are **visible but disabled** in the current layout increment; later bookmarking cannot select a model, apply a filter or assert fitment.

### Normalized categories, JEPC descriptions and the fixture bridge (#641 / #877)

A category/value shown by Fit is a normalized ID with an explicit source-qualified description mapping. The mapping retains JEPC namespace, dataset/version, record locator, language, original text and source scope. Equal displayed words are never used as identity.

UI headings, prompts and states use EN/FI i18next keys. Each published category/value also has language-qualified domain name/description metadata. Imported JEPC text remains catalogue-language data and is not translated through UI keys.

Before #355 import, the fixture provider may expose source-shaped test descriptions for Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; and Seat equipment: Memory Seat/Powered Seats. Every fixture row must carry its synthetic namespace, dataset, language, locator and normalized mapping. It validates the public read and localization contract only; it cannot become a JEPC condition or production fitment fact.

The filter reads published mappings at occurrence scope. It never treats a raw description as a predicate, derives a condition from its text, or joins same-looking values across occurrences. If source relation, i18n domain metadata or occurrence scope is absent, return `unavailable`. Memory Seat and Powered Seats may appear together only when their separately sourced records identify that coexisting occurrence; this PR specifies no membership condition or evaluator.

The merged #883 layout places the control at centre-top and keeps right-hand Applicable Models separate. Its 13 model-range browse labels are not fit values.

### UI integration plan and active-work reconciliation

The merged #883 specification is the layout authority: persistent Parts Tree on the left; central search and upper Fit / Variations controls; and a right column containing Search Results above Applicable Models. Search-result rows and tree leaves select one canonical PART. Applicable Models remains evidence display, not the fit filter.

Implementation follows this order:

1. **Description mapping read contract (#877 / #879).** Publish only normalized category/value entries that carry a persisted source-qualified description mapping, language-qualified domain name/description metadata and an occurrence scope. Return a deterministic unavailable state when any required relation is absent. Raw JEPC text is presentation evidence, never an API key or filter predicate.
2. **Persistence and fixture correction (draft PR #892).** Replace its proposed set-membership/cardinality path with source-shaped fixture descriptions and mapping revisions. Fixtures require synthetic namespace, dataset, language, locator and mapping identity, but remain test data and cannot become JEPC fitment facts.
3. **Upper filter and lower-panel removal (Issue #895 / draft PR #939).** Keep removal of the lower duplicate panel and retain selected-PART range evidence in the right Applicable Models region. Implement the upper control as the requested horizontal, keyboard-accessible checkbox row with checked-first alphabetical ordering and horizontal overflow. Its options and filtering must consume the mapping read contract; do not retain a hard-coded variation list or an independent evaluator based on labels, namespace alone, or inferred conditions.
4. **Evidence.** Add browser screenshots at desktop, tablet and narrow widths for empty/unavailable, source-backed available options, source-mapping failure, EN/FI UI chrome with catalogue-language source description, fixture isolation, checked ordering and synchronized Search Results/Parts Tree selection. Captions must state whether an image uses fixture or imported data.

The known fixture labels—Body: Coupe/Convertible; Steering: LHD/RHD; Engine aspiration: NA/Supercharged; Seat equipment: Memory Seat/Powered Seats—are examples of mapped descriptions. The two seat labels may appear together only when separately sourced description records identify the same occurrence. They do not justify a new condition operator or hard-coded fit logic.

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

Do not add a second domain taxonomy for the 13 fixture labels. Use normalized existing IDs where verified, or clearly isolated fixture IDs until imported/source-mapped evidence exists. Preserve `part_fitment.applicability_state` and the #666 positive/negative/unavailable distinctions across UI and API.

## Deterministic fixtures
Cover the isolated historical 13-label TEST browse compatibility fixture independently of production source-derived Range membership and selected-PART fitment; include a PART fitting only some Ranges, read-only applicable/nonmatching/unknown indicators, exclusions, VIN-range match/unknown/exclusion, multi-occurrence context, unavailable evidence, context-only search and API error. The superseding single-range filter test matrix must include one active range, restoration of competing ranges on clear, unknowns separately from verified fits, and conjunction with normalized FIT filters. Fixture labels are never production Jaguar facts. Preserve established main-branch fixture identifier semantics.

### Pre-JEPC filter regression matrix (#641 / #877)

Once the normalized reader is implemented, test that each fixture value is returned only with its source namespace, dataset, locator, language and published mapping; that UI EN/FI chrome and language-qualified domain metadata resolve without changing the mapping ID; and that the fixture provider cannot leak into normal production reads. Test that same text from two source records remains distinct until separately mapped, that incomplete source relation returns `unavailable`, and that Body/Steering/Engine/Seat filters stay within one occurrence. Test coexistence of Memory Seat and Powered Seats only as two sourced descriptions of the same fixture occurrence, with no inferred condition or fabricated fitment.

## Viewport and language
Applicable Models is independently scrollable in the persistent right column below the separate Search Results list; centre VIN/Variations remain above Location and one selected PART. Keep #616 fitted desktop behavior with inner scroll and accessible links/labelled checkboxes. On narrow layouts reflow without mixing bookmark, model filter and verified fit indicators. UI text and source Parts-language remain independently governed by #554 and #620.

## Boundaries
VIN decoding and VIN-range reconstruction are separate enabling work. Do not invent VIN ranges or use KOVuosi as a substitute for VIN/evidence-based fit. This specification consumes #354 semantics and does not redefine them.

## Acceptance criteria
- [ ] #875 right-hand Applicable Models panel and centre-top normalized Fit / Variations Filter replace the old full centre/right range row.
- [ ] No-PART browse options derive from evidenced imported Model-to-Range mappings; historical 13-label fixture labels remain isolated TEST compatibility data, not production range authority.
- [ ] Selected-PART/context view displays only verified applicable Ranges and excludes confirmed nonmatching/excluded Ranges.
- [ ] `no_match`, `unavailable`, `error` and unresolved qualifiers are distinguished and never guessed into positive fitment.
- [ ] Right model filter and centre normalized variation filter semantics are distinct and consume the approved #641/#354/#666 contract.
- [ ] Superseding single normalized range selection and evidence-safe unresolved-candidate interaction specified by the Product Owner (2026-09-28).
- [ ] One-range filter runtime remains disabled wherever the supported source/evaluator read contract is incomplete; no obsolete multiple-range ANY/OR behavior is simulated.
- [ ] VIN fit preserves source evidence and excludes KOVuosi-based guessing.
- [ ] Shared PART selection, multi-occurrence handling, fixture tests, viewport fit and language boundaries are covered.
- [ ] Independent #875 specification review is complete.
