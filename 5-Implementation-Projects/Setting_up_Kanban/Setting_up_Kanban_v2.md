# Setting up GitHub Projects Kanban — Reusable Command Set

This consolidates the **working/validated commands from the Jagports setup** and generalizes them for reuse. Failed experimental commands are intentionally omitted.

## 1. Authenticate and find the Project

```bash
gh auth status
gh project list --owner OWNER
```

Example:

```bash
gh project list --owner tlindi
```

## 2. Inspect Project fields

```bash
gh project field-list PROJECT_NUMBER --owner OWNER --format json
```

Use this to find the `Status` field ID and its option IDs.

## 3. Inspect a Status field with GraphQL

```bash
gh api graphql -f query='query { node(id:"STATUS_FIELD_ID") { ... on ProjectV2SingleSelectField { id name options { id name } } } }'
```

## 4. Inspect Project views

```bash
gh api graphql -f query='query { user(login:"OWNER") { projectV2(number:PROJECT_NUMBER) { views(first:20) { nodes { id number name layout } } } } }'
```

## 5. Change an existing view to Board/Kanban

```bash
gh api graphql -f query='mutation { updateProjectV2View(input:{viewId:"VIEW_ID",layout:BOARD_LAYOUT}) { projectV2View { id name layout } } }'
```

Validated for Jagports:

```text
View 1 → BOARD_LAYOUT
```

## 6. Inspect the Status-field mutation schema

```bash
gh api graphql -f query='{ __type(name:"UpdateProjectV2FieldInput") { inputFields { name type { kind name ofType { kind name ofType { kind name } } } } } }'
```

The relevant argument is:

```text
singleSelectOptions
```

## 7. Inspect single-select option schema

```bash
gh api graphql -f query='{ __type(name:"ProjectV2SingleSelectFieldOptionInput") { inputFields { name type { kind name ofType { kind name } } } } }'
```

Required option fields:

```text
name
color
description
```

Optional:

```text
id
```

## 8. Inspect allowed colors

```bash
gh api graphql -f query='{ __type(name:"ProjectV2SingleSelectFieldOptionColor") { enumValues { name } } }'
```

Validated values:

```text
GRAY
BLUE
GREEN
YELLOW
ORANGE
RED
PINK
PURPLE
```

## 9. Create an options JSON file

Use a file in the repository rather than `/tmp`, because `/tmp` may be cleared between commands.

General form:

```bash
printf '%s\n' '{"fieldId":"STATUS_FIELD_ID","options":[{"id":"OPTION_ID","name":"STATUS_NAME","color":"GRAY","description":"Description"}]}' > project-options.json
```

Jagports validated example:

```bash
printf '%s\n' '{"fieldId":"PVTSSF_lAHOAG6fZ84BhoLTzhgjOMY","options":[{"id":"f75ad846","name":"BACKLOG","color":"GRAY","description":"Work identified but not yet being actively researched."},{"id":"47fc9ee4","name":"RESEARCH","color":"BLUE","description":"Research and information gathering in progress."},{"id":"98236657","name":"DONE","color":"GREEN","description":"Work completed and accepted."}]}' > jagports-options.json
```

Verify:

```bash
cat jagports-options.json
```

## 10. Generate the GraphQL request with Python

Git Bash interprets `!` as history expansion, so avoid putting the long GraphQL mutation directly into a Bash command.

Create a helper:

```bash
cat > make-project-query.py <<'PY'
import json
d=json.load(open('jagports-options.json'))
q='mutation($fieldId:ID!,$options:[ProjectV2SingleSelectFieldOptionInput!]){updateProjectV2Field(input:{fieldId:$fieldId,singleSelectOptions:$options}){projectV2Field{... on ProjectV2SingleSelectField{id name options{id name color description}}}}}'
json.dump({"query":q,"variables":{"fieldId":d["fieldId"],"options":d["options"]}},open('jagports-graphql.json','w'))
PY
```

Run:

```bash
python make-project-query.py
```

No output is expected.

## 11. Execute the update

```bash
gh api graphql --input jagports-graphql.json
```

Always inspect the returned options after the mutation.

## 12. Verified Jagports identifiers

```text
Owner: tlindi
Project number: 1
Project: Jagports Vehicle Information and EPC System

Status field:
PVTSSF_lAHOAG6fZ84BhoLTzhgjOMY

Board view:
PVTV_lAHOAG6fZ84BhoLTzgLcpA0
View number: 1
Name: View 1
Layout: BOARD_LAYOUT
```

## 13. Current verified Status configuration

The first successful Status update established:

```text
BACKLOG
RESEARCH
DONE
```

The original option IDs were reused:

```text
f75ad846 → BACKLOG
47fc9ee4 → RESEARCH
98236657 → DONE
```

The full target workflow is:

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

The remaining states have **not yet been configured** at the time of this document's creation.

## 14. Recommended reusable setup order

```text
1. Authenticate
2. Find Project
3. Inspect fields
4. Inspect Status field
5. Inspect views
6. Change view to Board
7. Inspect GraphQL mutation schema
8. Inspect option schema
9. Inspect allowed colors
10. Create local options JSON
11. Generate GraphQL request
12. Execute mutation
13. Verify returned configuration
```

## 15. Bootstrap operating rule

Do not bulk-import the complete work plan until the Kanban workflow is configured.

Recommended order:

```text
P1   Open Kanban
P1.1 Select Kanban tool
P1.2 Create repository
P1.3 Configure Kanban workflow
P1.4 Define Kanban fields and labels
P1.5 Define Kanban operating rules
P2   Begin normal project work
```

The Product Owner establishes the initial control structure. After the operating rules are established, the Team Lead Agent can take operational responsibility for managing the work queue.

## 16. Troubleshooting lessons

- Failed GraphQL experiments did not change the Status field.
- Do not guess GraphQL input syntax; inspect the schema first.
- Use GraphQL variables/request files for complex mutations.
- Avoid `/tmp` for files that must survive between commands.
- Avoid long GraphQL commands containing `!` directly in Git Bash.
- Preserve existing option IDs when deliberately renaming existing options.
- Configure incrementally and verify after each mutation.
