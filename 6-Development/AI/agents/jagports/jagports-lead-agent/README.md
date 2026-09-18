# Jagports Lead Agent Runtime

## Scope

This directory contains the current Jagports Lead Agent prototype implementation.

The implementation is a working deterministic event-processing and specialist-routing framework. It is not currently a production autonomous development agent system and it does not currently perform LLM-backed reasoning in the modular execution path.

The current unattended Codex-API-dependent Agent Infrastructure roadmap is suspended until a suitable unattended execution capability is available and explicitly re-evaluated. This repository implementation remains useful as a prototype, testable architecture, and future integration starting point.

## Current architecture

```text
GitHub
  -> GitHubService / GitHubAgent
  -> StateService
       -> lifecycle delta: new / closed / reopened
  -> Event
  -> LeadAgent
  -> AgentRegistry
       -> DocumentationAgent
       -> DeploymentAgent
       -> KnowledgeAgent
       -> AgentResult[]
  -> ReportService
  -> notification infrastructure
```

## Current capabilities

| Capability | Current state | Notes |
|---|---|---|
| Read GitHub Issue snapshots | Yes | GitHub data collection is implemented. |
| Persist repository Issue state | Yes | State is stored locally for comparison between runs. |
| Detect new / closed / reopened Issues | Yes | Deterministic lifecycle comparison is implemented. |
| Create internal Events | Yes | Lifecycle changes are passed through the shared `Event` contract. |
| Route one Event to multiple specialists | Yes | `AgentRegistry` invokes registered specialists. |
| Return standardized specialist results | Yes | Specialists return `AgentResult` objects. |
| Produce a Lead Agent report | Yes | Report generation is implemented. |
| Telegram notification support | Partial | Notification infrastructure exists; unattended delivery/retry behavior is not treated as production-verified. |
| Understand Issue semantics or intent | No | Specialists currently use simple Python lifecycle rules. |
| Decide whether an Issue is actually documentation/deployment/knowledge related | No | Current specialists react to lifecycle state, not semantic topic analysis. |
| Read Issue body/comments on demand and reason about them | No | No current specialist tool/reasoning loop performs this. |
| Reason across repository knowledge, workflows, Issues and PRs | No | The modular runtime does not currently invoke an LLM for specialist reasoning. |
| Plan implementation work | No | No implemented reasoning/planning agent converts Issues into development plans. |
| Modify code autonomously | No | The prototype does not act as an autonomous coding executor. |
| Review code semantically | No | No implemented reasoning-based PR review agent exists. |
| Enforce Jagports workflow semantically | No | Repository governance exists in project documentation, but the prototype does not reason over it. |
| LLM reasoning in current modular execution path | No | `services/openai_service.py` exists, but `main.py` / `LeadAgent` do not currently call it. |
| Production unattended agent service | No | The implementation remains a prototype/reference runtime. |

## Specialist behavior today

The specialist classes are deterministic rule processors.

Examples of the current behavior:

- `DocumentationAgent`: a new or closed Issue causes a recommendation to review documentation impact.
- `DeploymentAgent`: a new or closed Issue causes a recommendation to review deployment impact.
- `KnowledgeAgent`: a new, closed, or reopened Issue causes a recommendation to review knowledge impact.

These rules are useful for event routing and framework testing, but they do not establish semantic reasoning.

## OpenAI service status

`services/openai_service.py` contains a model-call wrapper, and `config.yaml` currently contains:

```yaml
openai:
  enabled: false
```

The current modular `main.py` and `LeadAgent` do not invoke `openai_service.analyse()`. Therefore changing only the configuration flag would not turn the three specialists into reasoning agents.

A future model integration should be wired deliberately into the specialist or coordinator execution path and should preserve the existing deterministic filtering, event, state, result, governance, and reporting boundaries.

## Low-effort path toward reasoning capabilities

The smallest useful evolution is to retain the existing deterministic infrastructure and add reasoning only where it has value.

A practical sequence is:

1. **Compact the Event payload**
   - pass only changed Issue identifiers and small metadata;
   - avoid sending the full repository snapshot to a model.

2. **Add lazy Issue-detail retrieval**
   - give a specialist a way to fetch the changed Issue body/comments only when needed.

3. **Add one model-neutral reasoning service**
   - expose a single interface such as `analyse(prompt, context)`;
   - keep provider-specific code behind that boundary.

4. **Upgrade one specialist first**
   - start with Documentation or Knowledge;
   - let it classify whether the changed Issue is actually relevant and return a structured `AgentResult`.

5. **Load only relevant repository knowledge**
   - supply the applicable `KNOWLEDGE.md`, workflow, or SPEC excerpts instead of the whole repository.

6. **Keep deterministic routing ahead of model calls**
   - no repository change should mean no paid reasoning call;
   - invoke only the specialist that is plausibly relevant.

7. **Keep write authority separate**
   - first use reasoning for classification, explanation, and recommendations;
   - do not couple model reasoning directly to merge/deployment authority.

With these changes, several current "No" capabilities can become "Yes" without replacing `LeadAgent`, `AgentRegistry`, `Event`, `AgentResult`, state handling, reporting, or notification infrastructure.

## Roadmap

The preferred next evolution is incremental: preserve the working deterministic event/state/routing framework and add model-backed reasoning only where it creates measurable value.

### v0.1-mvp — minimum reasoning enablement with OpenAI Agents SDK

Target: turn one current rule-based specialist into a real semantic reasoning agent while keeping risk, scope, and recurring cost small.

Planned minimum:

1. **Keep the existing coordinator infrastructure**
   - retain `GitHubService`, `StateService`, `Event`, `LeadAgent`, `AgentRegistry`, `AgentResult`, reporting, and notification boundaries.

2. **Compact event context before model use**
   - carry changed Issue identifiers and small lifecycle metadata rather than the full repository snapshot;
   - perform no model call when no relevant change exists.

3. **Add lazy Issue-detail retrieval**
   - retrieve title, body, labels, and only the comments needed by the specialist;
   - avoid repeatedly fetching or prompting with unrelated repository state.

4. **Introduce a model-neutral reasoning service**
   - use the OpenAI Agents SDK behind one service boundary;
   - keep provider/model selection outside specialist business logic where practical;
   - preserve the option to replace the model provider later.

5. **Enable one specialist first**
   - start with `DocumentationAgent` or `KnowledgeAgent`;
   - classify whether a changed Issue is actually relevant;
   - return a structured `AgentResult` containing the decision, rationale, and relevant files or knowledge areas.

6. **Load only relevant repository guidance**
   - provide the applicable `KNOWLEDGE.md`, workflow, or SPEC excerpts as needed;
   - do not send all repository documentation to every run.

7. **Keep deterministic routing before paid reasoning**
   - zero relevant changes means zero model calls;
   - invoke only the specialist plausibly affected by the event;
   - begin with a low-cost model and record actual token/cost usage before expanding scope.

8. **Keep write authority out of v0.1-mvp**
   - reasoning may classify, explain, recommend, and prepare plans;
   - it must not gain autonomous merge, deployment, or unrestricted repository-write authority.

The OpenAI Agents SDK is expected to use normal OpenAI API authentication and usage billing rather than requiring a separate SDK subscription. Current model/pricing details are operational inputs and must be rechecked before activation rather than hard-coded into this durable roadmap.

### Later roadmap direction

After v0.1-mvp demonstrates useful reasoning at acceptable cost and reliability:

- extend semantic reasoning to the remaining specialists;
- add repository/Issue/PR lookup tools with minimum required permissions;
- add planning capability that can turn an approved Issue into a proposed implementation plan;
- add semantic PR/code review as an advisory capability;
- add robust event replay, retries, duplicate-event protection, failure isolation, and observability;
- introduce controlled code-edit/test execution only after tool permissions and human review boundaries are proven;
- evaluate whether the self-hosted coordinator remains simpler than moving long-running/resumable orchestration to a managed agent runtime;
- progress toward an automated multi-agent team only where each additional autonomous action has an explicit permission boundary, verification path, and human-governed decision/merge/deploy gate.

## Governance boundary

GitHub remains the durable system of record. Repository workflow, review, testing, approval, and merge rules remain authoritative regardless of which model provider may later be connected.

Related work:

- Issue #49 — P12 Expand and govern the agent team
- PR #595 — Lead Agent setup and modular agent runtime documentation
- `5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md` — detailed prototype history and setup record
