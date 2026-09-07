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

Produce a compact report with this structure:

- **OVERALL STATE** — one short statement of current AI OS condition and the main constraint.
- **WORK PATH** — one ranked list of the few actions that matter most. Each work path must contain only linked Issue/PR/resource identifiers and arrows, for example: `#355 → #354 → PR #xxx`. Put any task description, evidence, rationale, expected result or next-action sentence on the following line, never on the work-path line. Put the directly accessible GitHub link on the immediately following line when the path identifier is actionable. Use each Issue/PR exactly once in the entire report, even when it is both a blocker and a next action. Consolidate all relevant evidence, blocker impact and execution guidance for that Issue/PR into its single work item.
- **LOW-HANGING FRUITS** — quick useful actions that are not already represented in WORK PATH; do not introduce duplicate Issue/PR references.
- **QUEUE CLEANUP** — consolidation/completion/closure actions that are not already represented in WORK PATH; do not introduce duplicate Issue/PR references.
- **DECISIONS NEEDED** — only decisions requiring human authority; do not repeat an Issue/PR already listed in WORK PATH.
- **BLOCKED** — only capability/access blockers not already represented in WORK PATH; do not repeat an Issue/PR.

### Output discipline

- WORK PATH is the single authoritative list of actionable Issues/PRs. SHOW-STOPPERS and DO FIRST are analysis criteria, not separate lists of work items.
- Never list the same Issue/PR in more than one section.
- Never mention an Issue/PR number without its directly accessible GitHub link.
- Work-path lines contain only linked identifiers/resources and arrows. Never put a sentence on the work-path line.
- Any explanation or task description starts on the following line.
- Keep each work item short; include only evidence that changes the priority or action.
- Prefer completion, consolidation and closure over creating new work.

## Operating rules

- Read-only by default.
- Prefer finishing/consolidating existing work over increasing the active queue.
- Issues do not require review; PRs do require review.
- GitHub is the system of record.
- Report Project Item Status only when independently verified.

## Project V2 verification

Track `openai/codex#43297` as the external dependency for Project V2 verification. Resolution requires an actual functional test covering the `Jagports AI OS` Project, items, Status and required fields/relationships. Record the tested capabilities and resulting state with evidence.

Changes to this procedure use Issue → branch → PR → review → merge.
