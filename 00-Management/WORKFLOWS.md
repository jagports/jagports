# Management Workflows — Jagports AI OS

## Authority

This file is the **top-level canonical normative source** for Jagports Management workflows.

It defines workflow states, transitions, decision precedence, gates, invariants, Issue/PR discovery and historical-work handling, review boundaries, record-integrity rules, and the boundaries between general Management workflow and scoped workflow documents.

Project/Kanban-specific workflow behavior is defined in `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` and is incorporated here by reference.

Other documents may explain, implement, or reference these workflows, but must not independently redefine them:

- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` — incorporated by reference for GitHub Project/Kanban workflow behavior.
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

Project/Kanban state representation, Project Item Status behavior, Pull Request Project Item behavior, Product Owner Project rulings, and Project/Kanban state meanings are delegated to `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`.

---

## 2. Work-Request Discovery and Historical Precedence

This workflow applies regardless of whether the requester or executor is a human or an agent.

### Decision precedence

**Explicit reference → OPEN active search → HISTORICAL CLOSED/MERGED search → verify claimed result → valid = no duplicate / insufficient or obsolete = active work / uncertain = clarification → only then create new work.**

The complete control flow is:

```text
INPUT: work_request
  |
  +--> classify requester (human | agent)
  |
  +--> explicit Issue/PR reference?
  |       |
  |       +-- YES --> validate referenced item --> resolve work identity
  |       |
  |       +-- NO --> search OPEN Issues
  |                    |
  |                    +--> clear match --> reuse Issue
  |                    |
  |                    +--> related candidate
  |                    |      |
  |                    |      +--> scope/duplication uncertain --> CLARIFY(requester)
  |                    |      |
  |                    |      +--> legitimate amendment/extension --> reuse Issue
  |                    |
  |                    +--> no suitable Issue --> search CLOSED Issues
  |                                         |
  |                                         +--> exact/materially similar historical work?
  |                                                |
  |                                                +--> YES --> verify resulting repository state
  |                                                |             |
  |                                                |             +--> still satisfies request --> no duplicate active Issue
  |                                                |             |
  |                                                |             +--> insufficient/obsolete/broken --> create/reuse active Issue
  |                                                |
  |                                                +--> NO --> CREATE Issue
  |
  +--> after Issue resolution and no pending clarification
  |       |
  |       +--> search OPEN PRs
  |              |
  |              +--> clear implementation match --> reuse PR
  |              |
  |              +--> related candidate
  |              |      |
  |              |      +--> scope/duplication/ownership uncertain --> CLARIFY(requester)
  |              |      |
  |              |      +--> legitimate extension --> reuse PR
  |              |
  |              +--> no suitable PR --> search MERGED PRs
  |                                           |
  |                                           +--> exact/materially similar implementation?
  |                                                  |
  |                                                  +--> YES --> verify resulting repository state
  |                                                  |             |
  |                                                  |             +--> still satisfies request --> no duplicate PR
  |                                                  |             |
  |                                                  |             +--> insufficient/obsolete/broken --> CREATE PR
  |                                                  |
  |                                                  +--> NO --> CREATE PR via Repository Change Gate
  |
  +--> resolved Issue + PR identity
  |
  +--> execute Implementation Round 1
  |
  +--> review required?
          |
          +--> YES --> STOP implementation
          |            DO NOT MERGE
          |            PROVIDE PR/review link
          |            HAND OFF TO REVIEW
          |
          +--> NO --> continue only where explicitly permitted by workflow
```

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
5. Required Project/Kanban behavior is governed by `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`.
6. Current ChatGPT/GitHub Project capability limits are governed by `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.
7. Required review and testing gates must pass before merge.
8. The executor must stop at the review boundary when review is required.
9. No actor may merge merely because GitHub reports a PR as mergeable.
10. After merge, verify repository, PR, Issue, review, testing, and other available evidence. Do not claim unavailable Project evidence.

A direct-main change is a process violation and requires corrective handling rather than acceptance as normal work.

---

## 4. GitHub Project / Kanban workflow reference

Project/Kanban-specific workflow rules are defined in **`6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`**, incorporated by reference.

Current ChatGPT/GitHub Project capability limits are defined in **`6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`**.

Do not duplicate those rules in this file.

---

## 5. Review, Testing, Acceptance, and Merge Boundary

When review is required, use GitHub's native pull-request review mechanism as the hand-off mechanism. Do **not** invent a separate GitHub PR status such as "Waiting for Review".

### Checkbox handling

Issue and PR checkboxes serve different purposes and must not duplicate the same state:

- **Issue Acceptance checkboxes** define the required outcomes of the work item. `[x]` means the executor has evidence that the criterion is implemented/satisfied and is presenting that state for independent verification. It is an implementation-completion claim, not reviewer approval.
- **PR checklist checkboxes** define PR-local readiness and verification tasks for the particular integration, such as applicable Issue Acceptance addressed, required tests completed, documentation updated, traceability established, and independent review completed where that item is explicitly reviewer-controlled.
- Do not copy the full Issue Acceptance list into the PR. The Issue remains the canonical statement of required outcomes; the PR checklist records integration readiness.
- The executor/agent may check or uncheck executor-controlled Issue Acceptance and PR checklist boxes as objective implementation state changes.
- A reviewer may require a claimed Issue Acceptance or PR checklist item to be returned to `[ ]` when evidence does not support it. Reviewer-only checklist items may be changed only by the reviewer or explicitly authorized human authority.
- Checkbox state is not independent approval and does not replace GitHub's formal review state.

### Review hand-off and discussion implementation chart

```text
Implementation complete
        |
        v
PR is open and ready for review
        |
        v
Review required?
   |                |
  NO               YES
   |                |
   v                v
continue       Identify PR author/executor
                            |
                            v
                  Select authorized reviewer
                            |
                            v
              reviewer == PR author/executor?
                    |                |
                   YES               NO
                    |                 |
                    v                 v
             STOP / BLOCK      Request GitHub review
             no review         from independent reviewer
             may be submitted          |
                                       v
                              EXECUTOR STOPS / DO NOT MERGE
                                       |
                                       v
                              Independent reviewer inspects
                                       |
                                       v
                    Actionable finding needs discussion?
                            |                    |
                           YES                   NO
                            |                    |
                            v                    |
                  Use immediately visible       |
                  discussion mechanism:         |
                  standalone submitted PR       |
                  review comment when anchored; |
                  otherwise PR Conversation     |
                  comment with line/file links  |
                            |                    |
                            v                    |
                Maker/executor replies and/or   |
                changes implementation          |
                            |                    |
                            v                    |
                Reviewer verifies discussion    |
                            |                    |
                            +----------<---------+
                                       |
                                       v
                     All actionable concerns completed?
                            |                    |
                           NO                   YES
                            |                    v
                     Continue discussion   Verify acceptance/
                     or REQUEST_CHANGES    checklist gates
                                                   |
                                                   v
                                      Submit formal GitHub review
                                      APPROVE / REQUEST_CHANGES
                                                   |
                                                   v
                                            Continue workflow
```

Project Item Status transitions at review hand-off, where applicable, are governed by `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` and are executable only by a capable actor/tool. They are not executable steps for the current ChatGPT/GitHub connection.

### Review conversation terminology

For human-facing Jagports documentation and communication, use GitHub UI vocabulary:

- **Review conversation** is the preferred term for an inline Pull Request review discussion.
- Use **Unresolved Review conversation** and **Resolved Review conversation** when describing its state.
- Reserve **review thread** or **review thread object** for GitHub API, GraphQL, or tool implementation details.
- The durable mapping is: **Review conversation (GitHub UI / human-facing)** ↔ **review thread (API / GraphQL / tool object)**.

### Review discussion and formal review rules

1. When the requester is human and review is required, the executing actor requests that human as a GitHub PR reviewer.
2. When the requester is an agent, the review request is routed to the designated human reviewer/authority.
3. **The formal reviewer must be independent of both the PR author and the executing actor. A PR author/executor may perform a private self-check before hand-off, but must not submit the formal GitHub review on that PR.**
4. **Before requesting or submitting a formal review, verify reviewer identity against the PR author and current executing actor. If the identities are equal, or reviewer identity cannot be established unambiguously, STOP/BLOCK and do not submit a review.**
5. **A self-review, including a `COMMENTED` review submitted by the PR author/executor, is not independent review and cannot satisfy the formal review gate.**
6. The GitHub review request and notification are the native review hand-off mechanism; no additional PR status is invented.
7. Before final approval, every applicable Issue Acceptance checkbox and every required PR checklist checkbox must be `[x]`. Any required `[ ]` means the completion/readiness gate has not passed.
8. The independent reviewer verifies the checked implementation claims. If evidence is insufficient, the reviewer requests changes and the affected checkbox must remain or return to `[ ]`.
9. When Project Item Status is used, Project-specific transition and verification requirements are governed by `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`; current ChatGPT/GitHub Project capability limits are governed by `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.
10. After the hand-off, the executing actor stops implementation and does not merge except when responding to reviewer discussion or requested changes under these rules.
11. **Review discussion and formal review submission are distinct.** A finding that needs maker/executor interaction before the formal review outcome must be communicated through an immediately visible channel.
12. A GitHub `PENDING` review is only a draft review. Line-level and file-level comments created inside the normal pending-review flow remain part of that pending review and are visible only to the reviewer until submission. Therefore `line comment` or `file comment` alone does not mean the comment is immediately visible.
13. When anchored diff discussion is needed before formal review submission, prefer a **standalone submitted PR review comment** created directly through the review-comment mechanism/API/tool when that mechanism supports immediate submission without holding a `PENDING` review.
14. If standalone anchored submission is unavailable in the current UI/tool, use an immediately visible top-level PR Conversation comment and include direct file/line links where needed for precise implementation context.
15. The maker/executor may reply to visible review discussion and implement requested changes before a formal `APPROVE`, `REQUEST_CHANGES`, or `COMMENT` review outcome has been submitted. Such replies and changes are not approval.
16. The reviewer must verify the maker/executor response and resulting implementation before treating the underlying concern as completed.
17. An anchored submitted diff/line Review conversation may become GitHub `outdated` when a later commit changes the referenced code. `outdated` is a diff-state signal only; it does not prove that the underlying review concern was satisfied.
18. If a Review conversation becomes `outdated`, the reviewer must determine whether the concern was actually addressed, remains applicable elsewhere, or no longer applies before considering it complete.
19. **A formal review should not normally be submitted while an actionable Review conversation from that review round remains unresolved.** When discussion establishes an unresolved blocking concern, continue the Review conversation or submit `REQUEST_CHANGES`; do not submit `APPROVE`.
20. GitHub formal review outcomes (`APPROVE`, `REQUEST_CHANGES`, or `COMMENT`) determine the submitted review result; approval must not be inferred from a notification, discussion comment, reply, implementation change, Resolved Review conversation state, outdated state, checkbox state, or inactivity.
21. **The reviewer who owns a review concern is the only actor authorized to resolve that concern on the reviewer's behalf. The PR executor, PR author, or any other non-reviewer must not resolve it. The repository/project owner or another explicitly designated human authority is an exception and may resolve it when exercising that authority.**
22. When review changes are requested, the executor may implement the requested changes, update executor-controlled checkbox state to reflect the actual implementation state, and reply to the relevant Review conversation, but must leave reviewer-owned concerns unresolved for the reviewer to verify and resolve.
23. **Every reply to a review comment that reports implementation of a requested change must state what was changed to comply and include a direct, line-specific GitHub link to the actual implementation lines. Prefer a stable commit-pinned `blob/<commit>/<path>#Lx-Ly` link to the resulting lines; where GitHub provides an equivalent direct PR diff/review location that visibly identifies the changed lines, that may be used instead. A PR-level or file-level link alone is insufficient when a specific line link can be provided. The link must open the specific lines that implement the requested change, not merely the repository, PR, or file overview.**
24. **The executor must establish the exact changed file and resulting line range before posting the reply. If the implementation spans multiple distinct line ranges, include a direct line-specific link for each relevant range. Do not claim line-specific implementation evidence until the link has been checked to lead to the intended changed lines.**
25. **The line-specific implementation reply is evidence for reviewer verification; it does not resolve the Review conversation and does not satisfy the formal review approval gate by itself. The reviewer remains responsible for verification and resolution under the existing authority rule.**
26. **Immediately before merge, the executing actor must freshly verify all applicable Issue Acceptance checkboxes, all required PR checklist checkboxes, current/effective review state, and required testing state.**
27. **Merge is permitted only when all applicable Issue Acceptance boxes are `[x]`, all required PR checklist boxes are `[x]`, required tests are `PASS`, and the current independent review state is `APPROVED`. Any failed component blocks merge.**

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
2. `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` is the scoped Project/Kanban workflow source incorporated by reference from this file.
3. `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` defines the current ChatGPT/GitHub Project capability boundary.
4. `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` contains GitHub connection and environment knowledge.
5. `RULES.md` provides governance/rationale and must reference, not redefine, workflows.
6. `SKILL.md` provides machine execution guidance and must implement/reference, not redefine, workflows.
7. `.codex/skills/*` provides specialized procedures and must reference, not redefine, workflows.
8. `KNOWLEDGE.md` contains durable knowledge, decisions, and lessons learned; not workflow authority.

A conflict in a secondary document is a process defect: raise an Issue to correct it rather than silently accepting or bypassing the contradiction.

If `WORKFLOWS.md` and `GITHUB_PROJECT_WORKFLOWS.md` disagree on a general workflow boundary, `WORKFLOWS.md` controls. Within the delegated Project/Kanban scope, `GITHUB_PROJECT_WORKFLOWS.md` controls the detailed Project behavior.

An unresolved contradiction in a canonical workflow source must be treated as a process defect and clarified before relying on the conflicting rule.
