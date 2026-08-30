# Setting Up Kanban — Jagports GitHub Project

Date: 2026-08-30
Repository: `jagports/jagports`
Project: `Jagports Vehicle Information and EPC System`

## Purpose

This is the current Kanban setup record. Earlier setup work used a different repository owner before the repository transfer. Commands and reusable scripts must not depend on that historical owner.

## Current repository configuration

The repository is:

```text
jagports/jagports
```

Scripts in this directory discover the repository from the active checkout by default:

```bash
REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
```

A caller may override `REPO` and `PROJECT_OWNER` explicitly when operating on another repository/project.

Project-specific values such as `PROJECT_ID`, `STATUS_FIELD_ID`, `PRIORITY_FIELD_ID`, and Status option IDs are configuration, not repository identity. They must be supplied for scripts that edit Project fields.

## P1 task definition

The P1 group is:

| Priority | Task | Completion requirement |
|---|---|---|
| P1 | Open Kanban | GitHub Project is available and usable |
| P1.1 | Select Kanban tool | GitHub Projects selected as the $0 work-control system |
| P1.2 | Create Jagports GitHub repository | `jagports/jagports` exists and is accessible |
| P1.3 | Configure Kanban workflow | Controlled Status workflow is configured and verified |
| P1.4 | Define Kanban fields and labels | Required Project fields and repository labels exist |
| P1.5 | Define Kanban operating rules | Rules are committed in `0-DocumentationEducationCompetense/KANBAN_OPERATING_RULES.md` |

The task list records these P1 items as DONE, but completion should be treated as valid only after verification against the current repository/project after the repository transfer.

## Required workflow

```text
BACKLOG
→ RESEARCH
→ PROPOSED
→ DECISION NEEDED
→ APPROVED
→ CODING
→ REVIEW
→ TESTING
→ DONE
```

Exceptional state:

```text
BLOCKED
```

## Required Project data

At minimum:

- `Status` — controlled workflow state
- `Priority` — ordered values such as `P1`, `P1.1`, `P1.2`, `P2`
- `Executing Entity` — Product Owner / Team Lead Agent / Specialist Agent / Human
- `Execution Target` — concrete system, repository, issue, file, or device where applicable
- `Decision Status` — decision gate state where applicable
- `Dependencies` — blocking or prerequisite work
- `Risk` — material delivery risk

Repository labels supplement Project fields; they do not replace structured Project state.

## P1 verification

Run the repository-level checks from the current checkout:

```bash
gh auth status
gh repo view --json nameWithOwner,private,defaultBranchRef
REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
PROJECT_OWNER="${REPO%%/*}"
gh project list --owner "$PROJECT_OWNER"
```

Then inspect the Project fields and views using the commands in `Setting_up_Kanban_v2.md`.

For a Project mutation, the GitHub token needs the `project` scope. GitHub documents GraphQL as the API for automating Project configuration.

## P1 scripts

The following scripts are designed to operate without a hardcoded historical repository name:

- `fix_p1_and_verify.sh` — verifies/fixes the P1 item
- `fix_stranded_items.sh` — repairs Project items that were left without fields
- `import_jagports_tasks.sh` — idempotent full backlog import
- `make_jagports_subissues.sh` — creates and verifies priority-based sub-issue relationships
- `push_jagports_backlog.sh` — backlog creation/recovery helper
- `push_remaining_backlog.sh` — remaining backlog recovery helper

All scripts now obtain the repository as `owner/name` from `gh repo view` unless `REPO` is explicitly supplied.

## Historical evidence

`Setting_up_Kanban-console.log` is retained as historical execution evidence. It contains pre-transfer repository/account names because changing historical console output would falsify the record. It is not a source for current repository configuration.

## Current operating rule

The repository and Project are the system of record. Do not copy repository owner/name values from historical logs into new scripts or commands. Discover the current repository identity first, then configure the Project explicitly.
