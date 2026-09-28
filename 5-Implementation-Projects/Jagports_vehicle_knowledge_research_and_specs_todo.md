# Jagports / Jaguar Vehicle Knowledge & EPC
## Research expansion, novel ideas, and specification TODO

**Purpose:** extend the existing JEPC/Jagports specification into a source-backed Jaguar vehicle identity, fitment, EPC and configuration-inference system.

This document is intentionally a **research/specification backlog and design proposal**. It does not silently turn hypotheses into facts. Every newly researched rule should carry source, scope, evidence quality, and conflict status.

---

## 0. Executive view

The project is broader than a VIN decoder and broader than a parts catalogue.

The intended system can be viewed as:

```text
Jaguar source documents
        +
JEPC local catalogue
        +
verified vehicle observations
        +
JHT production records / certificates
        +
third-party catalogues
        |
        v
SOURCE-BACKED KNOWLEDGE LAYER
        |
        +--> vehicle identity
        +--> VIN / chassis decoding
        +--> production ranges
        +--> configuration attributes
        +--> parts fitment
        +--> supersession
        +--> diagrams / locations
        +--> provenance / conflicts
        |
        v
DETERMINISTIC QUERY + INFERENCE ENGINE
        |
        +--> "What is this car?"
        +--> "What parts fit?"
        +--> "What could this car originally have had?"
        +--> "Which source supports that?"
        +--> "Where do sources disagree?"
```

The most important architectural principle is:

> **Do not let the model or application collapse different evidence sources into one apparently authoritative truth when the evidence does not justify that conclusion.**

The existing project specification already follows this philosophy for parts provenance and manual-verification flags. It distinguishes JEPC reference data from business-operational data and joins them at query time rather than duplicating them. fileciteturn4file0L12-L19 It also allows multiple independent catalog sources to corroborate or contradict one another without silently overwriting each other. fileciteturn4file1L311-L360

This same philosophy should become the **core of vehicle/VIN research**.

---

# 1. What is already strong in the existing specification

## 1.1 JEPC structure is already understood unusually well

The current notes document:

- the local JEPC filesystem
- model/group/variant structure
- category hierarchy
- item drilldowns
- part-number rows
- VIN breakpoint records
- opaque `A<groupId>` attributes
- diagram/hotspot files
- legacy pricing
- model-range taxonomy

The item-drilldown schema is particularly important: actual part leaves carry `partNumber`, supersession/classic flags, quantity/state, and `applicationId`; `applicationId` is the bridge to the attribute/fitment data. fileciteturn5file0L299-L317

The current decoding of JEPC fitment logic is also strong:

- `C` records represent VIN/chassis boundaries.
- `A<groupId>` records represent build/option attributes.
- `exceptFlag` represents an exclusion.
- the actual fitment algorithm can work without knowing the human meaning of every numeric group ID. fileciteturn5file0L336-L358

That is a major asset.

## 1.2 The current relational model is heading in the right direction

The proposed distinction between:

- canonical `jepc_part`
- context-specific `jepc_part_occurrence`
- supersession relationships
- inventory
- donor vehicle
- third-party cross references

is exactly the kind of separation needed for this project. fileciteturn5file0L21-L55

The existing design also correctly treats physical stock and donor-vehicle information as separate business data rather than pretending it exists in JEPC. fileciteturn5file0L57-L109

## 1.3 Provenance and human verification are already first-class ideas

The `part_data_source` design is particularly reusable for VIN research: multiple independent sources can be attached to one catalogue occurrence; agreement is useful evidence and disagreement remains visible. fileciteturn4file1L313-L360

Likewise, the revised verification model distinguishes:

- a source itself raising a warning
- an admin/manual observation raising a warning

and keeps unresolved issues open until a human resolves them. fileciteturn4file1L374-L448

**Recommendation:** reuse these principles for vehicle identity, VIN rules, configuration rules, and all other inferred facts.

---

# 2. New major research area: VIN / identifier identity model

This should become its own research domain rather than another subsection of generic VIN decoding.

## 2.1 Research every physical identifier separately

For every Jaguar generation/market/period, identify:

- chassis/body-stamped identifier
- windscreen VIN plate
- B-pillar / door-post certification label
- title/registration VIN
- engine number
- body number
- gearbox number
- axle number where relevant
- build plate / compliance plate
- any model-specific secondary identifier

Store:

```text
identifier_type
physical_location
market
production_period
format
full_value
serial_component
relationship_to_vehicle
source
confidence
```

## 2.2 X100 special case: identifier equivalence groups

For early X100 North-American cars, the current working model is:

- B-pillar and windscreen identifiers correspond to each other.
- Boot/trunk identifier may use a different representation.
- All three are believed to share the same six-digit serial suffix.
- After ~2000, the three physical identifiers are believed to converge to the same VIN.
- ROW cars are believed to have the same A/B/C identifier, with Japan requiring explicit verification.

These are **domain observations to verify**, not yet claims that should be hard-coded as universal rules.

The identifier model should therefore support:

```yaml
identifier_group:
  vehicle_id: ...
  market: USA
  period: 1996-1999

  members:
    - location: boot
      role: factory_chassis_identifier
    - location: b_pillar
      role: regulatory_vin
    - location: windshield
      role: regulatory_vin

  equivalence:
    full_string:
      boot_vs_bpillar: different_allowed
      bpillar_vs_windscreen: same_expected
    serial:
      all_three: same_expected
```

This avoids forcing every physical identifier into a single 17-character canonical string before the evidence is understood.

## 2.3 Research goal: prove what "same vehicle" means

The strongest evidence would be:

1. factory Jaguar documentation
2. JDHT build-ledger relationship
3. regulatory documentation
4. multiple photographed real vehicles
5. period dealer/service records
6. enthusiast reports only as corroboration

A particularly powerful dataset would be several real early-US X100 cars for which we know:

- trunk identifier
- windshield identifier
- B-pillar identifier
- title VIN
- model year
- production serial
- Heritage confirmation

That would allow the equivalence rules to be empirically tested.

---

# 3. New research area: make the serial number a first-class identity key

The current X100 material shows explicit VIN/serial production boundaries, including the old numeric system and the later `Axxxxx` system. fileciteturn3file2L152-L198

Do not model the serial merely as a substring.

Create a normalized representation:

```text
vehicle_identifier
  raw_value
  normalized_value
  scheme_id
  serial_value
  serial_prefix
  serial_numeric_component
```

For example:

```text
001246
A30645
A48684
```

should be comparable inside their own scheme while preserving the original raw representation.

## 3.1 Serial range knowledge base

Create:

```text
serial_range_rule
  rule_id
  model_range
  market_scope
  serial_scheme
  start_serial
  end_serial
  date_from
  date_to
  model_year
  transition_note
  source
```

This should represent:

- model-year boundaries
- body-type-specific boundaries
- engine-change boundaries
- platform-code boundaries
- special editions
- production transitions
- known exceptions

This is useful beyond VIN decoding because JEPC itself contains many parts whose applicability is governed by VIN ranges. JEPC already exposes `C` breakpoint records as first-class fitment constraints. fileciteturn5file0L342-L347

---

# 4. New research area: model/series/chassis code crosswalk

Create a controlled crosswalk between:

- Jaguar marketing/model names
- internal model IDs
- platform/chassis codes
- VIN ranges
- JEPC model IDs
- SNG catalogue names
- JLR publication nomenclature
- JHT model names
- third-party catalogue names

Example:

```text
XK8
  = X100
  = JEPC group 3175
  = JEPC variants 3187 / 3183 / 3178 / 3173
```

The existing notes already recognize that JEPC contains many near-duplicate VIN-range/market variants and that the human-facing application should group them into recognizable Ranges. fileciteturn5file0L472-L500

**Research TODO:** build the crosswalk as data, not as application code.

---

# 5. New research area: decode the opaque JEPC A<groupId> attributes

This is probably the single most valuable unresolved JEPC research task.

The current data proves the mechanism works, but not what the numeric group IDs mean. fileciteturn5file0L348-L358

## Research strategy

### 5.1 Mine all attribute files

For every:

```text
A<groupId>, <valueCode>
```

collect:

- group ID
- value code
- model
- category
- part occurrence
- VIN breakpoint context
- any neighboring human-readable qualifier
- frequency

### 5.2 Cluster by known vehicle facts

Start with facts that are easy to establish externally:

- LHD/RHD
- engine 4.0 / 4.2
- supercharged / non-supercharged
- coupe / convertible
- model year
- market
- transmission
- wheel/tire option
- brake package

Look for attribute groups whose values correlate strongly with those known dimensions.

### 5.3 Use independent parts catalogues as labels

SNG Barratt PDFs contain free-text qualifiers such as:

- 4.0 Litre
- 4.2 Litre
- supercharged
- non-supercharged
- RHD
- LHD

and explicit VIN ranges. fileciteturn439741search48

This makes them useful as a **semantic bridge** from opaque JEPC numbers to human names.

### 5.4 Do not overfit

A proposed mapping such as:

```text
A37 / 12 = "LHD"
```

must remain:

```text
candidate_mapping
status = hypothesized
evidence_count = N
contradictions = M
confidence = ...
```

until independently validated.

---

# 6. New research area: turn JEPC + external catalogues into a constraint solver

Instead of one boolean "fits / does not fit", use a constraint result:

```text
PART
  candidate
  required_attributes
  excluded_attributes
  vin_range
  market_constraints
  engine_constraints
  production constraints
```

Then calculate:

```text
MATCH
  exact
  probable
  possible
  contradicted
  unknown
```

This is a better fit for historical Jaguar documentation.

Example:

```text
Part X

VIN range:        matches
Market:           matches
Body:             matches
Engine:           unknown
Wheel-size rule:  unresolved

Conclusion:       POSSIBLE — manual verification
```

The existing specification already points toward this concept through `part_fitment_criterion` and general `part_verification_flag`. fileciteturn4file1L405-L448

---

# 7. New research area: production timeline as a knowledge graph

Do not make "model year" the only time dimension.

Jaguar production changes can occur:

- by serial number
- by date
- by engine number
- by model year
- by market
- by body type
- by running production change

The existing X100 documentation already shows several mid-year and mid-model changes: 1998.75, 2003.5, 2004.5, engine introduction at A30645, etc. fileciteturn3file2L165-L198

Create:

```text
production_event
  event_id
  vehicle_range
  effective_from_serial
  effective_from_date
  effective_to_serial
  market
  body
  change_type
  description
  source
```

Examples:

```text
engine_change
trim_change
exhaust_change
wiring_change
glass_change
brake_change
wheel_change
interior_change
emissions_change
ECU/software_change
facelift
special_edition
```

Then a part can refer to an event rather than duplicating logic.

---

# 8. New research area: engine / gearbox / body number relationships

The JDHT explicitly states that original production records can contain chassis/VIN, engine, body and gearbox numbers, and that a Heritage Certificate can document original colour, trim, build/dispatch dates and destination. citeturn476299search0turn476299search1

This suggests a major future capability:

```text
VIN
 ↕
chassis
 ↕
engine
 ↕
body
 ↕
gearbox
```

Research:

- how these number sequences relate
- whether they contain dates
- whether their ranges can constrain vehicle identity
- which source can validate one number against another

This is especially useful when a vehicle has a questionable title/VIN plate or an engine swap.

---

# 9. New research area: JHT as an authoritative vehicle identity oracle

JDHT states that its build records cover Jaguar production from 1931 onward and that Heritage Certificates reproduce the vehicle's original recorded details. citeturn476299search0turn476299search2

This should be modeled as a **special evidence tier**.

Possible provenance levels:

```text
A = factory/JDHT primary record
B = Jaguar factory technical/parts publication
C = official regulatory documentation
D = period specialist publication
E = reputable specialist catalogue
F = verified owner/vehicle observation
G = forum/community claim
H = model inference
```

Important: "confidence" should not replace provenance.

Example:

```text
confidence = high
source_tier = G
```

should still mean "high-confidence community evidence", not "factory-confirmed".

---

# 10. New research area: Heritage Certificate / research-enquiry workflow

JDHT currently provides:

- Heritage Certificates
- make/model confirmation from a chassis/VIN
- research enquiries

but there are access and publication restrictions on archive research. JDHT explicitly notes that archive research is private research and that findings should not be explicitly shared with other parties without appropriate permission. citeturn476299search7

Therefore the database should distinguish:

```text
externally_shareable_fact
private_research_result
source_reference_only
restricted_archive_reference
```

Do not copy sensitive or restricted archive material into a distributable knowledge base.

The system can store:

```text
"JDHT confirmation exists"
date
request/reference
result summary
source classification
sharing permission
```

without automatically storing the underlying restricted material.

---

# 11. New research area: physical-photo evidence

The project will benefit enormously from verified photographs.

Create an `evidence_observation` model:

```text
observation
  observation_id
  vehicle_id
  identifier/location
  observed_value
  photo_ref
  observer
  observed_date
  source_type
  confidence
  notes
```

A single photographed vehicle could establish:

```text
boot identifier = ...
B-pillar identifier = ...
windscreen identifier = ...
engine number = ...
body number = ...
```

This would let the project build an evidence corpus for difficult historical VIN questions.

---

# 12. New research area: VIN discrepancy / anomaly engine

Do not just decode valid VINs.

Create a diagnostic mode:

```text
Input identifiers:
  boot = ...
  b-pillar = ...
  windshield = ...
```

Output:

```text
✓ serial numbers agree
✓ B-pillar and windshield format agree
⚠ boot uses alternate representation
✓ model range consistent
⚠ model-year character conflicts with serial boundary
```

Possible anomaly classes:

```text
serial_mismatch
scheme_mismatch
market_mismatch
model_range_mismatch
year_mismatch
body_mismatch
invalid_character
impossible_serial_range
unknown_scheme
duplicate_identifier
possible_replacement_label
possible_rebody
possible_documentation_error
```

This is likely to become one of the most useful real-world features.

---

# 13. New research area: "negative knowledge"

A very valuable but often forgotten feature:

Store explicit impossibilities.

Examples:

```text
X100 4.2 engine cannot occur before A30645
XKR Silverstone begins at A06139
specific windscreen revision impossible before A40265
specific part unavailable before/after a breakpoint
```

Represent:

```text
constraint
  subject
  predicate
  object
  validity
  source
```

Then the inference engine can say:

> "This configuration is contradicted by three independent production constraints."

This is substantially stronger than simply saying "I found no evidence."

---

# 14. New research area: supersession as a graph, not a single old→new pair

The existing `part_supersession` design is currently one-to-one. The SNG research already found a real example where one unavailable component is replaced by multiple parts/kit components. fileciteturn4file0L47-L54 fileciteturn5file0L934-L940

Change the conceptual model to:

```text
part_relationship
  from_part
  to_part
  relationship_type
  effective_date
  effective_serial
  source
  notes
```

Relationship types:

```text
supersedes
replaces_with_kit
equivalent_to
component_of
contains
split_into
merged_from
optional_substitute
market_substitute
```

This will handle real catalogue history much better.

---

# 15. New research area: parts applicability should support multiple dimensions

Current free-text fitment data often refers to more than VIN.

Research and normalize dimensions such as:

```text
vin_serial
model_year
market
country
LHD_RHD
body
engine_family
engine_number
transmission
trim
wheel_size
brake_package
suspension_package
emissions
supercharging
production_date
option_package
interior_trim
exterior_colour
```

The existing research already identified practical fitment exceptions such as X100 driveshaft/wheel-size and camshaft-cover/engine-number cases. fileciteturn4file1L387-L395

These should become reusable structured criteria.

---

# 16. New research area: document ingestion pipeline

Because the project includes PDFs, scans and photos, build a repeatable research-ingestion workflow:

```text
document/photo
   ↓
classify
   ↓
digital text available?
   ├─ yes → extract
   └─ no  → render/OCR
   ↓
page segmentation
   ↓
candidate facts
   ↓
human/agent verification
   ↓
normalized rule
   ↓
source/provenance record
```

Each extracted fact should retain:

```text
source_document
page
region if image
raw_text
normalized_value
extraction_method
review_status
```

This prevents an OCR transcription from becoming indistinguishable from factory text.

---

# 17. New research area: source disagreement registry

Create:

```text
knowledge_conflict
  conflict_id
  subject
  property
  source_a
  value_a
  source_b
  value_b
  scope_a
  scope_b
  likely_explanation
  resolution_status
  resolution_note
```

Useful categories:

```text
different markets
different production periods
different physical identifiers
different terminology
OCR error
catalogue error
supersession timing
duplicate/reused part number
true unresolved conflict
```

This is especially important for Jaguar historical data.

---

# 18. New research area: source scope matrix

Every source should explicitly declare:

```text
source_scope:
  manufacturer
  publisher
  market
  region
  model
  model_year
  production_period
  identifier_type
  language
  intended_audience
```

Example:

```yaml
source_scope:
  publisher: Jaguar Cars Ltd
  market: [USA, Canada, Mexico]
  region: North America
  model: XK8
  years: [1997, 1998, 1999]
  document_type: parts_catalogue
```

This would have prevented many of the confusing "ROW versus Americas" mistakes.

---

# 19. New research area: human-readable rule export

The knowledge base should be able to emit both:

### Human-readable

```text
X100 / Early / North America

Position 5 = G → X100
Position 6:
  N → Canada
  S → Mexico
  X → USA

Position 7:
  E → Coupe
  F → Convertible

Source:
  Jaguar XK8 Parts Catalogue JLM 20301, 1998, page 2
```

### Machine-readable

```yaml
scheme: x100_early_north_america
position_rules:
  "5":
    G: X100
  "6":
    N: Canada
    S: Mexico
    X: USA
  "7":
    E: Coupe
    F: Convertible
```

This makes the database usable by both people and software.

---

# 20. New research area: automatically generate regression tests from documentation

Every confirmed rule should be able to generate test cases.

Examples:

```text
known VIN
expected market
expected model
expected body
expected model year
expected serial
expected scheme
expected physical-identifier relationship
```

Boundary tests are particularly important.

For X100, the current Heritage material provides useful milestones such as:

- 001001
- 001246
- 018108
- 024687
- 031303
- 042775
- A00001
- A00016
- A11051
- A24196
- A30645
- A35155
- A35171
- A36874
- A40265
- A42348
- A44686
- A45289
- A48684

These should become regression fixtures. fileciteturn3file2L165-L198

---

# 21. Research the JEPC → VIN → attributes missing link

The existing JEPC system can filter parts once it has a vehicle attribute list, but the offline installation examined so far does not contain the source that converts an arbitrary raw VIN into that attribute list. fileciteturn5file0L336-L358

This deserves dedicated reverse-engineering.

Research:

1. Inspect all JS for VIN decode calls.
2. Find exact request parameters.
3. Reconstruct request/response format from old client code.
4. Search archived documentation for the server-side response structure.
5. Look for cached VIN history or session records.
6. Search other JEPC installations for hidden lookup tables.
7. Compare known VINs with their known `A<groupId>` results.
8. Determine whether group IDs can be reconstructed from static data.
9. If impossible, allow externally supplied vehicle attributes as a legitimate first-class input.

---

# 22. Research the old JEPC backend protocol

The original application used a dead servlet backend. The code already reveals endpoints such as:

```text
doSearchProducts.jepc
```

and VIN-related online calls.

Research goal:

> Determine whether the dead backend's request/response semantics survive anywhere in archived code, screenshots, manuals, or Internet Archive captures.

Potential value:

- exact VIN→attribute algorithm
- labels for attribute groups
- old free-text search semantics
- server-side price lookup
- hidden model/attribute metadata

Do not depend on the server being alive; the objective is historical reverse engineering.

---

# 23. Research model-specific "breakpoint language"

Build a controlled parser vocabulary for phrases such as:

```text
to VIN
from VIN
from VIN ... to VIN ...
up to VIN
from engine
to engine
from date
up to date
except
only
with
without
RHD
LHD
supercharged
non-supercharged
4.0 litre
4.2 litre
NAS
ROW
Canada
USA
Mexico
Japan
```

SNG PDFs already contain natural-language equivalents of JEPC's coded VIN breakpoints and qualifiers. fileciteturn439741search48

A normalized intermediate representation should look like:

```yaml
constraints:
  - field: serial
    op: gte
    value: A30645
  - field: engine
    op: eq
    value: 4.2
  - field: supercharged
    op: eq
    value: true
```

---

# 24. Research catalogue diagrams as evidence, not decoration

The current spec already identifies:

- Flash hotspot files
- image filenames
- item numbers
- large PNG diagrams

and notes that the hotspot coordinate formula is still only a hypothesis. fileciteturn5file0L386-L437

TODO:

1. Visually validate coordinate conversion.
2. Confirm hotspot cardinality.
3. Determine whether multiple hotspots can refer to one item.
4. Determine whether one item can span several diagram regions.
5. Add screenshot-based tests.
6. Preserve diagram source references.
7. Treat diagram callouts as evidence linking part-list item numbers to physical position.

SNG PDF catalogues have the same challenge: item numbers reset per section, and the extracted text does not automatically preserve diagram mapping. fileciteturn5file0L942-L960

---

# 25. Research accessories as a special cross-cutting domain

The current specification already identifies a useful architectural exception:

- Accessories is a cross-range bucket.
- Accessories also appears nested inside individual vehicle ranges.
- The same underlying data may need to be presented under the unified Accessories branch.
- Individual accessory items may still carry their own fitment attributes. fileciteturn5file0L508-L575

Research TODO:

- find every accessory source location
- map each accessory to vehicle applicability
- preserve original JEPC location
- create one logical accessory identity
- retain all original source paths

---

# 26. Improve the specification: introduce a formal "knowledge fact"

Rather than only storing tables about parts, add a generalized concept:

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

Example:

```text
subject = X100
predicate = first_4_2L_serial
value = A30645
source = JHT
confidence = confirmed
```

Or:

```text
subject = part X
predicate = fits_engine
value = 4.2
source = SNG catalogue
```

This lets the system represent knowledge that is not naturally a part-table column.

---

# 27. Improve the specification: add "scope" to every rule

A rule should never be just:

```text
position 7 = 1 → Coupe
```

It should be:

```text
scheme = X100_new
market = ...
production_period = ...
identifier_location = ...
position = 7
value = 1
meaning = Coupe
```

This is the single best defense against applying correct rules to the wrong VIN.

---

# 28. Improve the specification: separate "fact", "rule", "inference", "observation"

These are different objects.

## Fact

Directly stated by a source.

## Rule

A reusable decoding/fitment statement derived from one or more facts.

## Observation

Something physically observed on an actual vehicle.

## Inference

A conclusion calculated from known facts/rules.

Example:

```text
FACT:
  JHT says A30645 starts 2003 MY 4.2 X100.

RULE:
  X100 serial >= A30645 permits 4.2 model family.

OBSERVATION:
  Engine label on car says 4.2.

INFERENCE:
  VIN-derived identity and engine observation agree.
```

This distinction will make the system much easier to trust.

---

# 29. Improve the specification: confidence should be multidimensional

Instead of one confidence field:

```text
confidence: 0.93
```

use:

```text
source_quality
extraction_quality
scope_match
cross_source_agreement
real_vehicle_evidence
interpretation_certainty
```

Then optionally compute an overall confidence.

This is especially useful where OCR or secondary sources are involved.

---

# 30. Improve the specification: don't force an "answer" when the evidence is incomplete

The system should be able to return:

```text
DECODED
PROBABLE
POSSIBLE
CONTRADICTED
UNRESOLVED
```

rather than always returning a model/body/year.

Example:

```text
VIN scheme: probable
Vehicle family: confirmed X100
Market: probable USA
Model year: unresolved
Body: confirmed coupe
Serial: confirmed 031303
```

This is safer and more useful than a fabricated exact result.

---

# 31. Improve the specification: source-backed explanations

Every public-facing fitment result should be able to answer:

> Why do you think this part fits?

Example:

```text
Fits because:
  ✓ X100 model range
  ✓ VIN A30645+ 
  ✓ 4.2L
  ✓ RHD

Evidence:
  JEPC occurrence ...
  SNG Barratt catalogue page ...
  Jaguar technical document ...
```

And for a rejection:

```text
Does not fit because:
  ✗ production VIN before A30645
```

with the supporting source.

---

# 32. Improve the specification: "why not?" query

Add a diagnostic query:

```text
Why doesn't part P fit vehicle V?
```

Return each failed constraint.

This will be extremely useful for:

- customer support
- internal debugging
- resolving apparent source conflicts
- learning unknown `A<groupId>` meanings

---

# 33. Improve the specification: "what changed at this VIN?"

Very useful query:

```text
What changed around VIN A30645?
```

Expected answer:

```text
Production boundary:
  A30645

Known changes:
  4.2L introduced
  X103 designation
  parts changed: ...
  JEPC model split: 3173
  SNG references: ...
```

This can become one of the system's most interesting research interfaces.

---

# 34. Improve the specification: serial-range browser

Add a timeline UI:

```text
1996 ─── 1997 ─── 1998 ─── 1999 ─── 2000 ...
        |          |         |
       001246     018108    031303
```

Clicking a boundary shows:

- model
- known factory changes
- part changes
- documentation sources
- relevant special editions
- VIN rules
- affected accessories

---

# 35. Improve the specification: vehicle identity page

A decoded car should have a dedicated identity page:

```text
Jaguar XK8 / X100

Identity
  serial
  VIN scheme
  market
  model year
  body
  production period

Physical identifiers
  boot
  B-pillar
  windshield

Factory attributes
  engine
  transmission
  emissions
  trim
  options

Evidence
  sources
  observations
  conflicts

Parts
  fitting now
  possible
  excluded
```

This is the natural home for the future VIN engine.

---

# 36. Improve research process: use a research matrix

For every question:

```text
question
candidate answer
sources searched
positive evidence
negative evidence
scope
confidence
unresolved alternatives
next action
```

Example:

| Question | Current conclusion | Next research |
|---|---|---|
| Early US boot VIN differs? | Strong working evidence | Factory/regulatory examples |
| B-pillar = windshield? | Strong working evidence | Verify with multiple cars |
| all A/B/C share last 6 digits? | Domain observation | Collect paired examples |
| 2000+ all identical? | Strong working hypothesis | Find physical/document examples |
| Japan exception? | unresolved | Japanese-market documentation |

---

# 37. Improve research process: prioritize high-leverage unknowns

Recommended order:

## Priority 1 — VIN identity
1. Early X100 Americas A/B/C relationship.
2. Exact ROW vs Americas schemes.
3. Japan.
4. 2000+ transition.
5. Serial numbering and boundaries.

## Priority 2 — JEPC vehicle attributes
6. VIN→attribute path.
7. Meaning of `A<groupId>`.
8. Attribute labels / lookup tables.

## Priority 3 — fitment engine
9. Normalize all VIN breakpoint syntax.
10. Normalize all attribute qualifiers.
11. Build contradiction handling.
12. Build test suite.

## Priority 4 — EPC completeness
13. Hotspot validation.
14. diagram mapping.
15. supersession graph.
16. Accessories reconciliation.

## Priority 5 — secondary sources
17. SNG PDF import.
18. historical Jaguar technical/marketing material.
19. aftermarket cross-reference data.

---

# 38. Improve research efficiency: make Codex the pipeline-builder, not the bulk researcher

Because the current Codex allowance is limited, avoid repeatedly feeding whole PDFs/images to an agent.

Preferred workflow:

```text
Local scripts:
  PDF discovery
  text extraction
  OCR
  page rendering
  duplicate detection
  hashing
  document metadata

Codex:
  design parser
  classify difficult documents
  extract candidate rules
  investigate contradictions
  write/update parsers
  generate tests
  review research results

Database:
  permanent structured knowledge
```

This is especially important because the current project already has a large number of semi-structured local files and PDFs.

---

# 39. Improve document ingestion: deduplicate before analysis

Many Jaguar documents will be:

- republished
- mirrored
- renamed
- translated
- scanned multiple times

Before expensive analysis:

```text
SHA-256
↓
exact duplicate?
↓ no
text fingerprint
↓
near duplicate?
↓
same document, different scan?
```

This will greatly reduce repeated research.

---

# 40. Improve document ingestion: store raw + normalized evidence

Never replace original extracted text.

Store:

```text
document
document_page
raw_text
ocr_text
normalized_text
extracted_fact
```

That allows later correction of OCR without losing the original evidence chain.

---

# 41. Improve document ingestion: image regions matter

For difficult PDFs, store:

```text
page number
bounding box
image crop
OCR text
```

This is particularly important for:

- VIN tables
- diagrams
- labels
- small footnotes
- "from VIN / to VIN" clauses
- factory plates

---

# 42. Improve model taxonomy

The existing Range taxonomy is good, but add:

```text
generation
platform/chassis code
marketing_model
internal_model_id
catalogue_model_id
range
variant
market_variant
production_variant
```

Do not make one field carry all those meanings.

---

# 43. Improve third-party source architecture

The current third-party investigation has already established useful distinctions:

- JLR Classic Parts: suitable for automated reference-price/availability use.
- Nimark: machine-readable aftermarket cross-reference source.
- SNG website: not suitable for automated scraping.
- SNG PDF catalogues: valuable separate offline source. fileciteturn3file0L42-L57

Keep those as independent source adapters.

Do not turn "source available" into "source authoritative".

---

# 44. Improve SNG integration: use it mainly as corroboration first

For the first SNG import:

1. Parse part number.
2. Parse qualifier.
3. Parse VIN range.
4. Store source-specific record.
5. Compare to JEPC.
6. Surface differences.
7. Only later promote validated mappings into shared normalized knowledge.

The existing research already recommends source-tagged overlay rather than blind merge. fileciteturn5file0L1111-L1161

---

# 45. Improve inventory integration: distinguish "vehicle fitment" from "stock provenance"

The existing notes correctly distinguish:

- the part's catalogue fitment
- the specific donor car from which a physical inventory item came
- vendor purchase information

These should stay separate.

This can enable an extremely useful future feature:

> "Show me cars from my own donor inventory from which this part actually came."

The donor vehicle schema already stores VIN and model and is intended to support vehicle-specific search. fileciteturn5file0L99-L109

---

# 46. Novel idea: evidence-backed vehicle twins

Create an internal "digital identity" record for each known donor/observed vehicle:

```text
Vehicle Twin
  canonical identity
  physical identifiers
  factory configuration
  observed configuration
  installed/replaced components
  donor history
  photos
  documents
  current confidence
```

This can later answer:

> "Which parts in my stock came from cars with this exact factory configuration?"

---

# 47. Novel idea: knowledge graph relationships

Eventually represent:

```text
VIN ──identifies──> Vehicle
Vehicle ──belongs_to──> Model
Vehicle ──has_attribute──> AttributeValue
Vehicle ──built_in──> ProductionRange
Vehicle ──may_use──> Part
Part ──appears_in──> Diagram
Part ──supersedes──> Part
Part ──equivalent_to──> VendorPart
Rule ──supported_by──> Source
Observation ──supports──> Fact
```

A relational database can implement this perfectly well; "knowledge graph" is conceptual, not a requirement to use a graph database.

---

# 48. Novel idea: explanation-first API

Instead of:

```text
GET /parts?vin=...
```

internally model the result as:

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

Then every UI can explain the result.

---

# 49. Novel idea: "research assistant mode"

An admin should be able to ask:

> Why is this part listed as fitting X100 4.0 but not my car?

The assistant should retrieve structured evidence, not invent an answer.

The answer pipeline:

```text
question
↓
candidate facts/rules
↓
source retrieval
↓
constraint evaluation
↓
explanation
↓
links to evidence
```

---

# 50. Novel idea: knowledge decay / source freshness

Some sources are snapshots.

Add:

```text
source_snapshot_date
valid_from
valid_until
retrieved_date
```

This matters particularly for:

- live vendor pricing
- historical JEPC installations
- web product pages
- catalogue revisions

The existing price model already recognizes multiple historical JEPC price snapshots rather than one current value. fileciteturn4file1L282-L307

Apply the same idea to source-backed knowledge generally.

---

# 51. Novel idea: change-detection on future research

Once a source is ingested:

```text
source v1
↓
source v2
↓
diff
```

Detect:

- new VIN boundary
- altered description
- new supersession
- new option code
- removed part
- changed qualifier

This makes the knowledge base maintainable rather than one-time imported.

---

# 52. Specification changes to make now

## Must add

### A. Vehicle identity domain

```text
vehicle
identifier
identifier_scheme
identifier_equivalence
serial_range
production_event
vehicle_attribute
vehicle_observation
```

### B. Evidence domain

```text
source
source_scope
source_document
source_excerpt
knowledge_fact
knowledge_rule
knowledge_conflict
```

### C. Fitment domain

```text
fitment_criterion
fitment_rule
fitment_result
```

### D. Relationship domain

```text
part_relationship
vehicle_relationship
identifier_relationship
```

---

# 53. Suggested data relationships

```text
vehicle
  ├── vehicle_identifier
  │      └── identifier_scheme
  │
  ├── vehicle_attribute
  │
  ├── vehicle_observation
  │
  ├── production_event
  │
  └── fitment_result

jepc_part
  └── jepc_part_occurrence
         ├── fitment_rule
         ├── part_data_source
         ├── part_verification_flag
         └── part_relationship

knowledge_fact
  └── source_evidence

knowledge_conflict
  ├── evidence_a
  └── evidence_b
```

---

# 54. Specific changes to current specification

## 54.1 Extend `jepc_part_occurrence`

Add:

```text
source_context_id
fitment_rule_set_id
```

Do not put every new criterion into columns.

## 54.2 Replace one-to-one supersession assumption

Evolve:

```text
part_supersession
```

into a general relationship table supporting 1:N and N:1.

## 54.3 Extend `donor_vehicle`

Add:

```text
identity_status
identity_confidence
identifier_set
factory_configuration_status
observed_configuration_status
```

## 54.4 Add source provenance to vehicle rules

Every VIN rule must have:

```text
source_id
page/reference
scope
status
```

## 54.5 Add research status

Every unresolved research item should use:

```text
open
investigating
provisionally_resolved
confirmed
rejected
superseded
```

---

# 55. Concrete research TODO list

## Phase A — VIN foundation

- [ ] Gather official Jaguar/JDHT VIN/chassis documentation for X100.
- [ ] Establish early Americas boot vs B-pillar/windscreen relationship.
- [ ] Establish whether last six digits are invariant across A/B/C using multiple examples.
- [ ] Verify post-2000 A/B/C equality.
- [ ] Research Japan separately.
- [ ] Build complete X100 early ROW rule table.
- [ ] Build complete X100 early North America rule table.
- [ ] Build complete 1999 transition table.
- [ ] Build complete 2000+ rule table.
- [ ] Document exceptions and ambiguous cases.
- [ ] Generate machine-readable rule files.
- [ ] Generate regression tests.

## Phase B — JEPC VIN integration

- [ ] Find offline VIN→attribute data if it exists in other installations.
- [ ] Trace all client-side VIN decode calls.
- [ ] Reverse engineer dead backend request/response format.
- [ ] Inventory all `A<groupId>` values.
- [ ] Cluster attribute IDs by known vehicle properties.
- [ ] Create candidate group/value labels.
- [ ] Validate labels against independent sources.
- [ ] Publish only confirmed mappings as confirmed rules.

## Phase C — production knowledge

- [ ] Build X100 serial timeline.
- [ ] Build XJ/XJS/X-Type/S-Type/XK/XE/F-Type etc. timeline.
- [ ] Crosswalk model/platform/chassis codes.
- [ ] Record production events.
- [ ] Record model-year versus actual production-date distinctions.
- [ ] Record market-specific transitions.

## Phase D — fitment knowledge

- [ ] Normalize JEPC C-records.
- [ ] Normalize SNG free-text VIN constraints.
- [ ] Normalize engine-number constraints.
- [ ] Normalize wheel/brake/suspension constraints.
- [ ] Normalize LHD/RHD.
- [ ] Normalize engine/transmission/trim attributes.
- [ ] Build generalized constraint evaluator.
- [ ] Generate "why fits?" and "why not?" explanations.

## Phase E — diagrams

- [ ] Validate JEPC hotspot coordinate conversion.
- [ ] Verify item↔hotspot cardinality.
- [ ] Build normalized diagram records.
- [ ] Add source screenshot/page reference.
- [ ] Build whole-car zone mapping.
- [ ] Investigate SNG diagram extraction.

## Phase F — source expansion

- [ ] Download/parse selected SNG PDFs.
- [ ] Build source-specific overlay.
- [ ] Research Jaguar technical bulletins.
- [ ] Research Jaguar owner/service handbooks.
- [ ] Research period dealer literature.
- [ ] Research historical option/trim catalogues.
- [ ] Research regulatory/homologation sources.
- [ ] Build source-scope matrix.

## Phase G — real vehicle corpus

- [ ] Collect paired A/B/C identifier examples.
- [ ] Record market and production date.
- [ ] Obtain photographic evidence where legally/shareably possible.
- [ ] Record engine/body/gearbox numbers.
- [ ] Record title/document relationship where permitted.
- [ ] Create verified vehicle test cases.

---

# 56. Highest-value initial deliverable

Before trying to decode every Jaguar ever made, build:

## `x100-vin-knowledge/`

```text
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

Then implement:

```text
decode(identifier, context)
```

where context can include:

```text
market
country
physical_location
production_period
known_model
```

The decoder should be allowed to say:

```text
UNKNOWN
NEEDS_CONTEXT
```

instead of guessing.

---

# 57. Research acceptance criteria

A VIN rule should become `confirmed` only when:

1. The source clearly scopes it.
2. The identifier scheme is known.
3. The physical identifier context is known.
4. At least one primary/near-primary source supports it.
5. No unresolved higher-quality source contradicts it.
6. At least one concrete VIN test passes.
7. Boundary behavior has been tested where applicable.

For difficult historical rules, two independent sources should ideally agree.

---

# 58. Final architectural principle

The project should ultimately be able to answer:

> **"What do we know, why do we know it, what is merely inferred, and what remains uncertain?"**

That is more valuable than a conventional VIN decoder.

The mature system would therefore combine:

```text
IDENTITY
  Who/what is this Jaguar?

PROVENANCE
  Where did we learn each fact?

CONSTRAINTS
  What can/cannot apply?

CATALOGUE
  What parts exist?

FITMENT
  What parts fit this exact vehicle?

CONFIGURATION
  What could this vehicle have had from factory?

OBSERVATION
  What do we actually see on this particular car?

UNCERTAINTY
  What remains unresolved?

EXPLANATION
  Why did the system reach this conclusion?
```

That is the natural evolution of the existing Jagports JEPC work into a **Jaguar Vehicle Knowledge & EPC System**.

---

## Sources and anchors

### Existing project material
- JEPC local data and architecture: `turn6file0`
- Current schema / part identity / donor vehicle / provenance / manual verification: `turn4file0`, `turn4file1`
- Current JEPC attribute and VIN-breakpoint decoding: `turn5file0`
- Current model-range taxonomy: `turn5file0`
- Current SNG/JLR/Nimark reconnaissance: `turn3file0`
- Current SNG PDF research: `turn5file0`

### Current web research used for this expansion
- JDHT archive and Heritage Certificate information:
  https://www.jaguarheritage.com/archive-services/certificates/
- JDHT archive/research enquiry terms:
  https://www.jaguarheritage.com/archive-services/research-enquiry/
- JDHT research/model confirmation:
  https://www.jaguarheritage.com/research_enquiry/confirm-make-and-model/
- JDHT Vehicle Numbers Locator Guide:
  https://www.jaguarheritage.com/jdht/wp-content/uploads/RG002-Vehicle-numbers-locator-Guide-v.6-10-02-2023.pdf
- Jaguar X100 production/VIN reference examples:
  https://www.jaguarforums.com/forum/attachments/xk8-xkr-x100-17/books-293630/xk8-x100-chassis-numbers-230422d1765048146
- Jaguar X100 / model-code technical reference:
  https://www.jaguarforums.com/forum/attachments/general-tech-help-7/jaguar-x-type-x200-hi-beam-not-working-284487/31tl-02-2005modeldesig_pdu-228953d1728830563
- SNG Barratt XK8 catalogue:
  https://cdn.sngbarratt.com/catalogues/new/sng_cat_xk8_en.pdf

