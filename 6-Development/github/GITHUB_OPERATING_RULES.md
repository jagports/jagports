# Jagports GitHub Operating Rules

## Purpose

This document defines how Jagports uses GitHub records for work control and traceability.

It covers GitHub Issues, Pull Requests, reviews, testing evidence, comments, Issue fields, Project information, and record integrity.

It does **not** define the Management workflow state machine. The single canonical normative source for workflow states, transitions, gates, and workflow invariants is:

`../../00-Management/WORKFLOWS.md`

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

Create or reuse an Issue according to the discovery and historical-work rules in `../../00-Management/WORKFLOWS.md`.

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

Do not create duplicate Issues when an existing open or historically completed record already satisfies the request. Apply the discovery rules in `../../00-Management/WORKFLOWS.md`.

### 2.3 Priority, Rank and Status ownership

Priority is assessed automatically for every newly opened Issue and Pull Request. Issues retain business/work Priority and Issue Rank; Pull Requests receive independent review/integration `PR Priority` and `PR Rank` on their Project Items. Capable repository automation may inherit verified owning-Issue Priority and Workstream into a PR Project Item as an initial baseline; the current ChatGPT/GitHub connection must not read or claim Project Item state itself. Later PR prioritization may diverge without overwriting Issue priority/order. Outside these open-event assessments and other explicitly authorized prioritization paths, Priority is optional and may be requested by the requester, a human, or the Product Owner.

When priority is in use:

- the organization-level native Issue field **`Priority`** is the authoritative current priority for the Issue;
- the supported current values are `Urgent`, `High`, `Medium`, and `Low`;
- exact execution order inside a particular Project/backlog is stored in that Project's numeric **`Rank`** field;
- workflow phase inside a Project is stored in that Project's **`Status`** field and follows `../../00-Management/WORKFLOWS.md`;
- scoring comments and P0...P5 review bands are decision evidence and automation inputs, not competing live priority fields.

Rank is scoped to a Project/backlog. The same Issue may legitimately have different ranks in different Project scopes. Lower Rank numbers execute earlier; `1` is the highest-ranked active item.

Never put current priority or rank in an Issue title or filename. Historical planning identifiers such as `P6` or `P6.1` are work-plan identifiers and must not be interpreted as current Issue Priority.

The Product Owner has final authority over priority and queue order.

#### 2.3.1 Automatic prioritization on open

The opening of a new GitHub work record is a prioritization trigger:

- **Issue opened** → run an initial priority assessment on that Issue under `../../00-Management/PRIORITIZATION.md`.
- **Pull Request opened** → run an initial priority assessment for the Pull Request Project Item itself. Resolve owning/closing Issue evidence when available and use it only as an initial PR baseline; refresh the owning Issue only when its own evidence materially changed.
- Pull Request Project Items use `PR Priority` and `PR Rank`; these fields are independent from the owning Issue's native `Priority` and Issue `Rank`.
- Do not infer the owning Issue from title/body heuristics when no durable closing/ownership relationship exists.
- If Project `Workstream` is missing or unverified, the prioritization operation must first attempt to classify it from durable authoritative evidence.
- Valid classification evidence is limited to an explicit Product Owner/authorized work-control decision, an already verified Workstream/snapshot, an explicit parent/owning/umbrella Issue with verified Workstream, or explicit canonical roadmap/work-plan membership that identifies the Workstream.
- If exactly one canonical Workstream is established, synchronize and independently verify that Workstream as part of the prioritization operation.
- Do not classify Workstream from title, labels, repository paths, branch names, or topical/semantic similarity alone.
- If durable evidence is absent, conflicting, or ambiguous, native Issue Priority may still succeed; leave Workstream unassigned and Project `Rank` as `none`. The synchronization record must explicitly use `Rank: none` so the Project item can be resolved/created when needed, and the user-facing prioritization result must include a direct link to that Project item so a human can immediately set Workstream.
- Project `Rank` is assigned only after an explicit/verified Workstream exists.
- This rule is prospective and bounded to the newly opened record. It does not authorize bulk reprioritization of the existing backlog.

The resulting priority record remains evidence subject to the normal synchronization, Workstream, workflow-gate, verification, and Product Owner rules.

#### 2.3.2 `@priorize` and priority-synchronization Workstream preservation

`@priorize <numbers>` is GitHub execution shorthand for applying the priority semantics defined by `../../00-Management/PRIORITIZATION.md`; it does not create a separate prioritization model.

Issue business Priority and Issue Rank belong to the Issue. Pull Request review/integration priority belongs to the Pull Request Project Item as `PR Priority` and `PR Rank`. If an `@priorize` request includes a Pull Request number, prioritize that Pull Request directly; resolve its owning/closing Issue only for verified baseline/context and Workstream inheritance. Do not overwrite the owning Issue's Priority/Rank unless the Issue itself is also explicitly or automatically due for reassessment.

When a prioritization operation synchronizes an Issue Project `Rank`, the authorized `<!-- jagports-project-sync -->` record must also explicitly include the applicable canonical Project `Workstream`:

- `AI OS`; or
- `VIEPS`.

`Scope:` in a priority-review comment is descriptive decision context only. It must never be interpreted as, substituted for, or relied on to mutate the Project `Workstream` field.

For an existing Issue, preserve the latest explicitly verified Workstream from authoritative Project read-back evidence, including the managed work-control snapshot produced by the bounded synchronization workflow. Do not silently replace an already verified Workstream merely because a later prioritization request omits it.

If no Workstream is already known, actively resolve it using the durable classification evidence defined above. When exactly one canonical Workstream is established, include it in the authorized synchronization record and verify the resulting Project field. If the evidence remains absent, conflicting, or ambiguous, do not infer Workstream from title, body prose, branch name, labels, Issue type, repository path, semantic topic, or other free-text/context heuristics. **This does not block native Issue Priority synchronization.** Complete and verify the Issue Priority update, leave Project `Rank` as `none`, and defer queue placement until Workstream is explicitly established.

Priority, Project Status, Project Rank, and Project Workstream remain separate concerns. A prioritization operation may update them together through one authorized synchronization record, but one field must never be inferred from another.

A prioritization mutation is not successful merely because the request comment was written. Claim success only after the existing bounded work-control automation independently reads back and verifies the requested authoritative fields and refreshes the same Issue's managed snapshot.

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

If a dependency prevents progress, use the workflow state required by `../../00-Management/WORKFLOWS.md` and document the blocker, impact, required resolution, and responsible party where known.

Do not invent alternative workflow states in an Issue.

### 2.7 Issue Closure

Closing an Issue is not merely an administrative action.

Before closure, verify the completion obligations defined by `../../00-Management/WORKFLOWS.md` and the Issue itself, including implementation, review, testing, merge, and acceptance where applicable.

A merged PR does not by itself prove that the Issue is complete.

### 2.8 Jagports task hierarchy: do not use native GitHub sub-issues

Do **not** use native GitHub sub-issues for Jagports AI OS or VIEPS task hierarchy.

Jagports hierarchy is documented in durable Issue-body traceability instead:

- the parent Issue lists its child task Issues in the Issue body;
- each child Issue identifies its parent Issue in the Issue body;
- comments may add traceability evidence, but the Issue body is the durable hierarchy location for active records.

Native GitHub parent/sub-issue metadata is not required Jagports state and must not be created, repaired, synchronized, or treated as the source of truth by agents.

This rule applies regardless of whether native sub-issue operations are exposed through REST, GraphQL, GitHub CLI, UI, connector, or future tooling.

---

## 3. Pull Request Rules

### 3.1 PR as the Integration Record

Repository changes must use a Pull Request as the normal integration path, as required by `../../00-Management/WORKFLOWS.md`.

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

The executing actor must stop at the review boundary defined by `../../00-Management/WORKFLOWS.md` and must not merge its own implementation merely because GitHub reports the PR as mergeable.

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

The workflow consequences of these outcomes are defined in `../../00-Management/WORKFLOWS.md`.

### 3.6 Review Comments and Conversations

The reviewer who submitted a review is the normal authority for resolving comments belonging to that review.

The PR executor, PR author, or another non-reviewer must not resolve those review comments on the reviewer's behalf.

When changes are requested, the executor may implement the requested changes and reply to the review comments, but should leave the reviewer's comments unresolved for the reviewer to resolve after verification.

For human-facing Jagports documentation and communication, use GitHub UI vocabulary:

- **Review conversation** is the preferred term for an inline Pull Request review discussion.
- Use **Unresolved Review conversation** and **Resolved Review conversation** when describing its state.
- Reserve **review thread** or **review thread object** for GitHub API, GraphQL, or tool implementation details.
- When a tool/API returns a review-thread object, translate that implementation vocabulary to **Review conversation** before reporting the state to a human.
- The durable mapping is: **Review conversation (GitHub UI / human-facing)** ↔ **review thread (API / GraphQL / tool object)**.

Review discussion and formal review submission are distinct. A finding that needs maker/executor interaction before the formal review outcome must be communicated through an immediately visible channel.

A GitHub `PENDING` review is only a draft review. Line-level and file-level comments created inside the normal pending-review flow remain part of that pending review and are visible only to the reviewer until submission. Therefore `line comment` or `file comment` alone does not mean the comment is immediately visible.

When anchored diff discussion is needed before formal review submission, prefer a standalone submitted PR review comment created directly through the review-comment mechanism/API/tool when that mechanism supports immediate submission without holding a `PENDING` review.

If standalone anchored submission is unavailable in the current UI/tool, use an immediately visible top-level PR Conversation comment and include direct file/line links where needed for precise implementation context.

The maker/executor may reply to visible review discussion and implement requested changes before a formal `APPROVE`, `REQUEST_CHANGES`, or `COMMENT` review outcome has been submitted. Such replies and changes are not approval.

The reviewer must verify the maker/executor response and resulting implementation before treating the underlying concern as completed.

An anchored submitted diff/line Review conversation may become GitHub `outdated` when a later commit changes the referenced code. `outdated` is a diff-state signal only; it does not prove that the underlying review concern was satisfied.

If a Review conversation becomes `outdated`, the reviewer must determine whether the concern was actually addressed, remains applicable elsewhere, or no longer applies before considering it complete.

A formal review should not normally be submitted while an actionable Review conversation from that review round remains unresolved. When discussion establishes an unresolved blocking concern, continue the Review conversation or submit `REQUEST_CHANGES`; do not submit `APPROVE`.

GitHub formal review outcomes (`APPROVE`, `REQUEST_CHANGES`, or `COMMENT`) determine the submitted review result; approval must not be inferred from a notification, discussion comment, reply, implementation change, Resolved Review conversation state, outdated state, checkbox state, or inactivity.

The reviewer who owns a review concern is the only actor authorized to resolve that concern on the reviewer's behalf. The PR executor, PR author, or any other non-reviewer must not resolve it. The repository/project owner or another explicitly designated human authority is an exception and may resolve it when exercising that authority.

When review changes are requested, the executor may implement the requested changes, update executor-controlled checkbox state to reflect the actual implementation state, and reply to the relevant Review conversation, but must leave reviewer-owned concerns unresolved for the reviewer to verify and resolve.

Every reply to a review comment that reports implementation of a requested change must state what was changed to comply and include a direct, line-specific GitHub link to the actual implementation lines. Prefer a stable commit-pinned `blob/<commit>/<path>#Lx-Ly` link to the resulting lines; where GitHub provides an equivalent direct PR diff/review location that visibly identifies the changed lines, that may be used instead. A PR-level or file-level link alone is insufficient when a specific line link can be provided.

The executor must establish the exact changed file and resulting line range before posting the reply. If the implementation spans multiple distinct line ranges, include a direct line-specific link for each relevant range. Do not claim line-specific implementation evidence until the link has been checked to lead to the intended changed lines.

The line-specific implementation reply is evidence for reviewer verification; it does not resolve the Review conversation and does not satisfy the formal review approval gate by itself. The reviewer remains responsible for verification and resolution under the existing authority rule.

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

### 3.8 Automated Validation Baseline

Automated validation is selected from the actual changed component and repository capabilities; Jagports does not impose one universal command on every change.

For every implementation PR, the executor must determine and record which existing automated checks apply. The minimum baseline is:

- run every repository check that is explicitly applicable to the changed paths/component or required by its documented test entry point;
- run applicable unit, integration, smoke, schema/data-integrity, syntax/lint, documentation/convention, deployment/configuration, and security checks when those checks exist for the changed area;
- treat an unavailable or silently skipped required validation as a failed gate rather than PASS;
- record the applicable checks and results as persistent PR/Issue evidence.

Checks that apply to all changes are **always-required**. Checks scoped by component, path, runtime, data model, deployment target, or risk category are **domain-specific** and are required only when their documented trigger applies. Existing examples include category-convention, parts-model, VIEPS i18n, JEPC importer, and Issue-lifecycle validation.

A validation becomes a required merge gate when an authoritative repository rule, component test instruction, applicable workflow/check configuration, Issue acceptance criterion, or explicit approved work requirement identifies it as required. A new check is not made globally mandatory merely because it exists.

A failed, `BLOCKED`, unavailable, or unverified required automated check blocks merge. An exception/waiver must be an explicit Product Owner decision recorded in the Issue/PR, with the reason, residual risk, and scope of the exception. The exception does not rewrite failed evidence as PASS.

Prefer existing repository-native or free-tier GitHub validation where it is sufficient. Add new paid/external validation only when the requirement cannot reasonably be met by the existing/free path and the applicable cost/authority decision is approved.

### 3.9 Testing Evidence

Required testing must be performed according to `../../00-Management/WORKFLOWS.md`.

A required pre-merge test must use the PR branch/current implementation being proposed for merge and must record sufficient evidence to establish:

- what was tested
- where/how it was tested
- result
- relevant command or procedure
- important failures or limitations

`FAIL`, `BLOCKED`, or `NOT TESTED` is not successful validation for a required pre-merge test.

Post-merge testing cannot substitute for required pre-merge validation unless the specific capability cannot exist before the workflow is present on the default branch and the reviewed change explicitly defines a controlled post-merge activation test.

### 3.10 Merge

No actor may merge merely because a PR is technically mergeable.

Required review, testing, approval, and other gates must be satisfied before merge.

All review comments must be resolved in addition to `Review Approved` before merge is allowed.

Before any merge operation, the executing actor must perform a fresh, independent review-state check for the target PR. This check is a hard precondition for invoking the merge operation; GitHub's technical `mergeable` result is not a substitute.

The check must:

1. Read the PR's current review submissions immediately before merge.
2. Determine the effective review state from the review history, including whether a later review supersedes an earlier review.
3. Treat `CHANGES_REQUESTED` / `REQUEST_CHANGES` as a blocking state. **STOP — DO NOT MERGE.**
4. Never allow an earlier `APPROVED` review to satisfy the gate when a later blocking review exists.
5. Verify all applicable Issue Acceptance checkboxes are `[x]`.
6. Verify all required PR checklist checkboxes are `[x]`.
7. Verify required tests are `PASS`.
8. Treat review-comment wording as content to act on, not as merge authorization. In particular, wording such as `merge files` means modify/combine files unless the review state itself has independently passed.
9. If requested changes need implementation, implement them on the PR branch, push them, and return to review. Do not resolve the reviewer's blocking comments or merge the PR on the reviewer's behalf.
10. Permit merge only when the current review gate is independently verified as passed and all checkbox/testing gates have passed.
11. If any required state cannot be determined reliably, **STOP/BLOCK and DO NOT MERGE**.

Required decision rule:

`Issue Acceptance all [x] + PR required checklist all [x] + required tests PASS + independent review APPROVED → merge permitted`

This rule applies regardless of whether the requested change is large, small, documentary, mechanical, or apparently implied by the review comment.

After merge, verify the resulting repository state and update the relevant work record as required by `../../00-Management/WORKFLOWS.md`.

---

## 4. GitHub Project Rules

The GitHub Project provides the Kanban representation of work and Project-scoped structured information.

The Project is not a replacement for the Issue work record or organization-level Issue fields.

Detailed Project/Kanban workflow behavior is defined in `Projects/GITHUB_PROJECT_WORKFLOWS.md`.

The current ChatGPT/GitHub Project capability boundary is defined in `Projects/PROJECT_CAPABILITY_BOUNDARY.md`.

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
- Project `Rank`;
- Project `Workstream`.

It must not create a second live priority source such as `Operational Priority`.

Project view/configuration mutations remain prohibited to ordinary agents unless a reviewed procedure/workflow explicitly authorizes and verifies them.

### 4.2 Workflow State Authority

This document does not define workflow states or transitions.

Use `../../00-Management/WORKFLOWS.md` for:

- valid states
- transition rules
- transition gates
- blocked-state handling
- review boundaries
- testing boundaries
- closure conditions
- historical-work discovery
- workflow invariants

### 4.3 Project Item Status Execution and Consistency

`../../00-Management/WORKFLOWS.md` remains authoritative for when a workflow state is required. This section defines only how the corresponding GitHub Project Item Status operation is owned and checked.

Current verified mechanisms are:

- Issue `opened` / `reopened` → `BACKLOG`: `.github/workflows/issues-lifecycle-in-project.yml` owns the Project Item operation and independently verifies the resulting item/status;
- open Pull Request with a same-repository GitHub closing relationship → `IMPLEMENTATION`: `.github/workflows/sync-closing-pr-to-project.yml` owns that deterministic implementation-start synchronization, preserves protected later/blocking/decision states, and independently verifies the resulting Project Item/status;
- explicit authorized work-control changes: `.github/workflows/sync-issue-work-control-to-project.yml` may synchronize native Issue `Priority` plus requested canonical Project `Status`, numeric `Rank`, and canonical `Workstream` from its authorized marker-comment/manual-dispatch inputs and independently verifies every changed value;
- Issue `closed` → `DONE`: `.github/workflows/issues-lifecycle-in-project.yml` owns the Project Item operation and independently verifies the resulting item/status.

The closing-linked-PR automation is the authoritative automatic owner of the `IMPLEMENTATION` transition. The controlled work-control workflow is a transport for an explicit authorized transition; it does not infer `REVIEW`, `TESTING`, `BLOCKED`, `DECISION NEEDED`, or another state merely from repository activity. Those states still require the canonical `WORKFLOWS.md` transition decision/evidence and an authorized, verified Project mutation.

The legacy `CODING` option has been migrated to canonical `IMPLEMENTATION`; current operating rules must not reintroduce `CODING` as an active state.

At review hand-off, testing hand-off, merge/closure, and any audit that evaluates work-state consistency, compare persistent Issue/PR evidence with the Project Item Status. If they diverge:

1. record the mismatch in the active Issue/PR;
2. do not claim the intended Project state as actual;
3. identify the expected `WORKFLOWS.md` state and observed Project Item Status;
4. route correction through the applicable authorized human or verified repository automation;
5. independently verify the corrected Project Item Status.

If Project Item state cannot be read, record the capability limitation; absence of read capability does not make the intended state verified and does not by itself create a new workflow state.

Any future automation that assumes a new automatic intermediate-state transition must have persistent end-to-end test evidence covering the real trigger, resulting Project Item identity/status, and independent read-back verification before it is treated as authoritative.

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

When multiple Issues are resolved, include an explicit closing/traceability reference for each applicable Issue.

---

## 6. Record Integrity and Historical Records

Closed Issues and merged PRs are historical GitHub records.

Their descriptions and comments must not be rewritten to change history.

Closed Issues and merged PRs must retain their historical titles.

Open Issue or PR titles may be changed when scope materially changes; GitHub's event history preserves the previous title.

Do not copy historical descriptions or comments into current documents merely to create an archive. Link to the historical record instead.

Historical records may be used as evidence when applying the discovery and historical-work rules in `../../00-Management/WORKFLOWS.md`.

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

1. `../../00-Management/WORKFLOWS.md` is authoritative for Management workflows.
2. This `GITHUB_OPERATING_RULES.md` is authoritative for GitHub record operation and GitHub-specific handling.
3. `../../00-Management/RULES.md` provides governance and rationale and must not redefine workflow semantics.
4. `../../0-DocumentationEducationCompetense/SKILL.md` provides agent execution instructions and must implement/reference, not redefine, workflow semantics.
5. `.codex/skills/*` provides specialized procedures and must implement/reference the canonical workflow.
6. `../../KNOWLEDGE.md` contains durable knowledge and is not workflow authority.

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
- Use repository-owned Project automation only where an authoritative workflow assigns it, and claim success only after the automation's independent verification/read-back succeeds.

If a required GitHub operation is unavailable, follow the current capability-alert wording defined by `../../00-Management/WORKFLOWS.md` and applicable agent instructions.

---

## 10. Operating Principle

GitHub Issues and Pull Requests are durable work records, not disposable chat containers.

Native Issue fields hold organization-wide Issue metadata such as Priority. Project fields hold Project-scoped workflow and queue information such as Status and Rank.

`../../00-Management/WORKFLOWS.md` defines how work moves.

`GITHUB_OPERATING_RULES.md` defines how the GitHub records and fields used by that work are operated.

This separation prevents duplicate authorities while keeping Issue and PR operating rules in one GitHub-specific document.
