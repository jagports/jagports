#!/usr/bin/env bash

# Jagports AI OS
# make_jagports_subissues.sh
# Windows Git Bash compatible.
# Creates GitHub sub-issue relationships from priority titles.
# Processes open and closed issues. Safe to run repeatedly.

set -o pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"

MAX_RETRIES=5
RETRY_DELAY=2

log() {
printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
log "ERROR: $*"
exit 1
}

if ! command -v gh >/dev/null 2>&1; then
fail "GitHub CLI (gh) is not installed."
fi

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
fail "GitHub CLI is not authenticated."
fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
fail "Cannot access repository: $REPO"
fi

log "Repository: $REPO"

ISSUES_FILE="$(mktemp)"
trap 'rm -f "$ISSUES_FILE"' EXIT

log "Reading GitHub issues..."
if ! gh issue list --repo "$REPO" --state all --limit 1000 --json number,title --jq '.[] | [.number,.title] | @tsv' > "$ISSUES_FILE"; then
fail "Unable to retrieve GitHub issues."
fi

if ! test -s "$ISSUES_FILE"; then
fail "GitHub returned no issues."
fi

ISSUE_COUNT=$(wc -l < "$ISSUES_FILE" | tr -d ' ')
log "Found $ISSUE_COUNT issues."

CHECKED=0
ADDED=0
EXISTING=0
FAILED=0

while IFS="$(printf '\t')" read -r CHILD_ISSUE TITLE; do
PRIORITY="${TITLE#\[}"
PRIORITY="${PRIORITY%%\]*}"

case "$PRIORITY" in
    P[0-9]*.*)
        ;;
    *)
        continue
        ;;
esac

PARENT_PRIORITY="${PRIORITY%.*}"
PARENT_ISSUE=$(gh issue list --repo "$REPO" --state all --limit 1000 --json number,title --jq ".[] | select(.title | startswith(\"[$PARENT_PRIORITY]\")) | .number" | head -1)

if test -z "$PARENT_ISSUE"; then
    log "FAILED: no parent found for [$PRIORITY] #$CHILD_ISSUE"
    FAILED=$((FAILED + 1))
    continue
fi

CHECKED=$((CHECKED + 1))
log "CHECK [$PARENT_PRIORITY] #$PARENT_ISSUE <- [$PRIORITY] #$CHILD_ISSUE"

SUBISSUES=$(gh api "repos/$REPO/issues/$PARENT_ISSUE/sub_issues?per_page=100" --jq '.[].number' 2>/dev/null)

if printf '%s\n' "$SUBISSUES" | grep -Fxq "$CHILD_ISSUE"; then
    log "EXISTS [$PARENT_PRIORITY] #$PARENT_ISSUE <- [$PRIORITY] #$CHILD_ISSUE"
    EXISTING=$((EXISTING + 1))
    continue
fi

CHILD_ID=$(gh api "repos/$REPO/issues/$CHILD_ISSUE" --jq '.id' 2>/dev/null)

if ! test "$CHILD_ID" -gt 0 2>/dev/null; then
    log "FAILED: cannot obtain GitHub ID for #$CHILD_ISSUE"
    FAILED=$((FAILED + 1))
    continue
fi

log "Moving #$CHILD_ISSUE (id $CHILD_ID) under #$PARENT_ISSUE"

SUCCESS=0
ATTEMPT=1
while test "$ATTEMPT" -le "$MAX_RETRIES"; do
    if gh api --method POST "repos/$REPO/issues/$PARENT_ISSUE/sub_issues" -H "Accept: application/vnd.github+json" -F sub_issue_id="$CHILD_ID" >/dev/null 2>&1; then
        SUCCESS=1
        break
    fi

    if test "$ATTEMPT" -lt "$MAX_RETRIES"; then
        log "Retry $ATTEMPT/$MAX_RETRIES for #$CHILD_ISSUE in ${RETRY_DELAY}s"
        sleep "$RETRY_DELAY"
    fi

    ATTEMPT=$((ATTEMPT + 1))
done

if test "$SUCCESS" -eq 1; then
    log "OK [$PARENT_PRIORITY] #$PARENT_ISSUE <- [$PRIORITY] #$CHILD_ISSUE"
    ADDED=$((ADDED + 1))
else
    log "FAILED [$PARENT_PRIORITY] #$PARENT_ISSUE <- [$PRIORITY] #$CHILD_ISSUE"
    FAILED=$((FAILED + 1))
fi
done < "$ISSUES_FILE"

log "------------------------------------------------------------"
log "Final verification..."
VERIFY_FAILED=0

while IFS="$(printf '\t')" read -r CHILD_ISSUE TITLE; do
PRIORITY="${TITLE#\[}"
PRIORITY="${PRIORITY%%\]*}"

case "$PRIORITY" in
    P[0-9]*.*)
        ;;
    *)
        continue
        ;;
esac

PARENT_PRIORITY="${PRIORITY%.*}"
PARENT_ISSUE=$(gh issue list --repo "$REPO" --state all --limit 1000 --json number,title --jq ".[] | select(.title | startswith(\"[$PARENT_PRIORITY]\")) | .number" | head -1)

if test -z "$PARENT_ISSUE"; then
    log "VERIFY FAILED: no parent for #$CHILD_ISSUE"
    VERIFY_FAILED=$((VERIFY_FAILED + 1))
    continue
fi

SUBISSUES=$(gh api "repos/$REPO/issues/$PARENT_ISSUE/sub_issues?per_page=100" --jq '.[].number' 2>/dev/null)

if printf '%s\n' "$SUBISSUES" | grep -Fxq "$CHILD_ISSUE"; then
    log "VERIFY OK [$PARENT_PRIORITY] #$PARENT_ISSUE <- [$PRIORITY] #$CHILD_ISSUE"
else
    log "VERIFY FAILED [$PARENT_PRIORITY] #$PARENT_ISSUE <- [$PRIORITY] #$CHILD_ISSUE"
    VERIFY_FAILED=$((VERIFY_FAILED + 1))
fi
done < "$ISSUES_FILE"

log "------------------------------------------------------------"
log "FINAL SUMMARY"
log "  Issues found          : $ISSUE_COUNT"
log "  Relationships checked : $CHECKED"
log "  Relationships added   : $ADDED"
log "  Already existed       : $EXISTING"
log "  Operation failures    : $FAILED"
log "  Verification failures : $VERIFY_FAILED"

if test "$FAILED" -gt 0 || test "$VERIFY_FAILED" -gt 0; then
log "RESULT: FAILED"
exit 1
fi

log "RESULT: SUCCESS"
exit 0