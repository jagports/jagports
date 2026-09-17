# Project Capability Boundary

## Current ChatGPT/GitHub connection rule

The current ChatGPT/GitHub connection must not try to use GitHub Project management operations.

For this connection, the following operations are unavailable and must not be attempted as normal executable workflow steps:

- Project View read operations;
- Project Item read operations;
- Project Item Status read operations;
- Project Item mutation operations;
- Project Item Status mutation operations;
- Project Item archive/unarchive operations;
- Project field, view, or option management.

This is the single current capability rule for ChatGPT/GitHub Project handling: **do not use Project management, Project reads, Project View reads, Project Item reads, Project Item Status reads, Project mutations, Project Item Status mutations, Project archive/unarchive operations, or Project field/view/option management through this connection.**

## Required behaviour

When `WORKFLOWS_GITHUB_PROJECT.md`, `WORKFLOWS.md`, `SKILL.md`, another repository document, an Issue, or a PR mentions Project Item Status, Project views, Project transitions, Project verification, Project mutations, Project archival state, or Project management, the current ChatGPT/GitHub connection must interpret that text only as background workflow context for a capable external actor, human, automation, or future tool. It is not permission or instruction for this connection to attempt Project operations.

The current connection may continue work that can be verified through repository files, Issues, Pull Requests, reviews, commits, comments, and checks. It must not claim any Project state or Project mutation.

## Placement

`00-Management/WORKFLOWS_GITHUB_PROJECT.md` is the scoped canonical workflow location for detailed GitHub Project/Kanban meaning, lifecycle, evidence rules, and Product Owner rulings such as the no-Pull-Request-Project-Item-archive rule.

`00-Management/WORKFLOWS.md` is the top-level workflow authority and incorporates `WORKFLOWS_GITHUB_PROJECT.md` by reference. It must not duplicate detailed Project/Kanban rules.

`6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` is the GitHub-specific durable knowledge location for GitHub connection capability, environment asymmetry, native sub-issue policy, and related GitHub-tooling knowledge. Root `KNOWLEDGE.md` must remain a minimal repository entry point and must not carry Project-specific ruling descriptions.

`0-DocumentationEducationCompetense/SKILL.md` is the execution layer. It states the current-connection prohibition and points back to this file and `WORKFLOWS_GITHUB_PROJECT.md`; it must not duplicate detailed Project/Kanban lifecycle rules.

## Reporting rule

When Project evidence would normally be relevant, report:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

Do not retry unsupported Project operations. Do not present intended Project state as observed Project state. Do not classify this limitation as `BLOCKED` unless the specific work item cannot progress without Project access.
