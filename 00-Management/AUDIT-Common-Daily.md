# Jagports Common Daily Audit Method

## Purpose

Canonical processing method shared by the AI OS and VIEPS daily audits.

The individual audit files define scope. This file defines the common prioritisation, category discipline and output rules.

## Processing order

Process applicable work in this exact order:

`SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP`

### SHOW-STOPPERS

Identify only work that genuinely prevents progress within the audit scope and requires immediate attention.

Ordinary backlog, unavailable tooling capability, or inability to independently verify Project Item state is not a show-stopper by itself. A specific work item must actually be prevented from progressing.

### DO FIRST

Find the few highest-priority actionable items after show-stoppers. Use dependency, impact, urgency, readiness and unblock value.

### LOW-HANGING FRUITS

Find small, clear, low-risk actions that can be completed quickly and have useful value.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small.

Human decisions are reported only when a decision is genuinely required to proceed. They do not create a separate priority category.

## Work paths

When an Issue/PR has a defined or explicitly proposed work path, show that work path whenever the Issue/PR is reported.

A work path shows related Issues/PRs in dependency or execution order. It must be supported by repository evidence, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies, relationships or implementation steps merely to create a work path.

Do not duplicate an Issue/PR as a separate report item merely because it appears inside another item's work path. Each Issue/PR is assigned to one report category only.

Use the inherited Communication Protocol for the required work-path and Issue/PR reference formatting.

## Category discipline

- Every Issue or PR may be shown in one and only one report category.
- Apply the priority order: SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP.
- A work path may explain relationships to Issues/PRs assigned to another category, but must not repeat those Issue/PRs as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Do not create duplicate work items merely because the same underlying work is relevant to multiple categories.
- If a category has no qualifying item, write exactly `None`.
- Prefer finishing, testing, merging, consolidating and closing existing work over creating new work.
- Report a human decision only when it is genuinely required; identify the affected Issue/PR in the applicable priority category or state that a decision is required in the item text.

## Output

Produce a concise, action-oriented report with exactly these sections, in this order:

- **OVERALL STATE** — one short sentence.
- **SHOW-STOPPERS** — genuine blockers to progress, or `None`.
- **DO FIRST** — the few actions that should be done next, in order, with linked GitHub Issue/PR number and title when applicable.
- **LOW-HANGING FRUITS** — quick, high-value actions, or `None`.
- **QUEUE CLEANUP** — cleanup actions, or `None`.

Show any defined or explicitly proposed work path directly under the relevant item.

## Capability boundary

Do not require or claim Project V2 operations that the current agent connection cannot perform or independently verify.
