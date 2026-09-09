# Jagports AI OS Commands

## Authority

This is a specialized command-semantics procedure for short Jagports AI OS commands. It references the canonical Management workflow and does not redefine it.

Before executing a command, process the repository-root `KNOWLEDGE.md`, then the applicable `00-Management/WORKFLOWS.md`, `SKILL.md`, communication protocol, and task-specific procedure as required by the repository hierarchy.

## Command principle

A short AI OS command identifies the intended operation. It must not require the user to repeat workflow rules, authorization already established by the session/repository, verification requirements, or completion criteria already defined by authoritative repository sources.

The command executor determines the current task state and next valid action from the repository, GitHub records, applicable workflow, and current session context.

Routine intermediate states are not reasons to stop when the requested command means continuation toward a defined workflow boundary.

## `@open`

`@open <target>` means open and process the identified Jagports work item or resource using the applicable repository workflow.

Resolve the target from the supplied identifier and current repository state. Do not ask the user to restate information that can be obtained from the target record or governing documentation.

## `@implement`

`@implement <target>` means implement the identified work according to the applicable Issue/PR scope and repository workflow.

Resolve implementation details from the Issue, review history, repository state, governing documentation, and existing work. Proceed automatically through routine implementation steps without unnecessary confirmation.

When review is required, stop at the canonical review boundary and hand off for independent review. Do not merge before the required review approval is present.

## `@continue`

`@continue [<target>]` means continue the current work from its actual state.

- If a target is supplied, use that target as the work identity.
- If no target is supplied, use the current conversation's active work identity.
- Re-read the current task state rather than assuming the previous intermediate result is still current.
- Determine the next action from the applicable canonical workflow and current records.
- Continue through routine intermediate actions automatically.
- Do not stop merely to report an intermediate state when the requested work can continue.
- Continue until the applicable workflow completion boundary is reached, or until a genuine prerequisite, authority decision, or unavailable required capability prevents further progress.
- If the PR has reached the required reviewed/approved state, `@continue` is permission to proceed with the remaining merge-and-close workflow without requesting another user confirmation.
- Before merging, verify the current PR review state and that no unresolved required review condition prevents merge. Do not infer approval from an old or superseded review.
- Before closing the work, add the required completion comments to both the Issue and PR, preserving Issue/PR traceability and repository rules.
- Merge the approved PR according to the canonical workflow. A successful merge closes the PR; then close the linked Issue when its completion conditions are satisfied.
- After merge/close, independently verify the resulting PR and Issue states to the extent the current GitHub connection supports them. Do not claim verification that the connection cannot perform.
- If review is required but approval is absent, stop at the review hand-off boundary and do not merge.
- If review has requested changes, implement the required corrections and return to independent review before merge.

## ChatGPT UI command boundary

These semantics define how a Jagports AI OS agent should interpret equivalent short commands. Repository documentation does not register, create, or modify ChatGPT's UI `@` menu entries. Availability of a command in the ChatGPT interface is controlled by the interface/app configuration.

## Completion and reporting

Use the canonical workflow's completion conditions. Do not invent command-specific completion states.

When the command reaches its applicable stopping boundary, report the actual result, verification evidence, remaining genuine blocker if any, and the relevant Issue/PR link. Do not claim work beyond the verified boundary.
