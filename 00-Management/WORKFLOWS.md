# Management Workflows — Jagports AI OS

## Authority

This file is the **top-level canonical normative source** for Jagports Management workflows.

It defines the Management workflow state machine, transition order, decision precedence, gates, invariants, and conflict handling.

GitHub-specific execution of these workflows is defined in the GitHub documentation area:

- `../6-Development/github/GITHUB_OPERATING_RULES.md` — GitHub Issue, Pull Request, review, merge, testing-evidence, record-integrity, and GitHub field/label operating rules.
- `../6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` — GitHub Project/Kanban workflow behavior, Project Item Status meanings, Project lifecycle evidence rules, and Product Owner Project rulings.
- `../6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` — current ChatGPT/GitHub Project capability boundary.
- `../6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` — GitHub connection capability and environment knowledge.

Other documents may explain, implement, or reference these workflows, but must not independently redefine them:

- `00-Management/RULES.md` — human-readable governance and rationale.
- `0-DocumentationEducationCompetense/SKILL.md` — machine/agent execution instructions.
- `.codex/skills/*` — specialized operational instructions.
- `KNOWLEDGE.md` — durable knowledge, decisions, and lessons learned.

**Core rule:** A workflow is defined exactly once. Scoped workflow files may own delegated detail only when this file explicitly incorporates them by reference.

---

## 1. Controlled Workflow States

The normal Management lifecycle is:

`BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → IMPLEMENTATION → REVIEW → TESTING → DONE`

`BLOCKED` may be entered from any state when a required prerequisite prevents progress. The previous state must remain identifiable in the task record.

Project/Kanban state representation, Project Item Status behavior, Pull Request Project Item behavior, Product Owner Project rulings, and Project/Kanban state meanings are delegated to `../6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`.

---

## 2. Work-Request Discovery and Historical Precedence

This workflow applies regardless of whether the requester or executor is a human or an agent.

**Explicit reference → OPEN active search → HISTORICAL CLOSED/MERGED search → verify claimed result → valid = no duplicate / insufficient or obsolete = active work / uncertain = clarification → only then create new work.**

Rules:

1. If an explicit work record or implementation record is supplied, validate it and use it as the starting work identity unless it is invalid or the requested scope is incompatible.
2. Without an explicit reference, initially treat the request as potentially novel; do not immediately create work.
3. Search active work first.
4. Reuse active work when it clearly covers the request.
5. Reuse related active work when the request is a legitimate amendment, extension, refinement, follow-up, or completion.
6. If duplication, scope, ownership, authority, or relationship is uncertain, obtain clarification before proceeding.
7. If no suitable active work exists, search historical completed/closed work for exact/materially similar work before creating new active work.
8. Historical records are evidence, not active work items.
9. If historical implementation still satisfies the request, do not create duplicate active work.
10. If historical implementation is insufficient, obsolete, superseded, broken, or otherwise does not satisfy the request, create or reuse active work.
11. If historical sufficiency is uncertain, obtain clarification.
12. After work identity and scope are resolved, search active implementation records before creating new implementation work.
13. Reuse active implementation when it clearly implements the work or can legitimately be extended without ambiguous scope.
14. If no suitable active implementation exists, search historical implementation for exact/materially similar implementation.
15. If historical implementation still satisfies the request, do not create duplicate implementation work.
16. If historical implementation is insufficient, obsolete, superseded, broken, or otherwise inadequate, create/reuse active implementation through the normal change gate.
17. One implementation may legitimately resolve multiple work records when it genuinely addresses each scope and explicit traceability is maintained.
18. Once identity and scope are resolved and no clarification remains, the executor proceeds automatically; routine work does not require unnecessary human confirmation.

GitHub-specific Issue/PR search, traceability, closing syntax, review comments, and record operation rules are defined in `../6-Development/github/GITHUB_OPERATING_RULES.md`.

---

## 3. Repository Change Gate

Every repository modification follows:

**Work record → dedicated branch → implementation → integration record → review → testing → approval/merge → post-merge verification → work closure → DONE**

Requirements:

1. A suitable work record must exist before repository modification.
2. Work occurs on a dedicated branch; never modify `main` directly.
3. A Pull Request is the normal GitHub integration path; detailed GitHub PR rules are governed by `../6-Development/github/GITHUB_OPERATING_RULES.md`.
4. The integration record must explicitly trace to every work record it implements/resolves.
5. Required Project/Kanban behavior is governed by `../6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`.
6. Current ChatGPT/GitHub Project capability limits are governed by `../6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.
7. Required review and testing gates must pass before merge.
8. The executor must stop at the review boundary when review is required.
9. No actor may merge merely because a repository host reports an integration record as mergeable.
10. After merge, verify repository state, integration state, work-record state, review evidence, testing evidence, and other available evidence. Do not claim unavailable Project evidence.

A direct-main change is a process violation and requires corrective handling rather than acceptance as normal work.

---

## 4. Review, Testing, Acceptance, and Merge Boundary

Required human validation follows the approved testing gate:

**Acceptance all `[x]` + required integration checklist all `[x]` + required tests `PASS` + independent review `APPROVED` → merge permitted**

A post-merge test cannot substitute for required pre-merge validation.

`FAIL`, `BLOCKED`, or `NOT TESTED` is not successful validation for a required pre-merge test.

Detailed GitHub checkbox handling, review hand-off, review conversation terminology, formal review rules, mandatory pre-merge review checks, and merge-operation rules are defined in `../6-Development/github/GITHUB_OPERATING_RULES.md`.

---

## 5. Record Integrity and Active Record Changes

Closed/completed work records and merged implementation records are historical records. Their descriptions and comments must not be modified, and their historical content must not be copied into current repository documents merely for archival purposes.

The title of an open work record or implementation record may be changed when scope materially changes and the host preserves the previous title in event history. Cosmetic title changes should be avoided.

**Checkbox-state exception:** an executor/agent may edit the description of an open work record or implementation record solely to check or uncheck existing executor-controlled checkboxes so that the persistent record reflects objective implementation/readiness state. A formal reviewer may check/uncheck reviewer-controlled boxes and may return an unsupported executor-controlled claim to `[ ]`. The repository/project owner or another explicitly designated human authority may make the same checkbox-only edits when exercising that authority. This exception does not authorize rewriting criterion/checklist text or any other description content.

Detailed GitHub record-integrity execution rules are defined in `../6-Development/github/GITHUB_OPERATING_RULES.md`.

---

## 6. Clarification and Human Authority

Clarification is required only when the workflow cannot safely determine the next action, including uncertainty about:

- duplicate versus materially separate work;
- legitimate amendment/extension versus new work;
- historical result sufficiency;
- implementation scope or ownership;
- authority, preference, or approval requiring human judgment.

Do not ask a human merely to advance routine work when the workflow already determines the action.

---

## 7. API and Capability Invariants

- Verify access and the specific required operation before relying on it.
- Never claim an external action without verification.
- After supported mutations, perform an independent read/verification.
- Distinguish tool capability, authentication, permission, and operation failure where observable.
- Never expose credentials, tokens, or secret values.

If the required GitHub operation is unavailable, the GitHub-specific alert/handling is defined in `../6-Development/github/GITHUB_OPERATING_RULES.md` and applicable agent instructions.

For the current ChatGPT/GitHub Project capability boundary, use:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

---

## 8. Traceability

Maintain the chain:

`Work request → work record → implementation record → Review → Test → Merge → work closure → available post-merge verification`

Historical references used to justify active work should be explicitly linked in the active record.

When active work materially changes scope, align its title with the current scope. The title-change and checkbox-state exceptions do not permit unrelated modification of historical descriptions/comments.

Detailed GitHub traceability syntax and multi-Issue closing rules are defined in `../6-Development/github/GITHUB_OPERATING_RULES.md`.

---

## 9. Conflict Resolution

If documents disagree about a Management workflow:

1. `00-Management/WORKFLOWS.md` is the top-level normative workflow authority.
2. `6-Development/github/GITHUB_OPERATING_RULES.md` is the GitHub-specific operating-rule source for Issues, Pull Requests, reviews, merge handling, testing evidence, record integrity, and GitHub fields/labels.
3. `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` is the scoped Project/Kanban workflow source incorporated by reference from this file.
4. `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` defines the current ChatGPT/GitHub Project capability boundary.
5. `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` contains GitHub connection and environment knowledge.
6. `00-Management/RULES.md` provides governance/rationale and must reference, not redefine, workflows.
7. `0-DocumentationEducationCompetense/SKILL.md` provides machine execution guidance and must implement/reference, not redefine, workflows.
8. `.codex/skills/*` provides specialized procedures and must reference, not redefine, workflows.
9. `KNOWLEDGE.md` contains durable knowledge, decisions, and lessons learned; not workflow authority.

A conflict in a secondary document is a process defect: raise an Issue to correct it rather than silently accepting or bypassing the contradiction.

If `WORKFLOWS.md` and `GITHUB_OPERATING_RULES.md` disagree on a general Management workflow boundary, `WORKFLOWS.md` controls. Within delegated GitHub operation scope, `GITHUB_OPERATING_RULES.md` controls the detailed GitHub handling. Within delegated Project/Kanban scope, `GITHUB_PROJECT_WORKFLOWS.md` controls the detailed Project behavior.

An unresolved contradiction in a canonical workflow source must be treated as a process defect and clarified before relying on the conflicting rule.
