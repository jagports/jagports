#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="PVT_kwDOEz190s4Bh6vc"

PROJECT_INFO=$(gh api graphql -f query='
query($id: ID!) {
  node(id: $id) {
    ... on ProjectV2 {
      number
      owner { ... on User { login } ... on Organization { login } }
    }
  }
}' -f id="$PROJECT_ID")

PROJECT_NUMBER=$(echo "$PROJECT_INFO" | python -c "import json,sys;print(json.load(sys.stdin)['data']['node']['number'])")
PROJECT_OWNER=$(echo "$PROJECT_INFO" | python -c "import json,sys;print(json.load(sys.stdin)['data']['node']['owner']['login'])")

echo "Project #$PROJECT_NUMBER, owner $PROJECT_OWNER"
echo ""

gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --limit 200 --format json | python -c "
import json,sys
d=json.load(sys.stdin)
for i in d['items']:
    title = i['content'].get('title','')
    if title.startswith('[P1]') or title.startswith('[P1.'):
        print(f\"item_id={i['id']}  status={i.get('status','NO_STATUS')}  priority={i.get('priority','-')}  url={i['content'].get('url','')}  title={title}\")
"
