#!/usr/bin/env bash

set -euo pipefail

PROJECT_OWNER="${PROJECT_OWNER:-jagports}"
PROJECT_NUMBER="${PROJECT_NUMBER:-9}"
API_VERSION="${API_VERSION:-2026-03-10}"
PROJECT_URL="https://github.com/orgs/${PROJECT_OWNER}/projects/${PROJECT_NUMBER}"
TMP_DIR=".project-view-setup.$$"

cleanup() {
    rm -rf "$TMP_DIR"
}

trap cleanup EXIT
mkdir "$TMP_DIR"

echo "Jagports Project view setup"
echo "Project: $PROJECT_URL"

if ! command -v gh >/dev/null 2>&1; then
    echo "ERROR: GitHub CLI 'gh' is required."
    exit 1
fi

if ! command -v python >/dev/null 2>&1; then
    echo "ERROR: Python is required for JSON handling."
    exit 1
fi

gh auth status >/dev/null
gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json >/dev/null

# Keep REST endpoints relative. Git Bash/MSYS rewrites a leading /orgs/... argument
# into a Windows filesystem path before gh receives it.
gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: $API_VERSION" "orgs/$PROJECT_OWNER/projectsV2/$PROJECT_NUMBER/fields" > "$TMP_DIR/fields.json"

RANK_FIELD_ID="$(python - "$TMP_DIR/fields.json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    fields = json.load(handle)

matches = [field for field in fields if field.get("name") == "Rank"]
if len(matches) != 1:
    raise SystemExit("Expected exactly one Project field named 'Rank'.")

field = matches[0]
if field.get("data_type") != "number":
    raise SystemExit("Project field 'Rank' must be a number field.")

print(field["id"])
PY
)"

read_views() {
    gh api graphql -f query='query($organization:String!,$number:Int!){organization(login:$organization){projectV2(number:$number){views(first:50){nodes{id number name filter layout sortByFields(first:10){nodes{direction field{... on ProjectV2Field{name} ... on ProjectV2IterationField{name} ... on ProjectV2MultiSelectField{name} ... on ProjectV2SingleSelectField{name}}}}}}}}}}' -f organization="$PROJECT_OWNER" -F number="$PROJECT_NUMBER" > "$TMP_DIR/views.json"
}

read_views

BASE_LAYOUT="$(python - "$TMP_DIR/views.json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

project = data.get("data", {}).get("organization", {}).get("projectV2")
if not project:
    raise SystemExit("Project could not be read through GraphQL.")

views = project.get("views", {}).get("nodes", [])
if not views:
    raise SystemExit("No existing Project view was found to inherit its layout.")

layout = views[0].get("layout")
layouts = {
    "TABLE_LAYOUT": "table",
    "BOARD_LAYOUT": "board",
    "ROADMAP_LAYOUT": "roadmap",
}
if layout not in layouts:
    raise SystemExit(f"Unsupported existing Project view layout: {layout}")

print(layouts[layout])
PY
)"

check_view() {
    local name="$1"
    local expected_filter="$2"

    python - "$TMP_DIR/views.json" "$name" "$expected_filter" <<'PY'
import json
import sys

path, name, expected_filter = sys.argv[1:]
with open(path, encoding="utf-8") as handle:
    data = json.load(handle)

views = data["data"]["organization"]["projectV2"]["views"]["nodes"]
matches = [view for view in views if view.get("name") == name]

if not matches:
    print("ABSENT")
    raise SystemExit(0)

if len(matches) != 1:
    print("DUPLICATE")
    raise SystemExit(0)

view = matches[0]
filter_ok = view.get("filter") == expected_filter
sort_nodes = view.get("sortByFields", {}).get("nodes", []) or []
sort_ok = any(node.get("direction") == "ASC" and (node.get("field") or {}).get("name") == "Rank" for node in sort_nodes)

if filter_ok and sort_ok:
    print("OK")
else:
    print("MISMATCH")
PY
}

create_view() {
    local name="$1"
    local filter="$2"

    python - "$TMP_DIR/payload.json" "$name" "$filter" "$BASE_LAYOUT" "$RANK_FIELD_ID" <<'PY'
import json
import sys

path, name, view_filter, layout, rank_field_id = sys.argv[1:]
payload = {
    "name": name,
    "layout": layout,
    "filter": view_filter,
    "sort_by": [[int(rank_field_id), "asc"]],
}
with open(path, "w", encoding="utf-8") as handle:
    json.dump(payload, handle)
PY

    echo "Creating view: $name"
    # Same Git Bash/MSYS rule as above: no leading slash in gh api endpoint.
    gh api --method POST -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: $API_VERSION" "orgs/$PROJECT_OWNER/projectsV2/$PROJECT_NUMBER/views" --input "$TMP_DIR/payload.json" > "$TMP_DIR/create-response.json"
}

ensure_view() {
    local name="$1"
    local filter="$2"
    local state

    read_views
    state="$(check_view "$name" "$filter")"

    case "$state" in
        OK)
            echo "Verified existing view: $name"
            ;;
        ABSENT)
            create_view "$name" "$filter"
            read_views
            state="$(check_view "$name" "$filter")"
            if [ "$state" != "OK" ]; then
                echo "ERROR: View '$name' was created but independent verification returned: $state"
                exit 1
            fi
            echo "Created and independently verified view: $name"
            ;;
        MISMATCH)
            echo "ERROR: Existing view '$name' does not have the required Workstream filter and Rank ascending sort."
            echo "No destructive replacement or automatic overwrite is performed."
            exit 1
            ;;
        DUPLICATE)
            echo "ERROR: More than one Project view is named '$name'. Resolve the duplicate before rerunning."
            exit 1
            ;;
        *)
            echo "ERROR: Unexpected verification result for '$name': $state"
            exit 1
            ;;
    esac
}

ensure_view "AI OS" 'Workstream:"AI OS"'
ensure_view "VIEPS" 'Workstream:"VIEPS"'

echo
echo "Project view setup PASS"
echo "AI OS: Workstream=AI OS, Rank ascending"
echo "VIEPS: Workstream=VIEPS, Rank ascending"
echo "No Intake view was created."
echo "Open for visual confirmation: $PROJECT_URL"
