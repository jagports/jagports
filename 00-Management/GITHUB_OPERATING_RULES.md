# Jagports GitHub Operating Rules

## Purpose

This document defines how Jagports uses GitHub records for work control and traceability.

It covers GitHub Issues, Pull Requests, reviews, testing evidence, comments, Project information, and record integrity.

It does **not** define the Management workflow state machine. The single canonical normative source for workflow states, transitions, gates, and workflow invariants is:

`00-Management/WORKFLOWS.md`

**Core rule: GitHub operating rules are defined once; workflow semantics are defined once in WORKFLOWS.md.**

Repository: `jagports/jagports`

Project: `Jagports AI OS`

---

## 1. Authority and Roles

### Product Owner

The Product Owner is the final human authority for:

- business priorities
- scope
- strategic direction
- budget and cost decisions
- external commitments
- acceptance of materially important outcomes
- decisions explicitly requiring human approval

Delegating execution does not transfer ultimate human decision authority.

### Team Lead Agent

The Team Lead Agent coordinates GitHub-based execution and keeps the work system consistent.

The Team Lead Agent may:

- coordinate work
- propose ordering
- identify dependencies and risks
- maintain Issue and PR traceability
- perform process checks within delegated authority

The Team Lead Agent must not silently make a decision reserved for the Product Owner.

### Specialist Agent / Human Contributor

An executing agent or human contributor performs assigned work within approved scope.

The executor must report material findings, blockers, risks, dependencies, scope changes, and proposed decisions in the relevant GitHub record.

The executor must not independently redefine scope or override Product Owner decisions.

---

## 2. GitHub Issue Rules

### 2.1 Issue as the Work Record

Every material piece of work must have a corresponding GitHub Issue unless it is inherently represented by another authoritative GitHub record.

The Issue is the authoritative work record for:

- objective and expected outcome
- reason and context
- priority when explicitly requested
- executing entity
- execution target
- dependencies
- risks
- decisions and decision status
- relevant discussion
- implementation and PR references
- review evidence
- test evidence
- acceptance and completion evidence

Important decisions must not exist only in private chat. If a decision is made outside GitHub, record the resulting decision in the relevant Issue or durable project documentation.

### 2.2 Issue Creation

Create or reuse an Issue according to the discovery and historical-work rules in `WORKFLOWS.md`.

An Issue should contain enough information to understand:

- objective
- expected outcome
- reason/context
- proposed executor
- execution target
- dependencies
- known risks
- required decision or approval
- acceptance criteria where applicable

Do not create duplicate Issues when an existing open or historically completed record already satisfies the request. Apply the discovery rules in `WORKFLOWS.md`.

### 2.3 Priority

Priority is **optional**.

Priority must be used only when explicitly requested by the requester, a human, or the Product Owner. It must not be added merely because an agent considers it useful.

When priority is explicitly requested, record it in the appropriate structured Issue/Project field or Issue content. **Never put priority in an Issue title or filename.**

Where exact ordering is explicitly required, sub-priorities such as `P1.1`, `P1.2`, or `P2.1` may be used.

The Product Owner has final authority over priority.

### 2.4 Assignment and Execution Target

Each executable Issue should identify the actual executing entity.

Use the project's configured execution field where applicable and use GitHub `Assignees` to identify the actual GitHub account when available.

The Issue should identify the concrete execution target where relevant, such as a repository, Issue, file, website, external system, or development environment.

### 2.5 Decisions

A decision requiring Product Owner authority must be explicit in the Issue.

Record, as applicable:

1. decision required
2. relevant alternatives
3. recommendation
4. consequences and risks
5. Product Owner decision
6. date and record of decision

Use configured Project values where they exist. Do not create competing workflow or enum definitions in this document.

A rejected proposal must not silently continue as approved work.

### 2.6 Dependencies and Risks

Record material dependencies and risks in the relevant Issue and/or configured Project information when such Project editing is explicitly authorized and available.

If a dependency prevents progress, use the workflow state required by `WORKFLOWS.md` and document the blocker, impact, required resolution, and responsible party where known.

Do not invent alternative workflow states in an Issue.

### 2.7 Issue Closure

Closing an Issue is not merely an administrative action.

Before closure, verify the completion obligations defined by `WORKFLOWS.md` and the Issue itself, including implementation, review, testing, merge, and acceptance where applicable.

A merged PR does not by itself prove that the Issue is complete.

---

## 3. Pull Request Rules

### 3.1 PR as the Integration Record

Repository changes must use a Pull Request as the normal integration path, as required by `WORKFLOWS.md`.

A PR must maintain explicit traceability to every Issue it implements or resolves.

One PR may legitimately address multiple Issues when it genuinely implements each scope and the traceability is explicit.

### 3.2 PR Scope

The PR title and description must accurately represent the current implementation scope.

When an open PR materially expands or changes scope, its title may be updated. GitHub preserves the previous title through its event history. Do not use title changes to obscure history.

A PR should identify, where applicable:

- linked/resolved Issues
- implementation scope
- important design decisions
- tests performed
- known limitations
- review requirements

### 3.3 PR Review Boundary

When review is required, the PR is the formal review hand-off mechanism.

The executing actor must stop at the review boundary defined by `WORKFLOWS.md` and must not merge its own implementation merely because GitHub reports the PR as mergeable.

Do not invent a separate PR workflow status. Use the canonical workflow state and GitHub's native PR review mechanism.

### 3.4 Independent Review

The formal reviewer must be independent of both the PR author and the executing actor.

Before requesting or submitting a formal review:

1. identify the PR author;
2. identify the current executing actor;
3. identify the intended reviewer;
4. verify that reviewer identity is distinct and unambiguous.

If reviewer identity cannot be established, or the reviewer is the PR author/executor, stop and do not submit the formal review.

A self-review, including a `COMMENTED` review by the PR author/executor, does not satisfy the independent review gate.

A private self-check before hand-off is permitted but is not formal independent review.

### 3.5 Review Outcomes

GitHub review outcomes are authoritative evidence of the reviewer's action:

- `APPROVE`
- `REQUEST_CHANGES`
- `COMMENT`

Do not infer approval from a notification, comment, or review request alone.

The workflow consequences of these outcomes are defined in `WORKFLOWS.md`.

### 3.6 Review Comments

The reviewer who submitted a review is the normal authority for resolving comments belonging to that review.

The PR executor, PR author, or another non-reviewer must not resolve those review comments on the reviewer's behalf.

When changes are requested, the executor may implement the requested changes and reply to the review comments, but should leave the reviewer's comments unresolved for the reviewer to resolve after verification.

### 3.7 Specialist Technical and Security Review Gate

Normal independent review remains the default review path. An additional specialist review is required only when the proposed change crosses a defined technical or security-sensitive boundary below. This specialist review is an additional requirement inside the existing `WORKFLOWS.md` review gate; it does not create a parallel workflow or separate lifecycle state.

#### Architecture-review triggers

Require a specialist architecture review when a change materially alters one or more of:

- system/component boundaries or responsibility allocation;
- public or cross-component APIs, data contracts, schemas, or persistent data models;
- deployment/runtime topology, infrastructure architecture, or platform/provider boundaries;
- authentication, authorization, trust boundaries, or identity/permission models;
- shared architectural conventions used by multiple components;
- a previously approved architectural decision or constraint.

Routine implementation within an already approved design does not require a separate architecture review merely because it changes code.

#### Security-review triggers

Require specialist security review when a change materially affects one or more of:

- authentication, authorization, credentials, tokens, sessions, permissions, or access-control behavior;
- secret storage, handling, rotation, logging, or exposure boundaries;
- externally reachable deployment/network configuration, security headers, origin/trust configuration, or privileged runtime settings;
- dependency or supply-chain trust where a new dependency, execution source, package source, or privileged third-party integration introduces material risk;
- handling of sensitive data or a boundary that could expose, broaden access to, or persist such data;
- remediation or explicit acceptance of a known security finding.

A dependency/version change does not require specialist security review when existing automated checks and ordinary review establish that it does not introduce a material trust/security change.

#### Specialist reviewer qualification and independence

The specialist reviewer must:

- be independent of the PR author and executing actor under the same identity rules as normal formal review;
- have demonstrated knowledge sufficient for the affected architecture/security area, or be explicitly designated by the Product Owner for that specialist review;
- review only within delegated authority; material business-risk acceptance, cost decisions, or changes to approved scope remain Product Owner decisions.

One qualified reviewer may satisfy both ordinary independent review and the specialist gate when that reviewer meets all applicable independence and specialist-qualification requirements. Multiple formal reviews are not required merely to represent multiple labels for the same competent independent review.

#### Required specialist-review evidence

When this gate applies, the PR or linked Issue must identify:

- the triggering boundary/category;
- the material architecture/security impact and affected components or trust boundaries;
- alternatives or trade-offs when the change establishes or changes an architectural/security decision;
- applicable automated checks, threat/security checks, tests, or validation performed;
- known residual risks or limitations;
- the specialist reviewer and the resulting formal GitHub review outcome.

Security review must additionally verify, as applicable, that:

- no credential or secret is added to source, history, Issue/PR content, logs, or generated artifacts;
- authentication/authorization behavior follows least-privilege expectations and does not silently broaden access;
- deployment/configuration changes do not create an unintended external exposure or weaken an established control;
- new or materially changed dependencies/integrations have an explicit trust/source rationale and applicable validation;
- a known security failure is not converted into PASS by skipping, disabling, or weakening the required check.

A required specialist review or required security check that is missing, failed, `BLOCKED`, or cannot be verified blocks merge. Remediation occurs in the existing PR/review cycle. Any exception or risk acceptance that materially changes scope or accepts unresolved risk requires an explicit Product Owner decision recorded in the Issue/PR before merge; the exception does not silently convert failed evidence into PASS.

### 3.8 Testing Evidence

Required testing must be performed according to `WORKFLOWS.md`.

A required pre-merge test must use the PR branch/current implementation being proposed for merge and must record sufficient evidence to establish:

- what was tested
- where/how it was tested
- result
- relevant command or procedure
- important failures or limitations

`FAIL`, `BLOCKED`, or `NOT TESTED` is not successful validation for a required pre-merge test.

Post-merge testing cannot substitute for required pre-merge validation.

### 3.9 Merge

No actor may merge merely because a PR is technically mergeable.

Required review, testing, approval, and other gates must be satisfied before merge.

All review comments must be resolved in addition to `Review Approved` before merge is allowed.

After merge, verify the resulting repository state and update the relevant work record as required by `WORKFLOWS.md`.

---

## 4. GitHub Project Rules

The GitHub Project provides the Kanban representation of work and exposes structured project information.

The Project is not a replacement for the Issue work record.

### 4.1 Project Mutation Restriction

Agents must **not mutate GitHub Project configuration or Project Item state** unless a later authoritative project capability rule explicitly grants that capability.

This includes, at minimum:

- adding or removing Project Items
- changing Project Item Status
- changing Project Item fields
- changing Project views
- changing Project configuration

The current operating model treats Project state as **read-only to agents**. Do not claim that a Project mutation has succeeded.

When Project state is relevant to work, inspect/read it when the required read capability is available and report the observed state. Do not create a workaround that silently changes Project state through another mechanism.

### 4.2 Workflow State Authority

This document does not define workflow states or transitions.

Use `WORKFLOWS.md` for:

- valid states
- transition rules
- transition gates
- blocked-state handling
- review boundaries
- testing boundaries
- closure conditions
- historical-work discovery
- workflow invariants

---

## 5. Communication and Traceability

GitHub records are shared operational memory for project work.

Material project communication belongs in the relevant Issue, PR, review, or linked durable documentation.

Important information must not depend on one person's private conversation history.

Issue and PR **Descriptions and Comments must always** be formatted for quick visual scanning and reliable traceability.

Use clear, separate lines or paragraphs for:

- primary Issue/PR links
- traceability statements
- evidence or actions being reported
- decisions and their outcomes
- important state information

Maintain the traceability chain:

`Work request → Issue → PR → Review → Test → Merge → Issue closure`

Historical references used to justify active work should be explicitly linked in the active record.

---

## 6. Record Integrity and Historical Records

Closed Issues and merged PRs are historical GitHub records.

Their descriptions and comments must not be rewritten to change history.

Closed Issues and merged PRs must retain their historical titles.

Open Issue or PR titles may be changed when scope materially changes; GitHub's event history preserves the previous title.

Do not copy historical descriptions or comments into current documents merely to create an archive. Link to the historical record instead.

Historical records may be used as evidence when applying the discovery and historical-work rules in `WORKFLOWS.md`.

---

## 7. Labels and Structured Fields

Labels provide classification for Issues and PRs.

Project fields provide structured management information when available for reading.

Labels should supplement, not replace, structured Issue/PR content.

Do not create a second unofficial enum in this document when the authoritative value is already defined by a Project field or `WORKFLOWS.md`.

---

## 8. Conflict and Authority Resolution

If GitHub operating guidance conflicts with workflow semantics:

1. `00-Management/WORKFLOWS.md` is authoritative for Management workflows.
2. This `GITHUB_OPERATING_RULES.md` is authoritative for GitHub record operation and GitHub-specific handling.
3. `00-Management/RULES.md` provides governance and rationale and must not redefine workflow semantics.
4. `SKILL.md` provides agent execution instructions and must implement/reference, not redefine, workflow semantics.
5. `.codex/skills/*` provides specialized procedures and must implement/reference the canonical workflow.
6. `KNOWLEDGE.md` contains durable knowledge and is not workflow authority.

A contradiction in a secondary document is a process defect and should be raised as an Issue rather than silently bypassed.

---

## 9. Capability and Verification Rules

- Verify GitHub access and the specific required operation before relying on it.
- Never claim an external GitHub action without verification.
- Use the project's current GitHub API pacing rule for operational sequences.
- After supported mutations, perform an independent read/verification.
- Distinguish capability, authentication, permission, mutation, and verification failures where observable.
- Never expose credentials, tokens, or secret values.
- Do not attempt Project mutations under the current read-only Project operating model.

If a required GitHub operation is unavailable, follow the current capability-alert wording defined by `WORKFLOWS.md` and applicable agent instructions.

---

## 10. Operating Principle

GitHub Issues and Pull Requests are durable work records, not disposable chat containers.

The Project provides the Kanban representation and structured information available for reading.

`WORKFLOWS.md` defines how work moves.

`GITHUB_OPERATING_RULES.md` defines how the GitHub records used by that work are operated.

This separation prevents duplicate workflow authorities while keeping Issue and PR operating rules in one GitHub-specific document.
