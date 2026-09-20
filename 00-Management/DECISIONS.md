# Jagports Decision Log

## Purpose

This file is the persistent cross-project index of consequential Jagports product, architecture, governance, cost, security, data, and operating decisions.

It exists so humans and agents can discover decisions that have already been made without reopening them from private chat history or inferring them from implementation code.

The detailed decision record remains in the linked GitHub Issue, Pull Request, or authoritative repository document. This file is an index and concise current-effect summary; it is not a second workflow authority and does not replace the original decision record.

## Recording rule

Add a decision here when all of the following are true:

- the decision is explicit rather than inferred from inactivity or implementation;
- it materially affects future product, architecture, governance, cost, security, data, or operating behaviour;
- it has a persistent authoritative record that can be linked;
- knowing the decision would prevent future agents from unnecessarily reopening the same question.

Routine implementation choices, temporary troubleshooting, research hypotheses, and unresolved proposals do not belong in this log.

A complete decision record must continue to satisfy the decision-record requirements in `0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md`, including the decision question, context/constraints, options, recommendation/rationale, consequences/risks, explicit human decision, date, and owner.

## Decision work-item template

New human-decision work items use the executable GitHub Issue template:

[`../.github/ISSUE_TEMPLATE/human-decision.md`](../.github/ISSUE_TEMPLATE/human-decision.md)

The executable template is the single source of truth for decision-Issue fields. `0-DocumentationEducationCompetense/work-item-templates/README.md` owns the template-selection policy and map.

Do not copy the template body into this log. After an explicit decision is made, this log records only the concise decision/current effect and links to the authoritative work record.

## Supersession and history

Do not erase an old decision when it is superseded.

Instead:

1. add the new decision as a later entry;
2. link the earlier authoritative record;
3. state the resulting current effect; and
4. make the supersession relationship explicit in the new record and, where appropriate, in the originating work record.

The chronological history remains useful evidence. Repository knowledge files may contain the generalized current rule, while this decision log preserves traceability to the decision history.

## Initial verified decision index

This initial backfill contains foundational decisions whose current authority and decision evidence are clear from the repository. It is intentionally not an attempted reconstruction of every historical choice. Omission from this initial index does not invalidate an otherwise authoritative recorded decision.

| Date | Scope | Decision / current effect | Decision owner | Authoritative record |
|---|---|---|---|---|
| 2026-08-31 | AI OS communication and authority | GitHub Issues are the primary persistent work/communication record; consequential choices use an explicit Product Owner decision gate; hand-offs and escalations must remain recoverable from GitHub. | Product Owner | [PR #69 — Implement P3 agent communication protocol](https://github.com/jagports/jagports/pull/69), `0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md` |
| 2026-09-02 | Management workflow authority | `00-Management/WORKFLOWS.md` is the single canonical normative Management workflow source. Governance and execution documents reference it rather than defining competing workflow rules. | Product Owner | [PR #295 — Centralize Management workflows and Issue/PR discovery](https://github.com/jagports/jagports/pull/295), `00-Management/WORKFLOWS.md` |
| 2026-09-04 | Repository knowledge architecture | The repository uses one canonical nine-domain first-level semantic map and hierarchical scoped knowledge. Chronological work history remains in Issues/PRs and decision records rather than general `KNOWLEDGE.md` files. | Product Owner | [Issue #23 — Create repository knowledge structure](https://github.com/jagports/jagports/issues/23), [PR #388 — Validate and normalize knowledge architecture](https://github.com/jagports/jagports/pull/388), `0-DocumentationEducationCompetense/KNOWLEDGE_ARCHITECTURE.md` |
| 2026-09-16 | Jagports AI OS vision and constraints | Jagports AI OS is GitHub-centered and human-governed; durable work must remain recoverable outside private chat/model context; deterministic processing is preferred before expensive model reasoning; avoiding recurring-cost dependencies is the baseline architectural constraint unless explicitly changed. | Product Owner | [Issue #24 — Record product vision and constraints](https://github.com/jagports/jagports/issues/24), [PR #704 — Add AI OS and VIEPS vision documents](https://github.com/jagports/jagports/pull/704), `00-Management/VISION_AI-OS.md` |
| 2026-09-16 | VIEPS product direction | VIEPS uses canonical PART/reference knowledge with evidence-backed applicability and explicit unknown/unavailable states; mutable STOCK remains separate; infrastructure and stock providers are replaceable behind stable domain boundaries; long-term direction includes multiple providers/sellers and later multi-tenant white-label delivery without forking canonical Jaguar knowledge. | Product Owner | [Issue #670 — VIEPS Product roadmap](https://github.com/jagports/jagports/issues/670), [PR #704 — Add AI OS and VIEPS vision documents](https://github.com/jagports/jagports/pull/704), `00-Management/VISION_VIEPS.md` |

## How future agents use this log

Before reopening a consequential question:

1. inspect this log for a matching decision;
2. follow the linked authoritative record;
3. verify whether the decision still applies to the current scope;
4. if it still applies, use it rather than reopening the question;
5. if new evidence or changed constraints justify reconsideration, create/reuse the appropriate decision work record and preserve the supersession history.

Do not treat this index as proof that an implementation is complete. Decision state, implementation state, review state, deployment state, and verification state remain separate concepts.