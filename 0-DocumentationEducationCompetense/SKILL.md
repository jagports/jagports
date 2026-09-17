# SKILL — Jagports AI OS Operational Rules

## Canonical Management Workflow

The normative Management workflows are defined in [`00-Management/WORKFLOWS.md`](00-Management/WORKFLOWS.md).

`SKILL.md` is the machine/agent execution layer. It must execute and reference the canonical workflows and must not independently redefine them.

**Mandatory work-request precedence:**

**OPEN search → HISTORICAL CLOSED/MERGED search → verify claimed result → valid = no duplicate / insufficient or obsolete = active work / uncertain = clarification → only then create new work.**

Detailed GitHub execution rules are defined in [`6-Development/github/GITHUB_OPERATING_RULES.md`](../6-Development/github/GITHUB_OPERATING_RULES.md).

GitHub Project/Kanban-specific workflow behavior is defined in [`6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md`](../6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md).

The current ChatGPT/GitHub Project capability boundary is defined in [`6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`](../6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md).

GitHub connection capability knowledge is maintained in [`6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md`](../6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md).

### Dedicated i18n execution skill

For VIEPS UI/application changes that create, modify, review, or refactor human-visible text, apply [`SKILL_i18n.md`](SKILL_i18n.md) in addition to this general execution skill.

`SKILL_i18n.md` implements the governance rules in `00-Management/RULES_i18n.md`, including mandatory changed-code scanning for hard-coded localizable strings and EN↔FI resource maintenance.

## Current ChatGPT/GitHub Project capability boundary

Execution rule for this current ChatGPT/GitHub connection:

`Project management/read capability is unavailable through this connection; no Project operation or Project state is claimed.`

Do not attempt Project management, Project View reads, Project Item reads, Project Item Status reads, Project mutations, Project transitions, Project archive/unarchive operations, or Project field/view/option management through this connection.

Then continue only repository, Issue, PR, review, commit, check, comment, and file operations that are available and independently verifiable through this connection.

## Mandatory Start-of-Work Procedure

Before doing Jagports work:

1. Verify GitHub repository access when GitHub work is requested.
2. Read the current `SKILL.md` and the canonical `00-Management/WORKFLOWS.md`.
3. For GitHub Issue, PR, review, branch, merge, test-evidence, record-integrity, field, label, or comment work, apply `6-Development/github/GITHUB_OPERATING_RULES.md`.
4. For GitHub Project/Kanban work, apply `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` and the current capability boundary in `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.
5. Verify that the operations required for the task are available before relying on them.
6. Resolve the work identity using the canonical discovery workflow before substantive repository modification.
7. Never claim an external action without verification.

If a required GitHub operation is unavailable, follow `6-Development/github/GITHUB_OPERATING_RULES.md` and applicable capability-alert wording.

For unavailable Project operations, do not retry unsupported calls. Use the required Project capability reporting sentence instead.

## Work-Request Execution

For every request, regardless of requester type:

1. Apply the work-request precedence in `00-Management/WORKFLOWS.md`.
2. Apply GitHub-specific Issue/PR/review/merge/record rules from `6-Development/github/GITHUB_OPERATING_RULES.md`.
3. Apply Project/Kanban rules from `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` only where Project access is available to the actor/tool.
4. Respect the current ChatGPT/GitHub Project capability boundary in `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.
5. Once identity and scope are resolved, proceed automatically without unnecessary confirmation until the applicable review, authority, capability, or completion boundary is reached.

## Repository Change Gate

Every repository modification follows the controlled path in `00-Management/WORKFLOWS.md` and the GitHub implementation rules in `6-Development/github/GITHUB_OPERATING_RULES.md`.

Do not modify `main` directly. All repository changes go through a dedicated branch and PR unless a canonical emergency/correction workflow explicitly says otherwise.

## Review, Testing, Merge, and Record Integrity

Review, testing, approval, merge, checkbox handling, PR closing syntax, review-conversation handling, line-specific review replies, and historical-record integrity are GitHub-specific execution topics.

Use `6-Development/github/GITHUB_OPERATING_RULES.md` as the detailed source for those rules.

Before merge, the effective gate remains:

`Issue Acceptance all [x] + PR required checklist all [x] + required tests PASS + independent review APPROVED → merge permitted`

Never treat technical mergeability as approval.

## GitHub API Rules

For GitHub operations:

- avoid unnecessary repeated GitHub/API calls;
- follow the project's current GitHub API pacing rule for operational sequences;
- reduce request frequency or follow provider-directed retry/backoff when an observable constraint exists;
- verify supported non-Project mutations with an independent read;
- never expose credentials, tokens, or secret values.

Do not attempt Project management, Project reads, Project View reads, Project Item reads, Project Item Status reads, Project mutations, Project transitions, Project archive/unarchive operations, or Project verification through this connection.

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
- `6-Development/github/GITHUB_OPERATING_RULES.md` — GitHub Issue, Pull Request, review, merge, testing-evidence, record-integrity, and GitHub field/label operating rules.
- `6-Development/github/Projects/GITHUB_PROJECT_WORKFLOWS.md` — scoped canonical GitHub Project/Kanban workflows incorporated by reference from `WORKFLOWS.md`.
- `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` — current ChatGPT/GitHub Project capability boundary.
- `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md` — GitHub connection and environment knowledge.
- `00-Management/RULES.md` — human governance and rationale; no competing workflow definition.
- `00-Management/RULES_i18n.md` — canonical VIEPS i18n contributor/governance rules.
- `SKILL.md` — machine/agent execution of the canonical workflows.
- `SKILL_i18n.md` — machine/agent execution of the VIEPS i18n rules.
- `.codex/skills/*` — specialized operational procedures referencing the canonical workflows.
- `KNOWLEDGE.md` — durable knowledge, decisions, and lessons learned; not workflow authority.

If any secondary document conflicts with `WORKFLOWS.md`, follow the canonical workflow and raise an Issue to correct the conflicting secondary document. If the canonical workflow itself is ambiguous, stop the affected decision and obtain the required clarification.
