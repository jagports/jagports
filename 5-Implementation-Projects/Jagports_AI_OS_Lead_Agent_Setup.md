# Jagports AI OS Lead Agent Setup

## Purpose and evidence

This implementation record documents the initial Raspberry Pi Lead Agent prototype and its evolution into a modular runtime with three specialist agents.

[Issue #594 — Document Lead Agent setup and multi-script agent team architecture](https://github.com/jagports/jagports/issues/594)

Source: the implementation conversation “Build Automated Agent Team”, dated 12 September 2026, and the completed setup recorded in issue #594. This is a record of that session, not a fresh inspection of the Raspberry Pi or a production-readiness claim. Evidence refreshed through the later modular-runtime work and the attached report generated at 2026-09-12T15:30:04.279643 (host timestamp). Recorded runs demonstrate closure/reopening detection and specialist results. A complete regression suite and live OpenAI analysis are not established.

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
