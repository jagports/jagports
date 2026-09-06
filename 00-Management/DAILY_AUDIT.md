# Jagports AI OS Daily Audit — Task Instructions

## Purpose

This file is the durable operational source for the recurring `Jagports Daily Audit` ChatGPT task.

The task audits **Jagports AI OS project progress**, concentrating on Issues and PRs that materially progress the `Jagports AI OS` project. It is not a general repository audit.

Changes to this procedure must use Issue → branch → PR → review → merge.

## Audit execution

Act as the Jagports Team Lead Agent and audit `jagports/jagports` using GitHub as the system of record.

Read:
- `00-Management/RULES.md`
- `00-Management/WORKFLOWS.md`
- `00-Management/GITHUB_OPERATING_RULES.md`
- `SKILL.md`
- `KNOWLEDGE.md`
- relevant management/agent-communication Markdown
- `Jagports_AI_OS_Prioritized_Work_Plan.md` when accessible
- this file

Do not use obsolete `tlindi/jagports`.

## AI OS project scope

Focus on open and recently changed Issues and PRs that advance the Jagports AI OS project, especially:

- prioritized work-plan execution and priority consistency;
- project/Issue/PR traceability;
- dependencies, blockers and stale work;
- PR review state and required follow-up;
- implementation/test evidence;
- agent communication and decision recording;
- documented workflow/governance compliance;
- GitHub Project `Jagports AI OS` state when independently accessible.

Do not spend audit effort on unrelated repository Issues/PRs except where they are dependencies of AI OS work.

Issues do not require review. PRs do require review.

## Verification rules

Default to read-only. Never claim a check succeeded when required evidence or access is unavailable.

For every actionable finding report:
- Issue/PR number and title;
- problem;
- evidence;
- applicable source-of-truth document;
- next action.

Classify findings as `AUTO`, `REVIEW`, `DECISION`, or `BLOCKED`.

## GitHub Projects V2 blocker

Track upstream `openai/codex#43297` as the external blocker for GitHub Projects V2 verification.

Every run:
1. Check its current state, latest comments, linked/referenced fixes and indications of connector support.
2. Do not treat closure as resolution.
3. Resolution requires an actual functional test from this environment:
   - read `Jagports AI OS` Project;
   - read Project items;
   - read Project Item Status;
   - inspect required Project fields/relationships.
4. If that functional test fails, report the appropriate blocker state and do not claim Project verification.
5. If it succeeds, record the tested capabilities and re-evaluate previously blocked `#371`, `#383` and `#363`.

Use exactly one applicable state:
- `BLOCKED — #43297 still prevents Project V2 verification`
- `BLOCKED — upstream issue changed, functional test still fails`
- `RESOLVED — #43297 fixed and Project V2 access independently tested`
- `REGRESSION — previously working Project V2 access has failed again`

Until successful end-to-end Project V2 testing, do not treat Project Audits as a normally completed scheduled-task work item.

## Output

Return a concise report containing:
- overall AI OS audit state;
- actionable exceptions only;
- blocker state when applicable;
- exact Issue/PR references;
- evidence/source references;
- next actions.

If no actionable exceptions are found, state that the AI OS audit passed.
