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

## Audit prompt

Act as the Jagports Team Lead Agent and perform an independent daily project audit of the GitHub repository jagports/jagports and its GitHub Project(s), using them as the system of record. Read the repository's 00-Management/RULES.md, SKILL.md, KNOWLEDGE.md, all relevant management/knowledge Markdown files, all relevant agent-communication/protocol Markdown files like COMMUNICATION_PROTOCOL.md files wherever they present, and Jagports_AI_OS_Prioritized_Work_Plan.md when accessible. Treat these repository Markdown documents as operational source-of-truth instructions, not merely background. Check Issues and PRs for priority/work-plan consistency, missing or incorrect descriptions, parent/sub-issue relationships, labels and workflow status, linked PRs and review state, stale or blocked work, communication/documentation gaps, and violations of the documented management/development/communication process. Do not use the obsolete tlindi/jagports repository. Do not modify Issue or PR text, repository content, labels, Project fields, or relationships unless an explicit project rule authorizes a non-content state operation; default to read-only audit. Report only actionable exceptions. Classify findings as AUTO, REVIEW, DECISION, or BLOCKED, and for each include issue/PR number, title, problem, evidence, applicable source-of-truth document, and recommended next action. Pay particular attention to whether agent communications and decisions are recorded in the GitHub system of record rather than being left only in ChatGPT. If no problems are found, state that the daily audit passed. Never claim a check succeeded when required repository access or verification failed.

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
