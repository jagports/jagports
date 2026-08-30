#!/usr/bin/env bash

set -e

REPO="jagports/jagports"
PROJECT_OWNER="jagports"
PROJECT_NUMBER="9"
TASK_FILE="5-Implementation-Projects/Setting_up_Kanban/Jagports_GitHub_Import_Task_List.md"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "Jagports AI OS Kanban import"
echo "Repository: $REPO"
echo "Project: $PROJECT_NUMBER"

if [ ! -f "$TASK_FILE" ]; then
    echo "Missing task file: $TASK_FILE"
    exit 1
fi

PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | grep -B2 -A2 '"name":"Status"' | grep '"id"' | head -1 | cut -d'"' -f4)

PRIORITY_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | grep -B2 -A15 '"name":"Priority"' | grep '"id"' | head -1 | cut -d'"' -f4)

EXECUTOR_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | grep -B2 -A15 '"name":"Executor"' | grep '"id"' | head -1 | cut -d'"' -f4)

echo "Project ID: $PROJECT_ID"

declare -A ISSUE_IDS
declare -A ISSUE_NUMBERS

while read -r LINE
do
    if [[ "$LINE" =~ \|\ \`(P[0-9]+(\.[0-9]+)?)\`\ \|\ (.*)\ \|\ (.*)\ \|\ (.*)\ \| ]]
    then
        PRIORITY="${BASH_REMATCH[1]}"
        TITLE="${BASH_REMATCH[3]}"
        WHERE="${BASH_REMATCH[4]}"
        STATUS="${BASH_REMATCH[5]}"

        if [ "$PRIORITY" = "P1" ] || [[ "$PRIORITY" =~ ^P1\. ]]
        then
            continue
        fi

        EXISTING=$(gh issue list --repo "$REPO" --state all --search "\"[$PRIORITY]\"" --json number,title --jq ".[] | select(.title | startswith(\"[$PRIORITY]\")) | .number")

        if [ -n "$EXISTING" ]
        then
            ISSUE_NUMBER="$EXISTING"
            echo "Exists $PRIORITY #$ISSUE_NUMBER"
        else
            BODY="Priority: $PRIORITY

Where: $WHERE

Initial status: $STATUS"

            echo "Creating $PRIORITY $TITLE"

            URL=$(gh issue create \
                --repo "$REPO" \
                --title "[$PRIORITY] $TITLE" \
                --body "$BODY")

            ISSUE_NUMBER="${URL##*/}"
            echo "Created #$ISSUE_NUMBER"
        fi

        gh project item-add "$PROJECT_NUMBER" \
            --owner "$PROJECT_OWNER" \
            --url "https://github.com/$REPO/issues/$ISSUE_NUMBER" >/dev/null || true

        ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" \
            --owner "$PROJECT_OWNER" \
            --format json |
            grep -B5 "\"number\":$ISSUE_NUMBER" |
            grep '"id"' |
            head -1 |
            cut -d'"' -f4)

        if [ -n "$ITEM_ID" ]; then

            if [[ "$PRIORITY" =~ ^P[0-9] ]]
            then
                PRIORITY_OPTION=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json |
                    grep -A20 '"name":"Priority"' |
                    grep -B1 "\"name\":\"${PRIORITY:0:2}\"" |
                    grep '"id"' |
                    cut -d'"' -f4)
            fi

            if [ -n "$PRIORITY_OPTION" ]
            then
                gh api graphql -f query="
mutation {
 updateProjectV2ItemFieldValue(input:{
 projectId:\"$PROJECT_ID\",
 itemId:\"$ITEM_ID\",
 fieldId:\"$PRIORITY_FIELD_ID\",
 value:{singleSelectOptionId:\"$PRIORITY_OPTION\"}
 }) {
 projectV2Item { id }
 }
}" >/dev/null
            fi

            DONE_OPTION=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json |
                grep -A20 '"name":"Status"' |
                grep -B1 '"name":"BACKLOG"' |
                grep '"id"' |
                cut -d'"' -f4)

            if [ -n "$DONE_OPTION" ]
            then
                gh api graphql -f query="
mutation {
 updateProjectV2ItemFieldValue(input:{
 projectId:\"$PROJECT_ID\",
 itemId:\"$ITEM_ID\",
 fieldId:\"$STATUS_FIELD_ID\",
 value:{singleSelectOptionId:\"$DONE_OPTION\"}
 }) {
 projectV2Item { id }
 }
}" >/dev/null
            fi
        fi

        ISSUE_IDS[$PRIORITY]=$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json id --jq '.id')
        ISSUE_NUMBERS[$PRIORITY]=$ISSUE_NUMBER

    fi

done < "$TASK_FILE"

echo
echo "Creating sub-issue relationships"

for CHILD in "${!ISSUE_IDS[@]}"
do
    if [[ "$CHILD" =~ ^(P[0-9]+)\. ]]
    then
        PARENT="${BASH_REMATCH[1]}"

        if [ -n "${ISSUE_IDS[$PARENT]}" ]
        then
            gh api graphql -f query="
mutation {
 addSubIssue(input:{
 issueId:\"${ISSUE_IDS[$PARENT]}\",
 subIssueId:\"${ISSUE_IDS[$CHILD]}\"
 }) {
 issue { title }
 }
}" >/dev/null || true

            echo "$CHILD -> $PARENT"
        fi
    fi
done

echo
echo "Import complete"