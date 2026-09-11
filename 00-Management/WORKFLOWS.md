# Management Workflows — Jagports AI OS

## Authority

This file is the **single canonical normative source** for Jagports Management workflows.

It defines workflow states, transitions, decision precedence, gates, invariants, Issue/PR discovery and historical-work handling, Project Item Status handling, review boundaries, and record-integrity rules.

Other documents may explain, implement, or reference these workflows, but must not independently redefine them:

- `00-Management/RULES.md` — human-readable governance and rationale.
- `SKILL.md` — machine/agent execution instructions.
- `.codex/skills/*` — specialized operational instructions.
- `KNOWLEDGE.md` — durable knowledge, decisions, and lessons learned.

**Core rule:** A workflow is defined exactly once.

---

## 1. Controlled Workflow States

The normal Management lifecycle is:

`BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → CODING → REVIEW → TESTING → DONE`

`BLOCKED` may be entered from any state when a required prerequisite prevents progress. The previous state must remain identifiable in the task record.

### State meaning

| State | Meaning |
|---|---|
| `BACKLOG` | Valid active work exists but substantive work has not started. |
| `RESEARCH` | Facts, existing work, dependencies, or implementation options are being investigated. |
| `PROPOSED` | A concrete solution or implementation approach has been prepared. |
| `DECISION NEEDED` | Human/authorized decision-maker judgment is required before proceeding. |
| `APPROVED` | Required decision/approval has been obtained and implementation may proceed. |
| `CODING` | Repository implementation is actively being produced. |
| `REVIEW` | Implementation is complete enough for required review; implementation stops at this boundary. |
| `TESTING` | Required validation is being executed. |
| `DONE` | Required implementation, review, testing, merge, and closure/verification obligations are complete. |
| `BLOCKED` | A prerequisite or capability prevents the next required transition. |

A state is not established merely by an Issue comment. The Project Item and its **Project Item Status** are the authoritative Kanban representation and must be verified when the workflow requires a Project transition.

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

### Rules

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

**Issue → dedicated branch → implementation → PR → Project state verification → review → testing → approval/merge → post-merge verification → Issue closure → DONE**

Requirements:

1. A suitable Issue must exist before repository modification.
2. Work occurs on a dedicated branch; never modify `main` directly.
3. A PR is the integration path.
4. The PR must explicitly trace to every Issue it implements/resolves.
5. Required Project Item Status transitions must be performed and independently verified.
6. Required review and testing gates must pass before merge.
7. The executor must stop at the review boundary when review is required.
8. No actor may merge merely because GitHub reports a PR as mergeable.
9. After merge, verify repository, PR, Issue, and Project state.

A direct-main change is a process violation and requires corrective handling rather than acceptance as normal work.

---

## 4. GitHub Project / Kanban State Control

The GitHub Project is the visual/system-of-record representation of workflow state.

An Issue may be represented by a **Project Item**. The workflow state is stored in the Project Item's **Status** field. The Project itself does not have the task's lifecycle Status.

### Project operation rule

A Project operation has two distinct phases:

**MUTATE → VERIFY**

A mutation response is not, by itself, proof that the desired Project state exists.

After adding an Issue, changing Status, or performing another relevant Project mutation:

1. Identify the intended Project.
2. Identify the resulting Project Item.
3. Read the resulting Project state independently.
4. Verify the exact expected field and value.
5. Only then claim the operation succeeded.

If mutation fails, the Project Item cannot be found, the expected field/value cannot be verified, or the result is ambiguous:

- report failure;
- identify whether the failure occurred during mutation or verification when possible;
- state that **Project operation FAILED**;
- state that **no successful Project operation is claimed**;
- never convert an intended state into a claimed actual state.

This rule applies to automated and manual Project operations.

### Issue creation

For a new Issue belonging to the Project:

1. Add it to the Project.
2. Set `Project Item Status` to `BACKLOG`.
3. Independently verify Project Item existence and `BACKLOG`.
4. Record the verified result in the persistent task record.

If Project setup cannot be performed or verified, record the limitation and do not claim successful Project setup.

When substantive work begins, transition from `BACKLOG` to `RESEARCH` unless another state is explicitly appropriate, and verify the Project Item Status.

---

## 5. Review, Testing, and Merge Boundary

When review is required, use GitHub's native pull-request review mechanism as the hand-off mechanism. Do **not** invent a separate GitHub PR status such as "Waiting for Review".

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
                            Project Item Status = REVIEW
                                       |
                                       v
                                Verify Project Status
                                       |
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
                            |                    |
                            v                    v
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

### Review discussion and formal review rules

1. When the requester is human and review is required, the executing actor requests that human as a GitHub PR reviewer.
2. When the requester is an agent, the review request is routed to the designated human reviewer/authority.
3. **The formal reviewer must be independent of both the PR author and the executing actor. A PR author/executor may perform a private self-check before hand-off, but must not submit the formal GitHub review on that PR.**
4. **Before requesting or submitting a formal review, verify reviewer identity against the PR author and current executing actor. If the identities are equal, or reviewer identity cannot be established unambiguously, STOP/BLOCK and do not submit a review.**
5. **A self-review, including a `COMMENTED` review submitted by the PR author/executor, is not independent review and cannot satisfy the formal review gate.**
6. The GitHub review request and notification are the native review hand-off mechanism; no additional PR status is invented.
7. Set the Project Item Status to `REVIEW` and independently verify it.
8. After the hand-off, the executing actor stops implementation and does not merge except when responding to reviewer discussion or requested changes under these rules.
9. **Review discussion and formal review submission are distinct.** A finding that needs maker/executor interaction before the formal review outcome must be communicated through an immediately visible channel.
10. A GitHub `PENDING` review is only a draft review. Line-level and file-level comments created inside the normal pending-review flow remain part of that pending review and are visible only to the reviewer until submission. Therefore `line comment` or `file comment` alone does not mean the comment is immediately visible.
11. When anchored diff discussion is needed before formal review submission, prefer a **standalone submitted PR review comment** created directly through the review-comment mechanism/API/tool when that mechanism supports immediate submission without holding a `PENDING` review.
12. If standalone anchored submission is unavailable in the current UI/tool, use an immediately visible top-level PR Conversation comment and include direct file/line links where needed for precise implementation context.
13. The maker/executor may reply to visible review discussion and implement requested changes before a formal `APPROVE`, `REQUEST_CHANGES`, or `COMMENT` review outcome has been submitted. Such replies and changes are not approval.
14. The reviewer must verify the maker/executor response and resulting implementation before treating the underlying concern as completed.
15. An anchored submitted diff/line discussion may become GitHub `outdated` when a later commit changes the referenced code. `outdated` is a diff-state signal only; it does not prove that the underlying review concern was satisfied.
16. If a discussion becomes `outdated`, the reviewer must determine whether the concern was actually addressed, remains applicable elsewhere, or no longer applies before considering it complete.
17. **A formal review should not normally be submitted while actionable review discussion from that review round remains unresolved.** When discussion establishes an unresolved blocking concern, continue discussion or submit `REQUEST_CHANGES`; do not submit `APPROVE`.
18. GitHub formal review outcomes (`APPROVE`, `REQUEST_CHANGES`, or `COMMENT`) determine the submitted review result; approval must not be inferred from a notification, discussion comment, reply, implementation change, resolved thread, outdated state, checkbox state, or inactivity.
19. **The reviewer who owns a review concern is the only actor authorized to resolve that concern on the reviewer's behalf. The PR executor, PR author, or any other non-reviewer must not resolve it. The repository/project owner or another explicitly designated human authority is an exception and may resolve it when exercising that authority.**
20. When review changes are requested, the executor may implement the requested changes and reply to the relevant discussion, but must leave reviewer-owned concerns unresolved for the reviewer to verify and resolve.
21. **Every reply to a review comment that reports implementation of a requested change must state what was changed to comply and include a direct, line-specific GitHub link to the actual implementation lines. Prefer a stable commit-pinned `blob/<commit>/<path>#Lx-Ly` link to the resulting lines; where GitHub provides an equivalent direct PR diff/review location that visibly identifies the changed lines, that may be used instead. A PR-level or file-level link alone is insufficient when a specific line link can be provided. The link must open the specific lines that implement the requested change, not merely the repository, PR, or file overview.**
22. **The executor must establish the exact changed file and resulting line range before posting the reply. If the implementation spans multiple distinct line ranges, include a direct line-specific link for each relevant range. Do not claim line-specific implementation evidence until the link has been checked to lead to the intended changed lines.**
23. **The line-specific implementation reply is evidence for reviewer verification; it does not resolve the review concern and does not satisfy the formal review approval gate by itself. The reviewer remains responsible for verification and resolution under the existing authority rule.**

Required human validation follows the approved testing gate:

**PR branch → pre-merge test → PASS evidence → review/merge gate → merge → optional post-merge smoke/regression test**

A post-merge test cannot substitute for required pre-merge validation.

`FAIL`, `BLOCKED`, or `NOT TESTED` is not successful validation for a required pre-merge test.

---

## 6. Record Integrity and Active Title Changes

Closed Issues and merged PRs are GitHub records. Their descriptions and comments must not be modified, and their historical content must not be copied into current repository documents merely for archival purposes.

The title of an **open Issue or open PR** may be changed when scope materially changes. GitHub records such a change as a `renamed` event, preserving the previous title.

Title changes are recommended when scope materially changes, including when a PR legitimately expands to resolve multiple Issues. Cosmetic title changes should be avoided.

Closed Issues and merged PRs remain immutable, including titles.

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
- Use a minimum 0.33-second delay between GitHub API calls in Jagports operational sequences.
- After mutations, perform an independent read/verification.
- Distinguish tool capability, authentication, permission, and operation failure where observable.
- Never expose credentials, tokens, or secret values.

If the required GitHub operation is unavailable, report:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

---

## 9. Traceability

Maintain the chain:

`Work request → Issue → PR → Review → Test → Merge → Issue closure → Project verification`

Historical references used to justify active work should be explicitly linked in the active record.

When an active Issue or PR materially changes scope, align its title with the current scope. The title-change exception does not permit modification of historical descriptions/comments.

---

## 10. Conflict Resolution

If documents disagree about a Management workflow:

1. `00-Management/WORKFLOWS.md` is the normative workflow authority.
2. `RULES.md` provides governance/rationale and must reference, not redefine, workflows.
3. `SKILL.md` provides machine execution guidance and must implement/reference, not redefine, workflows.
4. `.codex/skills/*` provides specialized procedures and must reference, not redefine, workflows.
5. `KNOWLEDGE.md` contains durable knowledge and is not workflow authority.

A conflict in a secondary document is a process defect: raise an Issue to correct it rather than silently accepting or bypassing the contradiction.

An unresolved contradiction in the canonical workflow must be treated as a process defect and clarified before relying on the conflicting rule.