# Jagports Daily Audit Scheduler Prompt

## Purpose

Canonical prompt for creating or modifying the scheduled Jagports Daily Audit automation.

The automation schedule and task identity are managed by the scheduling system. This file defines the prompt content that the scheduled task must use.

## Scheduler Prompt

```text
Jagports Daily Audit

Use the repository files themselves as the audit procedure; do not recreate, paraphrase, or substitute the audit logic in this scheduled prompt.

1. Read and process the repository-root KNOWLEDGE.md first. Follow all mandatory references and operating instructions defined by it, including the applicable management/governance and communication protocol.

2. Read 00-Management/AUDIT-Common-Daily.md from the main branch of jagports/jagports and use it as the canonical common audit method, including its processing order, prioritisation, category discipline, work-path rules, capability boundary, and required output format. Do not copy or recreate those rules in this scheduled prompt.

3. AI OS daily audit: read 00-Management/AUDIT-AI-OS-Daily.md from the main branch of jagports/jagports and execute its current contents directly as the AI OS-specific audit under the common method. Do not substitute a copied version from this prompt.

4. VIEPS daily audit: read 00-Management/AUDIT-VIEPS-Daily.md from the main branch of jagports/jagports and execute its current contents directly as the VIEPS-specific audit under the common method. Do not substitute a copied version from this prompt.

Keep AI OS and VIEPS results separate and within their respective scopes. The current repository files are the source of truth for audit logic and output. Do not report successful procedure-file reading as an audit result. If an exact required procedure file cannot be read from main, follow the applicable procedure's defined BLOCKED handling.
```

## Create / Modify Instructions

When creating or modifying the Jagports Daily Audit automation:

- Use the Scheduler Prompt above as the complete task prompt.
- Do not add audit logic, category definitions, output rules, or duplicated procedure content to the automation prompt.
- Preserve the existing automation identity and daily recurrence when modifying the task unless an authorized change explicitly requests otherwise.
- Keep the target repository as `jagports/jagports`.
- The scheduled task must read the canonical audit files from `main` so the production schedule follows merged repository state.
- After changing an audit procedure or this scheduler prompt file, the corresponding Issue → branch → PR → review → merge workflow is required before the production schedule is expected to use the repository change.
- If the scheduled automation prompt itself is changed, update the automation to exactly match the Scheduler Prompt section after the repository change has been reviewed/merged, unless the change is specifically intended to alter the automation independently.

## Current Automation Reference

**Title:** Jagports Daily

**Target repository:** `jagports/jagports`

**Recurrence:** Daily

**Timezone:** `Europe/Helsinki`

**Automation ID:** `6a989c25ed848191a35b887495126b71`

The automation ID is an operational reference, not part of the prompt content.
