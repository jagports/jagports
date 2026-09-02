#!/usr/bin/env bash
set -euo pipefail

ORG="jagports"
PROJECT_NUMBER="9"
ISSUE_NUMBER="291"

printf '%s\n' '=== PROJECT ITEM MUTATION TEST ==='
printf 'Effective account: %s\n' "$(gh api user --jq '.login')"
printf 'Project: #%s\n' "$PROJECT_NUMBER"
printf 'Project Item source Issue: #%s\n' "$ISSUE_NUMBER"

sleep 0.4

# Project metadata is used only to obtain the Project ID and Status field/options.
# The object being mutated is the Project Item, not the Project itself.
PROJECT_JSON=$(gh project field-list "$PROJECT_NUMBER" --owner "$ORG" --format json)

sleep 0.4

PROJECT_ID=$(gh project list --owner "$ORG" --format json --limit 100 | python -c 'import json,sys; d=json.load(sys.stdin); print(next(p["id"] for p in d if str(p.get("number")) == "9"))')

STATUS_FIELD_ID=$(printf '%s\n' "$PROJECT_JSON" | python -c 'import json,sys; d=json.load(sys.stdin); print(next(f["id"] for f in d["fields"] if f.get("name") == "Status"))')

STATUS_OPTIONS=$(printf '%s\n' "$PROJECT_JSON" | python -c 'import json,sys; d=json.load(sys.stdin); f=next(f for f in d["fields"] if f.get("name") == "Status"); print(json.dumps(f.get("options",[])))')

sleep 0.4

ITEMS_JSON=$(gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --limit 200 --format json)

sleep 0.4

ITEM_ID=$(printf '%s\n' "$ITEMS_JSON" | python -c 'import json,sys; d=json.load(sys.stdin); print(next(i["id"] for i in d["items"] if i.get("content",{}).get("number") == 291))')

CURRENT_STATUS=$(printf '%s\n' "$ITEMS_JSON" | python -c 'import json,sys; d=json.load(sys.stdin); i=next(i for i in d["items"] if i.get("content",{}).get("number") == 291); print(i.get("status", ""))')

NEW_STATUS_ID=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); old=sys.argv[1]; print(next(o["id"] for o in opts if o.get("name") != old))' "$CURRENT_STATUS")

NEW_STATUS_NAME=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); oid=sys.argv[1]; print(next(o["name"] for o in opts if o.get("id") == oid))' "$NEW_STATUS_ID")

if [ -z "$PROJECT_ID" ] || [ -z "$STATUS_FIELD_ID" ] || [ -z "$ITEM_ID" ] || [ -z "$NEW_STATUS_ID" ]; then
  echo 'ERROR: Could not identify Project, Status field, Project Item, or alternate Status option.'
  exit 1
fi

echo '--- DISCOVERY ---'
printf 'Project ID: %s\n' "$PROJECT_ID"
printf 'Status field ID: %s\n' "$STATUS_FIELD_ID"
printf 'Project Item ID: %s\n' "$ITEM_ID"
printf 'Current Status: %s\n' "${CURRENT_STATUS:-<unset>}"
printf 'Test Status: %s (%s)\n' "$NEW_STATUS_NAME" "$NEW_STATUS_ID"

# MUTATE THE PROJECT ITEM.
echo '--- MUTATE PROJECT ITEM ---'
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "$STATUS_FIELD_ID" \
  --single-select-option-id "$NEW_STATUS_ID"

sleep 0.4

# Independent read-back of the Project Item.
echo '--- VERIFY MUTATION ---'
VERIFY_JSON=$(gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --limit 200 --format json)

sleep 0.4

VERIFIED_STATUS=$(printf '%s\n' "$VERIFY_JSON" | python -c 'import json,sys; d=json.load(sys.stdin); i=next(i for i in d["items"] if i.get("content",{}).get("number") == 291); print(i.get("status", ""))')

printf 'Verified Status: %s\n' "$VERIFIED_STATUS"

if [ "$VERIFIED_STATUS" != "$NEW_STATUS_NAME" ]; then
  echo 'ERROR: Project Item mutation was not independently verified.'
  exit 1
fi

echo 'Mutation verified successfully.'

# RESTORE THE ORIGINAL PROJECT ITEM STATUS.
if [ -n "$CURRENT_STATUS" ]; then
  OLD_STATUS_ID=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); old=sys.argv[1]; print(next(o["id"] for o in opts if o.get("name") == old))' "$CURRENT_STATUS")

  echo '--- RESTORE PROJECT ITEM ---'
  gh project item-edit \
    --project-id "$PROJECT_ID" \
    --id "$ITEM_ID" \
    --field-id "$STATUS_FIELD_ID" \
    --single-select-option-id "$OLD_STATUS_ID"

  sleep 0.4

  echo '--- VERIFY RESTORE ---'
  RESTORED_JSON=$(gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --limit 200 --format json)

  sleep 0.4

  RESTORED_STATUS=$(printf '%s\n' "$RESTORED_JSON" | python -c 'import json,sys; d=json.load(sys.stdin); i=next(i for i in d["items"] if i.get("content",{}).get("number") == 291); print(i.get("status", ""))')

  printf 'Restored Status: %s\n' "$RESTORED_STATUS"

  if [ "$RESTORED_STATUS" != "$CURRENT_STATUS" ]; then
    echo 'ERROR: Original Project Item Status was not restored.'
    exit 1
  fi

  echo 'Restore verified successfully.'
fi

echo '=== PROJECT ITEM MUTATION TEST PASSED ==='
echo 'RESULT=PASS'
echo 'PROJECT_ACCESS=PASS'
echo 'PROJECT_ITEM_READ=PASS'
echo 'STATUS_READ=PASS'
echo 'PROJECT_ITEM_MUTATION=PASS'
echo 'INDEPENDENT_READ_BACK=PASS'
echo 'PROJECT_ITEM_RESTORE=PASS'
echo 'CREDENTIAL_VALUES_EXPOSED=NO'
