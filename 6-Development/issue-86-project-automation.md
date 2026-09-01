# Issue #86 — Automatic Issue → Project → BACKLOG automation

## Implementation

New GitHub Actions workflow:

`.github/workflows/issue-to-project.yml`

The workflow runs when a new Issue is opened and performs the following deterministic sequence:

1. Resolve user project `tlindi` Project `1`.
2. Verify that the project title is `Jagports Vehicle Information and EPC System`.
3. Resolve the actual `Status` single-select field and its `BACKLOG` option by ID.
4. Check whether the Issue already has a Project item.
5. Add the Issue when no Project item exists.
6. Set the Project Item Status to `BACKLOG`.
7. Independently verify the Project item, Issue identity, non-archived state, `Status` value, and `BACKLOG` option ID.

The workflow is intentionally limited to the initial `BACKLOG` transition. It does not automate later workflow transitions.

## Idempotency

The workflow checks existing Project items before calling `addProjectV2ItemById`. A rerun for an Issue that is already attached reuses the existing Project item and only enforces the required initial `BACKLOG` state.

## Authentication and permissions

GitHub documents that the default `GITHUB_TOKEN` is repository-scoped and cannot access Projects. This workflow therefore requires a repository or organization secret named `PROJECTS_TOKEN` containing a token with access to the user-owned Project. A classic personal access token requires `repo` and `project` scopes for this use case.

`GITHUB_TOKEN` remains separate and is used only to persist a failure comment on the Issue when the Project operation cannot be completed or verified.

The workflow deliberately fails rather than claiming success when `PROJECTS_TOKEN`, the Project, the Status field, the `BACKLOG` option, or verification is unavailable.

## Failure handling

Any project-operation failure causes the workflow to fail and attempts to add a persistent Issue comment stating that the Project attachment and `BACKLOG` state were not verified.

## Scope boundary

This implementation covers only:

`Issue opened → Project item exists → Project Item Status = BACKLOG`

No automatic `BACKLOG → RESEARCH` or later transition is introduced by this Issue.

## Verification requirement

A successful workflow run is required as execution evidence. Repository inspection alone does not establish that the real Project operation succeeded.
