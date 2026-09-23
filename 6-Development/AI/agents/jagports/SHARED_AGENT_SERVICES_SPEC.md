# SPEC — Reusable Services for the Original AI OS Lead Agent

**Status:** Proposed under [#924](https://github.com/jagports/jagports/issues/924); specification only. The previously proposed separate Vehicle team is obsolete. This document specifies reusable domain-neutral libraries **inside the original AI OS development-agent runtime**, not a second coordinator, specialist registry, vehicle-domain runtime or authority to execute paid/model-backed or GitHub write operations.

The executable roles remain `LeadAgent`, `DocumentationAgent`, `DeploymentAgent` and `KnowledgeAgent`. See [Lead Agent SPEC](jagports-lead-agent/SPEC_Agent_Lead.md) for routing and [0-DEC Agent Roles](../../../0-DocumentationEducationCompetense/agents/AGENT_ROLES.md) for the separate six **logical project-work** roles.

## Contracts to retain and adapt

| Capability | Required reusable behavior |
|---|---|
| GitHub access | Keep `GitHubAgent` / `GitHubService` as the authenticated request boundary; preserve the existing GET-only low-level guard, bounded list/detail requests (including pagination) and repository scope. Proposed future write actions require **separate** human/work-item authorization, per-operation validation, idempotency, an audit trail and independent read-after-write. Do not relax the current credential gate before equivalent safeguards and negative tests replace it. |
| Issue events and retrieval | Preserve existing #904 versioned `ChangedIssueEvent`, `IssueContext`, exact source revision, integrity-checked pending records and source provenance. Fetch only selected bounded Issue bodies, comments and approved AI OS guidance; fail closed on truncated, invalid or absent material. A first-run historical baseline, no-change event or unrelated Issue does not spend tokens. |
| Reasoning | Preserve `ReasoningService` as a model-neutral JSON boundary. Replace hard-coded Vehicle/P7 roles, required *exactly two* provider calls and Jaguar source assumptions with **per-original-agent** prompts, structured output schema, approved source set, optional activation and deterministic source checks. No direct SDK call inside an ad-hoc smoke script substitutes for an actual specialist invocation. |
| Spending | Keep atomic reservation/finish ledger, cross-process lock, max input/output tokens, per-call/run/day/cross-day cumulative spend, measured usage, conservative uncertain charges and no automatic retry on possibly billed calls. The existing $5 account-wide test pool includes any direct OpenAI/wrapper calls; the $4 local ceiling is not a replenishable budget. |
| Recovery | Stable Issue revision and agent-specific request IDs, deterministic no-op on accepted replay, durable checkpoints/source hashes, single-run lock and fail-closed migration from old P7 records. Preserve old charged/uncertain attempts and the existing #904 cursor before retiring the Vehicle pilot. |
| Reports and Telegram | Original `AgentResult` from Documentation/Deployment/Knowledge flows through atomic `ReportService`. A durable event/result-keyed Telegram outbox uses the existing `services/telegram_service.py` transport; bounded retry never repeats a model request. A separately enabled one-shot `/ask` receiver authorizes the configured chat/sender, persists Telegram update IDs, routes **through an original specialist** and returns a reply without duplicate spend. |
| Process and operation | `main.py` is the canonical service/manual entry; repair `run-agent.sh` to match. Use the existing 585-minute `codex` user timer, without a second scheduler. `codex` has no sudo and must not be granted it; `admin` performs only authorized host setup. |

## Original runtime and the only authorized integration direction

```text
GitHub --> shared GET-only GitHubService --> GitHubAgent / #904
                                               |
                                        LeadAgent / Event
                                               |
                                          AgentRegistry
                                      /          |          \
                           Documentation   Deployment   Knowledge
                                      \          |          /
                               optional approved ReasoningService
                                               |
                                  AgentResult[] / durable report
                                               |
                                   Telegram outbox / sender

Separate opt-in input: configured Telegram /ask --> validated
                     question/update ID --> original agent
                     --> same cost-capped reasoning --> Telegram reply
```

**No Vehicle agent runtime is to be extracted, maintained or newly introduced by #924.** Delete the mixed P7 Vehicle-role implementations, vehicle-only prompts, dispatcher branches, fixtures, configuration and active documentation **in a later reviewed implementation PR**, after preserving reusable generic safeguards and existing durable state. Historical PR/Issue evidence and Jaguar project source knowledge remain untouched.

## Canonical GitHub service and authorization migration

`GITHUB_TOKEN` is the configured existing operational credential, but possessing a token does **not** authorize GitHub writes. Specialists submit structured read requests to the shared service; only the shared boundary contacts GitHub. The existing GET-only request guard protects currently read-designated workflows. Future mutation requests must carry initiating original agent, target, exact work item/revision, action/payload, governing Management authorization, approval evidence where required and idempotency key. Reject any missing or out-of-scope evidence, verify approved writes independently, and record redacted results. Model text and Issue content are untrusted data.

The superseded proposal removed `read_only_credential_confirmed` and deleted its verifier **before** the centralized authorization implementation existed. Restore those currently merged safeguards on this **SPEC-only PR** and keep the paid P7 runtime disabled. Whether a dedicated read-only token can later be retired depends on accepted alternative credential and operation-level enforcement, independent tests and host verification; neither the documentation change nor a confirmed `GITHUB_TOKEN` silently authorizes deletion. Preserve proof of existing read-only permissions in immutable prior work records.

## Preserved state and budget migration

Inventory deployed `state/model_usage.json`, P7 checkpoints/pending-event files, #904 observations/cursors and all other persistent attempts before removing any obsolete module. Assign stable migrated record identities, archive legacy results privately as `codex`, carry forward every consumed and uncertain reservation into the new cumulative budget and block unresolved attempts from automatic replay. Do not rename or reset a ledger merely to obtain a fresh $4 allowance. Backups containing `.env` or historical evidence are private and never posted to GitHub. Preserve report write durability, the original three-specialist deterministic path and no-change/no-cost behavior throughout the migration.

## Telegram and actual agent integration

After independently reviewed implementation restores the original AI OS dispatch, persist an eligible completed original-agent result, atomically record one pending event/result digest and send it via the existing Telegram service. Bounded delivery retries operate on the saved message/result, **never** by rerunning paid model calls. An external send may succeed before local acknowledgement; document this inherent at-least-once boundary and deduplicate where the Telegram API permits. Require a real systemd-triggered report/journal/outbox and human-confirmed received message for scheduled acceptance.

For incoming Telegram questions, implement a separately enabled **one-shot** `/ask` test only. Verify configured chat and sender, reject other commands, persist the highest processed update ID (and per-request state) before any billable invocation, and use the appropriate existing `agents/*.py` specialist and this shared cost-capped reasoning boundary. A completed replay returns the prior result without a second call. Network, parsing, authorization and duplicate-message failures remain observable without exposing tokens. Do not deploy a webhook, permanent polling loop or another recurring timer as a side effect of specification approval.

## Implementation and acceptance

- [ ] Delete or retire all *active* P7 Vehicle-agent runtime/docs/tests/config and the proposed standalone Vehicle team document, without deleting Jaguar/JEPC/VIN/fitment project source data or immutable history.
- [ ] Original Lead/Documentation/Deployment/Knowledge agents and deterministic Issue lifecycle behavior remain the only active AI OS registry. Documentation gains the first source-backed, real model-backed semantic slice; additional specialists require separate tests.
- [ ] GET guard, shared source/provenance limits, authorized operation boundary, negative mutation tests, durable #904 events and prior security controls remain intact during migration.
- [ ] Generalized ReasoningService preserves provider usage measurement, conservative budget, uncertain reservations, exact replay and cross-process locking with focused tests.
- [ ] A completed original-agent report can reach authorized Telegram recipients with durable outbox, failure/replay controls and no duplicate model charge; a separate one-shot authorized `/ask` reaches an original agent and replies.
- [ ] Current README, SPEC, OPERATIONS, Deployment and script entry points agree and do not overwrite [Agent Update PR #935](https://github.com/jagports/jagports/pull/935).
- [ ] The existing 585-minute `codex` user timer and paid-disabled defaults remain unchanged pending separately authorized manual and unattended acceptance on the Pi; neither this SPEC nor its CI implies live host deployment.
