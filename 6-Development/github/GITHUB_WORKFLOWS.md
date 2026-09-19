# GitHub Workflows

## Purpose

This file preserves GitHub-related workflow execution sections under their current GitHub workflow document name.

These sections are GitHub-specific operating/execution details and therefore belong under `6-Development/github/`. They are used with:

- `6-Development/github/GITHUB_OPERATING_RULES.md` for GitHub Issue, Pull Request, review, merge, comment, record-integrity, field, and label handling;
- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` for Project/Kanban workflow meaning and Project lifecycle rules;
- `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` for the current ChatGPT/GitHub Project capability boundary;
- `00-Management/WORKFLOWS.md` for the top-level Management workflow state machine and gates.

Obsolete instructions requiring this current ChatGPT/GitHub connection to perform every Project mutation are intentionally not restored as executable steps. Project operations are executable only by a capable human, automation, or future tool that can mutate and independently verify Project state.

---

### Checkbox handling

Issue and PR checkboxes serve different purposes and must not duplicate the same state:

- **Issue Acceptance checkboxes** define the required outcomes of the work item. `[x]` means the executor has evidence that the criterion is implemented/satisfied and is presenting that state for independent verification. It is an implementation-completion claim, not reviewer approval.
- **PR checklist checkboxes** define PR-local readiness and verification tasks for the particular integration, such as applicable Issue Acceptance addressed, required tests completed, documentation updated, traceability established, and independent review completed where that item is explicitly reviewer-controlled.
- Do not copy the full Issue Acceptance list into the PR. The Issue remains the canonical statement of required outcomes; the PR checklist records integration readiness.
- The executor/agent may check or uncheck executor-controlled Issue Acceptance and PR checklist boxes as objective implementation state changes.
- A reviewer may require a claimed Issue Acceptance or PR checklist item to be returned to `[ ]` when evidence does not support it. Reviewer-only checklist items may be changed only by the reviewer or explicitly authorized human authority.
- Checkbox state is not independent approval and does not replace GitHub's formal review state.

---

## Work-Request Execution

For every GitHub work request, regardless of requester type:

1. Validate any explicit Issue/PR reference.
2. If there is no explicit reference, search open Issues first.
3. Reuse a clear open match.
4. Reuse a related open Issue when the request is a legitimate amendment, extension, refinement, follow-up, or completion.
5. If duplication, scope, ownership, authority, or relationship is uncertain, clarify with the requester/decision-maker.
6. If no suitable active Issue exists, search closed Issues for exact/materially similar historical work.
7. Verify any historical implementation that claims to satisfy the request.
8. If valid and still satisfying the request, do not create duplicate active work.
9. If insufficient, obsolete, superseded, or broken, create/reuse active work and reference the historical item.
10. After Issue resolution, search open PRs before creating a PR.
11. Reuse a clear open PR or legitimately extend it when scope remains clear.
12. If no suitable open PR exists, search merged PRs and verify any claimed prior implementation.
13. If the merged implementation is still sufficient, do not create duplicate implementation work.
14. Otherwise create a PR through the Repository Change Gate.
15. One PR may genuinely resolve multiple Issues; maintain explicit traceability to every Issue.
16. Once identity and scope are resolved, proceed automatically without unnecessary confirmation.

---

## Prioritization Request Execution

A compact request such as `@priorize 671 612 355` is GitHub execution shorthand. Priority meaning, scoring, Urgency semantics, Rank semantics, review bands, and Product Owner override authority remain defined by `00-Management/PRIORITIZATION.md`; this section defines only the GitHub execution path.

Issues and Pull Requests are separate prioritized work records.

For each supplied number:

1. Resolve and validate whether the target is an Issue or Pull Request.
2. For an Issue, prioritize that Issue itself using native `Priority`, Project `Rank`, Project `Urgency`, `Workstream`, and `Status`.
3. For a Pull Request, prioritize that Pull Request itself using Project `PR Priority`, `PR Rank`, `PR Urgency`, `Workstream`, and `Status`.
4. For a PR, resolve owning/closing Issue evidence when available only as verified baseline/context. Do not overwrite Issue Priority/Rank/Urgency unless the Issue itself is separately targeted or due for reassessment.
5. Resolve the applicable `Workstream` from durable verified evidence; never guess from free text/topic.
6. Determine or accept Priority, Rank, and Urgency under `00-Management/PRIORITIZATION.md`.
7. For an Issue, write one bounded authorized Issue work-control record and verify the resulting Issue fields/snapshot.
8. For a Pull Request, write one bounded authorized PR work-control record and verify `PR Priority`, `PR Rank`, `PR Urgency`, `Workstream`, and `Status`.
9. If Workstream is unresolved, Priority/Urgency may still be synchronized, but Rank remains `none`.
10. Report success only after the target record's authoritative values are independently read back and verified.

Execution sequence:

`resolve target → classify Issue/PR → calculate/accept Priority + Urgency + Rank → synchronize only that target → independently verify → report`

The short `@priorize <numbers>` form is sufficient for both Issues and Pull Requests. It prioritizes every referenced record directly according to its record type.

### Automatic prioritization on open

- Issue open automatically invokes the same initial prioritization behavior as `@priorize <Issue-number>`.
- Pull Request open automatically invokes the same initial prioritization behavior as `@priorize <PR-number>`.
- Both automatic paths are bounded to the newly opened record and do not bulk-score the existing backlog.
- The automatic paths must ultimately synchronize and verify the same fields used by explicit `@priorize`; they are triggers, not separate prioritization models.


---

## Repository Change Gate

Every GitHub repository modification follows the controlled path:

`Issue → branch → implementation → PR → review → testing → approval/merge → post-merge verification → Issue closure → DONE`

Rules:

- Never modify `main` directly.
- Every change is made on a dedicated branch.
- Every change integrates through a PR.
- The PR must explicitly trace to every Issue it implements/resolves.
- Do not attempt GitHub Project management, Project View reads, Project Item reads, Project Item Status reads, Project Item mutations, Project Item Status mutations, Project transitions, Project archive/unarchive operations, or Project field/view/option management through this current ChatGPT/GitHub connection.
- When Project state would normally be relevant through this current connection, record: `*** !!! ALERT - GitHub Project functions are non-existing !!! ***`
- Required review, checkbox, and testing gates must pass before merge.
- Never treat GitHub's `mergeable` state as proof of review or approval.
- After merge, verify repository, PR, Issue, review, test, and file state available through this connection. Do not claim Project state unless a capable actor/tool independently verifies it.

A direct-main change is a process violation and requires corrective handling under `00-Management/WORKFLOWS.md`.

---

### Mandatory Pre-Merge Review Gate

Before **any** merge operation, the executing actor must perform a fresh, independent review-state check for the target PR. This check is a hard precondition for invoking the merge operation; GitHub's technical `mergeable` result is not a substitute.

The check must:

1. Read the PR's current review submissions immediately before merge.
2. Determine the effective review state from the review history, including whether a later review supersedes an earlier review.
3. Treat `CHANGES_REQUESTED` / `REQUEST_CHANGES` as a blocking state. **STOP — DO NOT MERGE.**
4. Never allow an earlier `APPROVED` review to satisfy the gate when a later blocking review exists.
5. Verify all applicable Issue Acceptance checkboxes are `[x]`.
6. Verify all required PR checklist checkboxes are `[x]`.
7. Verify required tests are `PASS`.
8. Treat review-comment wording as content to act on, not as merge authorization. In particular, wording such as `merge files` means modify/combine files unless the review state itself has independently passed.
9. If requested changes need implementation, implement them on the PR branch, push them, and return to review. Do not resolve the reviewer's blocking comments or merge the PR on the reviewer's behalf.
10. Permit merge only when the current review gate is independently verified as passed and all checkbox/testing gates have passed.
11. If any required state cannot be determined reliably, **STOP/BLOCK and DO NOT MERGE**.

Required decision rule:

`Issue Acceptance all [x] + PR required checklist all [x] + required tests PASS + independent review APPROVED → merge permitted`

This rule applies regardless of whether the requested change is large, small, documentary, mechanical, or apparently implied by the review comment.

---

## Review and Testing Boundary

When review is required, execute the canonical native GitHub hand-off:

- if the requester is human, request that human as the GitHub PR reviewer;
- if the requester is an agent, request the designated human reviewer/authority;
- verify that the selected reviewer is different from both the PR author and the executing actor before requesting or submitting formal review; if identity is equal or ambiguous, STOP/BLOCK and do not submit a review;
- the PR author/executor may perform a private self-check, but must never submit the formal GitHub review; a self-review, including a `COMMENTED` review, does not satisfy the review gate;
- ensure applicable executor-controlled Issue Acceptance and required PR checklist boxes reflect actual implementation/readiness state before final approval;
- stop implementation and do not merge after hand-off except when responding to reviewer discussion or requested changes under the canonical rules.

Do not invent a separate GitHub PR status such as `Waiting for Review`. GitHub's native review request/notification and review outcome are the review mechanism.

Required human validation follows:

**Issue Acceptance all `[x]` + PR required checklist all `[x]` + required tests `PASS` + independent review `APPROVED` → merge permitted**

A post-merge test cannot substitute for required pre-merge validation. `FAIL`, `BLOCKED`, or `NOT TESTED` is not successful required pre-merge validation.

---

## GitHub Issue Closing Syntax

Every PR that completes an Issue must use the GitHub closing form:

`Closes #123`

Do not use only task identifiers or prose such as `Closes 123` or `Closes Issue 123`.

When multiple Issues are resolved, include an explicit closing/traceability reference for each applicable Issue.

---

## GitHub Access and Capability Availability

Before an external GitHub action, verify both:

- the account/repository permission relevant to the action; and
- the current agent/tool capability to perform that specific action.

If the required operation is unavailable, do not silently substitute an unperformed action and do not repeatedly retry an unsupported operation.

Distinguish, where observable, among:

- unavailable tool capability;
- insufficient permission;
- authentication failure;
- unavailable integration;
- technical operation failure.

Project management/read/mutation operations are already known to be unavailable through the current ChatGPT/GitHub connection. Do not test or retry them as part of ordinary work.

If capability is unavailable, use the exact alert required by the active execution rules:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

For the known Project capability boundary, use the exact Project-functions alert:

`*** !!! ALERT - GitHub Project functions are non-existing !!! ***`
