# Setting Up Kanban — Jagports GitHub Project

Date: 2026-08-27
Repository: `tlindi/jagports`
Project: `Jagports Vehicle Information and EPC System`
Project number: `1`
Project ID: `PVT_kwHOAG6fZ84BhoLT`

## Purpose

This log records the verified command sequence used to establish and test the Jagports GitHub Project Kanban, including authentication, repository/project discovery, Priority field creation, Issue creation, Project attachment, Priority assignment, verification, and test Issue deletion.

---

## 1. Check GitHub authentication

### Command

```bash
gh auth status
```

### Response

```text
github.com
  ✓ Logged in to github.com account tlindi (GITHUB_TOKEN)
  - Active account: true
  - Git operations protocol: https
  - Token scopes include: project, repo, user, workflow, ...

  ✓ Logged in to github.com account tlindi (keyring)
  - Active account: false
  - Git operations protocol: https
  - Token scopes include: project, repo, user, workflow, ...
```

### Result

GitHub CLI was authenticated. The active token had the `project` scope.

---

## 2. Find Jagports repository

### Command

```bash
gh repo list tlindi --limit 20
```

### Relevant response

```text
tlindi/jagports    private    about 10 minutes ago
```

### Result

Repository confirmed as `tlindi/jagports`.

---

## 3. Find Jagports Project

### Command

```bash
gh project list --owner tlindi
```

### Response

```text
NUMBER  TITLE                                        STATE  ID
1       Jagports Vehicle Information and EPC System  open   PVT_kwHOAG6fZ84BhoLT
```

### Result

Project confirmed as **#1**.

---

## 4. Inspect Project fields

### Command

```bash
gh project field-list 1 --owner tlindi
```

### Relevant response

```text
Status      ProjectV2SingleSelectField  PVTSSF_lAHOAG6fZ84BhoLTzhgjOMY
```

### Result

No Priority field existed initially.

---

## 5. Create Priority field

### Command

```bash
gh project field-create 1 --owner tlindi --name "Priority" --data-type "TEXT"
```

### Response

```text
Created field
```

---

## 6. Get Priority field ID

### Command

```bash
gh project field-list 1 --owner tlindi
```

### Relevant response

```text
Priority              ProjectV2Field  PVTF_lAHOAG6fZ84BhoLTzhgjSTY
```

### Result

Priority field ID:

```text
PVTF_lAHOAG6fZ84BhoLTzhgjSTY
```

---

## 7. Check Project items

### Command

```bash
gh project item-list 1 --owner tlindi --format json --limit 1
```

### Response

```json
{
  "items": [],
  "totalCount": 0
}
```

### Result

Kanban was empty before testing.

---

## 8. Inspect Status options

### Command

```bash
gh project field-list 1 --owner tlindi --format json
```

### Relevant response

```json
{
  "id": "PVTSSF_lAHOAG6fZ84BhoLTzhgjOMY",
  "name": "Status",
  "options": [
    {
      "id": "f75ad846",
      "name": "Todo"
    },
    {
      "id": "47fc9ee4",
      "name": "In Progress"
    },
    {
      "id": "98236657",
      "name": "Done"
    }
  ]
}
```

### Result

Status options confirmed:

- `Todo` = `f75ad846`
- `In Progress` = `47fc9ee4`
- `Done` = `98236657`

---

## 9. Create temporary P0 test Issue

### Command

```bash
gh issue create --repo tlindi/jagports --title "[P0 TEST] Kanban import test" --body "Temporary test issue for GitHub Project import and Priority field."
```

### Response

```text
Creating issue in tlindi/jagports

https://github.com/tlindi/jagports/issues/1
```

### Result

Temporary test Issue created as `tlindi/jagports#1`.

---

## 10. Add Issue to Project

### Command

```bash
gh project item-add 1 --owner tlindi --url https://github.com/tlindi/jagports/issues/1
```

### Response

```text
Added item
```

---

## 11. Find Project item ID

### Command

```bash
gh project item-list 1 --owner tlindi --format json
```

### Response

```json
{
  "items": [
    {
      "content": {
        "body": "Temporary test issue for GitHub Project import and Priority field.",
        "number": 1,
        "repository": "tlindi/jagports",
        "title": "[P0 TEST] Kanban import test",
        "type": "Issue",
        "url": "https://github.com/tlindi/jagports/issues/1"
      },
      "id": "PVTI_lAHOAG6fZ84BhoLTzg4P-aU",
      "repository": "https://github.com/tlindi/jagports",
      "status": "Todo",
      "title": "[P0 TEST] Kanban import test"
    }
  ],
  "totalCount": 1
}
```

### Result

Project item ID:

```text
PVTI_lAHOAG6fZ84BhoLTzg4P-aU
```

---

## 12. Set Priority to P0

### Command

```bash
gh project item-edit --project-id PVT_kwHOAG6fZ84BhoLT --id PVTI_lAHOAG6fZ84BhoLTzg4P-aU --field-id PVTF_lAHOAG6fZ84BhoLTzhgjSTY --text "P0"
```

### Response

```text
Edited item "[P0 TEST] Kanban import test"
```

---

## 13. Verify Priority

### Command

```bash
gh project item-list 1 --owner tlindi --format json
```

### Response

```json
{
  "items": [
    {
      "content": {
        "body": "Temporary test issue for GitHub Project import and Priority field.",
        "number": 1,
        "repository": "tlindi/jagports",
        "title": "[P0 TEST] Kanban import test",
        "type": "Issue",
        "url": "https://github.com/tlindi/jagports/issues/1"
      },
      "id": "PVTI_lAHOAG6fZ84BhoLTzg4P-aU",
      "priority": "P0",
      "repository": "https://github.com/tlindi/jagports",
      "status": "Todo",
      "title": "[P0 TEST] Kanban import test"
    }
  ],
  "totalCount": 1
}
```

### Result

The complete path was verified:

```text
GitHub Issue → GitHub Project → Priority field → P0
```

---

## 14. Delete temporary test Issue

### Command

```bash
gh issue delete 1 --repo tlindi/jagports --yes
```

### Response

```text
✔ Deleted issue tlindi/jagports#1 ([P0 TEST] Kanban import test).
```

### Result

Temporary test Issue removed.

---

# Verified Current Setup

- Repository: `tlindi/jagports`
- Project: `Jagports Vehicle Information and EPC System`
- Project number: `1`
- Project ID: `PVT_kwHOAG6fZ84BhoLT`
- Priority field: `PVTF_lAHOAG6fZ84BhoLTzhgjSTY`
- Status field: `PVTSSF_lAHOAG6fZ84BhoLTzhgjOMY`
- Statuses: `Todo`, `In Progress`, `Done`
- Issue → Project attachment: **verified**
- Project Priority assignment: **verified**
- Temporary test Issue: **deleted**

# Generalized GitHub Project Setup Skill

This section is intentionally generic so the procedure can be reused for another repository/project.

## Preconditions

- GitHub CLI (`gh`) installed.
- Logged in to GitHub.
- Account has access to the repository and Project.
- `project` scope available.

## Generic discovery sequence

```bash
gh auth status
gh repo list OWNER --limit 20
gh project list --owner OWNER
gh project field-list PROJECT_NUMBER --owner OWNER
```

## Generic Priority field setup

If the Project does not already have a suitable Priority field:

```bash
gh project field-create PROJECT_NUMBER --owner OWNER --name "Priority" --data-type "TEXT"
```

Then retrieve the field ID:

```bash
gh project field-list PROJECT_NUMBER --owner OWNER
```

## Generic Issue → Project test

Create a temporary Issue:

```bash
gh issue create --repo OWNER/REPO --title "[P0 TEST] Project import test" --body "Temporary test."
```

Add it to the Project:

```bash
gh project item-add PROJECT_NUMBER --owner OWNER --url ISSUE_URL
```

Find its Project item ID:

```bash
gh project item-list PROJECT_NUMBER --owner OWNER --format json
```

Set the Priority field:

```bash
gh project item-edit --project-id PROJECT_ID --id PROJECT_ITEM_ID --field-id PRIORITY_FIELD_ID --text "P0"
```

Verify:

```bash
gh project item-list PROJECT_NUMBER --owner OWNER --format json
```

Delete the temporary test:

```bash
gh issue delete ISSUE_NUMBER --repo OWNER/REPO --yes
```

## Reusable operating rule

For ordered work plans, use the priority in both places:

1. Issue title: `[P1.3] Configure Kanban workflow`
2. Project `Priority` field: `P1.3`

This preserves explicit execution order while also making Priority a structured Project field.

## Important limitation

This generalized skill documents the commands verified during the Jagports setup. It does not assume that every GitHub Project has the same Status options, field IDs, or permissions. Always inspect the target Project before editing fields.
