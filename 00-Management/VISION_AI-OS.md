# Jagports AI OS Vision

## Purpose

Jagports AI OS is the operating model for coordinating human decisions, AI-assisted work, engineering execution, durable knowledge, and project control around Jagports.

Its purpose is to let a small organization use multiple AI capabilities as a coherent, recoverable team without making private chat context, one specific model, or one automation runtime the system of record.

This document defines product/operating vision. It does **not** define workflow states, permissions, review gates, or implementation procedures. Those remain in their existing authoritative documents.

## Vision statement

**Build a GitHub-centered, human-governed AI operating system that turns research, decisions, implementation, validation, and reusable knowledge into traceable project outcomes while minimizing recurring cost and dependence on any single agent, chat, runtime, or vendor.**

## Intended outcomes

Jagports AI OS should make it possible to:

- recover ongoing work from GitHub and repository knowledge even when a chat, model, or individual agent is unavailable;
- divide work among specialized agent roles when that improves quality or throughput without creating unnecessary coordination overhead;
- move from evidence and research to decisions and implementation through explicit, inspectable records;
- preserve Product Owner authority over consequential product, architecture, cost, security, data, and governance decisions;
- automate repetitive deterministic work where automation is reliable and economical;
- use AI reasoning where it adds value rather than sending all project state indiscriminately to a model;
- keep code, documentation, decisions, tests, Issues, Pull Requests, and durable knowledge mutually traceable;
- support both interactive human/AI work and progressively more autonomous scheduled or event-driven coordination within defined governance boundaries.

## Operating model

The durable operating model is centered on GitHub:

```text
Human / Product Owner
        │
        ▼
GitHub Issues / Project / Repository
        │
        ├── durable work and communication record
        ├── code and documentation
        ├── decisions and evidence
        └── reusable knowledge
        │
        ▼
Lead/coordinator capability
        │
        ├── deterministic routing/filtering where possible
        ├── specialist agents where justified
        ├── Codex/engineering execution
        └── notifications / scheduled or event-driven automation
```

Coordinator and specialist runtimes are replaceable implementation components. They must not become a competing source of project truth.

## Core principles

### 1. GitHub is the durable system of record

Critical project state, decisions, implementation traceability, review evidence, and durable knowledge must remain recoverable from GitHub and repository documentation rather than existing only in private agent context.

### 2. Human authority remains explicit

AI agents may research, prepare, implement, test, organize, and automate work within their authorized scope. Consequential decisions remain subject to the established human decision and review model.

Technical capability does not imply governance authority. An agent or automation that can write, merge, deploy, or mutate state is still constrained by the project rules governing when those actions are allowed.

### 3. Durable memory is repository knowledge, not conversation memory

Reusable findings are generalized into the appropriate repository knowledge scope. Chronological work history remains in Issues, Pull Requests, research records, and other task-specific evidence.

A fresh agent should be able to reconstruct relevant context from repository sources without depending on access to earlier conversations.

### 4. Deterministic work before expensive reasoning

Prefer deterministic discovery, filtering, validation, routing, and state handling before invoking LLM reasoning. Agents should receive the smallest useful context and retrieve deeper information only when required.

This reduces cost, token usage, noise, and the risk of unrelated context influencing execution.

### 5. Specialist agents exist for useful responsibility boundaries

Add or split agent roles when workload, expertise, risk isolation, or independent validation justifies the separation. Do not create agents merely to mirror an organizational chart.

Specialists should remain independently testable, and failure in one specialist should not corrupt coordinator state or silently block unrelated work.

### 6. Automation is subordinate to project governance

Scheduled polling, GitHub Actions, webhooks, local services, and coordinator runtimes may execute or accelerate the workflow, but they do not redefine it.

Important automated results must remain traceable and verifiable through the authoritative project records.

### 7. Capability limitations are explicit

The system must distinguish account authorization, tool capability, implementation failure, and genuine project blockage. An unavailable agent operation must not be converted into an unverified claim of success or an automatic conclusion that the project itself is blocked.

## Cost and infrastructure constraint

The baseline architectural constraint is to avoid recurring-cost dependencies where existing hardware, GitHub capabilities, free service tiers, and open-source software can satisfy the requirement.

The project therefore prefers:

- existing GitHub capabilities before additional coordination platforms;
- existing/self-hosted hardware where practical for persistent services and experimentation;
- open-source components and replaceable interfaces;
- deterministic processing before paid model/API calls;
- bounded model context and lazy retrieval rather than full-state prompts.

A recurring-cost dependency may be introduced only through an explicit project decision when its value justifies departing from the baseline $0 operating target.

## Infrastructure direction

The infrastructure should remain modular:

- GitHub holds the authoritative repository/work records;
- cloud or self-hosted runtimes may provide application execution, scheduled services, databases, notifications, and agent coordination;
- a Raspberry Pi or similar local host may provide low-cost persistent services where useful;
- external AI/model providers should remain replaceable where feasible;
- important state required for recovery must not exist only inside one local runtime.

## Knowledge and decision boundary

The AI OS distinguishes:

```text
WORK RECORDS        DURABLE KNOWLEDGE       DECISIONS / AUTHORITY
Issues / PRs        KNOWLEDGE.md hierarchy Decision records
Tests / reviews     generalized findings   approved constraints
Research evidence   reusable principles    explicit human choices
```

These categories may reference each other but should not be collapsed into one chronological knowledge file.

## Non-goals

Jagports AI OS is not intended to:

- replace Product Owner authority with autonomous agent voting or model preference;
- create a second workflow authority beside `00-Management/WORKFLOWS.md`;
- make a coordinator service, chat platform, notification channel, or local database the project system of record;
- maximize the number of agents or model calls;
- grant autonomous merge/deploy authority merely because an integration technically supports it;
- preserve temporary implementation history as permanent knowledge;
- require a particular AI vendor or model for the long-term architecture.

## Relationship to current implementation

Current implementation, sequencing, priority, dependencies, and completion state are tracked through GitHub Issues and Projects. Repository documents retain durable vision, rules, specifications, decisions, and reusable knowledge rather than a duplicate live task plan.

The current self-hosted Lead Agent and specialist-agent prototypes are implementation experiments toward this vision. Their present architecture is not itself the vision and may change as reliability, operating cost, capability boundaries, and maintainability are validated.

## Success direction

The AI OS is successful when Jagports can repeatedly move from an idea or observed problem to evidence, decision, implementation, review, validation, and durable learning with minimal lost context and minimal manual coordination overhead, while preserving human control and a clear auditable record.
