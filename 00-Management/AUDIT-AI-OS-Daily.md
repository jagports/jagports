# Jagports AI OS Daily Audit

## Purpose

Daily audit of the Issues and PRs that matter for Jagports AI OS progress.

The audit must identify both the immediate work to execute and dependency/enabling relationships that show what important work solves and what capability it enables next.

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

### LOW-HANGING FRUITS

Find small, clear and low-risk actions that can be completed quickly.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small.

## Work-path presentation

When an Issue/PR has a defined or explicitly proposed work path, that work path MUST always be shown when the Issue/PR is reported, regardless of which audit category contains it.

The work path MUST be shown directly under the relevant Issue/PR. It is a presentation style, not a separate audit category.

A work path shows, in order:

`work item → problem/capability it solves → capability/work it enables → next meaningful work`

Where an Issue/PR explicitly defines a concrete implementation sequence, show that sequence using the relevant existing Issue/PR numbers and titles or work steps.

A work path may contain multiple existing Issues/PRs when that dependency relationship is evidenced by repository knowledge, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies or implementation steps merely to create a work path.

Do not omit an existing/proposed work path because the item is in LOW-HANGING FRUITS, QUEUE CLEANUP, DECISIONS NEEDED or BLOCKED rather than DO FIRST.

Do not duplicate an Issue/PR as a separate report item merely because it appears inside another item's work path. Each Issue/PR is assigned to one report category only.

## Required output

Produce a short report with exactly these sections:

- **OVERALL STATE** — one short sentence.
- **DO FIRST** — the few actions that should be done, in order, with linked GitHub Issue/PR number and title when applicable. If a listed Issue/PR has a defined or explicitly proposed work path, show it directly under that item.
- **LOW-HANGING FRUITS** — quick actions, or `None`. If a listed Issue/PR has a defined or explicitly proposed work path, show it directly under that item.
- **QUEUE CLEANUP** — cleanup actions, or `None`. If a listed Issue/PR has a defined or explicitly proposed work path, show it directly under that item.
- **DECISIONS NEEDED** — human decisions that are actually needed now, or `None`. If a listed Issue/PR has a defined or explicitly proposed work path, show it directly under that item.
- **BLOCKED** — capability/access blockers that are actually blocking work, or `None`. If a listed Issue/PR has a defined or explicitly proposed work path, show it directly under that item.

## Output discipline

- Follow the repository's inherited communication protocol for presentation and traceability formatting.
- Issue and PR references are allowed in every report section when relevant.
- If an Issue/PR has a defined or explicitly proposed work path, showing that work path is mandatory; do not omit it because the item is outside DO FIRST.
- A work path is a presentation style, not a report category.
- Any report category may contain one or more work paths when relevant Issues/PRs exist.
- Every Issue or PR may be shown in **one and only one** report category.
- Before producing the report, assign each qualifying Issue/PR to the single category where it most appropriately belongs.
- If an Issue/PR could qualify for multiple categories, place it only in the first applicable category following the report's category order: **SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP → DECISIONS NEEDED → BLOCKED**.
- A work path may explain relationships to Issues/PRs assigned to other categories, but must not repeat their Issue/PR references as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Empty sections must say `None`.
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
