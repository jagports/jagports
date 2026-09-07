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
- **WORK PATHS** — the dependency/enabling paths for the DO FIRST items. For each path, state what the work solves and what it enables next. Do not repeat or introduce Issue/PR references here.
- **LOW-HANGING FRUITS** — quick actions not already in DO FIRST or its work paths, or `None`. Do not introduce Issue/PR references here.
- **QUEUE CLEANUP** — cleanup actions not already in DO FIRST or its work paths, or `None`. Do not introduce Issue/PR references here.
- **DECISIONS NEEDED** — human decisions that are actually needed now, or `None`. Do not introduce Issue/PR references here.
- **BLOCKED** — capability/access blockers that are actually blocking work, or `None`. Do not introduce Issue/PR references here.

### Output discipline

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- DO FIRST is the only section that may introduce or identify an Issue or PR.
- WORK PATHS explain the dependency and enabling value of DO FIRST work without repeating Issue/PR references.
- LOW-HANGING FRUITS, QUEUE CLEANUP, DECISIONS NEEDED and BLOCKED must not introduce or identify an Issue or PR.
- Before writing the report, make one deduplicated list of Issues/PRs and assign each one to DO FIRST or omit it from the report.
- An Issue/PR must not be introduced as a separate item in more than one report category.
- If an Issue/PR is both a blocker and a DO FIRST action, identify it only in DO FIRST and describe the blocker there and in the relevant work-path reasoning without repeating its identifier.
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
