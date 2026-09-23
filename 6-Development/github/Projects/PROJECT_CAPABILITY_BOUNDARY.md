# Project Capability Boundary

## Scope

This file defines only the current ChatGPT/GitHub connection capability boundary for GitHub Project handling.

It must not duplicate GitHub Project/Kanban lifecycle, Project Item Status meaning, checklist, review, or workflow-transition rules. Those rules belong in:

- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` for Project/Kanban workflow meaning, Project Item Status meanings, lifecycle, evidence rules, and Product Owner Project rulings;
- `00-Management/WORKFLOWS.md` for the top-level Management workflow, review, testing, acceptance, checklist, merge, and record-integrity rules;
- `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` for durable GitHub connection and environment knowledge.

## Ordinary execution: repository-owned synchronization

Existing Jagports GitHub Actions are the normal authority and execution path for the documented Issue/PR-to-Project lifecycle and work-control synchronization. During ordinary Issue, branch, PR, review, testing, merge, and closure work:

1. Proceed through the canonical repository workflow. Let existing Actions process their documented event and authorized work-control triggers. Do not add a separate direct Project-access check, a manual Project Item step, or a connector-capability gate.
2. Where a Project transition or prioritization is explicitly authorized by the canonical workflow, use its existing approved repository trigger and, when confirmation is needed, the resulting Actions verification and managed read-back snapshot. Writing a trigger is not proof that synchronization succeeded.
3. Do not attempt direct Project administration as an implicit step of ordinary Issue/PR work. A separately requested change to Project configuration follows its own authorized procedure; this does not gate unrelated work.

## Failure diagnosis

**Investigate relevant GitHub Actions runs, jobs, and logs whenever synchronization or other failures need investigation.** Use workflow conclusions, job output, and authoritative snapshot or failure comments as appropriate. Distinguish a failed workflow from an in-progress run, delayed snapshot, or stale connector response; verify current evidence before identifying a blocker. Follow up on an actual failure through the existing Issue/PR and workflow procedure, without inventing a new Project-management prerequisite.

## Reporting

Never insert boilerplate about unavailable direct Project access or Project-tool capabilities into routine progress, review, or completion reports. Do not require a capability disclaimer merely because Project state is part of a workflow.

Report the requested Issue/PR and test results normally. When synchronization evidence is relevant, state only what the verified Actions result or current managed snapshot supports; never infer successful synchronization from an intended state or a trigger comment. When an actual failure is relevant, report the observed workflow failure, its log evidence, and the necessary follow-up instead of a generic capability statement.
