# Kanban Task Import Skill

## Canonical workflow

The Management workflow is defined only in [`00-Management/WORKFLOWS.md`](../../../00-Management/WORKFLOWS.md).

This specialized skill implements that workflow for Kanban task import. It must not redefine the Management lifecycle, Issue/PR discovery rules, historical-work precedence, or Project verification rules independently.

## Input

- Project knowledge
- prioritized task list
- GitHub repository
- GitHub Project

## Procedure

1. Inspect the repository and existing Project.
2. Identify already completed tasks and existing active Issues.
3. For each requested task, follow the canonical open-work and historical-work discovery sequence before creating anything.
4. Never duplicate an existing active or valid historical implementation.
5. Create one Issue per remaining genuinely separate task.
6. Preserve explicit priority ordering such as `P1`, `P1.1`, `P1.2`.
7. Set Executor and Where when those are required task fields.
8. Add each Issue to the GitHub Project.
9. Set the correct **Project Item Status**.
10. Independently verify that each Issue exists as the intended Project Item and that its expected Status is actually set.
11. Claim successful Project setup only after verification.
12. If a Project mutation or verification fails, report the failure and state that no successful Project operation is claimed.
13. Verify that every intended task exists exactly once and report discrepancies.

## Rules

- Kanban setup is always first where the project plan requires it.
- No arbitrary parallel P0/P1 priorities.
- Sub-priorities are allowed.
- Human approval is required for `DECISION NEEDED` items when human authority is required.
- GitHub is the communication/system-of-record layer.
- Stay within the $0 architecture.
- Project mutation is always **MUTATE → INDEPENDENTLY VERIFY → CLAIM SUCCESS**.
- Do not treat an API mutation response alone as proof that the Project Item or Status is correct.
