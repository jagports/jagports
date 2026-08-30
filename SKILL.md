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

## GitHub API Rules

- Add a minimum 1 second delay between GitHub API calls.
- Avoid unnecessary repeated API calls.
- Use verification after mutations.

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
