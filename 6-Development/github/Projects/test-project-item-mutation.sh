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

PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$ORG" --format json --jq '.id')

sleep 0.4

STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$ORG" --format json --jq '.fields[] | select(.name == "Status") | .id')

sleep 0.4

# Discover the Project Item through the source Issue. Do not enumerate
# ProjectV2.items(...), because that operation is not authorization-compatible
# with the dedicated Actions Project credential.
ISSUE_NODE_ID=$(gh issue view "$ISSUE_NUMBER" --json id --jq '.id')
ISSUE_JSON=$(gh api graphql -f query='query($issue:ID!){ node(id:$issue){ ... on Issue { id number projectItems(first:20){ nodes { id isArchived project { id title number } content { ... on Issue { id number } } } } } } }' -F issue="$ISSUE_NODE_ID")

sleep 0.4

ITEM_ID=$(printf '%s\n' "$ISSUE_JSON" | python -c 'import json,sys; d=json.load(sys.stdin)["data"]["node"]; p=sys.argv[1]; n=int(sys.argv[2]); matches=[i for i in d.get("projectItems",{}).get("nodes",[]) if i.get("project",{}).get("id")==p and not i.get("isArchived",True) and i.get("content",{}).get("number")==n]; print(matches[0]["id"] if len(matches)==1 else "")' "$PROJECT_ID" "$ISSUE_NUMBER")

if [ -z "$PROJECT_ID" ] || [ -z "$STATUS_FIELD_ID" ] || [ -z "$ITEM_ID" ]; then
  echo 'ERROR: Target active Project Item was not found through the source Issue.'
  printf 'Expected source Issue: #%s\n' "$ISSUE_NUMBER"
  exit 1
fi

ITEM_JSON=$(gh api graphql -f query='query($item:ID!){ node(id:$item){ ... on ProjectV2Item { id isArchived project { id title number } content { ... on Issue { id number } } fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue { name optionId } } } } }' -F item="$ITEM_ID")

sleep 0.4

CURRENT_STATUS=$(printf '%s\n' "$ITEM_JSON" | python -c 'import json,sys; d=json.load(sys.stdin)["data"]["node"]; print(d.get("fieldValueByName",{}).get("name", ""))')
CURRENT_STATUS_ID=$(printf '%s\n' "$ITEM_JSON" | python -c 'import json,sys; d=json.load(sys.stdin)["data"]["node"]; print(d.get("fieldValueByName",{}).get("optionId", ""))')

if [ -z "$CURRENT_STATUS" ] || [ -z "$CURRENT_STATUS_ID" ]; then
  echo 'ERROR: Project Item has no current Status value to restore.'
  exit 1
fi

sleep 0.4

STATUS_OPTIONS=$(gh project field-list "$PROJECT_NUMBER" --owner "$ORG" --format json --jq '.fields[] | select(.name == "Status") | .options')
NEW_STATUS_ID=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); old=sys.argv[1]; matches=[o for o in opts if o.get("name") != old]; print(matches[0]["id"] if matches else "")' "$CURRENT_STATUS")
NEW_STATUS_NAME=$(printf '%s\n' "$STATUS_OPTIONS" | python -c 'import json,sys; opts=json.load(sys.stdin); oid=sys.argv[1]; matches=[o for o in opts if o.get("id")==oid]; print(matches[0]["name"] if matches else "")' "$NEW_STATUS_ID")

if [ -z "$NEW_STATUS_ID" ] || [ -z "$NEW_STATUS_NAME" ]; then
  echo 'ERROR: Could not identify a distinct Status option ID.'
  exit 1
fi

echo '--- DISCOVERY ---'
printf 'Project ID: %s\n' "$PROJECT_ID"
printf 'Status field ID: %s\n' "$STATUS_FIELD_ID"
printf 'Project Item ID: %s\n' "$ITEM_ID"
printf 'Current Status: %s (%s)\n' "$CURRENT_STATUS" "$CURRENT_STATUS_ID"
printf 'Test Status: %s (%s)\n' "$NEW_STATUS_NAME" "$NEW_STATUS_ID"

echo '--- MUTATE PROJECT ITEM ---'
gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$NEW_STATUS_ID"

sleep 0.4

echo '--- VERIFY MUTATION ---'
VERIFIED_JSON=$(gh api graphql -f query='query($item:ID!){ node(id:$item){ ... on ProjectV2Item { id isArchived content { ... on Issue { id number } } fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue { name optionId } } } } }' -F item="$ITEM_ID")
VERIFIED_ISSUE=$(printf '%s\n' "$VERIFIED_JSON" | python -c 'import json,sys; print(json.load(sys.stdin)["data"]["node"]["content"]["number"])')
VERIFIED_STATUS=$(printf '%s\n' "$VERIFIED_JSON" | python -c 'import json,sys; print(json.load(sys.stdin)["data"]["node"]["fieldValueByName"]["name"])')
VERIFIED_OPTION=$(printf '%s\n' "$VERIFIED_JSON" | python -c 'import json,sys; print(json.load(sys.stdin)["data"]["node"]["fieldValueByName"]["optionId"])')
VERIFIED_ARCHIVED=$(printf '%s\n' "$VERIFIED_JSON" | python -c 'import json,sys; print(json.load(sys.stdin)["data"]["node"]["isArchived"])')
printf 'Verified Issue: #%s\n' "$VERIFIED_ISSUE"
printf 'Verified Status: %s (%s)\n' "$VERIFIED_STATUS" "$VERIFIED_OPTION"
printf 'Verified Archived: %s\n' "$VERIFIED_ARCHIVED"

if [ "$VERIFIED_ISSUE" != "$ISSUE_NUMBER" ] || [ "$VERIFIED_STATUS" != "$NEW_STATUS_NAME" ] || [ "$VERIFIED_OPTION" != "$NEW_STATUS_ID" ] || [ "$VERIFIED_ARCHIVED" != "false" ]; then
  echo 'ERROR: Project Item mutation was not independently verified.'
  exit 1
fi

echo 'Mutation verified successfully.'

echo '--- RESTORE PROJECT ITEM ---'
gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$CURRENT_STATUS_ID"

sleep 0.4
echo '--- VERIFY RESTORE ---'
RESTORED_JSON=$(gh api graphql -f query='query($item:ID!){ node(id:$item){ ... on ProjectV2Item { id isArchived content { ... on Issue { id number } } fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue { name optionId } } } } }' -F item="$ITEM_ID")
RESTORED_STATUS=$(printf '%s\n' "$RESTORED_JSON" | python -c 'import json,sys; print(json.load(sys.stdin)["data"]["node"]["fieldValueByName"]["name"])')
RESTORED_OPTION=$(printf '%s\n' "$RESTORED_JSON" | python -c 'import json,sys; print(json.load(sys.stdin)["data"]["node"]["fieldValueByName"]["optionId"])')
printf 'Restored Status: %s (%s)\n' "$RESTORED_STATUS" "$RESTORED_OPTION"

if [ "$RESTORED_STATUS" != "$CURRENT_STATUS" ] || [ "$RESTORED_OPTION" != "$CURRENT_STATUS_ID" ]; then
  echo 'ERROR: Original Project Item Status was not restored.'
  exit 1
fi

echo 'Restore verified successfully.'
echo '=== PROJECT ITEM MUTATION TEST PASSED ==='
echo 'RESULT=PASS'
echo 'PROJECT_ACCESS=PASS'
echo 'ISSUE_SCOPED_PROJECT_ITEM_READ=PASS'
echo 'STATUS_READ=PASS'
echo 'PROJECT_ITEM_MUTATION=PASS'
echo 'INDEPENDENT_READ_BACK=PASS'
echo 'PROJECT_ITEM_RESTORE=PASS'
echo 'CREDENTIAL_VALUES_EXPOSED=NO'
