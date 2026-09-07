# Jagports VIEPS App Daily Audit

## Purpose

Daily decision-support audit for the Issues and PRs that materially affect VIEPS App creation and operation.

## Audit

Read `RULES.md`, `WORKFLOWS.md`, `GITHUB_OPERATING_RULES.md`, `SKILL.md`, `KNOWLEDGE.md`, relevant VIEPS/domain/research/specification documents, and this file.

Use `jagports/jagports` as the system of record.

### SHOW-STOPPERS

Identify the few open Issues/PRs, dependencies, missing product/domain decisions, broken capabilities, missing evidence or other conditions that can materially prevent or seriously delay VIEPS progress. Require evidence of material impact.

### DO FIRST

Give a short ordered list of the most valuable next VIEPS actions using current evidence, dependency order, impact, urgency, unblock value, readiness and MVP relevance. Prioritize actions that create or restore forward progress.

### LOW-HANGING FRUITS

Identify small, well-understood, low-risk actions that can finish existing VIEPS work, add useful tests/evidence, improve traceability, unblock another item, or reduce active work. Prefer completion and consolidation.

### QUEUE CLEANUP

Find duplicate, overlapping, stale, obsolete, over-split or otherwise consolidatable VIEPS Issues/PRs. Recommend completing, consolidating, superseding or closing them through the normal workflow. Keep the active VIEPS queue small and actionable while preserving traceability.

## VIEPS scope

Include work materially related to:
- VIEPS UI/application implementation;
- Parts Data Model and API/data integration;
- JEPC Data Importer and catalogue/reference data;
- fitment, vehicle/model/VIN applicability;
- EPC diagrams and verified hotspot conversion;
- silhouettes, zones and location mapping;
- supersession and Jaguar Classic semantics;
- operational stock integration;
- VIEPS dependencies, blockers and research/specification decisions;
- automated tests and required human verification;
- PR review state and implementation readiness;
- VIEPS documentation, communication and traceability.

Start from the VIEPS work represented by #360 and #368 and follow explicitly linked dependencies, using current GitHub state to identify the active work that matters most.

## Required output

Produce a compact report with this structure:

- **OVERALL STATE** — one short statement of current VIEPS condition and the main constraint.
- **WORK PATH** — one ranked list of the few actions that matter most. Each work item must be written as a clear path: `Issue/PR → action → expected result`. Put the directly accessible GitHub Issue/PR link on the immediately following line. Use each Issue/PR exactly once in the entire report, even when it is both a blocker and a next action. Consolidate all relevant evidence, blocker impact and execution guidance for that Issue/PR into its single work item.
- **LOW-HANGING FRUITS** — quick useful actions that are not already represented in WORK PATH; do not introduce duplicate Issue/PR references.
- **QUEUE CLEANUP** — consolidation/completion/closure actions that are not already represented in WORK PATH; do not introduce duplicate Issue/PR references.
- **DECISIONS NEEDED** — only decisions requiring human authority; do not repeat an Issue/PR already listed in WORK PATH.
- **BLOCKED** — only capability/access blockers not already represented in WORK PATH; do not repeat an Issue/PR.

### Output discipline

- WORK PATH is the single authoritative list of actionable Issues/PRs. SHOW-STOPPERS and DO FIRST are analysis criteria, not separate lists of work items.
- Never list the same Issue/PR in more than one section.
- Never mention an Issue/PR number without its directly accessible GitHub link.
- Put the work path/action line first, then its GitHub link on the next line, then continue with the next item.
- Keep each work item short; include only evidence that changes the priority or action.
- Prefer completion, consolidation and closure over creating new work.

## Operating rules

- Read-only by default.
- Prefer finishing/consolidating existing work over increasing the active queue.
- Record unresolved product/domain choices under **DECISIONS NEEDED**.
- Issues do not require review; PRs do require review.
- GitHub is the system of record.

Changes to this procedure use Issue → branch → PR → review → merge.
