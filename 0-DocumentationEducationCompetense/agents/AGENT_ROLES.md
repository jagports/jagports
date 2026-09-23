# Jagports Agent Roles

## Purpose

Defines the six operating roles used across Jagports project work. These are
logical roles, not separate GitHub or AI accounts. Each role currently maps to
an existing account (ChatGPT/Claude conversation, or Codex Web) as noted below.
Splitting a role into its own dedicated account is a future option, not a
current requirement.

Repository: `jagports/jagports`

## Distinction between logical work roles and executable agent teams

These six roles describe Jagports-wide work and human decision responsibilities. They are **not** the Python `AgentRegistry` of one deployed agent service. Under the [two-team architecture proposal](../../6-Development/AI/agents/jagports/SHARED_AGENT_SERVICES_SPEC.md), the original [AI OS development runtime](../../6-Development/AI/agents/jagports/jagports-lead-agent/SPEC_Agent_Lead.md#target-ownership--ai-os-application-development-agent-team-924) retains its existing Lead, Documentation, Deployment and Knowledge agents, focused exclusively on AI OS application development. A **separate** [Jaguar vehicle-domain runtime](../../6-Development/AI/agents/jagports/jagports-vehicle-agent/SPEC_Vehicle_Agent_Team.md) owns vehicle Research and Product/Vehicle execution.

The existing logical Research, Product / Vehicle and other project-work roles below remain valid for human/AI collaboration. They do not authorize the AI OS runtime to instantiate Jaguar-specific agents or silently consume vehicle-domain tasks. Both executable teams follow the same existing Management workflow, without sharing one specialist registry or changing the human Product Owner's authority.

## Authority and workflow sources

This file defines division of labour only. It does not create workflow states,
permissions, approval rights, or a parallel operating model.

Use the current authoritative sources:

- `00-Management/WORKFLOWS.md` — workflow states, transitions, Repository Change Gate, review/testing boundaries, and decision precedence.
- `00-Management/RULES.md` — human governance and authority rationale.
- `0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md` — escalation, decision, acknowledgement, and hand-off communication.
- `0-DocumentationEducationCompetense/KNOWLEDGE_ARCHITECTURE.md` — separation between durable knowledge, research evidence, implementation work, and operating rules.

---

## 1. Team Lead / Chief of Staff

Coordinates the work system, keeps the Kanban operational, decomposes approved
goals into tasks, proposes priority/ordering, identifies dependencies and
risks, and routes decisions to the Product Owner.

Current executor: ChatGPT/Claude conversation acting in this capacity

## 2. Research

Gathers and evaluates source-backed information — JEPC data, SNG catalogues,
JLR Classic Parts, Nimark, JDHT/Heritage records, vendor reconnaissance.
Produces findings with source, scope, and confidence, not final decisions.

Current executor: ChatGPT/Claude conversation acting in this capacity

## 3. Product / Vehicle

Owns domain correctness for Jaguar vehicle identity, Range taxonomy, fitment
logic, and business requirements. Reviews research output for domain accuracy
before it becomes specification.

Current executor: ChatGPT/Claude conversation acting in this capacity, with
Tomi Lind as the human domain authority

## 4. Technical / Architecture

Owns schema and system design decisions — database schema, import pipeline
design, API/service boundaries. Converts approved product requirements into
implementable specification.

Current executor: ChatGPT/Claude conversation acting in this capacity

## 5. Prioritization / Validation

Reviews proposed work against priority rules, checks acceptance criteria
before DONE, and confirms deliverables actually satisfy their task definition.

Where materially important, the Product Owner retains final acceptance and
decision authority under the canonical Management rules.

## 6. Codex Engineering

Executes approved implementation tasks: writes code, runs tests, opens
changes against the repository.

Current executor: Codex Web, connected to `jagports/jagports`

---

## Research-to-specification graduation

Research does not become specification merely because a finding exists. The
role hand-off is:

1. **Research** produces an evidence-backed finding with source, scope,
   confidence, limitations, and a recommended next action. Unresolved evidence
   remains research.
2. **Product / Vehicle** validates the domain meaning and may convert a
   validated finding into a product proposal or requirement. A rejected or
   still-uncertain finding remains research rather than being promoted by
   default.
3. **Prioritization / Validation** applies the existing project prioritization
   path to proposed work. This role does not create a separate P7 scoring or
   approval system.
4. **Team Lead / Chief of Staff** routes only consequential decisions to the
   Product Owner under the current decision gate. Routine authorized work may
   continue without an unnecessary Product Owner decision request.
5. **Product Owner**, where the canonical workflow requires a human decision,
   approves, rejects, or redirects the consequential product direction.
6. **Technical / Architecture** converts approved product requirements into
   implementable specification and records the technical design boundaries,
   dependencies, and risks required for implementation.
7. **Codex Engineering** implements only work that has reached the applicable
   approved implementation state and follows the Repository Change Gate.

Each hand-off must preserve traceability in the relevant GitHub work record so
that evidence, proposal, decision, specification, implementation, review, and
test results can be reconstructed without private agent context.

Repository location follows `KNOWLEDGE_ARCHITECTURE.md`: research evidence and
unresolved investigation remain in `7-Research` or the appropriate research
record; active implementation work belongs in `5-Implementation-Projects` and
GitHub Issues/PRs; durable accepted conclusions belong in the narrowest
appropriate `KNOWLEDGE.md`; implementable specifications belong in the
relevant domain/project SPEC location rather than being treated as raw
research evidence.

## Operating note

No role has authority beyond the current canonical Management workflow and
human governance sources. This file exists to make the division of labour and
research-to-specification hand-off explicit, not to create new authority.

Escalation, decision, state-transition, review, testing, merge, and closure
rules remain governed by `00-Management/WORKFLOWS.md` and the applicable
communication protocol.