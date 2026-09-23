# SPEC — Unattended Research-to-Decision Validation

**Status:** Proposed for independent specification review and Product Owner approval. No runtime activation or new spending is authorized by this document.

**Owner:** Lead Agent coordination, Research, Product / Vehicle, and the human Product Owner.

**Location:** Lead Agent Development specification. This document defines the research-to-decision extension only; it does not redefine the shared Lead Agent runtime, Management workflow, prioritization method, review gates, or deployment procedure.

## Transitional ownership and planned retirement

**The historical mixed-team workflow described below is not the target team architecture.** Its implementation entered `main` through PR #919 as an independently reviewed bounded pilot; Issue [#924](https://github.com/jagports/jagports/issues/924) governs the subsequent separation. Move Jaguar Research, Product/Vehicle prompts and domain validation to the [independent vehicle agent SPEC](../jagports-vehicle-agent/SPEC_Vehicle_Agent_Team.md); the [original AI OS Lead Agent SPEC](SPEC_Agent_Lead.md#target-ownership--ai-os-application-development-agent-team-924) owns only the original application-development coordinator and Documentation, Deployment and Knowledge specialists. Move reusable budget, event, checkpoint, retrieval and report contracts to [Shared Agent Services](../SHARED_AGENT_SERVICES_SPEC.md). Do not integrate the vehicle role into an original AI OS specialist.

After independently reviewed implementation of #924, retire this mixed-team document and remove all active temporary P7 names without deleting historical work records or resetting any billed/uncertain checkpoint. No specification change alone activates either team, paid OpenAI calls or the Raspberry Pi timer.

## 1. Objective and acceptance boundary

Prove that the existing Raspberry Pi Lead Agent can execute a **bounded, unattended, source-backed, multi-role research-to-decision hand-off** using the available OpenAI API, without requiring a Codex-backed autonomous coding runtime.

The unattended portion detects an authorized work-item change; executes a Research role and a separately invoked Product / Vehicle validation role; applies the existing prioritization and decision-routing rules; and produces a recoverable, inspectable hand-off for a human. A consequential decision still requires the Product Owner. An agent may not approve its own proposal, bypass independent pull-request review, change repository permissions, merge, or deploy.

A successful direct API request, a successful manual service run, a single model-backed specialist, or a manually delivered Telegram message is **not** sufficient proof of this multi-role workflow.

## 2. Dependencies and document ownership

Use these existing sources rather than copying their normative rules:

- [Shared Lead Agent architecture and roadmap](SPEC_Agent_Lead.md): the current deterministic coordinator, Event, AgentRegistry, AgentResult, StateService, ReportService, specialist boundaries, and model-integration direction.
- [Shared Issue reasoning and notification specification](SPEC_Agent_Lead.md#staged-advisory-issue-reasoning-and-telegram-specification): meaningful Issue changes, bounded lazy detail retrieval, a model-neutral reasoning service, usage accounting, retry/deduplication, and optional Telegram delivery. **Review and merge the shared specification before implementing dependent interfaces.**
- [Management workflows](../../../../../00-Management/WORKFLOWS.md): state transitions, historical work discovery, the repository change gate, independent review, testing, and merge authority.
- [Prioritization method](../../../../../00-Management/PRIORITIZATION.md): existing priority evidence and controlled queue changes. This document creates no separate scoring model.
- [Agent roles](../../../../../0-DocumentationEducationCompetense/agents/AGENT_ROLES.md): logical Research, Product / Vehicle, Team Lead, and other responsibilities.
- [Communication protocol](../../../../../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md): durable hand-offs, escalation classes, decisions, and acknowledgements.
- [AI OS vision](../../../../../00-Management/VISION_AI-OS.md): deterministic-first processing, recoverability, bounded cost, vendor-replaceable execution, and human governance.

Development owns the contracts and automated tests. Existing Deployment documentation owns the live systemd user timer and host procedures. Existing operational documentation owns reusable commands and one-shot verification. GitHub remains the durable work and decision record; local reports are execution evidence, not a replacement system of record.

**Research-artifact location:** Actual source-backed research reports, evidence collections and unresolved investigations belong under the repository's established `7-Research/` semantic root or its applicable existing subfolders. Persist work-specific finding and hand-off references in GitHub; promote accepted reusable conclusions only to the narrowest applicable knowledge file through the normal review path. The engineering specification and test contracts remain in `6-Development/`, so they are not treated as raw research artifacts. The initial read-only pilot proposes evidence paths but does not autonomously create or edit research files.

**Prerequisite:** the shared Lead Agent specification's Issue-enrichment and first model-backed specialist amendment must be independently accepted and merged before this extension reuses its interfaces. The existing timer's installation and successful manual service execution must not be misreported as proof of a later unattended timer-triggered run.

## 3. Architecture and execution policy

    Existing 9h45min user timer or explicitly authorized one-shot execution
      -> existing LeadAgent / state comparison
      -> one allowlisted, meaningfully changed GitHub Issue
      -> shared bounded IssueContext and relevant authoritative guidance
      -> Research role: source-backed finding
      -> Product / Vehicle role: separately executed domain validation
      -> deterministic Team Lead: existing prioritization and decision routing
      -> durable run record and human-readable hand-off
      -> optional, separately authorized GitHub comment / Telegram notification
      -> human Product Owner decision or existing independent review path

Treat roles as separate execution boundaries, not separate paid accounts. The minimum pilot uses at most **one selected work item and two model-backed role invocations per run**. Team Lead routing is deterministic initially. The Product / Vehicle role receives the Research output plus independently retrievable domain evidence; it must not merely rephrase the Research role's conclusion.

Only a meaningful, allowlisted change can trigger paid reasoning. A no-change, irrelevant, truncated-without-sufficient-evidence, disabled, unapproved, or over-budget event must not trigger an unauthorized model call. The first-run baseline must not treat all historical Issues as new research opportunities. Pull requests must not be misclassified as Issues.

The OpenAI API and Agents SDK may provide the reasoning layer through the shared model-neutral interface. This pilot does not depend on a Codex-specific subscription or require autonomous coding. A full autonomous engineering runtime is a separate, unimplemented capability with independent permission and acceptance gates.

## 4. P7-specific data contracts

Use the accepted shared IssueContext, ChangedIssueEvent, AgentResult, usage, and error contracts without redefining their common fields. Extend them with these P7-specific typed results.

### ResearchFinding

Required fields:

- event key, canonical work-item URL, observed source revision, role-run identifier, timestamp, and prompt/template version;
- exact research question, evidence scope, source type, source URL, retrieval timestamp, and verifiable excerpt or independently checkable summary for each cited source; a proposed research-record location under `7-Research/` when an approved durable evidence file is warranted;
- finding and confidence state: supported, provisional, or insufficient;
- contrary evidence, limitations, unresolved questions, and proposed next action;
- actual provider/model identification, request outcome, token usage, and available cost measurement.

A generated URL or plausible citation is not evidence. Source retrieval must actually occur through an available read-only tool or an existing approved source. If needed external information cannot be retrieved, state the limitation and keep the result in research. Restrict external searches to sources relevant to the authorized question; never send unrelated repository state or credentials to a model.

### ProductValidation

Required fields:

- referenced ResearchFinding and source revision, independent role-run identifier and timestamp;
- domain evidence and checked sources, including any material conflicts;
- outcome: validated, rejected, or needs_more_research;
- concise rationale, unresolved domain questions, and, only when validated, a draft proposal or requirement;
- explicit identification of any consequential decision or technical/specification hand-off needed.

The validator must distinguish evidence-backed agreement from agreement based only on the first model's output. Unsupported fitment, Jaguar vehicle identity, historical VIN, or product claims remain unresolved rather than being promoted to specification.

### DecisionRoute and RunRecord

DecisionRoute records the source revision; ResearchFinding and ProductValidation identifiers; disposition of remain_research, prepare_proposal, normal_review, or human_decision_needed; an explanation tied to the existing governance sources; proposed priority evidence where relevant; required human owner; and next recoverable action.

RunRecord records timer/manual trigger, start and end, allowlisted work-item identity, model-call count, actual usage, artifact versions, result hashes, stage outcomes, retries, errors, report location, and any independently verified GitHub delivery. Preserve historical evidence and avoid reporting local work as completed Project Item mutation.

## 5. Safety, cost, and authorization gates

- **Default off:** the multi-role model pipeline and automatic GitHub/Telegram delivery are disabled until explicitly enabled for an approved pilot.
- **Pilot scope:** one allowlisted existing work item, one source revision, one research call, one independent Product / Vehicle call, no unrestricted specialist fan-out.
- **Spend:** configure model, input/output token caps, per-run invocation cap, daily spend cap, and an explicitly approved budget before the first paid run. An unset or invalid cap means no paid execution. Record actual usage, including a clear distinction between measured cost and estimated cost.
- **Read-only first:** research and validation may inspect approved GitHub/repository/public sources. They must not edit Issues, Project fields, code, secrets, permissions, or deployments.
- **Untrusted inputs:** external pages, Issue bodies, comments, and model output are data, never instructions overriding Management rules. Bound all fetched content and expose truncation.
- **Isolation:** maintain distinct role calls and identifiers; reject malformed structured output; never interpret role agreement alone as human authorization.
- **Recovery:** persist pending work before executing paid reasoning; use stable event/revision keys, a single-run lock, bounded retries, and stage-level checkpoints. A failed second role must not lose the first result or cause uncontrolled repeated charges.
- **Optional GitHub delivery:** only after separate approval, grant the minimum comment-only scope on an allowlisted work record. Verify the resulting comment through an independent read and check for an existing identical hand-off before retrying. Until this is approved, an operator attaches the verified report to the work record.
- **Decisions:** consequential changes to product, architecture, security, cost, data strategy, or workflow wait at the existing human decision gate. Routine recommendations still follow the established review/testing process.

## 6. Specification work — complete in order

- [ ] **S-01 — Confirm baseline and ownership.** Re-read current Lead Agent architecture, shared specification, Management rules, role definitions, existing deployment and operational guidance. Document which components already exist, which are approved but unimplemented, and which require separate acceptance. **Exit:** a dependency matrix with no invented capability claims.
- [ ] **S-02 — Select the pilot and authority.** Choose one real, suitable Jagports research work item with a bounded question, known approved sources, a named Product / Vehicle domain authority, and an authorized execution budget. Define whether the pilot is read-only or additionally permits comment-only delivery. **Exit:** recorded Product Owner pilot and spend decision; no changes to unrelated work items.
- [ ] **S-03 — Freeze the extension contracts.** Reuse shared IssueContext, ReasoningService, Event and AgentResult; define schema/version, stable IDs, required evidence, uncertainty, role independence, routing dispositions and recoverable run state in this specification. **Exit:** producer/consumer contracts and examples for supported, disputed and insufficient findings.
- [ ] **S-04 — Define retrieval and model policy.** Specify approved source locations/tools, selective guidance, maximum source/context size, separate role prompts, validated output, model selection, actual usage accounting, invocation/token/daily budget limits and fail-closed behavior. **Exit:** deterministic no-change/irrelevant-event policy and an approved, cost-bounded pilot configuration.
- [ ] **S-05 — Define hand-off and authority.** Map validated and unvalidated results into existing research, proposal, prioritization, review and human-decision procedures. Specify exact report contents, durable GitHub evidence placement, any optional comment-only write permission and independent read-after-write verification. **Exit:** no new workflow states, scoring method or implied autonomous approval.
- [ ] **S-06 — Define failure and recovery acceptance.** Specify truncation, unavailable sources, disputed claims, prompt injection, API failure, invalid output, rate limits, duplicate events, overlapping runs, crash/restart and comment-delivery ambiguity. **Exit:** traceable fixture and failure matrix with bounded retry behavior.
- [ ] **S-07 — Independent specification review.** Have an independent reviewer validate scope, roles, evidence requirements, contracts, privacy/cost controls, failure modes and compatibility with the shared specification. Obtain the required Product Owner decision for the pilot budget and any new write authority. **Exit:** current formal review approval and applicable acceptance gates before implementation begins.

Do not implement the P7 extension against unmerged or unstable shared interfaces merely to advance this checklist.

## 7. Implementation work — focused batches

Each batch uses an existing governing work item, a dedicated implementation branch and the canonical review/test integration path. Do not open duplicate tasks for capabilities already covered by the shared Lead Agent work. Merge a batch only after its own applicable acceptance, independent review and required tests pass.

| Order | Batch and anticipated code location | Exact deliverable | Gate |
|---|---|---|---|
| I-00 | Shared foundation and deployment | Finish the accepted shared Issue enrichment/reasoning adapter, controlled config and a verified actual unattended timer-triggered run; preserve the deterministic coordinator. | Approved shared contracts; read-only enrichment tests; independent timer journal/report evidence. |
| I-01 | Existing LeadAgent, AgentRegistry and event routing | Add a disabled-by-default, one-item allowlist; consume only meaningful changed Issue events; pass bounded source revision and shared IssueContext to the P7 workflow. | Unchanged/irrelevant/PR events cause zero P7 model calls; historical Issues do not flood first run. |
| I-02 | Research specialist in the existing agents area | Add an independently invokable Research role using the shared model-neutral service, authorized evidence retrieval, structured ResearchFinding and usage reporting. | Mocked supported/unsupported sources; real bounded one-shot result with checkable source links and actual token usage. |
| I-03 | Product / Vehicle specialist in the existing agents area | Add a separate role invocation that checks ResearchFinding against relevant domain evidence and returns ProductValidation. | Tests prove distinct calls, validation/rejection/needs-more-research outcomes, and no automatic promotion of uncertain fitment or identity claims. |
| I-04 | Existing LeadAgent orchestration and a deterministic routing component | Route only validated proposals into the existing prioritization and review/decision path; hold rejected or unresolved findings in research. | Positive, negative, contested and consequential-decision fixtures reach their correct existing gates without autonomous approval. |
| I-05 | Existing state and report services | Persist stage checkpoints, stable event/revision identities, normalized evidence, actual usage, error/retry state and a human-readable hand-off; retain legacy state/report compatibility. | Interruption between roles and process restart recover without losing pending work or charging for completed stages again. |
| I-06 | Focused automated tests in the existing development test structure | Add mocked GitHub, source-retrieval, model and optional notification tests for both role contracts, no-change cost, prompt injection, truncation, failures, deduplication and single-run locking. | All focused automated tests pass; applicable existing Lead Agent regressions remain green. |
| I-07 | One-shot operator pilot | On the approved real work item, execute one manually initiated bounded two-role run; inspect each role's separate result, actual usage, decision route and local report. | Verified source links, explicit uncertainty, complete report, no unapproved repository mutations and actual spend within the approved caps. |
| I-08 | Existing timer and optional delivery boundary | Enable the same allowlisted workflow for one actual timer-triggered run; inspect journal, source revision, two distinct role executions, usage and recovery evidence. Attach the approved report to GitHub manually unless optional comment-only delivery was separately approved and independently verified. | Evidence shows the operator did not start either role, the complete hand-off is recoverable, and the relevant human received the result. |
| I-09 | Independent acceptance and release decision | Independently review the live evidence, security/cost exposure, failure recovery and any delivery evidence. Record what passed and what remains outside scope, then decide whether to enable broader use. | The unattended research-to-decision acceptance is evidenced end to end; a passing pilot does not imply production autonomy or new permissions. |

### Suggested implementation-file boundaries

Use the existing directory layout rather than inventing another root or standalone runtime:

- agents/research_agent.py and agents/product_vehicle_agent.py for the two logical specialist adapters;
- agents/lead_agent.py and agents/agent_registry.py for selective dispatch and stage orchestration;
- existing services for shared reasoning, source retrieval, persistent state and reports; introduce a narrow service module only where this reduces coupling rather than duplicating the shared service;
- the existing configuration and Development tests for pilot allowlisting, model/cost bounds and controlled behavior;
- existing operations and host Deployment documents for one-shot test and systemd verification commands, not repeated installation instructions in this specification.

These are anticipated touchpoints. Confirm actual filenames and accepted shared interfaces immediately before each implementation batch.

## 8. Acceptance tests

Automated tests use mocked adapters and real-looking but non-sensitive source fixtures. The independent live pilot is separate from mocked success.

| Test | Scenario | Required evidence |
|---|---|---|
| RTD-01 | No meaningful or allowlisted Issue change | Zero new model calls, zero spend and no duplicate notification. |
| RTD-02 | Allowlisted source-backed research question | One ResearchFinding with retrievable source links, correct revision, confidence and usage. |
| RTD-03 | Independent Product / Vehicle validation | Distinct role run; checked domain evidence; explicit validated, rejected or needs-more-research result. |
| RTD-04 | Unsupported or disputed finding | No approved requirement; finding remains research with the missing evidence recorded. |
| RTD-05 | Valid proposal without a consequential decision | Existing prioritization/review hand-off only; no new approval path or unverified Project-state claim. |
| RTD-06 | Consequential product, cost or architecture choice | Human decision required; agent output does not authorize implementation. |
| RTD-07 | Rate limit, invalid model output, retrieval failure, truncation or prompt injection | Bounded failure/retry, safe incomplete state, preserved evidence and no rule override. |
| RTD-08 | Crash after Research, before validation; duplicate event; overlapping timer/manual runs | Recover one pending workflow, reuse verified checkpoints and avoid uncontrolled duplicate charges. |
| RTD-09 | Missing or exhausted spend authorization | No paid invocation; visible reason and recoverable pending work. |
| RTD-10 | One real timer-triggered, allowlisted pilot | Journal and report confirm two separate model-backed roles, correct source revision, bounded actual usage and a recoverable human hand-off. |
| RTD-11 | Optional approved GitHub comment-only delivery | Exactly one deduplicated result on the allowed work record, verified independently after writing; no Issue-body edits or Project mutations. |

### Operator acceptance — no more than four actions per test

**Pilot model test:** (1) approve the one-item budget and scope; (2) execute the one-shot workflow; (3) inspect both results, sources and actual usage; (4) confirm the decision route and absence of unapproved writes.

**Unattended test:** (1) authorize the controlled work item and enable the bounded pilot; (2) allow the configured timer to trigger it; (3) inspect journal, report and any received notification; (4) attach or independently verify the result in the durable work record.

**Recovery test:** (1) use the approved fixture to interrupt execution between roles; (2) restart through the supported command; (3) inspect resumed checkpoints and usage; (4) verify there is one final hand-off and no unauthorized duplicate delivery.

## 9. Completion and release boundary

The proof is complete only when an actual scheduled run executes **both distinct model-backed roles** on a relevant, approved work-item revision; produces verifiable source-backed ResearchFinding and independent ProductValidation; applies the existing Team Lead decision gate; respects authorization and cost limits; preserves recovery evidence; and makes the result available for human inspection through a verified, durable work record.

The approval and implementation of this specification are different decisions. The pilot may demonstrate an unattended multi-role advisory chain using the operator-tested OpenAI API. The broader autonomous engineering/runtime program is a separate, unimplemented capability, not a prerequisite for this bounded validation. Broader production use, additional specialists, autonomous GitHub writes, merge/deploy rights, and recurring spending require their own explicit authority and validation.
