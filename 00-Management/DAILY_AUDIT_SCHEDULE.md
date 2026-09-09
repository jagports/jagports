# Scheduled Jagports Audits

## AI OS Daily Audit

**Title:** Jagports AI OS Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`  
**Automation ID:** `6a989c25ed848191a35b887495126b71`

**Procedure:** `00-Management/AUDIT-AI-OS-Daily.md`

**Scheduler prompt:** `00-Management/AUDIT-Daily-SchedulerPrompt.md`

The automation uses the canonical Scheduler Prompt file. The prompt explicitly loads `00-Management/AUDIT-Common-Daily.md` from `main` and then executes the AI OS and VIEPS scope procedures from `main` under that common method.

## VIEPS App Daily Audit

**Title:** Jagports VIEPS App Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`

**Procedure:** `00-Management/AUDIT-VIEPS-Daily.md`

**Scheduler prompt:** `00-Management/AUDIT-Daily-SchedulerPrompt.md`

The same scheduled automation prompt is the canonical execution entry point. AI OS and VIEPS results remain separate and within their respective scopes.

## Shared operating principle

Both audits use the same canonical processing method defined by `00-Management/AUDIT-Common-Daily.md`. Individual audit procedures define their own scope; the scheduler prompt defines only the execution instructions and does not create a competing audit logic.

The scheduled task is only the execution mechanism. The repository Markdown files are the durable source of truth.

**Create / Modify prompt:** `00-Management/AUDIT-Daily-SchedulerPrompt.md`

Changes to either procedure, the scheduler prompt, or this schedule require Issue → branch → PR → review → merge.
