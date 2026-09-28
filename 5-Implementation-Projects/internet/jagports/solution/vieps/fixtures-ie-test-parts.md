# VIEPS fixture test parts

## Purpose

This file lists the deliberately synthetic VIEPS fixture/test parts in clear text for human testing and issue/review discussion.

These records are not real Jagports inventory evidence. Stock quantities, conditions, prices, and locations are deterministic demo/test values used to make the MVP search result visibly useful.

## Primary exact-search fixture part numbers

| Part number | Purpose | Catalogue / fixture description | Supersession role | Stock site | Stock shelf | Stock box | Stock location | Quantity | Condition code | Condition | Price | Currency | Source ref | Verification |
|---|---|---|---|---|---|---|---|---:|---|---|---:|---|---|---|
| `MJB7703AA` | Representative MVP part-search fixture | Representative Deployment-1 part | none | Fixture #607 Site | Fixture Shelf XK | Box A14 | Fixture Shelf XK / Box A14 | 2 | B | used / inspected | 14.50 | EUR | `issue:#607:synthetic-stock:mjb7703aa` | fixture |
| `MNA7691AA` | Supersession source-part fixture | Fan Warning Label | superseded by `XR847031` | Fixture #607 Site | Fixture Shelf XK | Box C07 | Fixture Shelf XK / Box C07 | 4 | B | used / good | 6.00 | EUR | `issue:#607:synthetic-stock:mna7691aa` | fixture |
| `XR847031` | Supersession replacement/current-part fixture | Fan Warning Label replacement/current part | supersedes `MNA7691AA` | Fixture #607 Site | Fixture Shelf XK | Box X31 | Fixture Shelf XK / Box X31 | 1 | A | new old stock / shelf wear | 18.50 | EUR | `issue:#607:synthetic-stock:xr847031` | fixture |
| `FIX538C` | Synthetic chain-endpoint fixture | Synthetic supersession chain endpoint / test-only part | chain endpoint fixture | Fixture #607 Site | Fixture Shelf XK | Box R02 | Fixture Shelf XK / Box R02 | 1 | D | test-only | 3.00 | EUR | `issue:#607:synthetic-stock:fix538c` | fixture |

## Location map

```text
Fixture #607 Site
└── Fixture Shelf XK
    ├── Box A14  -> MJB7703AA
    ├── Box C07  -> MNA7691AA
    ├── Box X31  -> XR847031
    └── Box R02  -> FIX538C
```

## Fixture boundary

- Fixture stock values are synthetic demo/test values.
- Fixture locations are random-looking but deterministic.
- This file does not define real Jagports inventory.
- This file does not certify fitment or supersession facts beyond the repository fixture/test boundary.
