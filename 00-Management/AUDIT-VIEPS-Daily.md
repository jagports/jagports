# Jagports VIEPS App Daily Audit

## Purpose

Daily audit of the Issues and PRs that directly concern VIEPS App creation and operation.

The audit must identify both the immediate work to execute and dependency/enabling relationships that show what important work solves and what capability it enables next.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If the file is successfully read, execute the complete procedure and return only the required audit output defined below.

## Audit

Use `jagports/jagports` as the system of record and operate according to the repository's authoritative knowledge and operating rules.

### SHOW-STOPPERS

Find only real blockers. A blocker must have evidence that it can stop or seriously delay VIEPS progress.

### DO FIRST

Find the few VIEPS actions that should be done first. Use dependency, impact, urgency, readiness and unblock value.

When a relevant Issue/PR has a defined or proposed work path, the work path MUST always be shown with that Issue/PR. A work path should show, in order:

`work item → problem/capability it solves → capability/work it enables → next meaningful work`

When the source Issue/PR defines a concrete sequence of Issues/PRs, show that sequence explicitly in the work path, using the Issue/PR numbers and titles as applicable.

A work path may contain multiple existing Issues/PRs when that dependency relationship is evidenced by repository knowledge, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies merely to make a path longer.

### LOW-HANGING FRUITS

Find small VIEPS work that can be completed quickly.

When a relevant Issue/PR has a defined or proposed work path, the work path MUST always be shown with that Issue/PR, using the same format and evidence rules as DO FIRST.

### QUEUE CLEANUP

Find VIEPS work that can be completed, consolidated, superseded or closed so the active queue stays small.

When a relevant Issue/PR has a defined or proposed work path, the work path MUST always be shown with that Issue/PR, using the same format and evidence rules as DO FIRST.

### DECISIONS NEEDED

Find only decisions that require human authority.

When a relevant Issue/PR has a defined or proposed work path, the work path MUST always be shown with that Issue/PR, using the same format and evidence rules as DO FIRST.

### BLOCKED

Find only direct VIEPS capability/access blockers.

When a relevant Issue/PR has a defined or proposed work path, the work path MUST always be shown with that Issue/PR, using the same format and evidence rules as DO FIRST.

## Required output

Produce a compact report with exactly these sections:

- **OVERALL STATE** — one short statement. If there is no important VIEPS problem, say `None`.
- **DO FIRST** — the few VIEPS actions that should be acted on, in priority order, with linked GitHub Issue/PR number and title where applicable. Whenever a listed Issue/PR has a defined or proposed work path, show that work path directly with the item.
- **LOW-HANGING FRUITS** — quick VIEPS actions, or `None`. Include relevant Issue/PR references and, whenever a listed Issue/PR has a defined or proposed work path, show that work path directly with the item.
- **QUEUE CLEANUP** — VIEPS cleanup actions, or `None`. Include relevant Issue/PR references and, whenever a listed Issue/PR has a defined or proposed work path, show that work path directly with the item.
- **DECISIONS NEEDED** — only decisions that require human authority, or `None`. Include relevant Issue/PR references and, whenever a listed Issue/PR has a defined or proposed work path, show that work path directly with the item.
- **BLOCKED** — only direct VIEPS capability/access blockers, or `None`. Include relevant Issue/PR references and, whenever a listed Issue/PR has a defined or proposed work path, show that work path directly with the item.

## Output rules

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- Issue and PR references are allowed in every report section when relevant.
- A work path is a presentation style for showing dependency/enabling relationships between relevant work items; it is not a report category.
- Any report category may contain one or more work paths when relevant Issues/PRs exist.
- If an Issue/PR has a defined or proposed work path, showing that work path is mandatory; do not omit it because the Issue/PR is in a category other than DO FIRST.
- Every Issue or PR may be shown in **one and only one** report category.
- Before producing the report, assign each qualifying Issue/PR to the single category where it most appropriately belongs.
- If an Issue/PR could qualify for multiple categories, place it only in the first applicable category following the report's category order: **SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP → DECISIONS NEEDED → BLOCKED**.
- A work path may explain relationships to Issues/PRs assigned to other categories, but must not repeat their Issue/PR references as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Do not create duplicate work items merely because the same underlying work is relevant to multiple audit categories; assign the existing Issue/PR to its single category.
- Do not put generic advice into empty categories.
- If a category has no qualifying item, write exactly `None`.
- Keep the report short.
- Prefer completing existing VIEPS work over creating new work.

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

## Operating rules

- Read-only by default.
- GitHub is the system of record.
- Issues do not require review; PRs do require review.
- Do not claim Project Item Status unless independently verified.
- Unresolved VIEPS product/domain choices go under **DECISIONS NEEDED**.

Changes to this procedure use Issue → branch → PR → review → merge.
