# SKILL — Jagports AI OS Operational Rules

## Canonical Management Workflow

The normative Management workflows are defined in [`00-Management/WORKFLOWS.md`](00-Management/WORKFLOWS.md).

`SKILL.md` is the machine/agent execution layer. It must execute and reference the canonical workflows and must not independently redefine them.

**Mandatory work-request precedence:**

**OPEN search → HISTORICAL CLOSED/MERGED search → verify claimed result → valid = no duplicate / insufficient or obsolete = active work / uncertain = clarification → only then create new work.**

The canonical workflow also defines the controlled lifecycle, Project Item Status verification, Repository Change Gate, review/testing boundaries, record integrity, title-change exception, and conflict handling.

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
- Required review and testing gates must pass before merge.
- Never treat GitHub's `mergeable` state as proof of review or approval.
- After merge, verify repository, PR, Issue, and Project state.

A direct-main change is a process violation and requires corrective handling under `WORKFLOWS.md`.

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
- set Project Item Status to `REVIEW` and independently verify it;
- stop implementation and do not merge after hand-off.

Do not invent a separate GitHub PR status such as `Waiting for Review`. GitHub's native review request/notification and review outcome are the review mechanism.

Required human validation follows:

**PR branch → pre-merge test → PASS evidence → review/merge gate → merge → optional post-merge smoke/regression test**

A post-merge test cannot substitute for required pre-merge validation. `FAIL`, `BLOCKED`, or `NOT TESTED` is not successful required pre-merge validation.

## Record Integrity and Active Title Changes

Follow `00-Management/WORKFLOWS.md` for the canonical rules.

- Never modify descriptions or comments of closed Issues or merged PRs.
- An open Issue or open PR may have its title changed when scope materially changes.
- Such title changes are auditable through GitHub's `renamed` history event.
- Cosmetic title changes should be avoided.

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

- Maintain a minimum 0.33-second delay between GitHub API calls in Jagports operational sequences.
- Avoid unnecessary repeated calls.
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

## Separation of Responsibilities

- `00-Management/WORKFLOWS.md` — canonical normative Management workflows.
- `00-Management/RULES.md` — human governance and rationale; no competing workflow definition.
- `SKILL.md` — machine/agent execution of the canonical workflows.
- `.codex/skills/*` — specialized operational procedures referencing the canonical workflows.
- `KNOWLEDGE.md` — durable knowledge, decisions, and lessons learned; not workflow authority.

If any secondary document conflicts with `WORKFLOWS.md`, follow the canonical workflow and raise an Issue to correct the conflicting secondary document. If the canonical workflow itself is ambiguous, stop the affected decision and obtain the required clarification.
