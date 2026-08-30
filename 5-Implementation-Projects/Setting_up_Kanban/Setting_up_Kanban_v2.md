# Setting up GitHub Projects Kanban — Reusable Command Set

This document contains the validated command pattern for the Jagports Kanban setup. Repository and project ownership are parameters; do not embed a personal GitHub account or an old repository transfer target in scripts.

## 1. Authenticate and find the Project

```bash
gh auth status
gh project list --owner OWNER
```

For the current repository, determine the repository automatically:

```bash
REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
REPO_OWNER="${REPO%%/*}"
echo "$REPO"
echo "$REPO_OWNER"
```

## 2. Inspect Project fields

```bash
gh project field-list PROJECT_NUMBER --owner PROJECT_OWNER --format json
```

Use this to find the `Status` field ID and its option IDs.

## 3. Inspect a Status field with GraphQL

```bash
gh api graphql -f query='query { node(id:"STATUS_FIELD_ID") { ... on ProjectV2SingleSelectField { id name options { id name } } } }'
```

## 4. Inspect Project views

For an organization-owned Project:

```bash
gh api graphql -f query='query($organization:String!,$number:Int!){organization(login:$organization){projectV2(number:$number){views(first:20){nodes{id number name layout}}}}}' -f organization=PROJECT_OWNER -F number=PROJECT_NUMBER
```

## 5. Change an existing view to Board/Kanban

```bash
gh api graphql -f query='mutation { updateProjectV2View(input:{viewId:"VIEW_ID",layout:BOARD_LAYOUT}) { projectV2View { id name layout } } }'
```

Always verify the returned layout after the mutation.

## 6. Inspect the Status-field mutation schema

```bash
gh api graphql -f query='{ __type(name:"UpdateProjectV2FieldInput") { inputFields { name type { kind name ofType { kind name ofType { kind name } } } } } }'
```

The relevant argument is `singleSelectOptions`.

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

Optional: `id`.

## 8. Inspect allowed colors

```bash
gh api graphql -f query='{ __type(name:"ProjectV2SingleSelectFieldOptionColor") { enumValues { name } } }'
```

## 9. Create an options JSON file

Keep the configuration file with the working setup rather than relying on `/tmp`.

General form:

```bash
printf '%s\n' '{"fieldId":"STATUS_FIELD_ID","options":[{"id":"OPTION_ID","name":"STATUS_NAME","color":"GRAY","description":"Description"}]}' > project-options.json
```

## 10. Generate the GraphQL request with Python

```bash
cat > make-project-query.py <<'PY'
import json

with open('project-options.json', encoding='utf-8') as f:
    data = json.load(f)

query = 'mutation($fieldId:ID!,$options:[ProjectV2SingleSelectFieldOptionInput!]){updateProjectV2Field(input:{fieldId:$fieldId,singleSelectOptions:$options}){projectV2Field{... on ProjectV2SingleSelectField{id name options{id name color description}}}}}'

with open('project-graphql.json', 'w', encoding='utf-8') as f:
    json.dump({'query': query, 'variables': {'fieldId': data['fieldId'], 'options': data['options']}}, f)
PY

python make-project-query.py
```

## 11. Execute the update

```bash
gh api graphql --input project-graphql.json
```

Always inspect the returned options after the mutation.

## 12. Target Jagports workflow

The required workflow is:

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

The workflow configuration is a Project concern. Repository scripts must obtain repository/project configuration from variables or discovery rather than embedding a former repository owner.

## 13. P1 completion criteria

P1 is complete only when all of these are verified against the current GitHub repository/project:

- repository exists and is accessible
- Project exists and is open
- Project is linked to the intended repository
- board view is configured
- required Status workflow exists
- Priority field exists
- required labels/structured fields exist
- operating rules are committed in the repository
- Issue → Project attachment has been tested
- Priority assignment has been tested
- temporary test material has been removed

## 14. Bootstrap operating rule

Do not bulk-import the complete work plan until the Kanban workflow is configured and verified.

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

## 15. Troubleshooting lessons

- Do not guess GraphQL input syntax; inspect the schema first.
- Use GraphQL variables/request files for complex mutations.
- Avoid `/tmp` for files that must survive between commands.
- Preserve existing option IDs when deliberately renaming options.
- Configure incrementally and verify after each mutation.
- Never hardcode a repository owner from a previous GitHub account or repository transfer.
- Prefer `gh repo view --json nameWithOwner --jq '.nameWithOwner'` when a script runs from inside the target checkout.
