# Jagports Vehicle Knowledge & EPC — Research Expansion and Specification TODO

## Purpose

Extend the existing JEPC/Jagports specification into a source-backed Jaguar vehicle identity, EPC, fitment and configuration-inference system.

## Core principle

Do not collapse different evidence sources into one authoritative truth when the evidence does not justify that conclusion. Keep facts, observations, rules, inferences, provenance and conflicts distinguishable.

## Research priorities

### P1 — VIN / identifier identity
- Research every physical identifier separately: boot/body stamp, windscreen, B-pillar/door-post, registration/title VIN, engine, body and gearbox numbers where applicable.
- Establish early X100 Americas relationships between boot, B-pillar and windscreen identifiers.
- Verify whether B-pillar and windscreen identifiers are always equal for early Americas cars.
- Verify the six-digit serial invariant across A/B/C identifiers using multiple real vehicles.
- Verify the post-2000 transition to identical identifiers.
- Research Japan separately rather than assuming ROW rules.
- Build complete X100 early ROW, early Americas and later-system rule sets.

### P2 — Serial ranges and production knowledge
- Make serial number a first-class identity value, not merely a VIN substring.
- Build normalized serial-range records with model, market, body, production period, model year, source and transition notes.
- Build production-event records for engine, trim, exhaust, wiring, glass, brakes, wheels, suspension, emissions, ECU/software, facelift and special-edition changes.
- Crosswalk Jaguar marketing names, platform/chassis codes, JEPC IDs, JHT names and third-party catalogue names.

### P3 — JEPC VIN-to-attributes reverse engineering
- Trace all client-side VIN decoding calls.
- Investigate whether other offline JEPC installations contain VIN-to-attribute data.
- Reverse-engineer historical backend request/response semantics where recoverable.
- Inventory all `A<groupId>` attribute values.
- Cluster opaque attribute groups against known properties such as LHD/RHD, engine, body, market, transmission and options.
- Validate candidate mappings against independent sources before marking them confirmed.

### P4 — Generalized fitment engine
- Normalize JEPC `C` VIN/chassis breakpoints.
- Normalize `A<groupId>` attribute constraints.
- Normalize external free-text qualifiers such as engine number, wheel size, LHD/RHD, supercharged/non-supercharged and market.
- Support results: EXACT, PROBABLE, POSSIBLE, CONTRADICTED, UNRESOLVED.
- Implement explanations for both “why fits?” and “why not?”.
- Add explicit negative constraints so the system can prove impossibility rather than merely report lack of evidence.

### P5 — Evidence and provenance
- Introduce explicit source scope: publisher, market, model, period, identifier type and intended use.
- Distinguish FACT, RULE, OBSERVATION and INFERENCE.
- Keep source excerpts/page references with extracted facts.
- Add a conflict registry for contradictory sources.
- Use provenance tiers without treating confidence as a replacement for source quality.
- Preserve restricted/private research references without automatically redistributing restricted source material.

### P6 — Real vehicle evidence
- Build a corpus of verified vehicle examples.
- Collect paired A/B/C identifier examples where legally/shareably possible.
- Record photographs, engine/body/gearbox numbers, market and production context.
- Turn verified vehicles into regression fixtures for VIN and identity rules.

### P7 — Document/OCR research pipeline
- Detect whether PDFs contain usable text before OCR.
- Deduplicate exact and near-duplicate documents before expensive analysis.
- Preserve raw text, OCR text, normalized text and extracted facts separately.
- Store page and image-region references for difficult tables, plates, labels and diagrams.
- Record extraction method and review status.

### P8 — EPC diagrams and relationships
- Validate JEPC Flash hotspot coordinate conversion.
- Verify item/hotspot cardinality and diagram-to-item relationships.
- Treat diagrams as evidence linking parts to physical positions, not merely decoration.
- Investigate SNG diagram extraction separately.
- Expand part relationships beyond simple old-to-new supersession to support kits, splits, merges, equivalents and substitutes.

### P9 — External sources
- Use SNG PDFs as a source-tagged overlay and corroboration source before blind merging.
- Investigate JLR Classic Parts, Nimark and other suitable sources with explicit source scope.
- Research Jaguar technical bulletins, handbooks, period option/trim catalogues and regulatory/homologation material.
- Build a source-scope matrix so a correct rule from one market/period is not applied to another.

## Specification improvements

### Add vehicle identity domain

```text
vehicle
vehicle_identifier
identifier_scheme
identifier_equivalence
serial_range
production_event
vehicle_attribute
vehicle_observation
```

### Add evidence domain

```text
source
source_scope
source_document
source_excerpt
knowledge_fact
knowledge_rule
knowledge_conflict
```

### Add fitment domain

```text
fitment_criterion
fitment_rule
fitment_result
```

### Add generalized relationships

```text
part_relationship
vehicle_relationship
identifier_relationship
```

## Important modelling rules

1. Every decoding rule must declare its scheme and scope; never encode a bare rule such as `position 7 = 1 -> Coupe` without specifying which VIN scheme/market/period it belongs to.
2. Separate physical identifier representation from canonical vehicle identity. Different physical identifiers may legitimately represent the same vehicle differently.
3. Treat serial boundaries as first-class knowledge because parts applicability and production changes often follow serial rather than calendar model year.
4. Keep model year separate from actual production date.
5. Preserve source conflicts instead of silently choosing a winner.
6. Allow uncertainty and missing context as valid outcomes.
7. Generate regression tests from every confirmed boundary and documented exception.
8. Keep JEPC reference data separate from Jagports business data and join them at query time.

## Proposed generalized knowledge fact

```text
knowledge_fact
  fact_id
  subject_type
  subject_id
  predicate
  value_type
  value
  scope
  source
  confidence
  status
  created_date
```

## Proposed fitment result

```text
fitment_result
  vehicle
  part
  decision
  matched_constraints
  failed_constraints
  evidence
  confidence
```

## Proposed source hierarchy

```text
A = factory / JDHT primary record
B = Jaguar factory technical or parts publication
C = official regulatory documentation
D = period specialist publication
E = reputable specialist catalogue
F = verified owner / vehicle observation
G = community claim
H = model inference
```

Source tier and confidence should remain separate dimensions.

## Novel product capabilities

### Vehicle identity page

Show:
- canonical identity
- all physical identifiers
- serial
- VIN scheme
- market
- model year
- production period
- factory attributes
- observed attributes
- evidence
- conflicts
- applicable parts

### “Why does this fit?”

Return the matched VIN, attribute and production constraints together with source evidence.

### “Why does this not fit?”

Return every failed or contradictory constraint.

### “What changed at this VIN?”

Show production events, model splits, part changes and documentation around a serial boundary.

### Vehicle anomaly detector

Detect:
- serial mismatch
- scheme mismatch
- market mismatch
- model-range mismatch
- year mismatch
- body mismatch
- impossible serial range
- unknown scheme
- duplicate identifier
- possible replacement label
- possible documentation error

### Evidence-backed vehicle twin

For known donor/observed vehicles, maintain factory identity, physical identifiers, observed configuration, replaced components, documents, photos, evidence and confidence.

## Research process improvements

Use a research matrix for every unresolved question:

```text
question
candidate_answer
sources_searched
positive_evidence
negative_evidence
scope
confidence
unresolved_alternatives
next_action
```

Use agents primarily for targeted analysis, parser development, contradiction investigation and test generation. Use deterministic local tooling for bulk PDF discovery, OCR, extraction, hashing, deduplication and metadata collection to reduce unnecessary AI-token consumption.

## Highest-value first deliverable

Create an X100 VIN knowledge package:

```text
x100-vin-knowledge/
  README.md
  SCHEMA.md
  sources/
  rules/
    early-row.yaml
    early-north-america.yaml
    new-system.yaml
    japan.yaml
  production/
    x100-serial-timeline.yaml
  attributes/
    candidates.yaml
    confirmed.yaml
  tests/
    boundary-vins.yaml
    verified-vehicles.yaml
  conflicts/
    unresolved.yaml
```

The decoder should accept optional context such as market, country, physical identifier location, production period and known model. It must be allowed to return `UNKNOWN` or `NEEDS_CONTEXT` rather than guessing.

## Acceptance criteria for confirmed VIN rules

A rule should normally become `confirmed` only when:

1. The source clearly scopes it.
2. The identifier scheme is known.
3. Physical identifier context is known.
4. A primary/near-primary source supports it where reasonably available.
5. No unresolved higher-quality source contradicts it.
6. At least one concrete VIN test passes.
7. Boundary behavior is tested where applicable.

## Long-term architecture

```text
IDENTITY
  Who/what is this Jaguar?

PROVENANCE
  Where did each fact come from?

CONSTRAINTS
  What can/cannot apply?

CATALOGUE
  What parts exist?

FITMENT
  What parts fit this vehicle?

CONFIGURATION
  What could this vehicle have had from factory?

OBSERVATION
  What do we actually see on this car?

UNCERTAINTY
  What remains unresolved?

EXPLANATION
  Why did the system reach this conclusion?
```

The objective is a source-backed Jaguar vehicle, parts and fitment knowledge system with an EPC at its core, rather than a conventional VIN decoder with a parts list.
