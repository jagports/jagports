# Jagports VIEPS App Daily Audit

## Purpose

Daily audit of the Issues and PRs that directly concern VIEPS App creation and operation.

The audit must identify both the immediate VIEPS work to execute and the dependency-ordered work paths that show what each important work item solves and what capability it enables next.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If the file is successfully read, execute the complete procedure and return only the required audit output defined below.

## Audit

Read `RULES.md`, `WORKFLOWS.md`, `GITHUB_OPERATING_RULES.md`, `SKILL.md`, `KNOWLEDGE.md`, relevant VIEPS/domain/research/specification documents, and this file.

Use `jagports/jagports` as the system of record.

### Scope filter

Include an Issue or PR only when its actual work directly concerns VIEPS App implementation or a direct VIEPS dependency.

Do not include AI OS management, audit, automation, Kanban or general process work merely because it may affect VIEPS indirectly.

If an Issue or PR is not clearly VIEPS work or a direct VIEPS dependency, leave it out.

### Priority analysis

Identify the few VIEPS Issues/PRs that matter most using:
- whether the work directly affects VIEPS;
- dependency order;
- ability to unblock implementation;
- MVP relevance;
- readiness and impact.

Use these questions:

**SHOW-STOPPERS** — Is there anything that directly blocks or seriously delays VIEPS?

**DO FIRST** — What VIEPS work should be done next?

For each selected work item, assign a temporary work-path identifier such as `WF-1`, `WF-2`, etc. The identifier is for this audit report only and is not a repository identifier.

**WORK PATHS** — For the important work represented by DO FIRST, what problem does each item solve, what VIEPS capability does that solution enable, and what meaningful work becomes possible next?

### Work-path construction

Build dependency/enabling paths from the evidence available in the repository and GitHub work records.

Each path must show, in order:

`work item → problem/capability it solves → capability/work it enables → next meaningful work`

A path may contain multiple existing Issues/PRs when the dependency relationship is evidenced by repository knowledge, Issue/PR content, implementation state or testing evidence.

Use the DO FIRST work-path identifiers to refer back to selected work items instead of repeating Issue/PR references. Do not invent dependencies merely to make a path longer.

The purpose of the path is to explain why the work is prioritized and what concrete VIEPS progress it unlocks when completed.

### LOW-HANGING FRUITS

Find small VIEPS work that can be completed quickly and is not already represented by a DO FIRST work-path item.

### QUEUE CLEANUP

Find VIEPS work that can be completed, consolidated, superseded or closed so the active queue stays small, excluding work already represented by DO FIRST.

## Required output

Produce a compact report with exactly these sections:

- **OVERALL STATE** — one short statement. If there is no important VIEPS problem, say `None`.
- **DO FIRST** — the few VIEPS Issues/PRs that should be acted on, in priority order. Give each selected item a temporary work-path identifier (`WF-1`, `WF-2`, etc.) and a linked GitHub Issue/PR number and title.
- **WORK PATHS** — the dependency/enabling paths for the DO FIRST items. For each path, state what the work solves and what it enables next, using the DO FIRST work-path identifier rather than repeating the Issue/PR reference.
- **LOW-HANGING FRUITS** — quick VIEPS actions not already in DO FIRST or its work paths. If none, say `None`.
- **QUEUE CLEANUP** — VIEPS cleanup actions not already in DO FIRST or its work paths. If none, say `None`.
- **DECISIONS NEEDED** — only decisions that require human authority. If none, say `None`.
- **BLOCKED** — only direct VIEPS capability/access blockers. If none, say `None`.

## Output rules

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- DO FIRST is the only normal list of active Issue/PR work.
- WORK PATHS explain the dependency and enabling value of that active work; they are not a second Issue/PR queue.
- Before writing the report, make one deduplicated list of Issues/PRs and assign each one to only one active work item or cleanup category.
- An Issue or PR may not be introduced as a separate item in more than one report category.
- If the same Issue or PR is both a blocker and the next action, include it once in DO FIRST and describe both facts in its sentence and work path.
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
