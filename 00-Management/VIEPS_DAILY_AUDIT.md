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

- **OVERALL STATE** — current VIEPS progress condition and the most important constraint.
- **SHOW-STOPPERS** — exact Issue/PR, evidence, dependency and next action.
- **DO FIRST** — short ordered execution list.
- **LOW-HANGING FRUITS** — quick useful actions.
- **QUEUE CLEANUP** — work to complete, consolidate, supersede or close.
- **DECISIONS NEEDED** — decisions requiring human authority.
- **BLOCKED** — capability/access blockers with evidence.

Every actionable finding must include exact Issue/PR, evidence/source and next action. Keep the report short and action-oriented.

## Operating rules

- Read-only by default.
- Prefer finishing/consolidating existing work over increasing the active queue.
- Record unresolved product/domain choices under **DECISIONS NEEDED**.
- Issues do not require review; PRs do require review.
- GitHub is the system of record.

Changes to this procedure use Issue → branch → PR → review → merge.
