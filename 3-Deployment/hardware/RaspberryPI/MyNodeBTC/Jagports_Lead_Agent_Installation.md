# Jagports Lead Agent — MyNode Raspberry Pi Installation

## Scope and host boundary

This is the **one host-specific installation document** for the existing Raspberry Pi MyNodeBTC instance. General-purpose agent commands belong to [Development OPERATIONS.md](../../../../6-Development/AI/agents/jagports/jagports-lead-agent/OPERATIONS.md), the architecture to its sibling [README.md](../../../../6-Development/AI/agents/jagports/jagports-lead-agent/README.md), and the project business case to [Projects](../../../../5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md).

Verified host context: `mynode-sby`, Debian on Raspberry Pi, `admin` for host administration, `codex` UID `1008` for the isolated Lead Agent workspace `/home/codex/jagports-lead-agent`. SSH from Windows Git Bash **runs on the Pi**, not Windows. The `codex` account does not have usable sudo credentials; use the `admin` SSH session for privileged setup. Do not change existing MyNodeBTC services or expose `.env` credentials.

## Intended installed configuration

The coordinator uses `/home/codex/jagports-lead-agent/venv/bin/python` to run `main.py`. Its `Type=oneshot` **systemd user service** is activated every **9 hours and 45 minutes (585 minutes)** by a user timer.

`/home/codex/.config/systemd/user/jagports-lead-agent.service`:

```ini
[Unit]
Description=Jagports Lead Agent

[Service]
Type=oneshot
WorkingDirectory=/home/codex/jagports-lead-agent
ExecStart=/home/codex/jagports-lead-agent/venv/bin/python /home/codex/jagports-lead-agent/main.py
```

`/home/codex/.config/systemd/user/jagports-lead-agent.timer`:

```ini
[Unit]
Description=Run Jagports Lead Agent every 9 hours 45 minutes

[Timer]
OnActiveSec=9h45min
OnUnitActiveSec=9h45min
Unit=jagports-lead-agent.service

[Install]
WantedBy=timers.target
```

`OnUnitActiveSec=9h45min` counts from service activation; it is **not 09:45 on a clock**. `OnActiveSec=9h45min` schedules the first activation 9h45min after the timer becomes active; `OnUnitActiveSec=9h45min` schedules subsequent runs relative to service activation. There is no short startup run. The repository's `config.yaml` `polling.interval_minutes: 585` is descriptive: current `main.py` does not consume it to create a scheduler.

## Install or repair as `admin`

First establish sudo access in the **admin** SSH session. Paste the entire block only once sudo credentials have been accepted; if your terminal interleaves multiline pastes with a password prompt, run `sudo -v` separately first. Stop on any failure rather than continuing to activation. Inspect and back up existing units before replacing an already functioning installation.

```bash
set -e
test "$(whoami)" = admin || { echo "Log into mynode-sby as admin"; exit 1; }
CUID=$(id -u codex)
sudo loginctl enable-linger codex
sudo systemctl start "user@${CUID}.service"
sudo systemctl is-active "user@${CUID}.service"
sudo ls -l "/run/user/${CUID}/bus"

# Create missing units only. Do not overwrite live units blindly.
UNITDIR=/home/codex/.config/systemd/user
sudo install -d -o codex -g codex "$UNITDIR"
if ! sudo test -f "$UNITDIR/jagports-lead-agent.service"; then
  sudo tee "$UNITDIR/jagports-lead-agent.service" >/dev/null <<'SERVICE'
[Unit]
Description=Jagports Lead Agent

[Service]
Type=oneshot
WorkingDirectory=/home/codex/jagports-lead-agent
ExecStart=/home/codex/jagports-lead-agent/venv/bin/python /home/codex/jagports-lead-agent/main.py
SERVICE
  sudo chown codex:codex "$UNITDIR/jagports-lead-agent.service"
fi
if ! sudo test -f "$UNITDIR/jagports-lead-agent.timer"; then
  sudo tee "$UNITDIR/jagports-lead-agent.timer" >/dev/null <<'TIMER'
[Unit]
Description=Run Jagports Lead Agent every 9 hours 45 minutes

[Timer]
OnActiveSec=9h45min
OnUnitActiveSec=9h45min
Unit=jagports-lead-agent.service

[Install]
WantedBy=timers.target
TIMER
  sudo chown codex:codex "$UNITDIR/jagports-lead-agent.timer"
fi

# Inspect the actual files before enabling.
sudo cat "$UNITDIR/jagports-lead-agent.service"
sudo cat "$UNITDIR/jagports-lead-agent.timer"
```

If existing unit contents differ, do **not** enable until you identify why. Back up the existing file, reconcile the difference with the intended unit above and reload systemd. Avoid a parallel `cron` job or extra system-level service for the same coordinator.

## Replace the previous short startup trigger on an existing host

For an already-enabled timer, **inspect** `systemctl --user cat jagports-lead-agent.timer` before changing it. If the effective unit includes a startup directive, inspect its source and all displayed drop-ins. Do not modify unrelated MyNode timers. The intended `[Timer]` block contains only `OnActiveSec=9h45min`, `OnUnitActiveSec=9h45min` and `Unit=jagports-lead-agent.service`.

After backing up the existing **codex-owned** timer file, remove any `OnBootSec` assignment from that file, add the intended `OnActiveSec=9h45min` once, and check whether another assignment comes from a drop-in. Reload the `codex` user manager, restart **only this timer**, and inspect the effective unit, monotonic triggers and next activation. Restarting the timer recalculates its first-activation deadline; do not interpret it as a successful unattended service run.

As `admin` (do not run these commands through `sudo -iu codex` without its runtime bus), use a codex-targeted user manager:

```bash
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user cat jagports-lead-agent.timer
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user show jagports-lead-agent.timer -p TimersMonotonic
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user list-timers --all
```

**Acceptance:** the effective timer contains no `OnBootSec` assignment, displays both 9h45min intervals, remains enabled/active, and has a plausible next activation. If the effective unit shows any inherited startup trigger, remove it from the exact drop-in shown by `systemctl cat` before declaring success. A separate later timer-triggered service journal entry and durable report remain required for unattended-execution acceptance.

## Service and scheduler acceptance from the `admin` SSH session

For the existing MyNode host, `sudo -iu codex` alone did not establish a usable user bus and yielded `Failed to connect to bus: No medium found`. Even after switching to `admin`, plain `systemctl --user` targets **admin's** manager, which has no `codex` timer. Always pass `codex`'s bus explicitly:

```bash
set -e
CUID=$(id -u codex)
cctl() {
    sudo -u codex env \
        XDG_RUNTIME_DIR="/run/user/${CUID}" \
        DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/${CUID}/bus" \
        systemctl --user "$@"
}
cctl daemon-reload
cctl cat jagports-lead-agent.timer jagports-lead-agent.service
cctl start jagports-lead-agent.service
cctl show jagports-lead-agent.service -p Result -p ExecMainStatus
cctl enable --now jagports-lead-agent.timer
cctl list-timers --all
sudo -u codex env \
    XDG_RUNTIME_DIR="/run/user/${CUID}" \
    DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/${CUID}/bus" \
    journalctl --user -u jagports-lead-agent.service -n 40 --no-pager
```

An actual `Result=success`, `ExecMainStatus=0` establishes service execution. An enabled, active timer with a plausible next activation establishes timer configuration. **A later automatic invocation**, verified by the service journal/report after the next timer elapse, is required to prove unattended scheduling. If a service fails, stop; do not enable its timer and do not print credentials in issue comments.

## Verification evidence

The operator supplied these observations on 23 September 2026:

- A direct OpenAI Responses API test returned `JAGPORTS API TEST OK`. This does **not** establish an SDK-backed reasoning agent.
- A manual `python main.py` run completed after approximately a week and reported many lifecycle changes. An immediate repeat produced `{'new': [], 'closed': [], 'reopened': []}`, supporting normal persistence between those runs.
- The `codex` user bus existed at `/run/user/1008/bus`. The user systemd service subsequently reported `Result=success`, `ExecMainStatus=0`.
- The user timer reported `enabled` and `active (waiting)` after an activation on **23 September 2026 02:18:20 EEST**, and the next scheduled elapse was **12:03:20 EEST** (9h45min later).
- A **later automatic timer-triggered agent execution** was not yet evidenced in the provided transcript; verify the journal after the scheduled elapse before closing that acceptance criterion.

The current modular Lead Agent remains deterministic and does not call `openai_service.py` or the planned OpenAI Agents SDK during `main.py`. Do not confuse direct API, manual pipeline, service invocation or timer activation with semantic agent integration.
