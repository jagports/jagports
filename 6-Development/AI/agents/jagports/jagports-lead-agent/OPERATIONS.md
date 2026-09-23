# Jagports Lead Agent — Development Command Reference

## Scope

Reusable engineering and diagnostic commands for the Jagports Lead Agent. These are **not** the MyNodeBTC installation procedure or the AI OS business case. Current module architecture is in [README.md](README.md); the Raspberry Pi installation belongs to [Deployment](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md); business context belongs to [the implementation project](../../../../../5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md).

**Command execution context:** SSH into the Linux host from any terminal, including Windows Git Bash. The shell prompt determines which Linux account executes the command. Do not paste multiple interactive `sudo` password prompts into a single block; keep secrets out of output and repository history.

## Agent update from reviewed main — codex-owned Raspberry Pi workspace

**Audience:** the operator updating the existing \`mynode-sby\` application, not installing a new host. The live installation is \`/home/codex/jagports-lead-agent\` and its Python environment and files are owned by \`codex\` (previously observed UID 1008). Host account and first-time systemd setup belong in the [canonical MyNode Deployment guide](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md). This procedure updates **only already merged \`main\`**: open architecture/specification PRs are not installed automatically. Confirm that a reviewed release is ready before updating the scheduled host.

**Account and password rule:** SSH into the host as \`admin\`, then run \`sudo -v\` **once in that interactive shell**. \`sudo -u codex -H bash\` uses \`admin\`'s authorized sudo access; it does **not** request or require the \`codex\` password. Do not use \`su codex\`; never run \`git\`, \`rsync\`, \`pip\`, \`main.py\`, Python compilation or tests as \`admin\` in the agent workspace. If \`admin\` cannot use sudo, stop and ask the host administrator for authorized access. Do not alter the account password or grant \`codex\` sudo to work around this.

### A. Preflight and update as codex

From an \`admin@mynode-sby\` SSH session run \`sudo -v\` separately, then paste the block below. The application may be a copied installation without a \`.git\` folder, so use a temporary **\`codex\`-owned sparse clone** instead of \`git pull\` inside it. No \`.env\`, virtual environment, state or reports are uploaded, printed or overwritten. The private backup intentionally excludes the credential file and virtual environment; both remain in place. The existing local \`config.yaml\` is backed up, then replaced with the merged, **disabled-by-default** template; reconcile any legitimate local settings separately under the pilot's own approval gates.

The download and preflight happen **before stopping the timer**. If an update/test fails after the timer is stopped, **leave it stopped** until repaired or restored; do not silently restart a broken scheduled installation.

\`\`\`bash
# Run interactively as admin, separately, so sudo does not consume heredoc input.
sudo -v
sudo -u codex -H id

sudo -u codex -H bash <<'CODEX'
set -euo pipefail
umask 077
test "$(id -un)" = codex || { echo "Wrong user"; exit 1; }

APP=/home/codex/jagports-lead-agent
SUB=6-Development/AI/agents/jagports/jagports-lead-agent
STAGE=$(mktemp -d /home/codex/jagports-update.XXXXXX)
BACKUP=$(mktemp -d /home/codex/jagports-backup.XXXXXX)
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"

test -d "$APP" && test -w "$APP"
test -f "$APP/.env" && test -x "$APP/venv/bin/python"
test -S "$XDG_RUNTIME_DIR/bus"
command -v git
command -v rsync
"$APP/venv/bin/python" -c \
  'import github, yaml, dotenv, openai; print("Python dependencies OK")'

git clone --depth 1 --filter=blob:none --sparse --branch main \
  https://github.com/jagports/jagports.git "$STAGE"
git -C "$STAGE" sparse-checkout set "$SUB"
test -f "$STAGE/$SUB/main.py"
echo "Selected main commit:"
git -C "$STAGE" rev-parse HEAD

# Reject an unexpectedly enabled checked-in release before changing the host.
"$APP/venv/bin/python" - "$STAGE/$SUB/config.yaml" <<'PY'
import sys, yaml
with open(sys.argv[1], encoding="utf-8") as handle:
    c = yaml.safe_load(handle)
assert c["openai"]["enabled"] is False
assert c["p7"]["enabled"] is False
assert c["p7"]["reasoning"]["enabled"] is False
assert c["p7"]["allowed_issue_numbers"] == []
assert c["polling"]["interval_minutes"] == 585
print("Release defaults verified: no paid execution")
PY

# Stop only the existing codex timer; do not update a running process.
systemctl --user stop jagports-lead-agent.timer
if systemctl --user is-active --quiet jagports-lead-agent.service; then
  echo "Service still running; leave timer stopped and retry when it exits."
  exit 1
fi

# Backup is private and codex-owned; no duplicate .env or venv.
rsync -a \
  --exclude='/venv/' --exclude='/.env' --exclude='/.git/' \
  --exclude='__pycache__/' --exclude='*.pyc' \
  "$APP/" "$BACKUP/"

# Install files as codex. Preserve local secrets and durable runtime data.
rsync -a \
  --exclude='/venv/' --exclude='/.env' --exclude='/.git/' \
  --exclude='/config.yaml' --exclude='/state/' --exclude='/reports/' \
  --exclude='/issues_snapshot.txt' --exclude='/agent_status.json' \
  --exclude='__pycache__/' --exclude='*.pyc' \
  "$STAGE/$SUB/" "$APP/"
install -m 600 "$STAGE/$SUB/config.yaml" "$APP/config.yaml"

cd "$APP"
./venv/bin/python -m compileall -q agents core services tests main.py
./venv/bin/python -m unittest discover -s tests -p 'test_*.py' -q

echo "Offline update and tests PASS; paid execution remains disabled."
echo "Private backup: $BACKUP"
echo "Downloaded source: $STAGE"
echo "Timer intentionally remains stopped pending the service check below."
CODEX
\`\`\`

If dependency preflight fails, **do not switch to \`sudo pip\`**. Inspect the existing \`codex\` virtual environment and install only approved missing dependencies using \`/home/codex/jagports-lead-agent/venv/bin/python -m pip\` as \`codex\`, then repeat the update.

### B. Existing admin-owned cache repair, only if required

If earlier \`admin\` Python runs left inaccessible \`__pycache__\` directories, identify the affected paths in the **admin** shell before repairing. The following only changes owners inside Python cache directories under the application and excludes \`venv/\`; do not recursively \`chown\` the home directory, virtual environment or unrelated MyNode services.

\`\`\`bash
APP=/home/codex/jagports-lead-agent
sudo find "$APP" -path "$APP/venv" -prune -o \
  -type d -name '__pycache__' -print
# After inspecting this path list, repair only these application caches:
sudo find "$APP" -path "$APP/venv" -prune -o \
  -type d -name '__pycache__' -exec chown -R codex:codex {} +
\`\`\`

All subsequent Python compilation, testing and runtime invocations still run as \`codex\`.

### C. Verify the installed user service, then resume the existing timer

From the **admin** shell, run this separate \`codex\` block **only after section A passed**. It does not reconfigure the systemd unit, change credentials or create a new scheduler. Starting the existing timer with \`OnActiveSec=1s\` causes a near-immediate first deterministic run; subsequent runs use \`OnUnitActiveSec=9h45min\`. Inspect the *effective* unit and any drop-ins against the MyNode guide before starting it.

\`\`\`bash
sudo -u codex -H bash <<'CODEX'
set -euo pipefail
APP=/home/codex/jagports-lead-agent
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
cd "$APP"

./venv/bin/python - <<'PY'
import yaml
with open("config.yaml", encoding="utf-8") as handle:
    c = yaml.safe_load(handle)
assert c["openai"]["enabled"] is False
assert c["p7"]["enabled"] is False
assert c["p7"]["reasoning"]["enabled"] is False
assert c["p7"]["allowed_issue_numbers"] == []
print("PASS: paid Research/Product pipeline disabled")
PY

systemctl --user cat jagports-lead-agent.service
systemctl --user cat jagports-lead-agent.timer
# Stop and inspect if the effective timer shows OnBootSec or unexpected drop-ins.
systemctl --user start jagports-lead-agent.service
systemctl --user show jagports-lead-agent.service \
  -p Result -p ExecMainStatus
stat -c '%y %U:%G %n' \
  reports/lead_report.md state/agent_state.json
# Review successful Result=success and ExecMainStatus=0 above before resuming.
systemctl --user start jagports-lead-agent.timer
systemctl --user list-timers --all
systemctl --user show jagports-lead-agent.timer \
  -p LastTriggerUSec -p TimersMonotonic -p DropInPaths
journalctl --user -u jagports-lead-agent.service -n 40 --no-pager
CODEX
\`\`\`

**Rollback / blocked update:** if the code, offline tests, service or effective timer checks fail, stop the **Lead Agent timer only**, keep \`p7\` and \`openai\` disabled, and preserve the exact \`STAGE\` and \`BACKUP\` paths printed above. From an authorized \`codex\` shell, inspect the private backup and copy the approved prior application files back with \`rsync -a\` excluding \`venv/\`, \`.env\`, \`state/\` and \`reports/\`; restore the prior \`config.yaml\` only after verifying its paid-execution gates. Do **not** use an unreviewed blanket \`--delete\` against the live workspace. Diagnose any new paths left by the failed update and remove only confirmed obsolete files. Re-run compilation, offline tests and a manual service check before restarting the timer.

**Evidence and scope:** record the exact main commit, offline test result, service exit result, resulting file owners, private backup location and last/next timer activation without credentials. A newly installed file is not evidence of a later unattended 585-minute run; verify its journal and report separately. This routine update does not enable model calls, automatic Telegram, autonomous GitHub writes, the unmerged two-team architecture, or an additional timer.

## P7 Batch 16.3 — dedicated GitHub read-only credential evidence

This is a **Raspberry Pi operator test**, not a GitHub connector test. The
dedicated `JAGPORTS_READONLY_GITHUB_TOKEN` must be different from any
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
   `JAGPORTS_READONLY_GITHUB_TOKEN=...`, owned by `codex` with mode 0600.
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

