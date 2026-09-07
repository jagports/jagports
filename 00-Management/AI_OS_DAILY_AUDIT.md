# Jagports AI OS Showstopper & Priority Audit

## Purpose

Daily decision-support audit for the small set of Issues and PRs that materially affect creation and operation of the Jagports AI OS.

This is **not** a general project/repository audit and does not cover VIEPS App implementation or VIEPS product requirements. VIEPS work is audited separately by `00-Management/VIEPS_DAILY_AUDIT.md`, except for direct AI OS dependencies or show-stoppers.

## Audit

Read `RULES.md`, `WORKFLOWS.md`, `GITHUB_OPERATING_RULES.md`, `SKILL.md`, `KNOWLEDGE.md`, relevant management/agent-communication documents, the AI OS prioritized work plan when available, and this file.

Use `jagports/jagports` as the system of record. Do not use obsolete `tlindi/jagports`.

### 1. SHOW-STOPPERS

Identify the few open Issues/PRs, dependencies, missing decisions, broken capabilities or process conditions that can materially prevent or seriously delay AI OS progress. Require evidence of material impact; do not call ordinary backlog work a show-stopper.

### 2. DO FIRST

Give a short ordered list of the most valuable next actions using current evidence, dependency order, impact, urgency, unblock value and readiness. Do not simply reproduce an old priority list.

### 3. LOW-HANGING FRUITS

Identify small, well-understood, low-risk actions that can finish existing work, unblock work, remove stale/obsolete work, improve traceability, or otherwise reduce active work. Prefer completion/consolidation over opening new Issues.

### 4. QUEUE CLEANUP

Find duplicate, overlapping, stale, obsolete, over-split or otherwise consolidatable Issues/PRs. Recommend completing, consolidating, superseding or closing them through the normal workflow. Keep the queue small, current and actionable without hiding legitimate work or losing traceability.

## Required output

- **OVERALL STATE** — is a genuine AI OS show-stopper preventing the next meaningful progress?
- **SHOW-STOPPERS** — exact Issue/PR, evidence, dependency and next action.
- **DO FIRST** — short ordered execution list.
- **LOW-HANGING FRUITS** — quick actions.
- **QUEUE CLEANUP** — work that should be completed/consolidated/closed.
- **DECISIONS NEEDED** — only decisions requiring human authority.
- **BLOCKED** — capability/access blockers with evidence.

Every actionable finding must include exact Issue/PR, evidence/source and next action. Keep the report short and action-oriented.

## Rules

- Read-only by default.
- Do not create Issues/PRs merely to record audit observations.
- Prefer finishing/consolidating existing work over increasing the active queue.
- Issues do not require review; PRs do require review.
- GitHub is the system of record.
- Report Project Item Status only when independently verified.

## Project V2 verification

Track `openai/codex#43297` as the external blocker where Project V2 verification is relevant. Closure alone is not resolution. Resolution requires an actual functional test from this environment covering the `Jagports AI OS` Project, items, Status and required fields/relationships. If the test fails, report the blocker and do not claim Project verification.

## Historical records

Do not modify closed Issue or merged PR descriptions/comments merely to rename this audit. Historical names remain historical records.

Changes to this procedure use Issue → branch → PR → review → merge.
