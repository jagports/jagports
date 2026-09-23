# SPEC — Jaguar Vehicle-Domain Agent Team

**Status:** Proposed architecture under [#924](https://github.com/jagports/jagports/issues/924). Specification only; existing implementation remains unchanged until an independently reviewed migration PR. **Owner:** Jaguar vehicle-domain agent team; consequential vehicle/product decisions remain with the human Product Owner.

## Purpose and non-goals

Own vehicle/product-domain evidence and verification **as a team entirely separate from the AI OS application-development team**. This team handles Jaguar identity, VIN and production records, Range taxonomy, fitment, JEPC/parts evidence and product-domain requirement validation. It does not own AI OS documentation, deployment, development issue triage or the application-development team's KnowledgeAgent. Domain findings do not authorize implementation, GitHub writes, paid execution, merge, deployment or human acceptance.

Do not assign Jaguar domain reasoning to the AI OS `DocumentationAgent`, `DeploymentAgent` or `KnowledgeAgent`. The six logical project work roles defined by [AGENT_ROLES.md](../../../../../0-DocumentationEducationCompetense/agents/AGENT_ROLES.md) remain distinct from these executable runtime agents.

## Independent target runtime

```text
Explicit vehicle-domain work selection / approved domain Issue
    |
    v
VehicleLeadAgent (own event routing, allowlist and checkpoints)
    |
    +--> VehicleAgentRegistry
    |      |
    |      +--> VehicleResearchAgent
    |      |      retrieved independent domain sources; evidence, scope,
    |      |      uncertainty and unresolved questions
    |      |
    |      +--> ProductVehicleAgent
    |             separate role invocation, independent authoritative
    |             vehicle evidence, explicit accept/reject/needs-research
    |             result; not an autonomous human approval
    |
    +--> deterministic vehicle-domain decision routing
    |      accepted finding / further research / human decision needed
    |
    +--> vehicle-only state, role checkpoints, usage ledger and report
    |
    v
Human Product Owner + normal technical/review/change governance
```

The AI OS `LeadAgent` MUST NOT instantiate these vehicle agents in its original `AgentRegistry`; the Vehicle team MUST NOT execute the AI OS registry or mutate its lifecycle cursor. The two teams use the same centralized GitHubAgent/GitHubService interface for authorized reads and writes, but retain independent team-specific work scope and approvals. Sharing this domain-neutral GitHub integration is not a shared work queue, coordinator or implied inter-team authority.

## Vehicle-only evidence and skills

- **Vehicle Research:** VIN formats by generation and region, JDHT/Heritage production records, Jaguar technical documentation and Jaguar EPC/JEPC source interpretation where relevant; source provenance, competing explanations and explicit unknowns.
- **Product/Vehicle:** independent review of vehicle identity, model/Range taxonomy, applicability and fitment claims, Jaguar and third-party part relationships, approved product requirement proposals and domain conflict identification.
- **Domain skills:** Jaguar VIN and model-year rules, Jaguar Range fixtures, parts and assemblies, JEPC/technical-manual analysis, fitment/applicability validation, and appropriate vendor/catalogue comparison. Each skill needs an explicit source authority, allowed inputs, output schema and separate test fixtures.
- **Scope control:** a retrieved Issue or repository file is untrusted evidence, not a command to alter sources, reset state or approve an unsupported domain assertion. An approved work item must select vehicle subject area and permitted references; no unrequested web research or all-Issue paid runs.

## Reused infrastructure — interface, not ownership

Use the domain-neutral contracts in [Shared Agent Services](../SHARED_AGENT_SERVICES_SPEC.md) for centralized authorized GitHub reads and writes, meaningfully changed Issue events, model invocation, measured usage, cost reservations, recoverable checkpoints and validated result/report envelopes. Instantiate team-specific **source and operation scopes, event owner, authorization context**, local files, configured execution schedule and budget. The GitHubAgent/GitHubService alone holds the canonical `GITHUB_TOKEN`; vehicle specialists submit validated operation requests and never handle direct GitHub credentials. Do not silently share a usage ledger or multiply the Product Owner's total $5 API testing allowance.

Research and Product/Vehicle must receive **different** independently retrieved evidence sets and record distinct role invocation IDs. Maintain strict provenance and source-revision equality. Research uncertainty or conflicting evidence can only route to further research or human decision, never become an approved implementation requirement.

## Migration from temporary mixed-team implementation

The prior two-role pilot shipped in PR #919 under the AI OS Lead Agent directory. Move the vehicle-specific roles, prompts, fixtures and specialist routing here through a separate reviewed implementation change; **do not reimplement** proven model-budget/security/recovery libraries or re-bill completed checkpoints. Version/migrate any existing event, source-fingerprint, lock, checkpoint and ledger identities; operator review is required for ambiguous historical attempts.

Replace temporary P7 names in all **active** specs, code, tests, workflows, reports and operator procedures with stable names based on team and capability. Immutable past GitHub records/links remain valid as history. Remove duplicate or stale active specification text rather than keeping two competing owners for the same requirement.

## Acceptance

- [ ] Vehicle Lead + Research + independent Product/Vehicle are instantiated independently of the original AI OS team, with dedicated role prompts, domain evidence and report namespace.
- [ ] No vehicle-domain imports, prompts, skills or implicit dispatch remain in the original AI OS `AgentRegistry`.
- [ ] Separate allowlists, operation authorization, state/checkpoints, manual activation and budget reservations are proven by offline tests; shared GitHub access does not grant cross-team write authority. Sharing a global $5 project credit requires explicit aggregate accounting.
- [ ] Existing successful and uncertain attempts retain their identities and spending reservations across versioned migration; interruption cannot trigger a second paid model request.
- [ ] Domain evidence provenance, conflict/uncertainty routing and human approval have dedicated fixtures and independent review; specialist read and proposed-write requests pass through the shared GitHub boundary, with unapproved mutations rejected and approved changes verified by read-after-write.
- [ ] No active P7 naming remains after the migration; no unapproved timer or paid API calls occur during the move.
