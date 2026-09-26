# Jagports Lead Agent — README

This is the **human-oriented guide** to the Jagports Lead Agent: what currently runs, how to execute and inspect it, how to verify the Raspberry Pi timer, and where to find full operational instructions. Requirements and acceptance tests are maintained only in [SPEC_Agent_Lead.md](SPEC_Agent_Lead.md).

## Purpose and current limitation

This directory contains the current Jagports Lead Agent prototype implementation.

The implementation retains the original Lead, Documentation, Deployment and Knowledge agent roles and their design scope. It is a prototype, not a production autonomous development system. Deterministic routing is the default; a bounded Documentation-agent reasoning path is available only with explicit local opt-in.

The Deployment and Knowledge agents remain registered and deterministic until their own role-specific reasoning prompts and tests are reviewed. No capability or design responsibility of those original roles is removed by this implementation. Production autonomy and recurring expenditure remain subject to explicit authorization and existing review gates.

## Getting started

The working prototype runs as the unprivileged `codex` user on the Raspberry Pi. Use the installed virtual environment and the existing workspace; do not change live units, create a second scheduler or enable recurring API calls as part of a routine smoke test.

1. Review the [current capabilities](#current-capabilities) below. Keep paid reasoning and Telegram disabled unless the one-shot acceptance gates are explicitly approved.
2. For a one-shot **deterministic** run in the already installed workspace, execute:

   ```bash
   cd /home/codex/jagports-lead-agent
   ./venv/bin/python main.py
   ```

3. Inspect `reports/lead_report.md` and `state/agent_state.json`. Repeat the run only when a second lifecycle-comparison check is intended; an unchanged repository ordinarily produces no new/closed/reopened records.
4. For reusable diagnostics and troubleshooting, follow [OPERATIONS.md](OPERATIONS.md). A standalone API result and a manually delivered message do not demonstrate an accepted unattended run.
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
| Telegram notification support | Partial | A durable outbox and bounded delivery retries are implemented, disabled by default and not host-accepted. |
| Understand Issue semantics or intent | No | Specialists currently use simple Python lifecycle rules. |
| Decide whether an Issue is actually documentation/deployment/knowledge related | No | Current specialists react to lifecycle state, not semantic topic analysis. |
| Read Issue body/comments on demand and reason about them | Partial | The existing bounded Issue-enrichment path can supply complete, approved context to DocumentationAgent; paid reasoning is disabled by default. |
| Reason across repository knowledge, workflows, Issues and PRs | Planned | Full cross-source reasoning remains a design requirement, not a proven runtime capability. |
| Plan implementation work | No | No implemented reasoning/planning agent converts Issues into development plans. |
| Modify code autonomously | No | The prototype does not act as an autonomous coding executor. |
| Review code semantically | No | No implemented reasoning-based PR review agent exists. |
| Enforce Jagports workflow semantically | No | Repository governance exists in project documentation, but the prototype does not reason over it. |
| LLM reasoning in current modular execution path | Gated | `main.py` can pass a shared cost-ledger-backed reasoning service to DocumentationAgent for one approved Issue/revision. Deployment and Knowledge retain their original roles and require separate review before model-backed execution. |
| Production unattended agent service | No | The implementation remains a prototype/reference runtime. |

## Specialist behavior today

The three original specialists remain registered. Their deterministic behavior remains available when paid reasoning is disabled.

Examples of the current behavior:

- `DocumentationAgent`: a new or closed Issue causes a recommendation to review documentation impact.
- `DeploymentAgent`: a new or closed Issue causes a recommendation to review deployment impact.
- `KnowledgeAgent`: a new, closed, or reopened Issue causes a recommendation to review knowledge impact.

DocumentationAgent also has a source-bound, opt-in reasoning path for an allowlisted Issue and one-shot authorized `/ask` questions. Those additions do not narrow the other agents' design scope.

## Standalone OpenAI API smoke test

Reusable direct Responses API and wrapper smoke-test commands are maintained in [Development OPERATIONS.md](OPERATIONS.md#direct-openai-responses-api-smoke-test). Historical operator-observed outcomes belong in the [implementation project record](../../../../../5-Implementation-Projects/AGENT_SETUP.md). Successful connectivity does not prove an unattended service run.

## Lead Agent scheduling — intended 9h45min cadence

The host's existing `systemd --user` timer, not a `config.yaml` polling value, is the actual scheduling authority. The intended 585-minute interval and service installation/verification are maintained in [MyNode Deployment](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md). Reusable one-shot status and diagnostic commands belong in [Development OPERATIONS.md](OPERATIONS.md). An enabled timer and a successful manual service run do not prove that a later timer-triggered unattended run succeeded; verify that run from the journal, state and report.

## Current specialist and Telegram communication test

For the saved-status Telegram smoke test, see [TG-001 in Development OPERATIONS.md](OPERATIONS.md#telegram-message-delivery-acceptance-test--saved-issue-changes). The runtime now has an opt-in report-to-outbox-to-Telegram path and a separate one-shot `python -m scripts.ask_once` receiver. Both are disabled by default. Configure `TELEGRAM_CHAT_ID` and `TELEGRAM_ALLOWED_SENDER_ID` privately for `/ask`; only the configured sender and chat can reach the paid Documentation-agent path. Do not enable unattended operation without live host acceptance.

## Where information belongs

| Reader's goal | Authoritative document |
|---|---|
| Human startup, current capabilities, usage sequence, navigation and limitations | This `README.md` |
| Functional contracts, event/model schemas, design, rollout stages, security and acceptance tests | [SPEC_Agent_Lead.md](SPEC_Agent_Lead.md) |
| Reusable shell commands, manual smoke tests, diagnostics and historical engineering command variants | [OPERATIONS.md](OPERATIONS.md) |
| Live Raspberry Pi user service, timer installation, user-bus recovery and host acceptance commands | [MyNode Deployment guide](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md) |
| Project rationale, operator-verified evidence and delivery dependencies | [Lead Agent implementation project](../../../../../5-Implementation-Projects/AGENT_SETUP.md) |
| Actual source-backed research and unresolved evidence | The repository's established `7-Research/` semantic root |
| Cross-project workflow, decision authority and agent responsibilities | [Management workflow](../../../../../00-Management/WORKFLOWS.md) and [agent roles](../../../../../0-DocumentationEducationCompetense/agents/AGENT_ROLES.md) |

`SPEC_Agent_Lead.md` and this README intentionally remain separate: technical requirements change through specification review, while human operation remains discoverable without scanning normative data contracts. The Operations and Deployment documents likewise remain distinct because portable test procedures are not the live host configuration.

## Governance and operational limits

GitHub is the durable system of record. The coordinator's current local report is execution evidence, not a substitute for documented decisions. No specialist presently has autonomous approval, repository write, merge or deployment authority. Use the canonical Management workflow for review and acceptance, and record operator evidence in the relevant governed work item rather than inventing success from installed configuration.
