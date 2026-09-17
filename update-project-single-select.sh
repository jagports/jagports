#!/bin/bash

set -euo pipefail

PROJECT_FIELD_ID="${1:-}"
LEGACY_STATUS="${LEGACY_STATUS:-CODING}"
TARGET_STATUS="${TARGET_STATUS:-IMPLEMENTATION}"

if [ -z "$PROJECT_FIELD_ID" ]; then
  echo "Usage: $0 PROJECT_FIELD_ID"
  exit 1
fi

QUERY='
query($fieldId:ID!) {
  node(id:$fieldId) {
    ... on ProjectV2SingleSelectField {
      id
      name
      options { id name color description }
    }
  }
}'

read_field() {
  gh api graphql \
    -f query="$QUERY" \
    -f fieldId="$PROJECT_FIELD_ID"
}

field_json="$(read_field)"
field_id="$(jq -r '.data.node.id // empty' <<<"$field_json")"
field_name="$(jq -r '.data.node.name // empty' <<<"$field_json")"

[ "$field_id" = "$PROJECT_FIELD_ID" ] || {
  echo "Project single-select field was not resolved."
  exit 1
}

[ "$field_name" = "Status" ] || {
  echo "Refusing to update non-Status field '$field_name'."
  exit 1
}

target_count="$(jq --arg target "$TARGET_STATUS" '[.data.node.options[]? | select(.name == $target)] | length' <<<"$field_json")"
legacy_count="$(jq --arg legacy "$LEGACY_STATUS" '[.data.node.options[]? | select(.name == $legacy)] | length' <<<"$field_json")"

if [ "$target_count" -eq 1 ] && [ "$legacy_count" -eq 0 ]; then
  echo "PASS: Status already contains exactly one '$TARGET_STATUS' option and no '$LEGACY_STATUS' option."
  exit 0
fi

[ "$target_count" -eq 0 ] || {
  echo "Refusing ambiguous Status configuration: '$TARGET_STATUS' count is $target_count."
  exit 1
}

[ "$legacy_count" -eq 1 ] || {
  echo "Refusing unsafe migration: expected exactly one '$LEGACY_STATUS' option; found $legacy_count."
  exit 1
}

legacy_option_id="$(jq -r --arg legacy "$LEGACY_STATUS" '.data.node.options[]? | select(.name == $legacy) | .id' <<<"$field_json")"
before_ids="$(jq -c '[.data.node.options[]?.id] | sort' <<<"$field_json")"

options_json="$(jq -c --arg legacy "$LEGACY_STATUS" --arg target "$TARGET_STATUS" '
  [.data.node.options[]?
   | {
       id: .id,
       name: (if .name == $legacy then $target else .name end),
       color: .color,
       description: (if .name == $legacy then "Implementation in progress" else (.description // "") end)
     }]
' <<<"$field_json")"

MUTATION='
mutation($fieldId:ID!, $options:[ProjectV2SingleSelectFieldOptionInput!]) {
  updateProjectV2Field(input:{fieldId:$fieldId, singleSelectOptions:$options}) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        id
        name
        options { id name color description }
      }
    }
  }
}'

request_json="$(jq -n \
  --arg query "$MUTATION" \
  --arg fieldId "$PROJECT_FIELD_ID" \
  --argjson options "$options_json" \
  '{query:$query, variables:{fieldId:$fieldId, options:$options}}')"

printf '%s' "$request_json" | gh api graphql --input - >/dev/null

verified_json="$(read_field)"
target_count="$(jq --arg target "$TARGET_STATUS" '[.data.node.options[]? | select(.name == $target)] | length' <<<"$verified_json")"
legacy_count="$(jq --arg legacy "$LEGACY_STATUS" '[.data.node.options[]? | select(.name == $legacy)] | length' <<<"$verified_json")"
target_option_id="$(jq -r --arg target "$TARGET_STATUS" '.data.node.options[]? | select(.name == $target) | .id' <<<"$verified_json")"
after_ids="$(jq -c '[.data.node.options[]?.id] | sort' <<<"$verified_json")"

[ "$target_count" -eq 1 ] || {
  echo "Verification failed: '$TARGET_STATUS' count is $target_count."
  exit 1
}

[ "$legacy_count" -eq 0 ] || {
  echo "Verification failed: legacy '$LEGACY_STATUS' still exists."
  exit 1
}

[ "$target_option_id" = "$legacy_option_id" ] || {
  echo "Verification failed: renamed Status option did not preserve its ID."
  exit 1
}

[ "$after_ids" = "$before_ids" ] || {
  echo "Verification failed: Status option ID set changed."
  exit 1
}

echo "PASS: '$LEGACY_STATUS' was renamed to '$TARGET_STATUS' and all Status option IDs were preserved."
