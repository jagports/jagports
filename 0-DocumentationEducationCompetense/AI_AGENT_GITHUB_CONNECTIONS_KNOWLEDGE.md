# AI Agent GitHub Connections Knowledge

## Scope

This document records durable, source-based knowledge about documented GitHub connection methods used by AI agents. It does not define or replace Jagports Management workflows.

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

When the connector does not expose a required Project mutation:

- do not repeatedly attempt unsupported connector/API operations;
- do not conclude that the Project setting cannot be changed through GitHub;
- do not downgrade the requested implementation to manual UI instructions merely because the connector cannot perform the mutation;
- prefer a reviewed repository script that the authorized organization owner can run with GitHub CLI;
- use `gh project ...` and/or `gh api graphql` when those are the supported execution surfaces for the required operation;
- discover Project, field, option and view IDs at runtime rather than copying historical IDs;
- inspect the current GraphQL schema or otherwise verify the supported mutation shape before writing Project configuration;
- use the user's authenticated `gh` session rather than embedding PAT values or other credentials in repository content;
- independently read back the resulting Project state after mutation;
- use direct human UI observation only for aspects that the available API/CLI path cannot authoritatively inspect.

A repository script may therefore be the normal implementation artifact for Project settings that cannot be mutated through the ChatGPT connector. The script remains subject to the normal Issue → branch → PR → review → testing/verification workflow.

## Jagports task hierarchy: do not use native GitHub sub-issues

GitHub provides native parent/sub-issue relationships through its product interfaces and APIs. Jagports intentionally does **not** use that native relationship mechanism as an operational task-hierarchy source of truth.

The Jagports task-hierarchy source of truth is explicit Issue-body traceability:

- a parent Issue lists its child task Issues in its body;
- a child Issue identifies its parent Issue in its body;
- identifiers such as P-number/title structure may help locate or cross-check work, but they are not sufficient by themselves to establish hierarchy.

For Jagports work:

- never create, add, remove, reorder, repair, migrate, synchronize, or otherwise mutate native GitHub sub-issue relationships;
- never use REST, GraphQL, GitHub CLI, GitHub UI, connector-specific operations, or another fallback path to create or repair native sub-issue relationships;
- never open work solely to reconcile native sub-issue metadata;
- never audit native `parent_issue`, `sub_issues`, `sub_issues_summary`, or equivalent native hierarchy metadata as required Jagports state;
- verify hierarchy from the explicit parent/child Issue-body references instead;
- do not infer a parent solely from a title or priority prefix when the Issue-body relationship is absent or contradictory;
- historical native sub-issue relationships may remain untouched as legacy metadata and must not be rewritten merely to normalize old records;
- do not modify closed historical Issue bodies merely to retrofit the current hierarchy convention.

This policy is intentional and is not a claim that GitHub lacks native sub-issue support. It prevents Jagports task hierarchy from depending on a relationship mechanism that has been inconsistently available to agents and was historically attempted by repository scripts, including paths that could suppress mutation failures. Explicit Issue-body relationships are portable, visible through ordinary Issue APIs, and already used by current Jagports task groups.

### Environment asymmetry

The user's shell environment is not identical to the agent execution environment.

In Jagports work the user may run Windows Git Bash with a locally installed and authenticated GitHub CLI. That environment may support shell features, GitHub CLI commands, GraphQL operations, authentication scopes, or Project operations that are unavailable from the current agent container or connector.

Therefore:

- absence of a command, shell feature, API surface, or permission in the agent environment is not evidence that it is unavailable in the user's shell;
- do not remove or weaken a script solely because the agent cannot execute the same command locally;
- validate syntax and logic against documented or user-verified capabilities and let the user's actual shell execution provide runtime evidence;
- when execution differs, record the exact observed result and amend the script from evidence rather than assuming both environments behave identically.

The prohibition on native GitHub sub-issues above is a Jagports operating rule and therefore applies regardless of which environment happens to expose the native GitHub operation.

For Jagports Project setup procedures, `5-Implementation-Projects/Setting_up_Kanban/Setting_up_Kanban.md` remains the task-specific authority for Project semantics and verification.

## Anthropic / Claude GitHub Custom Connector

Claude supports custom connectors through its connector configuration interface:

https://claude.ai/customize/connectors

The documented setup flow for the Jagports GitHub connector is:

1. Open Claude connector configuration.
2. Select **+** next to **Connectors**.
3. Select **Add custom connector**.
4. Give the connector an appropriate name.
5. Use the GitHub Copilot MCP endpoint:
   `https://api.githubcopilot.com/mcp/`
6. Open **Advanced settings**.
7. Add the header:
   `Authorization: Bearer <your PAT>`
8. Paste the actual PAT directly into Claude's connector configuration field.
9. Select **Add**.

The actual PAT is a secret credential. It must never be written into Jagports repository content, Issues, Pull Requests, comments, scripts, logs, or chat messages. Only a placeholder such as `<your PAT>` may appear in documentation.

Authorization and exposed connector capabilities remain separate verification points. Successful connector configuration or authentication does not by itself prove that the current Claude session can perform every GitHub operation required by a task. The specific operation must be tested or otherwise verified before claiming completion.

The Claude connector configuration is an external product configuration and must not become a competing Jagports workflow authority. Current Jagports Management workflow remains defined by `00-Management/WORKFLOWS.md`.

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
