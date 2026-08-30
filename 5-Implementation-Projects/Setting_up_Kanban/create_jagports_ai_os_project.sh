#!/usr/bin/env bash
set -uo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}"
PROJECT_OWNER="${PROJECT_OWNER:-${REPO%%/*}}"
PROJECT_TITLE="${PROJECT_TITLE:-Jagports AI OS}"

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh is not authenticated." >&2
  exit 1
fi

if ! gh project list --owner "$PROJECT_OWNER" --format json --limit 100 >/tmp/jagports-projects.json 2>/tmp/jagports-projects.err; then
  echo "ERROR: Cannot access GitHub Projects for $PROJECT_OWNER." >&2
  cat /tmp/jagports-projects.err >&2
  exit 1
fi

PROJECT_NUMBER=$(python -c "import json,sys; d=json.load(open('/tmp/jagports-projects.json')); [print(p['number']) for p in d if p.get('title')=='$PROJECT_TITLE']" | head -n 1)

if [ -z "$PROJECT_NUMBER" ]; then
  echo "Creating Project: $PROJECT_TITLE"
  if ! gh project create --owner "$PROJECT_OWNER" --title "$PROJECT_TITLE"; then
    echo "ERROR: Project creation failed." >&2
    exit 1
  fi
  PROJECT_NUMBER=$(gh project list --owner "$PROJECT_OWNER" --format json --limit 100 | python -c "import json,sys; d=json.load(sys.stdin); [print(p['number']) for p in d if p.get('title')=='$PROJECT_TITLE']" | head -n 1)
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

echo "Project URL: https://github.com/users/$PROJECT_OWNER/projects/$PROJECT_NUMBER"

echo "Next: run import_jagports_p1.sh"
