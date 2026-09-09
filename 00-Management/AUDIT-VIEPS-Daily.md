# Jagports VIEPS App Daily Audit

## Purpose

Daily audit of the Issues and PRs that directly concern VIEPS App creation and operation.

The audit uses the same processing method as the AI OS daily audit. The scope/data differs; the prioritisation method does not.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If the file is successfully read, execute the complete procedure and return only the required audit output defined below.

## Common audit method

Process applicable work in this exact order:

`SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP`

### SHOW-STOPPERS

Identify only work that genuinely prevents VIEPS progress and requires immediate attention.

Do not classify ordinary backlog, unavailable tooling capability, or inability to independently verify Project Item state as a show-stopper unless a specific work item is actually prevented from progressing.

### DO FIRST

Find the few highest-priority actionable VIEPS items after show-stoppers. Use dependency, impact, urgency, readiness and unblock value.

### LOW-HANGING FRUITS

Find small, clear, low-risk VIEPS actions that can be completed quickly and have useful value.

### QUEUE CLEANUP

Find VIEPS work that can be finished, merged, consolidated, superseded or closed so the active queue stays small.

Human decisions should be reported only when a decision is actually required to proceed; they do not create a separate audit method or priority category.

## Work paths

When an Issue/PR has a defined or explicitly proposed work path, show that work path whenever the Issue/PR is reported.

A work path shows related Issues/PRs in dependency or execution order. It must be supported by repository evidence, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies, relationships or implementation steps merely to create a work path.

Do not duplicate an Issue/PR as a separate report item merely because it appears inside another item's work path. Each Issue/PR is assigned to one report category only.

Use the inherited Communication Protocol for the required work-path and Issue/PR reference formatting.

## Required output

Produce a concise, action-oriented report with exactly these sections, in this order:

- **OVERALL STATE** — one short sentence.
- **SHOW-STOPPERS** — genuine blockers to VIEPS progress, or `None`.
- **DO FIRST** — the few VIEPS actions that should be done next, in order, with linked GitHub Issue/PR number and title when applicable.
- **LOW-HANGING FRUITS** — quick, high-value VIEPS actions, or `None`.
- **QUEUE CLEANUP** — VIEPS cleanup actions, or `None`.

Show any defined or explicitly proposed work path directly under the relevant item.

### Category discipline

- Every Issue or PR may be shown in **one and only one** report category.
- Apply the priority order: **SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP**.
- A work path may explain relationships to Issues/PRs assigned to another category, but must not repeat those Issue/PRs as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Do not create duplicate work items merely because the same underlying work is relevant to multiple categories.
- If a category has no qualifying item, write exactly `None`.
- Keep the report short and use simple language.
- Prefer finishing, testing, merging, consolidating and closing existing VIEPS work over creating new work.
- Report a human decision only when it is genuinely required; identify the affected Issue/PR in the applicable priority category or state that a decision is required in the item text.

## VIEPS scope

Relevant work includes:
- VIEPS UI/application implementation;
- Parts Data Model and API/data integration;
- JEPC Data Importer and catalogue/reference data;
- fitment, vehicle/model/VIN applicability;
- EPC diagrams and verified hotspot conversion;
- silhouettes, zones and location mapping;
- supersession and Jaguar Classic semantics;
- operational stock integration;
- VIEPS dependencies and VIEPS-specific research/specification decisions;
- automated tests and required human verification;
- VIEPS implementation readiness and documentation.

Project Item capability limitations are not blockers by themselves. Do not require Project V2 operations that the current agent connection cannot perform or independently verify.
