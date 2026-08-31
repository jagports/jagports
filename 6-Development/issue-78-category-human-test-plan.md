# Issue #78 — Category human test plan

## Purpose

Practical human test for PR #94.

The test environment is already prepared. Do not create branches, edit test files, or add labels manually before checking the result.

## Important workflow note

The category workflow is intentionally on PR #94's branch, not `main`. These tests verify whether GitHub runs that workflow from the PR branch for newly created test PRs. If no workflow run starts, record that as FAIL; do not assume the workflow is active.

## Prepared test environment

- `skill/test-category-skill` → `6-Development/human-test-skill.txt`
- `agent/test-category-agent` → `6-Development/human-test-agent.txt`
- `knowledge/test-category-knowledge` → `6-Development/human-test-knowledge.txt`

Each branch differs from `main` and can therefore create a real PR.

## Test 1 — SKILL

- [ ] Open https://github.com/jagports/jagports/compare/main...skill/test-category-skill
- [ ] Create a PR into `main` titled `SKILL / Human test category skill`; do not add a label.
- [ ] Confirm a category workflow runs and `category:skill` is added automatically.

## Test 2 — AGENT

- [ ] Open https://github.com/jagports/jagports/compare/main...agent/test-category-agent
- [ ] Create a PR into `main` titled `AGENT / Human test category agent`; do not add a label.
- [ ] Confirm a category workflow runs and `category:agent` is added automatically.

## Test 3 — KNOWLEDGE

- [ ] Open https://github.com/jagports/jagports/compare/main...knowledge/test-category-knowledge
- [ ] Create a PR into `main` titled `KNOWLEDGE / Human test category knowledge`; do not add a label.
- [ ] Confirm a category workflow runs and `category:knowledge` is added automatically.

## Test 4 — Final result

- [ ] All three automatic-label tests pass without manually adding labels.

If a test fails, leave its checkbox unchecked and comment with the PR number and observed result. Do not manually repair the label before recording the failure.

## Related

PR #94: https://github.com/jagports/jagports/pull/94
CLI evidence: `6-Development/issue-78-github-cli-category-labels.md`
