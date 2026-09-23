#!/usr/bin/env bash
# One-shot, codex-owned check or sync of reviewed jagports/jagports main.
# Install a stable copy outside the live workspace in ~/.local/libexec/.
set -euo pipefail
umask 077
MODE=--check
if (( $# )); then MODE="$1"; fi
case "$MODE" in --check|--apply|--enroll|--scheduled) ;; *) echo "Invalid mode" >&2; exit 2;; esac
[[ "$(id -un)" == codex ]] || { echo "Run as codex, not as admin/sudo." >&2; exit 1; }

APP=/home/codex/jagports-lead-agent
SUB=6-Development/AI/agents/jagports/jagports-lead-agent
SELF=/home/codex/.local/libexec/jagports-sync-main.sh
UNITDIR=/home/codex/.config/systemd/user
POLICY=/home/codex/.config/jagports-agent/auto-deploy-approved
STATE="$APP/state"
PY="$APP/venv/bin/python"
TIMER=jagports-lead-agent.timer
SERVICE=jagports-lead-agent.service
if [[ "$MODE" == --scheduled ]]; then
  if [[ -f "$POLICY" ]] && [[ "$(cat "$POLICY")" == I_APPROVE_REVIEWED_MAIN_AUTO_DEPLOY ]]; then
    MODE=--apply
  else
    MODE=--check
  fi
fi
if [[ "$MODE" == --apply && ! -f "$STATE/installed_app_tree" ]]; then
  echo "NOT_ENROLLED: first run --check and manually review, then --enroll." >&2; exit 1
fi
test -x "$PY" && test -r "$APP/.env" && test -d "$STATE"
for tool in git rsync flock mktemp cmp systemctl; do command -v "$tool" >/dev/null; done
mkdir -p /home/codex/.cache
exec 9>/home/codex/.cache/jagports-sync-main.lock
flock -n 9 || { echo "ALREADY_RUNNING: skipped"; exit 0; }
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
test -S "$XDG_RUNTIME_DIR/bus"

safe_config() {
  "$PY" - "$1" <<'PYTHON'
import sys, yaml
with open(sys.argv[1], encoding="utf-8") as f:
    c = yaml.safe_load(f)
assert isinstance(c, dict)
assert c.get("openai", {}).get("enabled") is False, "Paid OpenAI enabled: stop."
p7 = c.get("p7") or {}
assert p7.get("enabled", False) is False, "Legacy P7 enabled: stop."
assert (p7.get("reasoning") or {}).get("enabled", False) is False
assert c.get("polling", {}).get("interval_minutes") == 585
print("SAFE_CONFIG:", sys.argv[1])
PYTHON
}
if [[ "$MODE" == --check ]]; then
  if ! safe_config "$APP/config.yaml"; then
    echo "LOCAL_CONFIG_ENABLED: check-only is allowed; deployment requires model-disabled reconciliation." >&2
  fi
else
  safe_config "$APP/config.yaml"
fi
WORK=$(mktemp -d /home/codex/.cache/jagports-sync.XXXXXX)
BACKUP=
CHANGED=0
STOPPED=0
WAS_ACTIVE=0

sync_code() {
  rsync -a --no-times --omit-dir-times --delete \
    --exclude='/.env' --exclude='/venv/' --exclude='/state/' \
    --exclude='/reports/' --exclude='/notifications/' \
    --exclude='/config.yaml' --exclude='/.git/' \
    --exclude='/issues_snapshot.txt' --exclude='/agent_status.json' \
    --exclude='/__pycache__/' --exclude='__pycache__/' --exclude='*.pyc' \
    "$@"
}
finish() {
  rc=$?
  trap - EXIT
  if (( rc != 0 && CHANGED == 1 )); then
    echo "UPDATE_FAILED: rolling back from $BACKUP" >&2
    if sync_code "$BACKUP/" "$APP/" && \
      install -m 600 "$BACKUP/config.yaml" "$APP/config.yaml" && \
      (cd "$APP" && env -u OPENAI_API_KEY -u GITHUB_TOKEN \
       "$PY" -m unittest discover -s tests -p 'test_*.py' -q); then
      echo "ROLLBACK_TESTS_PASS" >&2
      if (( WAS_ACTIVE == 1 )); then systemctl --user start "$TIMER" || true; fi
    else
      echo "ROLLBACK_UNVERIFIED: original timer remains stopped." >&2
    fi
  elif (( rc != 0 && STOPPED == 1 && WAS_ACTIVE == 1 )); then
    systemctl --user start "$TIMER" || true
  fi
  rm -rf -- "$WORK"
  exit "$rc"
}
trap finish EXIT

export GIT_TERMINAL_PROMPT=0
git clone --quiet --depth 1 --filter=blob:none --sparse --branch main \
  https://github.com/jagports/jagports.git "$WORK/repo"
git -C "$WORK/repo" sparse-checkout set "$SUB" >/dev/null
SRC="$WORK/repo/$SUB"
test -f "$SRC/main.py" && test -f "$SRC/config.yaml"
NEW_SHA=$(git -C "$WORK/repo" rev-parse HEAD)
NEW_TREE=$(git -C "$WORK/repo" rev-parse "HEAD:$SUB")
OLD_SHA=unrecorded
OLD_TREE=unrecorded
if [[ -f "$STATE/installed_main_commit" ]]; then OLD_SHA=$(cat "$STATE/installed_main_commit"); fi
if [[ -f "$STATE/installed_app_tree" ]]; then OLD_TREE=$(cat "$STATE/installed_app_tree"); fi
if [[ "$MODE" == --check ]]; then
  if ! safe_config "$SRC/config.yaml"; then
    echo "MAIN_DEFAULT_UNSAFE: do not install or auto-deploy this revision." >&2
  fi
else
  safe_config "$SRC/config.yaml"
fi
echo "MAIN_COMMIT=$NEW_SHA INSTALLED_COMMIT=$OLD_SHA"
echo "MAIN_APP_TREE=$NEW_TREE INSTALLED_APP_TREE=$OLD_TREE"

# Running updater/unit files are stored outside APP. Manual reinstallation
# is required when these files change on main.
if [[ ! -f "$SELF" ]] || ! cmp -s "$SELF" "$SRC/scripts/sync_main.sh"; then
  echo "UPDATER_CHANGED: manually review/reinstall stable updater."
  if [[ "$MODE" != --check ]]; then exit 1; fi
fi
for unit in jagports-sync-main.service jagports-sync-main.timer; do
  if [[ ! -f "$UNITDIR/$unit" ]] || ! cmp -s "$UNITDIR/$unit" "$SRC/systemd/$unit"; then
    echo "UNIT_CHANGED: manually review/reinstall $unit."
    if [[ "$MODE" != --check ]]; then exit 1; fi
  fi
done

sync_code -nrc --out-format='%i %n' "$SRC/" "$APP/" > "$WORK/diff"
if [[ "$NEW_TREE" == "$OLD_TREE" && ! -s "$WORK/diff" ]]; then
  printf '%s\n' "$NEW_SHA" > "$STATE/installed_main_commit"
  echo "IN_SYNC"; exit 0
fi
echo "CODE_DIFF:"
cat "$WORK/diff"
if [[ "$MODE" == --check ]]; then
  echo "UPDATE_AVAILABLE: check-only. Review deletions; manually --enroll or --apply."
  exit 0
fi

# Auto mode may delete only files recorded in the previous source manifest.
if [[ "$MODE" == --apply ]]; then
  test -f "$STATE/installed_app_files.txt"
  awk '$1=="*deleting" { print $2 }' "$WORK/diff" | while IFS= read -r item; do
    if ! grep -Fxq -- "$item" "$STATE/installed_app_files.txt"; then
      echo "UNMANAGED_FILE: $item would be deleted; manual intervention." >&2
      exit 1
    fi
  done
fi

# Test the candidate BEFORE stopping the live agent timer or touching code.
(
 cd "$SRC"
 "$PY" -m compileall -q agents core services tests main.py
 env -u OPENAI_API_KEY -u GITHUB_TOKEN -u TELEGRAM_BOT_TOKEN \
     -u TELEGRAM_CHAT_ID "$PY" -m unittest discover -s tests -p 'test_*.py' -q
)
echo "STAGED_OFFLINE_TESTS_PASS"
if systemctl --user is-active --quiet "$SERVICE"; then
  echo "RUNTIME_BUSY: skip, retry at next schedule."; exit 0
fi
if systemctl --user is-active --quiet "$TIMER"; then WAS_ACTIVE=1; fi
systemctl --user stop "$TIMER"
STOPPED=1
if systemctl --user is-active --quiet "$SERVICE"; then
  echo "RUNTIME_RACE: no live code changed." >&2; exit 1
fi
BACKUP=$(mktemp -d /home/codex/jagports-backup.XXXXXX)
rsync -a --exclude='/venv/' --exclude='/.env' --exclude='/state/' \
  --exclude='/reports/' --exclude='/notifications/' \
  --exclude='__pycache__/' --exclude='*.pyc' "$APP/" "$BACKUP/"
CHANGED=1
sync_code "$SRC/" "$APP/"
install -m 600 "$SRC/config.yaml" "$APP/config.yaml"
systemctl --user start "$SERVICE"
test "$(systemctl --user show "$SERVICE" -p Result --value)" = success
test "$(systemctl --user show "$SERVICE" -p ExecMainStatus --value)" = 0
test -s "$APP/reports/lead_report.md" && test -s "$APP/state/agent_state.json"
test "$(stat -c %U "$APP/reports/lead_report.md")" = codex
test "$(stat -c %U "$APP/state/agent_state.json")" = codex

find "$SRC" -type f ! -name '*.pyc' ! -path '*/__pycache__/*' \
  -printf '%P\n' | sort > "$STATE/installed_app_files.txt"
printf '%s\n' "$NEW_TREE" > "$STATE/installed_app_tree"
printf '%s\n' "$NEW_SHA" > "$STATE/installed_main_commit"
CHANGED=0
if (( WAS_ACTIVE == 1 )); then systemctl --user start "$TIMER"; fi
STOPPED=0
echo "UPDATED=$NEW_SHA; tested service; backup=$BACKUP"
echo "Existing timer resumed only if previously active; OnActiveSec may run once soon."
