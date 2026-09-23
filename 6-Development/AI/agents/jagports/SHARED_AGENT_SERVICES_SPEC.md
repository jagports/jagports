# SPEC — Domain-Neutral Services for Separate Agent Teams

**Status:** Proposed under [#924](https://github.com/jagports/jagports/issues/924). This is a reusable service contract, **not** a new manager, specialist, registry, combined dispatch process or grant of access. The existing AI OS and future Jaguar vehicle-domain teams remain independent.

## Original boundaries to preserve

The AI OS runtime remains `main.py → GitHubService/GitHubAgent → LeadAgent → StateService/Event → AgentRegistry → DocumentationAgent + DeploymentAgent + KnowledgeAgent → AgentResult[] → ReportService`. Its existing 585-minute systemd user timer remains the scheduling authority. No team inherits another team's schedule, credentials or permissions merely by importing shared code.

## Shared library interfaces

| Capability | Shared contract | Per-team isolation |
|---|---|---|
| GitHub integration | Shared GitHubAgent/GitHubService is the sole API boundary for authenticated reads and authorized writes, with bounded retrieval, request validation and read-after-write checks | Team-specific scope, work-item authorization and immutable audit provenance; one canonical `GITHUB_TOKEN`, not per-specialist GitHub clients or a separate read-only-token requirement |
| Change detection | Versioned compact `ChangedIssueEvent`, `IssueContext`, precise content revision, checksum/integrity-checked pending records | Event ownership and consumption acknowledgement belong to **one named team**; no implicit fan-out of paid work |
| Model reasoning | Replaceable model-neutral JSON provider adapter; separate task-specific instructions supplied by caller | Different team prompts, source authority, explicit enablement, role IDs and per-team deployment config |
| Cost accounting | Durable atomic reservation/finish ledger with cross-process lock, uncertain-call retention, no silent retries; measured usage | Per-team ledgers **plus** an independently enforced shared/global spending allocation when multiple teams draw on the same $5 credit |
| Recovery | Exact event+revision ID, durable role checkpoints, evidence fingerprint, single-run lock, replay without re-invoking completed billable calls | Distinct files, namespaces, ownership, service account permissions and operator runbooks |
| Reporting and Telegram | Structured `AgentResult`, bounded redacted report, durable per-team notification outbox, stable event/result digest key, delivery status and bounded retry | The AI OS team's existing scheduled `main.py` automatically sends eligible digests via the existing Telegram service **after** the team split and centralized GitHub boundary are implemented; the Vehicle team's schedule/delivery is independently authorized and cannot silently join the AI OS run |
| Security | Treat GitHub content and proposed agent actions as untrusted inputs; validate each mutation against the canonical Management workflow, human gates and GitHub permission model | Shared GitHub transport does not grant cross-team work authority; each request declares initiating team/role, target, intended operation, approval evidence and idempotency key |

Implementing the interface by importing a common Python package is allowed. Configuring one `LeadAgent` to silently run both teams, reusing one role registry, merging their event cursors, using one team's domain prompt in the other, or inheriting an enabled OpenAI flag from the other team is **not** allowed.

## Architecture

```text
GitHub repository + approved source stores
          |
          +--> shared GitHubAgent/GitHubService (all authenticated reads and writes)
          |        |-- per-operation authorization + audit + read-after-write
          |        +-- one canonical GITHUB_TOKEN
          |
          +------[team A scoped requests]----> AI OS LeadAgent
          |                                   +--> DocumentationAgent
          |                                   +--> DeploymentAgent
          |                                   +--> KnowledgeAgent
          |                                   +--> AI OS state/report
          |
          +------[team B scoped requests]--> VehicleLeadAgent
                                              +--> VehicleResearchAgent
                                              +--> ProductVehicleAgent
                                              +--> Vehicle state/report

Reusable libraries (no specialist registry, no implicit dispatch):
    central GitHubAgent/GitHubService | scoped request/approval contracts
    event/schema and source provenance
    model-neutral reasoning | globally bounded cost allocation
    atomic state, locks and checkpoints | redacted reporting
```

## Central GitHub operation contract

Specialists send structured read requests or proposed mutation requests through the existing agent communication boundary; the central GitHubAgent/GitHubService performs GitHub API calls. A proposed mutation carries the initiating team/role, target repository and work item, desired action/payload, governing authorization, approval evidence when needed, idempotency key and expected source revision. The service rejects unapproved or out-of-scope requests, applies rate/size limits, executes approved operations, verifies writes through a bounded independent read and returns a durable, redacted result. Internal Python method calls or queue messages may convey routine requests; persistent GitHub Issue/PR records are required for significant hand-offs and decisions, not for every internal API call. No specialist may bypass this boundary by using the credential directly. The original application-development and separate vehicle-domain teams retain independent registries, work queues, decision authority, state and budgets; a shared GitHub API layer is **not** a shared coordinator.

## Automatic delivery boundary

After #924's agent-team separation and shared GitHub-agent implementation, the original AI OS `main.py` must automatically dispatch meaningful authorized results through the **existing** `services/telegram_service.py` sender as part of the existing 585-minute systemd-triggered execution. Do not introduce a new timer, sender implementation in specialist agents, or Telegram handling inside GitHubAgent. Save the report and a durable, team-owned outbox before delivery; bound, deduplicate and independently acknowledge delivery, preserving failed sends for retry without replaying paid reasoning. The Jaguar vehicle team uses the same reusable transport contract only under separately approved scheduling, recipient and delivery configuration. Acceptance requires mocked no-change/success/failure/replay tests plus one real systemd-triggered AI OS run with human-confirmed Telegram receipt and matching local journal/report/outbox evidence. Previously successful manual Telegram tests are reusable regression evidence, **not** proof of scheduled integration.

## Activation and budget

An existing OpenAI API pay-as-you-go subscription exists with a Product Owner-authorized **$5 test-credit pool**. The checked-in default `openai.enabled: false` means *runtime disabled by default*, **not** “no API subscription.” Explicit manual/local pilot enablement is separately governed for each team. A single-team $4 local cumulative cap must not automatically become $4 **per team**: once multiple teams can spend, implement a common aggregate allocation/reservation authority or enforce a single active spending team until aggregate accounting is reviewed. Never test exhaustion of paid tokens, GitHub quota or the available $5 pool. No automatic scheduled paid calls as a side effect of this specification.

Use the existing `GITHUB_TOKEN` as the canonical GitHub runtime credential, exposed only through the shared GitHub boundary. The separate `GITHUB_TOKEN_RO` and `JAGPORTS_READONLY_GITHUB_TOKEN` names, read-only-token creation/verification scripts and credential-confirmation gate are **obsolete** under #924. Do not replace operation-level controls with a blanket ability to write: the GitHub boundary validates authorization before mutation, uses GitHub's actual permission checks, and records auditable outcomes. Prior credential-test evidence remains only in immutable Issue/PR history, not active requirements. Repository-hosted Python modules within one process do not gain security isolation just from being called different agents.

## Migration guarantees

Move and rename the temporary P7-marked pilot APIs/files/config/workflows to permanent team-/service-based names under a separately reviewed implementation. Archive historic links in Issue/PR records; **active** source, docs, tests, YAML, workflow names and user reports must not mention P7 after completion. Before accepting the migration, inventory historical local pending events, paid-attempt ledgers and role checkpoints. Preserve uncertain reservations, exact revision identities and source fingerprints; no automatic replay of ambiguous or potentially billed work.

## Acceptance

- [ ] Both teams can be instantiated and offline-tested independently with the same shared library contracts and different configuration/state namespaces.
- [ ] No hidden shared scheduler, coordinator, registry, Issue cursor, credential scope, work queue, model activation or duplicated $5 spending allocation.
- [ ] Offline regressions cover replay after report failure, uncertain attempt retention, cross-team source isolation, model-disabled defaults and rejection of unapproved GitHub writes at the centralized boundary.
- [ ] Every authenticated GitHub read/write from both agent teams uses the shared GitHubAgent/GitHubService with `GITHUB_TOKEN`; specialists do not instantiate competing GitHub API clients. A mocked specialist mutation request passes through approval checks, audit and read-after-write verification.
- [ ] Remove active RO-token verifier, its dedicated tests and all obsolete RO-token/credential-confirmation references from specs, Python, YAML, workflows, operations and installation instructions, preserving unrelated GET-only transport safeguards and valuable generic retrieval regressions.
- [ ] Active temporary P7 names have permanent replacements and versioned migration paths.
