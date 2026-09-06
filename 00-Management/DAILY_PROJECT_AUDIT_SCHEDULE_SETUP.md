# Daily Project Audit — Scheduling Setup

This document defines the scheduling bootstrap for the recurring `Jagports Daily Audit` task.

## Live task

- Title: `Jagports Daily Audit`
- Target repository: `jagports/jagports`
- Recurrence: daily
- Timezone: `Europe/Helsinki`
- Automation ID: `6a989c25ed848191a35b887495126b71`

## Task bootstrap instruction

The live scheduled task should contain only this stable instruction:

> Read `00-Management/DAILY_PROJECT_AUDIT.md` from the current `jagports/jagports` repository and execute its instructions as the complete operational procedure for this scheduled run. Treat that file as the durable source of truth for the repeating task procedure. Do not use an obsolete repository. If the file cannot be read, report the task as `BLOCKED` rather than executing from an old cached copy or claiming success.

## Procedure changes

The repeating procedure belongs in `00-Management/DAILY_PROJECT_AUDIT.md`.

Changes to that file are made through the normal Issue → branch → PR → review → merge workflow. The live scheduled task does not need its full procedure rewritten when the Markdown procedure changes; its stable bootstrap instruction remains unchanged.

If the repository path or bootstrap mechanism changes, update this scheduling document and the live scheduled task through a reviewed change.

## System of record

GitHub is the system of record for the durable procedure and scheduling configuration documentation. ChatGPT Scheduled Tasks is the execution and notification mechanism.
