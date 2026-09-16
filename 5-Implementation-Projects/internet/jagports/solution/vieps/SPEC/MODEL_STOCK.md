# VIEPS Stock Model

## Purpose

This document defines the VIEPS operational stock model and the normalized stock quality classification used by stock records, stock search/filtering, Stock Admin data entry, and available-part presentation.

Mutable operational stock remains separate from canonical `PART` / JEPC catalogue identity.

## Related specification files

| File | Role |
|---|---|
| [`MODEL_PART.md`](MODEL_PART.md) | Canonical catalogue `PART` identity and catalogue-side relationships. |
| [`UI_Part_Search.md`](UI_Part_Search.md) | User-facing search controls and available-part presentation. |
| [`../STOCK/SPEC_Admin_Workflow.md`](../STOCK/SPEC_Admin_Workflow.md) | Operational stock create/edit workflow and validation UI. |

## Stock/catalogue separation

Catalogue `PART` / `PART OCCURRENCE` data and operational `STOCK RECORD` data are separate.

Stock quantity, condition/status, stock quality classification, storage location, donor vehicle/reference, availability and operational notes do not mutate catalogue identity.

If stock is held under an older or superseded catalogue part number, the UI may show the supersession relationship while retaining the stocked identity.

A stock record may reference resolved catalogue identity, but unresolved stock remains explicitly unresolved.

Catalogue vehicle location and physical stock/storage location are never conflated.

Stock quality classification is operational stock data. It may be shown with an available stock result, but it must not overwrite or redefine the canonical catalogue `PART`.

## Operational stock identity

`stock_item` is the operational stock record.

It may reference canonical `part(id)` when a catalogue match is established.

`part_id` remains nullable for unresolved or non-catalogue stock.

One `PART` may have multiple independent stock records.

Stock does not assign a distinct persistent identity to every physical unit. `quantity` is the integer count of physical items represented by the stock record.

## Normalized stock quality / condition code

`stock_item.condition_code` stores the controlled stock quality / condition code.

Allowed values and their authoritative plain-text meanings are:

```text
A New / Unused / Original Package
B Used / Good Working / Known History
C Used / Usable / No warranty
D Repairs / Needs Conditioning / Spares only
E Broken / Reference / Knowledge Gains
```

The code is the stable storage, search, filter and API identity.

Human-facing labels, short descriptions and long descriptions are i18n-compatible presentation values and must not become the database identity.

### i18n field contract

Recommended presentation keys:

```text
stock.quality.A.label
stock.quality.A.short_description
stock.quality.A.long_description
stock.quality.B.label
stock.quality.B.short_description
stock.quality.B.long_description
stock.quality.C.label
stock.quality.C.short_description
stock.quality.C.long_description
stock.quality.D.label
stock.quality.D.short_description
stock.quality.D.long_description
stock.quality.E.label
stock.quality.E.short_description
stock.quality.E.long_description
```

Locale suffixes or storage columns may be chosen by the i18n implementation, but the stable code identity remains `A` through `E`.

### English presentation values

| Code | English label | English short description | English long description |
|---|---|---|---|
| `A` | New / Unused / Original Package | New or unused stock. | The part is new or unused. It may have normal storage or packaging marks, but it must not be classified as used stock. Original packaging may be present but is not required unless separately recorded. |
| `B` | Used / Good Working / Known History | Good normal used stock. | The part is used, fully working and technically safe, with normal signs of use and known history where available. Minor scratches, small stone chips, light surface rust on underbody parts, or small wear may be present. There must be no defect that prevents function or causes major cosmetic harm. |
| `C` | Used / Usable / No warranty | Usable budget or project stock. | The part is used and usable, or repairable with limited effort, but has clear visual or mechanical wear and carries no warranty classification. Visible scratches, deeper rust, small dents, dull lenses, interior wear or similar defects may be present. |
| `D` | Repairs / Needs Conditioning / Spares only | Repair, conditioning or spares stock. | The part is not a normal ready-to-fit good used part. It needs repair, conditioning, cleaning, rebuilding, combination with other parts, or other preparation before use. It may be useful as a repair base or donor for subparts. |
| `E` | Broken / Reference / Knowledge Gains | Broken, reference or learning stock. | The part is broken, incomplete, unsuitable for normal use, or not saleable as a ready-to-use spare part. It may still be useful for reference, comparison, measurement, documentation, learning, diagnosis, research, or other knowledge-gain purposes. |

### Finnish presentation values

| Code | Finnish label | Finnish short description | Finnish long description |
|---|---|---|---|
| `A` | Uusi / käyttämätön / alkuperäispakkaus | Uusi tai käyttämätön osa. | Osa on uusi tai käyttämätön. Siinä voi olla tavanomaisia varastointi- tai pakkausjälkiä, mutta sitä ei luokitella käytetyksi osaksi. Alkuperäispakkaus voi olla tallella, mutta se kirjataan tarvittaessa erikseen. |
| `B` | Käytetty / hyvä käyttökunto / tunnettu historia | Hyvä normaalikuntoinen käytetty osa. | Osa on käytetty, täysin toimiva ja teknisesti turvallinen, ja sen historia tunnetaan silloin kun tieto on saatavilla. Pinnassa voi olla normaalia käytön jälkeä, kuten lieviä naarmuja, kiveniskemiä, pientä kulumaa tai kevyttä pintaruostetta. |
| `C` | Käytetty / käyttökelpoinen / ei takuuta | Käyttökelpoinen budjetti- tai projektiosa. | Osa on käytetty ja käyttökelpoinen tai pienellä vaivalla kunnostettavissa, mutta siinä on selkeitä visuaalisia tai mekaanisia kulumia eikä luokitus sisällä takuuta. |
| `D` | Korjattava / kunnostettava / varaosiksi | Korjausta, kunnostusta tai purkuosakäyttöä varten. | Osa ei ole sellaisenaan normaali hyvä käytetty osa. Se tarvitsee korjausta, kunnostusta, puhdistusta, yhdistelyä tai muuta valmistelua ennen käyttöä. |
| `E` | Rikkinäinen / referenssiksi / tiedonhankintaan | Rikkinäinen, referenssi- tai oppimiskäyttöön. | Osa on rikki, vajaa tai normaalikäyttöön myyntikelvoton. Se voi silti olla hyödyllinen referenssinä, vertailuun, mittaukseen, dokumentointiin, oppimiseen, vian selvitykseen, tutkimukseen tai muuhun tiedonhankintaan. |

The legacy free-text `condition` column is retained as source or supplementary text. New operational logic must use the controlled `condition_code` where the accepted condition is known.

## Storage and API identity

`stock_item.condition_code` stores the normalized code value.

UI and API view-models may expose localized presentation fields such as:

```text
stock_quality_code
stock_quality_label
stock_quality_short_description
stock_quality_long_description
stock_quality_locale
```

Localized fields are derived presentation fields and must not redefine the stored stock-quality identity.

## UI presentation requirements

Static stock-quality information must be visible somewhere in the VIEPS UI where users can understand `A` through `E` before relying on stock availability results.

When an available or stocked part is presented, the UI must show the stock quality code and an i18n-compatible label/description where the current authorization level allows stock details to be shown.

When stock quality exists but cannot be shown because of authorization, the UI must use an authorization-safe limited state rather than presenting restricted details.

When stock quality is unknown or unavailable, the UI must show an explicit unknown/unavailable state rather than defaulting to any quality class.

## Stock Admin requirements

Stock Admin must capture quality by selecting the normalized `A` through `E` code.

The data-entry UI must show localized labels, short descriptions and long descriptions to reduce incorrect classification.

Free-text condition notes may supplement the code, but must not replace the normalized classification when the code is known.

Validation must reject values outside the approved `A` through `E` set.

## Search/filter requirements

Stock-quality search and filtering must use normalized codes `A` through `E`.

Search result presentation may group or filter by localized labels, but the underlying filter identity remains the code set.

Search/index authorization must not make restricted stock details discoverable to unauthorized users.

## Storage model

Named physical sites are represented by `stock_site`.

Physical locations within a site are represented by `stock_location`.

Every `stock_location` belongs to one `stock_site`.

Supported `stock_location.location_type` values are:

```text
rack
shelf
box
```

A root location may be a rack or a shelf.

A shelf may be a level on a rack or may be a root location when no rack level is used.

A box may be a child of a shelf or another box.

Recursive nesting therefore supports structures such as:

```text
Site → Rack → Shelf → Box → BoxSub1 → BoxSub2
```

`Site` is the parent entity represented by `stock_site`; it is not a `stock_location.location_type` value.

The word `may` defines permitted representation, not a requirement that every site contain every level.

Location identity is constrained within its parent/site context.

`stock_item.storage_location_id` references the normalized physical location.

The legacy free-text `location` field remains source text and is not the normalized relationship.

## Donor vehicle and acquisition/source party

Donor vehicle and acquisition/source party are distinct concepts.

`stock_item.donor_vehicle_id` references a donor `vehicle` when known.

`stock_source_party.source_type` supports:

```text
vendor
person
organization
tenant
other
```

`stock_source_party` records the source/acquisition party associated with a stock record. A vendor or tenant may therefore be the recorded source party when that is the evidenced role for that record.

`stock_item.source_party_id` references that party when known.

Provider identity, authentication/authorization identity and multi-tenant ownership rules are separate concerns and must not be inferred solely from `source_party_id`.

Legacy `stock_item.source` remains usable source evidence for unresolved stock where normalized party identity is not yet available.

An unresolved/non-catalogue stock record (`part_id IS NULL`) must retain source evidence through either `source_party_id` or a nonblank legacy `source` value.

A canonical `PART` must not be fabricated merely to satisfy a relationship.

Detailed provenance is a separate stock evidence concern and must not be collapsed into catalogue identity.

## Quantity

`quantity` is an integer number of physical items and must be non-negative.

Application and database validation must reject fractional quantities.

## Price and currency

`stock_item.price` is the optional numeric sale value and must be non-negative when present.

`stock_item.currency` is a three-character uppercase currency code.

Currency presentation must be reserved for i18n/localization formatting. Currency code remains the stored identity; localized symbols and display order are presentation.

This document does not define sales, reservations, payment, or price-history workflows.

## Availability

Availability means operational readiness of an inventoried stock record: its accepted condition and physical storage location are known.

For new or changed records, `available = 1` therefore requires both:

- non-NULL `condition_code`;
- non-NULL `storage_location_id`.

Existing rows are not silently reclassified or backfilled. Their state must be reconciled from evidence before availability is changed under the rule.

Availability does not imply a sale transaction, reservation state, or positive quantity unless a separate workflow defines that relationship.

## Search/filter indexes

The stock model uses the complete current stock index set listed below.

| Table | Named indexes |
|---|---|
| `stock_item` | `idx_stock_item_part_number`; `idx_stock_item_status`; `idx_stock_item_location`; `idx_stock_item_part_id`; `idx_stock_item_available`; `idx_stock_item_donor_vehicle`; `idx_stock_item_source`; `idx_stock_item_condition_code`; `idx_stock_item_storage_location`; `idx_stock_item_source_party`; `idx_stock_item_price_currency`. |
| `stock_location` | `idx_stock_location_root_identity`; `idx_stock_location_child_identity`; `idx_stock_location_site`; `idx_stock_location_parent`. |
| `stock_source_party` | `idx_stock_source_party_type_name`. |

These indexes support the documented stock relationships and current principal filters.

Combined predicates, ordering, language-aware search and production-scale selectivity require query-plan measurement against representative inventory before adding composite indexes.

## Integrity and fixtures

Executable stock model tests verify:

- named multi-site storage;
- optional rack/shelf/box hierarchy and recursive box nesting;
- controlled A–E condition values and their deterministic fixture meanings;
- vendor/person/organization/tenant/other source-party vocabulary;
- integer quantity enforcement;
- donor vehicle and source party as separate relationships;
- currency and non-negative price;
- availability integrity;
- unresolved stock source requirement;
- multiple stock records for one canonical `PART`;
- relevant stock indexes and invalid cases.

Deterministic fixtures must cover multiple stock records for one part, stock under a historical part number with supersession, unresolved stock, zero/unavailable stock, and representative stock quality classifications from the normalized `A` through `E` set.

## Boundary

Defined here:

- persistent operational stock quantity;
- controlled A–E condition / stock quality;
- named multi-site rack/shelf/box storage;
- separate donor and source-party relationships;
- optional sale price with currency code;
- availability integrity;
- unresolved stock source requirement;
- stock search/filter indexes and integrity tests.

Outside this model document:

- individual physical-unit identity;
- inventory transaction/history ledger;
- reservations and sales workflow;
- provider-specific synchronization behavior;
- authentication/authorization ownership model;
- automated acquisition history;
- detailed provenance redesign;
- production deployment or remote D1 migration execution.
