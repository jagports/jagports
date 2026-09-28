# Jagports Development Knowledge

## Scope

This file contains durable knowledge specific to development work. Repository-wide `KNOWLEDGE.md` hierarchy and maintenance policy is defined at the repository root; this file should focus on development-specific knowledge.

## Testing

### Principle

Use the smallest practical amount of testing process needed to produce reliable evidence for the changed behavior.

- Prefer deterministic automated checks where they can establish the result reliably.
- Use human verification only when the acceptance criterion depends on human observation, interaction, judgement, or another condition that automation cannot establish reliably.
- Do not require a separate Test Issue merely because testing exists.
- Do not make humans repeat deterministic checks that automation can perform reliably.
- Do not manipulate GitHub Issue/PR state solely to manufacture a test case unless that state transition is itself the behavior under test.
- Do not create a testing/review lifecycle parallel to `00-Management/WORKFLOWS.md` or GitHub's native PR review/check mechanisms.

The required review, testing, acceptance, and merge gates are defined by `00-Management/WORKFLOWS.md`. This file explains development-specific testing practice; it does not redefine the workflow.

### Evidence before ceremony

Testing must establish what actually happened.

- **PASS** — the required behavior was exercised and the expected result was observed.
- **FAIL** — the behavior was exercised and an expected result was not observed.
- **BLOCKED** — a required prerequisite prevented the test from being executed.
- **NOT TESTED** — the behavior was not exercised and verified.

Implementation inspection, configuration presence, fixture preparation, or an unexecuted checklist is not PASS evidence.

Use the evidence where it is naturally produced. Automated checks belong in check results/logs; required human verification should be recorded on or linked from the implementation PR or owning Issue. Create a separate Test Issue only when an independent durable execution record materially improves traceability, coordination, or repeatability.

### Automated testing

Automate deterministic validation when practical, especially for repeatable logic, parsing, transformations, API behavior, data invariants, migrations, configuration validation, and other machine-observable results.

For event-driven automation, source/configuration inspection alone is insufficient when execution behavior matters. Trigger the relevant event or a deterministic branch-testable equivalent and verify the resulting execution evidence. Record an exact run identifier when it is material to proving what executed.

Do not weaken production triggers merely to make a test easy. Where an event wrapper runs only from the default branch, separate deterministic logic into a branch-testable path when pre-merge verification of that logic is required.

### Human verification

Human verification should be short and limited to what only the human needs to observe or do.

A useful human verification defines:

1. **Starting state** — what is already prepared and what the tester should see.
2. **Action or observation** — one concrete human step.
3. **Expected result** — one observable pass/fail condition.

Prepare deterministic setup, fixtures, URLs, permissions, configuration, and other technical prerequisites before handover. Do not make the human reconstruct the environment or infer missing steps.

When multiple human steps are genuinely required, use a concise checklist and stop on the first failed prerequisite. Step-level checkboxes are useful when they improve execution evidence; they are not mandatory for every test or every PR. If a dedicated Test Issue is used, record one final outcome (`PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED`) and preserve that closed Issue as historical evidence rather than reusing it for another execution.

Links and instructions must be directly usable. Provide the exact resource the human must open and keep the action and expected result unambiguous. Formatting conventions such as placing a link on its own line are presentation guidance, not a separate quality gate.

### Pre-merge and post-merge validation

When a change requires validation before merge, test the implementation actually proposed by the PR.

- Identify the relevant PR revision when the distinction from `main` matters.
- Required pre-merge checks or human verification must pass before merge.
- `FAIL`, `BLOCKED`, and `NOT TESTED` do not satisfy a required merge gate.
- A post-merge smoke/regression test may provide additional evidence but must not be used retroactively as proof that a required pre-merge gate passed.

Not every PR requires human testing. The need for human verification follows from the acceptance criteria and risk of the change, not from the existence of a PR.

### Test fixtures and cleanup

Use controlled, reproducible fixtures where practical. Preparation must not itself perform the behavior that the test claims to verify unless setup is explicitly separate from the observed behavior.

Before handing a fixture to a human, verify that required resources exist and are in the intended starting state. After testing, remove temporary artifacts only when they are confirmed obsolete and not required by active work or historical evidence.

### Historical test records

Closed Issues and merged PRs are historical evidence. Do not rewrite old test results to make them match current practice. A later retest is new evidence and should be recorded separately when a separate record is actually needed.

Historical one-off test procedures do not automatically become reusable rules. Generalize only the parts that remain useful across work.

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