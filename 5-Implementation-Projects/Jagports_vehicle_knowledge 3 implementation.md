## IMPL-1. Third-party vendor adapters
Implements the design in RES-10, built on the reconnaissance findings in RES-8.

### IMPL-1.1 Shared infrastructure
- [ ] HTTP client with: descriptive `User-Agent` (tool name + contact), per-domain
  rate limiting, `robots.txt` check before first request to a new domain per run
  (cache the parse, don't re-fetch robots.txt every call).
- [ ] HTML parser (e.g. `BeautifulSoup`/`lxml` or equivalent in the chosen stack) —
  both target vendors are plain server-rendered HTML, no headless browser needed.
- [ ] Generic `third_party_part` upsert function: given
  `(vendor_id, vendor_part_number, price, currency, checked_date, url)`, insert or
  update by `(vendor_id, vendor_part_number)`.
- [ ] Generic `third_party_part_xref` upsert: given `(tp_part_id, part_id,
  relationship)`, insert if not already present.
- [ ] Logging: every fetch attempt (success/fail/skip-by-robots) logged with
  timestamp — needed both for debugging and for proving good scraping etiquette if
  ever questioned.

### IMPL-1.2 JLR Classic Parts adapter
- [ ] Resolve URL for a given Jaguar PN. Since the slug portion isn't confirmed
  deterministic (RES-10.4.1 open item): implement a two-path resolver —
  1. Try the naive pattern `{pn_lower}-{best-guess-slug}.html` derived from the
     part's own description if available.
  2. Fall back to their on-site search (needs its own reconnaissance pass — not
     yet tested in this project; treat as a follow-up research task, not assumed
     working).
- [ ] Parse page: extract SKU, price (`meta-product:price:amount` /
  `meta-product:price:currency` if present, else visible price text), and
  availability state per the three-state rule in RES-10.4.1 (Add-to-Bag present /
  absent+NLA text / both present).
- [ ] Map to `third_party_part` (vendor = JLR Classic Parts) +
  `third_party_part_xref` (`relationship = equivalent_to`, since this is the OEM
  channel selling the genuine Jaguar PN itself).
- [ ] Unit test against the known-good sample already captured in this project's
  research: `C2C41611` (in-stock case, has Add-to-Bag) and `EBC9658` (dual
  Add-to-Bag + Contact-Us case) as fixtures.

### IMPL-1.3 Nimark.fi adapter
- [ ] Step 1: fetch `https://www.nimark.fi/price/{pn_lower}/`. Parse the
  brand-disambiguation table (columns: `Merkki` / brand, link). If the table has
  exactly one row, proceed directly; if more than one, apply RES-10.4.2's rule
  (match against known badge for this `jepc_part`'s model, else flag for manual
  review — do not silently guess).
- [ ] Step 2: fetch `https://www.nimark.fi/price/{brand}_{pn_lower}/`. Parse each
  result row: brand, their PN, price (€), delivery/stock text, `/buy/` link.
- [ ] Map each row to `third_party_part` (vendor = Nimark) + `third_party_part_xref`
  (`relationship = equivalent_to`).
- [ ] Availability text parser: `"Hyllyssä"` → in-stock; a day-range string (e.g.
  `"1-3"`, `"1-4"`) → available-to-order with parsed `eta_days_min`/`eta_days_max`
  if you want that granularity, otherwise just store the raw text alongside the
  normalized state.
- [ ] Optional deeper fetch: for any row worth showing in more detail, follow the
  `/buy/{brand}_{their_pn}/` link and parse the OG product meta tags
  (`meta-product:availability`, `meta-product:price:amount`, etc.) for a second,
  more precise availability signal — useful if the summary-row text and the
  full-page tag ever disagree.
- [ ] Unit test fixtures: `EAZ1354` (multi-brand disambiguation case: JAGUAR /
  ROVER / DAIMLER) and the resulting JAGUAR-brand result set (7 aftermarket rows,
  captured in RES-8.2) as known-good test data.

### IMPL-1.4 SNG Barratt — explicitly out of scope
- [ ] No adapter built. Add a code comment / README note at the vendor-adapter
  package root explaining why (client-rendered SPA + robots.txt-blocked search,
  per RES-8.3/RES-10.2), so a future contributor doesn't waste time re-attempting
  this without first checking whether SNG Barratt's site architecture has changed.

### IMPL-1.5 Scheduling
- [ ] Batch refresh job (cron/scheduled task) iterating all `third_party_part` rows
  with `integration_method != manual_reference_only` on their vendor, re-running
  the appropriate adapter, respecting per-vendor rate limits (RES-10.6).
- [ ] Admin-triggered on-demand refresh endpoint for a single part, reusing the
  same adapters.

### IMPL-1.6 Open follow-ups to carry into RES-7-style tracking
- JLR Classic Parts PN→slug determinism unconfirmed (IMPL-1.2).
- Meaning of JLR Classic's "Add-to-Bag + Contact-Us-to-Purchase" dual state
  unconfirmed (RES-8.1/RES-10.4.1).
- Nimark multi-brand disambiguation rule (which badge to prefer) needs a real
  policy decision from the business owner, not just a technical default.