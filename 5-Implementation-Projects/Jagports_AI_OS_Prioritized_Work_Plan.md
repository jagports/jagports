# Jagports AI OS — Prioritized Work Plan

> **WORK IN PROGRESS** — This file is a planning and status view of the existing Jagports AI OS work. GitHub Issues are the primary work and communication records; the GitHub Project visualizes their workflow state. This document does not create new work or redefine the canonical workflow.

## Authority and vision alignment

The umbrella work item is [#135 — [P0] Establish Jagports AI OS](https://github.com/jagports/jagports/issues/135). P0 is complete when P1–P12 are all complete or explicitly descoped.

This plan is subordinate to the current repository authorities and durable vision:

- [`../00-Management/VISION_AI-OS.md`](../00-Management/VISION_AI-OS.md) — product/operating vision.
- [`../00-Management/WORKFLOWS.md`](../00-Management/WORKFLOWS.md) — canonical Management workflow authority.
- [`../00-Management/PRIORITIZATION.md`](../00-Management/PRIORITIZATION.md) — authoritative prioritization, Issue Priority, Project Rank and queue-order method.
- [`../00-Management/RULES.md`](../00-Management/RULES.md) — human governance and authority.
- [`../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md`](../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md) — persistent communication, escalation, decision and hand-off rules.
- [`../0-DocumentationEducationCompetense/KNOWLEDGE_ARCHITECTURE.md`](../0-DocumentationEducationCompetense/KNOWLEDGE_ARCHITECTURE.md) — current durable-knowledge architecture.

The P1–P12 identifiers below are **legacy roadmap positions**, not current priority. Current operational priority is represented by native Issue `Priority`; exact execution order inside the applicable Project/Workstream is represented by Project `Rank`. Workflow readiness remains represented by Project `Status`. The plan must not infer current execution order from the P-number sequence.

## Current P0 status — 2026-09-17

P0 remains **OPEN**. Eight of the twelve parent tracks are closed as completed; four remain open.

| Track | Parent Issue | Current state |
|---|---|---|
| P1 | [#1 — Open Kanban](https://github.com/jagports/jagports/issues/1) | **COMPLETED** |
| P2 | [#8 — Open agent accounts/access to Kanban](https://github.com/jagports/jagports/issues/8) | **COMPLETED** |
| P3 | [#14 — Define agent communication protocol](https://github.com/jagports/jagports/issues/14) | **COMPLETED** |
| P4 | [#18 — Create work-item templates](https://github.com/jagports/jagports/issues/18) | **COMPLETED** |
| P5 | [#22 — Establish Jagports product memory](https://github.com/jagports/jagports/issues/22) | **COMPLETED** |
| P6 | [#26 — Establish prioritization system](https://github.com/jagports/jagports/issues/26) | **COMPLETED** — the canonical prioritization method is on `main`, the first ranked backlog was populated, and the parent is closed. |
| P7 | [#30 — Run agent research-to-decision workflow](https://github.com/jagports/jagports/issues/30) | **OPEN / BLOCKED** — the human-in-the-loop workflow is validated; only unattended multi-agent execution remains and is capability-blocked. |
| P8 | [#34 — Establish Codex engineering workflow](https://github.com/jagports/jagports/issues/34) | **COMPLETED** — the engineering standard was exercised on representative approved work and the delivery loop was verified end-to-end. |
| P9 | [#38 — Establish quality gates](https://github.com/jagports/jagports/issues/38) | **COMPLETED** — acceptance, technical-review and automated-validation gate work is complete and the parent is closed. |
| P10 | [#42 — Prepare Raspberry Pi infrastructure](https://github.com/jagports/jagports/issues/42) | **OPEN / DECISION NEEDED** — P10.1 is complete; P10.2/P10.3 wait for the Product Owner decision on the Raspberry Pi/MyNodeBTC platform role after prototype. |
| P11 | [#46 — Add autonomous automation](https://github.com/jagports/jagports/issues/46) | **OPEN / RESEARCH** — the original automation children are complete and useful free automation exists on `main`; the reopened parent is being reconciled against that existing capability before any duplicate implementation is created. |
| P12 | [#49 — Expand and govern the agent team](https://github.com/jagports/jagports/issues/49) | **OPEN / BLOCKED** — governance, architecture research and the Lead Agent prototype exist; unattended-runtime development remains capability-blocked while permitted governance and capability tracking continue. |

## Current operational queue snapshot — 2026-09-17

The Project remains authoritative for live Status and Rank. This dated snapshot records the currently verified AI OS ordering relevant to the remaining roadmap work and this plan reconciliation:

1. [#439 — Capture and integrate novel AI OS knowledge into the prioritized work plan](https://github.com/jagports/jagports/issues/439) — Rank 1; plan reconciliation work represented by this revision.
2. [#46 — P11 Add autonomous automation](https://github.com/jagports/jagports/issues/46) — Rank 2; `RESEARCH` reconciliation before any additional autonomous-automation implementation.
3. [#49 — P12 Expand and govern the agent team](https://github.com/jagports/jagports/issues/49) — Rank 3; `BLOCKED` for unattended-runtime development while allowed governance/capability work remains possible.
4. [#42 — P10 Prepare Raspberry Pi infrastructure](https://github.com/jagports/jagports/issues/42) — Rank 4; `DECISION NEEDED` on the future Raspberry Pi/MyNodeBTC platform role.
5. [#30 — P7 Run agent research-to-decision workflow](https://github.com/jagports/jagports/issues/30) — Rank 5; `BLOCKED` because only the unattended runtime-dependent portion remains.

This snapshot is evidence, not a competing source of truth. Reprioritization is recorded through the method in `00-Management/PRIORITIZATION.md`; the P1–P12 headings do not change when operational Rank changes.

## Existing roadmap structure

No new roadmap work is introduced here. The existing P1–P12 structure remains the implementation plan.

### P1 — Open Kanban — COMPLETED

Parent: [#1](https://github.com/jagports/jagports/issues/1)

Existing sub-work:
- P1.1 — Select Kanban tool.
- P1.2 — Create Jagports GitHub repository.
- P1.3 — Configure Kanban workflow.
- P1.4 — Define Kanban fields and labels.
- P1.5 — Define Kanban operating rules.
- Existing verification work is retained in the historical P1 records.

### P2 — Open agent accounts/access to Kanban — COMPLETED

Parent: [#8](https://github.com/jagports/jagports/issues/8)

Existing sub-work:
- [#9 — P2.1 Define agent identities](https://github.com/jagports/jagports/issues/9)
- [#10 — P2.2 Validate leader R/W rights](https://github.com/jagports/jagports/issues/10)
- [#12 — P2.3 Define permission boundaries](https://github.com/jagports/jagports/issues/12)
- [#13 — P2.4 Connect Codex to repository](https://github.com/jagports/jagports/issues/13)

### P3 — Define agent communication protocol — COMPLETED

Parent: [#14](https://github.com/jagports/jagports/issues/14)

Existing sub-work:
- [#15 — P3.1 Define escalation categories](https://github.com/jagports/jagports/issues/15)
- [#16 — P3.2 Define human decision gate](https://github.com/jagports/jagports/issues/16)
- [#17 — P3.3 Define agent hand-off format](https://github.com/jagports/jagports/issues/17)
- Existing architecture investigations #57–#60 remain part of the historical/related P3 record; this plan does not reopen or duplicate them.

### P4 — Create work-item templates — COMPLETED

Parent: [#18](https://github.com/jagports/jagports/issues/18)

Existing sub-work:
- [#19 — P4.1 Define feature template](https://github.com/jagports/jagports/issues/19)
- [#20 — P4.2 Define research template](https://github.com/jagports/jagports/issues/20)
- [#21 — P4.3 Define decision template](https://github.com/jagports/jagports/issues/21)

The current template architecture uses `.github/ISSUE_TEMPLATE/*.md` as the executable single source of truth, with documentation/policy references under `0-DocumentationEducationCompetense`.

### P5 — Establish Jagports product memory — COMPLETED

Parent: [#22](https://github.com/jagports/jagports/issues/22)

Existing sub-work:
- [#23 — P5.1 Create repository knowledge structure](https://github.com/jagports/jagports/issues/23)
- [#24 — P5.2 Record product vision and constraints](https://github.com/jagports/jagports/issues/24)
- [#25 — P5.3 Create decision log](https://github.com/jagports/jagports/issues/25)

The old proposed `00-product-vision` / `01-business-requirements` style folder tree is retired. The current knowledge structure is defined by `0-DocumentationEducationCompetense/KNOWLEDGE_ARCHITECTURE.md` and the repository's semantic root map.

### P6 — Establish prioritization system — COMPLETED

Parent: [#26](https://github.com/jagports/jagports/issues/26)

Existing sub-work:
- [#27 — P6.1 Define scoring factors](https://github.com/jagports/jagports/issues/27)
- [#28 — P6.2 Define priority rules](https://github.com/jagports/jagports/issues/28)
- [#29 — P6.3 Populate first ranked backlog](https://github.com/jagports/jagports/issues/29)

P6 is complete. [PR #707 — Define canonical prioritization scoring and ordering](https://github.com/jagports/jagports/pull/707) was merged, `00-Management/PRIORITIZATION.md` is the canonical method, and the first ranked AI OS backlog was populated and approved. The method explicitly separates legacy P-identifiers, native Issue Priority, Project Status and Project Rank.

### P7 — Run agent research-to-decision workflow — OPEN / BLOCKED

Parent: [#30](https://github.com/jagports/jagports/issues/30)

Existing sub-work:
- [#31 — P7.1 Run first research cycle](https://github.com/jagports/jagports/issues/31)
- [#32 — P7.2 Convert findings to proposals](https://github.com/jagports/jagports/issues/32)
- [#33 — P7.3 Escalate only required decisions](https://github.com/jagports/jagports/issues/33)

The practical human-in-the-loop path has been validated with real work through merged PR #708:

`Research → Finding → Opportunity → Proposal → Prioritization → Decision handling → Approved work`

P7.1–P7.3 are complete. Parent P7 remains open only for the unattended multi-agent execution capability, which is currently blocked by the unavailable suitable unattended runtime/subscription. No runtime development should be started merely to close P7 while that capability is unavailable.

### P8 — Establish Codex engineering workflow — COMPLETED

Parent: [#34](https://github.com/jagports/jagports/issues/34)

Existing sub-work:
- [#35 — P8.1 Create Codex engineering instructions](https://github.com/jagports/jagports/issues/35) — completed through merged PR #702.
- [#36 — P8.2 Exercise Codex engineering standard on approved work](https://github.com/jagports/jagports/issues/36) — completed using representative approved Issue #674 / PR #711.
- [#37 — P8.3 Validate repeatable engineering delivery loop](https://github.com/jagports/jagports/issues/37) — completed with durable validation, independent review, merge and post-merge evidence.

P8 is complete. The Codex-specific execution standard remains subordinate to `00-Management/WORKFLOWS.md`; the validated loop does not create a parallel lifecycle or test framework.

### P9 — Establish quality gates — COMPLETED

Parent: [#38](https://github.com/jagports/jagports/issues/38)

Existing sub-work:
- [#39 — P9.1 Define acceptance criteria standard](https://github.com/jagports/jagports/issues/39)
- [#40 — P9.2 Define technical review gate](https://github.com/jagports/jagports/issues/40)
- [#41 — P9.3 Define automated validation](https://github.com/jagports/jagports/issues/41)

P9 is complete. The acceptance-criteria standard, technical-review gate and deterministic automated-validation ownership are now established under the existing workflow authority. Historical implementation/review records remain in the linked Issues and PRs rather than being duplicated here.

### P10 — Prepare Raspberry Pi infrastructure — OPEN / DECISION NEEDED

Parent: [#42](https://github.com/jagports/jagports/issues/42)

Existing sub-work:
- [#43 — P10.1 Prepare Linux environment](https://github.com/jagports/jagports/issues/43) — completed.
- [#44 — P10.2 Define persistent services](https://github.com/jagports/jagports/issues/44) — waiting for platform-role decision.
- [#45 — P10.3 Establish backup strategy](https://github.com/jagports/jagports/issues/45) — waiting for platform-role decision.

The Raspberry Pi remains optional infrastructure. P10.2/P10.3 must not advance until the Product Owner decides whether the Raspberry Pi/MyNodeBTC platform will remain the intended post-prototype host. The Pi must not become the authoritative location for project decisions, work state, or unrecoverable agent state.

### P11 — Add autonomous automation — OPEN / RESEARCH

Parent: [#46](https://github.com/jagports/jagports/issues/46)

Existing sub-work:
- [#47 — P11.1 Identify automation candidates](https://github.com/jagports/jagports/issues/47) — completed.
- [#48 — P11.2 Implement first automation](https://github.com/jagports/jagports/issues/48) — completed.

The original P11 scope already has working evidence: event-driven free automation exists on `main` through #86 / PR #249, with later lifecycle/project refinements also validated. The parent is currently reopened in `RESEARCH` specifically to reconcile this existing capability and any remaining scope. Do not create duplicate autonomous-automation implementation merely because P11 is open.

Automation remains subordinate to the existing workflow and must be justified by reliability, value and operating cost rather than automation for its own sake.

### P12 — Expand and govern the agent team — OPEN / BLOCKED

Parent: [#49](https://github.com/jagports/jagports/issues/49)

Completed foundations include the persistent communication/governance model, agent architecture research, and the documented modular Lead Agent prototype. The remaining production unattended-runtime direction is blocked where it depends on unavailable Codex API execution. Permitted governance, scheduled-prompt maintenance, role-boundary review and capability tracking may continue without treating the blocked runtime as executable work.

## Vision-aligned target architecture

The durable architecture is GitHub-centered and human-governed:

```text
Human / Product Owner
        │
        ▼
GitHub Issues / Project / Repository
        │
        ├── durable work and communication record
        ├── code and documentation
        ├── decisions and evidence
        └── reusable knowledge
        │
        ▼
Lead / coordinator capability
        │
        ├── deterministic routing and filtering where possible
        ├── specialist roles where justified
        ├── engineering execution
        └── scheduled / event-driven automation and notifications
```

The coordinator, specialist implementations, local services and AI providers are replaceable implementation components. None of them replaces GitHub as the durable project record.

## Operating principles carried from the AI OS vision

1. **GitHub is the durable system of record.** Critical state, decisions, implementation traceability, review evidence and reusable project knowledge must be recoverable from GitHub/repository sources.
2. **Human authority remains explicit.** Technical capability does not grant decision, merge, deployment or governance authority beyond the repository rules.
3. **Durable memory is repository knowledge, not private conversation memory.** Reusable findings are generalized into the narrowest appropriate `KNOWLEDGE.md` scope; chronological history remains in work/research records.
4. **Deterministic work precedes expensive reasoning.** Prefer deterministic discovery, filtering, routing and validation; retrieve deeper context and use model reasoning only when it adds value.
5. **Specialist roles exist for useful responsibility boundaries.** Do not create additional agents merely to mirror an organization chart.
6. **Automation is subordinate to governance.** Polling, Actions, webhooks, local services and coordinator runtimes may accelerate work but do not redefine the workflow.
7. **Capability limitations are explicit.** Distinguish authorization, available tool capability, technical failure and genuine project blockage.

## Current agent communication and escalation model

The earlier four-category description in this file is obsolete.

The current communication protocol defines seven escalation categories:

- `DECISION`
- `BLOCKED`
- `RISK`
- `SCOPE`
- `ACCESS`
- `CONFLICT`
- `FAILURE`

`AUTO` and `REVIEW` are handling modes rather than escalation categories.

Consequential product, architecture, cost, security, data and governance decisions remain subject to the established human decision model.

## Current knowledge architecture

The canonical first-level semantic map is:

```text
0-DocumentationEducationCompetense
00-Management
1-CustomerService
2-Sales
3-Deployment
4-Production
5-Implementation-Projects
6-Development
7-Research
```

Knowledge is hierarchical. The root `KNOWLEDGE.md` contains cross-domain durable knowledge; nested `KNOWLEDGE.md` files contain durable knowledge for their domain/subdomain. Issues, PRs and research records retain chronological/task-specific evidence rather than being copied into general knowledge.

## Engineering and quality direction

The implementation path is governed by the current Management workflow and the Codex engineering execution layer, not by a parallel lifecycle in this plan.

P8 and P9 have now validated/established the current chain:

`Approved work → implementation → applicable validation → PR hand-off → independent review → required testing → merge → post-merge verification → Issue completion`

Exact gates, transitions, review rules, testing evidence and merge authority are defined in the canonical repository sources.

## Current automation/runtime capability boundary

The self-hosted Lead Agent prototype is retained as implementation evidence and a future starting point, but it is not currently an available production Codex-backed autonomous service.

A purchasable Codex API subscription suitable for the planned unattended Jagports agent runtime is not currently available. Codex-API-dependent automated/scheduled Agent Infrastructure work is therefore suspended until further notice.

The currently available agent-like scheduled capability is ChatGPT scheduled task/prompt automation. It may be used under the existing workflow, governance, verification and GitHub system-of-record rules.

If Codex API or another suitable unattended execution capability becomes available later, the suspended runtime work must be explicitly re-evaluated before resumption.

## Infrastructure and cost direction

The architecture remains modular:

- GitHub holds authoritative work/repository records.
- Existing or self-hosted hardware may provide low-cost persistent services where useful.
- Cloud services may be used where they fit approved product/deployment decisions.
- External AI/model providers should remain replaceable where practical.
- Important recovery state must not exist only inside one local runtime.

The baseline cost direction is to avoid recurring-cost dependencies when existing hardware, GitHub capabilities, free service tiers and open-source software can satisfy the requirement. A recurring-cost dependency requires an explicit project decision when its value justifies departure from that baseline.

## Current execution point

The former statement that P1 was the “very first action” is obsolete, and the later assumption that the first incomplete P-number automatically becomes the next execution target is also obsolete.

Current work selection follows `00-Management/PRIORITIZATION.md` and the live Project queue:

- completed P1–P6, P8 and P9 remain historical/implemented roadmap tracks rather than active queue entries;
- P11 is the highest-ranked remaining P-track at the current snapshot and is in `RESEARCH` reconciliation, not implementation;
- P12 and P7 retain valid future scope but their unattended-runtime work is blocked by the current capability constraint;
- P10 remains `DECISION NEEDED` and must not advance its dependent infrastructure tasks until the platform-role decision is made;
- #439 is the current plan-reconciliation work and this revision records its durable result without creating new roadmap scope.

No additional P0/P1–P12 work is introduced by this revision. Future priority or rank changes belong in the authoritative Issue/Project records and should be reflected here only when a planning/status refresh is useful.