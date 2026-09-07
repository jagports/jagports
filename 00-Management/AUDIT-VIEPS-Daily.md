# Jagports VIEPS App Daily Audit

## Purpose

Daily audit of the Issues and PRs that directly concern VIEPS App creation and operation.

The audit must identify both the immediate work to execute and the dependency-ordered work paths that show what each important work item solves and what capability it enables next.

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

### WORK PATHS

For the important work represented by DO FIRST, build dependency/enabling paths.

Each path must show, in order:

`work item → problem/capability it solves → capability/work it enables → next meaningful work`

A work path may contain multiple existing Issues/PRs when that dependency relationship is evidenced by repository knowledge, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies merely to make a path longer.

A path should explain why the first work item is first and what concrete VIEPS progress becomes possible when it is completed.

### LOW-HANGING FRUITS

Find small VIEPS work that can be completed quickly and is not already represented by a DO FIRST work-path item.

### QUEUE CLEANUP

Find VIEPS work that can be completed, consolidated, superseded or closed so the active queue stays small, excluding work already represented by DO FIRST.

## Required output

Produce a compact report with exactly these sections:

- **OVERALL STATE** — one short statement. If there is no important VIEPS problem, say `None`.
- **DO FIRST** — the few VIEPS Issues/PRs that should be acted on, in priority order, with linked GitHub Issue/PR number and title.
- **WORK PATHS** — the dependency/enabling paths for the DO FIRST items. For each path, state what the work solves and what it enables next. Do not repeat or introduce Issue/PR references here.
- **LOW-HANGING FRUITS** — quick VIEPS actions not already in DO FIRST or its work paths. If none, say `None`. Do not introduce Issue/PR references here.
- **QUEUE CLEANUP** — VIEPS cleanup actions not already in DO FIRST or its work paths. If none, say `None`. Do not introduce Issue/PR references here.
- **DECISIONS NEEDED** — only decisions that require human authority. If none, say `None`. Do not introduce Issue/PR references here.
- **BLOCKED** — only direct VIEPS capability/access blockers. If none, say `None`. Do not introduce Issue/PR references here.

## Output rules

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- DO FIRST is the only section that may introduce or identify an Issue or PR.
- WORK PATHS explain the dependency and enabling value of DO FIRST work without repeating Issue/PR references.
- LOW-HANGING FRUITS, QUEUE CLEANUP, DECISIONS NEEDED and BLOCKED must not introduce or identify an Issue or PR.
- Before writing the report, make one deduplicated list of Issues/PRs and assign each one to DO FIRST or omit it from the report.
- An Issue or PR may not be introduced as a separate item in more than one report category.
- If the same Issue or PR is both a blocker and the next action, identify it only in DO FIRST and describe the blocker there and in the relevant work-path reasoning without repeating its identifier.
- Do not put generic advice into LOW-HANGING FRUITS, QUEUE CLEANUP, DECISIONS NEEDED or BLOCKED.
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
