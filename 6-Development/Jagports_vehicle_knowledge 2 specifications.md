## 6. Database schema for the new system
Everything in §3–§4 is **read-only reference data** (what parts exist, what they fit,
their part numbers, their diagrams) that ships with JEPC — no ability or need to edit
it. Everything the business actually manages day-to-day (§5) is business-operational
data specific to Jagports.fi that does not exist anywhere in JEPC and is designed as a
separate set of tables/entities, keyed against JEPC's part/model/category identifiers
where possible, so the two data sources can be joined at query time rather than
merged/duplicated.

### 6.1 JEPC part identity
Every other table below that concerns "a JEPC part number" is keyed against a
canonical part identity, not a bare part-number string, because the same physical
Jaguar PN can appear as more than one leaf row across different models/categories/
items (§4.7) — each such appearance needs its own fitment/flags context, while still
resolving back to one canonical part for inventory, pricing, and cross-referencing
purposes:
```
jepc_part
  part_id (surrogate key)
  jaguar_pn (unique — the canonical Jaguar part number string)

jepc_part_occurrence
  occurrence_id (surrogate key)
  part_id (FK -> jepc_part)
  model_id, category_id, item_no    (identifies which drilldown leaf row this is,
                                     §4.7)
  catentry_id                        (internal catalogue-entry id, §4.7 field 3)
  application_id                     (FK basis for VIN/attribute fitment lookup, §4.8)
  internal_part_no, client_code      (§4.7 field 8, split into the raw string and its
                                      2-character prefix)
  part_state                         (available | nla | superseded | nss | classic —
                                      normalized from qty/isSuperSeded/isClassic, §4.7)
  zone_override_id (nullable FK -> zone, §6.6)  -- overrides this occurrence's default
                                                    zone(s) inherited from its category

part_supersession
  old_part_id (FK -> jepc_part)
  new_part_id (FK -> jepc_part)
  source                             (jepc_flag | excel_superseded_pns — this
                                      relationship comes from two independent sources:
                                      the isSuperSeded flag on an item-drilldown leaf
                                      row, §4.7, and the free-text Superseded PNs
                                      column in the Excel data, §5.1 col 16)
```

### 6.2 Inventory item (maps to Excel `Stock` sheet, §5.2)
One row per physical unit or batch of identical parts in stock:
- `inventory_id` (surrogate key)
- `part_id` (nullable FK to `jepc_part`, §6.1; nullable because not all inventory rows
  have a clean Jaguar PN, e.g. `"Balljoint-Boot"`)
- `tp_part_id` (nullable FK to `third_party_part`, §6.7 — set instead of `part_id` for
  NSS/ad-hoc items with no real Jaguar PN at all; the inventory row points *at* the
  vendor part, rather than the vendor part pointing at a specific inventory row, so
  the same vendor part can be cross-referenced from catalogue/browse contexts
  independent of whether any unit of it is currently in stock)
- `free_text_description` (fallback for unlinked/ad-hoc items)
- `quantity_on_hand` (integer; the single source of truth, replacing the split/
  duplicated `PartsMaster.Stock` vs. `Stock.Stock` situation in §5.2)
- `condition` / `grade` (referenced in eBay templates, §5.1, not currently a
  structured field in `PartsMaster` — worth formalizing)
- `donor_vehicle_id` (FK to Donor Vehicle, §6.4, replacing the free-text
  `Vendor / Donor Car` + `Donor Mileage` columns)
- `cost_price`, `sell_price_eur`, `sell_price_gbp` (formalizing §5.1 columns 19/21/22,
  with the `Price PoundS` unit-conversion-artifact issue resolved)
- `date_added`, `date_sold` (not currently tracked anywhere — needed for basic
  inventory turnover reporting)

### 6.3 Storage location (maps to Excel `StockUnits` + `Stock.Shelf/Box/BoxSub1/BoxSub2`, §5.2)
A proper hierarchical location table, replacing the flat/free-text Excel columns:
- `location_id`
- `site` (at least two real values already exist in the current data — `ESPOO` and a
  second, not-yet-named site whose shelves use `RnX`-style codes, §5.2/§7 — not a
  placeholder for hypothetical future expansion)
- `shelf`, `box`, `subcompartment_1`, `subcompartment_2` (each nullable, since not
  every level is always used — `_N/A` placeholders in the Excel data become real
  NULLs, not string literals)
```
inventory_location
  inventory_id (FK -> inventory_item, §6.2)
  location_id (FK -> storage_location)
  quantity                     (how many units of this inventory item/batch sit at
                                this specific location)
```
An explicit many-to-many with quantity (composite PK on `inventory_id`+`location_id`),
so one inventory item can legitimately be split across more than one box, rather than
the current Excel model's implicit one-row-per-PN assumption.

### 6.4 Donor vehicle
Formalizes the free-text `Vendor / Donor Car` + `Donor Mileage` columns (§5.1) and
supports the "features/VIN" fitment-verification idea from the original project brief:
- `donor_id`, `vin` (full VIN, enabling lookup of exact factory-fit options for that
  specific car once JEPC's VIN-attribute mechanism, §4.8, is wired up), `model`/chassis
  code, `mileage_km`, `acquisition_date`, `acquisition_source`, notes.
- Every Inventory Item pulled from a donor car links here instead of storing donor
  info as text on every part row.
- A Donor Vehicle's own known attribute values (once available) can also serve as the
  input to vehicle-specific search (§2.III) for cars that don't yet have a
  VIN→attribute decode path.

### 6.5 Sales-listing / marketplace sync (maps to Excel eBay sheets, §5.1)
Replaces the manual Turbo Lister / File Exchange spreadsheet-formula workflow:
- `listing_id`, `inventory_id` (FK), `marketplace` (`ebay`, future: others / own
  shop), `external_listing_id`, `status` (draft/active/sold/ended), `list_price`,
  `title`, `description` (can be templated the same way the Excel formulas did —
  Functionality + Part type + ProdName + fitment + condition + notes — generated by
  the app instead of by spreadsheet formula), `placement_on_vehicle` (directly reusing
  the `"Front Right Low"`-style string already produced today, §5.1 — the field that
  ties a listing back to the click-a-location search feature, §2.I).
- `listed_quantity` (how many units this specific listing offers — a listing doesn't
  always claim the entire stocked quantity of an inventory item).
- `available_quantity` (derived: `inventory_item.quantity_on_hand` minus quantity
  already committed to other active listings for the same inventory item, to prevent
  overselling across multiple simultaneous listings/marketplaces. The exact policy for
  what counts as "committed" — e.g. whether a `draft` listing reserves stock the same
  way an `active` one does — is an open policy question, §7, not assumed here).

### 6.6 Image hotspot / click-region map
Powers goal §2.I ("click a location on the car image"). Two layers:
- **Whole-car zone map** — JEPC's own hotspots work at the single exploded-diagram
  level (§4.10), not as a whole-car overview, so this layer is purpose-built, modeled
  as an explicit many-to-many rather than a single flat mapping (one zone can surface
  parts from more than one JEPC category, and one category's parts can span more than
  one zone):
  ```
  zone
    zone_id, overview_image_id, name        (e.g. 'Front Right Low' — the same
                                             vocabulary already produced today by the
                                             business's own Loc/LocSide/LocVertical
                                             fields, §5.1)
  zone_category_map
    zone_id (FK -> zone)
    category_id                             (JEPC categoryId, §4.4)
  ```
  Authored by an admin tagging regions on a handful of standard car overview images
  (front 3/4, rear 3/4, interior, engine bay, trunk) — a one-time content-creation
  task, not per-part data entry, since the region vocabulary is effectively already
  defined by the existing `Loc`/`LocSide`/`LocVertical` data (`Front/Rear` ×
  `Left/Right/Center` × `Top/Middle/Bottom`). A specific part occurrence can still
  override its category's default zone individually via
  `jepc_part_occurrence.zone_override_id` (§6.1), rather than forcing every part in a
  category to share the same zone.
- **Admin part-pin table** — lets an admin click/pin a part's exact location directly
  on an existing JEPC diagram image, using the logical JEPC illustration identity and available media asset family, when adding a stock item, which matters most
  for parts with no native JEPC hotspot at all — i.e. items Jaguar never itemized
  separately (§6.7). This is a parts-database concern, not a stock/inventory concern:
  the pinned location describes where on the diagram this kind of part physically is,
  independent of how many units are currently in stock, where they're shelved, or
  which vendor supplied them — the same separation of concerns as the rest of this
  section.
  ```
  admin_part_pin
    pin_id (surrogate key)
    image_ref             (logical JEPC illustration identifier plus enough asset-family
                           provenance to identify the source image and coordinate system;
                           Flash-viewer hotspot coordinates must not be assumed equivalent
                           to full-resolution image coordinates — see §7)
    x, y, width, height    (recommend normalized 0–1 fractions of image width/height
                           at storage time, converting from whatever the admin UI's
                           click coordinates were in, so the same pin renders
                           correctly regardless of what size the image is displayed at)
    occurrence_id (nullable FK -> jepc_part_occurrence, §6.1) / tp_part_id (nullable
                           FK -> third_party_part, §6.7)
                           (keyed off a specific model+category+item occurrence rather
                           than a bare part number, since the same Jaguar PN can appear
                           in more than one diagram/occurrence and each occurrence's
                           pin location can differ; a pin should be able to point at
                           either a real JEPC occurrence or directly at a third-party/
                           not-sold-separately part — at least one of the two must be
                           set)
    created_by, created_date, notes
  ```
zone.name — controlled vocabulary, extensible:
  front | rear | left | center | right | top | middle | bottom |
  engine compartment | trunk | front seats | rear seats | dashboard
  (admin may add further values as needed)


### 6.7 Third-party parts and pricing
Vendors (SNG Barratt, British Parts, etc. — seen as free text in the Excel
`Vendor Part Name` / `Vendor PN` columns, §5.1) each have their own part number for
the same physical part, and their own price for it, independent of the business's own
stock pricing. This is modeled as a cross-reference, not flattened into the Inventory
Item or `PartsMaster` row the way the Excel does it, because one Jaguar part number can
have several competing third-party equivalents (different vendors, PNs, prices) — a
many-to-one relationship a single `Vendor PN` column can't represent — and because
third-party pricing should be refreshable/comparable independent of what's currently
in stock, not just recorded once at time of purchase.

This matters most for parts marked **NSS ("Not Sold Separately")** on Jaguar's own
diagrams — a standard parts-catalogue abbreviation for parts Jaguar only sells bundled
into a larger assembly and never itemizes individually (e.g. a ball-joint boot or a
brake-caliper piston, sold only as part of a whole ball joint or whole caliper, §4.7).
Since there is no sellable Jaguar PN for these at all, the only way to represent "we
have this specific rebuild component in stock, here's what it costs" is via a
third-party vendor's own part number and price. `"Balljoint-Boot"` in the existing
`Stock` sheet (§5.2) — a non-PN inventory key — is understood to be exactly this case:
an ad-hoc/NSS item with no real Jaguar PN, which should point at one or more
third-party parts below rather than being forced onto a fake/placeholder Jaguar PN.

`third_party_part` holds only independent vendor-catalogue data — it does not itself
point at any specific inventory row or Jaguar part. Any relationship to a Jaguar part
is expressed through `third_party_part_xref` instead, and is explicitly typed, so that
(for example) an NSS sub-component like a boot or piston is never presented to a buyer
as if it were a substitute for the whole assembly it belongs to:
```
third_party_vendor
  vendor_id (surrogate key)
  name                    (e.g. "SNG Barratt", "British Parts")
  website / notes

third_party_part                -- independent vendor catalogue data only
  tp_part_id (surrogate key)
  vendor_id (FK -> third_party_vendor)
  vendor_part_number      (the vendor's own PN)
  vendor_part_name        (vendor's own description/title)
  last_seen_price, currency, last_checked_date   (a refreshable price snapshot,
                separate from the business's own sell price on Inventory Item)
  url                     (link to the vendor's own product page, if available)

third_party_part_xref
  tp_part_id (FK -> third_party_part)
  part_id (FK -> jepc_part, §6.1)
  relationship             (equivalent_to | component_of | supersedes)
                           - equivalent_to: the vendor part is a direct substitute
                             for a real, sellable Jaguar PN
                           - component_of: the vendor part is a sub-component of an
                             NSS assembly — shown alongside that assembly for browse/
                             fitment purposes, but never offered as a substitute for it
                           - supersedes: the vendor's own part supersedes an older
                             Jaguar PN, independent of Jaguar's own §6.1
                             part_supersession record for that PN

inventory_item.tp_part_id   -- inventory points TO the vendor part (§6.2); the vendor
                                part never points at a specific inventory row, so the
                                same vendor part can be referenced/cross-linked from
                                catalogue browsing regardless of current stock
```

### 6.8 Category/taxonomy reconciliation
The business's own `Part type` / `Functionality` taxonomy (§5.1 columns 8–9) is a
separate, independently-maintained classification from JEPC's own category tree
(§4.4). Both are useful (JEPC's is authoritative for fitment; the business's is more
attuned to how buyers actually search/browse) but are not currently mapped to each
other. A mapping table (`jepc_category_id ↔ user_part_type` / `user_functionality`)
would let the app offer both browse styles without maintaining two disconnected
classification systems by hand — likely worth building semi-automatically
(fuzzy-matching category names) with manual review, rather than either fully automatic
or fully manual.

### 6.9 Data-quality normalization needed before import
Several free-text fields in the existing Excel data (§5.1) have inconsistent spelling/
casing that must be normalized during import, not carried forward as-is:
`Int/Ext/Engine Bay/Trunk` zone (3 spellings of "Engine Bay", "Trunc" vs "Trunk"),
`LocVertical` (`Bottom` vs `Low` used interchangeably), `LocSide`/`Loc` (multiple
"both sides" notations: `Left/Right`, `LeftRight`, `Left /right`), `Functionality`
capitalization drift, and placeholder values used as literal data (`NA`, `N/A`, `_N/A`
all appearing as distinct strings in different sheets, rather than true blanks).

### 6.10 Legacy JEPC reference pricing
Historical Jaguar factory list prices cached inside existing JEPC installations
(§4.12) — 2009-era USD and GBP snapshots, and a newer ~2012-era RUB snapshot — are
wanted as reference pricing shown alongside a part, not as the source of the app's own
sell prices (§6.5/§6.7 remain independent and business-set):
```
jepc_reference_price
  price_id (surrogate key)
  part_id (FK -> jepc_part, §6.1)          -- matched by partNumber, §4.12
  source_install                            (which cached JEPC installation/session
                                             this snapshot came from — since more than
                                             one install exists with different
                                             currency-era snapshots, §4.12)
  currency_code                             (e.g. USD, GBP, RUB — see §7 for the open
                                             question on exactly where/how this is
                                             recorded per file)
  amount
  discount_code, surcharge                  (the other two raw fields present in the
                                             source Price_...xml record, §4.12,
                                             carried through even though their exact
                                             use isn't needed for reference display)
  imported_date
```
Every available cached installation/snapshot should be imported as its own row(s)
rather than only the most recent one, since the point is historical reference across
currencies/eras, not a single current price.

---

## 6.11 Catalog data-source provenance (`part_data_source`)

The project has **three independent sources of catalog knowledge** about a
part's existence, part number, and fitment — JEPC's own local data (RES-4), the
SNG Barratt PDF catalogues (RES-9), and JLR Classic Parts' live site (RES-8.1) —
plus the business's own Excel data as a fourth, legacy source. This is a different
concept from the existing `Vendors` column in `PartsMaster` (RES-5.1 col 30,
currently unused in sampled data), which records **who the business physically
bought a part from** for a specific stock item (a donor car, SNG Barratt, British
Parts, etc.) — that's a purchasing fact about one `inventory_item` (SPEC-6.2), not
a fact about the part's existence in a catalog. Conflating the two would make it
impossible to answer "where did we learn this PN/fitment fact" separately from
"where did we buy this specific unit" — two genuinely different questions the
business already keeps separate today (`PartsMaster.Vendors` and
`Stock.Vendor/Donor Car` per RES-5.1/5.2 are already distinct columns for exactly
this reason). The new field is catalog-side provenance, sitting alongside
`jepc_part_occurrence` (SPEC-6.1), and does not replace or rename the existing
purchase-vendor concept, which stays exactly where it already is.

### Schema
```
part_data_source
  source_id (surrogate key)
  occurrence_id (FK -> jepc_part_occurrence, SPEC-6.1)   -- provenance is recorded
                                                          per occurrence, since the
                                                          same physical part can be
                                                          independently confirmed
                                                          (or contradicted) by
                                                          different sources for
                                                          different model/category
                                                          contexts
  source (enum: jepc | sng_pdf_catalogue | jlr_classic_parts | excel_legacy |
          admin_manual)
  source_reference       (free text/URL: JEPC's own file path (RES-4.1), the SNG
                          PDF's filename + page/section (RES-9.1), the JLR Classic
                          Parts product URL (RES-8.1), or "PartsMaster row N" for
                          excel_legacy)
  confirmed_date
  notes
```
A single `jepc_part_occurrence` can have more than one `part_data_source` row —
this is the intended, useful case, not a duplication problem: if both JEPC and the
SNG PDF catalogue independently list the same PN for the same fitment context,
that's corroboration worth keeping visible (as sketched in RES-11.4's
"source-tagged overlay, not blind merge" principle), and if they *disagree*, both
records staying visible is exactly what surfaces the discrepancy for review rather
than one silently overwriting the other.

---

# JEPC — Specifications Addendum: Manual Verification Flag, Revised (SPEC-6.12 v2)

## 6.12 Manual verification flag

### 6.12.1 Why a single boolean+note isn't enough
There are two distinct ways a part ends up needing manual review, and more will
likely appear over time as more data sources get integrated:

1. **Source-signal-raised**: an external data source's own page states something
   that implies "don't just sell this automatically" — concretely, JLR Classic
   Parts' dual "Add to Bag" + "Contact Us to Purchase" state observed on some
   product pages (RES-8.1, RES-10.4.1). This is raised automatically by the vendor
   adapter (IMPL-1.2) when it sees that signal, with no human involved at flag-
   creation time.
2. **Admin-raised**: the business owner knows, from direct hands-on experience,
   that a part has a real fitment subtlety no data source documents at all — the
   X100 driveshaft/wheel-size and camshaft-cover/engine-number cases. This is
   raised deliberately by a person, with a reason already known at flag-creation
   time.

These need different handling: a source-signal flag may have *no* explanation
attached yet (the vendor page just says "Contact Us," not why), while an
admin-raised flag should generally require a reason up front. And because a new
data source (or a new kind of institutional knowledge) could introduce a third
raise-mechanism later that isn't predictable now, the design stays open-ended
rather than hard-coding an exhaustive list of "reasons."

### 6.12.2 Schema

part_verification_flag
flag_id (surrogate key)
occurrence_id (FK -> jepc_part_occurrence, SPEC-6.1)
raised_by (enum: admin_manual | source_signal — treat as open-ended;
add new values as new raise-mechanisms appear, rather than
assuming these two are exhaustive)
source_signal_type (nullable text — set only when raised_by = source_signal;
a short machine-meaningful tag for which signal fired,
e.g. 'jlr_classic_contact_us_before_purchase', so future
adapters can introduce new signal types without a schema
change)
tp_part_id (nullable FK -> third_party_part, SPEC-6.7 — set when a source_signal
flag originates from a specific vendor's part page, linking back to
exactly which vendor observation triggered it, via the existing
third_party_part_xref -> part_id -> occurrence chain)
fitment_criterion_id (nullable FK -> part_fitment_criterion — set when the
reason is a known, already-categorized fitment constraint
like wheel_size/engine_number; left null when the reason
isn't categorized yet, e.g. a bare "Contact Us" signal
with no explanation, or a brand-new admin note that
hasn't been generalized into a reusable criterion type)
reason_note (free text; required when raised_by = admin_manual, since
a person always knows why at creation time; optional when
raised_by = source_signal, since the source may not say)
status (enum: open | resolved_confirmed_ok |
resolved_confirmed_issue)
created_by (admin username, or 'system:<adapter_name>' for automated
source-signal flags — e.g. 'system:jlr_classic_adapter')
created_date
resolved_date, resolved_by, resolution_note

`jepc_part_occurrence.needs_manual_verification` is not a stored column — it's
derived (`EXISTS (SELECT 1 FROM part_verification_flag WHERE occurrence_id = ...
AND status = 'open')`), so it can never drift out of sync with the actual flag
rows underneath it.

### 6.12.3 Relationship to `part_fitment_criterion`
The two tables serve different purposes and are linked, not merged:
- `part_fitment_criterion` holds **known, named fitment dimensions**
  (`wheel_size`, `engine_number`, ...) — structured enough to eventually drive
  actual search-filter UI (RES-2.III).
- `part_verification_flag` is the **general "a human needs to look at this"**
  mechanism — broader than fitment criteria alone, and doesn't require a reason to
  already be categorized. A flag can exist on its own (bare source signal, reason
  unknown) or point at a `part_fitment_criterion` row once/if the reason becomes
  understood well enough to generalize (e.g. after Tomi confirms *why* a given
  part's "Contact Us" signal exists, it might turn out to be exactly a
  wheel-size or engine-number case, at which point the flag gets linked to a
  proper criterion row rather than staying a mystery).

### 6.12.4 Application behavior
- **IMPL-1.2 (JLR Classic adapter)** should, upon observing the dual Add-to-Bag +
  Contact-Us-to-Purchase state, insert a `part_verification_flag` row
  (`raised_by = 'source_signal'`, `source_signal_type =
  'jlr_classic_contact_us_before_purchase'`, `tp_part_id` set, `reason_note` left
  null) rather than only recording it as a third-party availability status.
- **Admin stock-entry UI** needs a way to raise a flag manually at any time (not
  just when adding new stock) — the driveshaft/camshaft-cover cases are things
  Tomi already knows today, independent of any data-source import happening at
  all.
- Any occurrence with an **open** flag (regardless of which raise-mechanism)
  surfaces the same visible warning in admin and public UI — the *display*
  behavior doesn't depend on why the flag exists, only that one does.
- Resolving a flag (`status` → `resolved_confirmed_ok` /
  `resolved_confirmed_issue`) is always a human action, regardless of how the flag
  was raised — an automated adapter can raise a flag but should never be allowed
  to resolve one.

### 6.13 Application settings
app_setting
  key (e.g. 'supersession_verification_enabled')
  value
  description