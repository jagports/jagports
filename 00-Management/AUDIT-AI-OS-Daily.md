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

### WORK PATHS

For the important work represented by DO FIRST, build dependency/enabling paths.

Each path must show, in order:

`work item → problem/capability it solves → capability/work it enables → next meaningful work`

A work path may contain multiple existing Issues/PRs when that dependency relationship is evidenced by repository knowledge, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies merely to make a path longer.

A path should explain why the first work item is first and what concrete progress becomes possible when it is completed.

### LOW-HANGING FRUITS

Find small, clear and low-risk actions that can be completed quickly and are not already represented by a DO FIRST work-path item.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small, excluding work already represented by DO FIRST.

## Required output

Produce a short report with exactly these sections:

- **OVERALL STATE** — one short sentence.
- **DO FIRST** — the few actions that should be done, in order, with linked GitHub Issue/PR number and title.
- **WORK PATHS** — the dependency/enabling paths for the DO FIRST items. For each path, state what the work solves and what it enables next. Issue/PR references may be used when they are necessary to identify the work items in the path.
- **LOW-HANGING FRUITS** — quick actions that can be completed with low risk. Issue/PR references may be used when they identify the relevant work.
- **QUEUE CLEANUP** — cleanup actions. Issue/PR references may be used when they identify the relevant work.
- **DECISIONS NEEDED** — human decisions that are actually needed now, or `None`. Issue/PR references may be used when they identify the relevant decision or affected work.
- **BLOCKED** — capability/access blockers that are actually blocking work, or `None`. Issue/PR references may be used when they identify the relevant blocker or affected work.

### Output discipline

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- Issue and PR references are allowed in every report section when relevant to that section.
- Use the reference where it provides useful traceability; do not force an Issue/PR reference into a section merely because one exists elsewhere in the report.
- The same Issue or PR may be referenced in more than one section when it is genuinely relevant to each section; this is not considered an error or duplication by itself.
- Do not create duplicate work items merely because the same Issue/PR is relevant to multiple audit categories.
- If an Issue/PR is both a blocker and a DO FIRST action, it may be referenced in both sections when both references materially help the reader understand the situation.
- LOW-HANGING FRUITS, QUEUE CLEANUP, DECISIONS NEEDED and BLOCKED must say `None` when they contain no item.
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
