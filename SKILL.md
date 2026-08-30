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
- Verify the PR description links the correct Issue.

## GitHub Issue Closing Syntax

Always use GitHub issue linking notation.

Correct:

Closes #123

Incorrect:

Closes 123
Closes Issue 123
Closes P2.3

The `#IssueNumber` format is required so GitHub links the Pull Request and Issue.

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
