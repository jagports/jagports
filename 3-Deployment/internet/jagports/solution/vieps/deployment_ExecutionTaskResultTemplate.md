# Execution Task Result Template

## Purpose

Use this template as the **canonical minimum structure for each actual VIEPS deployment execution-task result**.

The completed record is placed in the relevant GitHub Issue or Pull Request comment as the durable execution evidence. Do not invent a different execution-record structure for an individual task.

Do not record credentials or secret values.

## Required record

Copy the following structure into the relevant GitHub Issue/PR comment and replace each placeholder with the actual result:

```text
Date/time:
Operator:
Task:
Environment:
Resource:
Interface: CLI | API | UI
Command / dashboard path:
Expected result:
Observed result:
Status: RESEARCHED | EXECUTED | VERIFIED | BLOCKED | FAIL | NOT RUN
Verification command / evidence:
Deviation / decision:
```

## Recording rules

- Record actual execution, not planned execution.
- Use one identifiable record for each execution task result.
- Record execution and verification distinctly; successful execution alone is not proof of verification.
- Put the completed record in the relevant GitHub Issue/PR comment so the execution history remains attached to the work item.
- If execution produces a deviation, blocker, failure, or decision, record it in the same task result and preserve the distinction between observed fact and decision.
- Do not maintain a duplicate task-tracking or execution log in deployment Markdown when the evidence belongs in GitHub Issue/PR history.
- Preserve chronological history. Do not rewrite historical closed Issue/PR comments merely to retrofit this template.
- Never record passwords, password hashes, recovery codes, API tokens, GitHub credentials, Cloudflare secrets, or other secret values.
