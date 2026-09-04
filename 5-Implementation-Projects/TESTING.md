# Testing — Jagports AI OS

## Purpose

Testing verifies that a change actually works. The default test must be as small and direct as the behavior being changed.

## Default Human Test

For an ordinary PR requiring human verification:

1. **Identify** — open the PR and verify the current PR is the implementation being tested.
2. **Action** — perform the smallest real action that exercises the changed behavior.
3. **Expected** — check the observed result against the expected result.
4. **Record** — add one test result to the PR:
   - `PASS` — expected behavior was observed.
   - `FAIL` — expected behavior was not observed.
   - `BLOCKED` — a required prerequisite prevented execution.
   - `NOT TESTED` — the environment was available, but the behavior was not exercised.

For ordinary tests, **the PR comment is the test record**. Do not create a separate Test Issue.

### Minimum test record

**Action:** <one concrete action>

**Expected:** <one observable result>

**Result:** `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED`

**Evidence:** <short statement, screenshot, log reference, or URL when useful>

## When a Separate Test Issue Is Justified

Create a separate Test Issue only when the test itself is substantial enough to require its own record, such as:

- a large acceptance test;
- multiple independent test areas;
- a complex or reusable fixture;
- repeated executions that need chronological records;
- testing that must remain independently traceable from the PR.

A separate Test Issue is an exception, not the default.

When used, each execution gets a new Test Issue. A closed Test Issue remains historical and is not reused.

## Pre-Merge Gate

Required human validation occurs before merge and uses the implementation proposed by the PR:

**PR → test → PASS evidence → review/merge gate → merge**

Rules:

1. Test the actual PR implementation, not an unrelated `main` version.
2. Record the result on the PR before merge when human verification is required.
3. `FAIL`, `BLOCKED`, and `NOT TESTED` do not satisfy a required pre-merge test.
4. Never claim `PASS` without actually observing the expected result.
5. Post-merge smoke/regression testing is additional evidence and cannot replace required pre-merge testing.

## Automation Testing

When the changed behavior is deterministic and reliably testable by automation, automation should perform that check rather than requiring a human to repeat it.

For event-driven automation, the test must exercise the actual relevant behavior in a safe test path. Configuration inspection alone is not execution evidence.

A human test is required only for behavior that needs human interaction, judgment, or observation that automation does not reliably establish.

## Test Preparation

Prepare only what is necessary to make the test executable. Preparation must not itself perform the behavior being tested.

For a simple test, do not create a separate fixture document or handover procedure unless it is genuinely needed.

## Traceability

Keep the test evidence connected to the implementation:

`Issue → PR → Test result → Review → Merge`

For a normal test, the PR contains the test result. A separate Test Issue adds another record only when its additional independence or complexity is useful.

## Principle

**Test the smallest thing that proves the changed behavior works, record what actually happened, and avoid creating process artifacts that add no testing value.**
