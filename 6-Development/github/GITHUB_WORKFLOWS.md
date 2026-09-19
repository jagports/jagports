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

A compact request such as `@priorize 671 612 355` is GitHub execution shorthand. Priority meaning, scoring, review bands, Rank semantics, and Product Owner override authority remain defined by `00-Management/PRIORITIZATION.md`; this section defines only the GitHub execution path.

Business Priority and Project Rank belong to the owning Issue. A Pull Request number is a supported `@priorize` entry point, but it resolves to the owning/closing Issue and does not create separate PR Priority/Rank fields.

For each supplied number:

1. Resolve and validate the referenced Issue or Pull Request.
2. If the reference is a Pull Request, resolve its owning/closing Issue or Issues. Apply business prioritization to the owning Issue; keep the Pull Request's own Status and Workstream lifecycle under the canonical Pull Request Project Item workflow.
3. Read the owning Issue's latest durable priority/work-control evidence needed to preserve current authoritative state.
4. Resolve the applicable Project `Workstream` from explicit verified evidence. When a managed work-control snapshot exists, use its verified Workstream rather than inferring from topic or `Scope:` text.
5. If no explicit/verified Workstream is available, fail closed for ranked queue placement. Do not infer Workstream from title, body, branch, labels, Issue type, repository path, or semantic/free-text context.
6. Determine or accept the requested priority/order under `00-Management/PRIORITIZATION.md`.
7. Write one bounded authorized `<!-- jagports-project-sync -->` record on the owning Issue. When Project Rank is set, the record must explicitly include `Workstream: AI OS` or `Workstream: VIEPS`.
8. Treat `Scope:` as descriptive review context only; it never substitutes for `Workstream:`.
9. Wait for the existing bounded work-control automation to complete, then verify the same Issue's managed snapshot/read-back evidence.
10. Report successful business prioritization only when the requested owning-Issue fields are independently verified. Do not create a separate PR Priority/Rank.

Execution sequence:

`resolve work records → map PR references to owning Issues → obtain explicit/verified Workstream → calculate/accept priority order → write bounded Issue project-sync record including Workstream → verify resulting Issue snapshot → report only verified result`

The short `@priorize <numbers>` form is sufficient for both Issues and Pull Requests. A Pull Request number is only an entry point to its owning/closing Issue prioritization; it does not create a second PR priority model.

### Automatic request when a Pull Request opens

`.github/workflows/request-pr-prioritization-on-open.yml` runs only on `pull_request: opened` and records exactly one durable `@priorize <PR-number>` request on the newly opened Pull Request.

That Action does **not** calculate Priority, create Project fields, mutate ProjectV2, or introduce PR-specific Priority/Rank storage. It only invokes the already-defined `@priorize` execution contract. The executor that handles the request must follow the sequence above and therefore map the PR to its owning/closing Issue.


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
