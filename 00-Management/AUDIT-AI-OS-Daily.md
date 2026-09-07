# Jagports AI OS Daily Audit

## Purpose

Daily audit of the Issues and PRs that matter for Jagports AI OS progress.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If the file is successfully read, execute the complete procedure and return only the required audit output defined below.

## Audit

Read `RULES.md`, `WORKFLOWS.md`, `GITHUB_OPERATING_RULES.md`, `SKILL.md`, `KNOWLEDGE.md`, relevant management/agent-communication documents, the AI OS prioritized work plan when available, and this file.

Use `jagports/jagports` as the system of record.

### SHOW-STOPPERS

Find only real blockers. A blocker must have evidence that it can stop or seriously delay AI OS progress.

### DO FIRST

Find the few actions that should be done first. Use dependency, impact, urgency, readiness and unblock value.

### LOW-HANGING FRUITS

Find small, clear and low-risk actions that can be completed quickly.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small.

## Required output

Produce a short report with exactly these sections:

- **OVERALL STATE** — one short sentence.
- **WORK PATH** — the few actions that should be done, in order.
- **LOW-HANGING FRUITS** — quick actions not already in WORK PATH, or `None`.
- **QUEUE CLEANUP** — cleanup actions not already in WORK PATH, or `None`.
- **DECISIONS NEEDED** — human decisions that are actually needed now, or `None`.
- **BLOCKED** — capability/access blockers that are actually blocking work, or `None`.

### WORK PATH format

Every WORK PATH item must identify the actual GitHub Issue or PR, including its number and title, and the task.

The path MUST use one path item per visual line. The first path item starts at the beginning of its line. Every subsequent path item MUST start with `→` immediately at the beginning of the following visual line, followed by a space and the linked Issue/PR number and title.

A visual line break MUST be forced after every path item except the final item. In Markdown, use a hard line break: end the preceding path line with two spaces, then insert the newline. Do NOT rely on an ordinary single Markdown newline, because it may render as a space and place the arrow on the same visual line.

Example:

`[#123 — Issue title](https://github.com/jagports/jagports/issues/123)`  
`→ [#456 — Issue title](https://github.com/jagports/jagports/issues/456)`  
`→ [PR #789 — PR title](https://github.com/jagports/jagports/pull/789)`

The task explanation starts on the visual line after the complete path:

`Implement #123 first because it provides the dependency needed by #456.`

For a PR path, the linked PR line MUST also be followed by a hard line break before the task explanation:

`[PR #789 — PR title](https://github.com/jagports/jagports/pull/789)`  

`Review, test and merge the PR so the dependent work can continue.`

Use the actual Issue/PR numbers and titles found during the audit. Do not use placeholder numbers.

### Output discipline

- WORK PATH is the only normal list of active Issue/PR work.
- Do not repeat an Issue or PR in another section.
- Before writing the report, make one deduplicated list of Issues/PRs and assign each one to only one section.
- If an Issue/PR is both a blocker and a DO FIRST action, put it once in WORK PATH and include both facts in its task line.
- Every Issue/PR reference in the report must be a directly accessible GitHub link and must show the Issue/PR number and title.
- Never write a bare `#123`, `Issue #123` or `PR #123` in the report.
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
