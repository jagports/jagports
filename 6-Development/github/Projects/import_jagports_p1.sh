#!/usr/bin/env bash
set -uo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
PROJECT_TITLE="${PROJECT_TITLE:-Jagports AI OS}"

PROJECT_NUMBER=$(gh project list --owner "$PROJECT_OWNER" --format json --limit 100 | python -c "import json,sys; d=json.load(sys.stdin); [print(p['number']) for p in d if p.get('title')=='$PROJECT_TITLE']" | head -n 1)
if [ -z "$PROJECT_NUMBER" ]; then
  echo "ERROR: Project '$PROJECT_TITLE' not found. Run create_jagports_ai_os_project.sh first." >&2
  exit 1
fi

create_issue() {
  local priority="$1" task="$2"
  local title="[$priority] $task"
  local existing
  existing=$(gh issue list --repo "$REPO" --state all --search "in:title $title" --limit 20 --json title,url | python -c "import json,sys; t='$title'; d=json.load(sys.stdin); [print(i['url']) for i in d if i['title']==t]" | head -n 1)
  if [ -n "$existing" ]; then
    echo "EXISTS $title"
    gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$existing" >/dev/null 2>&1 || true
    return 0
  fi
  local url
  url=$(gh issue create --repo "$REPO" --title "$title" --body "Priority: $priority\nProject: $PROJECT_TITLE\nInitial status: DONE")
  echo "CREATED $title $url"
  gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$url" >/dev/null 2>&1 || echo "WARNING: could not add $url to Project"
}

create_issue P1 "Open Kanban"
create_issue P1.1 "Select Kanban tool"
create_issue P1.2 "Create Jagports GitHub repository"
create_issue P1.3 "Configure Kanban workflow"
create_issue P1.4 "Define Kanban fields and labels"
create_issue P1.5 "Define Kanban operating rules"

echo "Done: imported P1-P1.5 into $PROJECT_TITLE (#$PROJECT_NUMBER)."
