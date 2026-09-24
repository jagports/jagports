# GitHub Connections Knowledge

## Scope

This document records durable, source-based knowledge about documented GitHub connection methods used by AI agents. It does not define or replace Jagports Management workflows or GitHub operating workflows.

GitHub Issue, Pull Request, review, merge, testing-evidence, record-integrity, field, label, and GitHub-specific operating rules are maintained in `6-Development/github/GITHUB_OPERATING_RULES.md`.

Project/Kanban workflow meaning is maintained in `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`.

Current Project automation knowledge is maintained in `6-Development/github/Projects/GITHUB_PROJECT_AUTOMATIZATION.md`.

The current ChatGPT/GitHub Project capability boundary is maintained in `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.

Claude GitHub custom connector knowledge is maintained in `6-Development/Anthropic-Claude/CONNECTOR_CLAUDE_GITHUB.md`.

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

## Project synchronization and configuration

During ordinary Issue/PR work, existing repository GitHub Actions handle the documented Project synchronization events and approved work-control triggers. The single agent execution/reporting rule is in `Projects/PROJECT_CAPABILITY_BOUNDARY.md`; workflow semantics are in `Projects/GITHUB_PROJECT_WORKFLOWS.md`. Do not repeat their instructions here.

When synchronization or other failures need diagnosis, inspect the relevant GitHub Actions runs, jobs, and logs, plus verified snapshots or failure comments where applicable. Do not turn a direct connector limitation into a routine status message or a prerequisite for unrelated work.

When the user separately requests Project layout, view, or other administrative configuration, use an explicitly authorized and reviewed repository script or the owner's authenticated GitHub CLI if the active connector does not support that specific requested operation. Such configuration is not an implicit step in ordinary Issue/PR execution.

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

## Environment asymmetry

The user's shell environment is not identical to the agent execution environment.

In Jagports work the user may run Windows Git Bash with a locally installed and authenticated GitHub CLI. That environment may support shell features, GitHub CLI commands, GraphQL operations, authentication scopes, or Project operations that are unavailable from the current agent container or connector.

Therefore:

- absence of a command, shell feature, API surface, or permission in the agent environment is not evidence that it is unavailable in the user's shell;
- do not remove or weaken a script solely because the agent cannot execute the same command locally;
- validate syntax and logic against documented or user-verified capabilities and let the user's actual shell execution provide runtime evidence;
- when execution differs, record the exact observed result and amend the script from evidence rather than assuming both environments behave identically.

## Capability Transparency

For any AI agent expected to perform an external GitHub action:

- verify the GitHub account authorization;
- verify that the agent connection exposes the required operation;
- if the connector does not expose it, check whether a reviewed owner-run `gh`/GraphQL path is appropriate before falling back to manual UI work;
- perform the operation through the available authorized capability;
- independently verify the resulting GitHub state before claiming success.

The native GitHub sub-issue prohibition above is an explicit exception: do not search for or use another execution path for that operation because Jagports does not use native sub-issues operationally.

If another required operation is unavailable through every authorized execution path, report the verified limitation and identify the required next step.

## Source Maintenance

When OpenAI, Anthropic/Claude, GitHub, GitHub CLI, or relevant connector capabilities change, review this document against current official documentation and verified Jagports execution evidence, then update it through the normal Jagports Issue and Pull Request workflow.
