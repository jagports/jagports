# JEPC (Jaguar Electronic Parts Catalogue) — Project Notes

## Purpose of these documents
This file describes everything needed to build an independent web application that
reads the **New Jaguar EPC** (JEPC Mark III) desktop application's **local** parts-
catalogue data files (part hierarchies, drawings/images, pricing) directly, bypassing
the original app, whose online backend (`www.newjepc.unipart.co.uk`) is dead. It also
records the business requirements and data design for the new system on top of that
catalogue data.

**Copyright note:** The underlying catalogue data is Jaguar/Unipart's proprietary
parts catalogue content. This document covers understanding data *formats* to build a
personal/local tool against data the owner already has legitimate access to.
Redistributing the underlying catalogue data or drawings to third parties is a
separate legal question, out of scope here.

---

## 1. Background

**Owner/operator**: Tomi Lind, Jagports.fi, Espoo, Finland — ex. Finnish Jaguar
Drivers' Club Model Representative for XK8/XKR (X100), XK/XKR (X150), F-Type. Runs a
Jaguar parts-out/breaking business (donor cars purchased, dismantled, parts sold),
`parts@jagports.fi`. Not a programmer — "ICT generalist" — needs full coding support;
explanations should stay non-technical where possible.

The business currently runs on a hand-maintained Excel system (§5) with no connection
to JEPC's own catalogue data. JEPC itself is a Windows HTA (HTML Application) launched
via `mshta.exe`, built ~2007–2012 by "Keane India Pvt Ltd." for Jaguar/Unipart. It is a
hybrid online/offline thin client: an **online mode** that talks to a dead Java
servlet backend, and an **offline/local mode** where the actual parts catalogue
browsing (model tree, categories, drilldown items, diagrams) is served from static
local XML/image files. That local data is the reverse-engineering target.

A separate developer, **Steve** (`steve@thebytefoundry.com`, thebytefoundry.com), has
independently built a closed-source Windows desktop app called **jPart** for the same
audience (hobbyists/enthusiasts working on classic Jaguars), learned about via an
email exchange forwarded by the owner. jPart's code is not available, but Steve's
description of his approach is useful confirmation/inspiration:
- Written in Python.
- Reads the JEPC local text/XML files directly, describing the same "tree structure"
  of parts/relationships documented below — confirming this is the correct approach.
- **Ships per-image hotspot/label files** that map pixel regions on diagram images to
  part item numbers, used to highlight parts on-image — this mechanism has since been
  located and decoded directly (§4.10).
- Builds a local cache database once per car model from the XML files, rather than
  querying XML repeatedly at search time — the recommended pattern for the new app
  too: import all needed JEPC XML data once into proper database tables at
  build/deploy time, rather than parsing XML per request.
- Jaguar's own official parts-lookup website has also broken, reinforcing that a
  self-hosted tool has real value.

---

## 2. Goal

Build a **web application** (browser-based, not a desktop app) that combines:

1. **The full JEPC parts catalogue** (model → category → part hierarchy, part numbers,
   fitment, images/diagrams — §4) for the Jaguar model Ranges the business actually
   deals in (§4.13 defines the Range taxonomy and which Ranges are currently in
   scope). The import/parsing layer is built against the full JEPC data format so it
   works for any model in the source files, but the app's actual deployed dataset is
   scoped to just the in-scope Ranges — whether other Ranges get imported later is
   open (§13).
2. **The business's own inventory data** — what physical parts are actually in stock,
   and exactly where (shelf/box/sub-box location) — currently maintained by hand in
   Excel (§5), which does not exist anywhere in JEPC and is modeled as a separate
   database layered on top of the JEPC part-number space (§6).

### Required functionality
1. **Search / browse UI, multiple entry points**:
   - **(I) Visual/spatial search**: click a location on a car diagram/concept image
     (e.g. "Front → Right → Low") and see all parts fitting that location — the
     standout differentiator idea versus existing parts-sales sites. JEPC's own
     per-diagram hotspot files (§4.10) work at the single-exploded-diagram level (item
     numbers within one category), not as a whole-car zone map, so this feature needs
     a separate, purpose-built whole-car zone-to-category mapping (§6.6) — JEPC's
     hotspots are a nice-to-have refinement layered within that, not a substitute.
   - **(II) Category/type search**: multi-select dropdown filtering by part type,
     drawing on the JEPC category tree (§4.4) and/or the business's own `Part type` /
     `Functionality` taxonomy (§5.2).
   - **(III) Vehicle-specific search**: user enters a VIN, app narrows results to parts
     that fit that specific vehicle/build — a standard, first-class filter alongside
     (I)/(II), usable side-by-side with them, not a deferred nice-to-have. JEPC's
     fitment-*filtering* algorithm (matching a vehicle's known attribute values
     against each part's VIN-breakpoint and `A<groupId>` requirements) is fully
     decoded (§4.8). What is **not** solved: turning a raw VIN into that attribute
     list in the first place — JEPC's own VIN→attribute decode step has no offline
     data path in the data seen so far, only the dead online servlet (§3) — and the
     real-world meaning of individual `A<groupId>` group ids is not decoded (§13).
     Until the VIN→attribute step has a data source of its own, this filter can still
     be driven by attribute values already known for a specific car (e.g. a Donor
     Vehicle record, §6.4) rather than a freely typed-in VIN.
   - **(IV) Stock-availability filter**: only show parts the business currently has in
     stock (requires the inventory DB, §6.2 — not in JEPC at all).
2. **Admin / stock-manager back-end**: update stock quantity, shelf/box/location for
   each part; manage listings published to eBay (and potentially other sales channels
   or the business's own storefront) — see §5.2 for the existing (manual, Excel-driven)
   version of this workflow, which becomes part of the app (§6.5).
3. **Deployment target**: accessible as a normal website (multi-user: buyers browsing/
   searching; one or more admins managing stock) — not a single-user desktop tool.

---

## 3. Application architecture

### Launch chain
```
JEPCIndex.hta                      (HTA shell; loads JEPCLogin.html in an iframe)
 └─ JEPCLogin.html                 (login form)
     ├─ Constants.js               (global path/URL constants)
     ├─ JEPC.js                    (general utility functions)
     ├─ JSSerializer.js            (custom JS-object <-> XML serializer, GPLv3, Matt Fellows 2007)
     ├─ Login.js                   (submitToLogin(); online auth w/ offline fallback)
     ├─ I18nLabels.js / I18nMessages.js   (UI text; not data-relevant)
     └─ on successful login (online or offline) navigates to:
         JEPCFrames.html            (frameset: topFrame + mainFrame)
          ├─ Constants.js, AJAX_Util.js, JEPC.js, Frames.js, fst4-path.js, menuG5LoaderFSX.js
          ├─ Frames.js:
          │    - parses login/session params from URL query string into a hidden
          │      form `index_form` (memberId, salesOrg, currency, languageId, etc.)
          │    - synchronously fetches the root model list XML (§4.3) into
          │      `index_form.xmlData`
          │    - loadMainSrc() → loads JEPCFrameTop.html into topFrame,
          │      and JEPCModelMenu.html into mainFrame
          ├─ topFrame = JEPCFrameTop.html    (nav bar, search box, shopping cart, VIN decode UI)
          └─ mainFrame = JEPCModelMenu.html  (renders model list from index_form.xmlData)
               ├─ Constants.js, JEPC.js, AJAX_Util.js, ModelMenu.js, fst4-path.js,
               │  menuG5LoaderFSX.js, menuG5FX.js
               └─ ModelMenu.js: setModelMenu() reads index_form.xmlData and calls
                  buildMenu() to render the clickable model tree
```
Clicking a category leaf opens `JEPCProductDisplay.html?categoryId=..&modelId=..`,
which loads `JEPCProductDisplayFrame.html` → `JEPCProductDrillDown.html`, the page that
actually renders the exploded-parts drilldown view (§4.6, §4.9).

`ProductSearch.js` drives the toolbar "Search" box and depends entirely on the dead
online servlet (`doSearchProducts.jepc`) — JEPC's own free-text/part-number search has
no local/offline data path at all.

---

## 4. What the local data looks like

### 4.1 Folder layout
Rooted at the JEPC install folder (`C:\Program Files\JEPC\applications\JEPC\`):
```
JEPC/
├── html/            JEPCIndex.hta, JEPCLogin.html, JEPCFrames.html, JEPCFrameTop.html,
│                    JEPCMenu.html (legacy/demo, low relevance), JEPCModelMenu.html,
│                    JEPCProductDisplay.html, JEPCProductDisplayFrame.html,
│                    JEPCProductDrillDown.html (renders the drilldown tree + diagram),
│                    JEPCImageDisplay.html (full-size non-Flash image popup)
├── js/              Constants.js, JEPC.js, JSSerializer.js, Login.js, Frames.js,
│                    AJAX_Util.js (all local-file-path patterns below were extracted
│                    from this file), ModelMenu.js, JEPCDrillDownDisplay.js (builds/
│                    renders the drilldown tree client-side — defines the
│                    jepcdrillDown/drillDownItemEntry/drillDownEntry objects, §4.6),
│                    JEPCFiltering.js (VIN-breakpoint + attribute-group filtering,
│                    §4.7), JEPCNavigation.js (browser-style history, not data-
│                    relevant), JEPCUtilities.js (generic validators, not data-
│                    relevant), ProductSearch.js, manualsearch.js, menuUtil.js
│                    (confirms leafFlag semantics, §4.4), swfobject.js
├── menus\
│   └── (optionally under L<languageId>\ — seen both directly under menus\ and under
│       menus\L<lang>\ across different install snapshots; check both)
│       ├── models_l_id_<languageId>.xml            root model list (top of tree)
│       ├── pl_id_<modelId>_l_id_<languageId>.xml    category tree for one model
│       └── pl_id_<modelId>_attributes.xml           category-level VIN/attribute
│                                                     filter data, keyed by categoryId
│                                                     (§4.7)
├── drilldown\
│   └── pl_id_<modelId>\
│       ├── Itm_M<modelId>_C<categoryId>_I<itemNo>_attributes.xml   item-level fitment,
│       │                                                           keyed by applicationId
│       ├── tl_M<modelId>_C<categoryId>_attributes.xml    top-level-item fitment,
│       │                                                 keyed by itemNo
│       └── L<languageId>\
│           ├── cat_M<modelId>_C<categoryId>_L<languageId>.xml      category nav popup
│           ├── tl_M<modelId>_C<categoryId>_L<languageId>.xml       top-level items
│           └── Itm_M<modelId>_C<categoryId>_I<itemNo>_L<languageId>.xml  exploded
│                                                                    parts list (the
│                                                                    part numbers)
├── prices\
│   └── pl_id_<modelId>\
│       └── <legacyCurrency>\
│           └── Price_M<modelId>_C<categoryId>_I<itemNo>_<legacyCurrency>.xml
├── flash\
│   ├── jepc.xml                    global Flash-viewer config (§4.10)
│   ├── PartImage.swf               the hotspot-diagram viewer (compiled Flash movie)
│   ├── images\<imageFile>.jpg      small (400×500 px) display images shown inside the
│   │                               PartImage.swf viewer, e.g. `5104.jpg`, `ax1000.jpg`
│   └── xml\<imageFile>.xml         per-image hotspot files, same base filename as the
│                                   matching .jpg — §4.10
├── illustrations\
│   └── png\<code>.png              full-resolution (e.g. 1495×2156 px) line-art
│                                   diagrams, shown by the "full size image" popup
│                                   (JEPCImageDisplay.html) as opposed to the small
│                                   400×500 Flash-viewer image. Filename matches the
│                                   cat_...xml popup's image code (§4.5) — i.e. this is
│                                   the category-level diagram, not per-part. The
│                                   linkage has only been directly verified for the
│                                   illustrations\png side so far; whether the same
│                                   code also always has a matching flash\images +
│                                   flash\xml pair is likely but not yet proven on a
│                                   single shared example.
├── images\
│   └── <modelId>_watermark.jpg     large background/watermark car image shown behind
│                                   the model-range/category screens — cosmetic only.
├── intro\02GB\<modelId>.pdf        per-model PDF intro/welcome document
└── index.html                     landing/redirect page

C:\jepcv3\EPC\Data\Files\Logon\    small session-cache files only (§4.11) — NOT the
                                   parts catalogue database.
```
`languageId` values: `0` = English (also US/Canada/Mexico English), `-2` French,
`-3` German, `-4` Italian, `-5` Spanish, `-7` Chinese, `-10` Japanese, `-11` Dutch,
`-6` Russian.

### 4.2 Data file format — general pattern
Almost all of these "XML" files follow this shape:
```xml
<?xml version="1.0" encoding="ISO8859-1" ?>
<Data>
[field1,field2,'field3 with, commas and spaces',field4]
[field1,field2,'field3',field4]
...
</Data>
```
i.e. a single `<Data>` element whose text content is a newline-separated list of
bracketed, comma-separated pseudo-CSV records. Single quotes delimit string fields
that may contain commas (parsed by a custom `readCSVValues()` function that toggles an
"in string" flag on `'` characters). The app fetches these via AJAX and grabs the raw
text node, then does its own manual `[...]`-record parsing — not structured XML with
named elements. Encoding is `ISO8859-1` (Latin-1), not UTF-8 — important for European-
language part descriptions.

The hotspot files (`flash\xml\*.xml`, §4.10) and the Flash-viewer config
(`flash\jepc.xml`) are the exception: those are conventional element-based XML.

### 4.3 Root model list — `menus/models_l_id_<lang>.xml`
3 fields per record:
```
[modelId, parentId, 'Model Display Name']
```
`parentId = 10001` for every top-level model group entry (the tree root ID). Each
model group has 1+ child records (same shape) representing the selectable model/
VIN-range variants. Example — the full XK8 group:
```
[3175,10001,'Jaguar XK8 Coupe/Convertible']                                    <- group
[3187,3175,'XK8 Coupe/Convertible up to (V) 042775']                           <- variant
[3183,3175,'XK8 Coupe/Convertible - Canada/USA up to (V) 042775']              <- variant
[3178,3175,'XK8 Coupe/Convertible From (V) A00083 To (V) A30644']              <- variant
[3173,3175,'XK8 Coupe/Convertible From (V) A30645']                            <- variant
```

### 4.4 Category tree for one model — `menus/pl_id_<modelId>_l_id_<lang>.xml`
4 fields per record:
```
[categoryId, parentCategoryId, 'Category/Group Name', leafFlag]
```
`parentCategoryId` chains back up to the `modelId` itself at the top of the tree.
`leafFlag`: `0` = this node has children (sub-category grouping — expand into a
submenu); `1` = leaf/selectable part-group page (clicking it opens the drilldown view,
`categoryId=<id>`). Confirmed both from the sample data and from `menuUtil.js`'s
`buildTreeMenu()`/`buildPopUpMenu()`, which branch on exactly this flag.

The full category tree for one model is delivered as one flat file; hierarchy is
reconstructed client-side purely from the `parentCategoryId` chain, not from
nesting/order in the file.

### 4.5 Category navigation popup — `drilldown/pl_id_<modelId>/L<lang>/cat_M<modelId>_C<categoryId>_L<lang>.xml`
```
[XK8 Coupe/Convertible up to (V) 042775/ELECTRICAL DISTRIBUTION SYSTEM/MAIN VEHICLE HARNESSES]
[tm6161e]
[3188,HARNESS-FRONT-4.0 LITRE,1]
[8402,HARNESS-REAR-4.0 LITRE,0]
```
- Line 1: breadcrumb string (model / category / sub-category...).
- Line 2: `imageFile` — the base filename shared by the diagram image files for this
  category (§4.10, §4.1's `illustrations\png` note).
- Remaining lines: sibling categories at this tree level, `[categoryId, name, flag]`
  — the third field's exact semantics are not fully pinned down; in the sample the
  category currently being viewed is flagged `1` and its sibling `0`, consistent with
  leafFlag/selected-item semantics but not proven beyond this one example.

### 4.6 Top-level items in a category — `drilldown/pl_id_<modelId>/L<lang>/tl_M<modelId>_C<categoryId>_L<lang>.xml`
2 fields per record:
```
[1,'Left forward harness']
[2,'Relay bracket']
...
```
`[itemNo, 'description']` — the human-readable name for each numbered top-level item,
matched against `itemNo` in the item-drilldown file (§4.7) and against `itemno` in the
matching diagram's hotspot file (§4.10).

### 4.7 Item drilldown (the actual parts breakdown) — `drilldown/pl_id_<modelId>/L<lang>/Itm_M<modelId>_C<categoryId>_I<itemNo>_L<lang>.xml`
This is the most important file type — it contains the actual part numbers. Each
record has exactly 12 fields. Field-by-field meaning, taken directly from
`drillDownItemEntry.prototype.buildChildren()` in `JEPCDrillDownDisplay.js`:

| Idx | Field | Type | Meaning |
|---|---|---|---|
| 0 | parentId | number | id of the parent record in this same file (chains up to the item root, `itemNo`, at the top) |
| 1 | id | number | this record's own unique id within the file |
| 2 | description | string (quoted) | free-text label on group/breakpoint header rows (e.g. `'4.0 Litre supercharged'`, `'To VIN (023682)'`); empty on actual part-number leaf rows (the part's name comes from the top-level items list, §4.6, keyed by `itemNo`, not per breakpoint) |
| 3 | catentryId | number | non-zero only on real part leaf rows; `0` on group/header rows — the internal catalogue-entry id, not a price |
| 4 | partNumber | string (quoted) | the Jaguar part number, e.g. `'LJA3120AF'`, `'AJ83284'`; empty/`0` on header rows |
| 5 | isDFS | number (flag) | meaning not fully confirmed; only meaningful on leaf rows |
| 6 | isSuperSeded | number (flag) | non-zero if this part has been superseded |
| 7 | isClassic | number (flag) | treated as boolean via `== 1`; "classic part" flag |
| 8 | internalPartNo | string (quoted) | format `pb_<2-digit code><partNumber-ish string>`, e.g. `'pb_02LJA3120AF'`; the 2 characters right after the `_` are parsed separately as a `clientCode` whose purpose is not yet confirmed (possibly a plant/region code) |
| 9 | *(unused)* | — | present in every record but not read by `buildChildren()` — meaning unknown |
| 10 | qty | string (quoted) | the raw value combines two different things that must be split apart at import time. On a genuine part-number leaf row it's normally a quantity-needed-per-assembly number, but it can also hold a status string instead, e.g. `'NLA'` = "No Longer Available" (Jaguar no longer supplies this PN at all) — a different concept from `isSuperSeded` (field 6: this PN has been replaced by a newer PN that *is* still supplied), and different again from NSS ("Not Sold Separately", §6.7 — a part Jaguar only ever sells bundled into a larger assembly, so it never appears as an independently orderable PN/leaf row at all; NSS therefore shows up as the *absence* of a leaf row for that sub-part, not as a `qty` value here). The import layer normalizes all of this into an explicit part-state vocabulary (`available` / `nla` / `superseded` / `nss` / `classic`, the last from field 7) rather than treating `qty` as one overloaded string, §6.1 |
| 11 | applicationId | number | non-zero only on leaf rows; the key used to look up VIN/attribute fitment data for that part in the matching `..._attributes.xml` file — verified by exact match against real sample data |

A record is a **group/breakpoint header** (tree structure only, no part attached) when
`catentryId` and `partNumber` are both falsy/zero; it's an **actual sellable part**
when both are populated. The tree is reconstructed by chaining `parentId` back to
`id` of an earlier record, rooting at the item number itself — the same pattern as the
category tree (§4.4).

Worked example (`Itm_M3187_C3188_I1_L0.xml`, XK8 front harness, item 1):
```
[1,11001,'adaptive control damping',0,0,0,0,0,0,0,'0',0]              <- header, root=itemNo 1
[11001,11002,'To VIN (023682)',0,0,0,0,0,0,0,'0',0]                    <- header, child of 11001
[11002,110020001,'',84840,'LJA3120AF',0,3,1,'pb_02LJA3120AF',0,'1',138102]  <- leaf part
```
Item "1" branches into "adaptive control damping" vs "Except adaptive control
damping"; the former branches into VIN sub-ranges; the "To VIN (023682)" range has one
part, Jaguar PN `LJA3120AF`, catentryId `84840`, qty `1`, application/fitment id
`138102`.

### 4.8 Attribute/fitment files
Two attribute-code families appear inside the bracketed sub-records, consumed by
`filterOnBreakPoint()` / `filterOnAttributes()` in `JEPCFiltering.js`. The matching
logic itself — given a vehicle's own attribute list and a part's breakpoint/attribute
requirements, decide whether the part fits — is fully decoded:

- **`C` records — VIN/chassis breakpoints**: `[C, <VIN or chassis suffix>, <boundaryType>, 0]`
  - `boundaryType = 0` → lower bound ("From"): invalid if the vehicle's serial number
    is less than this value.
  - `boundaryType = 1` → upper bound ("To"): invalid if the vehicle's serial number is
    greater than this value.
  - A `0`-type and `1`-type record together express a closed VIN range.
- **`A<groupId>` records — build/option attributes**: `[A<groupId>, <valueCode>, <exceptFlag>, 0(, <extra>)]`
  e.g. `[A6,3271,0,0]`, `[A59,1764,1,0,1]`. `groupId` identifies an attribute category
  (engine type, transmission, trim/option, etc.) — the meaning of individual numeric
  `groupId`s is not decoded, though this isn't needed for filtering itself (§13).
  `valueCode` is the specific option value within that group. `exceptFlag`: `0` = part
  applies when this attribute matches the vehicle; `1` = part applies except when it
  matches (an exclusion rule). A vehicle is represented the same way — as a list of
  its own `A<groupId>,<valueCode>` pairs. Producing that list from a raw VIN is
  normally done client-side via the dead online servlet, and that decode step has no
  offline data path in the data seen so far. The category-level attribute file uses a
  5-field variant (one extra trailing field); its purpose is unknown.

Three files share this bracketed-attribute-list format, differing only in what the
leading key (before the first bracket) represents:
| File | Leading key = |
|---|---|
| `Itm_M<model>_C<cat>_I<item>_attributes.xml` | `applicationId` (matches field 11 of an item-drilldown leaf record) |
| `tl_M<model>_C<cat>_attributes.xml` | `itemNo` (matches the numbered top-level item) |
| `menus/pl_id_<model>_attributes.xml` | `categoryId` |

### 4.9 Drilldown page behavior — `JEPCProductDrillDown.html`
This page hosts the exploded-parts view and ties the pieces together:
1. Fetches `Itm_..._L<lang>.xml` (§4.7) → builds the `thejepcDrillDown` tree.
2. Fetches the matching `Price_...xml` and merges pricing onto matched `partNumber`s
   (§4.12).
3. If a VIN is active, fetches the `_attributes.xml` file (§4.8) and filters the tree.
4. Calls `createFlashImage(imageFile)` (defined in this HTML file) to embed
   `PartImage.swf` for the diagram + hotspots.
5. Renders a "full size image" link that opens `JEPCImageDisplay.html?<imageFile>` in
   a popup — the non-Flash, full-resolution fallback view (presumably showing
   `illustrations/png/<imageFile>.png`).
6. `flashclick(hotspot)` — fired by the SWF when a hotspot region is clicked — calls
   `hotspotClick(hotspot, modelId, categoryId, languageId)` (definition not located
   yet) and scrolls the matching row into view: clicking the diagram highlights the
   matching row in the parts list on the left. Confirms each hotspot resolves to
   exactly one `itemNo`; whether the reverse also holds — one `itemNo` never spanning
   more than one hotspot on the same diagram — isn't confirmed (§13).

### 4.10 Flash diagram hotspot system
`flash/jepc.xml` (one global config file for the Flash viewer):
```xml
<configuration>
   <selectURL>https://uit-10898/webapp/wcs/stores/servlet/EPCProductDisplay</selectURL>
   <hotspotImageSizeX>8175</hotspotImageSizeX>
   <hotspotImageSizeY>8010</hotspotImageSizeY>
   <movieWidth>400</movieWidth>
   <movieHeight>500</movieHeight>
   <twipsPerInch>1440</twipsPerInch>
   <blankImage>noimage.jpg</blankImage>
   <itemParamName>itemNo</itemParamName>
</configuration>
```
`selectURL` points at a dead internal server and is irrelevant to local file reading.

`flash/xml/<imageFile>.xml` — one per diagram image, same base name as the matching
`flash/images/<imageFile>.jpg`:
```xml
<image>
   <originalwidth>781</originalwidth>
   <originalheight>291</originalheight>
   <hotspots>
      <item>
         <itemno>1</itemno>
         <x>88</x><y>220</y><width>349</width><height>801</height>
      </item>
   </hotspots>
</image>
```

**Coordinate system — important for reimplementation, but still a working hypothesis,
not yet confirmed**: hotspot `x`/`y`/`width`/`height` values are not in the same pixel
space as `<originalwidth>`/`<originalheight>` (nor the actual `.jpg`, which is a fixed
400×500 px). The values look like **twips**, scaled against the fixed canvas size
declared in `flash/jepc.xml` (`hotspotImageSizeX=8175`, `hotspotImageSizeY=8010`,
`twipsPerInch=1440`), giving a candidate conversion:
```
pixel_x = (hotspot_x / hotspotImageSizeX) * target_image_width_px
pixel_y = (hotspot_y / hotspotImageSizeY) * target_image_height_px
```
(same ratio for width/height). This hasn't been visually validated against a real
rendered hotspot yet, and other explanations could produce a similar-looking numeric
relationship without this exact formula being the right one — e.g. a Flash-stage
scale transform applied by `PartImage.swf` itself, image letterboxing/centering within
the fixed 400×500 movie canvas, or some other SWF-internal coordinate transform (§13).
`<originalwidth>`/`<originalheight>` in each per-image XML are informational/legacy
either way, not the coordinate reference frame — the global `jepc.xml` canvas size is.

`itemno` in each hotspot matches `itemNo` in the top-level items list (§4.6) — clicking
a hotspot on a category diagram highlights/expands the matching numbered item in that
category's parts list. This is a **per-diagram** mechanism: it maps item numbers
within one exploded-view diagram, not a whole-car "Front/Right/Low" zone map (relevant
to goal §2.I — see §6.6 for the separate zone-mapping table this implies is needed).

### 4.11 Login/session cache files
Written/read by `Login.js` using `JSSerializer.js`'s custom `<Tag type="...">value</Tag>`
XML format (conventional element-based XML, unlike §4.2's bracket format). Lives at
`C:\jepcv3\EPC\Data\Files\Logon\Logon<LOGONID>.xml` (credentials, currency, admin
level) and `...\Logon\vins_<LOGONID>.xml` (recent VIN list). Not the parts database —
irrelevant to the new app, which reads local catalogue files directly without
authenticating.

### 4.12 Pricing — `prices/pl_id_<modelId>/<legacyCurrency>/Price_M<modelId>_C<categoryId>_I<itemNo>_<legacyCurrency>.xml`
Each record is 4 fields, consumed as:
```js
setPricingForPartNumber(itemNo, partNumber, price, discountCode, surcharge)
```
i.e. `['<partNumber>', price, '<discountCode>', surcharge]`, matched onto the
drilldown tree by `partNumber`. `legacyCurrency` reflects which cached
installation/session produced that particular file — not the age of the price by
itself: one installation on the business's own machines caches ~2009-era USD/GBP
prices, a different installation caches ~2012-era RUB prices, but the currency alone
doesn't prove which snapshot is chronologically older, only which cached session it
came from.

These legacy Jaguar factory list prices are not current resale pricing and are not
used as the new app's own sell-price source — the app's own pricing (§6.5, §6.7)
stays independent and business-set. They are however wanted as **reference pricing**:
every available cached snapshot (2009 USD, 2009 GBP, ~2012 RUB) should be imported and
shown alongside a part purely as historical factory-list context. See §6.10 for the
schema and §13 for the open question on exactly where currency *name* (not just the
numeric amount) is recorded per file, or whether it has to be taken from
installation/session context instead, the way `legacyCurrency` is inferred from the
file path today.

### 4.13 Model Range taxonomy and target vehicles
JEPC's own `models_l_id_0.xml` (§4.3) lists many near-duplicate entries per car (each
VIN-range variant, each RHD/LHD or regional split, gets its own `modelId`/group).
The app presents a smaller set of human-facing **Ranges** instead — one Range per
recognizable Jaguar model family, each of which can fold together several JEPC
`modelId` groups and/or several SNG Barratt catalogue PDFs (§9). A Range is the
unit of scoping ("is this Range currently in the deployed dataset?"), of admin
UI grouping, and of catalogue-source cross-referencing; the underlying JEPC
`modelId`s and SNG PDFs are still tracked individually beneath each Range, not
merged away.

| Range | JEPC coverage (`modelId`s from `models_l_id_0.xml`) | SNG Barratt PDF catalogue(s), §9 | Notes |
|---|---|---|---|
| **Accessories** | `3484` ("Jaguar Accessories") as the group node, with `3482` ("Accessories") plus the named per-model entries below as its leaf children — real `modelId`s for the named entries not yet confirmed | none available | see note below |
| Daimler Limousine | 2265/2263 | none available | |
| E-Pace | 19451/19452 | none available | |
| E-Type | none in sampled JEPC data | `CATE6` (6-cylinder), `CATEV12` (V12) | |
| Early Saloons | none in sampled JEPC data | `CATEARLY` | outside JEPC's own model list entirely |
| F-Pace | 17281/17282 | none available | |
| F-Type | 14260/14261 | none available | |
| Mark 2 Range | none in sampled JEPC data | `CATMK2` | outside JEPC's own model list entirely |
| S-Type | 1004/1002 | `CATS` | |
| X-Type | 6819/6817 | `CATX` | |
| XE Range | 15472/15483 | none available | |
| XF Range | 1689/1687, 16231/16261 | none available | |
| XJ Range | 2245/2243 (Series III), 2204/2220/2207/2202 (XJ6/XJ12), 2233/2231 (X300), 3215/3218/3213 (X308), 4441/4443 (X350/X358), 12830/12831 (X351) | `CATXJ` (XJ6/XJ12), `CATXJ40` (X300 and XJ40 combined), `CATXJ8` (X308), `CATX350` (X350) — no SNG source confirmed for X351 | |
| XJS Range | 2213/2216/2211 | `CATXJS` | kept separate from XJ Range: a 2-door GT coupe/convertible on its own platform, not a 4-door saloon, spanning a different VIN era |
| XK Classic Range | none in sampled JEPC data | `CATXK120`, `CATXK140`, `CATXK150` | outside JEPC's own model list entirely; not the same car as XK Range below |
| XK Range | 3187/3183/3178/3173 (X100, "XK8"), 7420/7422 (X150, "the New XK") | `CATXK8` — **X100 only; no SNG source exists for the X150 half** | |

All Ranges in this table are treated as equal — there is no priority ordering
between them. Mark 2 Range, XK Classic Range, and Early Saloons additionally
have no JEPC data at all and would be populated solely from their SNG PDF
catalogue (§9, §11) if brought in, but that's a data-availability fact, not a
scope ranking.

**Accessories is the one deliberate exception to "a Range stays scoped to its
own vehicle."** Every other Range in the table above only ever aggregates
`modelId`s/catalogues belonging to that same car. Accessories is different by
design: it's an intentional cross-cutting bucket that pulls together accessory
data from *every* other Range into one unified branch, because the business
wants full, single-place coverage of accessory parts regardless of which
vehicle's catalogue they originate from.

**Structurally, `3484` ("Jaguar Accessories") is an ordinary group node, imported
exactly like any vehicle-family group** (e.g. `3175` "Jaguar XK8 Coupe/
Convertible") — it is not a separate standalone bucket sitting apart from
everything else. Its **leaf children** are the individual `<Model> Accessories`
entries: the generic `3482` ("Accessories") leaf, plus the named per-model
leaves identified so far — `F-PACE ACCESSORIES`, `F-TYPE ACCESSORIES`,
`S-TYPE ACCESSORIES`, `X-TYPE ACCESSORIES`, `XE ACCESSORIES`,
`XF ACCESSORIES`, `ALL NEW XF ACCESSORIES`,
`XJ RANGE ACCESSORIES FROM (V) G00442 to (V) H32732`,
`XJ RANGE ACCESSORIES FROM (V) V00001`, `XK ACCESSORIES FROM (V) A30645`,
`NEW XK ACCESSORIES FROM (V) B00379` — the same parent/leaf relationship as
`3175`'s own children (`3187/3183/3178/3173`). None of these named leaves
appear in the sampled `models_l_id_0.xml` (§4.3 only shows the `3482`/`3484`
pair) — their real `modelId`s are confirmed to exist by the business owner but
still need locating in the full model list before import; tracked as an open
question (§13). The whole group (`3484` + all its leaves) is imported in one
pass the same way any other Range's group+variants are imported — no separate
"standalone" handling is needed, since it was never structurally separate to
begin with.

Per the same duplicate-merging principle used for the vehicle Ranges themselves
(§4.13 intro), the following leaf pairs are merged into one entry each rather
than kept as separate VIN-range variants:
- `XF ACCESSORIES` + `ALL NEW XF ACCESSORIES` → one **XF Range Accessories**
  entry
- `XJ RANGE ACCESSORIES FROM (V) G00442 to (V) H32732` +
  `XJ RANGE ACCESSORIES FROM (V) V00001` → one **XJ Range Accessories** entry
- `XK ACCESSORIES FROM (V) A30645` + `NEW XK ACCESSORIES FROM (V) B00379` →
  one **XK Range Accessories** entry (covering both the X100 and X150
  generations, same as XK Range itself merges them, §4.13 intro)

The remaining named leaves (F-Pace, F-Type, S-Type, X-Type, XE) have no stated
duplicates and carry straight through as one Accessories leaf each. The generic
`3482` leaf remains its own entry alongside these, for accessory items that
aren't tied to any specific vehicle at all.

**Separately, a nested `ACCESSORIES`/`CONSUMABLES` branch also appears inside
some individual vehicle Ranges' own category trees** (§4.4) — confirmed by
example: the breadcrumb `XK8 Coupe/Convertible up to (V) 042775/ACCESSORIES/
CONSUMABLES/INDEX/AUDIO` (§4.5) shows this nested under the XK Range's own
X100 category hierarchy, alongside its other top-level category groups
(electrical, engine, body, etc.). This is a second, independent place accessory
data can live in the source — a nested category branch under the vehicle's own
`modelId`, not a leaf under `3484`. Per the import design: whenever this nested
branch is found under a vehicle Range's category tree, its data is imported and
filed under that vehicle's matching `<Model> Accessories` leaf under `3484`
(e.g. XK Range's nested branch folds into the merged **XK Range Accessories**
leaf above) rather than being left presented under the vehicle Range itself.
Should be assumed present under every Range's category tree (not just XK
Range) until an import pass confirms otherwise per Range.

Both mechanisms — the `3484` group/leaf hierarchy and any nested per-vehicle
`ACCESSORIES` branches — are read as ordinary JEPC category/model data; nothing
structurally special is needed to parse either one. What's special is purely
where the import files the result: everything ends up filed under the single
Accessories Range's leaf structure (`3482` generic, plus one merged leaf per
vehicle Range that has accessory data), regardless of which of the two JEPC
locations it actually came from. Individual accessory items may still carry
their own fitment/attribute data (§4.8) tying them to a specific vehicle
Range's VIN/attribute space — that fitment data is read and used normally; it
just doesn't change which Accessories leaf the item is filed under.

Mark 2 Range, XK Classic Range, and Early Saloons additionally have no JEPC
data at all and, if ever brought into scope, would be populated solely from
their SNG PDF catalogue (§9, §11) rather than from a JEPC import.

---

## 5. Existing Excel-based business system
The business has run on three linked spreadsheet artifacts since ~2014, manually
populated (no JEPC XML import): `jagports-parts.xlsx`, `jagports-parts-stock.xlsx`, and
a plain-text usage note `jagports-parts-stock.xlsx-OHJE.txt` ("OHJE" = Finnish for
"instructions", translating to: *"Open `jagports-parts.xlsx` first, then only after
that `jagports-parts-stock`. Read the instructions on row 1."* — the stock workbook
reads live from the parts workbook and must be opened second so Excel can resolve the
external-workbook link).

### 5.1 `jagports-parts.xlsx` — 3 sheets

**Sheet 1: `PartsMaster`** — the master parts list, an Excel Table object named
`Parts` (referenced by name from the second workbook's formulas). 441 data rows, 31
real columns. Columns, with notes on purpose and observed data quality:

| # | Column header (verbatim, incl. typos) | Purpose / observed values |
|---|---|---|
| 1 | `Jaguar PN (S)` | Jaguar part number, primary key. Mostly unique; ~15 rows have duplicates — likely superseded/reused PNs or genuine data-entry dupes, needs de-duplication logic. |
| 2 | `Model` | Free-text space-separated list of applicable models/chassis codes, e.g. `"Jaguar XK8 XKR X100 XJ8 XJR X308"`. Not normalized — an importer must tokenize against a controlled model/chassis-code vocabulary. |
| 3 | `Part` | Free-text part description. |
| 4 | `Stock` | Numeric quantity at last manual update — a snapshot, superseded in practice by the linked `Stock` column in the stock workbook (§5.2), which is the real source of truth. |
| 5 | `Jaguar ProdName` | Alternate/official product name; sparsely populated. |
| 6 | `VINmin` | Start of VIN range (sparse). |
| 7 | `VINmax` | End of VIN range (sparse). |
| 8 | `Part type` | Coarse category, free text (e.g. `Cap / Cover / Trim`, `Gasket / Seal / O-Ring`, `Kit`, `Bearing`) — the business's own taxonomy, independent of and complementary to JEPC's category tree (§4.4). Maps well to the multi-select filter in goal §2.II. |
| 9 | `Functionality` | Finer functional grouping, free text (e.g. `Engine Timing`, `Automatic Gearbox`, `Air Conditioning`) — inconsistent capitalization (`Engine timing` vs `Engine Timing`), needs case-normalization. |
| 10 | `Int / Ext / Engine Bay / Trunk` | Coarse physical zone. Inconsistent: `Interior`, `Exterior`, `Engine Bay` / `Engine bay` / `Enginebay` (3 spellings), `Trunk` / `Trunc` (typo), one combined `Engine Bay / Trunc`. Needs normalization to a fixed enum. |
| 11 | `Loc` | Front/rear position: `Front`, `Rear`, `Center`, plus inconsistent variants (`Front/Rear`, `FrontRear`, `Rear/Front`, `Front / Rear`, `Fron` typo, `Middle/Rear`, free text `from rear to front`, `NA`). |
| 12 | `LocSide` | Left/right position: `Left`, `Right`, `Center`, plus inconsistent forms (`Left/Right`, `LeftRight`, `Left /right`, `Left/right`, `L/R/Center`, lowercase `right`, `NA`). |
| 13 | `LocVertical` | Vertical position: `Top`, `Middle`, `Bottom`, `Low` (`Bottom` and `Low` used as synonyms — needs reconciling), plus `NA`/`N/A` (both spellings), one `Top(?)`, one combined `Top/M/Low`. |
| 14 | `LocPos` | Finer position detail, sparse (`Outer`, `Inner`, `Facia`, `Dashboard`, `Door`, `A-post`, `B-post`, `Center Console`, `Differential`, one typo `Trunc Fuxebox`). |
| 15 | `Colour/Trim` | Trim colour, sparse, inconsistent capitalization/spelling (`Sable` vs `Sable(?)`, `Warm Charcoal` vs `Warm charcoal`, `Blue` vs `Blue/Cratched`). |
| 16 | `Superseded PNs` | Other/older part numbers this one supersedes or is superseded by — sparse. A part-number lookup needs to also match superseded numbers, not just the current PN. |
| 17 | `Vendor Part Name` | Name as listed by the vendor the part was bought from (often SNG Barratt, British Parts) — distinct from `Part`. |
| 18 | `Vendor PN` | Vendor's own part number (often same as Jaguar PN, sometimes different for pattern/aftermarket parts). |
| 19 | `Price EU euro` | Cost price in EUR (sparse). |
| 20 | `eBay Listed` | Numeric flag (0 in all sampled rows) — likely 0/1 for "currently listed on eBay." |
| 21 | `Price Euro` | Sell price in EUR — appears to be a second, distinct price field from #19 (cost vs. sell) — worth confirming. |
| 22 | `Price PoundS` | Sell price in GBP. Some cells contain ratio-like values (e.g. `0.862...`) instead of currency — possible formula/unit-conversion artifact, worth spot-checking. |
| 23 | `PackSize\nXS/S/M/L/XL/C` | Shipping package size code, sparse. |
| 24 | `Shipping Inc/Exl` | Whether price includes/excludes shipping, sparse. |
| 25 | `URL` | Presumably link to a listing or reference image, sparse. |
| 26 | `Referrence Document` | Typo for "Reference Document" — sparse. |
| 27 | `Special Notes` | Free text notes, e.g. donor car and condition. |
| 28 | `Vendor / Donor Car` | Which donor car (or external vendor) the part came from. |
| 29 | `Donor Mileage\nKilometers` | Donor mileage (km). A table calculated-column formula `68000*1.61` (miles→km) confirms source data is often originally in miles. |
| 30 | `Vendors` | Currently empty in all sampled rows — possibly deprecated/unused, or intended for a controlled vendor list not yet populated. |
| 31 | `Stock value` | Appears to duplicate/derive from column 4 (`Stock`) — needs checking whether it's `Stock × Price` or just a duplicate quantity field. |

**Sheet 2: `eBay-TurboLister-2016071`** — a bulk-upload template for eBay's
discontinued Turbo Lister tool. 125 columns, 414 rows, mostly eBay-platform fields not
relevant to the new schema, but several key columns are live formulas pulling from
`PartsMaster`, confirming the intended data flow (spreadsheet → generated eBay listing):
```
Title            = PartsMaster!B<row> & " " & PartsMaster!$C<row>        (Model + Part)
Description      = rich HTML built from PartsMaster columns I,H,E,R,F,G,AB,AA,AD
                    (Functionality, Part type, ProdName, Vendor PN, VINmin, VINmax,
                     Condition, Notes, Vendor/Donor)
Custom Label     = PartsMaster!$Q<row>                                    (URL column)
C:Placement on Vehicle = PartsMaster!$K<row> & " " & L<row> & " " & $M<row>
                          (Loc + LocSide + LocVertical, e.g. "Front Right Low")
```
That last formula is the direct precursor of goal §2.I (click-a-location search) — a
`"Front Right Low"`-style location string has already been generated per part for
years; this maps straight onto the JEPC-diagram hotspot/location concept (§4.10) and
is a first-class field in the new schema (§6.5), not just an eBay-listing artifact.

**Sheet 3: `parts-eBay-UK-FileExchange`** — a near-empty template (1 header + 1
example row) in eBay's newer File Exchange bulk-upload format. Not formula-linked to
`PartsMaster` — a format-reference/starting template, not actively maintained. 45
columns, useful mainly as a reference for structured fields (e.g. `C:Manufacturer Part
Number`, `C:Placement on Vehicle`, `C:Vehicle Identification Number (VIN)`) an
"export to eBay" feature would need to produce.

### 5.2 `jagports-parts-stock.xlsx` — 2 sheets

**Sheet 1: `Stock`** — the actual physical inventory/warehouse-location tracker, the
real source of truth for "how many of this part, and where." 10 columns, ~49 data rows
(likely only currently-in-stock items are listed; sold items removed). Columns:

| Col | Header | Notes |
|---|---|---|
| A | `PN` | Part number — but not always a real Jaguar PN: sample data shows values like `"Balljoint-Boot"` (a made-up/descriptive key) alongside real PNs like `"CCC7028"`. An importer must handle both linked and unlinked (ad-hoc) inventory rows. |
| B | `Shelf` | Warehouse shelf code, e.g. `R2A` (Row 2, position A) — controlled vocabulary from `StockUnits.Shelfs`. |
| C | `Box` | Box code within the shelf, e.g. `B13`, `B01` — from `StockUnits.Boxes`. One row has `"Lokerikko"` (Finnish for "drawer/compartment cabinet") instead of a coded box — free text is possible even where a controlled list normally applies; the schema must tolerate this. |
| D | `BoxSub1` | Sub-compartment 1, e.g. `007`, `009`, `B13.008` (inconsistent format) — from `StockUnits.BoxSub1es`. |
| E | `BoxSub2` | Sub-compartment 2 (finer), e.g. `_N/A` (a literal placeholder used as an actual value), or free text like `"Valve Caps & Shims"` — from `StockUnits.BoxSub2es`, which also contains directional/grouping codes like `1/2`, `2/2`, `R1`, `R2` — this column is overloaded for more than one purpose (sub-box AND a broader zone code) and would benefit from clarification. |
| F | `Jagmodel(s)` | Formula-linked: `=VLOOKUP($A<row>,[1]!Parts[#All],2,)` — pulls `Model` from `PartsMaster`. |
| G | `Part-Short` | Formula-linked: `=VLOOKUP($A<row>,[1]!Parts[#All],3,)` — pulls `Part`. |
| H | `Part-jag` | Formula-linked: `=VLOOKUP($A<row>,[1]!Parts[#All],5,)` — nominally pulls `Jaguar ProdName`, but sample values look like category-path strings (e.g. `"STEERING AND SUSPENSION/WHEELS - Domed wheel nut..."`), not a short product name — worth double-checking against the live workbook. |
| I | `eBay` | Manually entered, sparse — likely a link/status for the current eBay listing of this specific stock item. |
| J | `Stock` | Formula-linked: `=VLOOKUP($A<row>,[1]!Parts[#All],4,)` — quantity is actually still sourced from `PartsMaster`, not entered directly here despite the sheet's name — a data-integrity gap: if quantity is updated in `PartsMaster` and location separately here, the two can drift. This is exactly the manual cross-referencing problem the new app removes. |

**Row 1** of this sheet contains an inline Finnish instruction (matching the `.txt`
note, §5): *"Open jagports-parts.xlsx first, and Shift+F9 (recalculate) to fill in the
PN!"* — the VLOOKUP formulas need a manual recalc trigger, another workflow friction
point the new app removes.

**Sheet 2: `StockUnits`** — the controlled-vocabulary/lookup-list sheet feeding the
`Shelf`/`Box`/`BoxSub1`/`BoxSub2` dropdown validations on `Stock`. Four parallel list
columns:
- `Shelfs`: mixes location codes from **two different sites** in one flat list —
  `ESPOO` (the business's first site, referenced by name alone; it currently has no
  shelf-level sub-codes of its own captured here, though the schema should allow it to
  gain them), and a series of `RnX`-formatted codes (`R1A`, `R1B`, `R1C`, `R1D`, ...)
  which are actually shelf codes belonging to a **second, separate site** — that
  second site's own name isn't recorded anywhere in this list (open question, §13).
- `Boxes`: `_N/A`, `B01`, `B02`, `B03`, `B04`, ...
- `BoxSub1es`: `_N/A`, `001`, `002`, `003`, `004`, ...
- `BoxSub2es`: `_N/A`, `1/2`, `2/2`, `R1`, `R2`, ... (mixed-purpose, as noted above)

The physical storage location model is a 4-level hierarchy: `Site → Shelf → Box →
Sub-compartment(s)`. The business already operates (at least) two sites today, not
one — `ESPOO`, currently with no shelf-level detail captured (though the schema should
allow it), and a second site whose shelves use the `RnX`-style codes above (its own
name needs confirming, §13). Multi-site is therefore not a hypothetical future
possibility but an already-real part of the current data that the schema (§6.3) needs
to represent from the start.

---


---

## 8. Third-party vendor data sources — live reconnaissance findings

> Paste this in as a new `## 8.` section in `jagports-JEPC-web-extension-1-Research.md`,
> after RES-13. Cross-ref prefix stays `RES`; new items are `RES-8.x`.

---

## 8. Third-party vendor data sources — live reconnaissance findings

Ad-hoc testing (via direct HTTP fetch and web search, not a real browser) against
three candidate `third_party_vendor` sources (SPEC-6.7), to determine which are
actually usable as automated data sources versus manual-reference-only. Test part
numbers used: `C2C41611`, `EBC9658`, `EAZ1354` (all genuine Jaguar oil-filter PNs;
`EAZ1354` fits several of the project's Ranges — XJ Range, XK Range, and
S-Type, 4.0L V8, 1997–2003).

### 8.1 Jaguar Land Rover Classic Parts (`parts.jaguarlandroverclassic.com`)
Official OEM channel (Magento storefront). **Fully usable without JavaScript.**
- **URL pattern**: `https://parts.jaguarlandroverclassic.com/<pn-lowercase>-<slug>.html`
  — the Jaguar PN itself is the URL key, so a direct PN→page mapping is possible in
  principle, though the exact slug isn't always guessable without a prior search hit
  (RES-13-style open item — worth confirming whether Magento's URL rewrite is
  PN-deterministic or slug varies unpredictably).
- **Availability signals observed** (three distinct states, not just binary in/out
  of stock):
  1. "Add to Bag" + price shown → orderable/in stock.
  2. No Add-to-Bag block, "No Longer Available" text → discontinued.
  3. **Both** "Add to Bag" *and* a separate "Contact Us to Purchase" button shown
     together (seen on `EBC9658`) → a third state, possibly special-order/backorder;
     meaning not confirmed, worth clarifying if this vendor is integrated.
- **Real-world corroboration of JEPC's own data model**: a fetched category page
  (an XK Range sill/valance assembly, X100 generation) showed a genuine supersession
  chain (`FJA2233AC → C2N3419`) and VIN-breakpoint-scoped sub-items (`FROM VINA40265`,
  `FROM VINA30645`) — the latter closely matches the project's own XK Range
  `modelId 3173` boundary (`From (V) A30645`, RES-4.13), independently corroborating
  that the modelId VIN-range splits correspond to real factory breakpoints, not
  arbitrary catalogue slices.
- **Cross-reference data available on-page**: superseded/replaced PN chains and
  aftermarket-brand cross-refs sometimes appear directly in retailer copy (not JLR
  Classic itself, but see 8.2) — e.g. `EBC9658` replaces `C42797`, `EAC1467`,
  `EBC10303`, `GFE154`, `GFE162` per multiple independent US OEM-parts retailers.

### 8.2 Nimark.fi (Finnish aftermarket importer/retailer)
Modern-looking storefront, but **server-rendered, no JS required** — confirmed by
successfully fetching and reading full page content via plain HTTP GET throughout
this investigation.

**Confirmed URL patterns:**
- Model list root: `nimark.fi/cars/jaguar/` — plain link list giving Nimark's own
  internal model IDs (useful directly for cross-referencing the project's Range
  taxonomy, §4.13):

  | Model | Nimark ID | Years |
  |---|---|---|
  | XK8 Convertible (X100) | 1577 | 1996.03–2006.12 |
  | XK8 Coupe (X100) | 1576 | 1996.03–2006.12 |
  | XJ (X308) | 4138 | 1996.09–2003.06 |
  | XJ (X350, X358) | 4977 | 2003.03–2009.03 |
  | XJ (X351) | 8797 | 2009.10–2019.12 |
  | XK II Cabriolet/Coupe (X150) | 5481 / 5480 | 2006.03–2014 |

- Vehicle+category drilldown: `/cars/<make>/<model-slug>_<category-slug>-<carId1>-<carId2>-<categoryId>/`
- Direct product page: `/buy/<brand-slug>_<aftermarket-pn>/` — carries clean,
  machine-readable Open Graph product meta tags in the raw HTML:
  ```
  meta-product:availability: in stock
  meta-product:brand: MAHLE ORIGINAL
  meta-product:price:amount: 11.90
  meta-product:price:currency: EUR
  meta-product:retailer_item_id: OC1177
  ```
- **Key discovery — OEM-PN cross-reference lookup**: `/price/<oem-pn>/`. This is a
  genuine cross-reference endpoint, keyed by the *Jaguar OEM PN*, not an aftermarket
  PN. Given `EAZ1354`, it returns a brand-disambiguation page (the same PN is used
  across JAGUAR, ROVER, and DAIMLER badge variants — directly relevant to the
  Daimler-badged trims that fall within the project's XJ Range scope), each linking to
  `/price/<brand>_<oem-pn>/`, which returns the **full aftermarket cross-reference
  list** — brand, their PN, live price, stock/delivery text — each row linking to
  its own `/buy/` page. Example, `EAZ1354` (Jaguar):

  | Brand | Their PN | Price | Delivery |
  |---|---|---|---|
  | WIX Filters | WL7267 | €13.05 | Hyllyssä (in stock) |
  | Blueprint | ADJ132124 | €10.90 | 1–4 days |
  | Filtron | OP6541 | €12.25 | 1–3 days |
  | Bosch | 0451103335 | €17.10 | 1–3 days |
  | Mahle Original | OC323 | €17.80 | 1–3 days |
  | Hengst Filter | H14W35 | €19.70 | 1–3 days |
  | Mann Filter | W7197 | €20.90 | 1–3 days |

- **Important caveat on discoverability**: these `/price/` pages are not indexed by
  general web search (Google has not crawled them, likely because nothing links to
  them publicly) — they were only found by replicating the site's own in-page
  autosuggest search behavior (confirmed via the person manually using Nimark's
  "Haku" box and copying the resulting URL). This means: the URL *pattern* is
  reusable once known, but it cannot be "discovered" by search-engine reconnaissance
  alone — it has to be learned once, directly, the way it was here.
- **Coverage caveat**: Nimark is a general multi-marque aftermarket importer
  (TecDoc-style catalogue spanning ~70 brands), not a Jaguar specialist — coverage of
  older/rarer parts is not guaranteed to match a genuine Jaguar EPC.
- **Reputation caveat**: Trustpilot shows a small number (13) of reviews including
  at least one substantive returns/customer-service complaint. Not blocking for
  read-only price/availability use, but worth noting if the app ever recommends
  Nimark as a purchase channel to end customers.

### 8.3 SNG Barratt (`sngbarratt.com`) — confirmed NOT usable for automation
UK-based Jaguar parts specialist (remanufactures/stocks parts under their own PN,
per RES-5.1's `Vendor PN` data).
- **Confirmed 100% client-side rendered (AngularJS SPA)**: every route tested —
  including `/English/DE/home?saveBranch=DE...`, `/English/UK/PartNumberGuide`, and
  others — returns an **identical** server-side HTML shell that explicitly states:
  *"Sorry, this website requires JavaScript to function correctly."* No product,
  price, or search data is present in the raw HTML at all; it's all populated
  client-side after page load.
- **Search endpoint is explicitly blocked**: a direct fetch of their search-results
  URL (`/English/de/search/results?...&query=EAZ1354...`) was refused outright —
  `robots.txt` disallows automated access to that path. This is a deliberate
  site-owner decision, not just a technical limitation.
- **Net conclusion**: SNG Barratt cannot be integrated as an automated
  `third_party_vendor` data source using HTTP-only tooling, and their own robots.txt
  indicates they don't want it scraped even with a JS-capable tool. Recommend
  **excluding SNG Barratt from automated integration** (see RES-10.4.3). Their site
  remains useful only as an occasional manual reference (e.g. the LHD/RHD wiper-arm
  fitment split found via a hosted parts-diagram PDF during this research, RES-8.4).

### 8.4 Cross-vendor summary

| Vendor | Rendering | PN-keyed lookup? | Automatable? | robots.txt blocks it? |
|---|---|---|---|---|
| JLR Classic Parts | Server-rendered | Yes (PN = URL slug) | Yes | No (not tested explicitly, but pages fetch cleanly) |
| Nimark.fi | Server-rendered | Yes (`/price/<pn>/`) | Yes | No |
| SNG Barratt | Client-rendered (JS SPA) | N/A — client-side only | **No** | **Yes**, on search |

### 8.5 Incidental finding — real-world LHD/RHD fitment example
An SNG Barratt catalogue diagram (found via a third-party hosted PDF, not the SNG
site itself) showed a wiper-arm item, from the XK Range's X100 generation, splitting
into 4 distinct Jaguar PNs across two independent attribute axes (hand-of-drive ×
driver's/passenger's side) — a concrete, real-world validation case for the
`A<groupId>` attribute-fitment mechanism (RES-4.8) once real attribute files for an
XK Range category are available to test against.

---

## 9. SNG Barratt PDF parts catalogues — a viable, separate data source

### 9.1 What was found
SNG Barratt publishes full parts catalogues per model as downloadable PDFs
(filename pattern `CAT<code>-Download<year>.pdf`). The full set identified, with
the model name as printed on each catalogue's own cover page, and the Range (§4.13)
each maps to:

| Cover-page model name | Filename | Range |
|---|---|---|
| E-Type 6 Cylinder | `CATE6-Download2019.pdf` | E-Type |
| E-Type V12 | `CATEV12-Download2019.pdf` | E-Type |
| Early Saloons | `CATEARLY-Download2019.pdf` | Early Saloons |
| Jaguar Mk2 3.4, 3.8 and 340 | `CATMK2-Download2021.pdf` | Mark 2 Range |
| S-Type | `CATS-Download2019.pdf` | S-Type |
| X-Type | `CATX-Download2019.pdf` | X-Type |
| X300 and XJ40 | `CATXJ40-Download2019.pdf` | XJ Range |
| X308 | `CATXJ8-Download2019.pdf` | XJ Range |
| X350 | `CATX350-Download2019.pdf` | XJ Range |
| XJ6 and XJ12 | `CATXJ-Download2019.pdf` | XJ Range |
| XJS | `CATXJS-Download2019.pdf` | XJS Range |
| XK120 | `CATXK120-Download2019.pdf` | XK Classic Range |
| XK140 | `CATXK140-Download2019.pdf` | XK Classic Range |
| XK150 | `CATXK150-Download2019.pdf` | XK Classic Range |
| XK8 | `CATXK8-Download2019.pdf` | XK Range — **covers the X100 generation only; SNG
  publishes no catalogue for the X150 ("the New XK") half of this Range** |

None of these 15 files have been downloaded/parsed into this project yet (fetching
them is token-expensive and was deliberately deferred) — this table exists so a
future import pass knows exactly which files to pull, per Range, without
re-researching what's available. Filenames are recorded as `source_reference`
values under the `sng_pdf_catalogue` provenance type (SPEC-6.11) once import
begins.

The site itself explicitly invites this kind of download — this is intended,
sanctioned customer use, not a workaround of the JS/robots restrictions found in
RES-8.3. The website's search/product pages and the PDF catalogues are two
entirely different publishing channels with different access rules; the PDF
channel is open.

### 9.2 Data format — genuinely suitable for structured extraction
The PDF has a **real text layer** (not scanned images) — confirmed by directly
fetching and reading full text content, no OCR needed. The catalogue's own internal
structure closely parallels JEPC's own data model:

- **Section = category**: pages are grouped under named sections (`ENGINE BLOCK`,
  `CYLINDER HEAD & CAM COVER`, `OIL COOLERS & PIPES`, etc.) — directly analogous to
  JEPC's category tree (RES-4.4) and this catalogue's own stated "Guide to Contents"
  page-range index at the front, which could drive a table-of-contents-based
  chunking strategy for import.
- **Item = drilldown leaf**: each section contains numbered items matching numbered
  callouts on an accompanying exploded diagram — directly analogous to JEPC's
  `itemNo` / top-level-items concept (RES-4.6) and item-drilldown leaf rows (RES-4.7).
- **Per-line record shape**, consistently observed throughout:
  ```
  <item#>. <description> [<qualifier clause(s)>] <PARTNUMBER> <qty>
  ```
  e.g.:
  ```
  1. Oil filter, 4.0 Litre EAZ1354 1
     Oil filter, 4.2 Litre C2C41611 1
  ```
  — **both PNs used as test cases earlier in this project's own research (RES-8)
  appear verbatim in this catalogue**, a direct validation that the extraction
  target is real and consistent with data already gathered.
- **VIN breakpoints embedded inline**, same bracketed style throughout, e.g.
  `(to VIN 042775)`, `(from VIN A00083 to A30644)`, `(from VIN A30645 to A36873)` —
  structurally the same concept as JEPC's own `C` VIN-breakpoint records (RES-4.8),
  just expressed as catalogue prose rather than coded fields.
- **Engine/trim qualifier clauses**: `4.0 Litre` / `4.2 Litre`,
  `supercharged` / `non supercharged`, `RHD` / `LHD` — the same kind of
  attribute-driven PN split as JEPC's `A<groupId>` mechanism (RES-4.8), again
  expressed as free text rather than coded group/value pairs.
- **Explicit supersession/replacement notes**, richer than JEPC's simple
  `isSuperSeded` flag — sometimes a full multi-part replacement kit, e.g.:
  > *"Idler pulley NCC7753AD is currently unavailable. Replace this part with:
  > Bracket, idler mounting C2C37056 (1), Tensioner, drive belt C2C37056 (1),
  > Pulley, idler C2S46862 (1), Drive belt C2C37005 (1)"*
  — a genuine one-to-many supersession case your `part_supersession` table
  (SPEC-6.1) doesn't currently model (it assumes one-to-one old→new).

### 9.3 Caveats / limitations
- **Not all part numbers in this catalogue are genuine Jaguar OEM PNs.** SNG
  Barratt's own kit/consumable codes appear alongside real Jaguar PNs (e.g.
  `TCK8MAJ/1` for a timing chain kit, `MOR001`–`MOR045` for their Morris Lubricants
  range, `BSSJR039` for a Bell exhaust upgrade kit). Any import needs a rule for
  telling these apart from genuine `jepc_part.jaguar_pn`-shaped strings — the real
  Jaguar PNs in this catalogue follow recognisable patterns already documented in
  RES-4.7 (e.g. `AJ8xxxx`, `C2Nxxxx`, `NCAxxxxxx`, `EAZxxxx`), while SNG's own codes
  don't.
- **No coded attribute system.** Unlike JEPC's `A<groupId>`/`valueCode` pairs, all
  qualifiers here are free-text English phrases needing pattern-matching/NLP-lite
  parsing, not exact key lookups — meaningfully harder to parse reliably than
  JEPC's own bracketed pseudo-CSV format (RES-4.2).
- **Item numbers reset per section/diagram** and are only meaningful in
  conjunction with the (not-yet-extracted) exploded-diagram image on the same page
  — this text-only extraction captures the parts-list half of each page but not the
  diagram-to-item-number visual mapping. A full import would need a separate
  image-extraction pass per page, similar in spirit to JEPC's own hotspot problem
  (RES-4.10), and just as unsolved for this new source.
- **Copyright framing**: this is SNG Barratt's own compiled, organized catalogue
  content — same general category of consideration as this project's own opening
  copyright note about JEPC data (personal/legitimate-access use, not
  redistribution). Explicitly offered for free customer download strengthens (but
  doesn't by itself resolve) the legitimate-personal-use framing; worth treating
  the same way the project already treats JEPC's own data.

### 9.4 Relationship to RES-8.3 (SNG Barratt website)
This is a **materially better** SNG Barratt integration path than anything found
via their website: no JavaScript, no robots.txt restriction, no per-request live
fetching at all — just a handful of large PDF documents, one per model, downloaded
once and parsed offline. It doesn't give live price/stock (the PDFs are static
catalogues, not live inventory), but for the pure part-number/fitment/attribute
data this project actually needs to cross-reference against JEPC, it may be a
richer structured source than the live site would have been anyway.


## 10. Third-party vendor integration plan
Extends SPEC-6.7 with a concrete per-vendor integration design, informed by RES-8's
live reconnaissance findings. IMPL-1 implements this plan directly.

RES-8 established that the three candidate `third_party_vendor` sources are **not
uniform** — they differ fundamentally in how (or whether) they can be queried
programmatically. SPEC-6.7 defines the vendor/part/xref data model but doesn't
specify *how data gets into it*. This section closes that gap.

### 10.2 Vendor integration tiers

**Tier A — Live, PN-keyed query** (JLR Classic Parts, Nimark.fi):
Given a `jepc_part.jaguar_pn`, a page can be fetched directly (or via one
intermediate disambiguation hop) with a plain HTTP GET, no browser/JS engine
needed. Suitable for on-demand lookup (e.g. "show current third-party prices for
this part" in the admin UI) as well as scheduled refresh.

**Tier B — Not integrable via automation** (SNG Barratt):
Confirmed 100% client-rendered SPA; search endpoint additionally blocked by
`robots.txt`. **Decision: exclude from automated integration entirely.** Their
robots.txt is a explicit signal the site owner doesn't want this, and building a
JS-executing scraper to route around both the technical and stated-preference
barrier is not something this project should do. If SNG Barratt data is ever
wanted, the only acceptable path is a manual, occasional, human-driven lookup (the
person copies a PN/price in by hand) — not an automated importer.

### 10.3 Schema addition to SPEC-6.7
Add two fields to `third_party_vendor` (SPEC-6.7) to formalize the tiering decision
directly in the schema, so the importer's behavior per vendor is data-driven rather
than hardcoded per-vendor logic scattered through the codebase:
```
third_party_vendor
  ... (existing fields)
  integration_method     (enum: live_scrape_pn_keyed | live_scrape_vehicle_keyed |
                          manual_reference_only)
  integration_url_pattern (nullable, template string, e.g.
                          "https://www.nimark.fi/price/{pn_lower}/" — used by the
                          importer to build request URLs; null for
                          manual_reference_only vendors)
```

### 10.4 Per-vendor field mapping

#### 10.4.1 Jaguar Land Rover Classic Parts
- `integration_method = live_scrape_pn_keyed`
- `integration_url_pattern = "https://parts.jaguarlandroverclassic.com/{pn_lower}-{slug}.html"`
  — **open item**: slug is not currently known to be deterministic from the PN
  alone; needs one confirmed example of the URL-generation rule (or a fallback via
  their on-site search) before this can be fully automated. Track as open question
  alongside RES-13.
- Page → `third_party_part` mapping:
  - `vendor_part_number` = SKU shown on page (usually == Jaguar PN itself for this
    vendor, since it's the OEM channel — but still stored via
    `third_party_part`/`third_party_part_xref` with `relationship = equivalent_to`,
    not written directly onto `jepc_part`, to keep the "two independent data
    sources joined at query time" principle from RES intact)
  - `last_seen_price`, `currency_code` = from `meta-product:price:amount` /
    the GBP context of the page
  - Availability → a vendor-side status string, distinct from `jepc_part_occurrence.part_state`
    (SPEC-6.1) since this is *this vendor's* stock, not Jaguar's factory-supply
    status: `in_stock` (Add-to-Bag shown), `discontinued` ("No Longer Available"
    shown, no Add-to-Bag), `special_order` (both Add-to-Bag *and* "Contact Us to
    Purchase" shown — meaning to be confirmed before relying on it)

#### 10.4.2 Nimark.fi
- `integration_method = live_scrape_pn_keyed`
- `integration_url_pattern = "https://www.nimark.fi/price/{pn_lower}/"`
- Two-step fetch:
  1. Fetch the base `/price/{pn_lower}/` page → parse the brand-disambiguation
     table (brand name + link). If more than one brand is returned (e.g. JAGUAR /
     ROVER / DAIMLER sharing one PN), the importer needs a rule for which to
     follow — recommend: follow all of them and store each under the correct
     `jepc_part` if the business's own known-cars badge (Jaguar vs Daimler) can be
     inferred from context, otherwise flag for manual review rather than guessing.
  2. Fetch `/price/{brand}_{pn_lower}/` → parse each row: brand, their PN, price
     (EUR), delivery/stock text. Each row maps to one `third_party_part` +
     `third_party_part_xref` (`relationship = equivalent_to`).
  - Optionally follow each row's `/buy/{brand}_{their_pn}/` link for the fuller
    OG-meta-tag product page if more detail is wanted (image, exact availability
    enum) — not required for the core price/xref use case.
- Availability text mapping: `"Hyllyssä"` → `in_stock`; a numeric day-range (e.g.
  `"1-3"`) → `available_to_order` (with `eta_days` captured separately, not folded
  into the enum); absence of the product entirely → not applicable (the vendor
  just doesn't carry it).

#### 10.4.3 SNG Barratt
- `integration_method = manual_reference_only`
- `integration_url_pattern = NULL`
- No importer code targets this vendor. If a person on the business side wants to
  record an SNG Barratt price/PN for a part, they do so the same way they'd add any
  other free-text vendor note today — through the normal `third_party_part` admin
  entry form, typed in by hand, not fetched.

### 10.5 Refresh cadence
SPEC-6.7 already establishes that third-party pricing should be "refreshable/
comparable independent of what's currently in stock." For Tier A vendors:
- **Scheduled batch refresh** (e.g. nightly or weekly) re-fetches
  `last_seen_price`/`last_checked_date` for every `third_party_part` row already
  linked to a `jepc_part` the business stocks or has flagged as relevant — keeps
  reference pricing current without live-fetching on every page view.
- **On-demand refresh** (admin clicks "check current price") re-fetches a single
  part immediately — useful when adding new stock or preparing a listing.
- Both paths call the same per-vendor adapter (RES-10.4.x); only the trigger differs.

### 10.6 Etiquette / legal posture
- Respect each vendor's `robots.txt` programmatically at request time, not just as
  a one-off manual check — if a site's rules change later, the importer should
  notice and stop, not keep working off a stale assumption.
- Set a descriptive `User-Agent` identifying the tool and a contact address, per
  normal scraping courtesy, on both Tier A vendors.
- Rate-limit requests (batch refresh should not hammer either vendor's site);
  exact interval TBD, default conservatively (e.g. 1 request/second or slower)
  until real load patterns are known.
- This is read-only reference-price scraping of publicly served pages, not
  circumventing any login/paywall — consistent with the project's existing
  copyright/legitimate-access framing in the RES file's opening note.
  
  
## 11. Optional future: SNG Barratt PDF catalogue as a secondary parts-data source
Everything in this section is explicitly **optional and future-scoped** — not part
of the core JEPC-import build, and not scheduled.

### 11.1 What this would be
A **second, independent, offline import path** — parallel to the JEPC XML import
(RES-4, SPEC-6.1), not a replacement for it or a live third-party-vendor
integration (contrast with RES-10.2/10.3's Tier A/B vendor model, which is about
*pricing/availability* cross-references, not primary parts data). This would treat
SNG Barratt's own published PDF catalogues (RES-9) as an alternate parts-catalogue
source that could supplement or cross-check JEPC data for any Range in scope
(§4.13) — including Ranges like Mark 2 Range, XK Classic Range, and Early Saloons
that have no JEPC data at all and, if ever brought into scope, would be populated
solely via this path.

### 11.2 Why it's worth keeping on the radar
- The PDF text structure (RES-9.2) is close enough in shape to JEPC's own
  category→item→part hierarchy that the same conceptual schema (SPEC-6.1's
  `jepc_part`/`jepc_part_occurrence`, or a close sibling of it) could plausibly
  hold PDF-sourced records too, rather than needing an entirely separate data
  model.
- It could serve as a **cross-validation source**: for parts and VIN-breakpoints
  that already exist in the JEPC import, matching PN + breakpoint against SNG
  Barratt's catalogue is a way to sanity-check the JEPC-derived data (or JEPC's own
  quirks — the isDFS-flag and internalPartNo client-code open questions in RES-13
  might even become easier to reason about with a second source to compare
  against).
- It could plausibly fill in models or parts where JEPC's own local data files
  (whatever install snapshot the business actually has) turn out to be incomplete
  — the PDF catalogues are current SNG Barratt publications, not tied to the same
  ~2007–2012-era JEPC snapshot.

### 11.3 Why this stays optional/future rather than immediate
- The core project deliverable (RES-2's "required functionality") is built around
  JEPC as the authoritative parts hierarchy; adding a second full parts-hierarchy
  source is a meaningfully larger scope increase than the vendor-pricing
  integration in RES-10, and should be a deliberate later decision, not
  something the importer silently grows into.
- The free-text qualifier/VIN-breakpoint parsing needed (RES-9.3) is a real,
  non-trivial NLP-lite parsing task distinct from (and harder than) JEPC's own
  bracketed pseudo-CSV parsing (RES-4.2) — this is genuinely more implementation
  effort than the live-vendor adapters in IMPL-1.
- Distinguishing genuine Jaguar PNs from SNG's own kit/consumable codes (RES-9.3)
  needs a validated pattern-matching rule before any automated import could trust
  its own output — not yet built or tested.
- Diagram/item-number image extraction (RES-9.3) is an open problem here just as
  it is for JEPC's own hotspot system (RES-4.10/RES-13) — doubling the amount of
  unsolved image-coordinate work rather than reusing a solution.

### 11.4 If/when this gets picked up
Suggested shape for a future implementation (not scheduled, no IMPL tasks written
yet):
1. Pick the target Range(s) from RES-9.1's catalogue table and download the
   corresponding PDF(s) — for Ranges with no SNG catalogue at all (e.g. the X150
   half of XK Range), this path simply isn't available and JEPC (or another
   future source) remains the only option.
2. Build a section/item/PN/qty line-parser against the confirmed text-record shape
   (RES-9.2), tolerant of the VIN-breakpoint and qualifier-clause variations
   already catalogued.
3. Build a genuine-Jaguar-PN-vs-SNG-own-code classifier (regex against the known
   Jaguar PN prefix families already documented in RES-4.7, e.g. `AJ8`, `C2N`,
   `NCA`, `EAZ`, etc.) before writing any row into `jepc_part`-shaped tables.
4. Treat output as a `source = 'sng_pdf_catalogue'`-tagged overlay/cross-reference
   against existing JEPC-derived data, not a blind merge — surfacing
   discrepancies for manual review rather than silently overwriting JEPC-derived
   fields.


## 12. Optional future: historical Jaguar marketing materials as a secondary source
Everything in this section is explicitly **optional and future-scoped**, at an
even earlier stage than §11 — no specific documents have been located yet, this
is a direction to keep on the radar, not a researched finding.

### 12.1 What this would be
Alongside SNG Barratt's parts catalogues (§9, §11), historical Jaguar-published
materials — sales brochures, press kits, owner's handbooks, factory technical
bulletins/service notes, dealer materials — for any Range in the taxonomy (§4.13)
could plausibly serve as a **different kind of secondary source**: not primarily
a parts/PN source the way JEPC or the SNG catalogues are, but a source of
model-identification detail (trim names, factory option names, model-year
styling changes, colour/trim codes) that could help decode some of this
project's own open questions — most notably the unresolved `A<groupId>`
attribute-meaning problem (RES-4.8, RES-13) and the sparse `Colour/Trim` field
in the business's own Excel data (RES-5.1 col 15).

### 12.2 Why it's worth keeping on the radar
- Marketing materials often name factory options and trim levels in plain
  language where JEPC only has an opaque numeric code — a possible route to
  finally attaching human-readable meaning to `A<groupId>`/`valueCode` pairs
  without needing Jaguar's own internal documentation.
- Owner's handbooks and technical bulletins sometimes give VIN/engine-number
  breakpoints tied to running production changes, the same kind of fact this
  project already extracts from JEPC (§4.8) and SNG catalogues (§9.2) — another
  potential cross-validation source, same spirit as §11.2's case for the SNG
  PDFs.
- Unlike SNG's compiled catalogues, original Jaguar-published material would be
  a primary source for period-correct terminology and factory-original colour/
  trim naming, which could help normalize the Excel data's own inconsistent
  `Colour/Trim` values (RES-6.9).

### 12.3 Why this stays optional/future rather than immediate
- No actual documents, URLs, or archives have been identified yet — this is a
  direction, not a reconnaissance finding the way §8/§9 are. A first pass would
  need to locate what actually exists and where (manufacturer archives, owners'
  clubs, enthusiast-run scan archives) before any format/extraction work could
  even begin.
- Format is likely far less uniform than either JEPC's bracketed pseudo-CSV
  (RES-4.2) or SNG's catalogue-style PDFs (RES-9.2) — marketing copy has no
  consistent per-line record shape to parse against, so this would be a much
  more manual, human-curated research task than an automatable import.
- Copyright framing needs separate consideration from JEPC/SNG: original Jaguar
  marketing material is Jaguar/JLR's own copyrighted content, not something the
  business has an existing customer relationship or download-access framing for
  the way JEPC (owned software) or SNG's catalogues (offered for free customer
  download, RES-9.1) do. This would need its own legitimate-access check before
  relying on any specific source, separate from this project's existing opening
  copyright note.

### 12.4 If/when this gets picked up
Not scheduled, no IMPL tasks written yet. First step would simply be a
reconnaissance pass (in the style of RES-8/RES-9) to identify what materials
actually exist, in what format, and under what access terms, per Range —
before any decision about extraction or import is made.

---

## 13. Issues / open questions to clarify
- **13.1. Deployment scope vs. import scope** — goal §2 assumes the importer/parsing layer
  supports the full JEPC data format regardless of model. All Ranges (§4.13) are
  treated equally, so this is not a question of priority — but Mark 2 Range, XK
  Classic Range, and Early Saloons have no JEPC data at all and would need to be
  populated solely from their SNG PDF catalogue (§9, §11) if imported; confirm
  whether/when that SNG-only import path gets built versus staying JEPC-only for
  now.
- **13.2. `A<groupId>` attribute meanings** — the numeric group ids (engine type, trim,
  transmission, etc.) are not decoded. Not required for the filtering algorithm itself
  (§4.8), which only needs to compare a vehicle's own list of `groupId`/`valueCode`
  pairs against a part's requirements without knowing what any group "means" — but
  decoding them would let the UI show human-readable option names instead of raw
  codes, and would help troubleshoot filtering results. Would likely require either a
  labels/lookup XML file not yet located, or inferring meaning from cross-referencing
  many category attribute files against known factory option codes.
- **13.3. Vehicle attribute source for VIN search** — vehicle-specific search (goal §2.III)
  is now a standard, non-deferred feature, but JEPC's own VIN→attribute decode has no
  offline data path (§3/§4.8). Need a source for a vehicle's attribute list to filter
  against: likely limited at first to vehicles already recorded as a Donor Vehicle
  (§6.4) with known attributes, rather than an arbitrary typed-in VIN.
- **13.4. `internalPartNo` client code** (the 2 characters after `pb_` in field 8 of an item
  drilldown record, §4.7) — purpose not confirmed, possibly a plant/region code.
- **13.5. Field index 9** of the item-drilldown 12-field schema (§4.7) is present but unused
  by the client code seen so far — meaning unknown.
- **13.6. `isDFS` flag** (field index 5, §4.7) — likely "Discontinued/Direct Factory Supply"
  or similar, not fully confirmed.
- **13.7. Flash-image ↔ full-size-PNG filename linkage** (§4.1/§4.5) — likely but not
  directly proven on a single category that has both a `flash/images`+`flash/xml`
  pair and an `illustrations/png` entry sharing the same code.
- **13.8. `hotspotClick()` definition** — referenced in `JEPCProductDrillDown.html` (§4.9)
  but not located in any JS file reviewed so far. Low priority since the new app only
  needs the underlying data (already decoded, §4.10), not Jaguar's own click-handling.
- **13.9. Hotspot ↔ itemNo reverse cardinality** — confirmed that each hotspot resolves to
  one `itemNo` (§4.9), but not confirmed whether a given `itemNo` can be the target of
  more than one hotspot region on the same diagram.
- **13.10. Hotspot coordinate formula** (§4.10) — the twips-based conversion is a plausible
  hypothesis, not yet visually validated against a real rendered hotspot; alternative
  explanations that could produce a similar-looking relationship include a Flash-stage
  scale transform inside `PartImage.swf` itself, image letterboxing/centering within
  the fixed 400×500 movie canvas, or some other SWF-internal coordinate transform —
  needs checking against an actual rendered diagram before relying on it.
- **13.11. Real `Price_...xml` sample** — field meaning is known from code (§4.12), but no
  real numbers or currency-name field have been seen yet. This is now needed (not
  optional) given the legacy reference-pricing feature (§6.10) — specifically, where
  in these files (or in session/install metadata) the currency *name* is recorded, and
  which installations/machines have the USD-2009, GBP-2009, and RUB-~2012 snapshots
  available to import.
- **13.12. `BoxSub2` overloading** (§5.2 col E) — the list also contains directional/grouping
  codes (`1/2`, `2/2`, `R1`, `R2`) alongside genuine sub-compartment labels; needs
  clarifying whether this is really one field doing two jobs.
- **13.13. `Stock` sheet column H (`Part-jag`)** (§5.2) — formula nominally pulls
  `Jaguar ProdName` from `PartsMaster`, but sample values look like category-path
  strings instead — worth checking against the live workbook.
- **13.14. `Stock value` column** (`PartsMaster` col 31, §5.1) — unclear whether this is
  `Stock × Price` or a duplicate of the `Stock` quantity column.
- **13.15. `Price EU euro` vs `Price Euro`** (`PartsMaster` cols 19/21, §5.1) — needs
  confirming which is cost and which is sell price.
- **13.16. Image-pin coordinate system** (§6.6's `admin_part_pin`) — before building the
  pinning UI, need to decide whether admins pin on the small Flash-viewer JPGs
  (twips-based coordinate hypothesis per §4.10) or the full-res illustration PNGs
  (presumably plain pixels), since that affects how the UI captures and converts click
  coordinates.
- **13.17. Second site's name** — the `RnX`-style shelf codes in `StockUnits.Shelfs` (§5.2)
  belong to a second business site distinct from `ESPOO`, but that site's own name
  isn't recorded anywhere in the Excel data; need the actual name to populate
  `storage_location.site` (§6.3).
- **13.18. Listing "committed quantity" policy** (§6.5's `available_quantity`) — whether a
  `draft` listing should reserve stock the same way an `active` one does, or only
  `active`/`sold` listings count against `quantity_on_hand`.
- **13.19. Standalone Accessories Range fitment scope** (§4.13) — need to confirm
  during import whether individual accessory items (under `3484`'s leaves, or
  under a nested per-vehicle `ACCESSORIES` branch) carry their own
  per-vehicle-Range fitment/attribute data (§4.8) the way ordinary parts do, or
  whether fitment for this Range has to be sourced/entered differently.
- **13.20. Per-model Accessories leaf `modelId`s** (§4.13) — the business owner has
  confirmed by name that leaf entries like `F-PACE ACCESSORIES`,
  `XF ACCESSORIES`/`ALL NEW XF ACCESSORIES`, `XJ RANGE ACCESSORIES FROM (V)
  G00442 to (V) H32732`/`...FROM (V) V00001`, and `XK ACCESSORIES FROM (V)
  A30645`/`NEW XK ACCESSORIES FROM (V) B00379` exist as children of `3484`, but
  none appear in the sampled `models_l_id_0.xml` — their real `modelId`s need
  locating in the full model list before these can be imported and merged as
  specified.
- **13.21. Historical marketing materials as a source** (§12) — nothing has been located
  yet; open until a reconnaissance pass identifies what actually exists, in what
  format, and under what access/copyright terms.

### Design principle
Flat spreadsheet rows are a poor fit for this data: a real relational (or document)
database is needed so that **one physical part number can be correctly linked to
many models/VIN-ranges/locations/attributes** without duplicating rows per
combination, and so the catalogue tree, fitment rules, images, and stock/location
data can all be queried together instead of manually cross-referenced by eye.

### Deliverables
The project's end goal includes, as explicit deliverables:
- The JEPC-data import scripts (bulk XML → database, per Steve/jPart's cache-once
  approach above).
- The **actual database creation scripts** (DDL/migrations) that instantiate the
  schema in §6 — not just the schema design itself.
- The web application (public browse/search UI + admin back-end) described above.