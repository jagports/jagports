#!/usr/bin/env bash
set -euo pipefail

REPO="tlindi/jagports"
PROJECT_NUMBER="1"
PROJECT_OWNER="tlindi"
PROJECT_ID="PVT_kwHOAG6fZ84BhoLT"
STATUS_FIELD_ID="PVTSSF_lAHOAG6fZ84BhoLTzhgjOMY"
PRIORITY_FIELD_ID="PVTF_lAHOAG6fZ84BhoLTzhgjSTY"

STATUS_BACKLOG="f75ad846"
STATUS_DONE="98236657"

gh auth status

find_item_id() {
  local url="$1"
  gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
    | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    if i['content']['url']=='$url':
        print(i['id']); break
"
}

create_and_add() {
  local priority="$1" title="$2" where="$3" init_status="$4"

  body="Priority: $priority
Where: $where
Initial status: $init_status"

  url=$(gh issue create --repo "$REPO" --title "[$priority] $title" --body "$body")
  echo "Created: $url"

  gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$url" >/dev/null

  item_id=""
  for attempt in 1 2 3 4 5; do
    item_id=$(find_item_id "$url")
    if [ -n "$item_id" ]; then
      break
    fi
    echo "  item not visible yet, retrying (attempt $attempt)..."
    sleep 2
  done

  if [ -z "$item_id" ]; then
    echo "  WARNING: could not resolve item_id for $url after retries — fields NOT set, fix manually."
    return 0
  fi

  status_opt="$STATUS_BACKLOG"
  [ "$init_status" = "DONE" ] && status_opt="$STATUS_DONE"

  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$STATUS_FIELD_ID" --single-select-option-id "$status_opt" >/dev/null

  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$PRIORITY_FIELD_ID" --text "$priority" >/dev/null

  echo "  -> item_id=$item_id status=$init_status"
}

create_and_add "P1.3" "Configure Kanban workflow" "GitHub Projects" "DONE"
create_and_add "P1.4" "Define Kanban fields and labels" "GitHub Projects / Issues" "DONE"
create_and_add "P1.5" "Define Kanban operating rules" "GitHub repository" "DONE"

create_and_add "P2"   "Open agent accounts/access to Kanban" "GitHub + Codex Web" "TODO"
create_and_add "P2.1" "Define agent identities" "GitHub repository" "TODO"
create_and_add "P2.2" "Validate leader R/W rights" "GitHub Project permissions" "TODO"
create_and_add "P2.3" "Define permission boundaries" "GitHub repository" "TODO"
create_and_add "P2.4" "Connect Codex to repository" "Codex Web + GitHub" "TODO"

create_and_add "P3"   "Define agent communication protocol" "GitHub Issues / Projects" "TODO"
create_and_add "P3.1" "Define escalation categories" "GitHub repository" "TODO"
create_and_add "P3.2" "Define human decision gate" "GitHub Kanban" "TODO"
create_and_add "P3.3" "Define agent hand-off format" "GitHub Issue templates" "TODO"

create_and_add "P4"   "Create work-item templates" "GitHub Issues" "TODO"
create_and_add "P4.1" "Define feature template" "GitHub Issues" "TODO"
create_and_add "P4.2" "Define research template" "GitHub Issues" "TODO"
create_and_add "P4.3" "Define decision template" "GitHub Issues / Decision Log" "TODO"

create_and_add "P5"   "Establish Jagports product memory" "GitHub repository" "TODO"
create_and_add "P5.1" "Create repository knowledge structure" "GitHub repository" "TODO"
create_and_add "P5.2" "Record product vision and constraints" "GitHub repository" "TODO"
create_and_add "P5.3" "Create decision log" "GitHub repository" "TODO"

create_and_add "P6"   "Establish prioritization system" "GitHub Project fields + Issues" "TODO"
create_and_add "P6.1" "Define scoring factors" "GitHub repository documentation" "TODO"
create_and_add "P6.2" "Define priority rules" "GitHub Project" "TODO"
create_and_add "P6.3" "Populate first ranked backlog" "GitHub Project / Issues" "TODO"

create_and_add "P7"   "Establish research-to-decision workflow" "ChatGPT/web research + GitHub Issues" "TODO"
create_and_add "P7.1" "Run first research cycle" "ChatGPT/web research; GitHub" "TODO"
create_and_add "P7.2" "Convert findings to proposals" "GitHub Issues" "TODO"
create_and_add "P7.3" "Escalate only required decisions" "GitHub Kanban" "TODO"

create_and_add "P8"   "Establish Codex engineering workflow" "Codex Web + GitHub repository" "TODO"
create_and_add "P8.1" "Create Codex engineering instructions" "GitHub repository" "TODO"
create_and_add "P8.2" "Implement first approved task" "Codex Web + GitHub" "TODO"
create_and_add "P8.3" "Validate delivery loop" "GitHub + Codex Web" "TODO"

create_and_add "P9"   "Establish quality gates" "GitHub repository / GitHub Actions" "TODO"
create_and_add "P9.1" "Define acceptance criteria standard" "GitHub Issue templates" "TODO"
create_and_add "P9.2" "Define technical review gate" "GitHub Pull Requests / Issues" "TODO"
create_and_add "P9.3" "Define automated validation" "GitHub Actions / repository" "TODO"

create_and_add "P10"   "Prepare Raspberry Pi infrastructure" "Raspberry Pi 4B" "TODO"
create_and_add "P10.1" "Prepare Linux environment" "Raspberry Pi terminal" "TODO"
create_and_add "P10.2" "Define persistent services" "Raspberry Pi" "TODO"
create_and_add "P10.3" "Establish backup strategy" "Raspberry Pi + GitHub" "TODO"

create_and_add "P11"   "Add autonomous automation" "GitHub Actions and/or Raspberry Pi" "TODO"
create_and_add "P11.1" "Identify automation candidates" "GitHub Project / Issues" "TODO"
create_and_add "P11.2" "Implement first automation" "GitHub Actions or Raspberry Pi" "TODO"

create_and_add "P12" "Expand and govern the agent team" "ChatGPT/Codex + GitHub" "TODO"

echo ""
echo "Backlog pushed. Verifying all items:"
gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    print(i['content']['title'], '| status:', i.get('status'), '| priority:', i.get('priority'))
"

echo ""
echo "Open in browser:"
gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --web
