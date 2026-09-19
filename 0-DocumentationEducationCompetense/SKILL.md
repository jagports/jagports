# SKILL — Jagports AI OS Operational Rules

## Canonical Management Workflow

The normative Management workflows are defined in [`00-Management/WORKFLOWS.md`](00-Management/WORKFLOWS.md).

`SKILL.md` is the machine/agent execution layer. It must execute and reference the canonical workflows and must not independently redefine them.

**Mandatory work-request precedence:**

**OPEN search → HISTORICAL CLOSED/MERGED search → verify claimed result → valid = no duplicate / insufficient or obsolete = active work / uncertain = clarification → only then create new work.**

The canonical workflow also defines the controlled lifecycle, Project Item Status meaning, Repository Change Gate, review/testing boundaries, record integrity, title-change exception, and conflict handling. GitHub Project/Kanban-specific workflow behavior is defined in `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` and the current ChatGPT/GitHub capability boundary is summarized in `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.

## Current ChatGPT/GitHub Project capability boundary

Detailed Project/Kanban workflow meaning, lifecycle rules, evidence rules, and Product Owner rulings are defined in [`6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`](../6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md).

The current ChatGPT/GitHub capability boundary is summarized in [`6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`](../6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md).

GitHub connection capability knowledge is maintained in [`6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md`](../6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md).

Execution rule for this current ChatGPT/GitHub connection:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

Do not attempt Project management, Project View reads, Project Item reads, Project Item Status reads, Project mutations, Project transitions, Project archive/unarchive operations, or Project field/view/option management through this connection.

Then continue only repository, Issue, PR, review, commit, check, comment, and file operations that are available and independently verifiable through this connection.

### Dedicated i18n execution skill

For VIEPS UI/application changes that create, modify, review, or refactor human-visible text, apply [`SKILL_i18n.md`](SKILL_i18n.md) in addition to this general execution skill.

`SKILL_i18n.md` implements the governance rules in `00-Management/RULES_i18n.md`, including mandatory changed-code scanning for hard-coded localizable strings and EN↔FI resource maintenance.

## Mandatory Start-of-Work Procedure

Before doing Jagports work:

1. Verify GitHub repository access.
2. Read the current `SKILL.md` and the canonical `00-Management/WORKFLOWS.md`.
3. Verify that the GitHub operations required for the task are available.
4. Do not attempt GitHub Project management, Project View reads, Project Item reads, Project Item Status reads, Project mutations, Project transitions, Project archive/unarchive operations, or Project field/view/option management through this connection.
5. Resolve the Issue/PR identity using the canonical discovery workflow before substantive repository modification.
6. Never claim an external action without verification.

If a required GitHub operation is unavailable, the alert must begin exactly with:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

For unavailable Project operations, do not retry unsupported calls. Use the required Project capability reporting sentence instead.

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

## Automatic Prioritization on Open

Execute automatic/open-event and explicit `@priorize` behavior by reference to:

- `00-Management/PRIORITIZATION.md` for scoring, Issue Priority/Rank/Urgency, PR Priority/Rank/Urgency, Workstream evidence, automatic-on-open behavior, explicit `@priorize`, and Product Owner authority.
- `6-Development/github/GITHUB_WORKFLOWS.md` for GitHub execution routing and bounded synchronization records.
- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` for Project Item lifecycle and Project-scoped field behavior.

Do not duplicate those rules here. This connection must still obey the Project capability boundary above.

## Repository Change Gate

Every repository modification follows the controlled path:

`Issue → branch → implementation → PR → review → testing → approval/merge → post-merge verification → Issue closure → DONE`

Rules:

- Never modify `main` directly.
- Every change is made on a dedicated branch.
- Every change integrates through a PR.
- The PR must explicitly trace to every Issue it implements/resolves.
- Do not attempt GitHub Project management, Project View reads, Project Item reads, Project Item Status reads, Project Item mutations, Project Item Status mutations, Project transitions, Project archive/unarchive operations, or Project field/view/option management through this connection.
- When Project state would normally be relevant, record: `Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`
- Required review, checkbox, and testing gates must pass before merge.
- Never treat GitHub's `mergeable` state as proof of review or approval.
- After merge, verify repository, PR, Issue, review, test, and file state available through this connection. Do not claim Project state.

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

## Environment asymmetry

Different agent environments may expose different GitHub capabilities. A capability available in one environment is not automatically available in another.

Before claiming or performing an operation, verify the specific environment, identity, permission, and tool capability being used.

## GitHub Project / Kanban Operations

Do not duplicate GitHub Project/Kanban lifecycle rules in this file.

Use:

- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` for Project/Kanban workflow meaning and Product Owner rulings;
- `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` for the current ChatGPT/GitHub Project capability boundary;
- `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` for GitHub connection knowledge and environment asymmetry.

Execution rule for this current ChatGPT/GitHub connection:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

## Review and Testing Boundary

When review is required, execute the canonical native GitHub hand-off defined in `00-Management/WORKFLOWS.md`.

Required human validation follows:

**Issue Acceptance all `[x]` + PR required checklist all `[x]` + required tests `PASS` + independent review `APPROVED` → merge permitted**

A post-merge test cannot substitute for required pre-merge validation. `FAIL`, `BLOCKED`, or `NOT TESTED` is not successful required pre-merge validation.

### Review conversation terminology

For human-facing Jagports documentation and communication, use GitHub UI vocabulary:

- **Review conversation** is the preferred term for an inline Pull Request review discussion.
- Use **Unresolved Review conversation** and **Resolved Review conversation** when describing its state.
- Reserve **review thread** or **review thread object** for GitHub API, GraphQL, or tool implementation details.
- When a tool/API returns a review-thread object, translate that implementation vocabulary to **Review conversation** before reporting the state to a human.
- The durable mapping is: **Review conversation (GitHub UI / human-facing)** ↔ **review thread (API / GraphQL / tool object)**.

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

## Record Integrity and Active Record Changes

Follow `00-Management/WORKFLOWS.md` for the canonical rules.

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
- Verify supported non-Project mutations with an independent read.
- Do not attempt Project management, Project reads, Project View reads, Project Item reads, Project Item Status reads, Project mutations, Project transitions, Project archive/unarchive operations, or Project verification through this connection.
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

Project management/read/mutation operations are already known to be unavailable through the current ChatGPT/GitHub connection. Do not test or retry them as part of ordinary work.

If capability is unavailable, use the exact alert:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

For the known Project capability boundary, use the Project capability reporting sentence instead of the general GitHub-functions alert.

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

- `00-Management/WORKFLOWS.md` — top-level canonical normative Management workflows.
- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` — scoped canonical GitHub Project/Kanban workflows incorporated by reference from `WORKFLOWS.md`.
- `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` — current ChatGPT/GitHub Project capability boundary.
- `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` — GitHub connection and environment knowledge.
- `6-Development/github/GITHUB_OPERATING_RULES.md` — GitHub record operation and GitHub-specific handling, including the native GitHub sub-issue prohibition.
- `00-Management/RULES.md` — human governance and rationale; no competing workflow definition.
- `00-Management/RULES_i18n.md` — canonical VIEPS i18n contributor/governance rules.
- `SKILL.md` — machine/agent execution of the canonical workflows.
- `SKILL_i18n.md` — machine/agent execution of the VIEPS i18n rules.
- `.codex/skills/*` — specialized operational procedures referencing the canonical workflows.
- `KNOWLEDGE.md` — durable knowledge, decisions, and lessons learned; not workflow authority.

If any secondary document conflicts with `WORKFLOWS.md`, follow the canonical workflow and raise an Issue to correct the conflicting secondary document. If the canonical workflow itself is ambiguous, stop the affected decision and obtain the required clarification.
