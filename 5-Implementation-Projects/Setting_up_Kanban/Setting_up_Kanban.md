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

Do not assume that repository access proves Project mutation capability. Required authentication, permission/scope, and the specific available tool operation must be verified independently.

## 2. Project discovery and configuration inspection

Discover the current Project number rather than copying it from historical work. Then inspect its fields:

```bash
gh project field-list PROJECT_NUMBER --owner PROJECT_OWNER --format json
```

Use the current result to identify the `Status` field and the IDs of its options. Project IDs, field IDs, option IDs, and view IDs are Project-specific and must not be guessed or copied from another Project.

Inspect Project views before changing layout. For an organization-owned Project:

```bash
gh api graphql -f query='query($organization:String!,$number:Int!){organization(login:$organization){projectV2(number:$number){views(first:20){nodes{id number name layout}}}}}' -f organization=PROJECT_OWNER -F number=PROJECT_NUMBER
```

## 3. Required Kanban workflow

The workflow states are **Project Item Status option values**. They are properties of an Issue's Project item, not statuses of the Project container.

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

If the intended Kanban view is not already a board, change the appropriate existing view to `BOARD_LAYOUT`:

```bash
gh api graphql -f query='mutation { updateProjectV2View(input:{viewId:"VIEW_ID",layout:BOARD_LAYOUT}) { projectV2View { id name layout } } }'
```

The returned value must be independently checked. Do not claim that the Project is configured as Kanban merely because the mutation returned successfully.

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

## 8. Required Project fields and repository labels

At minimum, the Project configuration uses:

- `Status` — controlled Project Item workflow state
- `Priority` — work priority
- `Executing Entity` — Product Owner / Team Lead Agent / Specialist Agent / Human
- `Execution Target` — concrete system, repository, issue, file, device, or other target where applicable
- `Decision Status` — decision gate state where applicable
- `Dependencies` — prerequisite or blocking work
- `Risk` — material delivery risk

Repository labels supplement structured Project fields; they do not replace them.

Operational labels include `agent`, `human`, `decision-needed`, `dependency`, and `blocked`. Existing standard repository labels must not be removed merely because these operational labels exist.

When configuring fields or labels, first inspect the current state. Create only missing configuration and verify the resulting state.

## 9. Project Item procedure

When an Issue participates in the Kanban workflow:

1. Identify or create the Issue through the canonical Management work-discovery process.
2. Add the Issue to the intended Project.
3. Set the Project Item Status to `BACKLOG`, unless another canonical initial state is explicitly justified.
4. Independently read the resulting Project Item.
5. Verify both the Project identity and the exact `Status` value.
6. When work changes phase, update the same Project Item Status and independently verify the resulting value.

The required verification pattern is:

`MUTATE → INDEPENDENTLY VERIFY → CLAIM SUCCESS`

An API mutation response alone is not sufficient evidence.

Current repository automation handles Issue opened/reopened → `BACKLOG` and closed → `DONE` where the configured Project token is available. A separate PR-linked workflow may move an Issue to `IMPLEMENTATION` when an **open Pull Request explicitly has a closing relationship to that Issue**. The closing relationship, not branch existence or a plain Issue mention, is the deterministic implementation-start signal.

A closing-linked PR proves that implementation work exists; it does **not** by itself prove that required approval, decision, review, or testing gates have passed. Automation must not overwrite `DECISION NEEDED`, `BLOCKED`, `REVIEW`, `TESTING`, or `DONE` merely because a closing PR exists.

## 10. Idempotency and safe reruns

A reusable setup procedure must be safe to rerun.

Before each mutation:

1. Discover the current target.
2. Determine whether the desired configuration already exists.
3. If it already exists and is correct, do not mutate it unnecessarily; verify and continue.
4. If it exists but is incorrect, make the smallest required correction.
5. If it does not exist, create it.
6. Verify the exact resulting state.

Never use a historical ID as evidence that the current object exists.

A failed verification must not be converted into a success claim simply because the mutation returned HTTP/API success.

## 11. Error handling and fail-closed behavior

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

## 12. End-to-end P1 verification

P1 Kanban setup is complete only after the current repository and Project have been checked for:

- repository exists and is accessible;
- intended Project exists and is accessible;
- Project is linked to the intended repository where applicable;
- board/Kanban view is configured;
- required Status workflow exists exactly as intended;
- required Project fields exist;
- required repository labels exist;
- operating rules are committed in the repository;
- Issue → Project attachment has been tested;
- Project Item Status assignment has been tested;
- Priority assignment has been tested;
- temporary test material has been removed;
- temporary working files have been removed;
- final reads confirm the expected configuration.

A clean final verification is required after setup rather than relying only on intermediate mutation responses.

## 13. P1 setup decomposition

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

## 14. Historical evidence

`Setting_up_Kanban-console.log` is historical execution evidence. It may contain obsolete repository/account names from before a repository transfer. Historical evidence must not be edited merely to make it match current configuration, because doing so would falsify the historical record.

Historical logs are not authoritative configuration. Always discover the current repository, Project, fields, views, and option IDs before mutation.

## 15. Source-of-truth boundaries

- `KNOWLEDGE.md` — repository-wide durable knowledge and generalized lessons.
- `00-Management/WORKFLOWS.md` — canonical normative Management workflow.
- `00-Management/RULES.md` — human governance and rationale.
- `SKILL.md` — machine/agent execution guidance.
- `5-Implementation-Projects/Setting_up_Kanban/Setting_up_Kanban.md` — reusable Kanban setup and verification procedure.
- `Setting_up_Kanban-console.log` — historical execution evidence only.

Do not create another parallel Kanban operating-rules authority.

## 16. Related consolidation issue

The consolidation requirements were recorded in GitHub Issue #437. The durable reusable knowledge from that Issue is incorporated here as procedure, test/error-check requirements, and troubleshooting guidance. The Issue remains the historical work record; this document is the reusable source for future setup work.
