# Scheduled Daily Team Lead Project Audit

## Purpose

This document records the verifiable implementation of the recurring Jagports Team Lead project audit. It is durable operational documentation; it does not define a new Management workflow. The canonical workflow remains `00-Management/WORKFLOWS.md`.

## Target

- Repository: `jagports/jagports`
- System of record: GitHub repository and its GitHub Project(s)
- Audit role: Jagports Team Lead Agent
- Recurrence: daily
- Scheduling facility: ChatGPT task/automation facility

## Scheduled task

- Task title: `Jagports Daily Audit`
- Task identifier: `6a989c25ed848191a35b887495126b71`
- Enabled: yes
- Time zone: `Europe/Helsinki`
- Recurrence: daily
- Exact recurring execution time: not specified; the scheduling facility uses a flexible recurring daily schedule.

The task existence, enabled state, identifier, prompt, recurrence and time-zone configuration were independently confirmed through the scheduling facility on 2026-09-04.

## Audit prompt

> Act as the Jagports Team Lead Agent and perform an independent daily project audit of the GitHub repository jagports/jagports and its GitHub Project(s), using them as the system of record. Read the repository's 00-Management/RULES.md, SKILL.md, KNOWLEDGE.md, all relevant management/knowledge Markdown files, all relevant agent-communication/protocol Markdown files like COMMUNICATION_PROTOCOL.md files wherever they present, and Jagports_AI_OS_Prioritized_Work_Plan.md when accessible. Treat these repository Markdown documents as operational source-of-truth instructions, not merely background. Check Issues and PRs for priority/work-plan consistency, missing or incorrect descriptions, parent/sub-issue relationships, labels and workflow status, linked PRs and review state, stale or blocked work, communication/documentation gaps, and violations of the documented management/development/communication process. Do not use the obsolete tlindi/jagports repository. Do not modify Issue or PR text, repository content, labels, Project fields, or relationships unless an explicit project rule authorizes a non-content state operation; default to read-only audit. Report only actionable exceptions. Classify findings as AUTO, REVIEW, DECISION, or BLOCKED, and for each include issue/PR number, title, problem, evidence, applicable source-of-truth document, and recommended next action. Pay particular attention to whether agent communications and decisions are recorded in the GitHub system of record rather than being left only in ChatGPT. If no problems are found, state that the daily audit passed. Never claim a check succeeded when required repository access or verification failed.

## Operational boundaries

- ChatGPT task/automation is the scheduling and notification mechanism.
- GitHub remains the Jagports system of record for Issues, PRs, implementation traceability, decisions and durable repository knowledge.
- The scheduled audit is read-only by default as stated in the prompt.
- The audit must report a required but unavailable capability as `BLOCKED`; it must not present an incomplete audit as successful.
- The scheduled task does not replace the GitHub Issue/PR communication protocol.

## Verification record

The scheduling facility confirmed that the task exists, is enabled, and uses the complete audit prompt above with a daily recurring schedule. The earlier configuration contained an exact recurring time expression; it was corrected to the supported flexible daily recurrence so the documented schedule does not claim an unsupported exact recurring execution time.

The repository-side Project Item Status transition for this implementation must still be performed and independently verified through the GitHub Project before the work can pass the Management review boundary. If the required Project operation is unavailable to the executing actor, the limitation must be recorded as `BLOCKED` rather than claimed as successful.

## Source of truth

- `00-Management/RULES.md`
- `00-Management/WORKFLOWS.md`
- `SKILL.md`
- `KNOWLEDGE.md`
- `0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md`
- `5-Implementation-Projects/Jagports_AI_OS_Prioritized_Work_Plan.md`
