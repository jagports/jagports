# Project Item Status Audit

Issue: #84
Repository: `jagports/jagports`

## Purpose

This document records the repository-wide audit performed for Issue #84. The
Kanban workflow state is the **Project Item Status** of an Issue's item in the
GitHub Project. It is stored in the item's `Status` field. The GitHub Project
itself does not have a separate workflow status represented by `BACKLOG`,
`RESEARCH`, `PROPOSED`, `DECISION NEEDED`, `APPROVED`, `CODING`, `REVIEW`,
`TESTING`, `DONE`, or `BLOCKED`.

## Audited material

The audit covered the repository tree and the workflow material that defines or
implements the Kanban process, including:

- `SKILL.md`
- `KNOWLEDGE.md`
- `0-DocumentationEducationCompetense/KANBAN_OPERATING_RULES.md`
- `5-Implementation-Projects/Setting_up_Kanban/Setting_up_Kanban.md`
- `5-Implementation-Projects/Setting_up_Kanban/Setting_up_Kanban.sh`
- `5-Implementation-Projects/Setting_up_Kanban/fix_p1_and_verify.sh`
- `5-Implementation-Projects/Setting_up_Kanban/fix_stranded_items.sh`
- `5-Implementation-Projects/Setting_up_Kanban/import_jagports_tasks.sh`
- `docs/agents/AGENT_ROLES.md`
- Issue #67, which prescribes the Issue → Project → workflow sequence
- PR #65, which contains the related SKILL terminology correction

No root-level `AGENTS.md` is present in the current repository tree. The
`docs/agents/` material does not define a competing workflow-state object.

## Terminology model

Use these terms precisely:

| Term | Meaning |
|---|---|
| GitHub Project | The Project container/configuration (`Jagports Vehicle Information and EPC System`) |
| Project item | The Issue-backed item representing an Issue in that Project |
| Project Item Status | The workflow-state value stored in the Project item's `Status` field |
| `Status` field | The GitHub Project single-select field whose option values are the controlled workflow states |
| Issue state | GitHub Issue open/closed state; distinct from Project Item Status |

`Status` may be used when explicitly referring to the field name. When
referring to workflow state in prose, use **Project Item Status** to avoid
confusing the field with the Project container or GitHub Issue state.

## Documentation correction

`KANBAN_OPERATING_RULES.md` and `Setting_up_Kanban.md` now explicitly define
workflow states as Project Item Status values and explain that they are stored
in the `Status` field of the Issue's Project item.

The setup documentation also states the required operation sequence:

1. Create or identify the Issue.
2. Add the Issue to the Project.
3. Set Project Item Status to `BACKLOG` unless another state is justified.
4. Independently verify the Project item and its Project Item Status.
5. Change and verify Project Item Status as the Issue enters subsequent phases.

## Automation finding

The repository contains scripts that perform Issue creation, Project item
attachment, and Project field mutations. These are explicit/manual or
semi-automatic setup tools; they are not an automatic GitHub Issue event
trigger.

The current implementation does **not** provide an automatic
Issue → Project → `BACKLOG` trigger. Documentation must therefore not imply
that opening an Issue automatically creates a Project item or assigns
`BACKLOG`.

The setup scripts identify the Project, Status field, and Status options and
use GitHub Project commands/GraphQL mutations to set field values. Verification
is required after mutations. Where a script cannot resolve a Project item or
field, the operation must not be represented as successful.

## Relationship to PR #65

PR #65 is the separate implementation of Issue #83 and changes `SKILL.md`.
It already replaces ambiguous Project Status wording in the affected SKILL
section with **Project Item Status** and records that automatic
Issue-to-Project automation does not currently exist.

Issue #84 does not expand PR #65. The repository-wide documentation correction
is implemented separately here. PR #65 should continue to close only Issue
#83.

## Issue #67 reconciliation

Issue #67 uses the phrase `Project Status` in its workflow specification. Its
intended object is the Status field of the Issue's Project item. This audit
therefore treats those references as terminology that must be reconciled to
**Project Item Status**; the workflow itself is unchanged.

## Acceptance check

The corrected model is:

`GitHub Issue → Project item → Status field → Project Item Status option`

For example:

`Issue #84 → its Project item → Status field = REVIEW`

The value `REVIEW` is not the status of the Project container and is not the
open/closed state of the Issue.
