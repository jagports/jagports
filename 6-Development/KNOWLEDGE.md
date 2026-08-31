# Jagports Development Knowledge

## Human testing

### General principles

Human testing verifies observable behavior and functional results that cannot be established reliably from source inspection alone. Test instructions must be short, explicit, repeatable, and independent of a particular Issue, PR, branch name, or topic.

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

Functional tests verify that the feature performs its intended operation from a realistic starting state.

- Use a controlled and reproducible test state.
- Change or provide only the inputs required by the test.
- Verify the resulting output or state against an explicit expected result.

Do not manually perform an automated action before testing automation. If a system is expected to apply metadata automatically, leave that metadata unchanged before the test and verify whether automation applies it.

### Technical test-environment preparation

When a test requires a repository branch, file, configuration, or other technical setup, prepare that environment before handing the test to a human.

For a PR-creation test:

1. Create a fresh branch from the current target branch.
2. Make a small, harmless real file change so the branch differs from the target.
3. Verify that the exact branch has **no existing PR** before providing its PR-creation URL.
4. Provide the URL for that exact branch and state precisely what the human should do.
5. Do not reuse a branch that already has an existing or historical PR.

A new-looking branch name is not sufficient evidence that a PR-creation URL is clean. Always verify the actual branch/PR relationship.

### Human + automation workflow

Use humans and automation for the responsibilities each can verify reliably:

1. **Human defines intent** and performs actions requiring human judgment or UI interaction.
2. **Automation performs deterministic operations** such as validation, metadata handling, or repeatable repository checks.
3. **Human verifies observable results** where the result must be confirmed in the UI or through real user interaction.
4. **The repository remains the shared record** of the request, automated result, review, and human verification.

Do not substitute source-code inspection for human verification when the test explicitly concerns observable behavior. Conversely, do not require a human to perform repetitive deterministic checks that automation can verify consistently.

### Workflow and deployment testing

When a test depends on a repository workflow, first ensure the workflow is deployed to the branch/ref from which the relevant event will execute. Separate deployment testing from feature testing when necessary.

A workflow source file existing on a feature branch does not by itself prove that a PR created from another branch will execute that workflow. Verify the actual GitHub Actions run and its result.

Warnings must be distinguished from failures. A successful job with a deprecation or informational warning is a successful test result unless the warning itself is the subject of the test.

### Test evidence

Test evidence must describe what was actually observed, not what was expected to happen.

- **PASS:** expected behavior was observed.
- **FAIL:** expected behavior was not observed.
- **BLOCKED:** the test could not be executed because a prerequisite was unavailable.
- **NOT TESTED:** the environment was prepared but no human verification was performed.

Do not record an unexecuted test as successful merely because its branch, configuration, or workflow was prepared correctly.

### Reproducible test URLs

Any URL supplied for a human test must be checked immediately before being supplied.

For a PR-creation URL, verify all of the following:

- the branch exists;
- the branch contains a real change relative to the target;
- no existing PR uses that exact branch as its head;
- the URL targets the intended base branch;
- the instructions identify the expected title, action, and result.

This prevents a test URL from unexpectedly opening an already-created PR instead of the intended PR-creation flow.

### Cleanup after testing

Temporary test artifacts should be removed after the test cycle when they are no longer needed.

Before deleting a branch or other test artifact:

1. Check its current repository state.
2. Check whether an active PR or other work still depends on it.
3. Delete only obsolete artifacts.
4. Report what was actually removed.

Cleanup instructions should describe the current state and requested action. Do not silently delete active work.

### Knowledge quality rule

`KNOWLEDGE.md` contains reusable knowledge, not a chronological test diary.

Do not encode individual Issue numbers, PR numbers, temporary branch names, one-off test cases, or topic-specific history as knowledge unless the information itself expresses a reusable rule. Convert an observed event into a general principle that can be applied to future work.

When an observation is useful only as evidence for a particular implementation, keep it in the relevant Issue, PR, test plan, or other project record rather than in `KNOWLEDGE.md`.

### Category metadata and Kanban

Repository metadata such as labels can support automation without becoming Kanban workflow categories. Metadata used for classification should remain independent of Status, Priority, ordering, and other work-control fields unless the project explicitly defines an integration between them.
