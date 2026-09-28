#!/usr/bin/env bash
# create_ai_os_epic.sh
set -euo pipefail

REPO="jagports/jagports"
PROJECT_ID="PVT_kwDOEz190s4Bh6vc"
API_DELAY=1.5

echo "=== Resolving project number/owner ==="
PROJECT_INFO=$(gh api graphql -f query='
query($id: ID!) {
  node(id: $id) {
    ... on ProjectV2 {
      number
      owner { ... on User { login } ... on Organization { login } }
    }
  }
}' -f id="$PROJECT_ID")
sleep "$API_DELAY"

PROJECT_NUMBER=$(echo "$PROJECT_INFO" | python -c "import json,sys;print(json.load(sys.stdin)['data']['node']['number'])")
PROJECT_OWNER=$(echo "$PROJECT_INFO" | python -c "import json,sys;print(json.load(sys.stdin)['data']['node']['owner']['login'])")
echo "number=$PROJECT_NUMBER owner=$PROJECT_OWNER"

echo ""
echo "=== Resolving Status/Priority fields ==="
FIELDS_JSON=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json)
sleep "$API_DELAY"

STATUS_FIELD_ID=$(echo "$FIELDS_JSON" | python -c "
import json,sys
d=json.load(sys.stdin)
for f in d['fields']:
    if f['name']=='Status': print(f['id']); break
")

PRIORITY_FIELD_ID=$(echo "$FIELDS_JSON" | python -c "
import json,sys
d=json.load(sys.stdin)
for f in d['fields']:
    if f['name']=='Priority': print(f['id']); break
")

STATUS_IMPLEMENTATION=$(echo "$FIELDS_JSON" | python -c "
import json,sys
d=json.load(sys.stdin)
for f in d['fields']:
    if f['name']=='Status':
        for o in f.get('options', []):
            if o['name']=='IMPLEMENTATION': print(o['id']); break
")

if [ -z "$STATUS_FIELD_ID" ] || [ -z "$STATUS_IMPLEMENTATION" ] || [ -z "$PRIORITY_FIELD_ID" ]; then
  echo "ERROR: could not resolve one or more fields. Found:"
  echo "$FIELDS_JSON" | python -c "
import json,sys
d=json.load(sys.stdin)
for f in d['fields']:
    print(' -', f['name'], f.get('type'), f['id'])
    for o in f.get('options', []):
        print('     option:', o['name'], o['id'])
"
  exit 1
fi

echo "Status field=$STATUS_FIELD_ID IMPLEMENTATION=$STATUS_IMPLEMENTATION"
echo "Priority field=$PRIORITY_FIELD_ID"

echo ""
echo "=== Creating epic issue ==="
BODY="Umbrella tracking issue for the multi-agent operating system (P1-P12).
Owns: Kanban, agent roles, permission boundaries, prioritization,
research-to-decision workflow, Codex engineering workflow, quality
gates, infrastructure, automation, team governance.
Completion = P1-P12 all DONE or explicitly descoped."

URL=$(gh issue create --repo "$REPO" --title "[EPIC] Establish Jagports AI OS" --body "$BODY")
sleep "$API_DELAY"
echo "Created: $URL"

echo ""
echo "=== Adding to Project ==="
gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$URL" >/dev/null
sleep "$API_DELAY"

ITEM_ID=""
for attempt in 1 2 3 4 5 6; do
  ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --limit 200 --format json \
    | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    if i['content'].get('url')=='$URL':
        print(i['id']); break
")
  sleep "$API_DELAY"
  [ -n "$ITEM_ID" ] && break
  echo "  item not visible yet, retrying (attempt $attempt)..."
  sleep 3
done

if [ -z "$ITEM_ID" ]; then
  echo "WARNING: could not resolve item_id — set Status/Priority manually via the Project UI."
  exit 0
fi

echo "item_id=$ITEM_ID"

echo ""
echo "=== Setting Status=IMPLEMENTATION ==="
gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" \
  --field-id "$STATUS_FIELD_ID" --single-select-option-id "$STATUS_IMPLEMENTATION"
sleep "$API_DELAY"

echo ""
echo "=== Setting Priority=P0 ==="
gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" \
  --field-id "$PRIORITY_FIELD_ID" --text "P0"
sleep "$API_DELAY"

echo ""
echo "Done: $URL"
