# Codex Engineering Instructions

## Purpose

This document is the Codex-specific engineering execution standard for `jagports/jagports`.

It tells Codex how to prepare, implement, validate, document, hand off, and verify engineering changes. It does **not** define a separate Management workflow.

## Authority

Use these sources in this order for their respective responsibilities:

1. `KNOWLEDGE.md` — repository entry point and mandatory references.
2. `00-Management/WORKFLOWS.md` — **single canonical normative Management workflow authority**.
3. `00-Management/GITHUB_OPERATING_RULES.md` — GitHub Issue/PR/review/testing-evidence/record-integrity operation.
4. `00-Management/RULES.md` — human governance and authority.
5. `0-DocumentationEducationCompetense/SKILL.md` — machine/agent execution guidance.
6. `0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md` — durable communication, escalation and hand-off rules.
7. `6-Development/KNOWLEDGE.md` — development and testing knowledge.
8. Applicable domain `KNOWLEDGE.md`, SPEC, README, deployment and component instructions.

Do not use retired `0-DocumentationEducationCompetense/ISSUE_OPERATING_RULES.md` as active guidance.

If instructions conflict, do not invent a third interpretation. Apply the authority rules above and record/escalate any unresolved contradiction through the active Issue.

## 1. Pre-work readiness

Before modifying the repository:

- confirm repository `jagports/jagports` and intended base/ref;
- read root `KNOWLEDGE.md` and mandatory referenced governance/communication files;
- resolve the active Issue and approved scope;
- read the objective, acceptance criteria, dependencies, risks and existing decisions;
- inspect relevant existing implementation, tests and documentation;
- inspect the working tree/branch state and exclude unrelated changes;
- identify component runtime/tool/version assumptions and documented test entry points;
- identify applicable security, credential and secret constraints;
- verify the GitHub operation needed for the next external action is actually available;
- identify any required human decision before implementation begins.

Do not rely on conversational memory where the repository or Issue is the durable source of truth.

## 2. Branch and change discipline

- Work on a dedicated branch. Never implement directly on `main`.
- Keep changes within the approved Issue scope.
- Prefer focused, reviewable changes over broad opportunistic refactoring.
- Do not add unrelated cleanup merely because nearby code could be improved.
- Preserve existing architecture and conventions unless the approved scope requires a change.
- Use meaningful commits that can be traced to the active Issue.
- Never commit credentials, tokens, generated secrets or secret-bearing diagnostic output.
- Treat material scope expansion, new architecture/security/cost decisions and unresolved ambiguity as escalation conditions rather than autonomous policy decisions.
- Use the current GitHub API pacing rule from agent instructions: minimum `0.33` seconds between GitHub API calls in operational sequences.

## 3. Implementation standards

For each engineering change:

- inspect the existing code/data/docs and current tests before editing;
- preserve established interfaces and behavior not intentionally changed by scope;
- handle expected failures explicitly and fail safely;
- add or update tests for changed behavior where technically applicable;
- never weaken validation only to make a failing test pass;
- keep implementation, tests, fixtures and documentation mutually consistent;
- prefer deterministic behavior and repeatable procedures;
- record material technical risks, dependencies and limitations in the relevant Issue/PR;
- keep reusable knowledge in the appropriate repository documentation rather than only in chat or PR discussion.

## 4. Mandatory automated checks

Checks are selected by the changed component. There is no universal repository command that can safely replace component-specific validation.

### Repository-level checks

Where applicable, preserve and require the existing GitHub workflows, including:

- `.github/workflows/validate-category-conventions.yml`
- `.github/workflows/integrity_parts-model.yml`
- `.github/workflows/integrity_vieps-i18n.yml`
- `.github/workflows/jepc-dataimporter.yml`

`issues-lifecycle-in-project.yml` is process automation, not a substitute for implementation tests.

### Component checks

For changed software/components:

1. inspect the component README/package/configuration for the documented test/build entry point;
2. run applicable unit, integration, smoke, integrity, lint or build checks against the actual proposed implementation;
3. add/update automated coverage when changed behavior is not already exercised;
4. ensure a failed or unavailable required validation is reported explicitly;
5. do not report skipped/unexecutable validation as PASS.

For the current VIEPS Worker, use its documented package/README scripts when that component is changed; do not impose those commands on unrelated components.

A required check failure blocks delivery until fixed within approved scope or explicitly escalated under the canonical workflow.

## 5. Test evidence

Durable validation evidence belongs in the active PR and/or linked test Issue.

Record, as applicable:

- exact test/check performed;
- relevant command or procedure;
- branch/head revision under test;
- environment/target where relevant;
- observed PASS/FAIL/BLOCKED/NOT TESTED result;
- important output, failure, skip or environmental limitation;
- manual/human verification where automation is insufficient;
- relationship between the validation and acceptance criteria.

Required pre-merge testing must validate the actual PR branch/current proposed implementation. Post-merge testing may add regression/production evidence but cannot substitute for required pre-merge validation.

Human tests follow `6-Development/KNOWLEDGE.md`: deterministic setup should be prepared by the agent when safe, while required human-observable results remain independently verified by the human.

## 6. Documentation and knowledge updates

Update documentation when the implementation changes reproducibility, operation, public behavior, maintenance assumptions or durable engineering knowledge.

Use the appropriate destination:

- code comments for local implementation rationale that cannot be made obvious in code;
- component README for setup/build/test/runtime instructions;
- user-facing docs for user-visible behavior;
- applicable domain `KNOWLEDGE.md` for generalized reusable knowledge;
- deployment documentation for deployment/rollback/operational changes;
- SPEC documentation for durable product/implementation requirements where applicable.

Do not copy workflow-state rules into engineering knowledge. Reference `00-Management/WORKFLOWS.md` instead.

## 7. PR preparation and hand-off

A PR hand-off must be compact and traceable. Include:

- explicit Issue relationship using `Closes #<issue>` when the PR completes the Issue;
- implementation summary;
- changed files/areas;
- important design decisions within approved scope;
- automated checks/tests and observed results;
- human/manual test evidence when required;
- documentation/knowledge updates;
- known limitations, risks and dependencies;
- unresolved questions or decisions requiring reviewer/Product Owner authority.

Use GitHub native review. Do not create a parallel review status or approval mechanism.

Before formal review, verify that the selected reviewer is independent of both the PR author and executing actor. A private self-check does not satisfy formal review.

The reviewer controls resolution of their review concerns, subject to the documented human-authority exception.

## 8. Post-merge verification

After an authorized merge, verify where applicable:

- the intended change is present on the intended target branch;
- required CI/checks completed successfully;
- relevant automated tests remain green;
- deployment/production state is correct when deployment is part of scope;
- required Issue completion evidence exists;
- durable documentation reflects the merged implementation.

Issue closure, Project handling and final workflow state remain governed by `00-Management/WORKFLOWS.md` and current GitHub operating/capability rules.

## 9. Capability and Project-operation handling

Do not claim an external action without verification.

The current repository documents contain a known distinction between canonical Project workflow semantics and the current agent/tool capability/operating restriction for Project mutation. This engineering document does not resolve that process issue.

When Project state is required:

- follow the canonical workflow for required semantics;
- follow current GitHub operating/capability rules for operations actually permitted;
- do not invent a workaround or falsely claim a Project mutation;
- record/escalate an unresolved rule/capability contradiction if it materially blocks the active work.

## 10. Fail-closed / escalation conditions

Stop or escalate rather than silently deciding when:

- scope or acceptance criteria are materially ambiguous;
- an unapproved architecture, security, cost or external-commitment decision is required;
- required access, credentials or capability is unavailable;
- mandatory validation cannot be executed reliably;
- a mandatory check fails and cannot safely be resolved within approved scope;
- authoritative/current repository instructions conflict;
- proceeding would require bypassing a review, testing, merge or other workflow gate;
- the current tool cannot perform a required external operation and no authorized alternative exists.

Use the current capability-alert wording defined by active agent instructions when such an alert is required.

## Repeatable Codex delivery checklist

- [ ] Correct repository, base/ref and active Issue confirmed.
- [ ] Objective, approved scope and acceptance criteria confirmed.
- [ ] Mandatory workflow/governance/communication/development sources read.
- [ ] Relevant implementation, tests and component documentation inspected.
- [ ] Dependencies, risks and required human decisions identified.
- [ ] Required GitHub/tool capability confirmed.
- [ ] Working tree/branch state inspected; unrelated changes excluded.
- [ ] Dedicated change branch established.
- [ ] Implementation completed within approved scope.
- [ ] Required tests/checks added or updated.
- [ ] Applicable automated checks executed against the proposed implementation.
- [ ] Required validation is PASS, or failure/blocker explicitly recorded and escalated.
- [ ] Required human/manual verification completed and linked.
- [ ] Documentation/knowledge updated where required.
- [ ] PR contains Issue traceability, implementation summary and validation evidence.
- [ ] Independent native GitHub review completed where required.
- [ ] Reviewer-owned findings resolved by the appropriate authority.
- [ ] Required pre-merge testing passed.
- [ ] Merge authorized only after current review/testing gates pass.
- [ ] Post-merge repository/deployment verification completed where applicable.
- [ ] Issue closure/Project handling performed only under authoritative workflow and current capability rules.
