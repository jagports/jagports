#!/usr/bin/env bash
# create_ai_os_epic.sh
set -euo pipefail

REPO="jagports/jagports"
PROJECT_ID="PVT_kwDOEz190s4Bh6vc"
API_DELAY=1.5

echo "=== Resolving project number/owner ==="
PROJECT_INFO=$(gh api graphql -f query='
query($id: ID!) {
  node(id: $id) {
    ... on ProjectV2 {
      number
      owner { ... on User { login } ... on Organization { login } }
    }
  }
}' -f id="$PROJECT_ID")

