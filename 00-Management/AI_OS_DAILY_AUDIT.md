# Jagports AI OS Daily Audit

## Purpose

Daily decision-support audit for the Issues and PRs that materially affect creation and operation of the Jagports AI OS.

## Audit

Read `RULES.md`, `WORKFLOWS.md`, `GITHUB_OPERATING_RULES.md`, `SKILL.md`, `KNOWLEDGE.md`, relevant management/agent-communication documents, the AI OS prioritized work plan when available, and this file.

Use `jagports/jagports` as the system of record.

### SHOW-STOPPERS

Identify the few open Issues/PRs, dependencies, missing decisions, broken capabilities or process conditions that can materially prevent or seriously delay AI OS progress. Require evidence of material impact.

### DO FIRST

Give a short ordered list of the most valuable next actions using current evidence, dependency order, impact, urgency, unblock value and readiness. Prioritize actions that create or restore forward progress.

### LOW-HANGING FRUITS

Identify small, well-understood, low-risk actions that can finish existing work, unblock work, improve traceability, add useful verification, or reduce active work. Prefer completion and consolidation.

### QUEUE CLEANUP

Find duplicate, overlapping, stale, obsolete, over-split or otherwise consolidatable Issues/PRs. Recommend completing, consolidating, superseding or closing them through the normal workflow. Keep the active queue small and actionable while preserving traceability.

## Required output

- **OVERALL STATE** — current AI OS progress condition and the most important constraint.
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
- Issues do not require review; PRs do require review.
- GitHub is the system of record.
- Report Project Item Status only when independently verified.

## Project V2 verification

Track `openai/codex#43297` as the external dependency for Project V2 verification. Resolution requires an actual functional test covering the `Jagports AI OS` Project, items, Status and required fields/relationships. Record the tested capabilities and resulting state with evidence.

Changes to this procedure use Issue → branch → PR → review → merge.
