# GitHub Actions Runner Cost Guidance

## Why this matters

GitHub Actions runner choices directly affect both execution cost and included-minute consumption. Do not run an operating-system matrix unless the behavior under test is actually platform-dependent.

For the Parts Model integrity workflow, the same Node.js/SQLite/model test suite was being executed on both Ubuntu and Windows even though the acceptance behavior was not Windows-specific. That duplicated validation without adding meaningful coverage.

## How the unnecessary cost was detected

The issue was identified after GitHub Actions usage reached roughly 2,000 minutes in about one week and generated additional billed usage. Inspection of `.github/workflows/integrity_parts-model.yml` showed an explicit matrix:

`os: [ubuntu-latest, windows-latest]`

That matrix scheduled two equivalent jobs per applicable workflow run. Review of the test scope showed no Windows-specific requirement.

## Optimization rule

When Actions usage or cost rises unexpectedly:

1. Inspect workflow trigger frequency and job matrices before assuming the test suite itself is expensive.
2. Remove OS dimensions that do not correspond to a real platform-specific requirement.
3. Prefer one Linux runner for platform-independent Node.js, model, schema, migration, and API validation.
4. Preserve multi-OS validation only when a supported product, deployment target, filesystem behavior, shell behavior, or other acceptance criterion is OS-specific.
5. Verify the optimization with a real workflow run and confirm the number and labels of jobs actually scheduled.

## Verified Parts Model result

Issue #578 / PR #579 changed the Parts Model integrity workflow to one `ubuntu-latest` job. Validation run `34652324993` scheduled exactly one Parts Model job named `model`, labeled `ubuntu-latest`, and it completed successfully.

This removes the duplicated Windows runner from every applicable Parts Model integrity run while preserving the existing Node.js 24 test behavior.
