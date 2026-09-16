# Jagports GitHub Operating Rules

## Purpose

This document defines how Jagports uses GitHub records for work control and traceability.

It covers GitHub Issues, Pull Requests, reviews, testing evidence, comments, Issue fields, Project information, and record integrity.

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

### 2.3 Priority, Rank and Status ownership

Priority is **optional** and is used only when explicitly requested by the requester, a human, or the Product Owner.

When priority is in use:

- the organization-level native Issue field **`Priority`** is the authoritative current priority for the Issue;
- the supported current values are `Urgent`, `High`, `Medium`, and `Low`;
- exact execution order inside a particular Project/backlog is stored in that Project's numeric **`Rank`** field;
- workflow phase inside a Project is stored in that Project's **`Status`** field and follows `WORKFLOWS.md`;
- scoring comments and P0...P5 review bands are decision evidence and automation inputs, not competing live priority fields.

Rank is scoped to a Project/backlog. The same Issue may legitimately have different ranks in different Project scopes. Lower Rank numbers execute earlier; `1` is the highest-ranked active item.

Never put current priority or rank in an Issue title or filename. Historical planning identifiers such as `P6` or `P6.1` are work-plan identifiers and must not be interpreted as current Issue Priority.

The Product Owner has final authority over priority and queue order.

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

Use configured fields where they exist. Do not create competing workflow or enum definitions in this document.

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

### 3.7 Testing Evidence

Required testing must be performed according to `WORKFLOWS.md`.

A required pre-merge test must use the PR branch/current implementation being proposed for merge and must record sufficient evidence to establish:

- what was tested
- where/how it was tested
- result
- relevant command or procedure
- important failures or limitations

`FAIL`, `BLOCKED`, or `NOT TESTED` is not successful validation for a required pre-merge test.

Post-merge testing cannot substitute for required pre-merge validation unless the specific capability cannot exist before the workflow is present on the default branch and the reviewed change explicitly defines a controlled post-merge activation test.

### 3.8 Merge

No actor may merge merely because a PR is technically mergeable.

Required review, testing, approval, and other gates must be satisfied before merge.

All review comments must be resolved in addition to `Review Approved` before merge is allowed.

After merge, verify the resulting repository state and update the relevant work record as required by `WORKFLOWS.md`.

---

## 4. GitHub Project Rules

The GitHub Project provides the Kanban representation of work and Project-scoped structured information.

The Project is not a replacement for the Issue work record or organization-level Issue fields.

### 4.1 Project and Issue-field mutation capability

Direct agent/tool mutation and reviewed repository automation are different capabilities.

Agents must not claim a direct Project mutation when the current connector does not expose and verify that operation. However, reviewed repository automation may mutate Issue fields or Project Item fields when all of the following hold:

- the automation is an approved repository workflow;
- the target field and ownership are defined by canonical documentation;
- authentication and permissions are explicitly configured;
- the workflow fails closed on discovery or mutation errors;
- every requested mutation is independently read back and verified;
- the Issue comment or other authorized trigger remains a durable record of the requested change.

Current approved work-control automation may update:

- native Issue `Priority`;
- Project `Status`;
- Project `Rank`.

It must not create a second live priority source such as `Operational Priority`.

Project view/configuration mutations remain prohibited to ordinary agents unless a reviewed procedure/workflow explicitly authorizes and verifies them.

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

Structured metadata ownership is:

- Issue `Priority` — organization-wide current priority;
- Project `Status` — workflow phase in that Project;
- Project `Rank` — exact order in that Project/backlog scope;
- Issue state — GitHub Open/Closed state;
- comments/decision records — rationale, score, historical bands and evidence.

Labels provide classification for Issues and PRs. Labels supplement, not replace, structured Issue/Project fields.

Do not create a second unofficial enum or duplicate live field where an authoritative Issue field, Project field, or `WORKFLOWS.md` value already exists.

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
- Direct connector inability to mutate Project Items does not prohibit an independently reviewed and verified GitHub Actions workflow from doing so within its documented authority.

If a required GitHub operation is unavailable, follow the current capability-alert wording defined by `WORKFLOWS.md` and applicable agent instructions.

---

## 10. Operating Principle

GitHub Issues and Pull Requests are durable work records, not disposable chat containers.

Native Issue fields hold organization-wide Issue metadata such as Priority. Project fields hold Project-scoped workflow and queue information such as Status and Rank.

`WORKFLOWS.md` defines how work moves.

`GITHUB_OPERATING_RULES.md` defines how the GitHub records and fields used by that work are operated.

This separation prevents duplicate authorities while keeping Issue and PR operating rules in one GitHub-specific document.
