# Import Tasks Work Record

Issue: #336
Branch: `import-tasks`

This file records the repository-side work for importing the current Jagports AI OS task hierarchy as GitHub Issues and native parent/sub-issues, and for verifying their representation in the authoritative GitHub Project/Kanban.

The implementation must follow `KNOWLEDGE.md` and the applicable `00-Management` rules. Historical Issue #7 is evidence only and must not be reused as the active work record.

## Scope

- Verify the current task source before creating Issues.
- Discover existing open and historical Issues before creating anything, avoiding duplicates.
- Represent the current task hierarchy with GitHub Issues and native sub-issue relationships where supported.
- Verify Project Items and workflow Status independently after Project mutations.
- Keep repository changes isolated to `import-tasks`; merge only through review of the resulting PR.

## Review gate

This change is intentionally small and documentation-only. The actual Issue/Project import is an external GitHub state operation and must be verified separately from this repository commit.

## Traceability

- Active work Issue: #336
- Historical import verification: #7 (do not reuse)
- Related knowledge cleanup: #315
