# SPEC — Lead Agent Issue reasoning and automatic Telegram reports

**Status:** proposed for Product Owner and independent review; specification only, no runtime activation.  
**Governing work:** [Issue #902](https://github.com/jagports/jagports/issues/902), related [P12 #49](https://github.com/jagports/jagports/issues/49).  
**Existing foundations:** [runtime architecture](README.md), [reusable command/test procedures](OPERATIONS.md), [MyNode installation](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md), [AI OS Management workflow](../../../../../00-Management/WORKFLOWS.md) and [communication protocol](../../../../../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md).

## 1. Baseline and objective

The current coordinator collects GitHub records; persists issue lifecycle changes (new, closed, reopened); passes an Event to rule-based Documentation, Deployment and Knowledge specialists; and writes a report. Its current GitHub snapshot contains number, title, state and updated_at only; the Issues endpoint can include PRs. The modular main.py does not call the existing OpenAI wrapper or send a Telegram message automatically.

Operator evidence supplied on 23 September 2026:
- Direct API returned `JAGPORTS API TEST OK` and the existing `openai_service.analyse()` wrapper returned `JAGPORTS AGENT API OK`. Neither constitutes model-backed specialist operation.
- **TG-001 PASSED (operator-reported):** the short Telegram test printed `Telegram sent: Jagports Issue changes: {'new': [], 'closed': [], 'reopened': []}` and the operator confirmed the message arrived. This proves manual delivery of saved *empty* changes only.
- **INT-001 manual integration PASSED (operator-reported, 23 September):** the Lead Agent collected 86 currently open GitHub records, detected `new: [903, 902, 901]`, routed the event to all three rule-based specialists, saved a report, and the operator received the one-shot Telegram message reporting 86 open records and three executed specialists. The `new` list includes PR #903, exposing the unresolved PR-as-Issue classification. The script did **not** fetch full Issue bodies, use model reasoning, or send automatic timer-triggered notifications.
- The 9h45min MyNode user timer is enabled and active, and a manual user-service run succeeded. The subsequent timer-triggered unattended run is a distinct acceptance check under #900.

**Objective:** enrich changed GitHub Issues with relevant title/body/comments, run selectively invoked model-backed specialists, and deliver one compact AI-generated summary to the Product Owner's configured Telegram chat during the existing scheduled coordinator execution. Preserve all present governance, human decision, review and merge boundaries.

## 2. Required architecture and rollout gates

```text
systemd (existing 9h45min user timer)
    -> main.py / LeadAgent
    -> GitHubService + StateService: compact, meaningful changed-Issue events
    -> deterministic relevance routing (no relevant change -> no paid call)
    -> lazy title/body/labels/needed-comment fetch + selective repository guidance
    -> model-neutral ReasoningService (OpenAI initially, one specialist first)
    -> validated AgentResult[] + usage accounting + durable report/outbox
    -> bounded Telegram formatter -> existing telegram_service.notify()
    -> delivery acknowledgement, retry/replay state and local observability
```

Delivery in three **independently testable increments**. This specification references the Development `OPERATIONS.md` currently proposed in [PR #899](https://github.com/jagports/jagports/pull/899); merge #899 before merging this spec PR so that its cross-document links exist on `main`. A and B do not require automatic Telegram. C depends on B's accepted structured result format. Keep current deterministic operation as a fallback. Specification approval does not automatically enable paid unattended processing.

### A — Meaningful Issue change detection and bounded detail retrieval

1. Distinguish GitHub Issues from PRs before specialist reasoning. Avoid an unbounded GitHub request per unchanged record; lazy-fetch only selected changed Issues. The GitHub API may return PRs from its Issues endpoint.
2. Extend meaningful change detection beyond lifecycle to title, body and relevant human comments. Do not infer content change from updated_at alone; bot-generated comments and the agent's own outputs must not create notification loops. Track stable Issue/comment identities and cursors or content fingerprints.
3. Fetch title, body, labels, URL and bounded, paginated comments **on demand** for changed Issues only. Persist enough revision identity for replay; make max comments, sizes and look-back configurable. Explicitly signal incomplete/truncated context.
4. Carry compact event identity (Issue number, change kind, source revision and changed comment IDs), not a complete repository snapshot, through the Event and specialist interface. Preserve evidence links to the source Issue and individual comments.
5. Treat Issue bodies/comments as **untrusted external data**, not agent instructions. Restrict secrets, personal data and unrelated comments in model prompts. Rate limits, missing/deleted Issues and API errors produce explicit retryable states, not silent event loss.

#### A.1 — Increment 1 implementation contracts

The initial enrichment increment is **read-only and model-free**. It establishes an explicit boundary that later reasoning and Telegram features may consume without embedding GitHub access into specialist business logic.

| Boundary | Required fields | Behavioral contract |
|---|---|---|
| CollectedIssue | `number`, `title`, `state`, `updated_at`, `url`, `is_pull_request` | Only verified Issues feed Issue-only state/event analysis. Retain a count of filtered PRs for diagnostics. |
| ChangedIssueEvent | `issue_number`, `kind`, `source_revision`, `changed_comment_ids` | `kind` is one of `new`, `closed`, `reopened`, `title_changed`, `body_changed`, `comment_added`, `comment_edited`; multiple kinds can coexist for the same revision. |
| IssueContext | `number`, `title`, `body`, `labels`, `state`, `url`, `comments`, `truncated`, `fetched_at` | Only changed/selected Issues receive the lazy detail request. Comment entries carry `id`, `url`, `author`, `created_at`, `updated_at` and bounded `body`. |
| RetrievalOutcome | `status`, `issue_number`, `context_or_error` | `status` is `complete`, `truncated`, `retryable_error` or `permanent_error`. A partial fetch must never be represented as complete evidence. |

**Change-detection sequence:** (1) enumerate repository Issue metadata and identify/exclude PRs; (2) compare known lifecycle state and an updated-time candidate filter; (3) lazily fetch details only for candidate Issues and compare stored title/body fingerprint, comment IDs and changed-comment revision metadata; (4) persist changed-event identity and the next comparison cursor **before** handing work to specialists. Absence from a partial/failed listing is not an Issue closure. A cursor alone is insufficient to guarantee capture of events that occur and reverse entirely between 9h45min polls; expose this polling limitation instead of claiming complete history.

**Replay and migration:** retain old `state/agent_state.json` structure in the initial migration; add a separately versioned enrichment snapshot and durable pending-event record. Preserve the first-run/no-flood behavior even if legacy state already contains PR numbers. A crash after snapshot persistence but before analysis must replay the pending event once, not discard it. Deduplicate events by Issue ID + stable observed content revision (not timestamp alone). Bot/agent-generated comments should not trigger self-recursive recommendations.

**Bounded fetch policy:** choose named, adjustable limits for changed Issues/run, comments/Issue, comment age and body characters. A response exceeding a limit must set `truncated` with explicit reason and preserve the source link; do not silently treat the omitted material as assessed. Provide instrumentation for API requests and fetched characters per run. Retrieve only enough comments needed for the changed event and its specialist, not the entire discussion by default.

**Read-only handoff:** the first increment returns IssueContext + ChangedIssueEvent through the current LeadAgent/Event and report path; all existing deterministic specialist results and the prior `new`/`closed`/`reopened` report remain available. It does **not** invoke OpenAI, send automatic Telegram messages or perform any GitHub write. Verification fixtures must include a new Issue, an updated body, an edited old comment, a bot comment, a PR with an Issue-like title, and a failed paginated collection.

### B — Model-backed specialist recommendations

1. Place the OpenAI-backed implementation (Agents SDK when implemented) behind a **single model-neutral ReasoningService**. Reuse the existing Event, LeadAgent, AgentRegistry, AgentResult, ReportService and StateService contracts. Do not maintain two independent production model-call paths.
2. Enable the **Documentation specialist first** behind explicit configuration, following compact deterministic filtering. Supply only the changed Issue's bounded details and applicable repository rules/guidance; do not send every Issue to every model. Add Knowledge and Deployment only after the first specialist passes the acceptance suite.
3. Return a validated structured AgentResult with the existing fields `agent`, `severity`, `message`, `data`. The `data` extension must contain source Issue/revision, relevance decision, concise explanation, evidence links, suggested affected knowledge areas/files when supported, model identification, measured token use, execution outcome and timestamp. No fabricated file paths or ungrounded recommendations.
4. The service must record actual API usage and enforce configurable per-item/per-run invocation, token and cost limits. With no relevant change, disabled reasoning, missing credentials or exceeded budget, **zero paid model calls**. Do not hard-code model pricing or use the API subscription as permission for unlimited recurring calls.
5. Failures, malformed output and partial specialist failure must not erase pending work or corrupt snapshots. Persist and retry bounded, identified work items; keep rule-based reports available if the model fails. Never let untrusted GitHub content override Management workflow, change gates or tool permissions. No autonomous Issue/PR edits, merge or deployment in this increment.

### C — Automatic AI-generated Telegram summaries

1. Integrate the current Telegram service into **the existing scheduled main.py run**, not a second cron job or another timer. Preserve the current MyNode service account, 9h45min timer and protected local credentials.
2. Send only when a new, relevant, successfully generated result warrants attention. Include changed Issue number/link, change kind, specialist, recommendation and a short reasoning summary; distinguish model recommendations from GitHub facts. Link to the durable GitHub Issue; the local report is the prototype output archive, not a substitute for persistent GitHub decisions.
3. Produce **at most one digest per completed coordinator run** by default. Do not send repetitive all-clear reports or resend an already acknowledged event. Apply Telegram message-size limits; summarize or split with clearly ordered parts if necessary. Never send tokens, environment variables, whole Issue bodies or unbounded comment text.
4. Persist a stable event/result digest key and a notification outbox. Record pending, attempted, delivered, failed and next-retry states; use bounded retry/backoff and expose last error without secrets. **At-least-once** delivery is acceptable after a crash between remote delivery and local acknowledgement; document that this boundary may create a duplicate.
5. Default **reasoning** and **automatic Telegram reports** to *disabled* until Product Owner authorization and focused acceptance pass. An API or Telegram failure must not prevent saved event/report inspection or silently mark the event as handled. A manual TG-001 smoke test remains separately callable.

## 3. State, execution and security constraints

- Existing `state/agent_state.json` and `reports/lead_report.md` must remain readable during migration. Add versioned event/retry/outbox state without deleting the previous snapshot until recoverable changed events are durably recorded.
- Apply a single-run lock to prevent overlapping manual and timer execution from racing on state or double-sending.
- GitHub Issue/PR descriptions remain protected by existing repository rules. Agents may recommend actions but cannot bypass human decisions, independent review, permission boundaries or the repository change gate.
- Configuration remains in local env/config; do not log, store in Git or include secrets in Telegram. A communication failure is reported as an operational fault rather than concealed by a successful model call.
- The first-run baseline must not classify every historical Issue as a new event or trigger a bulk paid analysis/Telegram flood.

## 4. Acceptance-test structure

Automated tests use mocked GitHub, model and Telegram adapters and fixture Issues; production integrations are separate **explicit operator tests**. Every manual operator test has at most four actions.

| ID | Increment | Input / action | Required result |
|---|---|---|---|
| GHD-001 | A | New real Issue with title/body/labels and 2 comments | One bounded detail context with source links; PRs excluded |
| GHD-002 | A | Title/body edit or new human comment without lifecycle change | One meaningful update event; changed comment identified |
| GHD-003 | A | Unchanged record, bot comment, pagination, truncated body, API error | No feedback loop or unnecessary fetch; bounded context and recoverable error |
| RSN-001 | B | Relevant documentation Issue and mocked model response | One validated structured Documentation AgentResult with evidence and rationale |
| RSN-002 | B | No change, irrelevant Issue or disabled service | Zero model requests, existing deterministic report remains valid |
| RSN-003 | B | Model timeout, invalid JSON, rate limit, exhausted token budget | Bounded failure/retry, visible status, no event loss or unrestricted spend |
| RSN-004 | B | Actual authorized model run on one controlled Issue | Measured usage and relevant human-reviewable result; no repo mutation |
| INT-001 | Existing | Manual live GitHub snapshot, saved lifecycle delta, all three deterministic specialists, report and Telegram send | **PASS on 23 Sep 2026, operator-reported:** 86 open records, `new: [903, 902, 901]`, three specialist results and received summary; no Issue body/model/scheduled-run verification |
| TG-001 | Existing | Manually send saved lifecycle changes from the local state file | **PASS on 23 Sep 2026, operator-reported:** CLI send succeeded; empty-change message received |
| TG-002 | C | Mock one relevant model result during scheduled coordinator execution | One appropriately bounded Telegram digest, outbox marked delivered after successful send |
| TG-003 | C | No changes, repeat event, missing token, Telegram outage or retry | No unnecessary send/duplicates in normal reruns; failures observable and pending work preserved |
| TG-004 | C | Authorized live end-to-end test with actual nonempty changed Issue | Operator receives linked, model-backed recommendation after a timer-triggered run; report/outbox and usage evidence match |
| SYS-001 | All | Overlapping invocations and restart with pending model/delivery work | One active runner; recoverable events and non-lossy retry |
| SYS-002 | All | Normal unattended 9h45min timer fire after activation | Journal, state/report timestamp and next activation confirm autonomous execution (#900 dependency) |

### Manual acceptance scripts

**RSN-004, operator:** (1) Approve a tightly capped one-Issue model test; (2) execute a one-shot analysis; (3) inspect structured recommendations and usage; (4) confirm no repository writes. Never switch on recurring paid calls merely because this test passes.

**TG-004, operator:** (1) Authorize one controlled nonempty Issue-change fixture or approved test Issue; (2) let the configured scheduled run execute; (3) confirm a single received Telegram message with Issue link and recommendation; (4) inspect journal/report/outbox and record the result. Avoid generating artificial changes to unrelated project work.

## 5. Implementation batches and release gates

| Batch | Deliverable | Gate |
|---|---|---|
| 1 | [#904 — Read-only Issue enrichment](https://github.com/jagports/jagports/issues/904): PR exclusion, meaningful Issue delta, lazy details and comment bounds | GHD-001–003; unchanged baseline still works; zero model calls |
| 2 | Model-neutral adapter, Documentation specialist, structured evidence and budget | RSN-001–004; no-change = zero paid calls |
| 3 | Optional Knowledge and Deployment specialist enablement with relevance tests | Each specialist has targeted fixtures; deterministic routing precedes model calls |
| 4 | Automatic Telegram digest, outbox, retry and dedup | TG-002–003; TG-001 remains available |
| 5 | Controlled live nonempty end-to-end and unattended acceptance | TG-004 and SYS-001–002, independent review and Product Owner approval |

**Not in scope:** autonomous GitHub writes, self-directed code execution, PR approval/merge, deployment, unrestricted parallel agents, a second scheduling system, or replacing GitHub with Telegram as the decision record.

Documentation ownership: this **Development SPEC** owns functional contracts and acceptance; [OPERATIONS.md](OPERATIONS.md) owns reusable tests; [MyNode Deployment](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md) owns host installation and user-systemd commands; [Projects](../../../../../5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md) owns business rationale and verified evidence.
