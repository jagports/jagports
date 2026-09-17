# VIEPS Stock Admin — Add Part UI Concept

## Purpose

This document defines the layout concept for the Stock Admin **Add Part** workflow related to Issue #612.

The Admin UI should reuse the established EndUser VIEPS visual structure and keep equivalent elements in similar positions where practical. The goal is one VIEPS application with an authorized administration surface, not a visually unrelated second application.

The operational stock model remains authoritative in [`../SPEC/MODEL_STOCK.md`](../SPEC/MODEL_STOCK.md), and workflow behavior remains governed by [`../STOCK/SPEC_Admin_Workflow.md`](../STOCK/SPEC_Admin_Workflow.md).

## Visual concept authority

The rendered Add Part concept belongs with the other VIEPS visual concepts under `../UI_CONCEPTS/`.

Canonical filename:

`../UI_CONCEPTS/UI_Admin_Part_Add.png`

When present, `UI_Admin_Part_Add.png` is the presentation/reference visualization for this workflow. This document remains authoritative for the workflow semantics and model distinctions described below. Example values or controls visible in concept artwork do not create application facts or override the stock model.

The concept image should be committed as its original PNG file. Do not intentionally resize, recompress, convert to a lossy format, or replace it with a screenshot-derived copy when adding it to the repository. Repository review should preserve the original file bytes; GitHub's rendered preview is not the source asset.

## Layout principles

- Reuse the EndUser application shell, spacing, typography, panels, search treatment and responsive behavior.
- Keep primary navigation at the left on desktop where the existing shell uses that relationship.
- Keep the global/top search position consistent with the EndUser UI.
- Use a central working panel for the active Add Part operation.
- Use a right contextual-information panel for selected-part information and workflow help.
- Preserve the normalized stock model instead of collapsing distinct concepts: availability is independent from condition; source party is distinct from donor vehicle; unresolved stock is an explicit supported state.
- Mobile layouts may stack the same logical regions while preserving workflow order.

## Add Part workflow concept

The conceptual workflow is:

```text
Add Part
  -> 1 Part identification
  -> 2 Stock details
  -> 3 Review
  -> persist through authorized Stock Admin API
```

### Step 1 — Part identification

The first view should allow an administrator to search for an existing canonical PART before creating stock.

It should support:

- search by part number or descriptive terms using the applicable PART-search contract;
- result rows showing enough catalogue context to distinguish candidates;
- selection of an existing canonical PART;
- a visible selected-part information/context panel;
- an explicit **Create unresolved part** path when identity cannot yet be established;
- continuation to Stock details only after an explicit identity choice or unresolved choice.

Conceptual desktop geometry:

```text
┌──────────────────────┬──────────────────────────────────────────────────────────────────────┐
│ VIEPS / Admin        │ Global part search                                      Admin       │
│                      ├──────────────────────────────────────────────────────────────────────┤
│ EndUser navigation   │ Stock > Add Part                                                     │
│                      │                                                                      │
│ Admin                │ ADD PART                                                             │
│  Stock               │ ● 1 Part identification ─ ○ 2 Stock details ─ ○ 3 Review            │
│  Parts               │                                                                      │
│  Vehicles            │ ┌───────────────────────────────────┐ ┌────────────────────────────┐ │
│  Locations           │ │ PART IDENTIFICATION               │ │ PART INFORMATION           │ │
│  Source Parties      │ │                                   │ │                            │ │
│                      │ │ [Search existing] [Unresolved]     │ │ selected-part image/info   │ │
│ System               │ │                                   │ │ PN / description           │ │
│  Users               │ │ [ part number / keywords ] [🔍]   │ │ applicability/category     │ │
│  Settings            │ │                                   │ │ supersessions              │ │
│                      │ │ Search results                    │ │                            │ │
│                      │ │ PN | Description | Fitment | Sel.  │ ├────────────────────────────┤ │
│                      │ │                                   │ │ HELP / NEXT STEP           │ │
│                      │ │ Can't find the part?              │ │                            │ │
│                      │ │ [Create unresolved part]          │ │                            │ │
│                      │ └───────────────────────────────────┘ └────────────────────────────┘ │
│                      │ [Cancel]                              [Continue to stock details →] │
└──────────────────────┴──────────────────────────────────────────────────────────────────────┘
```

## Step 2 — Stock details

After identity selection, the working panel captures operational stock facts from the approved model:

- quantity;
- availability;
- normalized A-E condition or explicit unclassified state;
- normalized physical storage location;
- source party;
- donor vehicle;
- source/source-reference evidence where applicable;
- price/currency;
- operational notes.

Availability and condition must remain separate controls. Source party and donor vehicle must remain separate controls.

## Future physical-stock photo option

The Add Part UI should reserve a future **Part images** capability for photographs of the actual physical stock item.

This is a future extension and is not required to block the current #612 MVP implementation unless separately promoted into MVP scope.

The future UI should support:

- **Take photo** from a mobile/device camera where the browser/device supports capture;
- **Choose files** from device storage/photo library;
- multiple images per stock record;
- preview of selected/captured images before persistence;
- designation of one image as the primary stock image;
- removal/replacement before save;
- later display of the stock photographs in review/detail views.

These photographs describe the **physical stock record**, not canonical PART/JEPC imagery. They must not overwrite, redefine or be treated as authoritative catalogue imagery.

Useful physical-stock photographs can include:

- overall part view;
- part-number/manufacturer label;
- condition or damage detail;
- included hardware/accessories;
- distinguishing colour/finish or other stock-specific evidence.

Conceptual component:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ PART IMAGES                                                         │
│ Add photographs that identify this physical stock item.             │
│                                                                     │
│ ┌──────────────────────┐  ┌──────────────────────┐                  │
│ │ Take photo           │  │ Choose files         │                  │
│ │ Mobile/device camera │  │ Phone / computer     │                  │
│ └──────────────────────┘  └──────────────────────┘                  │
│                                                                     │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                        │
│ │  image 1   │ │  image 2   │ │  image 3   │                        │
│ └────────────┘ └────────────┘ └────────────┘                        │
│ [Primary ✓]   [Make primary] [Make primary]                         │
│ [Remove]      [Remove]       [Remove]                               │
│                                                                     │
│ Suggested: overview, PN/label, relevant condition/detail.           │
└─────────────────────────────────────────────────────────────────────┘
```

## Step 3 — Review

Before persistence, the review view should present the chosen PART/unresolved identity and the stock facts being created. When the future photo capability is implemented, its image previews belong in this review as physical-stock evidence.

## Component hierarchy

```text
AppShell
├── Existing/compatible EndUser navigation shell
├── Admin navigation
└── Main
    ├── TopBar / GlobalPartSearch / AdminAccount
    ├── Breadcrumb: Stock > Add Part
    ├── ProgressStepper
    │   ├── 1 Part identification
    │   ├── 2 Stock details
    │   └── 3 Review
    ├── Step 1: PartIdentification
    │   ├── SearchExistingPart
    │   ├── SearchResults
    │   ├── CreateUnresolvedPart
    │   └── PartInformation / Help
    ├── Step 2: StockDetails
    │   ├── Quantity / Availability
    │   ├── Condition
    │   ├── StorageLocation
    │   ├── SourceParty / DonorVehicle / SourceEvidence
    │   ├── Price / Currency
    │   ├── Notes
    │   └── PartImages [future]
    │       ├── TakePhoto
    │       ├── ChooseFiles
    │       ├── ImagePreview[]
    │       ├── PrimaryImage
    │       └── RemoveImage
    └── Step 3: Review
        ├── Part identity
        ├── Stock information
        ├── Images [future]
        └── Confirm / Save
```

## Scope boundary

This concept specifies UI information architecture and future image-input intent. It does not choose media storage, image transformations, upload API shape, retention policy or storage provider. Those concerns require their own approved implementation specification before physical-stock photo persistence is implemented.

The current #612 implementation may therefore establish the Add Part structure without implementing photo storage now, while avoiding a layout that would make the future photo workflow difficult to add.