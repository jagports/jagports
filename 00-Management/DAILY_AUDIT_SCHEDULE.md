# Scheduled Jagports Project Audits

## AI OS project task

**Title:** Jagports Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`  
**Automation ID:** `6a989c25ed848191a35b887495126b71`

### Durable procedure

`00-Management/PROJECT_DAILY_AUDIT.md`

### Live task prompt

> Read `00-Management/PROJECT_DAILY_AUDIT.md` from the current `jagports/jagports` repository and execute it as the complete operational procedure for this scheduled run. If it cannot be read, report `BLOCKED`; do not use an obsolete or cached procedure.

## VIEPS App audit task

**Title:** Jagports VIEPS App Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`

### Durable procedure

`00-Management/VIEPS_DAILY_AUDIT.md`

### Live task prompt

> Read `00-Management/VIEPS_DAILY_AUDIT.md` from the current `jagports/jagports` repository and execute it as the complete operational procedure for this scheduled run. If it cannot be read, report `BLOCKED`; do not use an obsolete or cached procedure.

## Scheduling rule

The scheduled task is only the execution/notification mechanism. The repository Markdown files are the durable source of truth for what each task does.

Changes to either procedure or this scheduling documentation require Issue → branch → PR → review → merge.

## Operating rules

- GitHub is the system of record.
- Audits are read-only by default.
- Issues do not require review; PRs do.
- Never claim successful verification without actual evidence.
- Do not use obsolete `tlindi/jagports`.
