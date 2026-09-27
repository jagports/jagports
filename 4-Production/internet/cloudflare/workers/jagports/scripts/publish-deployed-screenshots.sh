#!/usr/bin/env bash
# Publish verified real deployed-main screenshots. No Cloudflare writes or Admin secrets.
set -euo pipefail
: "$GITHUB_REPOSITORY" "$GITHUB_RUN_ID" "$GITHUB_RUN_ATTEMPT" "$VIEPS_MAIN_SHA" "$GH_TOKEN"
images="browser-evidence/deployed-main"
test -s "$images/manifest.json"
for file in desktop.png tablet.png mobile-320.png; do test -s "$images/$file"; done
dest="deployed-main/$VIEPS_MAIN_SHA/$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
stage="$(mktemp -d)"
trap 'git worktree remove --force "$stage" >/dev/null 2>&1 || true' EXIT
workbranch="evidence-run-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"

if git ls-remote --exit-code --heads origin evidence/deployed-main >/dev/null; then
  git fetch origin '+refs/heads/evidence/deployed-main:refs/remotes/origin/evidence/deployed-main'
  git worktree add -b "$workbranch" "$stage" origin/evidence/deployed-main
else
  git worktree add --detach "$stage" HEAD
  git -C "$stage" checkout --orphan "$workbranch"
  git -C "$stage" rm -rf . >/dev/null
fi
mkdir -p "$stage/$dest"
cp "$images/"*.png "$images/manifest.json" "$stage/$dest/"
git -C "$stage" config user.name "github-actions[bot]"
git -C "$stage" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$stage" add "$dest"
git -C "$stage" commit -m "evidence(#895): deployed-main screenshots $VIEPS_MAIN_SHA run $GITHUB_RUN_ID"
git -C "$stage" push origin HEAD:refs/heads/evidence/deployed-main
evidence_sha="$(git -C "$stage" rev-parse HEAD)"
base="https://raw.githubusercontent.com/$GITHUB_REPOSITORY/$evidence_sha/$dest"

# A direct, browser-viewable RAW PNG is required. A zipped Actions artifact is not enough.
for name in desktop tablet mobile-320; do
  ok=0
  for attempt in $(seq 1 12); do
    if curl --fail --silent --show-error -L --max-time 20 \
       "$base/$name.png" -o "$stage/check-$name.png" \
       && cmp -s "$stage/check-$name.png" "$images/$name.png"; then
      ok=1
      break
    fi
    sleep 5
  done
  if [ "$ok" -ne 1 ]; then
    echo "::error::Direct browser-viewable $name.png failed byte-for-byte verification"
    exit 1
  fi
done
{
  echo "evidence_sha=$evidence_sha"
  echo "images_base=$base"
} >> "$GITHUB_OUTPUT"

# Post the immutable PNG links automatically only while #895 still needs evidence.
issue_state="$(gh api "repos/$GITHUB_REPOSITORY/issues/895" --jq '.state')"
if [ "$issue_state" != "open" ]; then
  echo "Issue #895 no longer open; images remain available at $base"
  exit 0
fi
run_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
original_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/pull/939#issuecomment-5825331607"
comment="$stage/comment.md"
cat > "$comment" <<EOF
## Post-merge #895: real deployed-main browser screenshots

[Evidence linked to the original #939 review hand-off]($original_url).
[Successful GitHub Actions run]($run_url) · main source revision $VIEPS_MAIN_SHA · immutable evidence commit $evidence_sha.

**Desktop · 1366 × 900**
![Deployed main VIEPS desktop]($base/desktop.png)

**Tablet · 900 × 800**
![Deployed main VIEPS tablet]($base/tablet.png)

**Mobile · 320 × 780**
![Deployed main VIEPS mobile]($base/mobile-320.png)

[Evidence manifest]($base/manifest.json)

These images were captured from the real https://vieps.parts-5ec.workers.dev/ by GitHub-hosted Chromium. Tests checked upper Suitability placement, removal of the lower duplicate panel, right-hand Applicable Models evidence, and no whole-page horizontal overflow. Deployed static app.js matched the tested main source hash; the public Suitability API intentionally remained unavailable because fixture data must not be published on the shared Worker. This test does not verify the remote D1 migration ledger or claim working JEPC-backed public checkbox interactions.
EOF

# GITHUB_TOKEN may be unable to edit the original jagports-fi-authored review comment.
# In that case publish a linked new PR comment rather than concealing the permission failure.
old_comment="$(gh api "repos/$GITHUB_REPOSITORY/issues/comments/5825331607" --jq '.body')"
if [[ "$old_comment" != *"## Post-merge #895: real deployed-main browser screenshots"* ]]; then
  {
    printf '%s\n\n---\n\n' "$old_comment"
    cat "$comment"
  } > "$stage/updated-comment.md"
  node -e 'const fs=require("node:fs");fs.writeFileSync(process.argv[2],JSON.stringify({body:fs.readFileSync(process.argv[1],"utf8")}))' \
    "$stage/updated-comment.md" "$stage/updated-comment.json"
  if gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/5825331607" \
    --input "$stage/updated-comment.json" >/dev/null 2>"$stage/update-error.log"; then
    echo "Added direct PNG links to the existing #939 review comment."
  else
    echo "GitHub Actions cannot edit author's review comment; posting a linked PR Conversation comment."
    gh api -X POST "repos/$GITHUB_REPOSITORY/issues/939/comments" \
      -f "body=$(cat "$comment")" --jq '.html_url'
  fi
else
  echo "Existing #939 review comment already contains deployed screenshot links."
fi

gh api -X POST "repos/$GITHUB_REPOSITORY/issues/895/comments" \
  -f "body=Automated deployed-main screenshot test passed. Direct PNG evidence is on PR #939: [desktop]($base/desktop.png), [tablet]($base/tablet.png), [mobile]($base/mobile-320.png). GitHub Actions: $run_url. Source app.js matched main $VIEPS_MAIN_SHA; the fixture-only public suitability API remained intentionally unavailable." \
  --jq '.html_url'
echo "Published and verified direct PNG links: $base"
