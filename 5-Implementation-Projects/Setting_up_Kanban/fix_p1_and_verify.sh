#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="PVT_kwHOAG6fZ84BhoLT"
STATUS_FIELD_ID="PVTSSF_lAHOAG6fZ84BhoLTzhgjOMY"
PRIORITY_FIELD_ID="PVTF_lAHOAG6fZ84BhoLTzhgjSTY"
STATUS_DONE="98236657"

echo "=== Fixing [P1] Open Kanban ==="

item_id=$(gh project item-list 1 --owner tlindi --format json | python -c "
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

gh project item-list 1 --owner tlindi --format json | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    t = i['content']['title']
    if t.startswith('[P1'):
        print(t, '| status:', i.get('status'), '| priority:', i.get('priority'))
"
