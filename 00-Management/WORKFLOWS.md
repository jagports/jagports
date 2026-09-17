# Management Workflows — Jagports AI OS

## Authority

This file is the **top-level canonical normative source** for Jagports Management workflows.

It defines workflow states, transitions, decision precedence, gates, invariants, Issue/PR discovery and historical-work handling, review boundaries, record-integrity rules, and the boundaries between general Management workflow and scoped workflow documents.

Project/Kanban-specific workflow behavior is defined in `6-Development/github/Projects/WORKFLOWS_GITHUB_PROJECT.md` and is incorporated here by reference.

Other documents may explain, implement, or reference these workflows, but must not independently redefine them:

- `6-Development/github/Projects/WORKFLOWS_GITHUB_PROJECT.md` — incorporated by reference for GitHub Project/Kanban workflow behavior.
- `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` — current ChatGPT/GitHub Project capability boundary.
- `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` — GitHub connection and environment knowledge.
- `00-Management/RULES.md` — human-readable governance and rationale.
- `SKILL.md` — machine/agent execution instructions.
- `.codex/skills/*` — specialized operational instructions.
- `KNOWLEDGE.md` — durable knowledge, decisions, and lessons learned.

**Core rule:** A workflow is defined exactly once. Scoped workflow files may own delegated detail only when this file explicitly incorporates them by reference.

---

## 1. Controlled Workflow States

The normal Management lifecycle is:

`BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → IMPLEMENTATION → REVIEW → TESTING → DONE`

`BLOCKED` may be entered from any state when a required prerequisite prevents progress. The previous state must remain identifiable in the task record.

Project/Kanban state representation, Project Item Status behavior, Pull Request Project Item behavior, and Product Owner Project rulings are delegated to `6-Development/github/Projects/WORKFLOWS_GITHUB_PROJECT.md`.

---

## 2. Work-Request Discovery and Historical Precedence

This workflow applies regardless of whether the requester or executor is a human or an agent.

**Explicit reference → OPEN active search → HISTORICAL CLOSED/MERGED search → verify claimed result → valid = no duplicate / insufficient or obsolete = active work / uncertain = clarification → only then create new work.**

Rules:

1. If an Issue/PR is explicitly supplied, validate it and use it as the starting work identity unless it is invalid or the requested scope is incompatible.
2. Without an explicit reference, initially treat the request as potentially novel; do not immediately create work.
3. Search **open Issues** first.
4. Reuse an open Issue when it clearly covers the request.
5. Reuse a related open Issue when the request is a legitimate amendment, extension, refinement, follow-up, or completion.
6. If duplication, scope, ownership, authority, or relationship is uncertain, obtain clarification before proceeding.
7. If no suitable open Issue exists, search **closed Issues** for exact/materially similar historical work before creating an active Issue.
8. Closed Issues are GitHub history and evidence, not active work items.
9. If historical implementation still satisfies the request, do not create duplicate active work.
10. If historical implementation is insufficient, obsolete, superseded, broken, or otherwise does not satisfy the request, create or reuse active work.
11. If historical sufficiency is uncertain, obtain clarification.
12. After Issue identity and scope are resolved, search **open PRs** before creating a PR.
13. Reuse an open PR when it clearly implements the work or can legitimately be extended without ambiguous scope.
14. If no suitable open PR exists, search **merged PRs** for exact/materially similar historical implementation.
15. If a merged implementation still satisfies the request, do not create duplicate implementation work.
16. If the merged implementation is insufficient, obsolete, superseded, broken, or otherwise inadequate, create/reuse an active PR through the normal change gate.
17. One PR may legitimately resolve multiple Issues when it genuinely addresses each Issue and explicit traceability is maintained.
18. Once identity and scope are resolved and no clarification remains, the executor proceeds automatically; routine work does not require unnecessary human confirmation.

---

## 3. Repository Change Gate

Every repository modification follows:

**Issue → dedicated branch → implementation → PR → review → testing → approval/merge → post-merge verification → Issue closure → DONE**

Requirements:

1. A suitable Issue must exist before repository modification.
2. Work occurs on a dedicated branch; never modify `main` directly.
3. A PR is the integration path.
4. The PR must explicitly trace to every Issue it implements/resolves.
5. Required Project/Kanban behavior is governed by `6-Development/github/Projects/WORKFLOWS_GITHUB_PROJECT.md`.
6. Current ChatGPT/GitHub Project capability limits are governed by `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.
7. Required review and testing gates must pass before merge.
8. The executor must stop at the review boundary when review is required.
9. No actor may merge merely because GitHub reports a PR as mergeable.
10. After merge, verify repository, PR, Issue, review, testing, and other available evidence. Do not claim unavailable Project evidence.

A direct-main change is a process violation and requires corrective handling rather than acceptance as normal work.

---

## 4. GitHub Project / Kanban workflow reference

Project/Kanban-specific workflow rules are defined in **`6-Development/github/Projects/WORKFLOWS_GITHUB_PROJECT.md`**, incorporated by reference.

Current ChatGPT/GitHub Project capability limits are defined in **`6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`**.

Do not duplicate those rules in this file.

---

## 5. Review, Testing, Acceptance, and Merge Boundary

When review is required, use GitHub's native pull-request review mechanism as the hand-off mechanism. Do **not** invent a separate GitHub PR status such as "Waiting for Review".

The formal reviewer must be independent of both the PR author and the executing actor. A PR author/executor may perform a private self-check before hand-off, but must not submit the formal GitHub review on that PR.

Before final approval, every applicable Issue Acceptance checkbox and every required PR checklist checkbox must be `[x]`. Checkbox state is not independent approval and does not replace GitHub's formal review state.

GitHub formal review outcomes (`APPROVE`, `REQUEST_CHANGES`, or `COMMENT`) determine the submitted review result. Approval must not be inferred from a notification, discussion comment, reply, implementation change, Resolved Review conversation state, outdated state, checkbox state, or inactivity.

Required human validation follows the approved testing gate:

**Issue Acceptance all `[x]` + PR required checklist all `[x]` + required tests `PASS` + independent review `APPROVED` → merge permitted**

A post-merge test cannot substitute for required pre-merge validation.

`FAIL`, `BLOCKED`, or `NOT TESTED` is not successful validation for a required pre-merge test.

---

## 6. Record Integrity and Active Record Changes

Closed Issues and merged PRs are GitHub records. Their descriptions and comments must not be modified, and their historical content must not be copied into current repository documents merely for archival purposes.

The title of an **open Issue or open PR** may be changed when scope materially changes. GitHub records such a change as a `renamed` event, preserving the previous title.

Title changes are recommended when scope materially changes, including when a PR legitimately expands to resolve multiple Issues. Cosmetic title changes should be avoided.

**Checkbox-state exception:** an executor/agent may edit the description of an **open Issue or open PR solely to check or uncheck existing executor-controlled checkboxes** so that the persistent record reflects objective implementation/readiness state. A formal reviewer may check/uncheck reviewer-controlled boxes and may return an unsupported executor-controlled claim to `[ ]`. The repository/project owner or another explicitly designated human authority may make the same checkbox-only edits when exercising that authority. This exception does not authorize rewriting criterion/checklist text or any other description content.

Closed Issues and merged PRs remain immutable, including titles and checkbox state.

---

## 7. Clarification and Human Authority

Clarification is required only when the workflow cannot safely determine the next action, including uncertainty about:

- duplicate versus materially separate work;
- legitimate amendment/extension versus new work;
- historical result sufficiency;
- PR scope or ownership;
- authority, preference, or approval requiring human judgment.

Do not ask a human merely to advance routine work when the workflow already determines the action.

---

## 8. API and Capability Invariants

- Verify GitHub access and the specific required operation before relying on it.
- Never claim an external action without verification.
- After mutations, perform an independent read/verification.
- Distinguish tool capability, authentication, permission, and operation failure where observable.
- Never expose credentials, tokens, or secret values.

If the required GitHub operation is unavailable, report:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

For the current ChatGPT/GitHub Project capability boundary, use:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

---

## 9. Traceability

Maintain the chain:

`Work request → Issue → PR → Review → Test → Merge → Issue closure → available post-merge verification`

Historical references used to justify active work should be explicitly linked in the active record.

When an active Issue or PR materially changes scope, align its title with the current scope. The title-change and checkbox-state exceptions do not permit unrelated modification of historical descriptions/comments.

---

## 10. Conflict Resolution

If documents disagree about a Management workflow:

1. `00-Management/WORKFLOWS.md` is the top-level normative workflow authority.
2. `6-Development/github/Projects/WORKFLOWS_GITHUB_PROJECT.md` is the scoped Project/Kanban workflow source incorporated by reference from this file.
3. `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` defines the current ChatGPT/GitHub Project capability boundary.
4. `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` contains GitHub connection and environment knowledge.
5. `RULES.md` provides governance/rationale and must reference, not redefine, workflows.
6. `SKILL.md` provides machine execution guidance and must implement/reference, not redefine, workflows.
7. `.codex/skills/*` provides specialized procedures and must reference, not redefine, workflows.
8. `KNOWLEDGE.md` contains durable knowledge, decisions, and lessons learned; not workflow authority.

A conflict in a secondary document is a process defect: raise an Issue to correct it rather than silently accepting or bypassing the contradiction.

If `WORKFLOWS.md` and `WORKFLOWS_GITHUB_PROJECT.md` disagree on a general workflow boundary, `WORKFLOWS.md` controls. Within the delegated Project/Kanban scope, `WORKFLOWS_GITHUB_PROJECT.md` controls the detailed Project behavior.
