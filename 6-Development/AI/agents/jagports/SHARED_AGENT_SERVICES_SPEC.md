# SPEC — Domain-Neutral Services for Separate Agent Teams

**Status:** Proposed under [#924](https://github.com/jagports/jagports/issues/924). This is a reusable service contract, **not** a new manager, specialist, registry, combined dispatch process or grant of access. The existing AI OS and future Jaguar vehicle-domain teams remain independent.

## Original boundaries to preserve

The AI OS runtime remains `main.py → GitHubService/GitHubAgent → LeadAgent → StateService/Event → AgentRegistry → DocumentationAgent + DeploymentAgent + KnowledgeAgent → AgentResult[] → ReportService`. Its existing 585-minute systemd user timer remains the scheduling authority. No team inherits another team's schedule, credentials or permissions merely by importing shared code.

## Shared library interfaces

| Capability | Shared contract | Per-team isolation |
|---|---|---|
| GitHub source retrieval | Repository-bound GET-only request guard, bounded Issue detail and approved source reads | Different team-approved Issue/source allowlists and independently selected credential; no implicit write authority |
| Change detection | Versioned compact `ChangedIssueEvent`, `IssueContext`, precise content revision, checksum/integrity-checked pending records | Event ownership and consumption acknowledgement belong to **one named team**; no implicit fan-out of paid work |
| Model reasoning | Replaceable model-neutral JSON provider adapter; separate task-specific instructions supplied by caller | Different team prompts, source authority, explicit enablement, role IDs and per-team deployment config |
| Cost accounting | Durable atomic reservation/finish ledger with cross-process lock, uncertain-call retention, no silent retries; measured usage | Per-team ledgers **plus** an independently enforced shared/global spending allocation when multiple teams draw on the same $5 credit |
| Recovery | Exact event+revision ID, durable role checkpoints, evidence fingerprint, single-run lock, replay without re-invoking completed billable calls | Distinct files, namespaces, ownership, service account permissions and operator runbooks |
| Reporting | Structured `AgentResult`, bounded redacted human-readable report, atomic local persistence before event acknowledgement | Team-specific output paths and clearly attributed provenance; no automatic GitHub or Telegram delivery |
| Security | Treat Issue text and retrieved source as untrusted data; fail closed on incomplete/ambiguous evidence | No cross-team source/decision escalation or delegated GitHub write actions without an approved explicit contract |

Implementing the interface by importing a common Python package is allowed. Configuring one `LeadAgent` to silently run both teams, reusing one role registry, merging their event cursors, using one team's domain prompt in the other, or inheriting an enabled OpenAI flag from the other team is **not** allowed.

## Architecture

```text
GitHub repository + approved source stores
          |
          +------[team A allowed reads]------> AI OS LeadAgent
          |                                   +--> DocumentationAgent
          |                                   +--> DeploymentAgent
          |                                   +--> KnowledgeAgent
          |                                   +--> AI OS state/report
          |
          +------[team B allowed reads]------> VehicleLeadAgent
                                              +--> VehicleResearchAgent
                                              +--> ProductVehicleAgent
                                              +--> Vehicle state/report

Reusable libraries (no specialist registry, no implicit dispatch):
    GET-only GitHub adapter | event/schema and source provenance
    model-neutral reasoning | globally bounded cost allocation
    atomic state, locks and checkpoints | redacted reporting
```

## Activation and budget

An existing OpenAI API pay-as-you-go subscription exists with a Product Owner-authorized **$5 test-credit pool**. The checked-in default `openai.enabled: false` means *runtime disabled by default*, **not** “no API subscription.” Explicit manual/local pilot enablement is separately governed for each team. A single-team $4 local cumulative cap must not automatically become $4 **per team**: once multiple teams can spend, implement a common aggregate allocation/reservation authority or enforce a single active spending team until aggregate accounting is reviewed. Never test exhaustion of paid tokens, GitHub quota or the available $5 pool. No automatic scheduled paid calls as a side effect of this specification.

The existing `jagports-lead-agent` GitHub credential passed authenticated Issue read testing on Raspberry Pi; a dedicated read-only token and independent write-denial verification were deferred. Do not claim credential isolation based solely on application-level GET enforcement. Keep any previous fail-closed credential gates explicit until a separately approved design changes them.

## Migration guarantees

Move and rename the temporary P7-marked pilot APIs/files/config/workflows to permanent team-/service-based names under a separately reviewed implementation. Archive historic links in Issue/PR records; **active** source, docs, tests, YAML, workflow names and user reports must not mention P7 after completion. Before accepting the migration, inventory historical local pending events, paid-attempt ledgers and role checkpoints. Preserve uncertain reservations, exact revision identities and source fingerprints; no automatic replay of ambiguous or potentially billed work.

## Acceptance

- [ ] Both teams can be instantiated and offline-tested independently with the same shared library contracts and different configuration/state namespaces.
- [ ] No hidden shared scheduler, coordinator, registry, Issue cursor, credential scope, work queue, model activation or duplicated $5 spending allocation.
- [ ] Offline regressions cover replay after report failure, uncertain attempt retention, cross-team source isolation, model-disabled defaults and no autonomous GitHub writes.
- [ ] Active temporary P7 names have permanent replacements and versioned migration paths.
