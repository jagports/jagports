# Jagports Lead Agent — Current Capabilities

## Purpose

This README documents the capabilities and limits of the current Jagports Lead Agent implementation.

The runtime is a real deterministic event-processing and multi-agent coordination prototype. It is **not currently a reasoning development-agent system**.

## Current architecture

```text
GitHub
  ↓
GitHubService / GitHubAgent
  ↓
StateService
  ↓
detect new / closed / reopened Issues
  ↓
Event
  ↓
LeadAgent
  ↓
AgentRegistry
  ├─ DocumentationAgent
  ├─ DeploymentAgent
  └─ KnowledgeAgent
  ↓
AgentResult[]
  ↓
ReportService
  ↓
TelegramService infrastructure
```

The modular entry point is `main.py`.

## Implemented capabilities

The current implementation can:

- connect to the configured GitHub repository through `GitHubService`;
- collect Issue records;
- persist previous Issue state;
- compare runs and identify `new`, `closed`, and `reopened` lifecycle changes;
- construct an internal `Event` carrying lifecycle data and context;
- route the same event through multiple registered specialist agents;
- return standardized `AgentResult` objects;
- generate a Markdown report;
- retain Telegram notification infrastructure;
- add further specialist classes through `AgentRegistry`.

These capabilities are implemented in normal Python code and do not depend on an LLM.

## Current specialist behavior

The current specialists are rule-based.

### DocumentationAgent

Marks documentation review as needed when an Issue is new or closed.

### DeploymentAgent

Marks deployment review as needed when an Issue is new or closed.

It does not currently determine whether the Issue is actually deployment-related.

### KnowledgeAgent

Marks knowledge review as needed when an Issue is new, closed, or reopened.

It can access the event context, but its current recommendation remains a fixed rule-based message.

## What the agents do not currently do

The current specialist agents do **not**:

- semantically understand an Issue title, body, comments, or linked PR;
- decide whether a change is actually documentation-, deployment-, or knowledge-related from its content;
- read repository documentation on demand and reason across it;
- research missing context;
- plan implementation;
- write or review code autonomously;
- reason about the Jagports workflow and choose the next development step;
- execute a tool-using development loop;
- make autonomous merge, deployment, or governance decisions.

For example, the current DeploymentAgent can detect that an Issue lifecycle changed, but it cannot independently reason:

> This Issue changes Cloudflare/D1 architecture and therefore requires deployment-documentation review.

Its present behavior is closer to:

> An Issue was opened or closed, so flag deployment review.

## LLM integration status

`services/openai_service.py` contains an OpenAI client function, and `config.yaml` currently contains:

```yaml
openai:
  enabled: false
```

However, the current modular execution path in `main.py` and `LeadAgent` does not call `openai_service.analyse()`.

Therefore:

- changing `openai.enabled` alone does not make the current specialists reasoning agents;
- the current modular specialist results are produced by deterministic Python rules;
- the model-service module is an unused integration point in the current modular execution path.

## Practical development-workflow capability

| Capability | Current implementation |
|---|---|
| Read GitHub Issue snapshots | Yes |
| Detect new / closed / reopened Issues | Yes |
| Persist state between runs | Yes |
| Route events to multiple specialists | Yes |
| Produce standardized specialist results | Yes |
| Generate reports | Yes |
| Telegram integration infrastructure | Yes |
| Understand Issue meaning | No |
| Inspect Issue body/comments and reason about impact | No |
| Read relevant repository knowledge on demand | No |
| Select development workflow actions semantically | No |
| Plan implementation | No |
| Implement code autonomously | No |
| Perform intelligent code review | No |
| Use LLM reasoning in the current modular execution path | No |

## Event-context limitation

The current `LeadAgent` puts the full collected Issue list into:

```python
event.context["issues"]
```

This is useful for the prototype but scales poorly. If model-backed reasoning is added later, passing the complete repository snapshot to every specialist would waste context, tokens, latency, and API cost.

The intended improvement is:

```text
GitHub changes
      ↓
compact Event
  ├─ changed Issue IDs
  ├─ lifecycle state
  └─ small repository metadata
      ↓
specialist decides whether details are needed
      ↓
fetch only relevant Issue / PR / repository context
```

Deterministic filtering should happen before paid model calls.

## Capability boundary

The Lead Agent code should currently be treated as:

**implemented coordinator/event infrastructure + rule-based specialist prototypes**

and not as:

**an autonomous AI software-development team**.

The architecture provides useful foundations for later reasoning agents, because state handling, event routing, specialist registration, result normalization, reporting, and notification concerns are already separated.

Any future model-backed implementation must continue to follow Jagports Management workflow, review, testing, authorization, and human-decision boundaries. Technical capability does not grant merge or governance authority.

## Related work

[Issue #49 — Expand and govern the agent team](https://github.com/jagports/jagports/issues/49)

[PR #595 — Document Lead Agent setup and modular agent runtime](https://github.com/jagports/jagports/pull/595)

Detailed setup and historical implementation evidence are documented in:

`5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md`.
