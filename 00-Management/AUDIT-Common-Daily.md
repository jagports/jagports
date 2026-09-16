# Jagports Common Daily Audit Method

## Purpose

Canonical processing method for daily audits.

Individual audit procedures define their own scope. This file defines the common audit logic, prioritisation, category discipline and output rules so the audit method is maintained in one place.

`00-Management/PRIORITIZATION.md` remains authoritative for Issue Priority, Project Rank, scoring and queue-maintenance semantics. The audit consumes and maintains that model; it must not create a competing prioritization system.

## Processing order

Process applicable work in this exact order:

`SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP`

### SHOW-STOPPERS

Identify only work that genuinely prevents progress within the audit scope and requires immediate attention.

Ordinary backlog or unavailable tooling capability is not a show-stopper by itself. A specific work item must actually be prevented from progressing.

### DO FIRST

Find the few highest-priority actionable items after show-stoppers. Use the authoritative Issue Priority and Project Rank where available, then apply dependency, impact, urgency, readiness and unblock value.

### LOW-HANGING FRUITS

Find small, clear, low-risk actions that can be completed quickly and have useful value.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small.

### DECISIONS NEEDED

Find only decisions that require human authority.

### BLOCKED

Find only direct capability/access blockers that actually prevent work from progressing.

## Prioritization maintenance

Within the audit's declared workstream/scope:

1. Read the authoritative native Issue `Priority` and, where available through the approved read bridge or Project access, Project `Rank` and `Status`.
2. Check that Rank is interpreted only inside the declared workstream/queue and that lower numbers execute earlier.
3. Check dependencies, blockers, readiness and material new evidence against the maintained order.
4. Correct routine stale/inconsistent values only when current authority and capability explicitly permit it and the result can be independently verified.
5. Surface material reordering, P0/Urgent changes, scope changes, or other Product Owner decisions under `DECISIONS NEEDED` rather than silently changing strategic order.
6. Use the approved machine-readable work-control snapshot as the agent-facing read bridge when Project fields are not directly readable, and refresh it through the documented automation when authorized.

The scheduled audit is a reconciliation and queue-maintenance mechanism. Event-driven GitHub automation remains responsible for immediate synchronization after authoritative field changes.

The repository also runs a **daily** fallback reconciliation through `.github/workflows/publish-work-control-snapshots.yml`. Its scheduled trigger is `17 0 * * *` (00:17 UTC each day). This is a safety/reconciliation path, not the primary update path: verified work-control or Workstream changes should request an immediate snapshot refresh through the approved event-driven automation.

## Machine-readable work-control snapshot

The managed snapshot comment is a read-only bridge for agents and tools that cannot directly read all native Issue/Project fields. It must not become a competing source of truth.

The managed comment is identified by the standalone marker:

```text
<!-- jagports-work-control-snapshot -->
```

The snapshot exposes at minimum:

- verification timestamp;
- native Issue `Priority`;
- Project identity;
- Project `Workstream`;
- Project `Status`;
- Project `Rank`.

`.github/workflows/publish-work-control-snapshots.yml` updates one managed snapshot comment per Project Issue and independently verifies the written values. If multiple matching managed comments exist, the workflow must fail closed rather than guess which comment is authoritative.

## Audit checks

Within the applicable scope, inspect Issues and PRs for actionable exceptions including:

- Issue Priority, Project Rank, Project Status and work-plan consistency;
- incorrect, missing or stale workstream/scope assignment where the combined Project uses a `Workstream` field;
- incorrect, missing or stale information;
- parent/sub-issue relationships and other required relationships;
- labels and documented workflow state;
- linked PRs and review state;
- stale, blocked or otherwise stalled work;
- communication and documentation gaps;
- violations of documented management, development, testing or communication processes;
- missing agent communications, decisions, hand-offs, results or implementation traceability in the GitHub system of record.

Use repository, Issue, PR, review, implementation and testing evidence. Do not claim a check succeeded when the required evidence or access was unavailable.

Exclude closed Issues and completed/closed PRs from the active audit list. They may be referenced as historical evidence when needed, but they must not be reported as current audit work.

## Work paths

When an Issue/PR has a defined or explicitly proposed work path, show that work path whenever the Issue/PR is reported, regardless of its audit category.

A work path shows related Issues/PRs in dependency or execution order. It must be supported by repository evidence, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies, relationships or implementation steps merely to create a work path.

Do not duplicate an Issue/PR as a separate report item merely because it appears inside another item's work path. Each Issue/PR is assigned to one report category only.

Use the inherited Communication Protocol for the required work-path and Issue/PR reference formatting.

## Category discipline

- Every Issue or PR may be shown in one and only one report category.
- If an Issue/PR could qualify for multiple categories, place it only in the first applicable category: **SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP → DECISIONS NEEDED → BLOCKED**.
- A work path may explain relationships to Issues/PRs assigned to another category, but must not repeat those Issues/PRs as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Do not create duplicate work items merely because the same underlying work is relevant to multiple audit categories.
- If a category has no qualifying item, write exactly `None`.
- Prefer finishing, testing, merging, consolidating and closing existing work over creating new work.

## Required output

Produce a compact report with exactly these sections:

- **OVERALL STATE** — one short statement. If there is no important problem within the audit scope, say `None`.
- **SHOW-STOPPERS** — genuine blockers to progress, or `None`. Show any defined or proposed work path directly with the item.
- **DO FIRST** — the few actions that should be acted on, in priority order, with linked GitHub Issue/PR number and title where applicable. Show any defined or proposed work path directly with the item.
- **LOW-HANGING FRUITS** — quick actions, or `None`. Show any defined or proposed work path directly with the item.
- **QUEUE CLEANUP** — cleanup actions, or `None`. Show any defined or proposed work path directly with the item.
- **DECISIONS NEEDED** — only decisions that require human authority, or `None`. Show any defined or proposed work path directly with the item.
- **BLOCKED** — only direct capability/access blockers, or `None`. Show any defined or proposed work path directly with the item.

Keep the report short and use simple, action-oriented language.

## Capability boundary

Do not require or claim operations that the current agent connection cannot perform or independently verify. When a required operation or evidence source is unavailable, record the limitation accurately and continue work that can be performed and verified.
