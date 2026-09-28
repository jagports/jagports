# Setting Up Kanban — Current Repository Reference

This file is retained as the v1 reference but now points to the current repository and reusable setup procedure.

Current repository:

```text
jagports/jagports
```

Do not use historical repository identity values from the original setup log in new commands.

## Generic repository discovery

```bash
REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
PROJECT_OWNER="${REPO%%/*}"
echo "$REPO"
echo "$PROJECT_OWNER"
```

## Generic Project discovery

```bash
gh project list --owner "$PROJECT_OWNER"
gh project field-list PROJECT_NUMBER --owner "$PROJECT_OWNER" --format json
gh project item-list PROJECT_NUMBER --owner "$PROJECT_OWNER" --format json
```

## P1 completion

- P1 — Open Kanban
- P1.1 — Select Kanban tool
- P1.2 — Create Jagports GitHub repository
- P1.3 — Configure Kanban workflow
- P1.4 — Define Kanban fields and labels
- P1.5 — Define Kanban operating rules

Required workflow:

```text
BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → CODING → REVIEW → TESTING → DONE
```

Exceptional state: `BLOCKED`.

## Project verification

Verify the current Project rather than relying on historical IDs. Project IDs, field IDs, option IDs, and view IDs are Project-specific and must be discovered from the current Project before mutation.

For the complete reusable procedure, use `Setting_up_Kanban_v2.md`.

## Historical record

The original console output remains in `Setting_up_Kanban-console.log` as historical evidence. It is intentionally not rewritten because it records what was actually executed before the repository transfer.
