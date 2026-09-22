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


### Current processing workflow

```text
systemd / manual run
        |
        v
     main.py
        |
        v
   LeadAgent.run()
        |
        +--> GitHubAgent --> GitHubService --> GitHub Issues
        |
        +--> StateService
        |      |
        |      +--> compare current snapshot with previous state
        |      +--> detect new / closed / reopened
        |
        +--> Event("issue.lifecycle.changed")
        |      |
        |      +--> data = lifecycle delta
        |      +--> context = current Issue snapshot
        |
        +--> AgentRegistry.analyse_all(event)
               |
               +--> DocumentationAgent --+
               +--> DeploymentAgent -----+--> AgentResult[]
               +--> KnowledgeAgent ------+
        |
        +--> ReportService
        |
        +--> notification infrastructure
```

The implementation above is real runtime infrastructure. The present limitation is not that the whole prototype is a mock: collection, lifecycle comparison, event propagation, specialist dispatch, result collection, state persistence, and reporting are implemented. The current specialists themselves are rule-based and do not yet perform LLM-backed semantic reasoning.

### v0.1-mvp target workflow

```text
GitHub change
    |
    v
deterministic lifecycle detection
    |
    v
compact Event
    |
    +--> no relevant change ----------------------> no model call / no API cost
    |
    v
deterministic specialist routing
    |
    v
one relevant specialist
    |
    +--> lazy Issue detail lookup
    |       title / body / labels / needed comments
    |
    +--> load only relevant repository guidance
    |       KNOWLEDGE.md / workflow / SPEC excerpts
    |
    v
model-neutral ReasoningService
    |
    v
OpenAI Agents SDK
    |
    v
semantic classification / explanation
    |
    v
structured AgentResult
    |
    v
existing ReportService / notification path
```

This design intentionally adds intelligence in the middle of the existing architecture rather than replacing the coordinator, state, event, registry, result, reporting, or notification boundaries.

### Longer-term development workflow

```text
Issue / PR event
      |
      v
Lead / coordinator
      |
      +--> deterministic filters and policy gates
      |
      +--> Documentation specialist
      +--> Knowledge specialist
      +--> Deployment specialist
      +--> Planning specialist
      +--> Review specialist
      |
      v
reasoning + bounded tools
      |
      +--> read Issue / PR / repository guidance
      +--> inspect relevant code or diffs
      +--> prepare plan / recommendation / test proposal
      |
      v
controlled execution boundary
      |
      +--> optional code edit / tests / Issue-PR updates
      |
      v
independent review / required human decision gates
      |
      v
GitHub durable system of record
```

Full autonomy is a later capability stage, not a requirement of v0.1-mvp.

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


## Capability evolution matrix

| Capability | Current prototype | v0.1-mvp target | Later direction |
|---|---|---|---|
| Read GitHub Issue snapshots | Yes | Yes | Yes |
| Persist and compare Issue state | Yes | Yes | Yes |
| Detect new / closed / reopened | Yes | Yes | Yes, with stronger event coverage |
| Create and route internal Events | Yes | Yes | Yes |
| Run multiple specialist components | Yes | Yes | Yes |
| Return structured `AgentResult` objects | Yes | Yes | Yes |
| Produce reports | Yes | Yes | Yes |
| Telegram notification support | Partial | Keep existing | Reliable delivery/retry/observability |
| Understand Issue semantics | No | **Yes for one enabled specialist** | Yes across justified specialists |
| Determine true documentation/knowledge relevance | No | **Yes** | Yes |
| Read changed Issue body/comments on demand | No | **Yes** | Yes |
| Retrieve only relevant repository guidance | No | **Yes** | Yes, with broader tool-assisted lookup |
| Reason across Issue + selected knowledge | No | **Yes** | Yes |
| Explain the reason for a specialist decision | No | **Yes** | Yes |
| Measure model/token usage | No | **Yes** | Yes with budgets/limits |
| Plan implementation work | No | Possible next step | Yes |
| Reason across related Issues and PRs | No | Limited/optional | Yes |
| Semantic PR/code review | No | No | Advisory first, then broader controlled review |
| Modify repository code | No | No | Controlled tool capability only |
| Run tests as an agent action | No | No | Controlled execution stage |
| Update Issues/PRs autonomously | No | No | Bounded permissions and verification only |
| Merge or deploy autonomously | No | No | Not implied; remains governed by project rules |
| Reliable unattended service | No | No requirement | Later productionization step |
| Durable replay/retry/deduplication | No | No requirement | Yes before unattended production use |
| Parallel reasoning subagents | No | No requirement | Consider only when workload justifies it |
| Managed long-running agent runtime | No | No | Evaluate if local orchestration becomes burdensome |

The v0.1-mvp goal is deliberately narrow: convert useful semantic-analysis capabilities from `No` to `Yes` without prematurely taking on autonomous coding, merge authority, deployment authority, or production-grade distributed-agent infrastructure.

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


## Why the Agents SDK is an incremental fit

The OpenAI Agents SDK is intended here as a reasoning/tool layer, not as a replacement for the Jagports coordinator architecture.

### Keep

- `GitHubService` and current GitHub collection logic;
- `StateService` and lifecycle comparison;
- `Event` as the internal change contract;
- `LeadAgent` as coordinator;
- `AgentRegistry` as specialist registration/execution boundary;
- `AgentResult` as the normalized specialist output;
- `ReportService` and notification integration;
- GitHub as the durable work and communication record.

### Add or amend

- compact Event payloads before any model call;
- lazy Issue-detail and, later, PR/repository-detail retrieval;
- one model-neutral `ReasoningService`;
- OpenAI Agents SDK inside that reasoning boundary;
- a structured semantic-output schema for the first reasoning specialist;
- selective loading of repository guidance;
- usage/cost recording and bounded model invocation;
- later, narrowly permissioned tools only when a specialist genuinely needs them.

### Replace or retire over time

The existing `services/openai_service.py` is only a thin direct model-call wrapper and is not currently used by the modular runtime. Once an SDK-backed reasoning boundary is implemented and verified, that wrapper can be replaced or retired rather than maintained as a second competing model-integration path.

## Cost-control model

The intended cost model is event-driven and selective:

```text
poll
 |
 +--> no meaningful change
 |       |
 |       +--> no LLM call
 |
 +--> changed work item
         |
         +--> deterministic relevance filter
                 |
                 +--> irrelevant --> no LLM call
                 |
                 +--> relevant
                         |
                         +--> fetch compact context
                         +--> invoke one specialist
                         +--> record actual usage/cost
```

The SDK itself should not be treated as a reason to send every Issue to every specialist. Cost control comes primarily from the existing deterministic architecture, compact events, lazy retrieval, selective specialist invocation, and measured API use.

The roadmap intentionally avoids hard-coding model names or prices because those are operational choices that may change. Initial experimentation should use the lowest-cost model that reliably satisfies the specialist task, with escalation to a stronger model only for demonstrably harder work.

## v0.1-mvp success criteria

The minimum reasoning increment should be considered successful when all of the following are demonstrated:

- one specialist receives only the changed work item and relevant repository guidance;
- the specialist makes a semantic relevance decision rather than relying only on lifecycle state;
- the result is returned through the existing `AgentResult` contract;
- the result includes an explanation sufficient for human review;
- a no-change or irrelevant-change run causes no model call;
- token/API usage for each reasoning run is observable;
- failures in the reasoning call do not corrupt persistent coordinator state;
- no autonomous merge, deployment, or unrestricted repository-write capability is introduced;
- the existing GitHub-centered governance and review gates remain unchanged.

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

## Standalone OpenAI API smoke test

The Raspberry Pi operator has confirmed that a **direct OpenAI Responses API call succeeded** in the existing Python virtual environment. To repeat this minimal API test without starting the full agent:

```bash
cd ~/jagports-lead-agent
source venv/bin/activate
python -c 'from dotenv import load_dotenv; from openai import OpenAI; load_dotenv(); r=OpenAI().responses.create(model="gpt-5.6", input="Reply with exactly: JAGPORTS API TEST OK"); print(r.output_text)'
```

Expected output:

```text
JAGPORTS API TEST OK
```

The operator reported this exact output from the `codex` account on the Raspberry Pi. It verifies that the local virtual environment, `python-dotenv` loading of the configured API key, OpenAI Python client, selected model access and a billable Responses API request worked together **at test time**. Run this only with authorized API usage/billing; do not echo or commit the API key.

**Scope of evidence:** This is a standalone direct API test, **not** an end-to-end `LeadAgent`, OpenAI Agents SDK, specialist reasoning, GitHub integration, notification, or unattended timer test. The current `main.py` does not invoke `services/openai_service.py`, and `openai.enabled: false` remains the repository configuration. The planned v0.1-mvp SDK integration requires a separately implemented and tested reasoning service and one model-backed specialist.

The intended timer interval is every **9 hours and 45 minutes**, but this API test does not verify that the Raspberry Pi timer has been activated or that a scheduled agent run succeeded. Verify live scheduler state and service logs separately; do not confuse a successful manual request with scheduled execution.

## Governance boundary

GitHub remains the durable system of record. Repository workflow, review, testing, approval, and merge rules remain authoritative regardless of which model provider may later be connected.

Related work:

- Issue #49 — P12 Expand and govern the agent team
- PR #595 — Lead Agent setup and modular agent runtime documentation
- `5-Implementation-Projects/Jagports_AI_OS_Lead_Agent_Setup.md` — detailed prototype history and setup record
