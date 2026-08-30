# Jagports Agent Roles

## Purpose

Defines the six operating roles used across Jagports project work. These are
logical roles, not separate GitHub or AI accounts. Each role currently maps to
an existing account (ChatGPT/Claude conversation, or Codex Web) as noted below.
Splitting a role into its own dedicated account is a future option, not a
current requirement.

Repository: `tlindi/jagports`

---

## 1. Team Lead / Chief of Staff

Coordinates the work system, keeps the Kanban operational, decomposes approved
goals into tasks, proposes priority/ordering, identifies dependencies and
risks, and routes decisions to the Product Owner.

Maps to: `KANBAN_OPERATING_RULES.md` — "Team Lead Agent"
Current executor: ChatGPT/Claude conversation acting in this capacity

## 2. Research

Gathers and evaluates source-backed information — JEPC data, SNG catalogues,
JLR Classic Parts, Nimark, JDHT/Heritage records, vendor reconnaissance.
Produces findings with source, scope, and confidence, not final decisions.

Maps to: `KANBAN_OPERATING_RULES.md` — "Specialist Agent" (research scope)
Current executor: ChatGPT/Claude conversation acting in this capacity

## 3. Product / Vehicle

Owns domain correctness for Jaguar vehicle identity, Range taxonomy, fitment
logic, and business requirements. Reviews research output for domain accuracy
before it becomes specification.

Maps to: "Specialist Agent" (product/domain scope)
Current executor: ChatGPT/Claude conversation acting in this capacity, with
Tomi Lind as the human domain authority

## 4. Technical / Architecture

Owns schema and system design decisions — database schema, import pipeline
design, API/service boundaries. Converts approved product requirements into
implementable specification.

Maps to: "Specialist Agent" (architecture scope)
Current executor: ChatGPT/Claude conversation acting in this capacity

## 5. Prioritization / Validation

Reviews proposed work against priority rules, checks acceptance criteria
before DONE, and confirms deliverables actually satisfy their task definition.

Maps to: "Team Lead Agent" (review/validation function) and, where
materially important, the Product Owner's own final acceptance authority

## 6. Codex Engineering

Executes approved implementation tasks: writes code, runs tests, opens
changes against the repository.

Maps to: `KANBAN_OPERATING_RULES.md` — "Specialist Agent" (execution scope)
Current executor: Codex Web, connected to `tlindi/jagports`

---

## Operating note

No role has authority beyond what `KANBAN_OPERATING_RULES.md` §1 already
grants its mapped Kanban role. This file exists to make the *division of
labor* explicit, not to create new authority. The Product Owner (Tomi Lind)
retains final authority per the existing rules regardless of which logical
role proposed or executed a piece of work.

Escalation, decision, and state-transition rules are unchanged — see
`KANBAN_OPERATING_RULES.md`.