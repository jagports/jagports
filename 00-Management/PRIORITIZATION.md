# Jagports Prioritization Method

## Purpose and authority

This document defines the repeatable Jagports method for scoring and ordering active work when priority or exact execution order is explicitly required.

It complements, and does not redefine:

- `00-Management/WORKFLOWS.md` — canonical workflow states, transitions, gates and invariants.
- `00-Management/GITHUB_OPERATING_RULES.md` — GitHub record handling and priority authority.
- `00-Management/AUDIT-Common-Daily.md` — audit processing categories and audit-specific selection rules.

Priority remains optional unless explicitly requested. The Product Owner has final authority over business priority and may override a calculated order when the reason is recorded.

## Identifiers, priority and rank are different concepts

Legacy planning identifiers such as `P6` or `P6.1` identify a work-plan position. They must not be interpreted as the current operational priority of that Issue.

For current work:

- **Operational priority band** communicates handling urgency when priority is explicitly in use.
- **Rank** is a unique positive integer that gives exact order inside one declared prioritization scope.
- **Score** is a comparison aid used to produce and explain the rank.

Do not add current priority or rank to an Issue title or filename. Record it in an authorized structured field when available and/or in the Issue work record.

## Prioritization scope

Every ranked queue must state its scope, for example a product release, implementation roadmap, management backlog, or other clearly bounded body of work.

Within one declared scope there is one ordered queue. Do not maintain competing queues for the same scope.

Do not combine unrelated scopes into one universal queue unless the Product Owner explicitly requests that comparison.

Before scoring an item:

1. Resolve the active Issue/work identity under `WORKFLOWS.md` and exclude duplicate, completed, superseded or invalid work.
2. Identify material dependencies, blockers, required decisions and current readiness.
3. Ensure enough evidence exists to score the item without inventing facts.
4. Keep workflow gates separate from priority. A high score does not authorize work that is blocked, unapproved or outside scope.

## Scoring factors

Score each factor from `0` to `3`.

For positive factors, `0` means none, unknown or not applicable; `1` low; `2` material; `3` high.

For effort and risk, `0` means very small/low and `3` means large/high.

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

Use:

```text
Priority score =
  Customer value
+ Business value
+ Strategic differentiation
+ Urgency
+ Dependency leverage
+ Evidence confidence
+ Readiness
+ Reversibility
- Effort
- Risk
```

The score range is `-6...24`.

The score supports comparison; it is not an autonomous decision engine. Explicit Product Owner decisions, hard dependencies, workflow gates, fixed commitments and verified blockers take precedence and must remain visible in the work record.

## Operational priority bands

When priority bands are explicitly required, use:

- **P0 — Immediate:** exceptional genuine show-stopper or critical time-bound work requiring immediate action. P0 is not generated automatically by a score; the reason must be stated explicitly.
- **P1 — Do next:** highest-ranked actionable work currently intended for execution.
- **P2 — Queue next:** valid actionable work expected after P1 work.
- **P3 — Later:** valid work intentionally deferred behind higher-value or prerequisite work.
- **P4 — Parked:** valid work with no current resource allocation or an explicit defer/hold decision.

Do not create fixed numeric score thresholds for these bands. The exact queue rank is authoritative within the declared prioritization scope; the band is a handling summary.

A priority band does not replace workflow status. For example, an item can be strategically important while still being `DECISION NEEDED` or `BLOCKED`.

## Exact queue ordering

Every actively ranked item receives one unique `Rank` within its declared scope: `1`, `2`, `3`, and so on.

Order items primarily by score after applying workflow gates and explicit Product Owner direction.

When scores are equal or close enough that the numerical difference is not decision-useful, use these tie-breakers in order:

1. prerequisite/unblock value — required prerequisites before dependent work;
2. urgency and cost of delay;
3. readiness for immediate execution;
4. evidence confidence;
5. lower effort;
6. lower risk;
7. older ready work when no stronger distinction exists.

Do not use artificial decimal scores merely to force separation. Record the tie-break rationale instead.

## Product Owner overrides

The Product Owner may override a calculated rank or band.

An override must record:

- the resulting band/rank;
- the reason;
- the date;
- the authority/decision record when applicable.

An override changes the active order; it does not erase the previous calculation or historical record.

Explicit strategic allocation decisions also act as overrides. For example, work deliberately assigned zero current resources remains parked until that decision changes, even if a later mechanical score would otherwise place it higher.

## Blocked and decision-dependent work

- A `BLOCKED` item does not become executable merely because it has a high score. The work needed to remove the blocker may itself be separately ranked.
- A `DECISION NEEDED` item does not become implementation-ready merely because it has a high score. The decision request may itself be prioritized.
- A dependent item must not be ranked ahead of a required prerequisite in the executable sequence unless the recorded queue explicitly explains parallel work that makes this valid.
- Completed/closed work is removed from the active queue and retained only as historical evidence.

## Recording a priority review

Record a priority review in the relevant active Issue or other authorized work record using enough detail to reproduce the decision:

```text
Priority review — YYYY-MM-DD
Scope: <declared queue scope>
Band: P0 | P1 | P2 | P3 | P4
Rank: <unique integer within scope>
Score: <calculated score>
Customer value: 0..3
Business value: 0..3
Strategic differentiation: 0..3
Urgency: 0..3
Dependency leverage: 0..3
Evidence confidence: 0..3
Readiness: 0..3
Reversibility: 0..3
Effort: 0..3
Risk: 0..3
Dependencies / gates: <material facts>
Rationale: <brief explanation>
Override: none | <recorded Product Owner override>
Evidence: <Issue/PR/document references>
```

When the priority changes materially, add a new dated record rather than rewriting historical comments.

If authorized structured GitHub Project fields are available, the current band/rank may be mirrored there. The Issue remains the durable work/communication record. Do not claim Project-field updates that the current agent/tool cannot perform or independently verify.

## Queue maintenance

Re-evaluate an active queue when a material change occurs, including:

- scope or Product Owner direction changes;
- a prerequisite completes or a blocker appears/disappears;
- new evidence materially changes confidence or value;
- urgency changes;
- effort or risk estimates change materially;
- an item becomes ready, completed, superseded or invalid.

Prefer finishing, validating, merging, consolidating and closing existing high-value work over continuously creating new queue entries.

A queue record should be compact and show at minimum the Issue/PR link, rank, band, score, workflow/readiness state and next action.

## Relationship to daily audits

Daily audit categories such as `SHOW-STOPPERS`, `DO FIRST`, `LOW-HANGING FRUITS` and `QUEUE CLEANUP` are audit-report categories, not substitutes for this backlog ranking model.

When a maintained ranked queue exists, the audit should use it as evidence while still applying the audit's own dependency, impact, urgency, readiness, unblock-value and cleanup checks.

An audit may surface a lower-ranked low-hanging-fruit or cleanup action without silently changing the maintained queue. A material reprioritization should be recorded through a new priority review.
