# Scheduled Jagports Audits

## AI OS Daily Audit

**Title:** Jagports AI OS Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`  
**Automation ID:** `6a989c25ed848191a35b887495126b71`

**Procedure:** `00-Management/AUDIT-AI-OS-Daily.md`

**Prompt:** Read `00-Management/AUDIT-AI-OS-Daily.md` from branch `redesign/421-ai-os-showstopper-priority-audit` of the `jagports/jagports` repository and execute it as the complete operational procedure. If it cannot be read from that branch, report `BLOCKED`.

## VIEPS App Daily Audit

**Title:** Jagports VIEPS App Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`

**Procedure:** `00-Management/AUDIT-VIEPS-Daily.md`

**Prompt:** Read `00-Management/AUDIT-VIEPS-Daily.md` from branch `redesign/421-ai-os-showstopper-priority-audit` of the `jagports/jagports` repository and execute it as the complete operational procedure. If it cannot be read from that branch, report `BLOCKED`.

## Shared operating principle

Both audits use the same compact decision logic:

1. **SHOW-STOPPERS** — what can materially block progress?
2. **DO FIRST** — what should be done next, in priority order?
3. **LOW-HANGING FRUITS** — what useful work can be completed quickly?
4. **QUEUE CLEANUP** — what can be completed, consolidated, superseded or closed so active Issues/PRs stay few and actionable?

The scheduled task is only the execution mechanism. The repository Markdown files are the durable source of truth.

Changes to either procedure or this schedule require Issue → branch → PR → review → merge.
