# SKILL — Jagports AI OS Operational Rules

## Canonical Management Workflow

The normative Management workflows are defined in [`00-Management/WORKFLOWS.md`](00-Management/WORKFLOWS.md).

`SKILL.md` is the machine/agent execution layer. It must execute and reference the canonical workflows and must not independently redefine them.

**Mandatory work-request precedence:**

**OPEN search → HISTORICAL CLOSED/MERGED search → verify claimed result → valid = no duplicate / insufficient or obsolete = active work / uncertain = clarification → only then create new work.**

The canonical workflow also defines the controlled lifecycle, Project Item Status verification, Repository Change Gate, review/testing boundaries, record integrity, title-change exception, and conflict handling.

### Dedicated i18n execution skill

For VIEPS UI/application changes that create, modify, review, or refactor human-visible text, apply [`SKILL_i18n.md`](SKILL_i18n.md) in addition to this general execution skill.

`SKILL_i18n.md` implements the governance rules in `00-Management/RULES_i18n.md`, including mandatory changed-code scanning for hard-coded localizable strings and EN↔FI resource maintenance.

## Mandatory Start-of-Work Procedure

Before doing Jagports work:

1. Verify GitHub repository access.
2. Read the current `SKILL.md` and the canonical `00-Management/WORKFLOWS.md`.
3. Verify that the GitHub operations required for the task are available.
4. Resolve the Issue/PR identity using the canonical discovery workflow before substantive repository modification.
5. Never claim an external action without verification.

If a required GitHub operation is unavailable, the alert must begin exactly with:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

## Work-Request Execution

For every request, regardless of requester type:

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

## Repository Change Gate

Every repository modification follows the controlled path:

`Issue → branch → implementation → PR → Project state verification → review → testing → approval/merge → post-merge verification → Issue closure → DONE`

Rules:

- Never modify `main` directly.
- Every change is made on a dedicated branch.
- Every change integrates through a PR.
- The PR must explicitly trace to every Issue it implements/resolves.
- Required Project Item Status transitions must be performed and independently verified.
- Required review, checkbox, and testing gates must pass before merge.
- Never treat GitHub's `mergeable` state as proof of review or approval.
- After merge, verify repository, PR, Issue, and Project state.

A direct-main change is a process violation and requires corrective handling under `WORKFLOWS.md`.

### Checkbox handling

Execute the Issue/PR checkbox roles defined canonically in `WORKFLOWS.md`:

- Issue Acceptance boxes describe required work outcomes; `[x]` is an executor implementation-completion claim, not independent approval.
- PR checklist boxes describe PR-local integration readiness and must not duplicate the full Issue Acceptance list.
- An executor/agent may check or uncheck existing **executor-controlled** Issue Acceptance and PR checklist boxes when objective implementation/readiness evidence changes.
- Checkbox-only edits are permitted on open Issue/PR descriptions for this purpose; do not rewrite criterion/checklist text or unrelated description content under this exception.
- Never change a reviewer-only checkbox on the reviewer's behalf.
- A reviewer may return an unsupported executor-controlled checkbox to `[ ]`.
- Before final approval, all applicable Issue Acceptance and required PR checklist boxes must be `[x]`.
- Checked boxes do not constitute approval; independent formal GitHub review remains required.

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
11. If any required state cannot be determined reliably, **STOP/BLOCK and DO NOT MERGE** (fail closed).

Required decision rule:

`Issue Acceptance all [x] + PR required checklist all [x] + required tests PASS + independent review APPROVED → merge permitted`

This rule applies regardless of whether the requested change is large, small, documentary, mechanical, or apparently implied by the review comment.

## GitHub Project / Kanban Operations

The GitHub Project represents workflow state through an Issue's **Project Item Status**.

The Project itself is the container; the Status is a property of the Project Item.

For every Project mutation use:

**MUTATE → INDEPENDENTLY VERIFY → CLAIM SUCCESS**

A successful mutation/API response alone is not sufficient evidence.

After adding an Issue or changing Project Item Status:

1. Identify the intended Project.
2. Identify the resulting Project Item.
3. Read the resulting Project state independently.
4. Verify the exact expected field and value.
5. Claim success only after the expected state is observed.

If mutation fails, the Project Item cannot be found, the expected field/value cannot be verified, or verification is ambiguous:

- report failure;
- distinguish mutation failure from verification failure when observable;
- state **no successful Project operation is claimed**;
- never report an intended state as the actual state.

For a new Project Issue, the required initial sequence is:

`add Issue → set BACKLOG → independently verify Project Item + BACKLOG → record verified result`

If Project setup cannot be performed or verified, report the limitation immediately. Do not claim successful Project setup.

When substantive work starts, move the Project Item from `BACKLOG` to `RESEARCH` unless another canonical state is appropriate, and verify the resulting Status.

## Review and Testing Boundary

When review is required, execute the canonical native GitHub hand-off defined in `00-Management/WORKFLOWS.md`:

- if the requester is human, request that human as the GitHub PR reviewer;
- if the requester is an agent, request the designated human reviewer/authority;
- **verify that the selected reviewer is different from both the PR author and the executing actor before requesting or submitting formal review; if identity is equal or ambiguous, STOP/BLOCK and do not submit a review;**
- **the PR author/executor may perform a private self-check, but must never submit the formal GitHub review; a self-review, including a `COMMENTED` review, does not satisfy the review gate;**
- ensure applicable executor-controlled Issue Acceptance and required PR checklist boxes reflect actual implementation/readiness state before final approval;
- set Project Item Status to `REVIEW` and independently verify it;
- stop implementation and do not merge after hand-off.

Do not invent a separate GitHub PR status such as `Waiting for Review`. GitHub's native review request/notification and review outcome are the review mechanism.

### Review conversation terminology

Use GitHub UI terminology in human-facing communication:

- **Review conversation** is the preferred term for an inline Pull Request review discussion.
- Describe its state as **Unresolved Review conversation** or **Resolved Review conversation** when state matters.
- Use **review thread** or **review thread object** only when specifically referring to GitHub API, GraphQL, or tool implementation objects.
- When a tool/API returns a review-thread object, translate that implementation vocabulary to **Review conversation** before reporting the state to a human.
- The durable mapping is: **Review conversation (GitHub UI / human-facing)** ↔ **review thread (API / GraphQL / tool object)**.

During independent review, distinguish **visible review discussion** from **formal review submission** exactly as defined in `WORKFLOWS.md`:

- a GitHub `PENDING` review and its pending comments are reviewer-private until submission; line-level and file-level comments created inside the normal pending-review flow are also pending and must not be used as the reviewer↔maker discussion channel;
- do not infer immediate visibility merely because a comment is anchored to a file or line;
- when anchored interaction is needed before the formal review outcome, use a standalone submitted PR review comment created directly through the review-comment mechanism/API/tool when the available mechanism supports immediate submission without a pending review;
- if standalone anchored submission is unavailable, use an immediately visible top-level PR Conversation comment and include direct file/line links where needed;
- the maker/executor may reply and implement changes before formal review submission, but this does not constitute approval;
- if the referenced code changes and GitHub marks an anchored discussion `outdated`, do not infer that the concern is satisfied; the reviewer must verify whether the concern was actually addressed or remains applicable;
- formal `APPROVED` remains the independent review gate where required, and unresolved blocking concerns must not result in approval.

Review conversation resolution, requested-change implementation replies, line-specific implementation evidence, checkbox handling, and reviewer-controlled resolution are governed by the canonical rules in `00-Management/WORKFLOWS.md`; this skill must execute those rules rather than redefine them.

Required human validation follows:

**Issue Acceptance all `[x]` + PR required checklist all `[x]` + required tests `PASS` + independent review `APPROVED` → merge permitted**

A post-merge test cannot substitute for required pre-merge validation. `FAIL`, `BLOCKED`, or `NOT TESTED` is not successful required pre-merge validation.

## Record Integrity and Active Record Changes

Follow `00-Management/WORKFLOWS.md` for the canonical rules.

- Never modify descriptions or comments of closed Issues or merged PRs.
- An open Issue or open PR may have its title changed when scope materially changes.
- Such title changes are auditable through GitHub's `renamed` history event.
- Cosmetic title changes should be avoided.
- An executor/agent may edit an open Issue or PR description solely to check/uncheck existing executor-controlled checkboxes as permitted by the canonical checkbox-state exception.
- A reviewer may change reviewer-controlled boxes and return unsupported executor claims to `[ ]`.
- Do not use the checkbox exception to rewrite criteria, checklist wording, or unrelated description content.

## GitHub Issue Closing Syntax

Every PR that completes an Issue must use the GitHub closing form:

`Closes #123`

Do not use only task identifiers or prose such as `Closes 123` or `Closes Issue 123`.

When multiple Issues are resolved, include an explicit closing/traceability reference for each applicable Issue.

## Comment and Traceability Rules

GitHub Issue/PR comments must be concise and traceable:

- Put each distinct traceability statement on its own line or paragraph.
- When an Issue/PR is the primary reference, put its Markdown link at the beginning of its own line.
- Separate relationship text such as `implements`, `resolves`, or `previous implementation` from the primary link.
- Do not bury multiple Issue/PR references in a long inline chain.

Do not rewrite historical comments merely to improve formatting; add a new corrective comment when required and when the record is still mutable.

## Git Branch Rules

- Always create and work on a branch.
- Never commit directly to `main`.
- Every branch must have a clear purpose.
- All repository changes merge through PRs.

Before creating a PR, verify:

- base branch;
- head branch;
- Issue number and traceability;
- PR closing references;
- intended scope.

## GitHub API Rules

- Avoid unnecessary repeated GitHub/API calls.
- Do not impose an artificial inter-call delay while normal subscription/tool capacity is available.
- Reduce request frequency or follow provider-directed retry/backoff only when an observable constraint exists, such as remaining LLM subscription/tool usage being reported low, required subscription/tool access being unavailable, or the provider reporting a rate limit/retry requirement.
- When such a constraint affects the work, alert/escalate it rather than silently slowing execution or claiming unavailable work succeeded.
- Do not invent quota/subscription state when it is not observable.
- Verify mutations with an independent read.
- Never expose credentials, tokens, or secret values.

## GitHub Access and Capability Availability

Before an external action, verify both:

- the account/repository permission relevant to the action; and
- the current agent/tool capability to perform that specific action.

If the required operation is unavailable, do not silently substitute an unperformed action and do not repeatedly retry an unsupported operation.

Distinguish, where observable, among:

- unavailable tool capability;
- insufficient permission;
- authentication failure;
- unavailable integration;
- technical operation failure.

If capability is unavailable, use the exact alert:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

## User Command Requests

When the user explicitly asks for commands:

- provide the commands in one Markdown code block;
- do not split a requested command sequence unless asked;
- do not require the user to execute commands merely because a suitable tool is available;
- when later commands depend on earlier output, use a temporary working-directory file and clean it up after dependent steps succeed.

## Windows Git Bash Compatibility

Commands for the project's Windows Git Bash environment must avoid known unreliable constructs:

- `awk`;
- Bash associative arrays;
- backslash line continuations;
- Windows path separators.

Prefer forward-slash paths and simple Git Bash-compatible commands.

## Navigation URL Rules

For UI navigation, provide the direct stable URL to the intended page when known. Do not make the user traverse unnecessary menus.

## AI OS Command Semantics

Short Jagports AI OS commands identify the intended operation. They do not require the user to repeat workflow rules, authorization already established by the session/repository, verification requirements, or completion criteria already defined by authoritative repository sources.

`@open <target>` means open and process the identified Jagports work item or resource using the applicable canonical workflow. Resolve the target from the supplied identifier and current repository state.

`@implement <target>` means implement the identified work according to the applicable Issue/PR scope and canonical workflow. Proceed through routine implementation steps automatically. When the canonical workflow requires review, stop at that review boundary and require **independent review**; do not merge before the required review and testing gates are satisfied.

`@continue [<target>]` means continue the current work from its actual state. If a target is supplied, use it as the work identity; otherwise use the active work identity. Re-read the current state, determine the next action from the canonical workflow and current records, and continue through routine intermediate actions automatically. Do not stop merely to report an intermediate state when the work can continue.

Whenever `@continue` reaches a canonical review boundary and stops for review, the hand-off response must give the direct PR/review link to the user, including when requested review changes have been implemented and the PR is returned to review.

`@continue` continues until the applicable workflow completion boundary, or until a genuine prerequisite, authority decision, or unavailable required capability prevents further progress. Once the current canonical review/merge gate has been independently satisfied by the required current approval, `@continue` authorizes continuation through the remaining canonical merge, post-merge verification, Issue-closure, and completion steps without another user confirmation. A stale or superseded approval does not satisfy this condition.

Review change requests may be implemented and answered by the executor, but the corresponding Review conversations remain unresolved for the reviewing authority/requestor to resolve under the canonical workflow. These command semantics do not create a separate review, testing, merge, Project, or Issue-closure workflow.

These semantics describe agent interpretation of equivalent short commands. Repository documentation does not register or modify ChatGPT UI `@` menu entries; UI availability is controlled by the interface/app configuration.

## Separation of Responsibilities

- `00-Management/WORKFLOWS.md` — canonical normative Management workflows.
- `00-Management/RULES.md` — human governance and rationale; no competing workflow definition.
- `00-Management/RULES_i18n.md` — canonical VIEPS i18n contributor/governance rules.
- `SKILL.md` — machine/agent execution of the canonical workflows.
- `SKILL_i18n.md` — machine/agent execution of the VIEPS i18n rules.
- `.codex/skills/*` — specialized operational procedures referencing the canonical workflows.
- `KNOWLEDGE.md` — durable knowledge, decisions, and lessons learned; not workflow authority.

If any secondary document conflicts with `WORKFLOWS.md`, follow the canonical workflow and raise an Issue to correct the conflicting secondary document. If the canonical workflow itself is ambiguous, stop the affected decision and obtain the required clarification.
