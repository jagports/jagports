# Jagports Prioritization Method

## Purpose and authority

This document defines the repeatable Jagports method for scoring and ordering active work when priority or exact execution order is explicitly required.

It complements, and does not redefine:

- `00-Management/WORKFLOWS.md` — canonical workflow states, transitions, gates and invariants.
- `6-Development/github/GITHUB_OPERATING_RULES.md` — GitHub record handling and priority authority.
- `00-Management/AUDIT-Common-Daily.md` — audit processing categories and audit-specific selection rules.


## Identifiers, Issue Priority, Project Rank and score are different concepts

Legacy planning identifiers such as `P6` or `P6.1` identify a work-plan position. They must not be interpreted as current priority.

For current work:

- **Issue `Priority`** is the authoritative organization-wide current priority metadata. The supported GitHub values are `Urgent`, `High`, `Medium`, and `Low`.
- **Project `Rank`** is a unique positive integer that gives exact order inside one declared Project/backlog scope. Lower numbers execute earlier; `1` is the highest-ranked active item.
- **Project `Status`** is the workflow stage of that Issue inside that Project and uses the canonical states defined by `WORKFLOWS.md`.
- **Project `Workstream`** is the queue boundary when more than one operational queue shares the same Project. Current values are `AI OS` and `VIEPS`.
- **Priority score** is a comparison aid used to explain priority and rank. It is not itself authoritative metadata.
- **P0...P5 review band** is retained as decision evidence and as the compact input accepted by the synchronization automation. It maps to native Issue Priority and does not create a second authoritative priority field.

Do not add current priority or rank to an Issue title or filename.

## Prioritization scope

Issue Priority is organization-wide. Rank is Project/backlog-specific.

Every ranked queue must state its scope, for example a product release, implementation roadmap, management backlog, or other clearly bounded body of work.

Within one declared scope there is one ordered queue. Do not maintain competing ranks for the same scope. An Issue may legitimately have different ranks in different Projects because the queues have different scopes.

When AI OS and VIEPS share one GitHub Project, `Workstream` separates those queues. Rank is interpreted inside one Workstream only; `AI OS Rank 1` and `VIEPS Rank 1` are both valid and do not compete in one universal queue.

Do not combine unrelated scopes into one universal queue unless the Product Owner explicitly requests that comparison.

## Automatic initial assessment on open

New work receives an initial prioritization assessment as part of record creation:

- **Issue opened** → perform an initial priority assessment for that Issue using this method.
- **Pull Request opened** → perform the same initial priority assessment as explicit `@priorize <PR-number>` for that Pull Request itself.
- The open-event rule is prospective. It must not be interpreted as authorization to bulk-score all existing open Issues or PRs.
- If evidence is incomplete, record a provisional assessment rather than inventing values. Existing workflow gates, Workstream preservation, Product Owner authority, and synchronization verification still apply.
- When `Workstream` is missing or unverified, the prioritization pass must attempt to determine it from durable authoritative evidence before leaving it unassigned.
- Workstream evidence, in descending authority, is: (1) an explicit Product Owner/authorized work-control decision recorded in the Issue; (2) an already verified Project Workstream/snapshot; (3) an explicit parent/owning/umbrella Issue relationship whose Workstream is verified; (4) an explicit canonical roadmap/work-plan membership that identifies the workstream. A title, label, repository path, branch name, or topical keyword by itself is not sufficient.
- When the evidence identifies exactly one canonical Workstream, include `Workstream: AI OS` or `Workstream: VIEPS` in the same authorized synchronization record and independently verify the Project field.
- When durable evidence is absent, conflicting, or genuinely ambiguous, do not guess. Synchronize native Issue Priority, leave Workstream unassigned and Project `Rank` as `none`, and treat Priority synchronization as successful but queue placement as incomplete. **The synchronization record must explicitly use `Rank: none` so the bounded Project path can resolve/create the Project item when needed, and the user-facing prioritization result must include a direct link to that Issue's GitHub Project item so a human can immediately open it and set Workstream.**
- Assign Project `Rank` only after an explicit/verified `Workstream` is available. A later Workstream classification must trigger or permit queue ranking without requiring the Issue Priority assessment to be repeated unless its evidence has materially changed.
- If a PR has no resolvable owning/closing Issue, do not infer ownership from free text. Prioritize the PR from its own verified review/integration evidence. An owning Issue is optional context, not a prerequisite for PR prioritization.

The automatic open-event assessment is the default equivalent of an initial `@priorize` pass for newly opened work records; it does not create a second prioritization model.

### Record-specific authoritative fields

Both **Issues** and **Pull Requests** have the same authoritative prioritization concepts:

- **Priority** — authoritative current business/work or review/integration priority;
- **Rank** — exact order inside one Workstream;
- **Urgency** — current urgency / cost-of-delay factor on the `0...5` scale;
- **Workstream** — canonical queue boundary;
- **Status** — canonical workflow state.

The semantic model is identical for both record types. GitHub storage differs only where the platform requires it:

| Record | Priority storage | Rank storage | Urgency storage | Workstream | Status |
|---|---|---|---|---|---|
| Issue | native Issue `Priority` | Project `Rank` | Project `Urgency` | Project `Workstream` | Project `Status` |
| Pull Request | Project `PR Priority` | Project `PR Rank` | Project `PR Urgency` | Project `Workstream` | Project `Status` |

GitHub native Issue fields do not apply to Pull Requests, so `PR Priority` is the PR storage implementation for the same authoritative **Priority** concept; it is not a different prioritization model.

Issue Rank and PR Rank are separate queues within each Workstream. The same numeric value may therefore exist once in the Issue queue and once in the PR queue for the same Workstream.

`@priorize` evaluates the same five concepts for either target type and writes them to the record-appropriate storage above.

Before scoring an item:

1. Resolve the active Issue/work identity under `WORKFLOWS.md` and exclude duplicate, completed, superseded or invalid work.
2. Identify material dependencies, blockers, required decisions and current readiness.
3. Ensure enough evidence exists to score the item without inventing facts.
4. Keep workflow gates separate from priority. A high priority does not authorize work that is blocked, unapproved or outside scope.

## Scoring factors

Use the same scale for positive and negative factors:

- `0` — unknown / not yet assessed;
- `1` — very low;
- `2` — low;
- `3` — medium;
- `4` — high;
- `5` — very high.

`0` is an unknown marker, not a favorable rating. Unknown values are excluded from the relevant group average and make the resulting score **provisional** until the missing evidence is resolved or the Product Owner explicitly accepts the uncertainty.

### Positive factors

| Factor | Meaning |
|---|---|
| Customer value | Direct benefit to users/customers or reduction of an important customer problem. |
| Business value | Revenue, cost, productivity, reliability or other material business benefit. |
| Strategic differentiation | Contribution to capabilities that materially strengthen Jagports/VIEPS differentiation or long-term direction. |
| Dependency leverage | Degree to which completing the item unblocks or enables other important work. Hard blocked dependencies are handled separately through workflow/readiness. |
| Evidence confidence | Strength and reliability of evidence supporting the need, proposed outcome and expected value. |
| Readiness | Degree to which scope, inputs, acceptance conditions and prerequisites are clear enough for execution now. |
| Reversibility | Ease and safety of changing, rolling back or replacing the result if assumptions prove wrong. More reversible work scores higher. |

### Negative factors

| Factor | Meaning |
|---|---|
| Effort | Expected implementation time, complexity and resource consumption. |
| Risk | Technical, operational, security, data, product or delivery risk created by doing the work. |

## Score calculation

For every known factor rating `r` in the range `1...5`, normalize it to `0...10`:

```text
normalized factor = (r - 1) * 2.5
```

Then calculate:

```text
Value index  = average(normalized known positive factors)
Burden index = average(normalized known negative factors)

Priority score = round(Value index - Burden index)
```

The resulting integer score range is `-10...+10`.

If a group has no known values, use `0` for that group index and mark the score provisional. Any `0` factor makes the complete score provisional; it must not be presented as equally reliable as a fully assessed score.

The score supports comparison; it is not an autonomous decision engine. Explicit Product Owner decisions, hard dependencies, workflow gates, fixed commitments and verified blockers take precedence and must remain visible in the work record.

## Review bands and native Issue Priority mapping

When a priority review uses the P0...P5 bands, map them to the native Issue `Priority` field as follows:

| Review band | Meaning | Native Issue `Priority` |
|---|---|---|
| P0 | Immediate exceptional show-stopper or critical time-bound work | `Urgent` |
| P1 | Do next | `High` |
| P2 | Queue next | `Medium` |
| P3 | Planned later | `Low` |
| P4 | Opportunity / no current allocation | `Low` |
| P5 | Cancelled / revisit candidate | unset |

P0 is not generated automatically from score; its exceptional reason must be stated explicitly.

P3 and P4 intentionally share native `Low` priority. Their different allocation meaning remains in the review record and, where applicable, in Project Rank or lack of current allocation.

P5 is outside the active execution queue. It has no active Rank and no native Issue Priority value. Historical scoring and decision evidence remains in comments and linked records.

Do not create fixed numeric score thresholds for Issue Priority values. The score supports the decision; the native Issue `Priority` is the authoritative current priority metadata.

A priority value does not replace Project Status. An Issue can be `Urgent` while still being `DECISION NEEDED` or `BLOCKED`.

## Exact queue ordering

Every actively ranked item receives one unique Project `Rank` within its declared scope: `1`, `2`, `3`, and so on.

Lower numbers mean earlier execution. Ranked Project views should sort `Rank` ascending so Rank `1` appears first.

P5 items have no active rank.

Order active items primarily by score after applying workflow gates and explicit Product Owner direction.

When scores are equal or close enough that the numerical difference is not decision-useful, use these tie-breakers in order:

1. prerequisite/unblock value;
2. urgency and cost of delay;
3. readiness for immediate execution;
4. evidence confidence;
5. lower effort;
6. lower risk;
7. older ready work when no stronger distinction exists.

Do not use artificial decimal scores merely to force separation. Record the tie-break rationale instead.

## Product Owner overrides

The Product Owner may override calculated priority, band or rank.

An override must record:

- the resulting Issue Priority and, where applicable, Project Rank;
- the reason;
- the date;
- the authority/decision record when applicable.

An override changes the active order; it does not erase the previous calculation or historical record.

## Blocked and decision-dependent work

- A `BLOCKED` item does not become executable merely because it has high Issue Priority or Rank.
- A `DECISION NEEDED` item does not become implementation-ready merely because it has high priority.
- A dependent item must not be ranked ahead of a required prerequisite in the executable sequence unless the recorded queue explicitly explains parallel work that makes this valid.
- P5/cancelled and other completed/closed work is removed from the active queue and retained only as historical evidence.

## Recording a priority review

Record a priority review in the relevant active Issue or other authorized work record using enough detail to reproduce the decision.

Use the automation marker only when the same record should synchronize the native Issue Priority and/or Project fields:

```text
<!-- jagports-project-sync -->
Priority review — YYYY-MM-DD
Scope: <declared queue scope>
Status: BACKLOG | RESEARCH | PROPOSED | DECISION NEEDED | APPROVED | IMPLEMENTATION | REVIEW | TESTING | BLOCKED | DONE
Band: P0 | P1 | P2 | P3 | P4 | P5
Rank: <unique positive integer within Project scope> | none
Urgency: 0..5
Score: <-10...+10 integer>
Score state: complete | provisional
Customer value: 0..5
Business value: 0..5
Strategic differentiation: 0..5
Dependency leverage: 0..5
Evidence confidence: 0..5
Readiness: 0..5
Reversibility: 0..5
Effort: 0..5
Risk: 0..5
Dependencies / gates: <material facts>
Rationale: <brief explanation>
Override: none | <recorded Product Owner override>
Evidence: <Issue/PR/document references>
```

For Issues, the automation maps `Band` to native Issue `Priority` and writes `Rank` / `Urgency` to the Issue Project Item. `Rank: none` is required for P5. A score containing any `0` factor is provisional.

For Pull Requests, use the PR synchronization record with `PR Priority`, `PR Rank`, and `PR Urgency`; these values belong to the PR Project Item and do not overwrite the owning Issue.

When priority changes materially, add a new dated record rather than rewriting historical comments.

## GitHub synchronization

Issue and Project metadata have separate ownership:

- native Issue `Priority` is organization-wide and belongs to the Issue itself;
- Project `Status`, Project `Rank`, Project `Urgency`, and Project `Workstream` belong to an Issue Project Item in a particular Project scope;
- historical P0...P5 review records remain evidence, not a duplicate live priority field.

The current workflows have these responsibilities:

- `.github/workflows/issues-lifecycle-in-project.yml` keeps deterministic lifecycle mapping such as opened/reopened → `BACKLOG` and closed → `DONE` where configured.
- `.github/workflows/sync-issue-work-control-to-project.yml` is the single bounded work-control synchronizer. It processes an authorized `<!-- jagports-project-sync -->` comment or standalone `<!-- jagports-workstream-sync -->` comment for one open Issue, maps P0...P5 to native Issue Priority, updates requested Project `Status`, `Rank`, `Urgency`, and `Workstream`, independently verifies the authoritative values, and refreshes only that Issue's agent-readable snapshot.
- Manual `workflow_dispatch` on the work-control synchronizer is recovery-only: it requires one explicit Issue number and refreshes only that Issue's snapshot. It cannot request a full-Project reconciliation or authoritative field mutation.

The work-control workflow:

1. uses the organization Issue `Priority` field as the authoritative current priority;
2. maps P0→Urgent, P1→High, P2→Medium, P3/P4→Low, and P5→unset;
3. does not add an Issue to Project #9 merely because only Issue Priority was requested;
4. permits Priority-only synchronization when Workstream is unassigned or unverified; in that case `Rank` remains `none` and the Priority synchronization is still a successful prioritization result;
5. resolves/adds the Project Item only when Project Status, Rank, or Workstream is being changed;
6. requires the canonical Project `Status`, numeric `Rank`, and `Workstream` field definitions to resolve unambiguously when those Project fields are requested, and fails closed on missing/duplicate definitions for the requested Project mutation;
7. accepts only canonical `Workstream` values `AI OS` and `VIEPS`;
8. independently reads back and verifies every authoritative value it changes;
9. after successful verification, reads and refreshes only the same Issue's managed snapshot inline rather than dispatching another workflow;
10. ignores closed Issues for routine work-control mutation and snapshot refresh;
11. reports failure when requested authoritative state or snapshot state cannot be independently verified.

### Workstream synchronization

When the combined Project is used, set its queue boundary with an authorized standalone marker comment:

```text
<!-- jagports-workstream-sync -->
Workstream: AI OS
```

or:

```text
<!-- jagports-workstream-sync -->
Workstream: VIEPS
```

The same bounded work-control workflow processes this marker. Workstream synchronization does not use a separate `issue_comment` workflow listener.

`Workstream` is a structured Project field, not a repository label.

### Agent-readable work-control snapshot

The managed snapshot is a read-only bridge for ChatGPT/agents or other tools that cannot directly read all native Issue/Project fields. It must never become a competing source of truth.

Each managed snapshot comment is identified by the standalone marker:

```text
<!-- jagports-work-control-snapshot -->
```

The snapshot contains at minimum:

- verification timestamp when the managed comment is written;
- native Issue `Priority`;
- Project identity;
- direct GitHub Project item URL;
- Project `Workstream`;
- Project `Status`;
- Project `Rank`.

Snapshot publication is strictly single-Issue and bounded. The work-control workflow resolves Project membership from the target Issue, never by scanning all Project Items. It updates at most one managed snapshot comment for that Issue and independently rereads the comment to verify the expected Priority, Workstream, Status and Rank lines. If multiple managed snapshot comments exist for one Issue, it fails closed rather than choosing one arbitrarily.

Snapshot writes use the repository `GITHUB_TOKEN`, while Project reads/writes use the separately authorized Project token. GitHub suppresses ordinary workflow runs for events created by `GITHUB_TOKEN`; this prevents the managed snapshot comment from recursively starting `issue_comment` workflows.

Snapshot refresh paths are limited to:

1. **Immediate event-driven refresh** — after a verified authoritative Priority/Status/Rank or Workstream change, the same workflow refreshes only the affected open Issue's snapshot inline.
2. **Bounded manual recovery** — `workflow_dispatch` requires one Issue number and performs snapshot-only recovery for that one open Project Issue.

There is deliberately **no scheduled full-Project snapshot reconciliation, no broad manual full-Project publisher, and no workflow-to-workflow snapshot dispatch**. Recovery must remain explicitly bounded so a mistaken invocation cannot fan out over hundreds of Issues or consume a material portion of the Actions allowance.

The previous Project text field `Operational Priority` is deprecated duplicate metadata. Existing values were migrated/reconciled to native Issue Priority and the duplicate field was retired only after verification. The one-time migration workflow was retired after completion. Historical Issue comments remain evidence.

The workflows intentionally do not rewrite Project view layout or sort configuration. Ranked views should be configured to filter by Workstream where applicable and sort `Rank` ascending.

Only trusted repository/organization actors may trigger comment-based synchronization. The Issue comment remains the durable decision record.

## Queue maintenance

Re-evaluate an active queue when a material change occurs, including:

- scope or Product Owner direction changes;
- a prerequisite completes or a blocker appears/disappears;
- new evidence materially changes confidence or value;
- urgency changes;
- effort or risk estimates change materially;
- an item becomes ready, completed, cancelled, superseded or invalid.

Prefer finishing, validating, merging, consolidating and closing existing high-value work over continuously creating new queue entries.

A queue record should be compact and show at minimum the Issue/PR link, native Issue Priority, Project Rank where applicable, score, workflow/readiness state and next action.

## Relationship to daily audits

Daily audit categories such as `SHOW-STOPPERS`, `DO FIRST`, `LOW-HANGING FRUITS` and `QUEUE CLEANUP` are audit-report categories, not substitutes for Issue Priority or Project Rank.

Within each audit Workstream, the maintenance path is:

`audit discovers relevant candidates → inspect current Priority/Rank/Status → if a materially relevant active Issue has missing or stale priority evidence, perform or refresh a priority review → record the dated review → synchronize only that Issue through the bounded work-control path`

Candidate selection remains controlled by `00-Management/AUDIT-Common-Daily.md`: current audit categories plus dependency, impact, urgency, readiness, unblock-value and cleanup evidence. Routine daily audits must **not** bulk-score or assign Priority to every open Issue, and missing Priority alone is not a trigger to score every Issue.

A priority review is required or refreshed when an active Issue becomes materially relevant to current queue maintenance and its Priority/Rank evidence is missing, stale, or materially inconsistent with current evidence. Do not create routine priority-review work for inactive, irrelevant, completed, superseded, or closed Issues merely because priority metadata is absent.

Priority review may inspect and record the actual current `Status`, but prioritization must not invent or advance workflow phase. Material strategic reordering, P0/Urgent changes, scope changes, or other Product Owner decisions stay under the audit's `DECISIONS NEEDED` handling rather than being silently changed.

When a maintained ranked queue exists, the audit should use it as evidence while still applying dependency, impact, urgency, readiness, unblock-value and cleanup checks.

The AI OS audit operates on the `AI OS` Workstream and the VIEPS audit operates on the `VIEPS` Workstream while those queues share the same GitHub Project. Their Rank values are evaluated only inside the applicable Workstream.

Scheduled audits perform prioritization reconciliation and queue maintenance. They do not trigger or depend on an unbounded snapshot reconciliation. Synchronization and recovery remain single-Issue operations. If an individual snapshot needs recovery, refresh only that specific open Issue through the bounded single-Issue recovery path.

Closed Issues remain excluded from routine audit/prioritization maintenance.

An audit may surface a lower-ranked low-hanging-fruit or cleanup action without silently changing the maintained queue. A material reprioritization should be recorded through a new priority review.


