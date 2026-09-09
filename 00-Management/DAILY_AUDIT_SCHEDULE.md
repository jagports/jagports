# Scheduled Jagports Audits

## AI OS Daily Audit

**Title:** Jagports AI OS Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`  
**Automation ID:** `6a989c25ed848191a35b887495126b71`

**Procedure:** `00-Management/AUDIT-AI-OS-Daily.md`

**Prompt:** Read and process the repository-root `KNOWLEDGE.md` first. Follow the mandatory management/governance and communication references defined by it. Then read `00-Management/AUDIT-AI-OS-Daily.md` from the current `jagports/jagports` repository and execute it as the complete operational audit procedure. Do not use the obsolete `tlindi/jagports` repository. Apply the procedure's defined scope and the canonical method in `00-Management/AUDIT-Common-Daily.md`. If a required procedure or repository source cannot be read, report `BLOCKED` and do not substitute another procedure. The common method defines the audit checks, processing order, category discipline, work-path rules, output format and capability boundary. The scheduled task is only the execution mechanism; do not reproduce or create a competing audit logic here.

## VIEPS App Daily Audit

**Title:** Jagports VIEPS App Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`

**Procedure:** `00-Management/AUDIT-VIEPS-Daily.md`

**Prompt:** Read and process the repository-root `KNOWLEDGE.md` first. Follow the mandatory management/governance and communication references defined by it. Then read `00-Management/AUDIT-VIEPS-Daily.md` from the current `jagports/jagports` repository and execute it as the complete operational audit procedure. Do not use the obsolete `tlindi/jagports` repository. Apply the procedure's defined scope and the canonical method in `00-Management/AUDIT-Common-Daily.md`. If a required procedure or repository source cannot be read, report `BLOCKED` and do not substitute another procedure. The common method defines the audit checks, processing order, category discipline, work-path rules, output format and capability boundary. The scheduled task is only the execution mechanism; do not reproduce or create a competing audit logic here.

## Shared operating principle

Both audits use the same canonical processing method defined by `00-Management/AUDIT-Common-Daily.md`. Individual audit procedures define their own scope; this schedule defines only the execution entry point and does not create a competing audit logic.

The scheduled task is only the execution mechanism. The repository Markdown files are the durable source of truth.

Changes to either procedure or this schedule require Issue → branch → PR → review → merge.
