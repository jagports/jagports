# VIEPS Domain Knowledge

## Scope

This file contains durable, reusable VIEPS domain decisions that must survive individual Issues, PRs and implementation changes. It is not a second implementation specification. Detailed schema, stock, importer and UI requirements remain in their owning work records and authoritative specifications.

Repository-wide workflow and governance remain defined by the repository root `KNOWLEDGE.md`, `00-Management/WORKFLOWS.md`, `00-Management/RULES.md` and `SKILL.md`.

## Source-of-truth hierarchy

VIEPS work must use existing accepted research before starting new discovery.

1. **Parts Data Model / #354** owns the canonical normalized model and schema implementation.
2. **Stock research / #353** owns operational stock-model validation and reconciliation.
3. **JEPC importer / #355** owns JEPC source inspection, source-to-MVP mapping and importer behaviour.
4. **VIEPS UI requirements / #360** owns the implementation-ready UI requirements and data mapping.
5. **JEPC supersession knowledge / #364** owns the reusable supersession research.
6. **Specialized research / #352, #361, #362** owns hotspot, zone/taxonomy and third-party research respectively.
7. Existing Jagports Excel and other source material is evidence; it is not itself the database schema.

When an existing work record answers a question, future work should validate applicability rather than repeat discovery.

## Core architectural boundary

VIEPS distinguishes reference/catalogue knowledge from mutable Jagports operational data.

```text
JEPC / vehicle reference knowledge
              │
              ▼
      CATALOGUE / REFERENCE
              │
              ▼
        JAGPORTS STOCK
              │
              ▼
     mutable operational data
```

A catalogue part describes what a part is and its reference/application context. A stock record describes what Jagports possesses and how that physical stock is managed. Mutable inventory state must not be embedded in JEPC reference records.

## Canonical identity versus context

A canonical `part` represents a catalogue identity. The same catalogue part may occur in several EPC contexts and must not be duplicated merely because it appears in multiple diagrams, categories, applications or model contexts.

Use occurrence/context relationships for EPC, fitment, model, diagram and similar context. Preserve separate source/batch identity where source provenance requires it. A duplicate Jaguar part number is not by itself proof that source rows should be merged.

A separate source/batch identity is important where source rows with the same part number represent distinct imported stock/provenance batches or otherwise need separate traceability. Do not silently discard that distinction merely because the canonical part number is identical.

The detailed persistent entity definitions, constraints and fixtures belong to #354 and its authoritative implementation documentation.

## Vehicle and VIN boundary

`model_range`, `model`/`variant` and `vin_range` are distinct concepts. VIN decoding is a vehicle-context capability: decoded VIN information may constrain fitment/application selection, but VIN decoding itself is not part of the catalogue-part identity.

The existing VIN research has demonstrated useful structured evidence dimensions including VIN prefix, serial start/end, model year, production/use-introduction boundary, market, body, engine/engine-variant discriminator, emissions discriminator, transmission/steering discriminator, source and confidence/verification state. Preserve the distinction between source facts and decoded/derived interpretation where practical.

The detailed VIN schema and decoder implementation are owned by their dedicated VIN work, not by this knowledge file.

## Fitment and source attributes

Fitment is a relationship, not merely descriptive text on a part. Where source data provides inclusion/exclusion semantics, those semantics must be preserved. Opaque JEPC attributes must not be assigned invented meanings; verified semantic interpretation may be stored separately from the original source representation.

The authoritative fitment implementation and JEPC attribute mapping belong to #354/#355 and the approved VIEPS UI contract in #360.

## Catalogue role and fitment context

VIN and configuration describe vehicle context. Fitment relates that context and a catalogue role to a part.

“Catalogue role” describes the contextual item/function being fulfilled. It is not a part identity or, by itself, a requirement for a new table. Its mapping to the approved occurrence/category/item model must be established before implementation.

A shared part retains its identity across multiple applicable contexts. Vehicle-to-part selection and part-to-applicable-context lookup may query the same relationships. This does not require copying a vehicle list into each part record or prescribing a new user-interface workflow.

## Reference location versus stock location

Two meanings of location remain separate:

- **Vehicle/catalogue location** — where the part belongs on the vehicle.
- **Stock/storage location** — where Jagports physically stores the stock.

The first belongs to catalogue/occurrence/location modelling; the second belongs to operational stock. Do not infer one from the other.

## Operational STOCK persistence

The native VIEPS MVP operational STOCK persistence path uses Cloudflare D1 through the Worker `DB` binding. D1 is the current persistence/provider implementation for Jagports-owned stock; it is not part of canonical PART identity and must not pull catalogue, JEPC, fitment or supersession authority into the stock backend.

The executable database shape is created by the ordered, reviewed SQL migration chain under the production Worker. Repository Markdown describes the model but does not recreate a parallel schema. Existing applied migrations are not rewritten; schema evolution is additive through a new reviewed migration.

A clean local or test database is derived from an empty target plus the complete ordered migration chain. Local, preview and production D1 states and migration ledgers are separate evidence domains. Validation must identify which environment was exercised and must not present local/preview state as production state.

Deterministic catalogue and STOCK fixtures are test inputs only. Synthetic fixture rows prove behavior but are not evidence that Jagports physically owns those items. The repository-controlled linked `jagports-parts.xlsx` and `jagports-parts-stock.xlsx` workbooks are the current Jagports live inventory source and are valid operational evidence when a source row is traced explicitly. Their workbook structure is not the VIEPS database schema. Live inventory facts imported or copied for validation must retain workbook/row provenance and become persisted operational records through the approved application/database path.

The repository-controlled linked workbooks under `5-Implementation-Projects/base/jagports/excel/jagports Excels/` — `jagports-parts.xlsx` and `jagports-parts-stock.xlsx` — are the current live Jagports inventory source. Their operational values are real STOCK evidence, not demo/fixture data. When used by VIEPS, preserve workbook/row provenance and normalize the legacy split quantity/location model without inventing missing fields.

The D1 implementation should remain thin enough to sit behind a stock-provider boundary without moving canonical PART or JEPC logic into the provider. A future external provider can use a different persistence model while VIEPS retains the same catalogue/stock separation.

## Provenance and evidence

Source facts, normalized values, derived interpretations and verification state must remain distinguishable where the distinction matters. Imported or migrated data must remain traceable to its source without depending on an obsolete spreadsheet formula or hidden agent knowledge.

Detailed field mappings and operational provenance rules are owned by #353/#354 and the relevant importer/research records. This file records the principle, not a duplicate field-by-field specification.

## UI and repository assets

The VIEPS UI concept package and WDS/UFM silhouette assets are repository-resident design/source material, not by themselves authoritative domain semantics. PR #366 established the asset/design baseline; #360 remains the authoritative UI requirements record.

UI implementation must consume the domain model rather than redefine it. Missing source data must remain explicitly unknown/empty rather than being invented to make the screen appear complete.

The detailed three-pane layout, parts-tree behaviour, fitment presentation, supersession indicators, hotspot mapping, silhouette behaviour and UI-to-data table belong to #360. Hotspot conversion remains governed by #352.

## Supersession boundary

Supersession is a catalogue relationship and must not overwrite the identity of an existing stocked part. The reusable supersession research is owned by #364; the persistent relationship is implemented under #354.

This file records only the architectural boundary so the same rule is not re-specified in multiple places.

## JEPC importer boundary

The JEPC importer populates the catalogue/reference layer from the defined JEPC source dataset. It is not an inventory importer and must not filter catalogue data by current Jagports stock state.

Source structure, mapping, validation, repeatability/idempotency and importer failure behaviour belong to #355. The importer must consume the approved #354 model rather than redefine it.

## MVP boundary

The VIEPS MVP should build on the smallest coherent reference/parts/occurrence/fitment/stock foundation needed by the approved MVP work. Specialized extensions must not silently become prerequisites.

In particular, unresolved hotspot conversion, complete whole-car zone taxonomy/geometry, complete third-party modelling, complete VIN decoding and external catalogue synchronization must not be introduced as hidden prerequisites for the basic Stock MVP unless separately approved.

Detailed MVP schema and acceptance criteria belong to #354; importer acceptance criteria belong to #355; UI acceptance criteria belong to #360.

## Decision discipline

When a consequential domain decision remains unresolved, keep it explicitly unresolved and follow the project's decision workflow. Do not silently convert an Excel convention, JEPC field, UI mock-up or derived research interpretation into an authoritative database rule.

Durable knowledge should capture the decision and its source-of-truth owner once. It should not duplicate detailed implementation specifications already maintained in the owning Issue, PR or authoritative repository document.

## Traceability

- **#353** — operational stock research and reconciliation.
- **#354** — canonical Parts Data Model and database implementation.
- **#355** — JEPC Data Importer.
- **#360** — VIEPS UI MVP requirements.
- **#364** — reusable JEPC supersession knowledge.
- **#366** — UI concept and WDS/UFM asset/design baseline.
- **#352 / #361 / #362** — specialized hotspot, zone/taxonomy and third-party research.

This file is intentionally the durable cross-cutting knowledge layer between those work records; it is not a replacement for them.

## JEPC source interpretation and VIEPS migration

JEPC's local catalogue source is a collection of interrelated files. Many files with an XML extension contain an XML wrapper around bracketed, comma-separated records; diagram hotspot files use element-based XML. A SQL database produced from those files is an import result or intermediate representation, not the original source.

JEPC's decision-tree nodes describe source navigation and conditional context. Interpret that logic during import/migration; do not reproduce decision-node traversal as the VIEPS operational model or require users to traverse it to reach applicable parts. VIEPS must expose the resulting part, occurrence, applicability, category and diagram relationships through the approved Parts Data Model. This does not prohibit useful category browsing or authorize a parallel production schema.

Source nodes may be retained as research or transformation evidence. Their retention does not make them destination-domain entities. The number of tools and the choice of an intermediate storage format are separate implementation decisions.

Do not flatten conditions into independent part-to-vehicle matches if doing so loses exclusions, alternatives, source context or unknown information. Validate the transformation against source behavior before claiming equivalent applicability. A missing vehicle attribute is not proof of positive fitment.

## JEPC file relationships and evidence discipline

Language-specific top-level item files carry item numbers and descriptions that link to item drilldown files and diagram hotspots. They are structural records with localized text, not merely a translation lookup. Category menu files and category navigation popup files also have distinct roles; a breadcrumb alone does not replace explicit parent relationships.

Applicability sidecars have different key scopes at category, top-level item and individual application levels. Preserve those scopes, repeated records and condition boundaries during interpretation. A flag's meaning depends on its record family: serial-boundary direction and attribute exclusion are not interchangeable concepts. Unknown fields and attribute-code meanings must remain explicitly unresolved until verified.

An application ID can recur on several leaf rows under different decision paths within the same item file. Preserve path/row evidence separately from logical occurrence identity; repeated paths do not require duplicate canonical parts. Application sidecars may cover only some displayed conditions, so their contents alone are not proof of complete applicability. Supporting examples are recorded in the [applicability refinement evidence](../../../../../7-Research/jlr/JEPC/JEPC_APPLICABILITY_MODEL_REFINEMENT.md).

Source market distinctions can occur below a shared model, in category/application context. A market-specific model row is not a prerequisite for retaining those conditions. Preserve raw category markers and explicit country/market branches separately until their normalized vocabulary is established; do not infer steering configuration or component side from a market label.

Treat research notes and prototype importer output as evidence with limits, not automatically as specification authority. Newer commits can supersede older hypotheses, but recency alone does not establish correctness. Reconcile claims with the actual source files, consuming application code and explicit accepted product decisions. Discover installed paths rather than assuming that study-sample placement is the installation layout.

## JEPC illustration and hotspot relationships

A logical illustration reference can identify both an image asset and a separate hotspot XML file. One diagram item number can have multiple hotspot regions within the same image. Do not constrain image plus item number to a single rectangle.

Image existence, hotspot-file existence, XML parseability and correct coordinate conversion are separate verification results. Preserve original geometry and dimensions until the conversion is established by the owning hotspot research. Do not label coordinates as pixels merely because an image is present, or assume every illustration has a corresponding hotspot file.

For large file-based installations, prefer the existing file inventory and a bounded vehicle/model subset for investigation. Expand to shared files only where the selected subset needs them. A measured language subset is not an implicit product decision to exclude other languages.

Supporting source evidence and outstanding validation limits are recorded in [JEPC XK source audit](../../../../../7-Research/JEPC_XK_SOURCE_AUDIT.md).