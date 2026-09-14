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

### Review authority

Reviewer-owned review concerns remain under that reviewer's resolution authority whether they are raised through visible PR discussion before formal review submission or through comments associated with a submitted review. Executors, PR authors, and other non-reviewers must not resolve those concerns on the reviewer's behalf. A repository/project owner or other explicitly designated human authority may resolve them only under the human-authority exception defined in `WORKFLOWS.md`.

A GitHub `PENDING` review is a reviewer-private draft until submission. Line-level and file-level comments created through the normal pending-review flow remain private until submission; their line/file anchoring alone does not make them immediately visible. When reviewer↔maker interaction is required before the formal review outcome, use an immediately visible channel defined by `WORKFLOWS.md`: a standalone submitted PR review comment when direct anchored submission is supported, otherwise a top-level PR Conversation comment with explicit file/line links. A discussion becoming `outdated` because the referenced diff changed is not by itself acceptance or semantic resolution of the underlying concern.

### Record integrity

Closed Issues and merged PRs remain GitHub records and must not have their descriptions or comments modified. Their historical content is not copied into current repository documents merely for archival purposes.

New information should normally be recorded chronologically as a new Issue or PR comment rather than by rewriting existing historical narrative. The current PR-creation traceability exception permits `Will Be Fixed By #<PR>` to be added to a still-open implementing Issue, with the same reference also recorded as a new Issue comment. The detailed conditions and workflow handling for this exception are governed by `WORKFLOWS.md`.

An open Issue or open PR may have its title changed when scope materially changes. GitHub records such changes as `renamed` timeline events, preserving the prior title. Cosmetic title changes should be avoided.

### Traceability

Maintain clear traceability from:

`Work request → Issue → PR → Review → Test → Merge → Issue closure → Project verification`

A PR may legitimately resolve multiple Issues when it genuinely addresses each Issue and explicit traceability is maintained.

Historical Issues and merged PRs may be referenced when needed to establish traceability or verify prior work, but they are not active work items.

## External References / Source of Truth

GitHub provides the technical capabilities and collaboration mechanisms used by the project, but those capabilities do not replace Jagports Management rules.

The following official GitHub documentation is the external technical reference for the relevant GitHub behavior:

- [Managing disruptive comments](https://docs.github.com/en/communities/moderating-comments-and-conversations/managing-disruptive-comments)
- [Tracking changes in a comment](https://docs.github.com/en/communities/moderating-comments-and-conversations/tracking-changes-in-a-comment)
- [Commenting on a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/commenting-on-a-pull-request)
- [Reviewing proposed changes in a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request)

These references describe GitHub's technical capabilities and collaboration model. They do **not** replace or override Jagports Management rules; `00-Management/RULES.md` remains the project's human governance authority, while `00-Management/WORKFLOWS.md` remains the canonical normative workflow authority.

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
