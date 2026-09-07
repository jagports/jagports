# Jagports VIEPS App Daily Audit

## Purpose

Daily audit of the Issues and PRs that directly concern VIEPS App creation and operation.

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

**LOW-HANGING FRUITS** — What small VIEPS work can be completed quickly?

**QUEUE CLEANUP** — What VIEPS work can be completed, consolidated, superseded or closed?

## Required output

Produce a compact report with exactly these sections:

- **OVERALL STATE** — one short statement. If there is no important VIEPS problem, say `None`.
- **WORK PATH** — the few VIEPS Issues/PRs that should be acted on, in priority order.
- **LOW-HANGING FRUITS** — quick VIEPS actions not already in WORK PATH. If none, say `None`.
- **QUEUE CLEANUP** — VIEPS cleanup actions not already in WORK PATH. If none, say `None`.
- **DECISIONS NEEDED** — only decisions that require human authority. If none, say `None`.
- **BLOCKED** — only direct VIEPS capability/access blockers. If none, say `None`.

## WORK PATH format

Every WORK PATH item must be a real VIEPS Issue or PR.

First line: linked Issue/PR identifiers and arrows only.

Second line: one short sentence saying what to do and what it achieves.

Third line: the directly accessible GitHub link.

Example:

`[Issue #354](https://github.com/jagports/jagports/issues/354) → [Issue #355](https://github.com/jagports/jagports/issues/355) → [Issue #368](https://github.com/jagports/jagports/issues/368)`

`Complete the data foundation, then the importer, then the UI.`

`https://github.com/jagports/jagports/issues/354`

Use real current Issue/PR numbers and links. Do not invent numbers.

## Output rules

- Do not produce separate SHOW-STOPPERS or DO FIRST lists. They are only criteria for choosing WORK PATH.
- An Issue or PR may appear only once in the entire report.
- If the same Issue or PR is both a blocker and the next action, include it once in WORK PATH and describe both facts in its sentence.
- Never mention an Issue or PR number without a directly accessible GitHub link.
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
