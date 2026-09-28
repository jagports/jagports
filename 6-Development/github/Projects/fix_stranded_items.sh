#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"
PROJECT_ID="${PROJECT_ID:-}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-}"
PRIORITY_FIELD_ID="${PRIORITY_FIELD_ID:-}"
STATUS_BACKLOG="${STATUS_BACKLOG:-}"

if [ -z "$PROJECT_ID" ] || [ -z "$STATUS_FIELD_ID" ] || [ -z "$PRIORITY_FIELD_ID" ] || [ -z "$STATUS_BACKLOG" ]; then
  echo "ERROR: Project configuration is incomplete. Set PROJECT_ID, STATUS_FIELD_ID, PRIORITY_FIELD_ID and STATUS_BACKLOG." >&2
  exit 1
fi

declare -a FAILED=(
  "35:P7.3"
  "36:P8"
  "37:P8.1"
  "38:P8.2"
  "39:P8.3"
  "40:P9"
  "41:P9.1"
  "42:P9.2"
  "44:P9.3"
  "45:P10"
  "46:P10.1"
  "47:P10.2"
  "48:P10.3"
  "49:P11"
  "50:P11.1"
  "51:P11.2"
  "52:P12"
)

echo "Repository: $REPO"
echo "Project owner: $PROJECT_OWNER"
echo "Project number: $PROJECT_NUMBER"
echo "Fetching full project item list (limit 200 to avoid pagination cutoff)..."
ITEMS_JSON=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --limit 200 --format json)

for pair in "${FAILED[@]}"; do
  issue_num="${pair%%:*}"
  priority="${pair##*:}"
  url="https://github.com/$REPO/issues/$issue_num"

  item_id=$(echo "$ITEMS_JSON" | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    if i['content']['url']=='$url':
        print(i['id']); break
")

  if [ -z "$item_id" ]; then
    echo "STILL MISSING: $url (priority $priority) — check manually"
    continue
  fi

  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$STATUS_FIELD_ID" --single-select-option-id "$STATUS_BACKLOG" >/dev/null

  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$PRIORITY_FIELD_ID" --text "$priority" >/dev/null

  echo "Fixed: $url -> $priority (item_id=$item_id)"
done

echo ""
echo "=== Full verification (all rows) ==="
gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --limit 200 --format json | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    print(i['content']['title'], '| status:', i.get('status'), '| priority:', i.get('priority'))
"