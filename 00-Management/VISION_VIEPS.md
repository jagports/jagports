# VIEPS Vision

## Purpose

VIEPS is the Jagports Vehicle Information and EPC System. Its purpose is to turn fragmented Jaguar catalogue, vehicle, fitment, diagram, research, and stock information into one evidence-backed product that can answer practical parts questions without hiding uncertainty or mixing reference knowledge with mutable inventory.

This document defines the durable product vision. It does **not** replace the detailed Parts Data Model, importer specifications, UI specifications, stock specifications, roadmap Issues, or implementation acceptance criteria.

## Vision statement

**Build a trustworthy Jaguar vehicle and parts information platform that connects canonical part identity, EPC context, verified applicability, diagrams and vehicle location, provenance, and real stock availability so users can find, understand, and source the correct part with explicit evidence and uncertainty.**

Longer term, VIEPS should support multiple stock providers and sellers, broader Jaguar knowledge, marketplace capabilities, and multi-tenant white-label delivery without fragmenting the underlying canonical Jaguar/parts knowledge model.

## Product outcomes

VIEPS should progressively enable users to:

- find a canonical Jaguar PART by part number, catalogue context, vehicle/Range context, physical vehicle location, search text, and later VIN/vehicle identity where evidence supports it;
- understand where a part occurs in the catalogue and which vehicle/model/Range/variation contexts are applicable;
- distinguish confirmed applicability, exclusions, unavailable information, and unresolved source semantics rather than receiving fabricated certainty;
- inspect diagrams, images, item/hotspot relationships, location information, supersession, and source evidence where those relationships are actually known;
- distinguish current operational stock from catalogue/reference knowledge;
- identify available stock from Jagports and later from independent sellers or external inventory systems through stable provider boundaries;
- use multilingual UI and catalogue data without confusing UI language with the language of imported source material;
- retain evidence and provenance so later research can improve interpretation without destroying original source facts.

## Core product model

The central product boundary is:

```text
Jaguar / JEPC / research source evidence
                 │
                 ▼
     CANONICAL REFERENCE KNOWLEDGE
                 │
        ┌────────┼─────────┐
        │        │         │
      PART   OCCURRENCE  APPLICABILITY
        │        │         │
        ├── diagrams / images / location
        ├── supersession / relationships
        └── provenance / verification
                 │
                 ▼
             STOCK LAYER
                 │
        ┌────────┴─────────┐
        │                  │
 Jagports/native stock   external sellers/providers
```

The canonical reference layer describes what a part is and where it applies. The stock layer describes who has a physical part, its quantity, quality/condition, price, location, availability, and other mutable commercial/operational facts.

## Product principles

### 1. One canonical PART identity

A catalogue part must remain one canonical identity even when it appears in multiple EPC contexts, diagrams, vehicle Ranges, languages, seller systems, or stock records.

Context belongs in explicit relationships rather than duplicated PART records.

### 2. Evidence before inference

Source facts, normalized values, Jagports interpretation, derived values, confidence, and verification status must remain distinguishable where that distinction matters.

VIEPS must not invent Jaguar catalogue, VIN, fitment, location, geometry, supersession, or status facts merely to make the user experience appear complete.

### 3. Unknown is a valid product state

The system must distinguish at least:

- confirmed match/applicability;
- confirmed exclusion/no-match where supported;
- unavailable source information;
- unresolved or not-yet-interpreted source information;
- technical/import failure.

A missing fact must not silently become a negative answer.

### 4. Catalogue and stock remain separate

Mutable stock, seller, quantity, price, quality, availability, storage location, and donor/source operational data must not be embedded into immutable catalogue identity or JEPC reference records.

Likewise, a stock backend must not become authoritative for canonical PART, JEPC, fitment, supersession, or Jaguar vehicle knowledge.

### 5. Fixtures are tests, not production authority

Deterministic fixture data is valuable for development, automated tests, demonstrations, and stable acceptance paths. Production capability must progressively transition to verified imported real data while retaining fixtures as a test substrate.

The UI/API boundary should not require redesign when a fixture-backed path is replaced with imported data.

### 6. Preserve source provenance

Imported and researched information must retain sufficient provenance to explain where important facts came from and permit later correction or reinterpretation.

Original source evidence should not be destroyed merely because VIEPS has produced a normalized interpretation.

### 7. Stable domain boundaries, replaceable infrastructure

Cloudflare, D1, object storage, inventory applications, marketplace engines, payment systems, shipping services, and AI integrations are implementation/provider choices rather than the VIEPS domain model itself.

Hosting and external services may evolve without forcing a redesign of canonical PART identity and the core reference/stock separation.

### 8. Reuse mature generic capabilities

VIEPS should implement Jagports-specific Jaguar/parts intelligence itself while preferring mature external systems for generic capabilities when doing so reduces implementation and maintenance effort without surrendering VIEPS domain authority.

This applies especially to inventory backends, commerce, payments, seller onboarding, shipping, accounting, messaging, and similar commodity capabilities.

## Search and discovery direction

The product should converge on multiple complementary paths into the same canonical information model, including:

- exact and partial part-number search;
- Parts Tree / EPC hierarchy navigation;
- Jaguar Range, model, and variation context;
- vehicle-location navigation;
- suitability/applicability filtering;
- multilingual free-text search;
- shareable deep-linked search state;
- VIN/vehicle identity context when the underlying evidence and decoder contracts are mature enough.

These are alternative entry points into one product model, not separate data silos.

## Fitment vision

Fitment should become explainable rather than a simple opaque yes/no result.

Where source data supports it, VIEPS should be able to show why a part applies or does not apply, including relevant Range/model/variation context, VIN boundaries, source attributes, exclusions, and uncertainty.

The system must preserve opaque source conditions when their meaning is not yet verified rather than assigning a plausible but unsupported interpretation.

## Diagram, image, and location vision

VIEPS should connect catalogue occurrences to exploded diagrams, item/hotspot relationships, part images, and vehicle-location context where evidence exists.

Geometry conversion and vehicle-location mapping must be evidence-backed. Missing or unsupported geometry/location must remain explicit rather than being synthesized.

## Multilingual vision

VIEPS should support international use while keeping two language concerns distinct:

- **UI locale** — the language of VIEPS controls and static application text;
- **catalogue/source language** — the language of imported Jaguar/JEPC descriptions and related source data.

Canonical identities and relationships must not depend on localized display text.

## Stock-provider direction

VIEPS should expose a stable stock-facing contract that can support different backends over time.

Expected direction:

```text
StockProvider
   ├── JagportsD1StockProvider
   ├── InvenTreeStockProvider
   └── future seller API/feed/marketplace providers
```

The current Jagports D1 stock implementation should be retained where practical and can become the first provider behind that boundary. External providers remain authoritative for their own inventory state, while VIEPS remains authoritative for canonical Jaguar/parts knowledge.

Provider capabilities such as live quantity, mutation, reservation, order push, fulfillment, and synchronization freshness must be explicit rather than assumed.

## Long-term commercial direction

VIEPS may evolve from Jagports' own vehicle/parts information and stock application into a broader platform with:

1. production Jaguar catalogue/knowledge coverage;
2. broader search, fitment explanation, diagrams, vehicle context, and multilingual data;
3. multiple seller/stock providers;
4. marketplace and transaction integrations using external commodity services where appropriate;
5. isolated seller/tenant operational data;
6. a multi-tenant white-label VIEPS product sharing one maintained canonical Jaguar/Jagports knowledge foundation.

White-label delivery must not create independently drifting forks of the canonical VIEPS model or shared verified Jaguar knowledge.

## Cost and scale principles

VIEPS should remain economical to operate and should use free/low-cost infrastructure efficiently while usage is small. Free-tier limitations are real constraints, but infrastructure limits should drive storage/search optimization or provider migration rather than corrupting the domain model.

Architecture should scale through explicit partitioning, indexing, provider boundaries, and controlled discovery rather than blind scans or duplicated canonical data.

## Boundaries and non-goals

VIEPS must not:

- treat JEPC source structure as the final operational domain model merely because that is how source files are organized;
- mix mutable stock facts into catalogue/reference entities;
- overwrite historical part identities when supersession is discovered;
- infer fitment from absence of contradictory data;
- treat every source condition or attribute code as semantically understood;
- use localized labels as persistent identity;
- make one seller, stock application, cloud provider, or marketplace engine authoritative for canonical Jaguar knowledge;
- turn deterministic fixture/demo data into claimed production provenance;
- expand release scope silently through implementation convenience.

## Relationship to current implementation

Current durable VIEPS domain decisions are maintained in [`../5-Implementation-Projects/internet/jagports/solution/vieps/KNOWLEDGE.md`](../5-Implementation-Projects/internet/jagports/solution/vieps/KNOWLEDGE.md).

The current MVP implementation plan is maintained in [`../5-Implementation-Projects/internet/jagports/solution/vieps/APPLICATION_PLAN.md`](../5-Implementation-Projects/internet/jagports/solution/vieps/APPLICATION_PLAN.md).

Current product sequencing and release-phase assignment are maintained in the active VIEPS product roadmap work record. The roadmap may evolve as evidence and product decisions change; this vision describes the intended product direction rather than a frozen release plan.

## Success direction

VIEPS is successful when a user can start from the information they actually have, reach one consistent Jaguar/parts knowledge model, understand the evidence and uncertainty behind the result, see real availability separately from catalogue facts, and continue through increasingly capable sourcing or marketplace workflows without losing canonical identity or provenance.
