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

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path. A work path should show, in order:

`work item → problem/capability it solves → capability/work it enables → next meaningful work`

A work path may contain multiple existing Issues/PRs when that dependency relationship is evidenced by repository knowledge, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies merely to make a path longer.

### LOW-HANGING FRUITS

Find small VIEPS work that can be completed quickly.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

### QUEUE CLEANUP

Find VIEPS work that can be completed, consolidated, superseded or closed so the active queue stays small.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

### DECISIONS NEEDED

Find only decisions that require human authority.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

### BLOCKED

Find only direct VIEPS capability/access blockers.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

## Required output

Produce a compact report with exactly these sections:

- **OVERALL STATE** — one short statement. If there is no important VIEPS problem, say `None`.
- **DO FIRST** — the few VIEPS actions that should be acted on, in priority order, with linked GitHub Issue/PR number and title where applicable. Include relevant work paths when they clarify dependencies or enabling relationships.
- **LOW-HANGING FRUITS** — quick VIEPS actions, or `None`. Include relevant Issue/PR references and work paths when applicable.
- **QUEUE CLEANUP** — VIEPS cleanup actions, or `None`. Include relevant Issue/PR references and work paths when applicable.
- **DECISIONS NEEDED** — only decisions that require human authority, or `None`. Include relevant Issue/PR references and work paths when applicable.
- **BLOCKED** — only direct VIEPS capability/access blockers, or `None`. Include relevant Issue/PR references and work paths when applicable.

## Output rules

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- Issue and PR references are allowed in every report section when relevant to that section.
- A work path is a presentation style for showing dependency/enabling relationships between relevant work items; it is not a report category.
- Any report category may contain one or more work paths when relevant Issues/PRs exist.
- Use Issue/PR references where they provide useful traceability; do not force a reference into a section merely because one exists elsewhere in the report.
- Each category is evaluated independently. Do not suppress, exclude or omit a qualifying work item because the same work item, Issue or PR appears in another category.
- The same Issue or PR may be referenced in multiple categories whenever it independently qualifies for those categories.
- Do not merge, consolidate or deduplicate category findings merely to avoid repeated references.
- If an Issue/PR is both a blocker and a DO FIRST action, it may be referenced in both sections when both references materially help the reader understand the situation.
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
