# RULES — Jagports AI OS

## Purpose and Authority

This file defines high-level human governance for Jagports AI OS. The detailed Management workflows are defined **only** in [`00-Management/WORKFLOWS.md`](WORKFLOWS.md).

`WORKFLOWS.md` is the canonical normative source for:

- workflow states and transitions;
- work-request and historical-work discovery;
- Issue/PR reuse and creation decisions;
- Repository Change Gate;
- GitHub Project / Project Item Status verification;
- review, testing, and merge boundaries;
- record integrity and active title changes;
- clarification and authority rules;
- workflow invariants and conflict resolution.

Other documents may explain, implement, or reference those workflows but must not create a competing normative definition.

**Core rule:** A workflow is defined exactly once.

## Governance Principles

### Work ownership

A work request may originate from a human or an agent. The requester and executing actor are separate concepts. Once work identity and scope are resolved and no clarification is required, the executing actor proceeds according to the canonical workflow without unnecessary human confirmation.

### GitHub as system of record

GitHub Issues are the primary work and communication records. GitHub Projects provide the visual representation of workflow state through each Issue's **Project Item Status**.

A Project Item's Status is not a property of the Project itself. Project operations must be verified after mutation before success is claimed.

### Human review hand-off

When review is required, GitHub's native PR reviewer request/notification is used; no separate "Waiting for Review" PR status is created. See `WORKFLOWS.md` for the implementation flow.

### Record integrity

Closed Issues and merged PRs remain GitHub records and must not have their descriptions or comments modified. Their historical content is not copied into current repository documents merely for archival purposes.

An open Issue or open PR may have its title changed when scope materially changes. GitHub records such changes as `renamed` timeline events, preserving the prior title. Cosmetic title changes should be avoided.

### Traceability

Maintain clear traceability from:

`Work request → Issue → PR → Review → Test → Merge → Issue closure → Project verification`

A PR may legitimately resolve multiple Issues when it genuinely addresses each one and explicit traceability is maintained.

Historical Issues and merged PRs may be referenced when needed to establish traceability or verify prior work, but they are not active work items.

## Document Responsibilities

| Document | Responsibility |
|---|---|
| `00-Management/WORKFLOWS.md` | Canonical normative Management workflows. |
| `00-Management/RULES.md` | Human governance, rationale, and document authority. |
| `SKILL.md` | Machine/agent execution instructions that implement/reference the canonical workflows. |
| `.codex/skills/*` | Specialized operational procedures that reference the canonical workflows. |
| `KNOWLEDGE.md` | Durable knowledge, decisions, and lessons learned; not workflow authority. |

## Conflict Rule

If a secondary document conflicts with `WORKFLOWS.md`, the canonical workflow takes precedence. The secondary document must be corrected rather than treated as an alternative workflow authority.

If a secondary document conflicts with `WORKFLOWS.md`, an Issue must be raised to correct the conflict rather than silently accepting or bypassing the contradiction.

If the canonical workflow itself is ambiguous or internally contradictory, stop the affected decision and obtain the required clarification/decision before proceeding.

## Scope of this file

`RULES.md` intentionally does **not** reproduce the Management decision chart or detailed state-machine rules. Those belong in `WORKFLOWS.md` so that humans and agents use one authoritative definition.
