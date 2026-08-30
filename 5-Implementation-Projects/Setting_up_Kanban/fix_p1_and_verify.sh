#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"
PROJECT_ID="${PROJECT_ID:-}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-}"
PRIORITY_FIELD_ID="${PRIORITY_FIELD_ID:-}"
STATUS_DONE="${STATUS_DONE:-}"

if [ -z "$PROJECT_ID" ] || [ -z "$STATUS_FIELD_ID" ] || [ -z "$PRIORITY_FIELD_ID" ] || [ -z "$STATUS_DONE" ]; then
  echo "ERROR: Project configuration is incomplete. Set PROJECT_ID, STATUS_FIELD_ID, PRIORITY_FIELD_ID and STATUS_DONE." >&2
  exit 1
fi

echo "=== Verifying [P1] Open Kanban ==="
echo "Repository: $REPO"
echo "Project owner: $PROJECT_OWNER"
echo "Project number: $PROJECT_NUMBER"

item_id=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    if i['content']['title'].startswith('[P1]'):
        print(i['id']); break
")

if [ -z "$item_id" ]; then
  echo "ERROR: could not find [P1] Open Kanban item — aborting."
  exit 1
fi

echo "Found item_id=$item_id"

gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
  --field-id "$STATUS_FIELD_ID" --single-select-option-id "$STATUS_DONE" >/dev/null
echo "Status -> DONE"

gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
  --field-id "$PRIORITY_FIELD_ID" --text "P1" >/dev/null
echo "Priority -> P1"

echo ""
echo "=== Verifying P1 / P1.1 / P1.2 ==="

gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    t = i['content']['title']
    if t.startswith('[P1'):
        print(t, '| status:', i.get('status'), '| priority:', i.get('priority'))
"