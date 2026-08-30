#!/usr/bin/env bash
set -uo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
PROJECT_TITLE="${PROJECT_TITLE:-Jagports AI OS}"

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh is not authenticated." >&2
  exit 1
fi

find_project_number() {
  gh project list --owner "$PROJECT_OWNER" --format json --limit 100 --jq ".[] | select(.title == \"$PROJECT_TITLE\") | .number" 2>/dev/null | head -n 1
}

PROJECT_NUMBER=$(find_project_number)

if [ -z "$PROJECT_NUMBER" ]; then
  echo "Creating Project: $PROJECT_TITLE"
  CREATE_OUTPUT=$(gh project create --owner "$PROJECT_OWNER" --title "$PROJECT_TITLE") || {
    echo "ERROR: Project creation failed." >&2
    exit 1
  }
  echo "$CREATE_OUTPUT"
  PROJECT_NUMBER=$(printf '%s\n' "$CREATE_OUTPUT" | sed -n 's#^.*/projects/\([0-9][0-9]*\).*$#\1#p' | head -n 1)
  if [ -z "$PROJECT_NUMBER" ]; then
    PROJECT_NUMBER=$(find_project_number)
  fi
fi

if [ -z "$PROJECT_NUMBER" ]; then
  echo "ERROR: Could not resolve Project number." >&2
  exit 1
fi

echo "Repository: $REPO"
echo "Project owner: $PROJECT_OWNER"
echo "Project: $PROJECT_TITLE"
echo "Project number: $PROJECT_NUMBER"

gh project link "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --repo "$REPO" >/dev/null 2>&1 || true
echo "Project URL: https://github.com/orgs/$PROJECT_OWNER/projects/$PROJECT_NUMBER"
echo "Next: run import_jagports_p1.sh"
