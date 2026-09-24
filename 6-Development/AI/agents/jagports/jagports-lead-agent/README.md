# Jagports Lead Agent — README

This is the **human-oriented guide** to the Jagports Lead Agent: what currently runs, how to execute and inspect it, how to verify the Raspberry Pi timer, and where to find full operational instructions. Requirements and acceptance tests are maintained only in [SPEC_Agent_Lead.md](SPEC_Agent_Lead.md).

## Update this existing Pi installation from main

The Raspberry Pi workspace is an installed application, **not** a Git repository. After the updater has been merged to GitHub `main`, run its two-line bootstrap once as the unprivileged `codex` user:

```bash
curl -fsSLo /tmp/jagports-agent-update.py https://raw.githubusercontent.com/jagports/jagports/main/6-Development/AI/agents/jagports/jagports-lead-agent/scripts/update_from_main.py
python3 /tmp/jagports-agent-update.py
```

Later updates, deterministic/offline checks, one-shot execution, timer status and one-shot Telegram delivery all have short launchers in [OPERATIONS.md](OPERATIONS.md#raspberry-pi--update-and-run-exact-github-main). No Git checkout or sudo is required inside the agent workspace. The updater downloads one pinned `main` commit, validates it, backs up previous code/configuration and preserves private `.env`, virtualenv, state and reports. The upstream safe `config.yaml` replaces the installed configuration; restore only explicitly approved overrides from the private backup. The existing 585-minute timer is preserved; restarting it may invoke the updated agent promptly. This update mechanism does not itself enable paid calls or implement automatic Telegram delivery.

## Purpose and current limitation

This directory contains the current Jagports Lead Agent prototype implementation.

The implementation is a working deterministic event-processing and specialist-routing framework. It is not currently a production autonomous development agent system and it does not currently perform LLM-backed reasoning in the modular execution path.

Operator-tested OpenAI API access now supports the staged, budget-controlled advisory-agent development path. The current modular coordinator still runs deterministic specialists; model-backed hand-offs and an actual unattended end-to-end run require their own implementation and acceptance. Production autonomy and recurring expenditure remain subject to explicit authorization and existing review gates.

## Getting started

The working prototype runs as the unprivileged `codex` user on the Raspberry Pi. Use the installed virtual environment and the existing workspace; do not change live units, create a second scheduler or enable recurring API calls as part of a routine smoke test.

1. Review the [current capabilities](#current-capabilities) below to distinguish implemented deterministic processing from planned model-backed behavior.
2. For a one-shot **deterministic** run in the already installed workspace, execute:

   ```bash
   cd /home/codex/jagports-lead-agent
   ./venv/bin/python main.py
   ```

3. Inspect `reports/lead_report.md` and `state/agent_state.json`. Repeat the run only when a second lifecycle-comparison check is intended; an unchanged repository ordinarily produces no new/closed/reopened records.
4. For reusable diagnostics, one-shot API/Telegram tests and troubleshooting, follow [OPERATIONS.md](OPERATIONS.md). A standalone API result and a manually delivered message do not demonstrate integrated model-backed specialist processing.
5. For installed user-service and timer checks, use the [MyNode installation and verification guide](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md). Confirm an actual *timer-triggered* invocation through its journal and report rather than relying only on timer activation or a manually started service.

Keep local `.env` credentials out of the repository, copied shell output and notifications. Enable a paid or unattended pilot only after the relevant specification gates, budget and Product Owner authorization have been satisfied.

## Current capabilities

| Capability | Current state | Notes |
|---|---|---|
| Read GitHub Issue snapshots | Yes | GitHub data collection is implemented. |
| Persist repository Issue state | Yes | State is stored locally for comparison between runs. |
| Detect new / closed / reopened Issues | Yes | Deterministic lifecycle comparison is implemented. |
| Create internal Events | Yes | Lifecycle changes are passed through the shared `Event` contract. |
| Route one Event to multiple specialists | Yes | `AgentRegistry` invokes registered specialists. |
| Return standardized specialist results | Yes | Specialists return `AgentResult` objects. |
| Produce a Lead Agent report | Yes | Report generation is implemented. |
| Telegram notification support | Partial | Notification infrastructure exists; unattended delivery/retry behavior is not treated as production-verified. |
| Understand Issue semantics or intent | No | Specialists currently use simple Python lifecycle rules. |
| Decide whether an Issue is actually documentation/deployment/knowledge related | No | Current specialists react to lifecycle state, not semantic topic analysis. |
| Read Issue body/comments on demand and reason about them | No | No current specialist tool/reasoning loop performs this. |
| Reason across repository knowledge, workflows, Issues and PRs | No | The modular runtime does not currently invoke an LLM for specialist reasoning. |
| Plan implementation work | No | No implemented reasoning/planning agent converts Issues into development plans. |
| Modify code autonomously | No | The prototype does not act as an autonomous coding executor. |
| Review code semantically | No | No implemented reasoning-based PR review agent exists. |
| Enforce Jagports workflow semantically | No | Repository governance exists in project documentation, but the prototype does not reason over it. |
| LLM reasoning in current modular execution path | No | `services/openai_service.py` exists, but `main.py` / `LeadAgent` do not currently call it. |
| Production unattended agent service | No | The implementation remains a prototype/reference runtime. |

## Specialist behavior today

The specialist classes are deterministic rule processors.

Examples of the current behavior:

- `DocumentationAgent`: a new or closed Issue causes a recommendation to review documentation impact.
- `DeploymentAgent`: a new or closed Issue causes a recommendation to review deployment impact.
- `KnowledgeAgent`: a new, closed, or reopened Issue causes a recommendation to review knowledge impact.

These rules are useful for event routing and framework testing, but they do not establish semantic reasoning.

## Standalone OpenAI API smoke test

Reusable direct Responses API and wrapper smoke-test commands, their expected outputs, and the distinction between standalone connectivity and integrated reasoning are maintained in [Development OPERATIONS.md](OPERATIONS.md#direct-openai-responses-api-smoke-test). Historical operator-observed outcomes belong in the [implementation project record](../../../../../5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md). Successful connectivity does not prove model-backed specialist operation or an unattended service run.

## Lead Agent scheduling — intended 9h45min cadence

The host's existing `systemd --user` timer, not a `config.yaml` polling value, is the actual scheduling authority. The intended 585-minute interval and service installation/verification are maintained in [MyNode Deployment](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md). Reusable one-shot status and diagnostic commands belong in [Development OPERATIONS.md](OPERATIONS.md). An enabled timer and a successful manual service run do not prove that a later timer-triggered unattended run succeeded; verify that run from the journal, state and report.

## Current specialist and Telegram communication test

For the short saved-status Telegram delivery smoke test and its two-part acceptance criteria, see [TG-001 in Development OPERATIONS.md](OPERATIONS.md#telegram-message-delivery-acceptance-test--saved-issue-changes). For the separate **one-shot GitHub collection → specialist results → Telegram delivery** diagnostic, see [the integration test](OPERATIONS.md#one-shot-github--specialists--telegram-communication-test). The diagnostic fetches one Issue body separately to display real detail; the existing specialist Event still carries only the collected snapshot metadata and lifecycle delta. `main.py` currently generates a report but does **not** invoke Telegram or model-backed reasoning. Automatic specialist notifications and Issue-body-aware reasoning require later implementation.

## Where information belongs

| Reader's goal | Authoritative document |
|---|---|
| Human startup, current capabilities, usage sequence, navigation and limitations | This `README.md` |
| Functional contracts, event/model schemas, design, rollout stages, security and acceptance tests | [SPEC_Agent_Lead.md](SPEC_Agent_Lead.md) |
| Reusable shell commands, manual smoke tests, diagnostics and historical engineering command variants | [OPERATIONS.md](OPERATIONS.md) |
| Live Raspberry Pi user service, timer installation, user-bus recovery and host acceptance commands | [MyNode Deployment guide](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md) |
| Project rationale, operator-verified evidence and delivery dependencies | [Lead Agent implementation project](../../../../../5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md) |
| Actual source-backed research and unresolved evidence | The repository's established `7-Research/` semantic root |
| Governed Research-to-Decision multi-role extension | Its separate Development specification, after that proposal is reviewed and merged |
| Cross-project workflow, decision authority and agent responsibilities | [Management workflow](../../../../../00-Management/WORKFLOWS.md) and [agent roles](../../../../../0-DocumentationEducationCompetense/agents/AGENT_ROLES.md) |

`SPEC_Agent_Lead.md` and this README intentionally remain separate: technical requirements change through specification review, while human operation remains discoverable without scanning normative data contracts. The Operations and Deployment documents likewise remain distinct because portable test procedures are not the live host configuration.

## Governance and operational limits

GitHub is the durable system of record. The coordinator's current local report is execution evidence, not a substitute for documented decisions. No specialist presently has autonomous approval, repository write, merge or deployment authority. Use the canonical Management workflow for review and acceptance, and record operator evidence in the relevant governed work item rather than inventing success from installed configuration.
