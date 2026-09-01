# Issue #86 — Automatic Issue → Project → BACKLOG automation

## Project definition

The target Project is defined here as the single source of truth for this implementation. The workflow `.github/workflows/issue-to-project.yml` must use the same organization, Project number, and Project title.

- Organization: `jagports`
- Project number: `9`
- Project name: `Jagports AI OS`
- URL: https://github.com/orgs/jagports/projects/9

## Implementation

GitHub Actions workflow:

`.github/workflows/issue-to-project.yml`

The workflow runs when a new Issue is opened and performs the following deterministic sequence:

1. Resolve organization `jagports` Project `9`.
2. Verify that the project title is `Jagports AI OS`.
3. Resolve the actual `Status` single-select field and its `BACKLOG` option by ID.
4. Check whether the Issue already has a Project item.
5. Add the Issue when no Project item exists.
6. Identify the resulting Project item.
7. Set the Project Item `Status` to `BACKLOG`.
8. Independently verify the Project item, Issue identity, non-archived state, `Status` value, and `BACKLOG` option ID.

The workflow is intentionally limited to the initial `BACKLOG` transition. It does not automate later workflow transitions.

## Idempotency

The workflow checks existing Project items before calling `addProjectV2ItemById`. A rerun for an Issue that is already attached reuses the existing Project item and enforces/verifies `Status = BACKLOG` without creating a duplicate.

## Authentication and permissions

The workflow uses a dedicated `PROJECTS_TOKEN` for Project mutations. The token must have access to the organization-owned Project `jagports/projects/9` and to the repository containing the Issue. The identity that creates or manages the Issue does not need to own the Project; Project mutations are performed using the identity represented by `PROJECTS_TOKEN`.

`GITHUB_TOKEN` remains separate and is used only to persist a failure comment on the Issue when the Project operation cannot be completed or verified.

The workflow deliberately fails rather than claiming success when `PROJECTS_TOKEN`, the Project, the Status field, the `BACKLOG` option, or verification is unavailable.

## Failure handling

Any Project-operation failure causes the workflow to fail and attempts to add a persistent Issue comment stating that the Project attachment and `BACKLOG` state were not verified.

## Scope boundary

This implementation covers only:

`Issue opened → Project item created/identified → Project Item Status = BACKLOG`

No automatic `BACKLOG → RESEARCH` or later transition is introduced by this Issue.

## Verification requirement

A successful workflow run is required as execution evidence. Repository inspection alone does not establish that the real Project operation succeeded.
