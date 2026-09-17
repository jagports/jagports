# GitHub Connections Knowledge

## Scope

This document records durable, source-based knowledge about documented GitHub connection methods used by AI agents. It does not define or replace Jagports Management workflows or GitHub operating workflows.

GitHub Issue, Pull Request, review, merge, testing-evidence, record-integrity, field, label, and GitHub-specific operating rules are maintained in `6-Development/github/GITHUB_OPERATING_RULES.md`.

Project/Kanban workflow meaning is maintained in `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`.

Current Project automation knowledge is maintained in `6-Development/github/Projects/GITHUB_PROJECT_AUTOMATIZATION.md`.

The current ChatGPT/GitHub Project capability boundary is maintained in `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.

## OpenAI / ChatGPT GitHub Connection

Official OpenAI reference:

[Connecting GitHub to ChatGPT](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt)

This OpenAI Help Center article is the authoritative external reference for the ChatGPT GitHub connection behavior described here. Re-check the current article when OpenAI changes the connection or product capabilities.

For Jagports work, distinguish:

1. GitHub account authorization and repository access.
2. The capabilities exposed by the current ChatGPT/agent/tool session.
3. Capabilities available through the user's own GitHub CLI / shell environment.
4. The capabilities of Codex when repository implementation and Git operations are required.

Having authorization to a GitHub repository does not by itself prove that the current agent/tool session can perform every GitHub operation needed for a task.

The ChatGPT GitHub connection provides repository access for supported repository analysis and repository operations exposed by the active connector. Missing connector capability must not be treated as proof that GitHub itself, GitHub CLI, GraphQL, or the user's authenticated shell cannot perform the operation.

When repository implementation work requires capabilities not exposed by the current ChatGPT connection, use an available tool/product that actually provides those capabilities, such as Codex where appropriate, or prepare a reviewed owner-run `gh` script when the user's authenticated shell is the available execution path.

If an expected repository is not available through the ChatGPT GitHub connection, verify the GitHub app installation/authorization and repository selection or approval applicable to the account or organization, following the current OpenAI documentation.

## GitHub Project configuration and UI settings

GitHub Project configuration is a special capability boundary.

The current ChatGPT GitHub connector may expose repository Issues, Pull Requests, branches and files while not exposing equivalent mutation operations for GitHub Project configuration such as saved views, layouts, filters, sorting, fields, options, or other Project-level settings.

Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.

When the connector does not expose a required Project mutation:

- do not repeatedly attempt unsupported connector/API operations;
- do not claim that the Project was mutated;
- do not claim that Project state was verified;
- prepare a reviewed repository artifact, script, or owner-run procedure when that is the supported path;
- record the limitation in the relevant Issue/PR.

This is a connector capability boundary, not a Product Owner decision.

A repository script may therefore be the normal implementation artifact for Project settings that cannot be mutated through the ChatGPT connector. The script remains subject to the normal Issue → branch → PR → review → testing/verification workflow.

## Current ChatGPT/GitHub Project capability boundary

For the current ChatGPT/GitHub connection, the following operations are unavailable and must not be attempted as normal executable workflow steps:

- Project View read operations;
- Project Item read operations;
- Project Item Status read operations;
- Project Item mutation operations;
- Project Item Status mutation operations;
- Project Item archive/unarchive operations;
- Project field, view, or option management.

When a repository document, Issue, PR, workflow, or script mentions Project Item Status, Project views, Project transitions, Project verification, Project mutations, Project archival state, or Project management, the current ChatGPT/GitHub connection must interpret that text only as context for a capable external actor, human, automation, or future tool. It is not permission or instruction for this connection to attempt Project operations.

Required reporting sentence:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

## Jagports task hierarchy: do not use native GitHub sub-issues

GitHub provides native parent/sub-issue relationships through its product interfaces and APIs. Jagports intentionally does **not** use that native relationship mechanism as an operational task-hierarchy source of truth.

Jagports hierarchy and traceability are maintained through Issue-body references and linked records:

- parent Issue lists child task Issues in its body;
- child Issue identifies its parent Issue in its body;
- Pull Requests and comments preserve explicit traceability links;
- native GitHub parent/sub-issue metadata is not required Jagports state.

Therefore:

- do not create native GitHub sub-issues for Jagports task hierarchy;
- do not require native GitHub sub-issue metadata for hierarchy verification;
- do not repair hierarchy by adding native GitHub sub-issues;
- use existing Issue-body traceability as the durable hierarchy source unless a later Product Owner decision changes the model.

The prohibition on native GitHub sub-issues above is a Jagports operating rule and therefore applies regardless of which environment happens to expose the native GitHub operation.

For Jagports Project setup procedures, `6-Development/github/Projects/Setting_up_Kanban.md` remains the task-specific authority for Project semantics and verification.

## Anthropic / Claude GitHub Custom Connector

Anthropic documentation currently describes GitHub as a custom connector path for Claude, with organization/admin configuration and repository indexing behavior that differs from ChatGPT's GitHub connection.

For Jagports, treat Claude/GitHub connector behavior as separate external-agent environment knowledge. Do not infer ChatGPT connector capabilities from Claude connector documentation, and do not infer Claude connector capabilities from ChatGPT connector documentation.

## Environment asymmetry rule

Different agent environments may expose different GitHub capabilities. A capability available in one environment is not automatically available in another.

Before claiming or performing an operation, verify the specific environment, identity, permission, and tool capability being used.
