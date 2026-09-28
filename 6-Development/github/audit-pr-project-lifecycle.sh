#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN/PROJECTS_TOKEN is required}"

REPOSITORY="${REPOSITORY:-${GITHUB_REPOSITORY:-jagports/jagports}}"
PROJECT_ORG="${PROJECT_ORG:-jagports}"
PROJECT_NUMBER="${PROJECT_NUMBER:-9}"
PROJECT_TITLE="${PROJECT_TITLE:-Jagports AI OS}"
REPORT_PATH="${REPORT_PATH:-pr-project-lifecycle-audit.tsv}"
FAIL_ON_DRIFT="${FAIL_ON_DRIFT:-false}"

items_file="$(mktemp)"
trap 'rm -f "$items_file"' EXIT

OWNER="${REPOSITORY%%/*}"
NAME="${REPOSITORY##*/}"

read -r -d '' PROJECT_QUERY <<'GRAPHQL' || true
query($org:String!, $number:Int!) {
  organization(login:$org) {
    projectV2(number:$number) {
      id
      title
    }
  }
}
GRAPHQL

project_json="$(gh api graphql -f query="$PROJECT_QUERY" -f org="$PROJECT_ORG" -F number="$PROJECT_NUMBER")"
project_id="$(jq -r '.data.organization.projectV2.id // empty' <<<"$project_json")"
project_title="$(jq -r '.data.organization.projectV2.title // empty' <<<"$project_json")"

[ -n "$project_id" ] || { echo "Project #$PROJECT_NUMBER was not found for $PROJECT_ORG." >&2; exit 2; }
[ "$project_title" = "$PROJECT_TITLE" ] || { echo "Unexpected Project title: '$project_title'." >&2; exit 2; }

# Enumerate repository Pull Requests and read each PR's projectItems connection.
# This path includes historical archived PR Project Items that ProjectV2.items
# does not expose reliably enough for this audit.
read -r -d '' PR_ITEMS_QUERY <<'GRAPHQL' || true
query($owner:String!, $name:String!, $after:String) {
  repository(owner:$owner, name:$name) {
    pullRequests(
      first:100
      after:$after
      states:[OPEN,CLOSED,MERGED]
      orderBy:{field:CREATED_AT,direction:ASC}
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        number
        state
        isDraft
        merged
        repository { nameWithOwner }
        reviewRequests(first:50) { totalCount }
        projectItems(first:50) {
          nodes {
            id
            isArchived
            project { id title number }
            statusValue: fieldValueByName(name:"Status") {
              ... on ProjectV2ItemFieldSingleSelectValue { name optionId }
            }
            workstreamValue: fieldValueByName(name:"Workstream") {
              ... on ProjectV2ItemFieldSingleSelectValue { name optionId }
            }
          }
        }
        closingIssuesReferences(first:50) {
          nodes {
            repository { nameWithOwner }
            projectItems(first:20) {
              nodes {
                id
                isArchived
                project { id }
                workstreamValue: fieldValueByName(name:"Workstream") {
                  ... on ProjectV2ItemFieldSingleSelectValue { name }
                }
              }
            }
          }
        }
      }
    }
  }
}
GRAPHQL

cursor=""
while :; do
  args=(-f query="$PR_ITEMS_QUERY" -f owner="$OWNER" -f name="$NAME")
  if [ -n "$cursor" ]; then
    args+=(-f after="$cursor")
  fi

  page_json="$(gh api graphql "${args[@]}")"

  jq -c --arg project "$project_id" '
    .data.repository.pullRequests.nodes[]? as $pr
    | $pr.projectItems.nodes[]?
    | select(.project.id == $project)
    | . + {
        content: {
          __typename: "PullRequest",
          id: $pr.id,
          number: $pr.number,
          state: $pr.state,
          isDraft: $pr.isDraft,
          merged: $pr.merged,
          repository: $pr.repository,
          reviewRequests: $pr.reviewRequests,
          closingIssuesReferences: $pr.closingIssuesReferences
        }
      }
  ' <<<"$page_json" >>"$items_file"

  has_next="$(jq -r '.data.repository.pullRequests.pageInfo.hasNextPage' <<<"$page_json")"
  [ "$has_next" = "true" ] || break
  cursor="$(jq -r '.data.repository.pullRequests.pageInfo.endCursor // empty' <<<"$page_json")"
  [ -n "$cursor" ] || { echo "Pull Request pagination indicated another page without a cursor." >&2; exit 2; }
done

mapfile -t duplicate_prs < <(
  jq -r --arg repo "$REPOSITORY" '
    select(.content.__typename == "PullRequest" and .content.repository.nameWithOwner == $repo)
    | .content.number
  ' "$items_file" | sort -n | uniq -d
)

is_duplicate_pr() {
  local number="$1"
  local duplicate
  for duplicate in "${duplicate_prs[@]:-}"; do
    [ "$duplicate" = "$number" ] && return 0
  done
  return 1
}

printf 'PR\tNativeState\tMerged\tDraft\tReviewRequests\tArchived\tStatus\tWorkstream\tExpectedStatus\tExpectedArchived\tExpectedWorkstream\tResult\tFindings\n' >"$REPORT_PATH"

tracked_count=0
drift_count=0
ambiguous_count=0

while IFS= read -r item_json; do
  [ -n "$item_json" ] || continue
  is_repo_pr="$(jq -r --arg repo "$REPOSITORY" '.content.__typename == "PullRequest" and .content.repository.nameWithOwner == $repo' <<<"$item_json")"
  [ "$is_repo_pr" = "true" ] || continue

  tracked_count=$((tracked_count + 1))

  pr_number="$(jq -r '.content.number' <<<"$item_json")"
  native_state="$(jq -r '.content.state' <<<"$item_json")"
  merged="$(jq -r '.content.merged' <<<"$item_json")"
  draft="$(jq -r '.content.isDraft' <<<"$item_json")"
  review_requests="$(jq -r '.content.reviewRequests.totalCount // 0' <<<"$item_json")"
  archived="$(jq -r '.isArchived' <<<"$item_json")"
  status="$(jq -r '.statusValue.name // ""' <<<"$item_json")"
  workstream="$(jq -r '.workstreamValue.name // ""' <<<"$item_json")"

  expected_status=""
  expected_archived="false"
  expected_workstream=""
  result="OK"
  findings=()
  ambiguous="false"

  if is_duplicate_pr "$pr_number"; then
    findings+=("DUPLICATE_PROJECT_ITEM")
  fi

  # Product Owner ruling: no Pull Request Project Item may ever be archived.
  if [ "$archived" = "true" ]; then
    findings+=("PR_ITEM_ARCHIVED_PROHIBITED")
  fi

  if [ "$native_state" != "OPEN" ] || [ "$merged" = "true" ]; then
    expected_status="DONE"
    [ "$status" = "DONE" ] || findings+=("TERMINAL_STATUS_${status:-MISSING}_EXPECTED_DONE")
  else
    same_repo_issue_count="$(jq --arg repo "$REPOSITORY" '[.content.closingIssuesReferences.nodes[]? | select(.repository.nameWithOwner == $repo)] | length' <<<"$item_json")"
    operational_values="$(jq -r --arg repo "$REPOSITORY" --arg project "$project_id" '
      .content.closingIssuesReferences.nodes[]?
      | select(.repository.nameWithOwner == $repo)
      | [.projectItems.nodes[]? | select(.project.id == $project and .isArchived == false) | .workstreamValue.name // empty]
      | if length == 1 then .[0] else "" end
    ' <<<"$item_json")"
    operational_count="$(printf '%s\n' "$operational_values" | sed '/^$/d' | wc -l | tr -d ' ')"
    unique_operational="$(printf '%s\n' "$operational_values" | sed '/^$/d' | sort -u)"
    unique_count="$(printf '%s\n' "$unique_operational" | sed '/^$/d' | wc -l | tr -d ' ')"

    if [ "$same_repo_issue_count" -gt 0 ] && [ "$operational_count" -eq "$same_repo_issue_count" ] && [ "$unique_count" -eq 1 ]; then
      inherited="$(printf '%s\n' "$unique_operational" | head -n1)"
      case "$inherited" in
        "AI OS"|VIEPS) expected_workstream="$inherited" ;;
      esac
    fi

    if [ -n "$expected_workstream" ]; then
      [ "$workstream" = "$expected_workstream" ] || findings+=("WORKSTREAM_${workstream:-MISSING}_EXPECTED_${expected_workstream// /_}")

      if [ "$draft" = "true" ] || [ "$review_requests" -eq 0 ]; then
        expected_status="IMPLEMENTATION"
        [ "$status" = "IMPLEMENTATION" ] || findings+=("ACTIVE_STATUS_${status:-MISSING}_EXPECTED_IMPLEMENTATION")
      else
        # A synchronize event intentionally returns a PR to IMPLEMENTATION even while a
        # review request can remain outstanding. Both states are therefore valid from
        # a current-state-only audit when review requests are present.
        expected_status="IMPLEMENTATION|REVIEW"
        if [ "$status" != "IMPLEMENTATION" ] && [ "$status" != "REVIEW" ]; then
          findings+=("ACTIVE_STATUS_${status:-MISSING}_EXPECTED_IMPLEMENTATION_OR_REVIEW")
        elif [ "$status" = "IMPLEMENTATION" ]; then
          ambiguous="true"
        fi
      fi
    else
      # Workstream cannot be inferred safely. The audit must not recommend archiving
      # as a fail-closed substitute. It only verifies the universal no-archive rule
      # and rejects terminal DONE on an open PR.
      expected_status="UNRESOLVED_WORKSTREAM_NO_GUESS"
      [ "$status" != "DONE" ] || findings+=("OPEN_PR_REPRESENTED_AS_DONE")
      ambiguous="true"
    fi
  fi

  if [ "${#findings[@]}" -gt 0 ]; then
    result="DRIFT"
    drift_count=$((drift_count + 1))
  elif [ "$ambiguous" = "true" ]; then
    result="ALLOWED_AMBIGUOUS"
    ambiguous_count=$((ambiguous_count + 1))
  fi

  findings_text=""
  if [ "${#findings[@]}" -gt 0 ]; then
    findings_text="$(IFS=';'; echo "${findings[*]}")"
  elif [ "$ambiguous" = "true" ] && [ -z "$expected_workstream" ]; then
    findings_text="No deterministic Workstream; item must remain unarchived and audit does not guess active lifecycle ownership"
  elif [ "$ambiguous" = "true" ]; then
    findings_text="Outstanding review request with IMPLEMENTATION is allowed after synchronize/rework"
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$pr_number" "$native_state" "$merged" "$draft" "$review_requests" "$archived" \
    "$status" "$workstream" "$expected_status" "$expected_archived" "$expected_workstream" \
    "$result" "$findings_text" >>"$REPORT_PATH"
done <"$items_file"

echo "PR Project lifecycle audit: tracked=$tracked_count drift=$drift_count allowed_ambiguous=$ambiguous_count"
awk -F '\t' 'NR == 1 || $12 != "OK" { print }' "$REPORT_PATH"

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "## Pull Request Project lifecycle audit"
    echo
    echo "- Tracked PR Project Items: **$tracked_count**"
    echo "- Definite drift: **$drift_count**"
    echo "- Allowed current-state ambiguity: **$ambiguous_count**"
    echo
    echo "| PR | Native | Archived | Status | Workstream | Expected status | Expected archived | Expected Workstream | Result | Findings |"
    echo "|---:|---|---|---|---|---|---|---|---|---|"
    awk -F '\t' 'NR > 1 && $12 != "OK" {
      gsub(/\|/, "\\|", $13)
      printf "| #%s | %s | %s | %s | %s | %s | %s | %s | %s | %s |\n", $1,$2,$6,$7,$8,$9,$10,$11,$12,$13
    }' "$REPORT_PATH"
  } >>"$GITHUB_STEP_SUMMARY"
fi

case "$FAIL_ON_DRIFT" in
  true|TRUE|1|yes|YES)
    [ "$drift_count" -eq 0 ] || exit 1
    ;;
esac
