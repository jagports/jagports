#!/usr/bin/env bash
set -euo pipefail

ORG="jagports"
PROJECT_NUMBER="9"
ISSUE_NUMBER="313"

printf '%s\n' '=== PROJECT ITEM MUTATION TEST ==='
printf 'Effective account: %s\n' "$(gh api user --jq '.login')"
printf 'Project: #%s\n' "$PROJECT_NUMBER"
printf 'Project Item source Issue: #%s\n' "$ISSUE_NUMBER"

sleep 0.4

# The target of the mutation is the Project Item. Project metadata is used only
# to obtain the identifiers required by `gh project item-edit`.
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$ORG" --format json --jq '.id')

sleep 0.4

STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$ORG" --format json --jq '.fields[] | select(.name == "Status") | .id')

sleep 0.4

# Read the Project Items once, then identify the target Item by its source Issue.
# Keeping the full JSON array makes an absent Item a controlled test failure
# instead of feeding empty output into a JSON parser.
ITEMS_JSON=$(gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --limit 200 --format json --jq '.items')

ITEM_ID=$(printf '%s\n' "$ITEMS_JSON" | python -c 'import json,sys; items=json.load(sys.stdin); n=int(sys.argv[1]); matches=[i for i in items if i.get("content",{}).get("number")==n]; print(matches[0]["id"] if len(matches)==1 else "")' "$ISSUE_NUMBER")
CURRENT_STATUS=$(printf '%s\n' "$ITEMS_JSON" | python -c 'import json,sys; items=json.load(sys.stdin); n=int(sys.argv[1]); matches=[i for i in items if i.get("content",{}).get("number")==n]; print(matches[0].get("status","") if len(matches)==1 else "")' "$ISSUE_NUMBER")

if [ -z "$PROJECT_ID" ] || [ -z "$STATUS_FIELD_ID" ] || [ -z "$ITEM_ID" ]; then
  echo 'ERROR: Target Project Item was not found in Project #9.'
  printf 'Expected source Issue: #%s\n' "$ISSUE_NUMBER"
  exit 1
fi

if [ -z "$CURRENT_STATUS" ]; then
  echo 'ERROR: Project Item has no current Status value to restore.'
  exit 1
fi

sleep 0.4

STATUS_OPTIONS=$(gh project field-list "$PROJECT_NUMBER" --owner "$ORG" --format json --jq '.fields[] | select(.name == "Status") | .options')

NEW_STATUS_ID=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); old=sys.argv[1]; matches=[o for o in opts if o.get("name") != old]; print(matches[0]["id"] if matches else "")' "$CURRENT_STATUS")
NEW_STATUS_NAME=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); oid=sys.argv[1]; matches=[o for o in opts if o.get("id")==oid]; print(matches[0]["name"] if matches else "")' "$NEW_STATUS_ID")
OLD_STATUS_ID=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); old=sys.argv[1]; matches=[o for o in opts if o.get("name")==old]; print(matches[0]["id"] if matches else "")' "$CURRENT_STATUS")

if [ -z "$NEW_STATUS_ID" ] || [ -z "$NEW_STATUS_NAME" ] || [ -z "$OLD_STATUS_ID" ]; then
  echo 'ERROR: Could not identify Status option IDs.'
  exit 1
fi

echo '--- DISCOVERY ---'
printf 'Project ID: %s\n' "$PROJECT_ID"
printf 'Status field ID: %s\n' "$STATUS_FIELD_ID"
printf 'Project Item ID: %s\n' "$ITEM_ID"
printf 'Current Status: %s\n' "$CURRENT_STATUS"
printf 'Test Status: %s (%s)\n' "$NEW_STATUS_NAME" "$NEW_STATUS_ID"

# MUTATE THE PROJECT ITEM.
echo '--- MUTATE PROJECT ITEM ---'
gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$NEW_STATUS_ID"

sleep 0.4

# Independent read-back of the Project Item.
echo '--- VERIFY MUTATION ---'
VERIFIED_STATUS=$(gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --limit 200 --format json --jq '.items[] | select(.content.number == 313) | .status')
printf 'Verified Status: %s\n' "$VERIFIED_STATUS"

if [ "$VERIFIED_STATUS" != "$NEW_STATUS_NAME" ]; then
  echo 'ERROR: Project Item mutation was not independently verified.'
  exit 1
fi

echo 'Mutation verified successfully.'

# RESTORE THE ORIGINAL PROJECT ITEM STATUS.
echo '--- RESTORE PROJECT ITEM ---'
gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$OLD_STATUS_ID"

sleep 0.4
echo '--- VERIFY RESTORE ---'
RESTORED_STATUS=$(gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --limit 200 --format json --jq '.items[] | select(.content.number == 313) | .status')
printf 'Restored Status: %s\n' "$RESTORED_STATUS"

if [ "$RESTORED_STATUS" != "$CURRENT_STATUS" ]; then
  echo 'ERROR: Original Project Item Status was not restored.'
  exit 1
fi

echo 'Restore verified successfully.'

echo '=== PROJECT ITEM MUTATION TEST PASSED ==='
echo 'RESULT=PASS'
echo 'PROJECT_ACCESS=PASS'
echo 'PROJECT_ITEM_READ=PASS'
echo 'STATUS_READ=PASS'
echo 'PROJECT_ITEM_MUTATION=PASS'
echo 'INDEPENDENT_READ_BACK=PASS'
echo 'PROJECT_ITEM_RESTORE=PASS'
echo 'CREDENTIAL_VALUES_EXPOSED=NO'
