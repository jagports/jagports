# Setting up Jagports AI OS — P2 Notes

## Current repository

`jagports/jagports`

The repository was transferred from an earlier owner. New documentation and commands must use the current repository identity or discover it dynamically.

## P2.1 — Define agent identities

Use logical roles operating through existing ChatGPT/Codex accounts rather than creating separate GitHub identities solely for roles.

The current roles are documented in `AGENT_ROLES.md`:

1. Team Lead / Chief of Staff
2. Research
3. Product / Vehicle
4. Technical / Architecture
5. Prioritization / Validation
6. Codex Engineering

Logical roles do not create additional GitHub authority. The authority model remains defined by `0-DocumentationEducationCompetense/KANBAN_OPERATING_RULES.md`.

## P2.2 — Validate leader R/W rights

Use the currently authenticated GitHub account and the current repository/project. Do not use an old account name from historical setup logs.

From the repository checkout:

```bash
gh auth status
REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
PROJECT_OWNER="${REPO%%/*}"
gh api "repos/$REPO" --jq '.permissions'
gh project list --owner "$PROJECT_OWNER"
```

The result must show repository write access and successful Project access. Record the actual verification result on the Kanban item.

## P2.3 — Define permission boundaries

Document, per logical role:

- actions allowed without Product Owner approval
- actions requiring Product Owner approval
- actions that require a decision gate
- actions that may modify repository content
- actions that may modify Project state
- actions that may create or close issues
- actions that may merge changes

The Product Owner retains final authority under the Kanban operating rules.

## P2.4 — Connect Codex to repository

The Codex Web connection must target the current repository:

`jagports/jagports`

Verify that Codex can read the repository and perform an approved repository change. Record the connection scope and verification result on the Kanban item.

## Repository identity rule

For scripts, prefer:

```bash
REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
```

Do not hardcode a personal account or a repository owner that was used before a transfer.
