# Jagports AI OS Daily Audit

## Purpose

Daily audit of the Issues and PRs that matter for Jagports AI OS progress.

The audit must identify both the immediate work to execute and the dependency-ordered work paths that show what each important work item solves and what capability it enables next.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If the file is successfully read, execute the complete procedure and return only the required audit output defined below.

## Audit

Use `jagports/jagports` as the system of record and operate according to the repository's authoritative knowledge and operating rules.

### SHOW-STOPPERS

Find only real blockers. A blocker must have evidence that it can stop or seriously delay AI OS progress.

### DO FIRST

Find the few actions that should be done first. Use dependency, impact, urgency, readiness and unblock value.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path. A work path should show, in order:

`work item → problem/capability it solves → capability/work it enables → next meaningful work`

A work path may contain multiple existing Issues/PRs when that dependency relationship is evidenced by repository knowledge, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies merely to make a path longer.

### LOW-HANGING FRUITS

Find small, clear and low-risk actions that can be completed quickly and are not already represented by a DO FIRST work item.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small, excluding work already represented by DO FIRST.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

### DECISIONS NEEDED

Find human decisions that are actually needed now.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

### BLOCKED

Find capability/access blockers that are actually blocking AI OS progress.

When relevant Issues/PRs form a dependency or enabling sequence, show that relationship as a work path using the same format.

## Required output

Produce a short report with exactly these sections:

- **OVERALL STATE** — one short sentence.
- **DO FIRST** — the few actions that should be done, in order, with linked GitHub Issue/PR number and title where applicable. Include relevant work paths when they clarify dependencies or enabling relationships.
- **LOW-HANGING FRUITS** — quick actions, or `None`. Include relevant Issue/PR references and work paths when applicable.
- **QUEUE CLEANUP** — cleanup actions, or `None`. Include relevant Issue/PR references and work paths when applicable.
- **DECISIONS NEEDED** — human decisions that are actually needed now, or `None`. Include relevant Issue/PR references and work paths when applicable.
- **BLOCKED** — capability/access blockers that are actually blocking work, or `None`. Include relevant Issue/PR references and work paths when applicable.

## Output discipline

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- Issue and PR references are allowed in every report section when relevant to that section.
- A work path is a presentation style for showing dependency/enabling relationships between relevant work items; it is not a report category.
- Any report category may contain one or more work paths when relevant Issues/PRs exist.
- Use Issue/PR references where they provide useful traceability; do not force a reference into a section merely because one exists elsewhere in the report.
- The same Issue or PR may be referenced in more than one section when it is genuinely relevant to each section; this is not considered an error or duplication by itself.
- Do not create duplicate work items merely because the same Issue/PR is relevant to multiple audit categories.
- If an Issue/PR is both a blocker and a DO FIRST action, it may be referenced in both sections when both references materially help the reader understand the situation.
- Sections with no qualifying item must say `None`.
- Do not fill empty sections with general advice, principles or commentary.
- Keep the report short and use simple language.
- Prefer finishing, testing, merging, consolidating and closing existing work over creating new work.

## Operating rules

- Read-only by default.
- Prefer finishing/consolidating existing work over increasing the active queue.
- Issues do not require review; PRs do require review.
- GitHub is the system of record.
- Report Project Item Status only when independently verified.

## Project V2 verification

Track the external Project V2 verification dependency in `openai/codex` and require an actual functional test covering the `Jagports AI OS` Project, its items, Status and required fields/relationships. Record the tested capabilities and resulting state with evidence.

Changes to this procedure use Issue → branch → PR → review → merge.
