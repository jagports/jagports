# Jagports Development Knowledge

## Scope

This file contains durable knowledge specific to development work. Repository-wide `KNOWLEDGE.md` hierarchy and maintenance policy is defined at the repository root; this file should focus on development-specific knowledge.

## Human testing

### General principles

Human testing verifies observable behavior and functional results that cannot be established reliably from implementation inspection alone. Test instructions must be short, explicit, repeatable, and independent of a particular work item or subject.

A good human test defines:

1. **Starting state** — what is already prepared and what the tester should see.
2. **Action** — one concrete action for the human to perform.
3. **Expected result** — one observable result that determines pass/fail.

Do not make the human infer missing steps, reconstruct the test environment, or interpret implementation details unnecessarily.

### Behavioral testing

Test the behavior that a human or external system is expected to observe, rather than merely checking that an implementation exists.

- Define the observable behavior before testing.
- Exercise the smallest realistic action that triggers it.
- Record the actual observed result, including failures or unexpected behavior.

A successful implementation check is not automatically a successful human test. Human confirmation is required when the expected result depends on the user interface, interaction flow, or other human-observable behavior.

### Functional testing

Functional tests verify that a feature performs its intended operation from a realistic starting state.

- Use a controlled and reproducible test state.
- Change or provide only the inputs required by the test.
- Verify the resulting output or state against an explicit expected result.

Do not perform manually an operation that the test is intended to verify as automatic. Otherwise the test may produce a false positive.

### Technical test-environment preparation

When a test requires technical setup, prepare the environment before handing the test to a human.

- Prepare all required files, configuration, data, services, or other prerequisites.
- Use an isolated and reproducible test state when the operation could affect other work.
- Verify prerequisites before giving the human the test instructions.
- Ensure that the test state itself does not perform the behavior being tested before the human starts.

A test environment is preparation, not test evidence. The expected behavior must still be exercised and observed.

### Human + automation workflow

Use humans and automation for the responsibilities each can verify reliably:

1. **Human defines intent** and performs actions requiring human judgment or interaction.
2. **Automation performs deterministic operations** such as validation, metadata handling, or repeatable checks.
3. **Human verifies observable results** where the result requires UI observation, real interaction, or judgment.
4. **The project record captures the request, automated result, review, and human verification.**

Do not substitute implementation inspection for human verification when the test explicitly concerns observable behavior. Conversely, do not require a human to perform repetitive deterministic checks that automation can verify consistently.

### Workflow and automation testing

When a test depends on automation, verify that the automation is available in the execution context and that the tested event actually invokes it.

- Verify the relevant configuration is deployed where it is expected to run.
- Trigger the real event or operation under test.
- Inspect the resulting execution status and output.
- Distinguish warnings from failures according to the acceptance criteria.

The presence of configuration or workflow source code does not prove that the automation executed successfully. Execution evidence is required.

### Test evidence

Test evidence must describe what was actually observed, not what was expected to happen.

- **PASS:** expected behavior was observed.
- **FAIL:** expected behavior was not observed.
- **BLOCKED:** the test could not be executed because a prerequisite was unavailable.
- **NOT TESTED:** the environment was prepared but the behavior was not exercised and verified.

Do not record an unexecuted test as successful merely because the implementation or test environment appears correct.

### Reproducible test instructions and URLs

Any link or navigation instruction supplied for a human test must be checked immediately before it is supplied.

Verify that:

- the destination exists and is accessible;
- it represents the intended starting state;
- it does not unexpectedly open an already-completed or unrelated operation;
- the instructions identify the exact action and expected result.

For any test that depends on a unique resource or isolated state, verify that the resource is actually unique and unused before providing it to the tester.

### Human-test preflight, checklist creation, and handover

The actual GitHub state is the source of truth for human-test preparation. Preparation comments, issue descriptions, branch names, or agent assertions are not evidence that a fixture is ready.

Before creating a human-test Issue:

1. Select a test case that is not duplicate coverage of an already executed or invalidated test.
2. Create or establish the complete isolated fixture required by the test.
3. Verify the actual GitHub state of every required resource, including that unique resources are genuinely unused and that preparation has not already performed the behavior under test.
4. Create the complete human-test checklist only after the fixture passes preflight.
5. Ensure the checklist contains the exact starting state, concrete action, expected result, a checkbox for every executable step, a stop-on-failure rule, and mutually exclusive final result choices.
6. Include a direct URL for every specific GitHub resource the human must open, inspect, modify, or verify.

After creating the human-test Issue, fetch the actual stored Issue content and perform a handover verification:

1. Confirm that the stored Issue contains every required test instruction and direct URL.
2. Confirm that each direct URL resolves to the intended existing resource.
3. Confirm that the linked resource still has the verified starting state.
4. Do not hand the human the test Issue URL until these checks succeed.

If any preflight or post-creation handover check fails, do not present the test as ready. Correct the preparation or record the test as blocked/invalid. Never make the human repair a technical fixture that was supposed to be prepared in advance.

### Cleanup after testing

Temporary test artifacts should be removed after the test cycle when they are no longer needed.

Before deleting a test artifact:

1. Check its current state.
2. Check whether active work still depends on it.
3. Delete only artifacts that are confirmed obsolete.
4. Record what was actually removed when the cleanup itself is part of project control.

Do not silently delete active work or retain obsolete test artifacts merely because they were once used for testing.

### Classification metadata and workflow state

Metadata used to classify work should remain independent of workflow state unless the project explicitly defines an integration between them. A classification mechanism should not silently change status, priority, ordering, ownership, or other work-control information.

## GitHub Project automation credentials

GitHub Project automation that runs in GitHub Actions may require a repository Actions secret containing a credential that can modify the target Project. The Project owner and the automation identity are separate concepts: an organization-owned Project is addressed through the organization, while a dedicated GitHub user can provide the credential used by the workflow.

### Selecting and verifying an automation user

Prefer a dedicated GitHub user for long-lived Project automation rather than a personal administrator account when such an automation identity is available.

Before configuring the workflow credential, verify the intended automation user independently:

1. Authenticate GitHub CLI as the intended automation user.
2. Verify that the account can read the target organization-owned Project.
3. Verify that the account can perform the required Project mutation, such as changing a Project Item's `Status`.
4. Record only the verified capability and account identity in project documentation; never record the credential value.

A token's permission scope alone is not sufficient evidence. The actual Project operation must succeed using the intended automation identity.

### Creating the automation token

Create a dedicated personal access token while authenticated as the selected automation user. Use the minimum permissions actually required by the workflow. The previously verified Project mutation used a token with the `project` scope.

Store the resulting token only as the repository GitHub Actions secret named `PROJECTS_TOKEN`. The secret name is configuration metadata; the token value is the protected secret and must never be written to repository content, workflow files, Issues, Pull Requests, logs, scripts, or chat.

### Project setup checklist

When creating or preparing a GitHub Project for automation, the setup task must include:

1. Identify the Project owner, Project number, and Project name.
2. Verify the required Project fields and option values used by automation.
3. Select a dedicated automation user where appropriate.
4. Verify the automation user's read access to the target Project.
5. Verify the automation user's write access by performing the required Project mutation.
6. Create a dedicated token for that automation user with the minimum required permissions.
7. Store the token as the workflow's `PROJECTS_TOKEN` Actions secret without exposing its value.
8. Verify that the secret exists by name.
9. Run an end-to-end workflow test using a real event and verify the resulting Project Item and Project Item `Status`.
10. Record failures as test evidence and do not claim successful automation until execution and resulting Project state have been verified.
