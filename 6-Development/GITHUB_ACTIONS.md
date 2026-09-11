# GitHub Actions Development Knowledge

## Scope

This file records durable development knowledge about GitHub Actions design, trigger selection, verification, and usage control in Jagports.

## 2026 category-convention trigger amplification incident

Issue #574 was opened after repository Actions history showed that a small metadata-validation workflow had become the dominant source of workflow executions.

At the investigation snapshot there were **2,035 repository workflow runs**. The two dominant workflows accounted for **2,001 runs (98.3%)**:

- `Validate category conventions`: **1,600 runs** — **869 `issues` events + 731 `pull_request` events**.
- `Sync Issue Lifecycle to Project`: **401 runs** — all `issues` events.

The lifecycle workflow was already narrowly scoped to `issues: [opened, closed, reopened]`. The amplification problem was therefore concentrated in `.github/workflows/validate-category-conventions.yml`.

The category workflow originally listened to:

```yaml
on:
  issues:
    types: [opened, edited, labeled, unlabeled]
  pull_request:
    types: [opened, edited, labeled, unlabeled, synchronize]
```

This was much broader than the behavior being protected. Category classification depends on an Issue/PR title prefix and the matching category label. The broad trigger set caused avoidable execution:

1. PR `synchronize` fired on every pushed commit even though code changes do not affect category classification.
2. `edited` fired for body-only edits even though only title changes affect the category mapping.
3. `labeled` and `unlabeled` could fire after label mutations, including labels changed by the category workflow itself, creating self-amplifying metadata activity.

PR #575 changes the workflow to listen only to `opened` and `edited`, with the job gated so an `edited` event allocates work only when `github.event.changes.title` exists.

The GitHub Actions timing API returned zero billable milliseconds for sampled runs even when runs had measurable wall-clock duration, so historical workflow-run counts are the reliable evidence used here. Do not treat those API timing fields as an exact per-workflow billing ledger unless GitHub exposes a verified usage source.

## Durable trigger-design rules

For GitHub Actions workflows in Jagports:

1. **Trigger only on state that can change the invariant being validated or synchronized.** Do not subscribe to convenient broad events when the workflow only depends on a narrower field or transition.
2. **Do not use PR `synchronize` for metadata-only validation** unless the check genuinely depends on the new head SHA or repository contents.
3. **Gate broad `edited` events by the changed field** when only a specific field matters. For title-driven behavior, inspect `github.event.changes.title` before allocating a runner job.
4. **Avoid trigger/write feedback loops.** A workflow that writes labels, comments, metadata, or other state should not normally subscribe to the same mutation event unless recursion/retrigger behavior is intentionally required and bounded.
5. **Use path filters for code/data checks** when only a defined repository area can affect the result.
6. **Treat Actions usage as a finite development resource.** A short job can still consume significant quota when it is invoked hundreds or thousands of times.
7. **Verify negative behavior as well as positive behavior.** For an optimized workflow, test that relevant events still run and that irrelevant events do not allocate a runner job.
8. **Check required-check/ruleset consequences before removing head-SHA triggers.** If a workflow is a required PR check, removing `synchronize` may require a corresponding branch/ruleset design change so merging is not blocked by a stale required check.
9. **Record the exact workflow run/event when execution evidence matters.** Source inspection alone does not prove that the intended real event executed or that an irrelevant event was suppressed.

## Regression pattern for metadata workflows

When changing a metadata-driven workflow, compare at least these representative events where applicable:

- open Issue;
- edit Issue body;
- edit Issue title;
- add/remove Issue label;
- open PR;
- push PR commit;
- edit PR body;
- edit PR title;
- add/remove PR label.

For every case, record whether the expected result is **run**, **skipped/no runner**, or **no workflow run**. This makes event amplification visible before it accumulates into quota exhaustion.

## Traceability

- Issue #574 — `GitHub Actions / Reduce category-convention trigger amplification and Actions-minute usage`
- PR #575 — `GitHub Actions / Reduce category workflow trigger amplification`
