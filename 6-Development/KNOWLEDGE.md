# Jagports Development Knowledge

## Human testing

### GitHub category-label automation — Issue #78

The category system uses repository-level GitHub labels. The labels are not branch contents and therefore are available independently of which branch a PR comes from.

Configured labels:

- `category:skill` — Skills, operating instructions, or automation rules — `#5319E7`
- `category:agent` — Agent behavior, roles, discovery, or hand-off — `#1D76DB`
- `category:knowledge` — Project knowledge, documentation, research, decisions, or requirements — `#0E8A16`

The category labels are metadata. They do not create a separate Kanban category/state and must not change Kanban Status, Priority, ordering, or workflow.

#### Workflow deployment test

PR #107 deployed `.github/workflows/validate-category-conventions.yml` to `main`.

A `CHORE /` deployment PR initially exposed an important workflow rule: maintenance PRs must be explicitly exempted from the category-prefix/label requirement. After that correction, the validation job succeeded. The GitHub Actions run showed:

- `validate-category` — succeeded
- workflow output: `CHORE PR: category label is not required.`
- GitHub also reported a Node.js 20 deprecation warning for `actions/github-script@v7`; this was a warning, not a test failure.

PR #107 was approved and merged. The workflow therefore became available from `main` before the clean category-label human test.

#### Human test method learned

A reliable automatic-label human test requires a real branch change and a PR that does not already exist.

Required preparation:

1. Create a fresh branch from current `main`.
2. Make a small, harmless file change on that branch so GitHub has a real comparison.
3. Verify the exact branch has **zero existing PRs** before giving the PR-creation URL.
4. Give the user a compare URL for that exact branch.
5. User creates the PR with the category prefix and does not manually add the label.
6. Verify the automatically assigned category label and the validation check.

Do not assume that a branch is a clean PR-test branch merely because its name is new. The exact branch must be checked for existing PRs. A compare URL can lead to an existing PR if the branch already has one.

Do not use a branch with no file difference for a PR-creation test: GitHub can immediately present the existing PR/closed PR state instead of offering a new PR creation flow.

#### Verified human result

The clean SKILL category test was reported by the human tester as successful after the workflow had been merged to `main`:

- PR title used the `SKILL /` prefix.
- `category:skill` was automatically applied.
- The label was not manually added.

This establishes the complete tested path for the SKILL category: PR title prefix → GitHub Actions category handling → repository label.

The earlier SKILL test PR #105 is historical/failed evidence and must not be treated as the successful test. It was superseded by the clean test.

AGENT and KNOWLEDGE clean test environments were prepared using the same method. Branch preparation alone is not human-test evidence; record them as successful only after explicit human confirmation of the automatic label.

### Human + workflow operating model

The category system demonstrates a useful human/automation workflow:

1. **Human prepares intent** by using the required PR title prefix (`SKILL /`, `AGENT /`, or `KNOWLEDGE /`).
2. **GitHub Actions performs the mechanical validation/label handling**.
3. **Human verifies the result in the GitHub UI**, especially the visible label and check result.
4. **GitHub remains the shared record** of the request, automation result, review, and human verification.

Automation should handle deterministic repository operations; humans should verify outcomes that require UI inspection or judgment. A human test must not be replaced by an agent claiming that the expected UI result exists based only on workflow source code.

This model is preferable to making humans perform deterministic labeling manually: the human supplies the category intent, automation applies/enforces the convention, and the human confirms the observable result.

### Test cleanup knowledge

Temporary category-test Issues and branches should be removed after testing so they do not remain as misleading active work records.

Issue #120 was created and assigned to `tlindi` to remove obsolete human-testing branches. The cleanup list includes the temporary SKILL, AGENT, KNOWLEDGE, and documentation test branches created during the testing process. Branch deletion must be performed only after confirming no active PR depends on a branch.

Test Issues that were closed after the testing cycle included #95, #97, #98, #99, #101, and #115. Closed test Issues are historical evidence and should not be reused as current test instructions.

### Important operational lessons

- GitHub labels are repository-level objects, not branch files.
- A workflow file on a feature/test branch cannot reliably validate a newly created PR from another branch; the workflow must be present on the target/default branch according to the applicable GitHub Actions trigger behavior.
- Deployment of a workflow and testing of the workflow should therefore be separated when the test depends on the workflow being available from `main`.
- Human tests should be short and granular. A useful test item can be three steps: URL, action, expected result.
- Test URLs must point to a genuinely unused branch with a real file change, not to an existing PR.
- Automatic-label tests are invalid if the label is manually added before verification.
- Human confirmation is required for visual/UI facts such as whether a label appeared in the PR interface; source-code inspection alone is not equivalent to human testing.
- Category metadata remains orthogonal to the Kanban workflow.
