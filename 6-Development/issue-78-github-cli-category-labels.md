# Issue #78 — GitHub category-label configuration and verification

## Purpose

Configure GitHub labels as machine-readable category metadata for the `SKILL /`, `AGENT /`, and `KNOWLEDGE /` subject-prefix convention.

Categories are metadata only. They must not become GitHub Project/Kanban Status, Priority, ordering, or workflow states.

## Category specification

| Title prefix | GitHub label | Color |
|---|---|---|
| `SKILL /` | `category:skill` | `#5319E7` |
| `AGENT /` | `category:agent` | `#1D76DB` |
| `KNOWLEDGE /` | `category:knowledge` | `#0E8A16` |

## Configure labels with GitHub CLI

Run from an authenticated GitHub CLI session with permission to administer repository labels:

    gh label create "category:skill" --repo jagports/jagports --color "5319E7" --description "Skills, operating instructions, or automation rules" --force
    gh label create "category:agent" --repo jagports/jagports --color "1D76DB" --description "Agent behavior, roles, discovery, or hand-off" --force
    gh label create "category:knowledge" --repo jagports/jagports --color "0E8A16" --description "Project knowledge, documentation, research, decisions, or requirements" --force

`--force` updates an existing label instead of failing when the label already exists.

## Verify labels

    gh label list --repo jagports/jagports --search "category:"

Expected result: exactly the three category labels above, with the documented descriptions and colors.

## Configure/verify Actions permission for automatic labels

The category workflow uses `GITHUB_TOKEN` to add the matching label automatically. Repository Actions settings must therefore permit write access to Issues and Pull Requests.

Inspect the repository Actions workflow permission setting:

    gh api repos/jagports/jagports/actions/permissions/workflow --jq '.default_workflow_permissions'

Expected result:

    write

If the result is `read`, an administrator can configure the repository default workflow permission with:

    gh api --method PUT repos/jagports/jagports/actions/permissions/workflow -f default_workflow_permissions=write -F can_approve_pull_request_reviews=false

Then verify again:

    gh api repos/jagports/jagports/actions/permissions/workflow --jq '.default_workflow_permissions'

Do not change this setting unless the current repository policy permits it and the human administrator intends to grant the workflow the required write access.

## Verify the category workflow

Open the repository Actions page:

    https://github.com/jagports/jagports/actions

Find `Validate category conventions` and inspect the run for the test Issue or PR.

CLI verification:

    gh run list --repo jagports/jagports --workflow validate-category-conventions.yml --limit 10

For a specific run:

    gh run view <RUN_ID> --repo jagports/jagports

Expected result: the workflow completes successfully for a valid title/prefix and the matching category label is present.

## Test evidence

### Test case 1 — Initial label configuration attempt: failed/partial

The initial commands were executed against `jagports/jagports`.

Observed results:

- `category:skill`: already existed.
- `category:agent`: created successfully.
- `category:knowledge`: rejected with HTTP 422 because its description exceeded GitHub's 100-character maximum.

This failure is retained as evidence because it identified a real GitHub constraint.

### Test case 2 — Corrected label configuration: successful

The descriptions were shortened and the commands were rerun with `--force`.

Observed result: all three commands completed successfully.

### Test case 3 — Label-list verification: successful

Command executed:

    gh label list --repo jagports/jagports --search "category:"

Observed result:

    Showing 3 of 3 labels in jagports/jagports

    category:skill      Skills, operating instructions, or automation rules                     #5319E7
    category:knowledge  Project knowledge, documentation, research, decisions, or requirements  #0E8A16
    category:agent      Agent behavior, roles, discovery, or hand-off                           #1D76DB

Result: all three required category labels exist with the specified descriptions and colors.

### Test case 4 — Automatic Issue label assignment: human test

A human-created test Issue initially demonstrated that automatic assignment was not present in the previous implementation. The revised workflow now adds the matching label automatically when an Issue title begins with a valid category prefix.

Repeat test: create an Issue with a valid category prefix and no manually selected category label. Verify that the workflow adds the matching label.

### Test case 5 — Automatic PR label assignment: human test

Use the repository Pull Requests page rather than an opaque deep link:

    https://github.com/jagports/jagports/pulls

Create a PR whose title begins with `KNOWLEDGE /` and do not manually add `category:knowledge`. Verify that the workflow adds the label and the validation check passes.

## Human test records

Basic category-label/prefix test:

    Issue #95

Multi-category handling:

    Issue #98

Final human verification and merge gate:

    Issue #99

Implementation PR:

    PR #94

## Human verification requirements

The human tester must use the GitHub UI for the final verification and must not mark a checkbox merely because source code or CI appears correct.

Each test is written as:

- URL — where to perform the test.
- Create/inspect — exactly what to create or inspect.
- How — the action to perform.
- Expected — the observable PASS condition.
- Checkbox — the human records completion only after observing the result.

## Repository Change Gate

This file is part of the Issue #78 implementation branch and must reach `main` only through the normal PR review and merge process.
