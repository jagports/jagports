# Codex Engineering Instructions

## Purpose

This is the Codex-specific execution layer for engineering work in `jagports/jagports`.

It does not define workflow states, review semantics, merge rules, Issue lifecycle rules, or other Management policy. Those remain in the repository authorities listed below.

## Authority

Read and apply the current repository sources that actually exist for the work being performed:

1. `KNOWLEDGE.md` — repository entry point.
2. `00-Management/WORKFLOWS.md` — single canonical normative Management workflow authority.
3. `6-Development/github/GITHUB_OPERATING_RULES.md` — GitHub-specific operating requirements.
4. `00-Management/RULES.md` — human governance and authority.
5. `0-DocumentationEducationCompetense/SKILL.md` — general agent execution rules.
6. `0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md` — persistent communication and escalation.
7. `6-Development/KNOWLEDGE.md` — reusable development/testing knowledge.
8. Relevant component/domain documentation for the files being changed.
9. `6-Development/github/GITHUB_ACTIONS.md` and `6-Development/github/GITHUB_ACTIONS_RUNNER_COST.md` when GitHub Actions behavior or cost is in scope.

Do not rely on retired or missing documents. If an expected reference cannot be found, use the current repository hierarchy and active Issue instead of inventing substitute content.

## Codex pre-flight

Before editing:

- confirm repository, base/ref, active Issue, approved scope, and acceptance criteria;
- inspect the current implementation, tests, fixtures, and component documentation relevant to the requested change;
- identify the documented build/test/check entry points for the changed component;
- verify that required GitHub/tool operations are available before relying on them;
- identify material dependencies, risks, security constraints, and required human decisions;
- exclude unrelated changes from the implementation scope.

## Change execution

Branching, repository-change gates, review boundaries, merge rules, record-integrity rules, and general agent/API execution behavior are not repeated here. Execute the current rules in `00-Management/WORKFLOWS.md`, `6-Development/github/GITHUB_OPERATING_RULES.md`, and `0-DocumentationEducationCompetense/SKILL.md`.

Codex-specific implementation expectations are:

- inspect before modifying;
- preserve established architecture and conventions unless approved scope requires change;
- keep changes focused and reviewable;
- handle expected errors explicitly and fail safely;
- add or update tests for changed behavior where technically applicable;
- never weaken validation merely to make tests pass;
- keep code, tests, fixtures, and documentation consistent;
- never add credentials, tokens, generated secrets, or secret-bearing output to repository history;
- record material technical risks or limitations in the active GitHub record.

## Automated validation

Select checks from the changed component and current repository configuration; do not impose one universal command on unrelated components.

For each change:

1. identify the component's documented test/build/integrity entry points;
2. run the applicable checks against the proposed implementation;
3. add or update automated coverage when changed behavior is not already covered;
4. treat required validation that cannot execute as unavailable, not PASS;
5. treat required check failure as blocking until corrected within approved scope or escalated under the canonical workflow.

Repository-wide automated-validation baseline and general PR CI/test-path work are owned by Issue #41 (`[P9.3] Define automated validation`).

GitHub Actions design, trigger amplification, and runner-cost knowledge belong under `6-Development/github/`; do not recreate that knowledge in this file.

## Validation evidence

For hand-off, record durable evidence in the PR and/or linked test Issue as applicable:

- exact check, command, or procedure;
- branch/head revision tested when relevant;
- environment/target when relevant;
- PASS/FAIL/BLOCKED/NOT TESTED result;
- meaningful failures, skips, or limitations;
- manual verification where automation is insufficient;
- relationship between validation and the Issue acceptance criteria.

Required pre-merge validation must exercise the proposed implementation. Testing chronology and merge eligibility remain defined by `00-Management/WORKFLOWS.md` and `6-Development/KNOWLEDGE.md`.

## Documentation and durable knowledge

Update documentation when implementation changes reproducibility, operation, public behavior, or reusable engineering knowledge.

Place durable knowledge in the existing repository hierarchy. Do not use this document as a catch-all and do not copy Management workflow rules into development knowledge.

## PR hand-off

Follow the canonical PR/review workflow. Codex hand-off content should identify:

- active Issue relationship;
- implementation summary and changed areas;
- validation performed and result;
- documentation/knowledge changes;
- material limitations, risks, or dependencies;
- unresolved decisions requiring reviewer or Product Owner authority.

## Escalate / fail closed

Escalate rather than silently decide when:

- scope or acceptance is materially ambiguous;
- an unapproved architecture, security, cost, or external-commitment decision is required;
- required capability, access, subscription, or credentials are unavailable;
- mandatory validation cannot execute reliably;
- a mandatory check fails and cannot safely be fixed within approved scope;
- current repository instructions conflict;
- proceeding would require bypassing a canonical workflow gate.

## Fresh-session checklist

- [ ] Repository, ref, active Issue, scope, and acceptance criteria confirmed.
- [ ] Current repository authorities and relevant component/domain documentation read.
- [ ] Existing implementation/tests inspected before editing.
- [ ] Required tool/GitHub capability confirmed.
- [ ] Dependencies, risks, security constraints, and required decisions identified.
- [ ] Change implemented within approved scope.
- [ ] Applicable tests/checks added or updated.
- [ ] Required validation executed and evidence recorded.
- [ ] Documentation/durable knowledge updated where required.
- [ ] PR hand-off contains traceability, summary, validation, and material limitations.
- [ ] Canonical review/testing/merge workflow followed without a Codex-specific parallel process.
