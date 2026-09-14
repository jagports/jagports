# VIEPS fixture test parts

## Purpose

This file lists the deliberately synthetic VIEPS fixture/test parts in clear text for human testing, issue comments, deployment checks, and simple browser/API validation.

These records are not real Jagports inventory evidence. Stock quantities, conditions, prices, and locations are deterministic demo/test values used to make the MVP search result visibly useful.

## API path

Use exact part-number search:

```text
GET https://vieps.parts-5ec.workers.dev/api/vieps/part?q=<PART_NUMBER>
```

Partial part-number search is outside this fixture document and is tracked separately.

## Primary exact-search fixture part numbers

| Part number | Purpose | Catalogue / fixture description | Supersession role | Expected stock location | Quantity | Condition | Price | Currency | Fixture boundary |
|---|---|---|---|---|---:|---|---:|---|---|
| `MJB7703AA` | Representative MVP part-search fixture | Representative Deployment-1 part | none | Fixture Shelf XK / Box A14 | 2 | used / inspected | 14.50 | EUR | Synthetic demo stock value; not real Jagports inventory evidence. |
| `MNA7691AA` | Supersession source-part fixture | Fan Warning Label | superseded by `XR847031` | Fixture Shelf XK / Box C07 | 4 | used / good | 6.00 | EUR | Synthetic demo stock value; not real Jagports inventory evidence. |
| `XR847031` | Supersession replacement/current-part fixture | Fan Warning Label replacement/current part | supersedes `MNA7691AA` | Fixture Shelf XK / Box X31 | 1 | new old stock / shelf wear | 18.50 | EUR | Synthetic demo stock value; not real Jagports inventory evidence. |
| `FIX538C` | Synthetic chain-endpoint fixture | Synthetic supersession chain endpoint / test-only part | chain endpoint fixture | Fixture Shelf XK / Box R02 | 1 | test-only | 3.00 | EUR | Synthetic chain-endpoint stock value; not real catalogue or inventory evidence. |

## Expected behaviour

For each primary fixture part number above, exact search should return:

- `part.part_number_normalized` equal to the searched part number;
- at least one `parts_tree` path;
- `fitment` context where the fixture has vehicle-range applicability;
- at least one `stock` row;
- a clear `stock.location` value using the `Fixture Shelf XK / Box ...` pattern;
- `verification_status = fixture` for synthetic fixture stock.

## Stock location semantics

The locations are intentionally random-looking but deterministic:

```text
Fixture #607 Site
└── Fixture Shelf XK
    ├── Box A14  -> MJB7703AA
    ├── Box C07  -> MNA7691AA
    ├── Box X31  -> XR847031
    └── Box R02  -> FIX538C
```

The location text is for UI/API demonstration only. It must not be treated as a real warehouse/bin record.

## Deployment / migration note

The production D1 schema migration `0011_mvp_stock_model.sql` creates the stock-location structure used by these rows.

The production fixture-stock seed migration is:

```text
4-Production/internet/cloudflare/workers/jagports/migrations/0012_vieps_test_part_stock_locations.sql
```

After deploying/merging the migration, remote D1 must be checked and applied from the Worker root:

```text
npx wrangler d1 migrations list DB --remote
npx wrangler d1 migrations apply DB --remote
npx wrangler d1 migrations list DB --remote
```

Then validate the live endpoint:

```text
for PN in MJB7703AA MNA7691AA XR847031 FIX538C; do
  curl -L "https://vieps.parts-5ec.workers.dev/api/vieps/part?q=${PN}"
  echo
done
```

## Scope boundary

- This file documents fixture/test data only.
- It does not define real Jagports inventory.
- It does not implement partial search.
- It does not replace the Parts Data Model or JEPC importer specifications.
- It does not certify fitment or supersession facts beyond the repository fixture/test boundary.
