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

`BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → IMPLEMENTATION → REVIEW → TESTING → DONE`

`BLOCKED` may be entered from any state when a required prerequisite prevents progress. The previous state must remain identifiable in the task record.

### State meaning

| State | Meaning |
|---|---|
| `BACKLOG` | Valid active work exists but substantive work has not started. |
| `RESEARCH` | Facts, existing work, dependencies, or implementation options are being investigated. |
| `PROPOSED` | A concrete solution or implementation approach has been prepared. |
| `DECISION NEEDED` | Human/authorized decision-maker judgment is required before proceeding. |
| `APPROVED` | Required decision/approval has been obtained and implementation may proceed. |
| `IMPLEMENTATION` | The approved work is actively being produced as repository artifacts, including code, configuration, documentation, data, migrations, tests, workflows, or other committed deliverables. |
| `REVIEW` | Implementation is complete enough for required review; implementation stops at this boundary. |
| `TESTING` | Required validation is being executed. |
| `DONE` | The represented work item or integration artifact has reached a verified terminal lifecycle state and no further work is expected on that item. For successful implementation, required review/testing/merge/closure obligations still apply; PR-specific terminal closure without merge is governed below and does not imply successful integration. |
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

An Issue or Pull Request may be represented by a **Project Item**. The workflow state is stored in that Project Item's **Status** field. The Project itself does not have the task's lifecycle Status.

Issue and Pull Request Project Items represent related but different objects:

- the **Issue Project Item** remains the primary business/work record and represents the lifecycle of the owned work;
- the **Pull Request Project Item** represents the execution/review state of a concrete integration artifact for that work.

A Pull Request Project Item must retain traceability to its owning/closing Issue or Issues. It must not receive a separate competing business Priority/Rank when that prioritization belongs to the owning Issue, unless this canonical workflow explicitly defines such independent prioritization in the future.

### Project operation rule

A Project operation has two distinct phases:

**MUTATE → VERIFY**

A mutation response is not, by itself, proof that the desired Project state exists.

After adding an Issue or Pull Request, changing Status, or performing another relevant Project mutation:

1. Identify the intended Project.
2. Identify the resulting Project Item.
3. Read the resulting Project state independently.
4. Verify the exact expected content identity, Project identity, archive state, field, and value.
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

### Pull Request Project Item lifecycle

A Pull Request that belongs to active Jagports work is represented by its own Project Item so that the Kanban shows the concrete integration artifact as well as the owning Issue. The Pull Request Project Item must use the same controlled workflow meanings defined above; Pull Request events do not create a parallel lifecycle.

The Pull Request Project Item follows these deterministic rules:

1. **Opened** → add the Pull Request itself to the Project. While implementation is still being produced or the independent review hand-off has not occurred, set the Pull Request Project Item Status to `IMPLEMENTATION`, whether the Pull Request is draft or non-draft.
2. **Converted to draft** → set the Pull Request Project Item Status to `IMPLEMENTATION`. Draft state is evidence that the integration artifact is not currently at the independent-review boundary; it does not move repository work backwards to `RESEARCH`.
3. **Marked ready for review / opened non-draft** → being non-draft is a prerequisite for review but does not by itself establish `REVIEW`. Keep `IMPLEMENTATION` until the canonical review hand-off in Section 5 has been completed and verified.
4. **Independent review requested** → after the PR is open, non-draft, the authorized independent reviewer has been selected, and the native GitHub review request has been made, set the Pull Request Project Item Status to `REVIEW`, verify it, and stop implementation at the canonical review boundary.
5. **Review request removed or Pull Request returned to active implementation** → return the Pull Request Project Item Status to `IMPLEMENTATION` when the canonical review hand-off no longer applies and implementation work resumes.
6. **Reopened** → inspect the current PR and review-handoff state. Use `IMPLEMENTATION` unless the canonical independent review hand-off has been re-established and verified; only then use `REVIEW`.
7. **Merged** → after the required review/testing/merge gates have passed, set the Pull Request Project Item Status to `DONE`, independently verify `DONE`, and then archive the Pull Request Project Item. Archiving must not erase Issue↔PR traceability.
8. **Closed without merge** → closing the Pull Request is a terminal lifecycle event for that Pull Request Project Item. Set the Pull Request Project Item Status to `DONE`, independently verify `DONE`, and then archive the item. `DONE` here means no further work is expected on this Pull Request; it does **not** mean the proposed implementation was merged or successfully integrated. GitHub's native Pull Request state and the durable closure/supersession record preserve whether the terminal outcome was obsolete, superseded, abandoned, rejected, or otherwise closed without merge. The owning Issue determines whether the underlying work remains active, is replaced by another Pull Request, becomes blocked, or is otherwise resolved.

For Pull Request Project Items, `DONE` is therefore a terminal-lifecycle state, not a synonym for successful merge. Successful integration is established by the Pull Request's native merged state together with the required review/testing/merge gates; terminal closure without merge remains distinguishable in GitHub history.

Every Pull Request Project Item add, Status change, or archive operation follows the same **MUTATE → VERIFY** rule. Automation must verify that the resulting Project Item contains the intended Pull Request, belongs to the intended Project, has the expected archive state, and has the exact expected Status before success is claimed.

The Pull Request Project Item lifecycle does not replace the owning Issue lifecycle. In particular, a qualifying closing-linked Pull Request may synchronize the owning Issue to `IMPLEMENTATION`, while the Pull Request's own Project Item also remains `IMPLEMENTATION` until the Section 5 review hand-off. At the verified review boundary, the applicable Project Item or Items transition to `REVIEW` according to the canonical review rules; the two items continue to represent different objects.

### IMPLEMENTATION transition from a closing-linked Pull Request

An **open Pull Request that explicitly has a GitHub closing relationship to an Issue** is the normal deterministic repository signal that implementation for that Issue has begun. Closing relationships created by GitHub closing keywords such as `Closes`, `Fixes`, or `Resolves` qualify; a branch, commit, ordinary Issue mention, or related PR without a closing relationship does not qualify by itself.

When this signal is observed, the Issue's Project Item Status may be synchronized to `IMPLEMENTATION` and then independently verified. This signal describes actual implementation activity and is broader than source-code work; the PR may contain code, documentation, configuration, data, tests, workflows, migrations, or other repository deliverables.

The automatic transition must not overwrite `DECISION NEEDED`, `BLOCKED`, `REVIEW`, `TESTING`, or `DONE`. A closing-linked PR does not itself prove that a required decision, approval, review, testing, or acceptance gate has passed. If implementation exists before a required approval or decision, preserve the applicable gate/blocking evidence rather than using automation to legitimize or hide the process defect.

---

## 5. Review, Testing, Acceptance, and Merge Boundary

When review is required, use GitHub's native pull-request review mechanism as the hand-off mechanism. Do **not** invent a separate GitHub PR status such as "Waiting for Review".

### Issue Acceptance and PR checklist roles

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
9. Set the Project Item Status to `REVIEW` and independently verify it.
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

---

## 9. Traceability

Maintain the chain:

`Work request → Issue → PR → Review → Test → Merge → Issue closure → Project verification`

Historical references used to justify active work should be explicitly linked in the active record.

When an active Issue or PR materially changes scope, align its title with the current scope. The title-change and checkbox-state exceptions do not permit unrelated modification of historical descriptions/comments.

---

## 10. Conflict Resolution

If documents disagree about a Management workflow:

1. `00-Management/WORKFLOWS.md` is the normative workflow authority.
2. `RULES.md` provides governance/rationale and must reference, not redefine, workflows.
3. `SKILL.md` provides machine execution guidance and must implement/reference, not redefine, workflows.
4. `.codex/skills/*` provides specialized procedures and must reference, not redefine, workflows.
5. `KNOWLEDGE.md` contains durable knowledge, decisions, and lessons learned; not workflow authority.

A conflict in a secondary document is a process defect: raise an Issue to correct it rather than silently accepting or bypassing the contradiction.

An unresolved contradiction in the canonical workflow must be treated as a process defect and clarified before relying on the conflicting rule.