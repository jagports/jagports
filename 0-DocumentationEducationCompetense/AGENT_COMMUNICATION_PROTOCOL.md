# Jagports AI OS — Agent Communication Protocol

## Purpose

This document defines the operational communication rules for agents and humans working through GitHub Issues and GitHub Projects.

The protocol is persistent: critical communication must not depend on private agent context.

## System of Record

GitHub Issues and the Jagports GitHub Project are the primary persistent communication and work-control system.

Use:

- GitHub Issue comments for task-specific communication, acknowledgements, blockers, results and hand-offs.
- GitHub Issues for work items, escalations and decisions requiring a durable record.
- Repository documentation for reusable protocol and product knowledge.
- GitHub Project Status for the current workflow state.

No critical decision may exist only in private agent context.

## Message Lifecycle

`Message created → Agent notified → Agent acknowledges → Action taken → Result recorded → Knowledge updated if reusable`

### Notification

An agent is considered notified when the relevant persistent GitHub record exists and the agent is explicitly named as responsible in the Issue, Project assignment or hand-off record.

### Acknowledgement

The responsible agent should acknowledge the work in the Issue before substantive execution when practical. The acknowledgement identifies the intended action and current status.

### Result

The executing agent records the result in the same Issue. If implementation creates code or documentation, the result is linked through the Pull Request.

## Escalation Categories

Escalations use one of these seven categories:

1. `DECISION` — a human decision is required before work can safely continue.
2. `BLOCKED` — execution cannot continue because a required dependency, capability or input is unavailable.
3. `RISK` — the agent can continue, but a material technical, operational, security or data risk requires human visibility.
4. `SCOPE` — the requested work conflicts with, exceeds or materially changes the agreed scope.
5. `ACCESS` — required repository, service, account or permission access is unavailable or insufficient.
6. `CONFLICT` — two requirements, decisions or sources conflict and the agent cannot resolve the conflict from existing authoritative information.
7. `FAILURE` — an implementation or validation attempt failed and recovery is not safely inferable.

AUTO and REVIEW are handling modes, not escalation categories:

- `AUTO` — the agent may proceed without human escalation when the work is explicitly authorized.
- `REVIEW` — the agent may prepare the work, but review is required before proceeding to the next controlled step.

Every escalation must state:

- category;
- affected Issue;
- current state;
- exact question or blocker;
- impact if unresolved;
- requested human action;
- responsible owner.

## Human Decision Gate

A human decision gate is mandatory when an agent cannot proceed without choosing between materially different outcomes, changing an agreed constraint, accepting material risk, or establishing a new project rule.

The gate has four states:

1. `PROPOSED` — agent has documented the alternatives and recommendation.
2. `DECISION NEEDED` — human input is explicitly required.
3. `APPROVED` — the human decision authorizes the selected option.
4. `REJECTED` — the proposed option is not authorized; the Issue records the reason or replacement direction.

A decision record must contain:

- Decision question;
- Context and constraints;
- Options considered;
- Recommended option and rationale;
- Consequences and known risks;
- Explicit human decision;
- Decision date;
- Decision owner.

Agents must not silently infer approval from inactivity.

## Agent Hand-off

A hand-off is required when responsibility for an Issue moves from one agent to another agent or from an agent to a human.

The hand-off must be recorded in the Issue and use the repository hand-off template where a new hand-off record is appropriate.

A valid hand-off contains:

- source agent;
- destination agent or human owner;
- Issue number;
- current Project Status;
- completed work;
- remaining work;
- relevant findings and evidence;
- files, branches and Pull Requests involved;
- blockers or risks;
- exact next action;
- acknowledgement requirement.

The receiving agent should acknowledge the hand-off and either accept the work, request clarification, or escalate it.

## Reliability Rules

- Important hand-offs must create a persistent GitHub record.
- Escalations must have a visible destination and owner.
- Decisions must be recorded before implementation depends on them.
- If an agent becomes unavailable, another agent can recover the work from the Issue, Project state, repository and linked artifacts.
- Reusable findings are added to repository knowledge after the work is validated.

## Implementation Workflow

Work follows the project workflow:

`BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → CODING → REVIEW → TESTING → DONE`

`BLOCKED` is exceptional and must include a visible reason and owner.

A new Project item starts in `BACKLOG`. The first substantive work action or work comment transitions the Project item to `RESEARCH`.

## Traceability

For implementation work:

`Issue → Branch → Pull Request → Review → Merge → Issue closure`

Pull Requests must use the exact GitHub closing syntax, for example `Closes #17`.

Each implementation Pull Request must also explicitly identify the Issues it will close, using `Closes #<issue>` or equivalent GitHub closing syntax in the PR body. The linked Issues should therefore show that they will be closed by the PR before merge.

## Communication Rule of Precedence

When communication exists in multiple places, the latest authoritative GitHub Issue decision or repository documentation takes precedence over transient agent context.
