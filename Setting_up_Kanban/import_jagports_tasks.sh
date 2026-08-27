#!/usr/bin/env bash
set -euo pipefail

# EDIT THESE:
REPO="OWNER/Jagports"
PROJECT_NUMBER="1"
PROJECT_OWNER="OWNER"

gh auth status
gh auth refresh -s project

create_issue() {
  local priority="$1"
  local title="$2"
  local where="$3"
  local status="$4"

  body="Priority: $priority
Where: $where
Initial status: $status"

  gh issue create --repo "$REPO" --title "[$priority] $title" --body "$body" --project "Jagports Vehicle Information and EPC System"
}

create_issue "P1" "Open Kanban" "GitHub Projects" "DONE"
create_issue "P1.1" "Select Kanban tool" "GitHub Projects / Board" "DONE"
create_issue "P1.2" "Create Jagports GitHub repository" "GitHub" "DONE"
create_issue "P1.3" "Configure Kanban workflow" "GitHub Projects" "TODO"
create_issue "P1.4" "Define Kanban fields and labels" "GitHub Projects / Issues" "TODO"
create_issue "P1.5" "Define Kanban operating rules" "GitHub repository" "TODO"

# Continue the same pattern for the remaining rows in the .md.
echo "Issues created. Check the Project:"
gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --web
