# Jagports Lead Agent — Development Command Reference

## Scope

Reusable engineering and diagnostic commands for the Jagports Lead Agent. These are **not** the MyNodeBTC installation procedure or the AI OS business case. Current module architecture is in [README.md](README.md); the Raspberry Pi installation belongs to [Deployment](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md); business context belongs to [the implementation project](../../../../../5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md).

**Command execution context:** SSH into the Linux host from any terminal, including Windows Git Bash. The shell prompt determines which Linux account executes the command. Do not paste multiple interactive `sudo` password prompts into a single block; keep secrets out of output and repository history.

## GitHub credentials — separate operator token and Lead Agent read-only token

**Issue [#927](https://github.com/jagports/jagports/issues/927): guided operator setup.** The existing `GITHUB_TOKEN` is the original credential and may carry write permissions. Do not revoke it, paste it into GitHub/chat, overwrite it, or test its write permissions. The **new, independent token** is named `GITHUB_TOKEN_RO` in the local private `.env`; it is specifically for repository-scoped read-only agent execution. The OpenAI API subscription and `OPENAI_API_KEY` are separate and do not authorize GitHub writes.

### GitHub UI — create `GITHUB_TOKEN_RO` (one verified step at a time)

1. Sign in to the intended GitHub token-owning account. Open [Personal access tokens — Fine-grained](https://github.com/settings/personal-access-tokens), choose **Generate new token**, and ensure this is **Fine-grained**, not **Tokens (classic)**. Confirm the creation form is available before continuing.
2. Use the confirmed token name `jagports-lead-agent-ro` and expiry 366 days and **Resource owner: `jagports` (confirmed by Product Owner)**. Under Repository access select **Only select repositories** and choose **`jagports/jagports` only** (confirmed by Product Owner). If organization approval is required, await approval before interpreting failed reads as permissions.
3. **Product Owner confirmed repository-permission setup:** **Metadata: Read** (automatically required), **Issues: Read** and **Contents: Read**. All other repository permissions remain **No access**, including Issues Write, Pull requests, Actions and Administration; all organization permissions remain **No access**. These are the owner-confirmed settings on the creation form, **not yet an issued or independently tested credential**. Inspect the permission summary before generating.
4. If GitHub says the token name is already taken, inspect the existing token first. Reuse it only if its permissions and ownership are verified and its value is securely available; otherwise revoke/delete **only that identified obsolete token** before proceeding. After deleting an obsolete token, return to the new-token form and recheck owner, repository, expiration and permissions; deletion does not create a replacement. Generate the token and capture it **only in the private Raspberry Pi `.env` file**, as `GITHUB_TOKEN_RO=...` owned by `codex` and readable only by that user (mode `0600`). Never place the token in a command argument, shell history, GitHub Issue/PR, screenshot, report or chat. Keep the original `GITHUB_TOKEN` and all existing secrets unchanged.
5. Perform the **one-shot** read/write-denial verifier below using `GITHUB_TOKEN_RO`, inspect redacted results and separately confirm repository/organization permissions in the GitHub UI. The existing verifier's Python input variable and actual `main.py` token selection must be changed and offline-tested under #927 before asserting that a paid pilot is using the new token. **A passing verifier alone must not authorize the paid pilot while runtime still reads `GITHUB_TOKEN`.**

**Guided setup evidence (Product Owner report):** The replacement fine-grained token `jagports-lead-agent-ro` has now been generated after deleting an earlier token with the same name. The owner confirmed resource owner `jagports`, selected repository `jagports/jagports`, 366-day expiry and Metadata/Contents/Issues Read-only settings before generation. The secret value has not been disclosed. **Pi installation was reported completed by the Product Owner:** `GITHUB_TOKEN_RO` was added to the private Raspberry Pi `.env`. The Product Owner subsequently confirmed a local, non-disclosing check: `.env` has mode `0600`, owner `codex`, and both `GITHUB_TOKEN_RO` and original `GITHUB_TOKEN` are present. The actual token bytes were not exposed. Any required organization approval, live permission verification, actual runtime credential selection and write-denial testing remain unverified. Subsequent operator steps must be marked completed only after confirmation; record only non-secret evidence in #927 and later documentation commits.

## P7 Batch 16.3 — dedicated GitHub read-only credential evidence

This is a **Raspberry Pi operator test**, not a GitHub connector test. The
dedicated `GITHUB_TOKEN_RO` must be different from any
write-capable personal/operator token. In its fine-grained token settings,
restrict repository access to **`jagports/jagports` only**, with Issues: Read
and Contents: Read (Metadata: Read is mandatory); all other writable
repository/organization permissions must be No access. Confirm the assigned
permissions in the GitHub UI independently. Do not infer them from the agent's
GET-only Python adapter or from the ChatGPT-connected GitHub account.

Use the approved PR #919 `scripts/verify_readonly_github.py` on the
`codex` workspace. This script does **two authenticated GETs** (identity and
Issue #904), then submits a deliberately invalid empty comment to test actual
Issue-comment write denial. No valid comment content is supplied. An
explicit permission-related 403 counts as write denial; 422, 201, 401, an
unrelated 403 or another ambiguous response **blocks** acceptance. A denial
of this endpoint proves that specific write prohibition only: the operator
must separately inspect all fine-grained permission settings.

1. As `admin` over SSH, verify that the approved verifier script has been
   copied into `/home/codex/jagports-lead-agent/scripts/` and is readable
   by `codex`; do not update/restart the installed service or timer to
   perform this test. Store the dedicated token in the private
   `/home/codex/jagports-lead-agent/.env` as
   `GITHUB_TOKEN_RO=...`, owned by `codex` with mode 0600.
   Do not display the token, set it in command arguments or include it in
   GitHub Issues.
2. Run the verifier as `codex` from that workspace; this command reads
   the private `.env`, saves only redacted fixed-field evidence, and exits
   nonzero on any ambiguous result:

   ```bash
   sudo -u codex bash -c '
   set -eu
   cd /home/codex/jagports-lead-agent
   umask 077
   test -f scripts/verify_readonly_github.py
   mkdir -p state
   ./venv/bin/python -c '"'"'
   from dotenv import load_dotenv
   load_dotenv(".env")
   from scripts.verify_readonly_github import main
   raise SystemExit(main())
   '"'"' > state/p7_readonly_credential_evidence.json
   '
   ```

3. Inspect only the redacted JSON and its `result`. Record its UTC
   timestamp, the verifier's PR commit and the separately inspected
   fine-grained permissions in Issue #909. Report `verified` only if
   identity and Issue reads succeeded, the empty-comment request received
   an explicit permission denial, and repository permissions match the
   read-only policy. Never attach `.env`, response headers, raw HTTP
   payloads, an access token or an identity dump.
4. Only after independently checking the actual Pi token and storing
   evidence may the operator change the local **pilot-specific**
   `read_only_credential_confirmed` setting to `true`. Keep
   `p7.enabled: false`, `openai.enabled: false`, the Issue allowlist
   empty and the 585-minute timer unchanged until a separately configured,
   capped manual pilot is ready.

Repository CI mocks this network sequence and confirms fail-closed behavior;
it **cannot** prove the Raspberry Pi's current token permissions. If the
script is not yet installed or the dedicated token is missing, record
`Batch 16.3: host blocked`, not `verified`. Do not substitute an
operator's write-capable GitHub token or attempt an actual valid write.

## Python cache ownership — operator check before the credential test

**Observed during #927 walkthrough:** the new `scripts/verify_readonly_github.py` was downloaded on the Raspberry Pi, and `grep` confirmed it reads `GITHUB_TOKEN_RO`. Running `./venv/bin/python -m py_compile scripts/verify_readonly_github.py` as `codex` returned `Permission denied: scripts/__pycache__`. The owner then verified the downloaded script with a **no-write** `ast.parse()` check, which printed `Verifier syntax: PASS`. This confirms syntax, **not** the GitHub credential or installed file ownership.

Check the actual ownership and mode **before** changing or removing any files:

```bash
cd /home/codex/jagports-lead-agent
id -un
stat -c '%a %U:%G %n' scripts scripts/__pycache__ 2>/dev/null || true
find scripts -maxdepth 2 -name '__pycache__' -type d -exec stat -c '%a %U:%G %n' {} +
```

**Observed ownership result, reported by Product Owner:** `id -un` returned `codex`; `scripts` is `755 root:root`; `scripts/__pycache__` does **not** exist. Python cannot create the cache because `codex` cannot write to the root-owned `scripts` directory. There are no generated cache files to remove. The administrator should correct ownership of **that directory alone**, using `sudo chown codex:codex /home/codex/jagports-lead-agent/scripts` (no `-R`), then verify `scripts` is `755 codex:codex` and run the syntax compilation as `codex`. Do not use `chmod 777`, delete caches that do not exist, or change `.env` ownership.

**Owner-confirmed directory repair (2026-09-23):** Administrator executed `sudo chown codex:codex /home/codex/jagports-lead-agent/scripts` and read back `755 codex:codex /home/codex/jagports-lead-agent/scripts`. Directory ownership is verified; subsequent compilation as `codex` and GitHub credential permission testing are separate, still-pending checks.

Project Python commands must execute as the unprivileged `codex` runtime user; an administrator may manage the user-service configuration but must **not** invoke project Python with `sudo python` or create root/admin-owned bytecode in the `codex` workspace. For a **confirmed root/admin-owned, generated `scripts/__pycache__` only**, use an administrator account to restore that directory's ownership to `codex`, after inspecting its contents. Never recursively change the entire project or `.env` ownership on the assumption that every file is generated. If ownership cannot be established, retain the no-write syntax verification and escalate to the operator.

A safer syntax check that never writes `__pycache__` is:

```bash
cd /home/codex/jagports-lead-agent
./venv/bin/python - <<'PY'
import ast
from pathlib import Path
ast.parse(Path("scripts/verify_readonly_github.py").read_text(encoding="utf-8"))
print("Verifier syntax: PASS")
PY
```

The one-shot GitHub verifier remains **pending** until local permissions are reviewed and its read-only credential is tested. Do not restart the timer, activate paid OpenAI calls or run the write-denial probe with the original potentially write-capable token.

## Reusable runtime checks

From the non-privileged runtime user's shell when the Lead Agent is already installed:

```bash
set -e
cd ~/jagports-lead-agent
source venv/bin/activate
python main.py
python main.py
```

The second run should normally report empty lifecycle changes unless GitHub changed between runs. An initial large delta is expected after a long polling gap and does not itself prove a state failure. Review `reports/lead_report.md` and `state/agent_state.json`; no model-backed specialist call occurs in the present modular runtime.

## Direct OpenAI Responses API smoke test

Requires the installed project virtual environment, a local `.env` containing `OPENAI_API_KEY`, API access and authorized usage billing. This **does not test** model-backed specialist integration or systemd scheduling.

```bash
set -e
cd ~/jagports-lead-agent
source venv/bin/activate
python -c 'from dotenv import load_dotenv; from openai import OpenAI; load_dotenv(); r=OpenAI().responses.create(model="gpt-5.6", input="Reply with exactly: JAGPORTS API TEST OK"); print(r.output_text)'
```

Expected output: `JAGPORTS API TEST OK`. This exact result was reported by the Raspberry Pi operator. Model availability and cost are operational inputs; recheck before repeating a paid test.

## Direct wrapper test — separate from the coordinator

`services/openai_service.py` implements `analyse(text)`, but the current `main.py` does not invoke it. Testing it incurs an API call:

```bash
set -e
cd ~/jagports-lead-agent
source venv/bin/activate
python -c 'from dotenv import load_dotenv; load_dotenv(); from services.openai_service import analyse; print(analyse("Reply with exactly: JAGPORTS AGENT API OK"))'
```

The operator reported `JAGPORTS AGENT API OK` from the existing wrapper using an **explicit** `.env` path. For Python executed via standard input, bare `load_dotenv()` can fail during path discovery; pass `load_dotenv("/home/codex/jagports-lead-agent/.env")` instead. A successful wrapper call does not verify OpenAI Agents SDK orchestration, GitHub semantics or production autonomy.

## Telegram message-delivery acceptance test — saved Issue changes

**Test ID:** TG-001. **Scope:** the existing `services.telegram_service.notify()` delivery path, using real saved lifecycle results. This test does **not** fetch GitHub again, invoke specialists, or consume OpenAI API credits.

**Preconditions:** the Raspberry Pi agent workspace exists under `/home/codex/jagports-lead-agent`; the virtual environment includes `python-dotenv` and the Telegram client; local `.env` has `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`; `state/agent_state.json` was written by a preceding agent run. Do not print tokens or chat IDs.

**Execution:** from an `admin@mynode-sby` SSH session, execute this single, self-contained command:

```bash
sudo -u codex bash -c 'cd /home/codex/jagports-lead-agent && ./venv/bin/python -c '"'"'import json; from dotenv import load_dotenv; load_dotenv(".env"); from services.telegram_service import notify; changes=json.load(open("state/agent_state.json"))["changes"]; message="Jagports Issue changes:\\n"+str(changes); notify(message); print(message, "\\nTelegram sent")'"'"''
```

**Acceptance criteria (both required):**

1. The command exits successfully and prints `Telegram sent`, with the exact saved `new`, `closed`, and `reopened` values (compare with `state/agent_state.json`). On an exception, record the error without exposing credentials.
2. The configured recipient actually receives **one** Telegram message containing those same saved values. An API call returning successfully is insufficient if the recipient has not confirmed delivery.

**Edge cases and boundaries:** an empty change set `{'new': [], 'closed': [], 'reopened': []}` is a valid delivery test; it does not prove GitHub change detection. A missing state file, invalid bot token, invalid chat ID, blocked bot or network error is a failed/precondition-blocked test, not a pass. Repeating this manual command sends another message; do not mistake it for automatic delivery from `main.py`.

**Evidence to capture:** command exit status, redacted terminal output, a human confirmation or screenshot of the received message, the matching saved change values, and test date/time. For future executions, do not claim success without the terminal output and recipient confirmation. For a separate current-GitHub collection → specialists → Telegram diagnostic, use the longer test below.

**Operator-reported result, 23 September 2026 — TG-001 PASS:** The command completed and printed `Telegram sent: Jagports Issue changes: {'new': [], 'closed': [], 'reopened': []}`; the operator independently confirmed that the Telegram message arrived. This verifies manual delivery of a valid empty saved change set, **not** automatic service-triggered notifications or delivery of a nonempty change set. Record later end-to-end nonempty/automatic delivery as separate tests.



## One-shot GitHub → specialists → Telegram communication test

Run this **as `admin` over SSH to MyNode**, including from Windows Git Bash. It invokes the installed `codex` Python environment, reads the local `.env` explicitly, fetches the current GitHub snapshot, displays a few open records and the full title/body of one current open **Issue**, invokes all three deterministic specialists, saves the standard report, and sends a concise test summary through the existing `telegram_service.notify()` function. It sends **one real Telegram message**; rerunning sends another. It does **not** make an OpenAI API call.

```bash
sudo -u codex bash <<'EOF'
set -e
cd /home/codex/jagports-lead-agent
./venv/bin/python - <<'PY'
import os
from dotenv import load_dotenv

load_dotenv("/home/codex/jagports-lead-agent/.env")
from services.github_service import GitHubService
from services.telegram_service import notify
from agents.lead_agent import LeadAgent
from services.report_service import create_report, save_report

github = GitHubService(os.environ["GITHUB_TOKEN"], "jagports/jagports")
issues, event, results = LeadAgent(github).run()
save_report(create_report(issues, event.data, results, event.context))

opened = sorted(
    (item for item in issues if item["state"] == "open"),
    key=lambda item: item["number"],
    reverse=True,
)
print("LATEST OPEN GITHUB RECORDS (Issues and possibly PRs):")
for item in opened[:5]:
    print("#{} {}".format(item["number"], item["title"]))
print("CHANGES:", event.data)
print("SPECIALIST RESULTS:")
for result in results:
    print(result.to_dict())

# Diagnostic detail lookup: the current collector does not pass Issue bodies to specialists.
sample = None
for item in opened[:20]:
    full = github.repo.get_issue(item["number"])
    if full.pull_request is None:
        sample = full
        break
if sample:
    print("SAMPLE ISSUE DETAIL: #{} {}".format(sample.number, sample.title))
    print((sample.body or "(no body)")[:1200])
else:
    print("No open Issue found among the newest 20 records.")

message = (
    "JAGPORTS COMMUNICATION TEST\n"
    "Open GitHub records: {}\n".format(len(opened))
    + "Sample Issue: {}\n".format(
        "#{} {}".format(sample.number, sample.title[:100]) if sample else "none in sample"
    )
    + "Specialists: {}\n".format(", ".join(
        "{}={}".format(item.to_dict().get("agent", item.to_dict().get("agent_name", "specialist")),
                         item.to_dict().get("status", "result"))
        for item in results
    ))
    + "Manual test only; report saved locally."
)
notify(message)
print("TELEGRAM: send completed")
PY
EOF
```

**Pass criteria:** the terminal displays collected open records, an actual Issue's title/body, three structured specialist results, and `TELEGRAM: send completed`; the configured Telegram chat receives the message. The saved report is `~/jagports-lead-agent/reports/lead_report.md`. If Telegram credentials are missing or delivery fails, the test exits with an error rather than silently reporting success. This diagnostic execution updates the normal local lifecycle state, so a later scheduled run will not re-report those same changes.

**Operator-reported manual integration result, 23 September 2026 — INT-001 PASS (subset):** A simplified one-shot script called `LeadAgent.run()` against live GitHub, saved the report, printed `Changes: {'new': [903, 902, 901], 'closed': [], 'reopened': []}`, printed structured results from all three deterministic specialists (`documentation`, `deployment`, `knowledge`; each `severity: review`), and completed `notify(message)`. The operator confirmed receiving the Telegram message `JAGPORTS AGENT TEST / Open GitHub records: 86 / Specialists executed: 3 / Report: lead_report.md`. This verifies **manual GitHub collection → lifecycle comparison → rule-based specialist routing → report creation → Telegram delivery**. It does not verify full Issue-body retrieval by that simplified script, semantic model reasoning, automatic timer-triggered Telegram delivery, or sending actual Issue-change recommendations in the Telegram message. The `new` list included PR #903, confirming that Issues/PR classification still needs correction before paid reasoning.

**Important limitations:** `GitHubService.get_issues()` currently collects only number/title/state/updated_at and can include PRs. The sample Issue's body above is fetched **separately for inspection**, **not** passed into the specialist `Event`. `AgentRegistry` passes lifecycle changes and snapshot metadata to three rule-based specialists; `main.py` imports Telegram's `notify` but does not call it. This one-shot diagnostic calls `notify` explicitly. A direct OpenAI wrapper test is separate; there is no SDK-backed semantic specialist or automatic Telegram delivery in the current modular pipeline.

## Portable user-systemd inspection from an administrative SSH shell

On a Linux host with systemd, if the service owner has an active user manager but the administrative shell belongs to another account, target the service user's own bus. Substitute the service user when not `codex`:

```bash
set -e
CUID=$(id -u codex)
sudo systemctl is-active "user@${CUID}.service"
sudo ls -l "/run/user/${CUID}/bus"
sudo -u codex env XDG_RUNTIME_DIR="/run/user/${CUID}" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/${CUID}/bus" systemctl --user list-timers --all
```

`Failed to connect to bus: No medium found` means the selected shell has no reachable user bus, not that Windows Git Bash lacks systemd. The service user's account must not be granted sudo solely to work around this. Host-specific installation, lingering and bus recovery are in the Deployment document.

## Verification vocabulary

- **Direct API PASS:** the exact direct model response was returned.
- **Manual pipeline PASS:** `main.py` exits normally and expected lifecycle changes/report are inspected.
- **User service PASS:** the systemd service reports `Result=success`, `ExecMainStatus=0`.
- **Timer configured:** the timer is enabled/active and a next activation exists.
- **Unattended timer PASS:** a *subsequent actual timer-triggered* service run is confirmed by journal/report timestamps; a manual `systemctl start` is not sufficient.
- **Reasoning specialist PASS:** a changed, relevant Issue yields a model-derived structured `AgentResult` via the integrated SDK service, with usage tracking. This is a future implementation criterion.

## Historical engineering commands (reference only)

The following material preserves the original prototype's command variants, investigations and unverified alternatives. **It is not a single copy-paste installer.** Some paths, Python environments, original `agent.py` entry points and timer intervals are superseded. Use the canonical Deployment procedure for the live MyNode host and this file's tested commands for current checks.

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

The superseded prototype hourly timer example is intentionally omitted: it is not an installation or troubleshooting template. Use the current 9h45min timer in the canonical [MyNode Deployment procedure](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md), and inspect the installed unit and drop-ins before assuming it matches the repository.

The earlier system-wide service alternatives named `/etc/systemd/system/jagports-lead.service` and later `/etc/systemd/system/jagports-lead-agent.service`; neither had a complete verified installation. User-service startup across logout/reboot was not demonstrated. Manual execution alongside a timer was identified as a possible cause of overlapping runs, so verify timer state before interpreting duplicate notifications.

### Backup variations and scope

The same tar command was used with checkpoint suffixes `split-working`, `event-working`, `agentresult-working`, `registry-working`, `multi-agent-working`, and `three-agents-working`. Those names record successive implementation stages, not interchangeable versions of the final runtime.

The modular migration also proposed `git checkout -b refactor/split-lead-agent` and, later, `mv agent.py legacy_agent.py`. These were alternatives conditional on a Git checkout and a tested migration; the later directory listing still showed `agent.py`. This appendix does not claim either operation was completed or provide a full source-code installer.

