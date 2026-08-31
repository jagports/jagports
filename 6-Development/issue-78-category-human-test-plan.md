# Issue #78 — Category human test plan

## Purpose

This document is the practical human test plan for category prefixes and GitHub labels.

The test environment has already been prepared. The tester does not need to create branches or edit repository files.

## Test environment prepared

Three branches were created from `main`, each with one harmless test file:

- `skill/test-category-skill` → `6-Development/human-test-skill.txt`
- `agent/test-category-agent` → `6-Development/human-test-agent.txt`
- `knowledge/test-category-knowledge` → `6-Development/human-test-knowledge.txt`

These branches intentionally differ from `main`, so GitHub provides a real Pull Request creation flow.

## Test 1 — SKILL automatic label

- [ ] **URL:** https://github.com/jagports/jagports/compare/main...skill/test-category-skill
- [ ] **Create:** Nothing on the branch. On the Compare page, click **Create pull request**.
- [ ] **How:** Set PR title exactly to `SKILL / Human test category skill`; leave the label untouched; create the PR into `main`.
- [ ] **Expected:** GitHub Actions runs and the PR receives `category:skill` automatically. Do not manually add the label before checking.

## Test 2 — AGENT automatic label

- [ ] **URL:** https://github.com/jagports/jagports/compare/main...agent/test-category-agent
- [ ] **Create:** Nothing on the branch. On the Compare page, click **Create pull request**.
- [ ] **How:** Set PR title exactly to `AGENT / Human test category agent`; leave the label untouched; create the PR into `main`.
- [ ] **Expected:** The PR receives `category:agent` automatically. Do not manually add the label before checking.

## Test 3 — KNOWLEDGE automatic label

- [ ] **URL:** https://github.com/jagports/jagports/compare/main...knowledge/test-category-knowledge
- [ ] **Create:** Nothing on the branch. On the Compare page, click **Create pull request**.
- [ ] **How:** Set PR title exactly to `KNOWLEDGE / Human test category knowledge`; leave the label untouched; create the PR into `main`.
- [ ] **Expected:** The PR receives `category:knowledge` automatically. Do not manually add the label before checking.

## Test 4 — Wrong prefix / label validation

- [ ] **URL:** https://github.com/jagports/jagports/pulls
- [ ] **Create:** Nothing unless a prepared PR needs a controlled title edit for this test.
- [ ] **How:** On one test PR, change the title temporarily so it no longer has a valid category prefix. Observe the validation check. Restore the correct title afterwards.
- [ ] **Expected:** The category validation reports failure for the invalid title and passes again after the correct title is restored.

## Test 5 — Kanban neutrality

- [ ] **URL:** Open the Jagports GitHub Project from the repository Projects tab.
- [ ] **Create:** Nothing.
- [ ] **How:** Look at the test PR/Issue cards and their labels. Confirm labels are metadata only and the normal Status/Priority workflow remains unchanged.
- [ ] **Expected:** No Category Status, Category Priority, or category-specific workflow state exists.

## Recording results

For each test, leave the checkbox unchecked until the expected result has actually been observed.

If a test fails, comment on the test Issue with the test number, what happened, and the URL of the affected PR.

Do not manually repair a failed automatic-label test before recording the failure.

## Related test Issues

- Basic category/prefix test: Issue #95
- Multi-category test: Issue #98
- Final human verification / merge gate: Issue #99

## Implementation

PR #94: https://github.com/jagports/jagports/pull/94

CLI configuration and previous test evidence:
`6-Development/issue-78-github-cli-category-labels.md`
