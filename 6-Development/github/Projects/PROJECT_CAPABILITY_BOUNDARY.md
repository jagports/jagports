# Project Capability Boundary

## Scope

This file defines only the current ChatGPT/GitHub connection capability boundary for GitHub Project handling.

It must not duplicate GitHub Project/Kanban lifecycle, Project Item Status meaning, checklist, review, or workflow-transition rules. Those rules belong in:

- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` for Project/Kanban workflow meaning, Project Item Status meanings, lifecycle, evidence rules, and Product Owner Project rulings;
- `00-Management/WORKFLOWS.md` for the top-level Management workflow, review, testing, acceptance, checklist, merge, and record-integrity rules;
- `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` for durable GitHub connection and environment knowledge.

## Current ChatGPT/GitHub connection rule

Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.

For this connection, the following operations are unavailable and must not be attempted as normal executable workflow steps:

- Project View read operations;
- Project Item read operations;
- Project Item Status read operations;
- Project Item mutation operations;
- Project Item Status mutation operations;
- Project Item archive/unarchive operations;
- Project field, view, or option management.

When `GITHUB_PROJECT_WORKFLOWS.md`, `WORKFLOWS.md`, `SKILL.md`, another repository document, an Issue, or a PR mentions Project Item Status, Project views, Project transitions, Project verification, Project mutations, Project archival state, or Project management, the current ChatGPT/GitHub connection must interpret that text only as background workflow context for a capable external actor, human, automation, or future tool. It is not permission or instruction for this connection to attempt Project operations.

The current connection may continue work that can be verified through repository files, Issues, Pull Requests, reviews, commits, comments, checks, and other non-Project operations exposed by the connector. It must not claim any Project state or Project mutation.

## Reporting rule

When Project evidence would normally be relevant, report:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

Do not retry unsupported Project operations. Do not present intended Project state as observed Project state. Do not classify this limitation as `BLOCKED` unless the specific work item cannot progress without Project access.
