# GitHub Project View Script Procedure — Jagports

## Purpose

This document is the practical execution procedure for configuring the required GitHub Project views with the repository script.

It is an operational companion to [`Setting_up_Kanban.md`](Setting_up_Kanban.md). The canonical Project-view requirements, Workstream values, Rank semantics, verification requirements, and Management workflow remain defined by that existing documentation and `00-Management/WORKFLOWS.md`. This procedure must not become a competing specification.

## Current Jagports Project

Current Project:

- owner: `jagports`
- Project number: `9`
- title: `Jagports AI OS`
- direct URL: https://github.com/orgs/jagports/projects/9

For another Project, discover and verify the current owner and Project number instead of reusing Project #9 as a generic identifier.

## Implementation script

The repository implementation script is:

`6-Development/github/Projects/create_project_views.sh`

Its target state is exactly:

| View | Required filter | Ranked-order behavior |
|---|---|---|
| `AI OS` | `Workstream = AI OS` | `Rank` ascending where ranked execution order is shown |
| `VIEPS` | `Workstream = VIEPS` | `Rank` ascending where ranked execution order is shown |

No normal operational `Intake` Workstream/view is part of the current model.

## Prerequisites

Run the script from the Jagports repository using a Bash environment that has the required local capabilities. The operator's Bash environment is authoritative for execution capability; absence of a command, API wrapper, shell feature, or execution path in an agent environment does not prove that the operator's local environment lacks it.

Required operator-side prerequisites:

1. A checkout of `jagports/jagports`.
2. GitHub CLI `gh` installed and authenticated.
3. Authentication with organization Project read/write capability for the `jagports` organization.
4. Bash capable of running the script and the commands it invokes.
5. Python available when required by the current script implementation for JSON handling.

Check authentication before mutation:

```bash
gh auth status
```

Where the current `gh` authentication requires an additional Project scope, refresh or otherwise authorize the credential according to the authentication method in use before running the script.

## Run the PR implementation before merge

PR #761 contains the implementation before it reaches `main`.

From an existing clone of `jagports/jagports`:

```bash
gh pr checkout 761
```

Confirm the checked-out branch contains the script:

```bash
ls -l 6-Development/github/Projects/create_project_views.sh
```

Optionally inspect the exact script revision that will execute:

```bash
git status --short
git log -1 --oneline
```

Then run:

```bash
bash 6-Development/github/Projects/create_project_views.sh
```

Do not copy the script from chat or reconstruct it manually. Run the version committed to the PR branch so the executed implementation is traceable to the reviewed repository change.

## Expected execution behavior

The script must fail closed when it cannot safely establish or verify the requested state.

The intended execution pattern is:

1. verify `gh` authentication and Project access;
2. resolve Project #9 rather than assuming an unverified object identity;
3. inspect current Project views before mutation;
4. create only the required missing `AI OS` / `VIEPS` views;
5. apply the required Workstream filter where the supported Project API permits it;
6. configure Rank ascending where the supported Project API permits it;
7. independently read the resulting view state back;
8. report success only for properties independently verified;
9. leave an existing duplicate or conflicting view untouched and stop with an error rather than replacing it destructively;
10. never create an `Intake` view.

If GitHub exposes some Project-view capability in the operator's current `gh`/API environment that is not available in the agent connector or execution environment, that capability may be used by the script when it is explicitly implemented and independently verified. Agent-environment limitations must not be treated as proof that the operator-side GitHub CLI/API path is unavailable.

## After execution

Keep the complete terminal output as execution evidence.

Then independently inspect the live Project:

https://github.com/orgs/jagports/projects/9

The acceptance result must establish:

- `AI OS` view exists;
- its saved filter corresponds to `Workstream = AI OS`;
- `VIEPS` view exists;
- its saved filter corresponds to `Workstream = VIEPS`;
- ranked execution order is `Rank` ascending where required;
- the two operational views do not visibly mix items from the other Workstream;
- no normal operational `Intake` view was introduced.

If the script reports that a required property could not be mutated or independently verified, do not convert that result into PASS. Record the limitation and complete only the unsupported property through an explicitly approved follow-up procedure.

## Rerunning

The script is intended to be safe to rerun:

- discover current state first;
- avoid recreating a correct existing view;
- fail closed on duplicate/conflicting named views;
- independently verify after mutation;
- do not report success from the mutation response alone.

After correcting an operator-side prerequisite or supported configuration problem, rerun the same committed script rather than creating a second ad-hoc implementation path.

## Verification record

Record the execution result and independent Project observation on the active implementation record for #753 / PR #761.

Use the standard result vocabulary:

- `PASS` — required behavior was executed and verified;
- `FAIL` — execution completed but required state was not achieved;
- `BLOCKED` — a prerequisite or capability prevented execution/verification;
- `NOT TESTED` — the implementation was not executed.

## GitHub references

- [GitHub CLI project commands](https://cli.github.com/manual/gh_project)
- [GitHub GraphQL Projects reference](https://docs.github.com/en/graphql/reference/objects#projectv2)
- [Managing Project views](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/managing-your-views)
