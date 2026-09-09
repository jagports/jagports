# Jagports AI OS Daily Audit

## Purpose

Daily audit of the Issues and PRs that matter for Jagports AI OS progress.

The audit must identify both the immediate work to execute and dependency/enabling relationships between related work items.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If the file is successfully read, execute the complete procedure and return only the required audit output defined below.

## Audit

Use the repository's inherited operating context and communication protocol. This procedure defines only the AI OS-specific audit work.

### DO FIRST

Find the few actions that should be done first. Use dependency, impact, urgency, readiness and unblock value.

### LOW-HANGING FRUITS

Find small, clear and low-risk actions that can be completed quickly.

### QUEUE CLEANUP

Find work that can be finished, merged, consolidated, superseded or closed so the active queue stays small.

### DECISIONS NEEDED

Find human decisions that are actually needed now.

### BLOCKED

Find capability/access blockers that are actually blocking work.

## Work paths

When an Issue/PR has a defined or explicitly proposed work path, show that work path whenever the Issue/PR is reported, regardless of its audit category.

A work path shows related Issues/PRs in dependency or execution order. It must be supported by repository evidence, Issue/PR content, implementation state or testing evidence.

Do not invent dependencies, relationships or implementation steps merely to create a work path.

Do not duplicate an Issue/PR as a separate report item merely because it appears inside another item's work path. Each Issue/PR is assigned to one report category only.

Use the inherited Communication Protocol for the required work-path and Issue/PR reference formatting.

## Required output

Produce a short report with exactly these sections:

- **OVERALL STATE** — one short sentence.
- **DO FIRST** — the few actions that should be done, in order, with linked GitHub Issue/PR number and title when applicable. Show any defined or explicitly proposed work path directly under the item.
- **LOW-HANGING FRUITS** — quick actions, or `None`. Show any defined or explicitly proposed work path directly under the item.
- **QUEUE CLEANUP** — cleanup actions, or `None`. Show any defined or explicitly proposed work path directly under the item.
- **DECISIONS NEEDED** — human decisions that are actually needed now, or `None`. Show any defined or explicitly proposed work path directly under the item.
- **BLOCKED** — capability/access blockers that are actually blocking work, or `None`. Show any defined or explicitly proposed work path directly under the item.

### Category discipline

- Every Issue or PR may be shown in **one and only one** report category.
- If an Issue/PR could qualify for multiple categories, place it only in the first applicable category: **DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP → DECISIONS NEEDED → BLOCKED**.
- A work path may explain relationships to Issues/PRs assigned to other categories, but must not repeat their Issue/PR references as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Do not create duplicate work items merely because the same underlying work is relevant to multiple audit categories.
- If a category has no qualifying item, write exactly `None`.
- Keep the report short and use simple language.
- Prefer finishing, testing, merging, consolidating and closing existing work over creating new work.
