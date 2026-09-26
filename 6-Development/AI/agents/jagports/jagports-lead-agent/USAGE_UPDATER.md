# Lead Agent checkout and manual updates

## One-time checkout installation

The existing copied `/home/codex/jagports-lead-agent` installation needs one migration after the reviewed PRs merge. Run as `codex`, without sudo. Keep the old directory as a private backup and inspect the selected `main` commit before restarting the agent timer.

```bash
set -euo pipefail
test "$(id -un)" = codex
APP=/home/codex/jagports-lead-agent
REPO=/home/codex/jagports-source
PRIVATE=/home/codex/jagports-agent-private
SUB=6-Development/AI/agents/jagports/jagports-lead-agent
BACKUP="/home/codex/jagports-lead-agent.before-git.$(date +%Y%m%d%H%M%S)"
test -d "$APP" && test ! -L "$APP" && test ! -e "$REPO" && test ! -e "$PRIVATE"
test -f "$APP/.env" && test -x "$APP/venv/bin/python" && test -d "$APP/state"
systemctl --user stop jagports-lead-agent.timer
test "$(systemctl --user is-active jagports-lead-agent.service || true)" != active
mv "$APP" "$BACKUP"
git clone --filter=blob:none --sparse --branch main https://github.com/jagports/jagports.git "$REPO"
git -C "$REPO" sparse-checkout set "$SUB"
mkdir -m 700 "$PRIVATE"
for name in .env venv state reports notifications; do
  if test -e "$BACKUP/$name"; then mv "$BACKUP/$name" "$PRIVATE/$name"; else mkdir -m 700 "$PRIVATE/$name"; fi
  ln -s "$PRIVATE/$name" "$REPO/$SUB/$name"
done
printf '%s\n' "$SUB/.env" "$SUB/venv/" "$SUB/state/" "$SUB/reports/" "$SUB/notifications/" >> "$REPO/.git/info/exclude"
ln -s "$REPO/$SUB" "$APP"
git -C "$REPO" status --short
git -C "$REPO" rev-parse HEAD
```

The tracked `config.yaml` comes from reviewed `main` with paid reasoning disabled. Compare the old `$BACKUP/config.yaml` privately; do not copy an enabled setting over the tracked file. Confirm that `.env`, `venv`, `state` (including charged or uncertain model attempts), `reports` and `notifications` resolve outside Git. If migration fails, leave the agent timer stopped and inspect the backup and partial checkout before recovery.

## Update manually from reviewed main

Run as `codex` after the selected `main` revision passes independent review and CI. The checkout must be on `main` with no tracked changes. Record whether the original 585-minute agent timer was active before stopping it; restarting it may invoke the service shortly afterward.

```bash
set -euo pipefail
REPO=/home/codex/jagports-source
APP=/home/codex/jagports-lead-agent
SUB=6-Development/AI/agents/jagports/jagports-lead-agent
test "$(id -un)" = codex
test -L "$APP" && test "$(readlink -f "$APP")" = "$REPO/$SUB"
test "$(git -C "$REPO" branch --show-current)" = main
test -z "$(git -C "$REPO" status --porcelain --untracked-files=no)"
git -C "$REPO" fetch origin main
git -C "$REPO" diff --stat HEAD..origin/main -- "$SUB"
git -C "$REPO" log -1 --format='%H %s' origin/main
OLD=$(git -C "$REPO" rev-parse HEAD)
systemctl --user stop jagports-lead-agent.timer
test "$(systemctl --user is-active jagports-lead-agent.service || true)" != active
git -C "$REPO" pull --ff-only origin main
cd "$APP"
env -u OPENAI_API_KEY -u GITHUB_TOKEN -u TELEGRAM_BOT_TOKEN -u TELEGRAM_CHAT_ID \
  ./venv/bin/python -m unittest discover -s tests -p 'test_*.py' -q
systemctl --user start jagports-lead-agent.service
test "$(systemctl --user show jagports-lead-agent.service -p Result --value)" = success
test "$(systemctl --user show jagports-lead-agent.service -p ExecMainStatus --value)" = 0
systemctl --user show jagports-lead-agent.service -p Result -p ExecMainStatus
```

Restart `jagports-lead-agent.timer` only if the tests and service check pass and it was active before the update. Verify a later timer-triggered journal entry separately. If an update or check fails, leave the timer stopped. The prior commit is `$OLD` in that shell; after confirming the checkout has no local tracked edits, an operator can restore it with `git -C "$REPO" reset --hard "$OLD"`, rerun offline tests, and then decide whether to restart the timer. This rollback changes tracked repository files only; private state and the spending ledger remain outside the checkout. Never use `git clean` or delete the private directory to recover an update.
