# Category label human test plan

## Test 1 — Automatic label on PR creation

- [ ] Open the prepared PR-creation page for a branch that has a real file change and no existing PR.
- [ ] Create the PR with a supported category prefix and do not add the matching category label manually.
- [ ] Confirm the matching category label is automatically appended and validation succeeds.

## Test 2 — Automatic label after renaming an existing PR

- [ ] Open an existing PR that currently has no matching category label.
- [ ] Edit only its title so it starts with a supported category prefix.
- [ ] Confirm the matching category label is automatically appended after the title edit and the workflow succeeds.

## Test 3 — Automatic label after renaming an existing Issue

- [ ] Open an existing Issue that currently has no matching category label.
- [ ] Edit only its title so it starts with a supported category prefix.
- [ ] Confirm the matching category label is automatically appended after the title edit and the workflow succeeds.

## Test 4 — Human verification of category independence

- [ ] Inspect the tested Issue or PR in GitHub.
- [ ] Confirm the category label is metadata only and did not change Project Status or Priority.
- [ ] Record the actual observed result as PASS, FAIL, BLOCKED, or NOT TESTED.

Do not manually add the expected category label during automatic-label tests. If automation fails, leave the test unchecked and record the actual result and workflow run.
