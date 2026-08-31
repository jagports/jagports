# SKILL — Jagports AI OS Operational Rules

## Mandatory Start-of-Work Procedure

Before doing any Jagports work:

- Verify GitHub access.
- Read the current `SKILL.md` from the repository.
- Follow its rules.
- Verify that the GitHub operations needed for the particular task are available.
- Confirm that the requested work has a corresponding GitHub Issue before substantive work begins.
- If an operation required by the SKILL is unavailable, give the exact alert:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

- Never claim that an action was performed without verification.

## Repository Change Gate

Every repository modification is subject to the mandatory Repository Change Gate. This applies before changing documentation, configuration, templates, scripts, source code, or any other repository file. There are no exemptions for documentation-only, small, trivial, cleanup, or seemingly low-risk changes.

Before making any repository modification, the agent must complete the following controlled workflow:

1. Identify the GitHub Issue that authorizes and describes the requested work. If no suitable Issue exists, create the required Issue before making the repository modification.
2. Verify that a dedicated branch exists from the appropriate base branch. Create one when necessary.
3. Make all repository modifications only on that dedicated branch. Never modify `main` directly.
4. Open a Pull Request from the dedicated branch to the appropriate base branch. The PR description must contain `Closes #<issue-number>` for the Issue implemented by the PR.
5. Update the GitHub Project/Kanban item status to the workflow state that reflects the actual current phase of the work, and verify that the update succeeded. Project/Kanban status changes are part of execution, not optional documentation.
6. Request the required review and wait for the required review/approval.
7. Do not merge the Pull Request until the required review has been independently verified as approved.
8. Merge the approved Pull Request through the controlled GitHub workflow.
9. After the merge, verify the resulting repository state, Pull Request state, Issue state, and relevant GitHub Project/Kanban state.

The Repository Change Gate is a hard process requirement, not guidance. The existence of a simple or urgent change does not permit bypassing the Issue → Branch → PR → Review → Merge workflow.

### Direct-Main Change Recovery

A direct change to `main` is a process violation. It must not be accepted as normal work or treated as an exemption from the Repository Change Gate.

When a direct-main change is detected:

1. Stop further repository modifications until the violation is assessed.
2. Document the violation and identify the affected commit, files, and intended GitHub Issue.
3. Create or identify the corrective Issue if one does not already exist.
4. Restore the required controlled workflow by moving the intended change onto a dedicated branch based on the appropriate repository state.
5. Open a corrective Pull Request linked with `Closes #<issue-number>` and subject it to the normal required review and approval process.
6. Do not declare the violation resolved until the corrective Pull Request, repository state, Issue state, and relevant Kanban state have been verified.
7. Record the recovery and resulting decision in the appropriate project knowledge record when project history or process knowledge is affected.

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

## Work Category Subject Prefixes and Labels

Persistent work records that represent a primary category must use exactly one of these human-readable subject prefixes:

- `SKILL /` — skills, operating instructions, reusable procedures, or automation rules.
- `AGENT /` — agent behavior, roles, discovery, delegation, or hand-off.
- `KNOWLEDGE /` — project/product knowledge, documentation, research, decisions, or requirements.

Each prefix has a corresponding GitHub label used as machine-readable metadata:

- `SKILL /` ↔ `category:skill`
- `AGENT /` ↔ `category:agent`
- `KNOWLEDGE /` ↔ `category:knowledge`

Use the same primary category on the implementing Issue and its Pull Request. If work spans multiple categories, select one primary category for the prefix and label and document secondary impacts in the record body.

The category label and subject prefix are complementary: the label is machine-readable classification and the prefix provides human-visible traceability. Category is metadata only and must remain independent of the GitHub Project/Kanban. Category must not create or alter Project Status, Priority, ordering, or workflow states.

The repository GitHub Actions workflow `.github/workflows/validate-category-conventions.yml` validates the prefix/label relationship for Issues and Pull Requests. Automated validation does not replace human review.

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

- Add the Issue to the GitHub Project immediately. The agent must perform this Project operation explicitly.
- Set the **Project Item Status** to `BACKLOG` when the Project item is created. Do not assume that GitHub automatically assigns this status.
- Independently verify that the Project item exists and that its **Project Item Status** is `BACKLOG`.
- After successful verification, communicate the result in the Issue's persistent GitHub record, including that the Issue was added to the Project and its initial **Project Item Status** is `BACKLOG`.
- If the Project add or **Project Item Status** operation cannot be performed or verified, report the limitation immediately and do not claim that the Project setup succeeded.
- Do not assume a new Issue has a workflow state until it has been added to the Project and the **Project Item Status** has been verified.
- When actual work starts, the first substantive work comment or work action marks the transition from `BACKLOG` to `RESEARCH` unless another workflow state is explicitly appropriate.
- Subsequent **Project Item Status** changes must be made when the task actually enters the corresponding workflow phase.
- **Project Item Status** changes are part of the task execution, not optional documentation.
- During Review, verify that the **Project Item Status** has been implemented and matches the task's actual current workflow state.
- A task must not be considered correctly reviewed if its **Project Item Status** is missing, stale, or inconsistent with the work performed.

If a **Project Item Status** update cannot be performed:

- Add a temporary Issue comment documenting the intended **Project Item Status** and the reason the Project update could not be performed.
- Include the expected state, for example:

`Project Item Status: BACKLOG (waiting for Project item creation/update)`

- Do not represent the intended state as the actual **Project Item Status**.
- The **Project Item Status** and Issue state must be synchronized as soon as the required Project operation becomes available.

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
- The alert must begin exactly with:

`*** !!! ALERT - GitHub functions unavailable !!! ***`

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
- Merge to the repository's current default branch only after validation and required review.
- Never treat GitHub's `mergeable` state as evidence that the required review has occurred.
- Before merging, independently verify that the required review/approval exists. If it cannot be verified, do not merge.

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

Do not attribute an unverified motive to the platform, provider, or system. The agent must report observable capability or permission limitations rather than speculate about why the platform/provider/system works that way.
