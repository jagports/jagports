# SKILL — Jagports AI OS Operational Rules

## Architecture — Machine Execution View

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
  |                    +--> no suitable Issue --> CREATE Issue
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
  |              +--> no suitable PR --> CREATE PR via Repository Change Gate
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

**Execution invariant:** the executing actor must resolve Issue/PR identity and material scope before repository modification. Once identity and scope are resolved and no clarification is pending, execution proceeds automatically through Implementation Round 1. The actor may be ChatGPT, Claude, Codex, another compatible AI agent, or an authorized human operator.

**Decision precedence:** explicit reference → clear existing Issue/PR reuse → legitimate related-work reuse → clarification when uncertainty remains → creation when no suitable existing item exists.

**Authority note:** `00-Management/RULES.md` contains the human-readable governance architecture. This section is its machine-oriented operational representation; the detailed procedures below are authoritative for execution details and exceptions.

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

## Work-Request Issue and PR Discovery

This workflow applies to every work request, regardless of whether the requester is a human or another agent.

When the requester does not explicitly identify an Issue or Pull Request, treat the request as potentially novel, but do not immediately create a new work item.

### Issue discovery and reuse

1. Search existing **open Issues** for work that may cover the request.
2. If an existing open Issue clearly covers the requested work, use that Issue.
3. A related existing Issue may also be reused when the requested work is a legitimate amendment, extension, follow-up, refinement, or completion of that Issue. Do not create a new Issue merely because the wording of the request differs.
4. If an existing Issue might cover the request but it is uncertain whether the requested work is duplicate, an amendment, or materially separate work, ask the requester for clarification before proceeding.
5. If no suitable open Issue covers the request and no clarification is required, create a new Issue before repository modification.
6. After the Issue has been identified or created, proceed automatically when no further clarification is required.

### Pull Request discovery and reuse

Before creating a new Pull Request, search existing **open PRs** for work implementing the identified Issue or requested change.

1. If an existing open PR clearly implements the requested work, use that PR rather than creating a duplicate PR.
2. If an existing PR is related and can legitimately be extended to implement the requested work, use the existing PR when doing so preserves clear scope and traceability.
3. If an existing PR might be the same work but duplication, scope, or ownership is uncertain, ask the requester for clarification before proceeding.
4. If no suitable open PR exists, create a new PR through the Repository Change Gate.
5. One PR may legitimately implement or resolve multiple Issues when the PR genuinely addresses each Issue. Maintain explicit traceability for every Issue; do not create separate duplicate PRs solely to obtain one-PR-per-Issue structure.
6. Closed PRs and merged PRs may be inspected for historical context, but they are not reusable active PRs.

### Related Issue and PR relationships

An Issue and PR do not need to have a one-to-one relationship.

- An existing Issue can remain the authoritative work record while its scope is amended or extended through the normal Issue workflow.
- A PR can implement multiple Issues when its actual change covers all of them.
- A new Issue is appropriate when the work is materially separate from existing open Issues, not merely because an existing Issue is related.
- When multiple Issues are involved, every Issue must have explicit traceability to the implementing PR.
- Do not modify the description or comments of a **closed Issue** or **merged PR**. Historical records are immutable.

### Issue/PR title change exception

- Changing the title of an **open Issue or open PR** is permitted and does not count as modification of an immutable historical record.
- GitHub records a title change as a `renamed` timeline event with the previous and current title. The change is therefore auditable rather than silently replacing the historical title.
- A title change is **recommended when the scope changes materially**, such as when an Issue is substantially amended or when a PR expands from implementing one Issue to genuinely resolving multiple Issues.
- When the scope changes materially, update the active Issue or PR title so that it accurately represents the current scope and improves traceability.
- Do not change a title merely for cosmetic wording changes when the work scope and identification remain materially the same.
- Closed Issues and merged PRs remain immutable, including their titles.

The human-readable decision architecture is maintained in `00-Management/RULES.md`. The machine-oriented execution architecture at the top of this file is the compact control-flow representation; the detailed rules in this section resolve edge cases and define required behavior.

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
- Do not assume a new Issue has a workflow state until it has been added to the Project and its **Project Item Status** has been verified.
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

`00-Management/RULES.md`:
- Human-readable governance
- Governing principles
- Human-readable architecture and decision chart
- Definitions of ownership and authority
- High-level execution boundary

`SKILL.md`:
- Machine-oriented execution architecture
- Reusable procedures
- Commands
- Workflow rules
- Compatibility requirements
- Validation requirements
- Detailed edge-case and exception logic

`KNOWLEDGE.md`:
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
