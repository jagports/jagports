# Jagports AI OS Lead Agent Setup

## Purpose and evidence

This implementation record documents the initial Raspberry Pi Lead Agent prototype and its evolution into a modular runtime with three specialist agents.

[Issue #594 — Document Lead Agent setup and multi-script agent team architecture](https://github.com/jagports/jagports/issues/594)

Source: the implementation conversation “Build Automated Agent Team”, dated 12 September 2026, and the completed setup recorded in issue #594. This is a record of that session, not a fresh inspection of the Raspberry Pi or a production-readiness claim. Evidence refreshed through the later modular-runtime work and the attached report generated at 2026-09-12T15:30:04.279643 (host timestamp). Recorded runs demonstrate closure/reopening detection and specialist results. A complete regression suite and live OpenAI analysis are not established.

## Verified standalone OpenAI API smoke test

The Raspberry Pi operator subsequently ran a one-shot **direct OpenAI Responses API test** as `codex` from `~/jagports-lead-agent` with the existing virtual environment activated:

```bash
cd ~/jagports-lead-agent
source venv/bin/activate
python -c 'from dotenv import load_dotenv; from openai import OpenAI; load_dotenv(); r=OpenAI().responses.create(model="gpt-5.6", input="Reply with exactly: JAGPORTS API TEST OK"); print(r.output_text)'
```

The provided terminal transcript reported:

```text
JAGPORTS API TEST OK
```

**Evidence boundary:** The exact result confirms that a direct billable OpenAI API request worked from the configured Raspberry Pi environment at the time of this operator test. It does **not** verify that `main.py`, `LeadAgent`, specialist agents, or the future OpenAI Agents SDK are wired to the API; the modular `main.py` currently runs deterministic specialists and does not invoke `services/openai_service.py`. It also does not prove systemd timer activation or unattended execution.

The intended unattended Lead Agent interval discussed with the operator is **9 hours 45 minutes**. The repository's original proposed hourly timer and 60-minute `config.yaml` remain historical/configuration artifacts until a live timer is inspected and the actual scheduling implementation is separately reconciled. No timer configuration change or timer-run verification is claimed by this documentation update.


## Target schedule and Raspberry Pi operator verification

**Requested target:** the Lead Agent's **systemd user timer** should activate the coordinator every **9 hours and 45 minutes**, not hourly and not at the clock time 09:45. This is **585 minutes** from the previous service activation. The initial boot trigger remains five minutes. The original one-hour example in the historical appendix below is retained solely as a record of the earlier proposal and is superseded for new setup by this section.

The latest operator-supplied manual `python main.py` transcript completed successfully and reported a large group of new and closed Issue/PR numbers after approximately **one week without a run**. This is consistent with a stale-but-valid saved state, but it does not prove a timer has been activated, that state comparison has been tested on an immediate second run, or that a systemd service has executed.

### Recommended user service

Use the existing Python virtual environment as the execution interpreter. The `Type=oneshot` service does not attempt to make `main.py` a daemon:

```ini
# ~/.config/systemd/user/jagports-lead-agent.service
[Unit]
Description=Jagports Lead Agent

[Service]
Type=oneshot
WorkingDirectory=/home/codex/jagports-lead-agent
ExecStart=/home/codex/jagports-lead-agent/venv/bin/python /home/codex/jagports-lead-agent/main.py
```

The user service inherits the user-manager environment. Existing `main.py` calls `load_dotenv()` from its configured working directory, so `~/jagports-lead-agent/.env` can remain local and protected. Never place API tokens in the service, timer, shell command history, GitHub, or test transcript.

### Recommended 9h45min timer

```ini
# ~/.config/systemd/user/jagports-lead-agent.timer
[Unit]
Description=Run Jagports Lead Agent every 9 hours 45 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=9h45min
Unit=jagports-lead-agent.service

[Install]
WantedBy=timers.target
```

Use `systemctl --user daemon-reload` after installing or changing the files; `systemctl --user enable --now jagports-lead-agent.timer` enables and starts the timer. Inspect an existing timer/service and back up its contents **before** overwriting it. Avoid installing another cron entry for the same job. The timer is the execution authority: `config.yaml` now records `polling.interval_minutes: 585`, but current `main.py` does not use this field to schedule runs. Enabling user lingering may require a system administrator if execution must continue after logout/reboot without a user session.

### MyNode SSH: repair the `codex` user bus from `admin`

**Observed:** The operator connects to the Raspberry Pi through Windows Git Bash over SSH. Windows Git Bash is the terminal, not the machine executing `systemctl`. The `codex` account is UID `1008` on the observed host and has no usable sudo password. `sudo -iu codex` switched identity but `systemctl --user` reported `Failed to connect to bus: No medium found`; commands run as `admin` instead searched `/home/admin/.config/systemd/user` and found no Lead Agent timer. `crontab -l` for `codex` reported no crontab.

**Use one complete block while logged in as `admin@mynode-sby`.** Do not run `sudo` as `codex`, or start another SSH session as `codex` unless separately configured authentication is available. Commands with `user@…service` below are literal shell commands, not email links.

First verify and start the `codex` user manager without modifying its timer:

```bash
set -e
test "$(whoami)" = admin || { echo "Log in as admin on the Raspberry Pi first"; exit 1; }
CUID=$(id -u codex)
sudo loginctl enable-linger codex
sudo systemctl start "user@${CUID}.service"
echo "USER MANAGER:"
sudo systemctl is-active "user@${CUID}.service"
echo "CODEX USER BUS:"
sudo ls -l "/run/user/${CUID}/bus"
echo "EXISTING TIMER:"
sudo ls -l /home/codex/.config/systemd/user/jagports-lead-agent.timer
```

The most recent pasted terminal output confirms `whoami=admin` and shows `sudo loginctl enable-linger codex` being entered, but its pasted command stream became interleaved and includes **no interpretable output** for the `user@` service, bus, or timer-file checks. Therefore **neither a running user manager nor successful timer activation is verified**.

When the bus file exists and the user manager reports `active`, access the **`codex` manager** from the `admin` SSH session by explicitly passing its runtime environment:

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
cctl cat jagports-lead-agent.timer
cctl cat jagports-lead-agent.service
cctl list-timers --all
```

If the files exist and match the service/timer definitions above, test the service using `cctl start jagports-lead-agent.service`, verify `Result=success` and `ExecMainStatus=0`, and only then enable with `cctl enable --now jagports-lead-agent.timer`. Check `cctl list-timers --all` and the service journal. If the manager or bus is missing, stop and diagnose that condition rather than repeating `systemctl --user` under the wrong user. A pasted group of commands without corresponding results is not acceptance evidence.

### Verification gates

1. **Timer configuration and activation:** `systemctl --user cat jagports-lead-agent.timer jagports-lead-agent.service`; `systemctl --user is-enabled jagports-lead-agent.timer`; `systemctl --user is-active jagports-lead-agent.timer`; `systemctl --user list-timers --all`. Expect an installed 9h45min timer enabled and active; check the listed next elapse **after** a completed service run.
2. **One-shot service test:** `systemctl --user start jagports-lead-agent.service` once. It starts the same service the timer will invoke; no separate direct `python main.py` invocation is needed.
3. **Result and evidence:** `systemctl --user show jagports-lead-agent.service -p Result -p ExecMainStatus`, `journalctl --user -u jagports-lead-agent.service -n 60 --no-pager`, and inspection of the local generated report/state files. A successful direct OpenAI API test is *not* a successful agent-service or timer test.
4. **Unattended test:** after an actual timer elapse, check the timer journal, service journal and report timestamp. Only this confirms unattended timer activation; manual `systemctl start` confirms service integration, not that the timer triggered it.

A large first lifecycle delta can be expected after a long gap. For persistence verification, repeat a manual or service run after a short quiet interval and compare changed records. Do not enable paid reasoning over an unfiltered backlog. Do not claim success of any host verification until the operator provides actual terminal evidence.

## Environment and setup

The prototype workspace is `~/jagports-lead-agent` on a Raspberry Pi running Debian. It uses a Python 3.11 virtual environment, leaving the Debian system Python unchanged.

Installed packages recorded in the setup:

- `openai`
- `PyGithub`
- `PyYAML`
- `python-dotenv`
- `python-telegram-bot`

The original entry point was `agent.py`; the modular implementation now runs through `main.py`. Configuration is read from `config.yaml`; credentials are loaded separately through environment variables / local `.env` handling.

For the existing configured workspace, the manual execution used in the session is:

```bash
cd ~/jagports-lead-agent
source venv/bin/activate
python main.py
```

These commands assume the prototype and its configuration already exist on the host. This documentation change does not install or publish the prototype source, pin package versions, or configure a service.

## Configuration and credentials

The configured agent name is Jagports Lead and the GitHub repository is `jagports/jagports`.

GitHub access uses `GITHUB_TOKEN`. OpenAI integration was attempted, but successful live analysis was not established in the session; local mock analysis allowed the remaining pipeline to be exercised. The original prototype selects analysis using `openai.enabled` in `config.yaml`. Mock mode is an explicit operating mode, not evidence that all live API failures automatically fall back safely.

Telegram communication uses the bot username `JagportsLeadBot`. The bot token, destination chat identifier, GitHub token, and OpenAI key remain in local credential/environment handling. No credential values belong in this document or the repository.

## Original prototype components and files

Paths below are relative to the Raspberry Pi workspace.

| Component / file | Recorded responsibility |
|---|---|
| `agent.py` | Load configuration, collect GitHub records, select analysis, write reports/state, detect changes, and invoke notification delivery. |
| `config.yaml` | Non-secret agent/repository settings and analysis-mode selection. |
| `.env` | Local credential loading; not a repository artifact. |
| `issues_snapshot.txt` | Human-readable snapshot of collected records. |
| `reports/lead_report.md` | Generated Markdown analysis report. |
| `state/agent_state.json` | Persistent snapshot and change-detection result. |
| `notifications/pending_notification.txt` | Notification text prepared for the sender. |
| `telegram_notify.py` | Separate Telegram notification sender. |

These files describe the initial prototype. The later modular runtime is documented below; its source remains on the Raspberry Pi and is not added by this documentation PR.

## GitHub collection and lifecycle tracking

GitHub API access to `jagports/jagports` was verified during setup. The first collector used a limited snapshot of open issues. Comparing only issue-number lists could identify additions and disappearances, but could not reliably distinguish closure, reopening, or removal.

Collection then moved to `state="all"`. Retaining the old `open_issue_numbers` comparison after this change caused a defect: a closed issue remained in the returned number set, so the comparison found no change.

The revised state model keys records by issue number and stores `title`, `state`, and `updated_at`. It compares explicit states between runs and records `new`, `closed`, and `reopened` changes. The later sample suppresses new-item alerts when establishing the first baseline. Existing state in the old format needs a deliberate baseline migration; preserve a backup before replacing it.

Limitations:

- Snapshot comparison detects changes visible between runs. If an issue closes and reopens between two polls, both snapshots can show open; full lifecycle history requires event/timeline tracking or webhooks.
- Storing `updated_at` does not by itself implement title, body, label, or comment change detection.
- The final performance workaround temporarily removed PR filtering. The latest attached snapshot includes PR #595 among its 595 records. The report label `Total issues: 595` therefore includes PRs and is not an issue-only count.
- Full regression verification of the revised lifecycle model remains outstanding.

## Report and notification pipeline

The original prototype flow described in the session was:

```text
Load configuration and credentials
  -> Collect repository records
  -> Write snapshot
  -> Run mock or configured OpenAI analysis
  -> Write lead report
  -> Compare and save persistent state
  -> If relevant changes exist, write notification text
  -> Invoke Telegram sender
```

Troubleshooting identified duplicate sender invocation and a sender running before notification-file creation. The correction was to create the current notification before invoking the sender and keep one send invocation in the notification path.

A large baseline change also caused Telegram to reject the message as too long. The proposed correction uses counts and a bounded selection of issue references instead of an unbounded full list. Later sample code again included full change lists, so bounded output must be checked in the actual deployed sender before declaring the problem fully resolved.

The pending text file is not a demonstrated durable delivery queue. The sample saves state before delivery and invokes the sender without requiring a successful exit. A successful report/state write therefore does not prove notification delivery, and retries or exactly-once delivery were not established.

## PyGithub lazy-loading investigation

The session captured interruptions while accessing `issue.pull_request` and then `issue.raw_data`. Both access paths entered PyGithub object-completion requests; one trace reached request deferral. Replacing the first attribute with `raw_data` did not resolve the observed delay.

The final workaround removed those PR-detection accesses and collected the basic number, title, state, and update timestamp fields. The user subsequently reported that it was working.

This workaround trades issue-only classification for progress. A follow-up should restore classification using verified response data, measure request counts and duration, and validate pagination. The trace is evidence of this installed environment's behavior, not a claim that every PyGithub version always fetches every attribute separately.

## Modular runtime and specialist agents

The later conversation records the split into agents, services, and shared event/result objects:

```text
main.py
  -> LeadAgent
       -> GitHubAgent -> GitHubService
       -> StateService -> lifecycle changes
       -> Event
       -> AgentRegistry.analyse_all(event)
            -> DocumentationAgent
            -> DeploymentAgent
            -> KnowledgeAgent
            -> AgentResult[]
  -> ReportService
  -> TelegramService
```

Recorded modules are `agents/lead_agent.py`, `agents/github_agent.py`, `agents/documentation_agent.py`, `agents/deployment_agent.py`, `agents/knowledge_agent.py`, and `agents/agent_registry.py`. The service files are `services/github_service.py`, `services/state_service.py`, `services/report_service.py`, and `services/telegram_service.py`. Shared modules are `core/events.py` (change helpers), `core/event.py`, and `core/result.py`.

Each specialist implements `analyse(event)` and returns an `AgentResult` with `agent`, `severity`, `message`, and `data`. Registering another specialist extends the registry's execution list. These specialists currently apply simple Python rules; the evidence does not show separate LLM calls or autonomous deployment/document edits.

| Specialist | Recorded lifecycle rule |
|---|---|
| Documentation | Recommend review for new or closed issues. |
| Deployment | Recommend review for new or closed issues; deployment-topic filtering is not yet implemented. |
| Knowledge | Recommend review for new, closed, or reopened issues after adding the reopening condition. |
| Test | Proposed in issue #594; no implemented Test Agent is demonstrated. |

The report heading became `Agent Analysis Results` to accommodate results from all registered specialists.

## Event contract and context-loss fix

The implemented `Event` has `type`, `data`, and optional `context`, plus `to_dict()`. At the latest verified checkpoint, `type` is `issue.lifecycle.changed`, `data` directly contains `new`, `closed`, and `reopened`, and `context["issues"]` contains the full collected snapshot.

`LeadAgent.run()` returns `issues, event, documentation_results`. The caller extracts `changes = event.data` and passes the results and `event.context` to the report service. The legacy caller variable name `documentation` now represents all specialist results.

Context debugging exposed two wiring problems: the report initially received no context argument, then the event itself contained an empty context. The latter came from constructing an event with the snapshot and immediately overwriting it with a second `Event` without context. Removing the second construction preserved context. The attached 15:30 report directly shows `Event Context` containing the snapshot.

This is an in-process event object in a polling run; a webhook subscription, event broker, durable event log, or replay mechanism is not demonstrated.

## Recorded runtime checks and backup

The user supplied these results from separate runs against test issue #593 on 12 September 2026:

| Input observed | Documentation | Deployment | Knowledge |
|---|---|---|---|
| No lifecycle changes | normal | normal | normal |
| Closed #593 | review | review | review |
| Reopened #593, after the Knowledge rule change | normal | normal | review |

The close/reopen results at host timestamps 15:18:47 and 15:20:04 confirm those transitions were detected with a run between them. They demonstrate different lifecycle rules, not semantic understanding of issue topics. The latest attached no-change report at 15:30:04 shows all three results as normal and populated event context. These are historical user-run checks, not fresh tests executed by this PR author.

A backup was confirmed at `/home/codex/jagports-lead-agent-three-agents-working.tar.gz`, reported as 25M at 15:03. It predates the subsequent event-context changes and is not a verified backup of the latest checkpoint.

## Current optimization proposal

The latest report prints all 595 collected records into `Event Context`, producing a large report. The latest discussion proposes separating the lifecycle delta from the repository snapshot:

- Keep changed record IDs and lifecycle changes in the event payload.
- Carry compact repository metadata and record count in context.
- Retrieve or look up details only when a specialist needs them.
- Summarize context in the report instead of dumping the whole snapshot.

This optimization is proposed, not confirmed implemented. Moving changes under a nested `data["changes"]` key would change the current contract; update every specialist and the caller together, or preserve the current direct keys. Reuse already collected records where possible: fetching the same details again can add API requests.

Report size, token usage, API-call counts, latency, and cost reductions have not been measured. Smaller local reports do not establish API savings unless those reports or payloads are actually sent to a model. No successful live OpenAI reasoning is established by the refreshed evidence.

The implementation must operate under the existing [Management workflow](../00-Management/WORKFLOWS.md) and [agent communication protocol](../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md). Telegram is a notification channel; GitHub remains the durable work record. The prototype does not grant autonomous merge or deployment authority.

## Remaining work and verification

Module separation and a shared event/result contract now have recorded implementations. Remaining work includes compact payloads, topic-aware specialist filtering, the Test Agent, systemd scheduling, additional notification integrations, live OpenAI reasoning, and explicit permission/error-handling contracts.

Before treating the prototype as an unattended service, verify on the Raspberry Pi:

- A fresh or migrated baseline produces no historical flood.
- An unchanged run produces no new notification.
- Extend the recorded closure/reopening checks to new issues, edited issues, baseline migration, and polling gaps.
- PRs are classified separately and complete pagination is verified.
- A large change set produces bounded notification output.
- Each change invokes delivery once; failures remain observable and retryable.
- Missing credentials, GitHub/API failures, and malformed state do not silently overwrite a valid baseline.
- Mock output is clearly identified; live OpenAI output is validated separately.

Also test event filtering, deterministic rule replay, specialist isolation, and simulated API failures using local fixtures before live integration. Event replay is a proposed capability. Measure payload bytes and actual API requests before and after optimization; measure model tokens separately when live model access is available.

These remaining checks are not claimed as passed by this documentation PR.

## Appendix: Linux setup commands and variations from the original conversation

This appendix reconstructs the setup sequence from “Build Automated Agent Team” on 12 September 2026. Commands are grouped by stage and alternative; they are not one script to run from top to bottom. Shell prompts and chat escaping have been removed. Configuration and program files must contain the implementation described above before execution commands will work.

### What was observed versus proposed

- The user reported Debian 12.15 and Python 3.8.9 while a virtual environment was active. That output does not establish the version of the operating system's default interpreter.
- `which python3.11` returned `/usr/bin/python3.11`; `python3.11 --version` returned Python 3.11.2. A new project environment then used Python 3.11.
- The Python 3.8 installation attempt failed resolving `jiter>=0.10.0,<1`. The successful path used the already-installed Python 3.11, upgraded pip, and installed the dependencies.
- The recorded pip upgrade completed at 26.2.1. The conversation reported openai 3.13.0, PyGithub 2.10.0, and PyYAML 6.0.3 in the prepared environment. These are historical observations, not a dependency lock or recommended current versions.
- The chosen workspace was the existing Linux user `codex`'s home directory. The user could not run sudo. The `/opt` and dedicated-service-account alternatives require an administrator and were not the chosen setup.
- The systemd user service/timer instructions were proposed. The presence of `run-agent.sh` was shown later, but successful timer activation and unattended operation were not established in the retrieved evidence.

### Command reference

All `pip` commands below belong inside the activated project virtual environment. Choose the relevant alternative, and stop if a preceding setup command fails.

```bash
# 1. Inspect the host and available interpreter (as the runtime user).
python3 --version
cat /etc/debian_version
which python3.11
python3.11 --version

# 2A. Chosen workspace: home directory, no sudo required.
mkdir -p ~/jagports-lead-agent
cd ~/jagports-lead-agent

# 2B. Alternative only: administrator prepares an /opt workspace for codex.
sudo mkdir -p /opt/jagports-lead-agent
sudo chown -R codex:codex /opt/jagports-lead-agent
sudo -u codex bash
# In that user's shell, use /opt/jagports-lead-agent consistently.
# The remaining home-directory commands describe the chosen 2A path.

# 2C. Alternative only: administrator creates a dedicated service account.
sudo useradd --system --create-home --shell /usr/sbin/nologin jagports-agent
sudo mkdir /opt/jagports-lead-agent
sudo chown -R jagports-agent:jagports-agent /opt/jagports-lead-agent
# This account has a nologin shell; it is intended for a configured service.

# 3A. Original generic prerequisite proposal (administrator only).
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git
python3 --version
pip3 --version

# 3B. Conditional alternative if Python 3.11 is absent (administrator only).
# This was unnecessary on the recorded host: Python 3.11 already existed.
sudo apt update
sudo apt install python3.11 python3.11-venv

# 4A. Initial generic venv command from the conversation.
# Use only when python3 resolves to the intended interpreter.
cd ~/jagports-lead-agent
python3 -m venv venv
source venv/bin/activate

# 4B. Chosen Python 3.11 replacement path, instead of 4A.
# Exit an active environment before replacing the project venv.
deactivate
cd ~/jagports-lead-agent
# Original conversation: rm -rf venv
# Safer variation here: retain the old directory under an unused backup name.
mv venv venv-python38-backup
python3.11 -m venv venv
source venv/bin/activate
python --version

# 4C. Equivalent creation form proposed in the conversation, for a fresh path.
python3.11 -m venv ~/jagports-lead-agent/venv

# 5. Upgrade pip and install dependencies in the Python 3.11 environment.
python -m pip install --upgrade pip
pip --version
pip install openai PyGithub pyyaml
pip install python-dotenv
pip install python-telegram-bot
pip list

# Earlier equivalent package-by-package installation variation:
# pip install openai
# pip install PyGithub
# pip install pyyaml

# Dependency capture was proposed; a resulting lock was not verified.
pip freeze > requirements.txt

# Import check: the original used an interactive Python prompt.
python3
# At the Python prompt:
# import openai
# import github
# import yaml
# print("OK")
# exit()

# 6. Create the initial configuration and runtime directories.
mkdir -p ~/jagports-lead-agent/prompts
nano ~/jagports-lead-agent/config.yaml
cat ~/jagports-lead-agent/config.yaml
nano ~/jagports-lead-agent/.env
chmod 600 ~/jagports-lead-agent/.env
mkdir -p ~/jagports-lead-agent/reports
mkdir -p ~/jagports-lead-agent/state
cd ~/jagports-lead-agent
mkdir -p notifications

# 7. Conditional nano history-directory repair from the session.
mkdir -p ~/.local/share/nano
# If permission denied, first inspect ownership.
ls -ld ~/.local ~/.local/share
# Only an administrator, after confirming the incorrect root ownership
# of /home/codex/.local observed in that session:
sudo chown -R codex:codex /home/codex/.local
ls -ld /home/codex/.local
# Back as codex:
mkdir -p ~/.local/share/nano
nano ~/jagports-lead-agent/config.yaml

# 8. Original prototype execution and output checks.
cd ~/jagports-lead-agent
source venv/bin/activate
python agent.py
cat reports/lead_report.md
cat state/agent_state.json

# 9. Telegram setup/test variations; scripts must first be populated.
nano telegram_test.py
python telegram_test.py
# telegram_test.py used get_me(): bot identity/token check, not chat-ID discovery.
nano telegram_get_updates.py
python telegram_get_updates.py
# Send /start or /test to the bot first; get_updates reveals the chat ID.
nano telegram_test_send.py
python telegram_test_send.py
# The test sender sends a real message to the configured recipient.
nano telegram_notify.py
# Only when deliberately testing with no real pending notification:
echo "Jagports Lead Agent test notification" > notifications/pending_notification.txt
python telegram_notify.py

# 10. Modular migration and current execution.
mkdir -p core agents services
# Preserve agent.py as the working reference while populating the modules.
nano main.py
python main.py
python main.py && cat reports/lead_report.md

# 11. Checkpoint example from the conversation.
# Archive includes the workspace, potentially .env and other local credentials.
# Keep it private. Use a new filename for a new checkpoint.
cd ~
tar -czf jagports-lead-agent-three-agents-working.tar.gz jagports-lead-agent
ls -lh ~/jagports-lead-agent-three-agents-working.tar.gz

# 12. Proposed user-systemd setup; populate files with the examples below.
nano ~/jagports-lead-agent/run-agent.sh
chmod +x ~/jagports-lead-agent/run-agent.sh
~/jagports-lead-agent/run-agent.sh
mkdir -p ~/.config/systemd/user
nano ~/.config/systemd/user/jagports-lead-agent.service
nano ~/.config/systemd/user/jagports-lead-agent.timer
systemctl --user daemon-reload
systemctl --user enable --now jagports-lead-agent.timer
systemctl --user list-timers
systemctl --user start jagports-lead-agent.service
journalctl --user -u jagports-lead-agent.service -n 50
systemctl --user status jagports-lead-agent.service
```

The old environment in the first failure was shown under `/home/codex/venv`. Replacing `~/jagports-lead-agent/venv` does not replace that separate directory. Confirm the active environment and target path before migration. The backup variation above requires the destination name to be unused; it is an explicit documentation improvement over the destructive reset command in the original conversation.

An early suggestion included `python3.11-pip`; the later proposal used only `python3.11 python3.11-venv`. No successful installation of a `python3.11-pip` package was shown. Likewise, pyenv was mentioned as a user-local fallback, but no pyenv commands or completed setup were supplied. Neither should be presented as the path used on this host. The instruction throughout was to leave `/usr/bin/python3` and system services unchanged rather than switch the system interpreter.

### Configuration and credential variations

The initial `config.yaml` example was:

```yaml
agent:
  name: Jagports Lead

github:
  repository: jagports/jagports

polling:
  interval_minutes: 60
```

This setting alone does not establish a running scheduler. Later prototype code also used `openai.enabled` for analysis-mode selection.

The initial plan proposed shell environment exports; the implemented setup moved to `python-dotenv` and a protected local `.env`. The recorded variable names were `OPENAI_API_KEY`, `GITHUB_TOKEN`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`. The earliest planning name `TELEGRAM_TOKEN` was superseded by `TELEGRAM_BOT_TOKEN` in the sender code. Populate actual credentials locally; no values are reproduced here.

The credential check printed only whether each environment variable was present. A true result confirms loading, not API authentication. The nano ownership repair requires an administrator when `codex` cannot use sudo; the history warning could also be ignored while continuing to edit the project.

### Proposed wrapper and systemd files

The original `run-agent.sh` content was:

```bash
#!/bin/bash
cd /home/codex/jagports-lead-agent
source venv/bin/activate
python agent.py
```

For the modular implementation, the corresponding adaptation is to run `python main.py` instead. This is an adaptation for the documented current entry point, not evidence that the installed wrapper was changed. For a different user or the `/opt` alternative, adapt the wrapper and service paths consistently.

The proposed user service at `~/.config/systemd/user/jagports-lead-agent.service` was:

```ini
[Unit]
Description=Jagports Lead Agent

[Service]
Type=oneshot
WorkingDirectory=/home/codex/jagports-lead-agent
ExecStart=/home/codex/jagports-lead-agent/run-agent.sh
```

The proposed timer at `~/.config/systemd/user/jagports-lead-agent.timer` was:

```ini
[Unit]
Description=Run Jagports Lead Agent hourly

[Timer]
OnBootSec=5min
OnUnitActiveSec=1h

[Install]
WantedBy=timers.target
```

The earlier system-wide service alternatives named `/etc/systemd/system/jagports-lead.service` and later `/etc/systemd/system/jagports-lead-agent.service`; neither had a complete verified installation. User-service startup across logout/reboot was not demonstrated. Manual execution alongside a timer was identified as a possible cause of overlapping runs, so verify timer state before interpreting duplicate notifications.

### Backup variations and scope

The same tar command was used with checkpoint suffixes `split-working`, `event-working`, `agentresult-working`, `registry-working`, `multi-agent-working`, and `three-agents-working`. Those names record successive implementation stages, not interchangeable versions of the final runtime.

The modular migration also proposed `git checkout -b refactor/split-lead-agent` and, later, `mv agent.py legacy_agent.py`. These were alternatives conditional on a Git checkout and a tested migration; the later directory listing still showed `agent.py`. This appendix does not claim either operation was completed or provide a full source-code installer.
