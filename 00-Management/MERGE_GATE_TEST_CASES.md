# Merge Gate Regression Test Cases

These cases are mandatory checks for the agent's pre-merge decision. They specifically prevent recurrence of PR #364.

## Test 1 — Later CHANGES_REQUESTED blocks earlier APPROVED

Input review history, oldest to newest:

1. `APPROVED`
2. `CHANGES_REQUESTED`

Expected result:

`BLOCKED — STOP — DO NOT MERGE`

An earlier approval must not satisfy the merge gate after a later blocking review.

## Test 2 — Review wording does not authorize merge

Input:

- Current effective review state: `CHANGES_REQUESTED`
- Review comment contains: `Merge files and generalize ...`

Expected result:

`BLOCKED — STOP — DO NOT MERGE`

Interpret the comment as requested implementation work. Do not interpret the word `merge` in the comment as authorization to merge the pull request.

## Test 3 — Requested changes may be implemented, but review remains blocking

Input:

- Current effective review state: `CHANGES_REQUESTED`
- Executor implements the requested changes and pushes a new commit.

Expected result:

`BLOCKED — RETURN TO REVIEW`

The executor does not resolve the reviewer's comments and does not merge. The reviewer must verify the new commit and provide the next valid review outcome.

## Test 4 — Unavailable/ambiguous review state fails closed

Input:

- The executor cannot reliably determine the current review state.

Expected result:

`BLOCKED — STOP — DO NOT MERGE`

Never substitute GitHub's `mergeable` result or an earlier approval for missing review-state evidence.

## Test 5 — Only a passed review gate can proceed to merge

Input:

- Current effective review state is independently verified as passed.
- Required pre-merge testing is independently verified as `PASS`.
- No other required gate is blocking.

Expected result:

`MERGE PERMITTED`

This is the only class of result in which the merge operation may be invoked.

## Regression reference

PR #364 demonstrated the failure mode covered by Tests 1 and 2: a later `CHANGES_REQUESTED` review was followed by a merge because the review comment was interpreted as an instruction to merge/reorganize files. The review state, not the wording of the comment, is the controlling gate.
