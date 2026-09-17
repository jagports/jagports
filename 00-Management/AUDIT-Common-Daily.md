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

Within each audit's declared Workstream, use this lifecycle:

`audit discovers relevant candidates → inspect current Priority/Rank/Status → if a materially relevant active Issue has missing or stale priority evidence, perform or refresh a priority review → record the dated review → synchronize only that Issue through the bounded work-control path`

Candidate discovery comes from the canonical audit categories and current dependency, impact, urgency, readiness, unblock-value and cleanup evidence. The audit must **not** bulk-score or assign Priority to every open Issue. Missing Priority or Rank alone does not mean an Issue must immediately receive a priority review.

Perform or refresh a priority review when an active Issue becomes materially relevant to current queue maintenance and its Priority/Rank evidence is missing, stale, or materially inconsistent with current evidence. Do not perform routine review work for inactive, irrelevant, completed, superseded, or closed Issues merely because priority metadata is absent.

When the executor uses the compact `@priorize <numbers>` command for that selected work, treat it only as the GitHub execution shorthand defined by `6-Development/github/GITHUB_OPERATING_RULES.md` and `6-Development/github/GITHUB_WORKFLOWS.md`. The command does not change the audit's candidate-selection rules or the prioritization semantics in `00-Management/PRIORITIZATION.md`. In particular, business Priority/Rank remains on the owning Issue, ranked synchronization must preserve an explicit/verified `Workstream`, `Scope:` does not substitute for `Workstream:`, and an unclassified target fails closed rather than being guessed.

Priority maintenance does not create or advance workflow phase. Inspect and preserve the Issue's actual `Status`; do not invent a Status transition merely to synchronize Priority or Rank. Material strategic reordering, P0/Urgent changes, scope changes, or other Product Owner decisions belong under `DECISIONS NEEDED` rather than being silently changed.

Within the audit's declared workstream/scope:

1. Read the authoritative native Issue `Priority` and, where available through the approved read bridge or Project access, Project `Rank` and `Status`.
2. Check that Rank is interpreted only inside the declared workstream/queue and that lower numbers execute earlier.
3. Check dependencies, blockers, readiness and material new evidence against the maintained order.
4. For a materially relevant active Issue whose Priority/Rank evidence is missing, stale, or materially inconsistent, perform or refresh the priority review defined in `00-Management/PRIORITIZATION.md` and record the dated review in that Issue.
5. Synchronize only that Issue through the bounded work-control path when synchronization is required and current authority/capability permit it; when using `@priorize`, follow the GitHub-specific execution/verification rules and preserve explicit/verified Workstream rather than inferring it from scope or topic.
6. Correct routine stale/inconsistent values only when current authority and capability explicitly permit it and the result can be independently verified.
7. Surface material reordering, P0/Urgent changes, scope changes, or other Product Owner decisions under `DECISIONS NEEDED` rather than silently changing strategic order.
8. Use the approved machine-readable work-control snapshot as the agent-facing read bridge when Project fields are not directly readable.
9. If an individual snapshot is stale or missing and recovery is authorized, refresh only that specific open Issue through the bounded single-Issue recovery path documented in `00-Management/PRIORITIZATION.md`.

The scheduled audit is a reconciliation and queue-maintenance mechanism. Event-driven GitHub automation remains responsible for immediate synchronization after authoritative field changes.

The audit must **not** request or depend on a full-Project snapshot scan. There is deliberately no daily or broad manual snapshot reconciliation. Recovery remains single-Issue and explicitly bounded so an audit cannot accidentally fan out across hundreds of Issues or consume a material portion of the GitHub Actions allowance.

## Machine-readable work-control snapshot

The managed snapshot comment is a read-only bridge for agents and tools that cannot directly read all native Issue/Project fields. It must not become a competing source of truth.

The managed comment is identified by the standalone marker:

```text
<!-- jagports-work-control-snapshot -->
```

The snapshot exposes at minimum:

- verification timestamp when the managed comment is written;
- native Issue `Priority`;
- Project identity;
- Project `Workstream`;
- Project `Status`;
- Project `Rank`.

`.github/workflows/sync-issue-work-control-to-project.yml` owns bounded snapshot publication as part of the same single-Issue operation that synchronizes work-control values. After an authorized Priority/Status/Rank/Workstream change it refreshes only the affected open Issue, independently rereads the managed comment, and verifies the expected values. If multiple matching managed comments exist, the workflow must fail closed rather than guess which comment is authoritative.

Manual snapshot recovery is permitted only through the same workflow's `workflow_dispatch` path with one explicit Issue number. Manual dispatch is snapshot-only and cannot request a full-Project scan or authoritative field mutation.

Managed snapshot writes use the repository `GITHUB_TOKEN` so the resulting comment event does not recursively start ordinary `issue_comment` workflows. Project reads/writes continue to use the separately authorized Project token.

Closed Issues are excluded from routine work-control mutation and snapshot refresh.

## Audit checks

Within the applicable scope, inspect Issues and PRs for actionable exceptions including:

- Issue Priority, Project Rank, Project Status and work-plan consistency;
- incorrect, missing or stale workstream/scope assignment where the combined Project uses a `Workstream` field;
- incorrect, missing or stale information;
- explicit parent/child task relationships recorded in Issue bodies and other required relationships;
- labels and documented workflow state;
- linked PRs and review state;
- stale, blocked or otherwise stalled work;
- communication and documentation gaps;
- violations of documented management, development, testing or communication processes;
- missing agent communications, decisions, hand-offs, results or implementation traceability in the GitHub system of record.

For Jagports task hierarchy, the parent Issue's child references and the child Issue's parent reference in Issue bodies are authoritative. Native GitHub sub-issue metadata is not required Jagports state. Do not create, repair, reorder, migrate, synchronize, or audit native GitHub sub-issue relationships. Historical native relationships may remain as legacy metadata and are not audit exceptions by themselves.

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
