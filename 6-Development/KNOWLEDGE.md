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

- Prepare all required files, configuration, data, services, accounts, permissions, fixtures, and other prerequisites.
- Use an isolated and reproducible test state when the operation could affect other work.
- Verify prerequisites before giving the human the test instructions.
- Ensure that preparation itself does not perform the behavior under test.
- Where deterministic setup or state transitions can be performed safely by the agent, perform them before human handover rather than making the human execute them.
- When the purpose of the test is to verify an automated transition, the agent may create the fixture and drive the deterministic transition sequence; the human then verifies the resulting observable state independently.
- Never use agent preparation to manufacture evidence for the behavior being tested. The human observation must remain independent of the preparation claim.

A test environment is preparation, not test evidence. The expected behavior must still be exercised and observed.

### Human + automation workflow

Use humans and automation for the responsibilities each can verify reliably:

1. **Human defines intent** and performs actions requiring human judgment or interaction.
2. **Automation performs deterministic operations** such as fixture creation, validation, metadata handling, repeatable state transitions, and execution checks when these are part of the test setup or automated behavior under test.
3. **Human verifies observable results** where the result requires UI observation, real interaction, or judgment.
4. **The project record captures the request, automated result, and human verification.**

For tests where the behavior under test is itself deterministic automation, prefer this pattern:

`agent prepares fixture → agent triggers real test event → automation executes → agent verifies machine-observable result → human independently verifies required observable state`

The human should not repeat deterministic setup or automation actions merely to provide evidence that an agent can establish reliably. Conversely, the agent must not replace human observation when the acceptance criterion is human-observable behavior.

Do not substitute implementation inspection for human verification when the test explicitly concerns observable behavior.

### Human-test Issue checklist design

Every human-test Issue must be executable as a checklist rather than as prose that requires the human to infer a procedure.

The checklist should:

- begin with a clearly identified **Starting state**;
- state what the agent has already prepared and what the human must **not** change during preparation verification;
- contain one checkbox for every executable human verification/action step;
- make each checkbox independently pass/fail observable;
- state the exact expected result for that step;
- identify whether the step is **human action**, **human observation**, or **agent/automation preparation already completed**;
- identify the exact Issue, PR, Project, branch, commit, fixture, or other resource under test where applicable;
- include a **STOP ON FAILURE** rule so later checks are not performed after a failed prerequisite;
- provide mutually exclusive final result choices: `PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED`;
- make clear that only the final result selected after all required checks is test evidence.

Keep human navigation minimal. Put the descriptive link/reference on a separate line immediately after the action text that tells the human what to open. Never embed the link/reference inline in the action sentence. Put the expected result on the following line. Do not create separate navigation instructions when the resource can be linked directly at the point where it must be opened.

### Mandatory compact human-test format

Human-test Issues must be easy to execute at a glance. Prefer **12–16 rendered lines for the complete human procedure and result choices**, excluding long URLs rendered by GitHub and optional agent-preparation notes.

Use this style whenever a human needs to open a specific GitHub resource:

- Put the human action first.
- Put the descriptive link/reference on the **next line**.
- Put the expected result on the **following line**.
- Keep one clear action per checkbox.
- Keep the link text descriptive enough that the human knows exactly what resource will open.
- Do not put a GitHub reference or URL inline in the action sentence.
- Use only the links necessary for the human to execute the test.

Canonical example:

```text
## HUMAN TEST — do exactly these actions
Test PR lifecycle behavior: open/reopen → BACKLOG; close → DONE.

### Actions

- [ ] **1. Open the**
  [Project: Jagports AI OS — Project #9](https://github.com/orgs/jagports/projects/9)
  **and find the test Issue.**
  **Confirm Status is BACKLOG.**

- [ ] **2. Open the**
  [Test Issue: Human lifecycle test #349](https://github.com/jagports/jagports/issues/349)
  **and click `Close issue`. Do not change Project Status.**
  **Confirm the Issue is closed.**

- [ ] **3. Refresh the**
  [Project: Jagports AI OS — Project #9](https://github.com/orgs/jagports/projects/9)
  **and find the test Issue.**
  **Confirm Status is DONE and the Issue is closed.**

### Result — select exactly one
- [ ] **PASS** — all three actions and expected results were correct.
- [ ] **FAIL** — an expected result was wrong; describe what you saw.
- [ ] **BLOCKED** — a required resource/prerequisite was unavailable; explain why.
- [ ] **NOT TESTED** — the test was not performed.

**STOP ON FAILURE. Do not repair the test state. After recording the result, close this Issue as housekeeping; closure is not evidence of PASS.**
```

The example is a formatting and usability standard, not a fixed test. Replace the example resources, actions, and expected results with the actual verified resources and conditions. Preserve the same compact structure: action → descriptive link on the next line → expected result on the following line.

Do not ask the human to type a result into chat when a GitHub Issue checklist can record the result directly. The human should normally mark the applicable checkboxes in the test Issue and select exactly one final outcome there. Chat may be used for additional clarification, but it is not a substitute for the persistent test record.

### Agent-prepared test execution

When technically possible, the agent should prepare and execute all deterministic portions of a test before requesting human verification.

The preferred sequence is:

1. Identify the exact implementation revision under test.
2. Create or select a fresh isolated test fixture.
3. Verify every prerequisite and prove the fixture is unused.
4. Execute any deterministic setup that is not itself the behavior under test.
5. Trigger the real event or operation under test when this can be done without bypassing the behavior being tested.
6. Wait for and inspect the resulting automation/execution evidence.
7. Independently verify machine-observable results.
8. Prepare the human-test Issue with only the remaining human observations/actions.
9. Re-fetch the Issue and verify its stored checklist and every direct URL.
10. Re-verify the linked resources and their current starting state before handover.
11. Give the human the test Issue only after all preflight and handover checks pass.

For multi-step workflow tests, the agent should pre-stage each step that can safely be automated and then hand the human one verification step at a time. The human should normally perform no state-changing operation unless that operation is specifically the human behavior being tested.

If the agent can safely execute the entire deterministic test sequence, it may do so and leave the human with independent UI/state verification steps. Such an agent-run sequence does not remove the requirement for human verification where the acceptance criterion is human-observable.

### Workflow and automation testing

When a test depends on automation, verify that the automation is available in the execution context and that the tested event actually invokes it.

- Verify the relevant configuration is deployed where it is expected to run.
- Trigger the real event or operation under test.
- Inspect the resulting execution status and output.
- Distinguish warnings from failures according to the acceptance criteria.
- Record the exact execution/run identifier when it is material to proving that the intended event was processed.
- Verify that the observed execution corresponds to the exact test fixture and implementation revision under test.

The presence of configuration or workflow source code does not prove that the automation executed successfully. Execution evidence is required.

### Test evidence

Test evidence must describe what was actually observed, not what was expected to happen.

- **PASS:** expected behavior was observed.
- **FAIL:** expected behavior was not observed.
- **BLOCKED:** the test could not be executed because a prerequisite was unavailable.
- **NOT TESTED:** the environment was prepared but the behavior was not exercised and verified.

Do not record an unexecuted test as successful.

### Reproducible test instructions and URLs

Any link or navigation instruction supplied for a human test must be checked immediately before it is supplied.

Verify that:

- the destination exists and is accessible;
- it represents the intended starting state;
- it does not unexpectedly open an already-completed or unrelated operation;
- the instructions identify the exact action and expected result;
- the Markdown keeps the descriptive link/reference on the line immediately after the action text and the expected result on the following line.

For any test that depends on a unique resource or isolated state, verify that the resource is actually unique and unused before providing it to the tester.

### Human-test preflight, checklist creation, and handover

The actual GitHub state is the source of truth for human-test preparation. Preparation comments, issue descriptions, branch names, or agent assertions are not evidence that a fixture is ready.

Before creating a human-test Issue:

1. Select a test case that is not duplicate coverage of an already executed or invalidated test.
2. Create or establish the complete isolated fixture required by the test.
3. Verify the actual GitHub state of every required resource, including that unique resources are genuinely unused and that preparation has not already performed the behavior under test.
4. Identify the exact implementation revision under test, including PR head branch and commit when applicable.
5. Create the complete human-test checklist only after the fixture passes preflight.
6. Ensure the checklist contains the exact starting state, concrete human actions/observations, expected result for every executable step, a checkbox for every executable step, a stop-on-failure rule, mutually exclusive final result choices, and direct descriptive links for every specific GitHub resource the human must open, inspect, modify, or verify.
7. Keep deterministic preparation and machine verification out of the human's required action list unless human execution is itself part of the behavior under test.
8. Format each human step as action → descriptive link on the next line → expected result on the following line. Do not put the link/reference inline in the action sentence.

After creating the human-test Issue, fetch the actual stored Issue content and perform a handover verification:

1. Confirm that the stored Issue contains every required test instruction and direct URL.
2. Confirm that each direct URL resolves to the intended existing resource.
3. Confirm that the Markdown structure preserves the intended action/link/result line structure.
4. Confirm that the linked resource still has the verified starting state.
5. Confirm that the test Issue identifies the exact implementation revision under test where applicable.
6. Confirm that the test Issue has no stale, completed, or contradictory instruction that could cause the human to test the wrong state.
7. Do not hand the human the test Issue URL until these checks succeed.

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

## GitHub Project creation and automation identity

Creating a GitHub Project that will be managed by automation is a development setup task, not merely a UI configuration task. Project-creation work must establish and verify the automation identity and its credentials before dependent workflows are treated as ready.

For organization-owned Projects:

1. Identify the GitHub user that will act as the automation identity.
2. Verify that the user has the required organization and repository access before creating dependent automation.
3. Prefer a dedicated automation user rather than coupling Project automation to a human administrator account.
4. For a fine-grained personal access token used by Project automation, grant the minimum required permissions. For the Jagports Issue-to-Project pattern this includes organization **Projects: Read and write**, repository **Metadata: Read**, and repository **Issues: Read and write**.
5. If the organization requires approval for fine-grained token access, complete and verify that approval before testing the automation.
6. Store the approved token as a repository or organization secret. Never place the token in source code, workflow files, Issues, Pull Requests, comments, scripts, logs, or chat.
7. The GitHub Actions secret name used by the Jagports Project automation is `PROJECTS_TOKEN`. The secret name identifies the stored credential; it is not the token value.
8. `GITHUB_TOKEN` is a separate GitHub Actions-provided credential. Do not substitute it for the dedicated Project automation credential unless its required Project capability has been independently verified.
9. Verify the automation credential independently against the target Project before relying on a workflow. A successful repository authentication check alone does not prove Project access.
10. Perform an end-to-end workflow test using the real event that the automation is intended to handle. Verify both the Project Item creation and the required initial Project Item Status.

Project creation tasks are incomplete until the automation identity, token permissions, approval state where applicable, secret configuration, direct Project access, and end-to-end operation have all been verified. This setup must be included in the project creation task plan whenever later automation depends on the Project.
