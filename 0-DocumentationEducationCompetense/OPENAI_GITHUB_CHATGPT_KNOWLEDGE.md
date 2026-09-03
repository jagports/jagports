# OpenAI GitHub Connection and ChatGPT Knowledge

## Scope

This document records durable, source-based knowledge about the official OpenAI GitHub connection documented for ChatGPT. It does not define or replace Jagports Management workflows.

## Official OpenAI Reference

[Connecting GitHub to ChatGPT](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt)

This OpenAI Help Center article is the authoritative external reference for the ChatGPT GitHub connection behavior described here. Re-check the current article when OpenAI changes the connection or product capabilities.

## Operational Distinction

For Jagports work, distinguish three separate concepts:

1. GitHub account authorization and repository access.
2. The capabilities exposed by the current ChatGPT/agent/tool session.
3. The capabilities of Codex when repository implementation and Git operations are required.

Having authorization to a GitHub repository does not by itself prove that the current agent/tool session can perform every GitHub operation needed for a task.

## ChatGPT GitHub Connection

The OpenAI GitHub connection provides ChatGPT with access to GitHub repository information for repository analysis and search. The connection itself is not a general repository write/push mechanism.

Therefore, when a task requires modifying repository files, creating implementation commits, or pushing changes, the agent must use an available tool/product that actually provides those capabilities rather than treating ChatGPT GitHub read access as write access.

## Codex

OpenAI documents Codex as the appropriate OpenAI product/tool for repository implementation work where code needs to be generated or modified and pushed to GitHub.

For Jagports, this reinforces the existing capability-transparency rule: verify that the current session exposes the specific operation required before claiming that an external repository action has been completed.

## Repository Visibility and Authorization

If an expected repository is not available through the ChatGPT GitHub connection, verify the GitHub app installation/authorization and the repository selection or approval applicable to the GitHub account or organization, following the current OpenAI documentation.

Repository visibility in ChatGPT must not be inferred from unrelated GitHub permissions or from an assumption that a repository is automatically available.

## Relationship to Jagports Management Rules

This document is durable technical knowledge and an external product reference. It is not a workflow authority.

Jagports Management workflow remains defined by `00-Management/WORKFLOWS.md`.

The distinction between authorization and available tool capability complements, rather than replaces, the Jagports capability-transparency rules in `SKILL.md` and `KNOWLEDGE.md`.

## Source Maintenance

When OpenAI changes the GitHub connection, ChatGPT Apps, or Codex repository capabilities, review this document against the current official OpenAI Help Center article and update it through the normal Jagports Issue and Pull Request workflow.
