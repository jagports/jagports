#!/usr/bin/env bash

# Jagports AI OS

# Convert PN.n issues into sub-issues of PN.

#

# Expected issue titles:

# [P2] Open agent accounts/access to Kanban

# [P2.1] Define agent identities

# [P2.2] Validate leader R/W rights

#

# The script discovers issue numbers from GitHub issue titles.

# It does NOT depend on issue numbers being sequential.

#

# Requirements:

# gh

# jq

#

# Usage:

# ./make_jagports_subissues.sh

#

# Optional:

# REPO=tlindi/jagports ./make_jagports_subissues.sh

#

# Safety:

# - Existing parent/sub-issue relationships are detected and skipped.

# - Every GitHub operation has a timeout.

# - Secondary/API rate limits cause retry with exponential backoff.

# - No fixed delay is used between successful operations.

# - The script stops after repeated failures instead of hammering GitHub.

set -u
set -o pipefail

REPO="${REPO:-tlindi/jagports}"

# Maximum seconds allowed for one gh/API operation.

COMMAND_TIMEOUT="${COMMAND_TIMEOUT:-30}"

# Maximum number of retries after a rate-limit/transient failure.

MAX_RETRIES="${MAX_RETRIES:-5}"

# Initial retry delay. Only used after a failure.

INITIAL_BACKOFF="${INITIAL_BACKOFF:-2}"

# Number of issues requested from GitHub per page.

PER_PAGE=100

TMP_DIR="$(mktemp -d)"

cleanup() {
rm -rf "$TMP_DIR"
}
trap cleanup EXIT

log() {
printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
printf '[%s] ERROR: %s\n' "$(date '+%H:%M:%S')" "$*" >&2
exit 1
}

# ----------------------------------------------------------------------

# Dependency checks

# ----------------------------------------------------------------------

command -v gh >/dev/null 2>&1 || fail "gh is not installed."
command -v jq >/dev/null 2>&1 || fail "jq is not installed."
command -v timeout >/dev/null 2>&1 || fail "timeout command is not available."

gh auth status >/dev/null 2>&1 || fail "GitHub CLI is not authenticated."

# Verify repository exists and is accessible.

if ! timeout "$COMMAND_TIMEOUT" gh repo view "$REPO" >/dev/null 2>&1; then
fail "Cannot access repository: $REPO"
fi

log "Repository: $REPO"

# ----------------------------------------------------------------------

# GitHub API helper

# ----------------------------------------------------------------------

gh_api_with_retry() {
local method="$1"
local endpoint="$2"
local payload="${3:-}"

```
local attempt=1
local backoff="$INITIAL_BACKOFF"
local output
local rc

while (( attempt <= MAX_RETRIES )); do

    if [[ -n "$payload" ]]; then
        output="$(
            timeout "$COMMAND_TIMEOUT" \
            gh api \
                --method "$method" \
                "$endpoint" \
                --input - \
            <<< "$payload" \
            2>&1
        )"
    else
        output="$(
            timeout "$COMMAND_TIMEOUT" \
            gh api \
                --method "$method" \
                "$endpoint" \
            2>&1
        )"
    fi

    rc=$?

    if (( rc == 0 )); then
        printf '%s\n' "$output"
        return 0
    fi

    # Timeout.
    if (( rc == 124 )); then
        log "Timeout on $method $endpoint (attempt $attempt/$MAX_RETRIES)"
    else
        log "GitHub/API failure on $method $endpoint (attempt $attempt/$MAX_RETRIES)"
        log "$output"
    fi

    # Check current rate limit before deciding whether to retry.
    local remaining reset_epoch now wait

    remaining="$(
        timeout "$COMMAND_TIMEOUT" \
        gh api rate_limit \
        --jq '.resources.core.remaining' \
        2>/dev/null || printf 'unknown'
    )"

    reset_epoch="$(
        timeout "$COMMAND_TIMEOUT" \
        gh api rate_limit \
        --jq '.resources.core.reset' \
        2>/dev/null || printf '0'
    )"

    now="$(date +%s)"

    if [[ "$remaining" =~ ^[0-9]+$ ]] && (( remaining <= 1 )); then
        if [[ "$reset_epoch" =~ ^[0-9]+$ ]] && (( reset_epoch > now )); then
            wait=$((reset_epoch - now + 1))
            log "Core API rate limit nearly exhausted; waiting ${wait}s for reset."
            sleep "$wait"
        fi
    else
        # Only delay after an actual failure.
        log "Retrying in ${backoff}s."
        sleep "$backoff"

        backoff=$((backoff * 2))

        if (( backoff > 60 )); then
            backoff=60
        fi
    fi

    ((attempt++))
done

return 1
```

}

# ----------------------------------------------------------------------

# Load all issues

# ----------------------------------------------------------------------

ISSUES_FILE="$TMP_DIR/issues.json"

log "Loading repository issues..."

if ! timeout "$COMMAND_TIMEOUT" 
gh issue list 
--repo "$REPO" 
--state all 
--limit 1000 
--json number,title,state 
> "$ISSUES_FILE"
then
fail "Unable to retrieve repository issues."
fi

ISSUE_COUNT="$(jq 'length' "$ISSUES_FILE")"

log "Found $ISSUE_COUNT issues."

# ----------------------------------------------------------------------

# Build priority -> issue-number mapping

# ----------------------------------------------------------------------

# We deliberately match the priority prefix anywhere at the beginning

# of the issue title:

#

# [P2] ...

# P2 ...

#

# Both are accepted.

declare -A ISSUE_BY_PRIORITY

while IFS=$'\t' read -r number title; do

```
priority="$(
    printf '%s\n' "$title" |
    sed -nE 's/^[[:space:]]*\[?(P[0-9]+(\.[0-9]+)*)\]?([[:space:]]|$).*/\1/p'
)"

if [[ -z "$priority" ]]; then
    continue
fi

if [[ -n "${ISSUE_BY_PRIORITY[$priority]:-}" ]]; then
    fail "Duplicate priority '$priority': issues ${ISSUE_BY_PRIORITY[$priority]} and #$number"
fi

ISSUE_BY_PRIORITY["$priority"]="$number"
```

done < <(
jq -r '.[] | [.number, .title] | @tsv' "$ISSUES_FILE"
)

# ----------------------------------------------------------------------

# Validate that all parent/child pairs exist.

# ----------------------------------------------------------------------

log "Validating priority hierarchy..."

missing=0

for priority in "${!ISSUE_BY_PRIORITY[@]}"; do

```
# Only direct children such as P2.1, P2.2, P10.3.
if [[ "$priority" =~ ^(P[0-9]+)\.([0-9]+)$ ]]; then

    parent="${BASH_REMATCH[1]}"

    if [[ -z "${ISSUE_BY_PRIORITY[$parent]:-}" ]]; then
        log "ERROR: $priority exists but parent $parent was not found."
        missing=1
    fi
fi
```

done

if (( missing != 0 )); then
fail "Hierarchy validation failed."
fi

# ----------------------------------------------------------------------

# Process parents in numerical order.

# ----------------------------------------------------------------------

PARENTS=()

while IFS= read -r priority; do
PARENTS+=("$priority")
done < <(
printf '%s\n' "${!ISSUE_BY_PRIORITY[@]}" |
grep -E '^P[0-9]+$' |
sort -V
)

if (( ${#PARENTS[@]} == 0 )); then
fail "No PN parent issues found."
fi

log "Parents to process: ${#PARENTS[@]}"

# ----------------------------------------------------------------------

# Process each parent.

# ----------------------------------------------------------------------

TOTAL=0
ADDED=0
SKIPPED=0
FAILED=0

for parent_priority in "${PARENTS[@]}"; do

```
parent_number="${ISSUE_BY_PRIORITY[$parent_priority]}"

log "------------------------------------------------------------"
log "Parent $parent_priority -> issue #$parent_number"

children=()

while IFS= read -r child_priority; do
    children+=("$child_priority")
done < <(
    printf '%s\n' "${!ISSUE_BY_PRIORITY[@]}" |
    grep -E "^${parent_priority//./\\.}\.[0-9]+$" |
    sort -V
)

if (( ${#children[@]} == 0 )); then
    log "No direct sub-issues for $parent_priority."
    continue
fi

log "Children: ${children[*]}"

# Get current sub-issues once per parent.
SUBISSUES_FILE="$TMP_DIR/subissues_${parent_number}.json"

if ! gh_api_with_retry \
    GET \
    "/repos/${REPO}/issues/${parent_number}/sub_issues?per_page=${PER_PAGE}" \
    > "$SUBISSUES_FILE"
then
    log "ERROR: Could not inspect existing sub-issues for $parent_priority."
    FAILED=$((FAILED + ${#children[@]}))
    continue
fi

for child_priority in "${children[@]}"; do

    TOTAL=$((TOTAL + 1))

    child_number="${ISSUE_BY_PRIORITY[$child_priority]}"

    # Check whether this child is already attached.
    already_child="$(
        jq -r --argjson n "$child_number" \
            'any(.[]; .number == $n)' \
            "$SUBISSUES_FILE"
    )"

    if [[ "$already_child" == "true" ]]; then
        log "SKIP $child_priority (#$child_number) already belongs to $parent_priority."
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    log "ADD  $child_priority (#$child_number) -> $parent_priority (#$parent_number)"

    payload="$(jq -n --argjson id "$(jq -r --argjson n "$child_number" '.[] | select(.number == $n) | .id' "$ISSUES_FILE")" \
        '{sub_issue_id: $id}')"

    # The REST endpoint requires the child's numeric issue ID,
    # not merely its issue number.
    if ! gh_api_with_retry \
        POST \
        "/repos/${REPO}/issues/${parent_number}/sub_issues" \
        "$payload" \
        > /dev/null
    then
        log "ERROR: Failed to add $child_priority (#$child_number) to $parent_priority (#$parent_number)."
        FAILED=$((FAILED + 1))
        continue
    fi

    ADDED=$((ADDED + 1))

    # Update local cache so repeated processing cannot duplicate
    # a child within this execution.
    jq \
        --argjson n "$child_number" \
        --argjson id "$(jq -r --argjson n "$child_number" '.[] | select(.number == $n) | .id' "$ISSUES_FILE")" \
        '. + [{"number": $n, "id": $id}]' \
        "$SUBISSUES_FILE" > "${SUBISSUES_FILE}.tmp"

    mv "${SUBISSUES_FILE}.tmp" "$SUBISSUES_FILE"

done
```

done

# ----------------------------------------------------------------------

# Final verification

# ----------------------------------------------------------------------

log "------------------------------------------------------------"
log "Final verification..."

VERIFY_FAILED=0

for parent_priority in "${PARENTS[@]}"; do

```
parent_number="${ISSUE_BY_PRIORITY[$parent_priority]}"

children=()

while IFS= read -r child_priority; do
    children+=("$child_priority")
done < <(
    printf '%s\n' "${!ISSUE_BY_PRIORITY[@]}" |
    grep -E "^${parent_priority//./\\.}\.[0-9]+$" |
    sort -V
)

(( ${#children[@]} == 0 )) && continue

verify_json="$TMP_DIR/verify_${parent_number}.json"

if ! gh_api_with_retry \
    GET \
    "/repos/${REPO}/issues/${parent_number}/sub_issues?per_page=${PER_PAGE}" \
    > "$verify_json"
then
    log "VERIFY ERROR: Cannot read $parent_priority (#$parent_number)."
    VERIFY_FAILED=1
    continue
fi

for child_priority in "${children[@]}"; do

    child_number="${ISSUE_BY_PRIORITY[$child_priority]}"

    found="$(
        jq -r --argjson n "$child_number" \
            'any(.[]; .number == $n)' \
            "$verify_json"
    )"

    if [[ "$found" == "true" ]]; then
        log "OK     $parent_priority -> $child_priority"
    else
        log "FAILED $parent_priority -> $child_priority"
        VERIFY_FAILED=1
    fi

done
```

done

log "------------------------------------------------------------"
log "Summary"
log "  Relationships checked : $TOTAL"
log "  Relationships added   : $ADDED"
log "  Already existed       : $SKIPPED"
log "  Add failures          : $FAILED"
log "  Verification failures : $VERIFY_FAILED"

if (( FAILED != 0 || VERIFY_FAILED != 0 )); then
log "RESULT: FAILED"
exit 1
fi

log "RESULT: SUCCESS"
exit 0
