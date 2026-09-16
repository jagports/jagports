# Jagports Prioritization Method

## Purpose and authority

This document defines the repeatable Jagports method for scoring and ordering active work when priority or exact execution order is explicitly required.

It complements, and does not redefine:

- `00-Management/WORKFLOWS.md` — canonical workflow states, transitions, gates and invariants.
- `00-Management/GITHUB_OPERATING_RULES.md` — GitHub record handling and priority authority.
- `00-Management/AUDIT-Common-Daily.md` — audit processing categories and audit-specific selection rules.

Priority remains optional unless explicitly requested. The Product Owner has final authority over business priority and may override a calculated order when the reason is recorded.

## Identifiers, Issue Priority, Project Rank and score are different concepts

Legacy planning identifiers such as `P6` or `P6.1` identify a work-plan position. They must not be interpreted as current priority.

For current work:

- **Issue `Priority`** is the authoritative organization-wide current priority metadata. The supported GitHub values are `Urgent`, `High`, `Medium`, and `Low`.
- **Project `Rank`** is a unique positive integer that gives exact order inside one declared Project/backlog scope. Lower numbers execute earlier; `1` is the highest-ranked active item.
- **Project `Status`** is the workflow stage of that Issue inside that Project and uses the canonical states defined by `WORKFLOWS.md`.
- **Priority score** is a comparison aid used to explain priority and rank. It is not itself authoritative metadata.
- **P0...P5 review band** is retained as decision evidence and as the compact input accepted by the synchronization automation. It maps to native Issue Priority and does not create a second authoritative priority field.

Do not add current priority or rank to an Issue title or filename.

## Prioritization scope

Issue Priority is organization-wide. Rank is Project/backlog-specific.

Every ranked queue must state its scope, for example a product release, implementation roadmap, management backlog, or other clearly bounded body of work.

Within one declared scope there is one ordered queue. Do not maintain competing ranks for the same scope. An Issue may legitimately have different ranks in different Projects because the queues have different scopes.

Do not combine unrelated scopes into one universal queue unless the Product Owner explicitly requests that comparison.

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
| Urgency | Cost of delay, time sensitivity, deadline pressure or rapidly increasing impact. |
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
Score: <-10...+10 integer>
Score state: complete | provisional
Customer value: 0..5
Business value: 0..5
Strategic differentiation: 0..5
Urgency: 0..5
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

The automation maps `Band` to native Issue `Priority`. `Rank: none` is required for P5. A score containing any `0` factor is provisional.

When priority changes materially, add a new dated record rather than rewriting historical comments.

## GitHub synchronization

Issue and Project metadata have separate ownership:

- native Issue `Priority` is organization-wide and belongs to the Issue itself;
- Project `Status` and Project `Rank` belong to a particular Project scope;
- historical P0...P5 review records remain evidence, not a duplicate live priority field.

Two workflows have separate responsibilities:

- `.github/workflows/issues-lifecycle-in-project.yml` keeps deterministic lifecycle mapping such as opened/reopened → `BACKLOG` and closed → `DONE` where configured.
- `.github/workflows/sync-issue-work-control-to-project.yml` processes an authorized `<!-- jagports-project-sync -->` comment or manual dispatch. It maps P0...P5 to native Issue Priority and updates requested Project `Status` and `Rank` values.

The work-control workflow:

1. uses the organization Issue `Priority` field as the authoritative current priority;
2. maps P0→Urgent, P1→High, P2→Medium, P3/P4→Low, and P5→unset;
3. does not add an Issue to Project #9 merely because only Issue Priority was requested;
4. resolves/adds the Project Item only when Project Status or Rank is being changed;
5. dynamically resolves the existing Project `Status` options;
6. creates numeric Project `Rank` only if missing;
7. independently reads back and verifies every value it changes;
8. reports failure when the requested state cannot be verified.

The previous Project text field `Operational Priority` is deprecated duplicate metadata. Existing values must be reconciled to native Issue Priority and verified before that Project field is retired. Historical Issue comments are retained.

The workflow intentionally does not rewrite Project view layout or sort configuration. Ranked views should be configured to sort `Rank` ascending.

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

When a maintained ranked queue exists, the audit should use it as evidence while still applying dependency, impact, urgency, readiness, unblock-value and cleanup checks.

An audit may surface a lower-ranked low-hanging-fruit or cleanup action without silently changing the maintained queue. A material reprioritization should be recorded through a new priority review.
