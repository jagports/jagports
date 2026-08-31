# Jagports Development Knowledge

## Human testing

### Human–automation testing model

Use this model for repeatable tests of any feature, workflow, automation, or GitHub behavior.

1. **Human defines the observable goal.** State what the human should do and what visible/functional result proves success.
2. **Automation performs deterministic work.** Use workflows, scripts, APIs, or agents for repeatable mechanical operations.
3. **Human verifies the result.** UI state, behavior, usability, or other facts requiring real-world observation must be checked by a human.
4. **Record the result in GitHub.** The Issue/PR and checks should provide the durable test record.

Automation must not be treated as proof of a human-observable result merely because the implementation appears correct.

### Behavioral testing

Human test instructions should be short, concrete, and action-oriented.

A useful test item normally contains:

- **Where:** an exact URL, screen, branch, file, command, or other starting point.
- **What:** one specific action the human performs.
- **Expected:** one observable result that determines pass/fail.

Prefer several small tests over one long procedure. Each checkbox should represent one independently verifiable result.

Use this form when writing human tests:

- [ ] Open `<exact location>`.
- [ ] Perform `<one specific action>`.
- [ ] Confirm `<specific observable expected result>`.

### Functional testing

Test the complete behavior, not merely the implementation.

- Prepare a known input/state.
- Perform the intended operation.
- Verify the resulting state/output against an explicit expected result.

When automation changes metadata, permissions, labels, workflow state, files, or other repository state, verify the resulting state through the same interface a human normally uses.

Do not manually repair the expected result before verification. Doing so can make an automation test appear successful when automation actually failed.

### Technical test-environment preparation

When a test requires a branch, PR, file, record, or other temporary object, prepare it explicitly and verify the test starting state before handing it to the human.

For a GitHub PR-creation test:

1. Create a fresh branch from the intended current base.
2. Make a harmless but real file change so the branch differs from the base.
3. Verify the exact branch has **zero existing PRs**, including closed PRs when relevant to the test.
4. Verify the compare URL points to that exact branch.
5. Give the human the PR-creation URL only after these checks pass.

Never infer that a branch is unused from its name. A compare URL may open an existing PR if the branch has already been used.

If the workflow under test must be available on the target/default branch, deploy that workflow first and test it separately from its deployment PR.

### Repository metadata and automation

GitHub labels are repository-level metadata. They are not files stored in a branch. Therefore a label can exist independently of the branch containing the workflow or source change.

Category labels should remain metadata and must not be confused with Kanban Status, Priority, ordering, or other workflow fields unless that behavior is explicitly designed and tested.

For automatic metadata tests:

- The human supplies the intended input/convention.
- Automation performs the metadata operation.
- The human verifies the resulting metadata.
- Do not manually apply the expected metadata before verification.

### Workflow and human verification

GitHub Actions is suitable for deterministic validation and repository automation. Human verification is still required when success depends on an observable GitHub UI result or human judgment.

A robust workflow is:

**human action → automated processing → automated check → human observation → recorded result**

Use automated checks for repeatability and humans for the parts that automation cannot reliably establish, such as visible UI state, practical usability, or whether instructions are understandable to the intended operator.

### Failure and warning handling

Distinguish failures from warnings.

- A failed check or incorrect functional result is a test failure.
- A warning that does not fail the check must be recorded as a technical warning, not reported as a successful absence of problems.
- Deprecation warnings should be tracked as maintenance work when they do not affect current functionality.

When a test exposes a failure, correct the implementation, then repeat the affected test from a clean starting state. Do not simply change the test expectation to accommodate the failure unless the requirement itself has intentionally changed.

### Test evidence

Record enough information to reproduce the test without relying on memory.

Useful evidence includes:

- exact branch/ref;
- exact file or configuration change;
- exact PR/Issue URL;
- exact title/input used;
- automated check result;
- human-observed result;
- whether any manual intervention occurred.

Branch preparation alone is **not** human-test evidence. Source-code inspection alone is **not** human verification of a UI result.

### Cleanup

Temporary test Issues, branches, files, and PRs should be removed or closed after testing when they no longer have a purpose.

Before deleting a temporary branch, verify that no active PR depends on it. Keep a cleanup record when deletion cannot safely be automated.

Do not reuse closed test Issues as current test instructions. Create a fresh test environment when the starting state matters.

### Lessons from category-label testing

The category-label work established these reusable rules:

- Workflow deployment and workflow behavior testing may need to be separate activities.
- A maintenance operation can require an explicit automation exemption when it does not use the normal category convention.
- A clean PR test needs both a real branch difference and verification that no PR already uses that branch.
- Human testing is strongest when the test is granular enough for a simple checkbox pass/fail decision.
- Category metadata can support automation without changing the Kanban workflow.
