# Jagports AI OS Lead Agent Setup

## Purpose and evidence

This implementation record documents the initial Raspberry Pi Lead Agent prototype and the proposed multi-script agent team.

[Issue #594 — Document Lead Agent setup and multi-script agent team architecture](https://github.com/jagports/jagports/issues/594)

Source: the implementation conversation “Build Automated Agent Team”, dated 12 September 2026, and the completed setup recorded in issue #594. This is a record of that session, not a fresh inspection of the Raspberry Pi or a production-readiness claim. The final user update reported that issue collection was working after the lazy-loading workaround; a complete final regression run was not captured.

## Environment and setup

The prototype workspace is `~/jagports-lead-agent` on a Raspberry Pi running Debian. It uses a Python 3.11 virtual environment, leaving the Debian system Python unchanged.

Installed packages recorded in the setup:

- `openai`
- `PyGithub`
- `PyYAML`
- `python-dotenv`
- `python-telegram-bot`

The main entry point is `agent.py`. Configuration is read from `config.yaml`; credentials are loaded separately through environment variables / local `.env` handling.

For the existing configured workspace, the manual execution used in the session is:

```bash
cd ~/jagports-lead-agent
source venv/bin/activate
python agent.py
```

These commands assume the prototype and its configuration already exist on the host. This documentation change does not install or publish the prototype source, pin package versions, or configure a service.

## Configuration and credentials

The configured agent name is Jagports Lead and the GitHub repository is `jagports/jagports`.

GitHub access uses `GITHUB_TOKEN`. OpenAI integration was attempted, but successful live analysis was not established in the session; local mock analysis allowed the remaining pipeline to be exercised. The later implementation selects analysis using `openai.enabled` in `config.yaml`. Mock mode is an explicit operating mode, not evidence that all live API failures automatically fall back safely.

Telegram communication uses the bot username `JagportsLeadBot`. The bot token, destination chat identifier, GitHub token, and OpenAI key remain in local credential/environment handling. No credential values belong in this document or the repository.

## Prototype components and files

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

The prototype has a main orchestration script and a separate notification sender. The specialist agent team described below has not yet been implemented by this work.

## GitHub collection and lifecycle tracking

GitHub API access to `jagports/jagports` was verified during setup. The first collector used a limited snapshot of open issues. Comparing only issue-number lists could identify additions and disappearances, but could not reliably distinguish closure, reopening, or removal.

Collection then moved to `state="all"`. Retaining the old `open_issue_numbers` comparison after this change caused a defect: a closed issue remained in the returned number set, so the comparison found no change.

The revised state model keys records by issue number and stores `title`, `state`, and `updated_at`. It compares explicit states between runs and records `new`, `closed`, and `reopened` changes. The later sample suppresses new-item alerts when establishing the first baseline. Existing state in the old format needs a deliberate baseline migration; preserve a backup before replacing it.

Limitations:

- Snapshot comparison detects changes visible between runs. If an issue closes and reopens between two polls, both snapshots can show open; full lifecycle history requires event/timeline tracking or webhooks.
- Storing `updated_at` does not by itself implement title, body, label, or comment change detection.
- The final performance workaround temporarily removed PR filtering. The collected records can therefore include pull requests, and the reported count must not be treated as a verified issue-only count.
- Full regression verification of the revised lifecycle model remains outstanding.

## Report and notification pipeline

The implemented flow described in the session is:

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

## Proposed multi-script agent team

This is future architecture from issue #594, not a deployed team.

| Role | Proposed responsibility |
|---|---|
| Lead Agent | Coordinate specialist work and consolidate findings. |
| GitHub Agent / watcher | Read issues, PRs, and repository state. |
| Documentation Agent | Review documentation consistency. |
| Deployment Agent | Review deployment state. |
| Test Agent | Review test status. |

Split the current main script into explicit modules or scripts with defined inputs, outputs, permissions, error handling, and communication contracts. Telegram is a notification channel; GitHub remains the durable work record.

The proposal must operate under the existing [Management workflow](../00-Management/WORKFLOWS.md) and [agent communication protocol](../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md). It does not grant autonomous merge or deployment authority.

## Remaining work and verification

The issue identifies module separation, systemd scheduling, additional email/messenger integrations, live OpenAI reasoning when API credits are available, and definition of agent permissions/communication as future work.

Before treating the prototype as an unattended service, verify on the Raspberry Pi:

- A fresh or migrated baseline produces no historical flood.
- An unchanged run produces no new notification.
- A new issue, closure, and reopening are classified correctly with a run between transitions.
- PRs are classified separately and complete pagination is verified.
- A large change set produces bounded notification output.
- Each change invokes delivery once; failures remain observable and retryable.
- Missing credentials, GitHub/API failures, and malformed state do not silently overwrite a valid baseline.
- Mock output is clearly identified; live OpenAI output is validated separately.

These are follow-up checks, not test results claimed by this documentation PR.
