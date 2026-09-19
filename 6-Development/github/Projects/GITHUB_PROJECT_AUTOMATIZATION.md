# Issue #86 — Automatic Issue to Project Item and BACKLOG Status automation

## Project definition

The target Project is defined here as the single source of truth for this implementation. The workflow `.github/workflows/issue-to-project.yml` must use the same organization, Project number, and Project title.

- Organization: `jagports`
- Project number: `9`
- Project name: `Jagports AI OS`
- URL: https://github.com/orgs/jagports/projects/9

The Project is **organization-owned by `jagports`**. Project mutations are performed using `PROJECTS_TOKEN`, authenticated as an identity that has permission to modify this Project. The verified `tlindi` token has successfully modified Project #9.

## Implementation

GitHub Actions workflow:

`.github/workflows/issue-to-project.yml`

The workflow runs when a new Issue is opened and performs the following deterministic sequence:

1. Resolve organization `jagports` Project `9`.
2. Verify that the Project title is `Jagports AI OS`.
3. Resolve the actual `Status` single-select field and its `BACKLOG` option by ID.
4. Check whether the Issue already has a Project Item.
5. Add the Issue to the Project when no Project Item exists.
6. Identify the resulting Project Item.
7. Set the Project Item `Status` to `BACKLOG`.
8. Independently verify the Project Item, Issue identity, non-archived state, `Status` value, and `BACKLOG` option ID.

The workflow is intentionally limited to assigning the initial `BACKLOG` Status. It does not automate later workflow transitions.

## Idempotency

The workflow checks existing Project Items before calling `addProjectV2ItemById`. A rerun for an Issue that is already a Project Item reuses the existing Project Item and enforces/verifies `Status = BACKLOG` without creating a duplicate.

## Authentication and permissions

The workflow uses a dedicated `PROJECTS_TOKEN` for Project mutations. The token must have access to the organization-owned Project `jagports/projects/9` and to the repository containing the Issue. The identity that creates or manages the Issue does not need to own the Project; Project mutations are performed using the identity represented by `PROJECTS_TOKEN`.

`GITHUB_TOKEN` remains separate and is used only to persist a failure comment on the Issue when the Project operation cannot be completed or verified.

The workflow deliberately fails rather than claiming success when `PROJECTS_TOKEN`, the Project, the `Status` field, the `BACKLOG` option, or verification is unavailable.

## Verified Project values

The Project was verified through GitHub GraphQL as:

- Project ID: `PVT_kwDOEz190s4Bh6vc`
- Status field ID: `PVTSSF_lADOEz190s4Bh6vczhg0oRE`
- `BACKLOG` option ID: `3fe9652a`

The workflow resolves these IDs dynamically by Project and field/option name rather than hard-coding them.

A write-access test using the `tlindi` token successfully updated a real Project Item's `Status` to `BACKLOG`.

## Failure handling

Any Project-operation failure causes the workflow to fail and attempts to add a persistent Issue comment stating that the Issue was not verified as a Project Item with `Status = BACKLOG`.

## Scope boundary

This implementation covers only the initial Project assignment and Status operation:

- When an Issue is opened, add the Issue to the `Jagports AI OS` Project as a Project Item when it is not already present.
- Set that Project Item's `Status` to `BACKLOG`.
- Verify the Project Item and its `Status`.

No automatic `BACKLOG` to `RESEARCH` or later transition is introduced by this Issue.

## Verification requirement

A successful workflow run is required as execution evidence. Repository inspection alone does not establish that the real Project operation succeeded.


## Repository Actions variables

Repository-level GitHub Actions variables provide non-secret operational identities and configuration shared by Project automation. They are runtime configuration, not credentials.

### `PRODUCT_OWNER_GITHUB`

`PRODUCT_OWNER_GITHUB` is the canonical GitHub login used when repository automation must explicitly notify the Product Owner that human action is required and no more specific responsible human/agent can be resolved from durable workflow evidence.

Current configured value:

```text
PRODUCT_OWNER_GITHUB=tlindi
```

Configure it with GitHub CLI (`gh`). The repository Actions variable can be created or updated directly from the command line.

First verify which GitHub account is active:

```powershell
gh auth status --active --hostname github.com
```

Then perform a repository-permission preflight:

```powershell
gh api graphql -f query='query { viewer { login } repository(owner:"jagports", name:"jagports") { viewerPermission } }' --jq '.data | "login=\(.viewer.login) repositoryPermission=\(.repository.viewerPermission)"'
```

The result must identify the intended account and a repository permission level sufficient to administer this repository configuration. For the normal Product Owner setup this should be `ADMIN`.

This permission preflight is intentionally non-mutating. GitHub does not provide a dry-run endpoint that proves Actions-variable **write** permission without attempting a write, and fine-grained tokens can further restrict repository-variable access. Therefore the definitive permission check is the actual `gh variable set` command followed by read-back verification.

Create or update the repository variable:

```powershell
gh variable set PRODUCT_OWNER_GITHUB --body "tlindi" --repo jagports/jagports
```

Verify the persisted value:

```powershell
gh variable get PRODUCT_OWNER_GITHUB --repo jagports/jagports
```

Expected value:

```text
tlindi
```

Optionally list all repository variables:

```powershell
gh variable list --repo jagports/jagports
```

If `gh variable set` fails with a permission error, do not claim the configuration exists. Correct the active GitHub identity/token permissions first, then rerun the set and read-back commands.

The variable value is the Product Owner's GitHub login without the leading `@` (currently `tlindi`).

Workflows read it as:

```yaml
${{ vars.PRODUCT_OWNER_GITHUB }}
```

This is intentionally a **Variable**, not a Secret. The GitHub login is public routing metadata and must be available for explicit `@username` notification in durable Issue/PR communication.

For Pull Request open-event Workstream handling:

1. Automation first attempts to resolve Workstream from durable authoritative evidence.
2. If exactly one canonical Workstream is resolved, it assigns and verifies that value; no Product Owner escalation is required.
3. If Workstream remains unresolved or ambiguous, automation must not guess.
4. The PR Project Item remains unassigned for Workstream.
5. The trusted open-event workflow reads `PRODUCT_OWNER_GITHUB` and creates/updates the durable `@priorize <PR>` PR Conversation comment with an explicit `@<PRODUCT_OWNER_GITHUB>` mention, a **Human action required** message, and the direct Project Item link.
6. The workflow independently rereads the comment and verifies both the Product Owner mention and Project Item link.
7. If `PRODUCT_OWNER_GITHUB` is missing when escalation is required, the workflow fails clearly rather than claiming that a human was notified.

Changing Product Owner therefore requires updating this repository Actions variable. Workflow source must not hard-code a particular Product Owner login.
