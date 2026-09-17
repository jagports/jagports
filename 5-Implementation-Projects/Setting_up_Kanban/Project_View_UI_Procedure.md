# GitHub Project View UI Procedure — Jagports

## Purpose

This document is the practical GitHub UI procedure for creating and saving a Project view.

It is an operational companion to [`Setting_up_Kanban.md`](Setting_up_Kanban.md). The canonical Project-view requirements, Workstream values, Rank semantics, verification requirements, and Management workflow remain defined by that existing documentation and `00-Management/WORKFLOWS.md`. This procedure must not be used as a competing specification.

## Current Jagports Project

Current Project:

- owner: `jagports`
- Project number: `9`
- title: `Jagports AI OS`
- direct URL: https://github.com/orgs/jagports/projects/9

For another Project, discover and verify the current owner and Project number instead of reusing Project #9 as a generic identifier.

## Create and save one Project view

1. Open the target Project. To the right of the existing view tabs, click **New view**. Open **View** next to the filter/search bar, choose **Rename view**, enter the required view name, and press `Return`.
2. In the filter control, select the required Project field and value from GitHub's suggestions. For the current Jagports operational views, follow the required `Workstream` condition already defined in `Setting_up_Kanban.md`.
3. Where the view represents ranked execution order, open **View → Sort**, choose `Rank`, and ensure ascending order so Rank `1` appears first. Then choose **View → Save changes**. GitHub automatically saves creation and renaming, but filter/sort changes remain private until the changed view is explicitly saved.
4. Reopen or reload the saved view and verify that its filter and sorting match the canonical requirement and that items outside the intended Workstream are excluded. Record the required human verification result in the active implementation record.

Repeat this procedure for each required operational view. Do not create additional Workstreams or operational views as a substitute for unresolved classification unless the canonical specification is changed first.

## Current required views

For convenience during the current implementation, the canonical Kanban document requires these two normal operational views:

| View | Required filter | Ranked-order behavior |
|---|---|---|
| `AI OS` | `Workstream = AI OS` | `Rank` ascending where ranked execution order is shown |
| `VIEPS` | `Workstream = VIEPS` | `Rank` ascending where ranked execution order is shown |

No normal operational `Intake` Workstream/view is part of the current model. If this summary and `Setting_up_Kanban.md` ever differ, `Setting_up_Kanban.md` is authoritative for this procedure.

## Verification

A Project view is not considered verified merely because the tab exists. Confirm the saved state after creation:

- the view has the intended name;
- the saved Workstream filter matches the intended queue;
- items assigned to the other Workstream are excluded;
- `Rank` is ascending when the view represents ranked execution order;
- the saved configuration remains after reopening/reloading the view.

When the available connector or automation cannot inspect the saved Project View configuration, verification is a direct human observation of the actual GitHub Project UI.

## GitHub references

- [Managing your views](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/managing-your-views)
- [Filtering projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects)
