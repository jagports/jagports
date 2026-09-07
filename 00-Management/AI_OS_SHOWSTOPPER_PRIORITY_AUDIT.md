# Jagports AI OS Showstopper & Priority Audit — Task Instructions

## Purpose

This file is the durable operational source for the recurring **Jagports AI OS Showstopper & Priority Audit**.

The audit is a decision-support and work-queue-control procedure for the small set of Issues and PRs that materially affect creation and operation of the **Jagports AI OS**.

It is **not** a general project/repository audit and it is **not** the VIEPS App implementation or VIEPS product-requirements audit. VIEPS work is covered by `00-Management/VIEPS_DAILY_AUDIT.md`, except when a VIEPS item is a direct dependency or show-stopper for AI OS infrastructure itself.

Changes to this procedure must use Issue → branch → PR → review → merge.

## Audit execution

Act as the Jagports Team Lead Agent and audit `jagports/jagports` using GitHub as the system of record.

Read:
- `00-Management/RULES.md`
- `00-Management/WORKFLOWS.md`
- `00-Management/GITHUB_OPERATING_RULES.md`
- `SKILL.md`
- `KNOWLEDGE.md`
- relevant management/agent-communication Markdown
- `Jagports_AI_OS_Prioritized_Work_Plan.md` when accessible
- this file

Do not use obsolete `tlindi/jagports`.

## Core questions

The audit must answer these questions in this order:

### 1. SHOW-STOPPERS — What can materially prevent AI OS progress?

Identify the few open Issues/PRs, dependencies, missing decisions, blocked capabilities, broken processes, or other conditions that can materially prevent or seriously delay AI OS creation or operation.

A show-stopper must have evidence of material impact. Do not label ordinary backlog work as a show-stopper merely because it is high priority.

### 2. DO FIRST — What should be done next?

Produce a short, ordered execution list based on current evidence. Consider:
- dependency order;
- impact;
- urgency;
- unblock value;
- readiness;
- ability to reduce active-work complexity.

Do not simply reproduce an old priority list or sort Issues by number.

### 3. LOW-HANGING FRUITS — What can be completed quickly?

Identify small, well-understood, low-risk actions that can:
- finish existing work;
- remove stale or obsolete work;
- consolidate overlapping Issues/PRs;
- unblock another item;
- improve traceability or process reliability;
- otherwise reduce the amount of active work.

Prefer completing or consolidating existing work over creating additional Issues.

### 4. WORK QUEUE CLEANUP — How do we keep open work small?

Look deliberately for:
- duplicate or overlapping Issues;
- stale or obsolete Issues;
- over-split work that can legitimately be consolidated;
- open PRs that can be completed, superseded, or closed through the normal workflow;
- Issues that are no longer justified because their required outcome already exists;
- opportunities to resolve several related items with one coherent implementation.

The objective is not to minimize the raw Issue/PR count at any cost. The objective is a **small, current, actionable queue** with traceability preserved.

Do not create new Issues merely to record audit observations when an existing Issue can own the work.

## Scope

Include only Issues and PRs materially relevant to:
- AI OS creation and operation;
- AI OS governance and management infrastructure;
- agent/tooling infrastructure;
- delivery workflow and repository process that directly affects AI OS execution;
- dependencies and blockers affecting AI OS work;
- important decisions required for AI OS progress.

Exclude ordinary VIEPS App implementation and VIEPS product requirements. Include a VIEPS item only when evidence shows it is a direct dependency or show-stopper for AI OS infrastructure itself.

The audit may inspect surrounding repository state when necessary to establish evidence, dependency, staleness, redundancy, or readiness, but must not turn into a general repository status report.

## Required output

Return a concise, action-oriented report containing:

- **OVERALL STATE** — whether a genuine AI OS show-stopper currently prevents the next meaningful progress.
- **SHOW-STOPPERS** — highest-impact blockers with exact Issue/PR references, evidence, dependency and required next action.
- **DO FIRST** — a short ordered list of the most valuable next actions.
- **LOW-HANGING FRUITS** — quick concrete actions that can reduce active work or unlock progress.
- **WORK QUEUE CLEANUP** — duplicate, obsolete, stale, over-split, or consolidatable work, with the appropriate next action.
- **DECISIONS NEEDED** — only decisions that genuinely require human authority.
- **BLOCKED** — capability/access blockers with evidence; never claim verification that could not be performed.

Every actionable finding must include:
- exact Issue/PR number and title;
- problem or opportunity;
- evidence/source;
- applicable source-of-truth document when relevant;
- next action.

Keep the lists short. The audit should surface the few actions that matter most, not enumerate the entire backlog.

## Audit behaviour

- Read-only by default.
- Do not create Issues/PRs merely because the audit identifies possible work. Follow the normal Issue discovery/reuse workflow when implementation is actually requested.
- Prefer finishing, consolidating, superseding, or closing unnecessary active work over opening more work.
- Do not let low-priority housekeeping displace a genuine show-stopper.
- Do not let backlog size obscure the few actions that matter most.
- Do not optimize for a low Issue/PR count by hiding legitimate work or breaking traceability.
- Issues do not require review. PRs do require review.
- GitHub remains the system of record.
- Project Item Status must only be reported when independently verified.

## GitHub Projects V2 blocker

Track upstream `openai/codex#43297` as the external blocker for GitHub Projects V2 verification where that capability is relevant.

Every run:
1. Check its current state, latest comments, linked/referenced fixes and indications of connector support.
2. Do not treat closure as resolution.
3. Resolution requires an actual functional test from this environment:
   - read `Jagports AI OS` Project;
   - read Project items;
   - read Project Item Status;
   - inspect required Project fields/relationships.
4. If that functional test fails, report the appropriate blocker state and do not claim Project verification.
5. If it succeeds, record the tested capabilities and re-evaluate previously blocked `#371`, `#383` and `#363`.

Use exactly one applicable state:
- `BLOCKED — #43297 still prevents Project V2 verification`
- `BLOCKED — upstream issue changed, functional test still fails`
- `RESOLVED — #43297 fixed and Project V2 access independently tested`
- `REGRESSION — previously working Project V2 access has failed again`

Until successful end-to-end Project V2 testing, do not claim Project verification merely from intended configuration or mutation responses.

## Source-of-truth and historical-record rules

The audit may reference closed Issues and merged PRs as historical evidence, but must not modify their descriptions or comments merely to rename the audit or correct historical terminology.

When current scope materially changes, active Issue/PR titles may be updated through the normal workflow. Historical names remain historical records.

The canonical Management workflow remains `00-Management/WORKFLOWS.md`; this procedure does not redefine workflow states or review/merge rules.
