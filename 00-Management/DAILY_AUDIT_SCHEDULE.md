# Scheduled Jagports Audits

## AI OS Daily Audit

**Title:** Jagports AI OS Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`  
**Automation ID:** `6a989c25ed848191a35b887495126b71`

**Procedure:** `00-Management/AUDIT-AI-OS-Daily.md`

**Prompt:** Read and process the repository-root `KNOWLEDGE.md` first. Follow the mandatory management/governance and communication references defined by it. Then read `00-Management/AUDIT-AI-OS-Daily.md` from the current `jagports/jagports` repository and execute it as the complete operational audit procedure. Do not use the obsolete `tlindi/jagports` repository. Apply the procedure's defined scope and the canonical daily-audit method; do not create a second priority logic in this scheduled prompt. Process findings in this exact order: **SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP**. Report human decisions only when a decision is genuinely required; they are not a separate priority category. Every Issue/PR may appear in one category only. Check actionable exceptions and traceability using repository, Issue, PR, review, implementation and testing evidence. Check that important agent communications, decisions, hand-offs, results and implementation traceability are recorded in the GitHub system of record. If a required procedure or repository source cannot be read, report `BLOCKED` and do not substitute another procedure. Never claim a check succeeded when required access or verification failed. Do not treat ordinary backlog, unavailable tooling, or inability to independently verify an unsupported GitHub Project operation as a show-stopper unless a specific work item is actually prevented from progressing. Default to read-only and do not perform unsupported Project operations. Produce the canonical audit output with exactly these sections: **OVERALL STATE**, **SHOW-STOPPERS**, **DO FIRST**, **LOW-HANGING FRUITS**, **QUEUE CLEANUP**. Reference each Issue/PR at most once in the entire result and combine all relevant findings for that Issue/PR into that single entry. Every Issue/PR reference must have its directly accessible link. If a category has no qualifying finding, report `None`. If no actionable problems are found, state that the daily audit passed.

## VIEPS App Daily Audit

**Title:** Jagports VIEPS App Daily Audit  
**Target repository:** `jagports/jagports`  
**Recurrence:** Daily  
**Timezone:** `Europe/Helsinki`

**Procedure:** `00-Management/AUDIT-VIEPS-Daily.md`

**Prompt:** Read and process the repository-root `KNOWLEDGE.md` first. Follow the mandatory management/governance and communication references defined by it. Then read `00-Management/AUDIT-VIEPS-Daily.md` from the current `jagports/jagports` repository and execute it as the complete operational audit procedure. Do not use the obsolete `tlindi/jagports` repository. Apply the procedure's defined scope and the canonical daily-audit method; do not create a second priority logic in this scheduled prompt. Process findings in this exact order: **SHOW-STOPPERS → DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP**. Report human decisions only when a decision is genuinely required; they are not a separate priority category. Every Issue/PR may appear in one category only. Check actionable exceptions and traceability using repository, Issue, PR, review, implementation and testing evidence. Check that important agent communications, decisions, hand-offs, results and implementation traceability are recorded in the GitHub system of record. If a required procedure or repository source cannot be read, report `BLOCKED` and do not substitute another procedure. Never claim a check succeeded when required access or verification failed. Do not treat ordinary backlog, unavailable tooling, or inability to independently verify an unsupported GitHub Project operation as a show-stopper unless a specific work item is actually prevented from progressing. Default to read-only and do not perform unsupported Project operations. Produce the canonical audit output with exactly these sections: **OVERALL STATE**, **SHOW-STOPPERS**, **DO FIRST**, **LOW-HANGING FRUITS**, **QUEUE CLEANUP**. Reference each Issue/PR at most once in the entire result and combine all relevant findings for that Issue/PR into that single entry. Every Issue/PR reference must have its directly accessible link. If a category has no qualifying finding, report `None`. If no actionable problems are found, state that the daily audit passed.

## Shared operating principle

Both audits use the same canonical processing method defined by `00-Management/AUDIT-Common-Daily.md`. Individual audit procedures define their own scope; this schedule defines only the execution entry point and does not create a competing audit logic.

The scheduled task is only the execution mechanism. The repository Markdown files are the durable source of truth.

Changes to either procedure or this schedule require Issue → branch → PR → review → merge.
