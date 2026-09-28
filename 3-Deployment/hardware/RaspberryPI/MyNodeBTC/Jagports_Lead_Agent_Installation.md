# Jagports AI OS Lead Agent — MyNode Raspberry Pi Setup and Project Record

## Scope and host boundary

This is the canonical combined host-installation and project-record document for the existing Raspberry Pi MyNodeBTC instance. Reusable engineering and diagnostic commands belong to [Development OPERATIONS.md](../../../../6-Development/AI/agents/jagports/jagports-lead-agent/OPERATIONS.md); architecture and implementation status belong to the adjacent [README.md](../../../../6-Development/AI/agents/jagports/jagports-lead-agent/README.md) and [Lead Agent SPEC](../../../../6-Development/AI/agents/jagports/jagports-lead-agent/SPEC_Agent_Lead.md).

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
OnActiveSec=1s
OnUnitActiveSec=9h45min
Unit=jagports-lead-agent.service

[Install]
WantedBy=timers.target
```

`OnUnitActiveSec=9h45min` counts from service activation; it is **not 09:45 on a clock**. `OnActiveSec=1s` starts the agent once shortly after the timer is activated (including an intentional restart of this timer); `OnUnitActiveSec=9h45min` schedules subsequent runs from the most recent service activation. This replaces the unwanted five-minute boot-relative trigger, but intentionally starts once when the timer starts. The repository's `config.yaml` `polling.interval_minutes: 585` is descriptive: current `main.py` does not consume it to create a scheduler.

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
OnActiveSec=1s
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

For an already-enabled timer, **inspect** `systemctl --user cat jagports-lead-agent.timer` before changing it. If the effective unit includes a startup directive, inspect its source and all displayed drop-ins. Do not modify unrelated MyNode timers. The intended `[Timer]` block contains only `OnActiveSec=1s`, `OnUnitActiveSec=9h45min` and `Unit=jagports-lead-agent.service`.

After backing up the existing **codex-owned** timer file, remove any `OnBootSec` assignment from that file, add the intended `OnActiveSec=1s` once, and check whether another assignment comes from a drop-in. Reload the `codex` user manager, restart **only this timer**, and inspect the effective unit, monotonic triggers and next activation. Restarting the timer recalculates its first-activation deadline; do not interpret it as a successful unattended service run.

As `admin` (do not run these commands through `sudo -iu codex` without its runtime bus), use a codex-targeted user manager:

```bash
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user cat jagports-lead-agent.timer
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user show jagports-lead-agent.timer -p TimersMonotonic
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user list-timers --all
```

**Safe change after auditing the unit and its drop-ins:** if the obsolete directive is in the primary `codex` timer file, paste the following **as `admin`**. It backs up only that file, removes the old assignment, ensures the one-second first-activation trigger exists, and reloads/restarts **only** the Lead Agent user timer. If `systemctl cat` showed another assignment in a drop-in, inspect and correct that exact drop-in separately before calling the work complete.

```bash
UNIT=/home/codex/.config/systemd/user/jagports-lead-agent.timer
sudo cp -p "$UNIT" "$UNIT.bak.$(date +%Y%m%d%H%M%S)"
sudo sed -i '/^[[:space:]]*OnBootSec[[:space:]]*=/d' "$UNIT"
sudo grep -q '^[[:space:]]*OnActiveSec[[:space:]]*=' "$UNIT" || sudo sed -i '/^\[Timer\]/a OnActiveSec=1s' "$UNIT"
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user daemon-reload
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user restart jagports-lead-agent.timer
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user cat jagports-lead-agent.timer
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user show jagports-lead-agent.timer -p TimersMonotonic
sudo -u codex env XDG_RUNTIME_DIR=/run/user/1008 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1008/bus systemctl --user list-timers --all
```

**Acceptance:** the effective timer contains no `OnBootSec` assignment, displays `OnActiveSec=1s` and `OnUnitActiveSec=9h45min`, remains enabled/active, and after its first near-immediate invocation has a plausible next activation about 9h45min later. If the effective unit shows any inherited startup trigger, remove it from the exact drop-in shown by `systemctl cat` before declaring success. One timer-triggered service invocation and matching durable report/state are recorded in Issue #900; the later 13:37:40 recurrence remains unverified there.

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

An actual `Result=success`, `ExecMainStatus=0` establishes service execution. An enabled, active timer with a plausible next activation establishes timer configuration. Issue #900 records one automatic invocation with successful exit and matching report/state timestamps; its later recurrence was not verified in that record. If a service fails, stop; do not enable its timer and do not print credentials in issue comments.

## Project purpose and boundaries

The Lead Agent prototype tests whether a small, low-cost coordinator can detect relevant GitHub changes, distribute work to the original specialists and surface actionable results without keeping project state in private chat or replacing human-governed decisions. The investment is incremental: retain deterministic collection, state comparison, specialist routing and reporting; add paid model reasoning only when it demonstrably improves classification or decisions. Reuse the existing Raspberry Pi where practical, avoid unnecessary recurring cost, and keep the provider and orchestration runtime replaceable.

The AI OS executable team remains LeadAgent, DocumentationAgent, DeploymentAgent and KnowledgeAgent. This document does not reduce their approved roles or design scope. The canonical architecture and contracts are in the Lead Agent SPEC; this file owns the MyNodeBTC host procedure and the consolidated project background and evidence.

## Project history and traceability

- [Issue #49 — Expand and govern the agent team](https://github.com/jagports/jagports/issues/49) is related roadmap work.
- [Issue #594 — Lead Agent prototype documentation](https://github.com/jagports/jagports/issues/594) and [PR #595](https://github.com/jagports/jagports/pull/595) record the initial Raspberry Pi setup and modular runtime.
- [PR #781](https://github.com/jagports/jagports/pull/781) records the minimum Agents SDK roadmap.
- [Issue #898](https://github.com/jagports/jagports/issues/898) records API smoke-test documentation.
- [PR #899](https://github.com/jagports/jagports/pull/899) is the merged, current documentation baseline for the 585-minute user timer and its safe verification procedure.
- [Issue #900](https://github.com/jagports/jagports/issues/900) is the separate live-host verification record and remains open for later recurrence evidence.
- [Issue #924](https://github.com/jagports/jagports/issues/924) tracks restoration of the original agent runtime and its remaining acceptance.

Closed work records are historical evidence and remain unchanged. Their relevant context is consolidated here; active timer procedure follows merged PR #899, and newer host evidence in open Issue #900 supersedes earlier status statements where applicable.

## Recorded prototype and current capabilities

The original workspace is `~/jagports-lead-agent`, operated by the unprivileged `codex` user on MyNodeBTC with Python 3.11. The recorded modular prototype contains:

- GitHub issue collection and persisted lifecycle comparison (`new`, `closed`, `reopened`).
- `Event`, `LeadAgent`, `AgentRegistry` and normalized `AgentResult` boundaries.
- Deterministic Documentation, Deployment and Knowledge specialists.
- Report generation and Telegram notification integration.
- A direct OpenAI model-call wrapper that the current modular `main.py` does not invoke.

The original checks on 12 September 2026 demonstrated close/reopen detection and distinct rule-based outputs from the three specialists. Earlier PyGithub `issue.pull_request` / `raw_data` accesses caused unexpected object-completion requests; temporarily avoiding that classification allowed collection to progress but can mix Issues and PRs in reported counts. One original report contained 595 collected records, not necessarily 595 Issues.

## Project direction and remaining validation

1. Retain the inexpensive deterministic collector, state/event/result contracts and existing reporting.
2. Preserve and verify the existing 585-minute user timer using the host procedure above.
3. Keep event payloads compact and avoid dumping full repository snapshots into reports or model prompts.
4. Introduce lazy Issue details and one bounded, model-neutral reasoning service using the planned OpenAI Agents SDK only through separately reviewed, cost-capped behavior.
5. Prove semantic classification by one specialist and measured API usage before expanding model-backed behavior.
6. Progress to advisory planning, review, controlled execution, robust replay/retry and a human-governed reasoning team only as separately approved increments.

A successful standalone API request does not authorize recurring API spend or prove integrated autonomous reasoning. Do not grant the `codex` Linux user passwordless sudo or Docker access to simplify installation. A `pending_notification.txt` file is not a proven delivery queue; retry and failure recovery require explicit tests. The historical working archive predates later context fixes and must not be assumed to back up the latest runtime.

## Consolidated verification evidence and current precedence

The operator supplied these observations on 23 September 2026:

- A direct OpenAI Responses API test returned `JAGPORTS API TEST OK`; this does **not** establish an SDK-backed reasoning agent.
- A manual `python main.py` run after approximately a week reported a large lifecycle delta; an immediate repeat returned `{'new': [], 'closed': [], 'reopened': []}`, supporting state reuse in those runs, not complete regression coverage.
- The host's `codex` user timer was verified with `OnActiveSec=1s`, `OnUnitActiveSec=9h45min`, and no `OnBootSec` assignment in the effective unit or drop-ins.
- Issue #900 records one actual automatic timer activation at **03:52:40 EEST**, service success at **03:53:11 EEST**, and matching report/state writes at **03:53:11.194 +0300** and **03:53:11.190 +0300**. The next activation was scheduled for **13:37:40 EEST**. The later 13:37:40 recurrence was not verified in that Issue record.
- A manual Telegram smoke test (TG-001) was operator-confirmed on 23 September; scheduled or AI-generated notification delivery remains unverified.

When historical timer notes conflict, the later merged procedure in PR #899 controls: one near-immediate activation on timer start/restart (`OnActiveSec=1s`), followed by a 9h45min recurrence (`OnUnitActiveSec=9h45min`). Earlier Issue #900 comments proposing different first-activation delays or reporting no unattended run predate the final configuration/evidence and are superseded. The later Issue #900 transcript proves one unattended invocation, but not the subsequent recurrence.

The current modular Lead Agent remains deterministic and does not call `openai_service.py` or the planned OpenAI Agents SDK during `main.py`. Do not confuse direct API access, a manual pipeline run, a systemd service test, or one timer-triggered invocation with integrated semantic-agent behavior or repeated unattended reliability.

## Source records and document consolidation

This guide consolidates the former project background and evidence with the MyNodeBTC host procedure; the separate implementation-project setup document is removed from the active tree and all active links point here. Closed Issue #594 and merged PR #595 remain historical records and are not edited. Merged PR #899 supplies the current timer procedure; open Issue #900 supplies the latest live-host evidence; open Issue #924 remains the active implementation and acceptance umbrella.
