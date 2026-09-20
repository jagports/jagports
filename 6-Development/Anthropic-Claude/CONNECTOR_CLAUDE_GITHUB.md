# Claude GitHub Custom Connector

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

For Jagports, treat Claude/GitHub connector behavior as separate external-agent environment knowledge. Do not infer ChatGPT connector capabilities from Claude connector documentation, and do not infer Claude connector capabilities from ChatGPT connector documentation.

## Capability Transparency

For any AI agent expected to perform an external GitHub action:

- verify the GitHub account authorization;
- verify that the agent connection exposes the required operation;
- if the connector does not expose it, check whether a reviewed owner-run `gh`/GraphQL path is appropriate before falling back to manual UI work;
- perform the operation through the available authorized capability;
- independently verify the resulting GitHub state before claiming success.

The native GitHub sub-issue prohibition is an explicit exception: do not search for or use another execution path for that operation because Jagports does not use native sub-issues operationally.

If another required operation is unavailable through every authorized execution path, report the verified limitation and identify the required next step.

## Source Maintenance

When Anthropic/Claude or relevant connector capabilities change, review this document against current official documentation and verified Jagports execution evidence, then update it through the normal Jagports Issue and Pull Request workflow.
