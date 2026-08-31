# SKILL — Jagports AI OS Operational Rules

## Git Branch Rules

- Always create and work on a branch.
- Never commit directly to `main`.
- Every change must be isolated in a branch.
- Every branch must have a clear purpose.
- All changes merge through Pull Requests.

Branch examples:

- feature/<name>
- fix/<name>
- docs/<name>
- pN.N-<description>

Before creating a Pull Request:

- Verify the base branch.
- Verify the head branch.
- Verify the PR description links the correct Issue number.
- Confirm that the Issue being closed is the exact Issue implemented by the PR.

## SKILL and Project Knowledge Change Control

A requested change to `SKILL.md` must first be recorded in a dedicated GitHub Issue describing the requested change.

Before implementing a requested SKILL change:

1. Create the dedicated GitHub Issue.
2. Add the Issue to the GitHub Project immediately.
3. Set its initial Project Status to `BACKLOG`.
4. The first substantive work action moves the Project Status to `RESEARCH`.
5. Perform the research and define the exact change.
6. Implement the change on a dedicated branch.
7. Open a Pull Request linked to the Issue.
8. Move the Project Status to `REVIEW` when the implementation is ready for review.
9. Do not merge or mark the Issue `DONE` until the review and subsequent workflow gates are completed.

The Issue is the system-of-record for the requested SKILL change and must remain traceable to the implementation branch and Pull Request.

The same controlled workflow must be used for substantive additions or changes to project-specific `KNOWLEDGE.md` when they are requested as project work. Knowledge changes must not bypass the Issue-based work record.

If the required GitHub Project operation is unavailable to the current agent session, the agent must disclose that limitation immediately and must not claim that the Issue was added to the Project or that its Project Status was changed.

## GitHub Issue Closing Syntax

Every Pull Request that completes a GitHub Issue must link to the Issue it closes.

Always use GitHub issue closing notation:

Correct:

Closes #123

Incorrect:

Closes 123
Closes Issue 123
Closes P2.3

The `#IssueNumber` format is required because it creates the PR ↔ Issue relationship in GitHub.

Purpose:

- Links implementation work to the original task.
- Allows GitHub to automatically close the Issue after the Pull Request is merged.
- Maintains traceability between Kanban task, Issue, Pull Request, review, and completion.

## PR Merge Closing Rules

When merging a Pull Request that closes an Issue:

- The PR description must contain the closing reference before merge.
- The merge review/comment should explicitly state which Issue is being closed.
- Use the exact Issue number, not only a task identifier.

Example merge comment:

This PR closes Issue #123.
The implemented task is tracked by GitHub Issue #123.

Do not write:

This closes P2.3.

because GitHub cannot automatically link a task name to an Issue.

## PR Commenting Lessons Learned

- Do not reference only task names such as P2.3 in PR closing comments.
- Always search and confirm the actual GitHub Issue number before writing closing references.
- PR reviews and comments should identify the exact Issue number when explaining what was completed.
- If a closing reference was incorrect, add a correction comment with the actual `Closes #<issue-number>` reference.
- After merge, verify that the intended Issue was closed and linked correctly.

## GitHub Project Issue Management Rules

When creating a new GitHub Issue that belongs to the project:

- Add the Issue to the GitHub Project immediately.
- Initial Project Status must always be `BACKLOG`.
- Do not assume a new Issue has a workflow state until it has been added to the Project.
- After adding the Issue to the Project, update the Status field according to the actual workflow state.

If automatic Project Status updates are not available:

- Add a temporary Issue comment documenting the intended Project Status.
- Include the expected initial state, for example:

`Project Status: BACKLOG (waiting for Project item creation/update)`

The Project Status and Issue state must remain synchronized.

## GitHub API Rules

- Add a minimum 1 second delay between GitHub API calls.
- Avoid unnecessary repeated API calls.
- Use verification after mutations.

## GitHub Access Availability

Before starting work that requires GitHub, verify that GitHub access is actually available in the current agent session.

Check both:

- Repository access to the required repository.
- Availability of the specific GitHub operation needed for the requested action, such as reading files, editing files, creating branches, creating PRs, commenting on Issues, or changing Project fields.

If GitHub access or the required operation is unavailable:

- Alert the user immediately and state the limitation clearly.
- Do not silently continue as if the GitHub action was performed.
- Do not repeatedly retry an unavailable operation.
- Do not ask the user to paste commands or perform the missing GitHub operation merely to compensate for the agent's unavailable capability.
- Explain what can be completed with the capabilities currently available and what remains blocked.

Do not confuse GitHub account/repository permission with agent tool availability. Verify the actual capability before claiming that an action can be performed.

## User Command Requests

If the user explicitly asks for commands:

- Provide the commands together in one Markdown code block so they can be pasted to the console as a batch.
- Do not split the requested command sequence into multiple code blocks unless the user explicitly asks for separate batches.
- Do not propose creating a script and asking the user to run it when direct commands are sufficient.
- Do not ask the user to paste command output back merely because the agent could not execute the command itself; first determine whether a suitable GitHub or other execution tool is available.

When later commands depend on output from earlier commands:

- Make the earlier commands save the required result to a temporary file in the working directory.
- Make later commands read that temporary file.
- Every successful command sequence must remove its temporary files when they are no longer needed.
- Ensure cleanup does not occur before dependent commands have successfully consumed the temporary data.

## Windows Git Bash Command Compatibility

Commands intended for the project's Windows Git Bash environment must respect the established compatibility constraints.

Before giving commands to the user, verify that the command sequence does not depend on known unsupported or unreliable constructs in this environment, including:

- `awk`
- Bash associative arrays
- backslash (`\\`) line continuations
- Windows path separator (`\\`) assumptions in shell paths

Use Git Bash-compatible forward-slash paths and simple shell constructs. Prefer commands that have already been verified in this project. If a command or syntax has not been verified, use a simpler compatible alternative or explicitly state the uncertainty before asking the user to run it.

## Navigation URL Rules

When giving the user step-by-step instructions for navigating a web UI, provide a direct URL to the relevant page whenever a stable, known URL can be determined.

Do not make the user manually navigate through multiple menus when the target page can be opened directly.

For example, instead of:

- Open the repository: `jagports/jagports`
- Settings
- Left sidebar → Rules → Rulesets

provide the direct repository Settings → Rules URL when that is the intended destination:

https://github.com/jagports/jagports/settings/rules

Rules:

- Prefer direct URLs to the exact target page.
- Use the repository's actual name and path; do not invent URLs.
- If a direct URL is unavailable or uncertain, give the UI navigation path instead.
- When using a URL in a normal ChatGPT response, use the platform's URL-link format rather than displaying a raw URL unless the user explicitly asks for raw URLs.

## Pull Request Rules

- PRs are the required integration path.
- Review changes before merging.
- Merge to `main` only after validation.

## Separation of Responsibilities

SKILL.md:
- Reusable procedures
- Commands
- Workflow rules
- Compatibility requirements
- Validation requirements

KNOWLEDGE.md:
- Project history
- Confirmed decisions
- Environment-specific findings
- Current implementation state

## Capability Failure Detection and Disclosure

Before attempting an external action, verify that the required tool operation is available and that the current authorization is sufficient.

If a requested action cannot be completed:

- State the verified limitation directly.
- Distinguish unavailable tool capability from insufficient permission, authentication failure, unavailable integration, or technical failure.
- Do not repeatedly retry an unsupported operation without explaining why.
- Do not claim completion without verification.
- Provide the available alternative or required next step.

When an answer is materially limited by unavailable execution capability, use explicit wording such as:

`Limitation: my answer is affected because the required execution capability is unavailable in this session.`

Do not attribute an unverified motive to the platform, provider, or system. The agent must report observable capability or permission limitations rather than speculate about why they occurred.
