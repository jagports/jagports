# Jagports AI OS — Prioritized Work Plan

> **WORK IN PROGRESS** — This file is a planning and status view of the existing Jagports AI OS work. GitHub Issues are the primary work and communication records; the GitHub Project visualizes their workflow state. This document does not create new work or redefine the canonical workflow.

## Authority and vision alignment

The umbrella work item is [#135 — [P0] Establish Jagports AI OS](https://github.com/jagports/jagports/issues/135). P0 is complete when P1–P12 are all complete or explicitly descoped.

This plan is subordinate to the current repository authorities and durable vision:

- [`../00-Management/VISION_AI-OS.md`](../00-Management/VISION_AI-OS.md) — product/operating vision.
- [`../00-Management/WORKFLOWS.md`](../00-Management/WORKFLOWS.md) — canonical Management workflow authority.
- [`../00-Management/RULES.md`](../00-Management/RULES.md) — human governance and authority.
- [`../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md`](../0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md) — persistent communication, escalation, decision and hand-off rules.
- [`../0-DocumentationEducationCompetense/KNOWLEDGE_ARCHITECTURE.md`](../0-DocumentationEducationCompetense/KNOWLEDGE_ARCHITECTURE.md) — current durable-knowledge architecture.

The P1–P12 identifiers below are the established AI OS roadmap sequence. They are not a substitute for current workflow state, GitHub Project Status, or any separately approved operational priority/rank method.

## Current P0 status — 2026-09-16

P0 remains **OPEN**. Five of the twelve parent tracks are closed as completed; seven remain open.

| Track | Parent Issue | Current state |
|---|---|---|
| P1 | [#1 — Open Kanban](https://github.com/jagports/jagports/issues/1) | **COMPLETED** |
| P2 | [#8 — Open agent accounts/access to Kanban](https://github.com/jagports/jagports/issues/8) | **COMPLETED** |
| P3 | [#14 — Define agent communication protocol](https://github.com/jagports/jagports/issues/14) | **COMPLETED** |
| P4 | [#18 — Create work-item templates](https://github.com/jagports/jagports/issues/18) | **COMPLETED** |
| P5 | [#22 — Establish Jagports product memory](https://github.com/jagports/jagports/issues/22) | **COMPLETED** |
| P6 | [#26 — Establish prioritization system](https://github.com/jagports/jagports/issues/26) | **OPEN** — [PR #707](https://github.com/jagports/jagports/pull/707) implements P6.1/P6.2 and is at the independent-review boundary; P6.3 remains after the method is accepted. |
| P7 | [#30 — Run agent research-to-decision workflow](https://github.com/jagports/jagports/issues/30) | **OPEN** — human-in-the-loop validation is available; unattended runtime-dependent execution is suspended. |
| P8 | [#34 — Establish Codex engineering workflow](https://github.com/jagports/jagports/issues/34) | **OPEN** — P8.1 is complete; P8.2/P8.3 still require representative current execution and end-to-end evidence. |
| P9 | [#38 — Establish quality gates](https://github.com/jagports/jagports/issues/38) | **OPEN** — acceptance-criteria foundations are established; [PR #706](https://github.com/jagports/jagports/pull/706) is at the independent-review boundary for the remaining P9.2/P9.3 work. |
| P10 | [#42 — Prepare Raspberry Pi infrastructure](https://github.com/jagports/jagports/issues/42) | **OPEN** — existing infrastructure track remains unresolved. |
| P11 | [#46 — Add autonomous automation](https://github.com/jagports/jagports/issues/46) | **OPEN** — existing automation track remains unresolved, although automation foundations already exist elsewhere in the repository. |
| P12 | [#49 — Expand and govern the agent team](https://github.com/jagports/jagports/issues/49) | **OPEN** — governance, architecture research and the Lead Agent prototype exist; production unattended-runtime work is suspended until a suitable execution capability is available and re-evaluated. |

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

### P6 — Establish prioritization system — OPEN

Parent: [#26](https://github.com/jagports/jagports/issues/26)

Existing sub-work:
- [#27 — P6.1 Define scoring factors](https://github.com/jagports/jagports/issues/27)
- [#28 — P6.2 Define priority rules](https://github.com/jagports/jagports/issues/28)
- [#29 — P6.3 Populate first ranked backlog](https://github.com/jagports/jagports/issues/29)

Current implementation: [PR #707 — Define canonical prioritization scoring and ordering](https://github.com/jagports/jagports/pull/707) implements #27/#28 and is awaiting independent review. #29 remains the existing follow-on after that method is accepted.

### P7 — Run agent research-to-decision workflow — OPEN

Parent: [#30](https://github.com/jagports/jagports/issues/30)

Existing sub-work:
- [#31 — P7.1 Run first research cycle](https://github.com/jagports/jagports/issues/31)
- [#32 — P7.2 Convert findings to proposals](https://github.com/jagports/jagports/issues/32)
- [#33 — P7.3 Escalate only required decisions](https://github.com/jagports/jagports/issues/33)

The practical human-in-the-loop path remains available:

`Research → Finding → Opportunity → Proposal → Prioritization → Decision handling → Approved work`

A fully unattended chain that depends on a Codex API or equivalent unattended runtime is suspended under the current capability constraint.

### P8 — Establish Codex engineering workflow — OPEN

Parent: [#34](https://github.com/jagports/jagports/issues/34)

Existing sub-work:
- [#35 — P8.1 Create Codex engineering instructions](https://github.com/jagports/jagports/issues/35) — completed through merged PR #702.
- [#36 — P8.2 Exercise Codex engineering standard on approved work](https://github.com/jagports/jagports/issues/36) — open.
- [#37 — P8.3 Validate repeatable engineering delivery loop](https://github.com/jagports/jagports/issues/37) — open.

P8 now validates the current engineering execution layer against real work rather than trying to establish a second lifecycle. `00-Management/WORKFLOWS.md` remains the workflow authority.

### P9 — Establish quality gates — OPEN

Parent: [#38](https://github.com/jagports/jagports/issues/38)

Existing sub-work:
- [#39 — P9.1 Define acceptance criteria standard](https://github.com/jagports/jagports/issues/39)
- [#40 — P9.2 Define technical review gate](https://github.com/jagports/jagports/issues/40)
- [#41 — P9.3 Define automated validation](https://github.com/jagports/jagports/issues/41)

Current implementation: [PR #706 — Complete P9 technical review and validation gates](https://github.com/jagports/jagports/pull/706) covers the remaining P9.2/P9.3 process work and is awaiting independent review.

### P10 — Prepare Raspberry Pi infrastructure — OPEN

Parent: [#42](https://github.com/jagports/jagports/issues/42)

Existing sub-work:
- [#43 — P10.1 Prepare Linux environment](https://github.com/jagports/jagports/issues/43)
- [#44 — P10.2 Define persistent services](https://github.com/jagports/jagports/issues/44)
- [#45 — P10.3 Establish backup strategy](https://github.com/jagports/jagports/issues/45)

The Raspberry Pi remains optional infrastructure. It must not become the authoritative location for project decisions, work state, or unrecoverable agent state.

### P11 — Add autonomous automation — OPEN

Parent: [#46](https://github.com/jagports/jagports/issues/46)

Existing sub-work:
- [#47 — P11.1 Identify automation candidates](https://github.com/jagports/jagports/issues/47)
- [#48 — P11.2 Implement first automation](https://github.com/jagports/jagports/issues/48)

Automation remains subordinate to the existing workflow and must be justified by reliability, value and operating cost rather than automation for its own sake.

### P12 — Expand and govern the agent team — OPEN

Parent: [#49](https://github.com/jagports/jagports/issues/49)

Completed foundations include the persistent communication/governance model, agent architecture research, and the documented modular Lead Agent prototype. The remaining production unattended-runtime direction is suspended where it depends on unavailable Codex API execution. ChatGPT scheduled task/prompt automation remains available where appropriate.

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

Conceptually, existing P8/P9 work validates the chain:

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

The former statement that P1 is the “very first action” is obsolete because P1–P5 are complete.

The established roadmap continues from the incomplete P6–P12 tracks without creating additional work here:

- P6 is the first incomplete parent track; PR #707 is currently at review before the existing P6.3 follow-on.
- P7 remains available for human-in-the-loop research-to-decision validation while unattended execution is suspended.
- P8 remains focused on representative validation of the current engineering standard and repeatable delivery loop.
- P9 remains open with PR #706 at review for the remaining technical-review/automated-validation work.
- P10 and P11 remain later incomplete roadmap tracks under their existing Issues.
- P12 remains open with its established governance/prototype foundations and the unattended-runtime capability constraint.

No additional P0/P1–P12 work is introduced by this revision.
