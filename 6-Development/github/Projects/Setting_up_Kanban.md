# Setting Up Kanban — Jagports GitHub Project

Date: 2026-09-07
Repository: `jagports/jagports`
Project: `Jagports Vehicle Information and EPC System`

## Purpose

This document is the reusable setup and verification procedure for the Jagports GitHub Projects Kanban configuration.

The document consolidates the previously separate setup steps into a small number of repeatable procedures. It contains reusable technical knowledge and verification rules, not a chronological execution log.

`KNOWLEDGE.md` remains the repository-wide durable knowledge entry point. `00-Management/WORKFLOWS.md` remains the canonical normative Management workflow. This document must not redefine those authorities.

## 1. Repository and Project discovery

Never embed a historical repository owner or transfer target in a new setup procedure.

From a checkout of the target repository, discover the active repository:

```bash
REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
printf 'Repository: %s\nProject owner: %s\n' "$REPO" "$PROJECT_OWNER"
```

Verify access before mutation:

```bash
gh auth status
gh repo view --json nameWithOwner,private,defaultBranchRef
gh project list --owner "$PROJECT_OWNER"
```

For an organization-owned Project, the Project owner is the organization containing the Project. Repository identity and Project-specific IDs are separate configuration values.

Do not assume that repository access proves Issue-field or Project mutation capability. Required authentication, permission/scope, and the specific available operation must be verified independently.

## 2. Issue-field and Project discovery

Discover the current Project number rather than copying it from historical work. Then inspect its fields:

```bash
gh project field-list PROJECT_NUMBER --owner PROJECT_OWNER --format json
```

Use the current result to identify the Project `Status`, `Rank`, and where used `Workstream` fields and their option IDs. Project IDs, field IDs, option IDs, and view IDs are Project-specific and must not be guessed or copied from another Project.

For organization-level Issue fields, inspect the current organization definition through the supported Issue Fields API before relying on it. The native Issue field named `Priority` is the authoritative Jagports current-priority field.

Inspect Project views before changing layout or sort configuration. For an organization-owned Project:

```bash
gh api graphql -f query='query($organization:String!,$number:Int!){organization(login:$organization){projectV2(number:$number){views(first:20){nodes{id number name layout}}}}}' -f organization=PROJECT_OWNER -F number=PROJECT_NUMBER
```

## 3. Required Kanban workflow

The workflow states are **Project Item Status option values**. They are properties of an Issue's Project item, not statuses of the Project container and not replacements for GitHub Issue Open/Closed state.

Required normal workflow:

```text
BACKLOG
→ RESEARCH
→ PROPOSED
→ DECISION NEEDED
→ APPROVED
→ IMPLEMENTATION
→ REVIEW
→ TESTING
→ DONE
```

`IMPLEMENTATION` is intentionally broader than coding. It covers any repository implementation artifact, including source code, configuration, documentation, data, migrations, tests, workflows, and other committed deliverables.

Exceptional state:

```text
BLOCKED
```

After configuring the Status options, independently read them back and verify that all required names exist exactly once and that existing option IDs were preserved when existing options were retained.

## 4. Project view configuration

If the intended Kanban view is not already a board, change the appropriate existing view to `BOARD_LAYOUT` only through an explicitly authorized and verified procedure.

The returned value must be independently checked. Do not claim that the Project is configured as Kanban merely because a mutation returned successfully.

For a ranked backlog/table view, expose numeric Project field `Rank` and configure the view to sort **Rank ascending**:

```text
1
2
3
...
```

Rank `1` is the highest-ranked active item. The automation supplies Rank values but does not rewrite Project view layout or sorting. View configuration is a separate administrative action and must be independently verified.

When multiple execution queues share one Project, use a Project single-select `Workstream` field to separate them. For the current combined Project the canonical values are exactly:

- `AI OS`
- `VIEPS`

The P1 Open Kanban definition requires two normal operational Project views:

- `AI OS` — filter `Workstream = AI OS`; sort `Rank` ascending where the view represents ranked execution order.
- `VIEPS` — filter `Workstream = VIEPS`; sort `Rank` ascending where the view represents ranked execution order.

No third `Intake` Workstream or normal operational `Intake` view is part of this model. Unknown Workstream classification must be resolved through the approved work-control process rather than represented by inventing another queue.

Rank is interpreted **inside one Workstream only**; `AI OS Rank 1` and `VIEPS Rank 1` are both valid and do not compete in one universal queue.

Project view configuration is a human-visible Project configuration concern separate from repository Workstream-field automation. P1 verification is incomplete when either required view is absent, mis-filtered, or visibly mixes items from the other Workstream. Human-visible verification is required when the available automation/connector path cannot independently inspect the saved Project View filters and sorting.

Do not sort by Issue Priority when the intent is exact execution order. Issue Priority is organization-wide importance; Project Rank is exact order inside one Project/workstream scope.

Longer term, separate Projects may replace the shared-Project Workstream split if independent lifecycle/view configuration becomes materially cleaner. Until then, Workstream is the queue boundary.

## 5. GraphQL schema discovery before mutation

Do not guess GitHub GraphQL mutation syntax. Inspect the schema when creating or updating Project fields:

```bash
gh api graphql -f query='{ __type(name:"UpdateProjectV2FieldInput") { inputFields { name type { kind name ofType { kind name ofType { kind name } } } } } }'
gh api graphql -f query='{ __type(name:"ProjectV2SingleSelectFieldOptionInput") { inputFields { name type { kind name ofType { kind name } } } } }'
gh api graphql -f query='{ __type(name:"ProjectV2SingleSelectFieldOptionColor") { enumValues { name } } }'
```

The relevant Project field mutation argument is `singleSelectOptions`.

`ProjectV2SingleSelectField` and related Project field configuration types are GraphQL unions/interfaces in places where direct fields cannot be selected. Use the required inline fragment, for example:

```text
projectV2Field{... on ProjectV2SingleSelectField{id name options{id name color description}}}
```

Do not query union-only fields such as `id` or `name` without the applicable inline fragment.

## 6. Safe single-select field update pattern

For complex mutations, use GraphQL variables and a JSON request file instead of fragile shell interpolation.

Example configuration structure:

```text
{"fieldId":"STATUS_FIELD_ID","options":[{"id":"OPTION_ID","name":"STATUS_NAME","color":"GRAY","description":"Description"}]}
```

Generate a request containing variables and submit it with:

```bash
gh api graphql --input project-graphql.json
```

When updating an existing single-select field, preserve the IDs of existing options that are intentionally retained. Omitting existing option IDs can replace rather than preserve the existing Project option identity and values.

The validated mutation pattern is:

```text
mutation($fieldId:ID!,$options:[ProjectV2SingleSelectFieldOptionInput!]) {
  updateProjectV2Field(
    input:{fieldId:$fieldId,singleSelectOptions:$options}
  ) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        id
        name
        options { id name color description }
      }
    }
  }
}
```

Use the exact current schema and current IDs. If the schema differs, stop and rediscover it rather than adapting by guesswork.

## 7. Git Bash and request-file reliability

Windows Git Bash is a project constraint.

Avoid embedding GraphQL containing `!` inside double-quoted shell strings. Bash history expansion can turn valid GraphQL into an invalid shell command.

Avoid fragile inline Python one-liners containing GraphQL type syntax. A reliable pattern is a single-quoted heredoc for a short Python helper that reads JSON configuration and writes the GraphQL request JSON.

Keep dependent temporary files in the working directory rather than `/tmp`, because the latter may not survive the complete command sequence in the execution environment.

After all dependent operations succeed, remove temporary request/configuration files and verify that cleanup succeeded.

For command sequences, avoid `awk`, Bash associative arrays, backslash line continuations, and Windows path separators. Prefer simple Git Bash-compatible commands and forward-slash paths.

## 8. Required Issue and Project fields

Jagports separates organization-wide Issue metadata from Project-scoped queue/workflow metadata.

### Organization-level Issue field

- `Priority` — authoritative current priority with values `Urgent`, `High`, `Medium`, `Low`.

The P0...P5 review bands map to native Issue Priority through `00-Management/PRIORITIZATION.md`; they are not a second live priority field.

### Project fields

At minimum, a ranked workflow Project uses:

- `Status` — controlled Project Item workflow state;
- `Rank` — numeric exact order within that Project/workstream queue; lower number means earlier execution;
- `Workstream` — single-select queue boundary when multiple operational queues share one Project. Current values: `AI OS`, `VIEPS`.

Other Project fields may include:

- `Executing Entity` — Product Owner / Team Lead Agent / Specialist Agent / Human;
- `Execution Target` — concrete system, repository, Issue, file, device, or other target where applicable;
- `Decision Status` — decision gate state where applicable;
- `Dependencies` — prerequisite or blocking work;
- `Risk` — material delivery risk.

A Project `Operational Priority` text field is deprecated duplicate metadata. Do not create it in new Projects. Existing values must be migrated/reconciled to native Issue `Priority` and verified before the duplicate field is retired.

Repository labels supplement structured fields; they do not replace them. `Workstream` is a Project field, not a repository label.

When configuring fields or labels, first inspect the current state. Create only missing configuration and verify the resulting state.

## 9. Project Item procedure

When an Issue participates in a Project workflow:

1. Identify or create the Issue through the canonical Management work-discovery process.
2. Set native Issue `Priority` only when priority was explicitly requested.
3. Add the Issue to the intended Project only when that Project membership is required.
4. Set the Project Item `Workstream` when the Project contains more than one queue.
5. Set the Project Item Status to `BACKLOG`, unless another canonical state is explicitly justified.
6. Assign Project Rank when the Issue participates in an explicitly ranked queue, ensuring uniqueness inside the same Workstream.
7. Independently read the resulting Issue and Project Item values.
8. Verify the Issue identity, Project identity, Workstream, exact Status and Rank values, and Issue Priority when changed.
9. When work changes phase, update the same Project Item Status and independently verify the resulting value.

The required verification pattern is:

`MUTATE → INDEPENDENTLY VERIFY → CLAIM SUCCESS`

An API mutation response alone is not sufficient evidence.

Current repository automation handles Issue opened/reopened → `BACKLOG` and closed → `DONE` where the configured Project token is available. A separate PR-linked workflow may move an Issue to `IMPLEMENTATION` when an **open Pull Request explicitly has a closing relationship to that Issue**. The closing relationship, not branch existence or a plain Issue mention, is the deterministic implementation-start signal.

The approved work-control workflow may also move Project Status when an authorized standalone sync command explicitly supplies `Status:`. This is the supported path when an approved executor starts work without a closing-linked PR yet.

A closing-linked PR or explicit `IMPLEMENTATION` command proves that implementation work exists; it does **not** by itself prove that required approval, decision, review, or testing gates have passed. Automation must not overwrite `DECISION NEEDED`, `BLOCKED`, `REVIEW`, `TESTING`, or `DONE` merely because implementation exists.

Priority-only synchronization must **not** add an Issue to the Jagports AI OS Project. Issue Priority is organization-wide; Project membership and Workstream are scope-specific.

## 10. Prioritization synchronization

`.github/workflows/sync-issue-work-control-to-project.yml` accepts an authorized standalone marker comment or manual dispatch.

For `Band:` values it maps:

- P0 → Issue Priority `Urgent`;
- P1 → `High`;
- P2 → `Medium`;
- P3/P4 → `Low`;
- P5 → Issue Priority unset and no active Rank.

When `Status:` or `Rank:` is supplied, the workflow resolves Project #9 and updates those Project-scoped fields. When only `Band:` is supplied, it updates only the native Issue Priority and does not create Project #9 membership.

Workstream-aware queue maintenance must not compare or renumber Rank across different Workstream values.

Every changed value must be independently read back. Failure to verify is a failed operation, not a partial success claim.

## 11. Idempotency and safe reruns

A reusable setup procedure must be safe to rerun.

Before each mutation:

1. Discover the current target.
2. Determine whether the desired configuration already exists.
3. If it already exists and is correct, do not mutate it unnecessarily; verify and continue.
4. If it exists but is incorrect, make the smallest required correction.
5. If it does not exist, create it only when creation is part of the approved architecture.
6. Verify the exact resulting state.

Never use a historical ID as evidence that the current object exists.

A failed verification must not be converted into a success claim simply because the mutation returned HTTP/API success.

## 12. Error handling and fail-closed behavior

Every mutation procedure must distinguish at least:

- authentication/capability failure;
- insufficient permission/scope;
- discovery failure;
- mutation/API failure;
- post-mutation verification failure;
- cleanup failure.

If the expected state cannot be independently verified:

- report the operation as unverified or failed;
- do not report the intended state as the actual state;
- do not proceed as if the configuration were correct when that correctness is a prerequisite for later work.

Do not repeatedly retry an unsupported operation. Record the verified limitation and use the supported path instead.

## 13. End-to-end P1 verification

P1 Kanban setup is complete only after the current repository and Project have been checked for:

- repository exists and is accessible;
- intended Project exists and is accessible;
- Project is linked to the intended repository where applicable;
- board/Kanban view is configured;
- required Status workflow exists exactly as intended;
- native organization Issue `Priority` exists and is usable;
- Project `Rank` exists when exact ordering is used;
- Project `Workstream` exists with the expected queue values when multiple queues share one Project;
- required `AI OS` view exists, filters `Workstream = AI OS`, and sorts Rank ascending where ranked execution order is shown;
- required `VIEPS` view exists, filters `Workstream = VIEPS`, and sorts Rank ascending where ranked execution order is shown;
- the two operational views do not visibly mix items assigned to the other Workstream;
- no third `Intake` Workstream/view has been introduced as part of the normal operating model;
- required repository labels exist;
- operating rules are committed in the repository;
- Issue → Project attachment has been tested;
- Project Item Workstream assignment has been tested where applicable;
- Project Item Status assignment has been tested;
- Issue Priority assignment has been tested;
- Rank assignment has been tested where applicable;
- temporary test material has been removed;
- temporary working files have been removed;
- final reads confirm the expected configuration.

A clean final verification is required after setup rather than relying only on intermediate mutation responses. When saved Project View filters/sorting cannot be inspected through the available automation path, this verification requires a direct human observation of the actual Project views.

## 14. P1 setup decomposition

The historical one-by-one P1 work is consolidated conceptually as:

```text
P1   Open Kanban
 ├─ P1.1 Select GitHub Projects
 ├─ P1.2 Establish/verify repository
 ├─ P1.3 Configure and verify workflow
 ├─ P1.4 Configure and verify fields/labels
 └─ P1.5 Define and commit operating rules
```

These are planning/traceability units, not a reason to duplicate command fragments. The reusable implementation procedure is the sequence in this document.

## 15. Historical evidence

`Setting_up_Kanban-console.log` is historical execution evidence. It may contain obsolete repository/account names from before a repository transfer. Historical evidence must not be edited merely to make it match current configuration, because doing so would falsify the historical record.

Historical logs are not authoritative configuration. Always discover the current repository, Issue fields, Project fields, views, and option IDs before mutation.

## 16. Source-of-truth boundaries

- `KNOWLEDGE.md` — repository-wide durable knowledge and generalized lessons.
- `00-Management/WORKFLOWS.md` — canonical normative Management workflow.
- `00-Management/RULES.md` — human governance and rationale.
- `00-Management/GITHUB_OPERATING_RULES.md` — GitHub record and field ownership rules.
- `00-Management/PRIORITIZATION.md` — priority scoring, Issue Priority mapping and Rank semantics.
- `SKILL.md` — machine/agent execution guidance.
- `6-Development/github/Projects/Setting_up_Kanban.md` — reusable Kanban setup and verification procedure.
- `Setting_up_Kanban-console.log` — historical execution evidence only.

Do not create another parallel Kanban operating-rules authority.

## 17. Historical consolidation evidence

The consolidation requirements were recorded in GitHub Issue #437. The durable reusable knowledge from that Issue is incorporated here as procedure, test/error-check requirements, and troubleshooting guidance. The Issue remains the historical work record; this document is the reusable source for future setup work.