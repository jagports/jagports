# Daily Team Lead Project Audit Schedule

## Status

**IMPLEMENTED AND VERIFIED** as a recurring ChatGPT automation.

## Task

**Title:** Jagports Daily Audit

**Target repository:** `jagports/jagports`

**Recurrence:** Daily

**Timezone:** `Europe/Helsinki`

**Automation ID:** `6a989c25ed848191a35b887495126b71`

**Timing:** The scheduling facility uses a flexible recurring daily schedule. No exact recurring execution time is promised by this document.

**Current verification:** The scheduling facility confirmed that the task exists and is enabled. The task uses `FREQ=DAILY`.

## Live scheduled-task prompt

The live scheduled task contains only this stable bootstrap instruction:

> Read `00-Management/DAILY_PROJECT_AUDIT.md` from the current `jagports/jagports` repository and execute its instructions as the complete operational procedure for this scheduled run. Treat that file as the durable source of truth for the repeating task procedure. Do not use an obsolete repository. If the file cannot be read, report the task as `BLOCKED` rather than executing from an old cached copy or claiming success.

Do not duplicate the operational audit procedure in the scheduled task prompt.

## Changing the daily-run procedure

To change what the daily run does, change `00-Management/DAILY_PROJECT_AUDIT.md` through the normal GitHub workflow:

1. Create or use an Issue describing the required procedure change.
2. Make the change on a dedicated branch.
3. Open a Pull Request.
4. Obtain independent review and approval.
5. Perform the required tests/verification.
6. Merge the PR.

The next scheduled run reads the merged `DAILY_PROJECT_AUDIT.md`. The live scheduled-task prompt normally does not need to change when the procedure changes.

## System-of-record boundary

The ChatGPT scheduling/automation facility is the execution and notification mechanism for the recurring audit. It is not the Jagports project system of record.

GitHub remains the system of record for Issues, Pull Requests, project communication, decisions, implementation traceability, and durable repository knowledge.

The scheduled task must not be treated as evidence that a GitHub Project state, repository change, Issue state, or other GitHub operation succeeded unless that result is independently verified through the available GitHub capability.

If the audit cannot access the repository, required source-of-truth documents, GitHub Project data, or another required capability, it must report the limitation as `BLOCKED` rather than presenting an incomplete audit as successful.

## Relationship to Issue and PR workflow

The recurring task is implemented independently of the repository documentation change. Durable information about the task is stored here through the normal Issue → branch → PR → review → merge workflow.

Issue: #363 — Create scheduled daily Team Lead project audit and document automation

Corrective PR: #332 — Revert direct default-branch commit 309bb263

PR #332 removes the earlier unauthorized scheduling documentation. Issue #363 and its implementation PR establish the supported scheduled task and durable documentation through the required workflow.
