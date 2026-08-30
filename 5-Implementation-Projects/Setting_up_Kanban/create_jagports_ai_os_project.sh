#!/usr/bin/env bash
set -uo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
PROJECT_TITLE="${PROJECT_TITLE:-Jagports AI OS}"

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh is not authenticated." >&2
  exit 1
fi

PROJECT_URL=$(gh project list --owner "$PROJECT_OWNER" --format json --limit 100 2>/dev/null | python -c "import json,sys; d=json.load(sys.stdin); [print(p['url']) for p in d if isinstance(p,dict) and p.get('title')=='$PROJECT_TITLE']" | head -n 1)

if [ -n "$PROJECT_URL" ]; then
  PROJECT_NUMBER=$(printf '%s\n' "$PROJECT_URL" | sed 's:/*$::' | sed 's:.*/::')
  echo "Project already exists: $PROJECT_TITLE"
else
  echo "Creating Project: $PROJECT_TITLE"
  CREATE_OUTPUT=$(gh project create --owner "$PROJECT_OWNER" --title "$PROJECT_TITLE" 2>&1)
  CREATE_RC=$?
  printf '%s\n' "$CREATE_OUTPUT"
  if [ "$CREATE_RC" -ne 0 ]; then
    echo "ERROR: Project creation failed." >&2
    exit "$CREATE_RC"
  fi
  PROJECT_NUMBER=$(printf '%s\n' "$CREATE_OUTPUT" | sed -n 's:.*/projects/\([0-9][0-9]*\).*:\1:p' | tail -n 1)
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
