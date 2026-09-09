# Jagports Common Daily Audit Method

## Purpose

Canonical processing method for daily audits.

Individual audit procedures define their own scope. This file defines the common audit logic, prioritisation, category discipline and output rules so the audit method is maintained in one place.

## Processing order

Process applicable work in this exact order:

`SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP`

### SHOW-STOPPERS

Identify only work that genuinely prevents progress within the audit scope and requires immediate attention.

Ordinary backlog or unavailable tooling capability is not a show-stopper by itself. A specific work item must actually be prevented from progressing.

### DO FIRST

Find the few highest-priority actionable items after show-stoppers. Use dependency, impact, urgency, readiness and unblock value.

### LOW-HANGING FRUITS

Find small, clear, low-risk actions that can be completed quickly and have useful value.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small.

Human decisions are reported only when a decision is genuinely required to proceed. They do not create a separate priority category.

## Audit checks

Within the applicable scope, inspect Issues and PRs for actionable exceptions including:

- priority and work-plan consistency;
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
- Apply the priority order: SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP.
- A work path may explain relationships to Issues/PRs assigned to another category, but must not repeat those Issues/PRs as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Do not create duplicate work items merely because the same underlying work is relevant to multiple audit categories.
- If a category has no qualifying item, write exactly `None`.
- Prefer finishing, testing, merging, consolidating and closing existing work over creating new work.
- Report a human decision only when it is genuinely required; identify the affected Issue/PR in the applicable priority category or state that a decision is required in the item text.

## Output

Produce a short, concise and action-oriented report with exactly these sections, in this order:

- **OVERALL STATE** — one short sentence.
- **SHOW-STOPPERS** — genuine blockers to progress, or `None`.
- **DO FIRST** — the few actions that should be done next, in priority order, with linked GitHub Issue/PR number and title when applicable.
- **LOW-HANGING FRUITS** — quick, high-value actions, or `None`.
- **QUEUE CLEANUP** — cleanup actions, or `None`.

For every reported Issue/PR, show any defined or explicitly proposed work path directly under that item, regardless of the category in which the item appears.

Use simple language and keep the report short. Do not add separate `DECISIONS NEEDED` or `BLOCKED` sections. A required human decision belongs in the applicable priority category. A capability/access limitation belongs in the applicable item only when it actually prevents that work item from progressing.

## Capability boundary

Do not require or claim operations that the current agent connection cannot perform or independently verify. When a required operation or evidence source is unavailable, record the limitation accurately and continue work that can be performed and verified.
