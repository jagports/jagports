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
3. The capabilities of Codex when repository implementation and Git operations are required.

Having authorization to a GitHub repository does not by itself prove that the current agent/tool session can perform every GitHub operation needed for a task.

The ChatGPT GitHub connection provides repository access for supported repository analysis and search. The available connection capability must not be assumed to include repository write/push operations.

When repository implementation work requires capabilities not exposed by the current ChatGPT connection, use an available tool/product that actually provides those capabilities, such as Codex where appropriate.

If an expected repository is not available through the ChatGPT GitHub connection, verify the GitHub app installation/authorization and repository selection or approval applicable to the account or organization, following the current OpenAI documentation.

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
- perform the operation through the available capability;
- independently verify the resulting GitHub state before claiming success.

If the required operation is unavailable, report the verified limitation and identify the available alternative or required next step.

## Source Maintenance

When OpenAI, Anthropic/Claude, GitHub, or the relevant connector capabilities change, review this document against the current official documentation and update it through the normal Jagports Issue and Pull Request workflow.
