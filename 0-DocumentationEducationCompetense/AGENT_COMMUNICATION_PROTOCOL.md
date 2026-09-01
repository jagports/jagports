# Jagports AI OS — Agent Communication Protocol

## Purpose

This document defines the operational communication rules for agents and humans working through GitHub Issues, Pull Requests and the GitHub Project.

The protocol is persistent: critical communication must not depend on private agent context.

## Primary Communication Record

GitHub Issues are the primary persistent work and communication records for Jagports AI OS.

Use:

- GitHub Issues for work items, task-specific communication, acknowledgements, blockers, results, decisions and hand-offs.
- Pull Requests for implementation changes, technical discussion, review and implementation traceability to Issues.
- Repository documentation for reusable protocol, product and project knowledge.
- GitHub Project Status as a visualization of Issues and their current workflow state.

The Project does not replace the Issue as the primary communication record. Important communication and decisions must be recoverable from the relevant Issue and linked artifacts.

No critical decision may exist only in private agent context.

## Before Beginning Work

Before beginning work on an Issue, the agent must inspect the repository root and use all root folders as the first-level documentation and knowledge map, even when some folders are currently empty or contain no immediately relevant files.

The current root folders are:

1. `0-DocumentationEducationCompetense`
2. `00-Management`
3. `2-Sales`
4. `3-Deployment`
5. `4-Production`
6. `5-Implementation-Projects`
7. `6-Development`
8. `7-Research`

The agent must:

1. Inspect all of the root folders listed above before beginning substantive work.
2. Determine which folders contain information relevant to the Issue.
3. Read the relevant `*.md` files in those folders before making decisions or implementation changes.
4. Treat an empty or currently unused folder as part of the repository's knowledge structure; its lack of content is not a reason to omit it from the initial inspection.
5. Check `00-Management` for management, governance and operating rules.
6. Check `0-DocumentationEducationCompetense` for documentation, education, competence and agent-protocol information.
7. Check `2-Sales` for sales, customer and commercial information when relevant.
8. Check `3-Deployment` for deployment and operational information when relevant.
9. Check `4-Production` for product requirements, priorities and production planning when relevant.
10. Check `5-Implementation-Projects` for active implementation-project context when relevant.
11. Check `6-Development` for software and technical-development context when relevant.
12. Check `7-Research` for research, evidence and investigations when relevant.
13. Do not read unrelated documentation merely because it is a Markdown file.
14. If relevant documentation conflicts, follow the established authority and decision rules and escalate an unresolved conflict as `CONFLICT`.

This discovery step is mandatory because the numbered root folders provide the semantic map of Jagports AI OS knowledge. Agents must not assume that the Issue itself contains all required context.

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

## Project Status and Issue Lifecycle

The GitHub Project Status is used to visualize the current state of Issues. The available Project Item Status options define the Kanban work-state silos.

The Issue-driven completion lifecycle is:

**Approved Issue → Codex → Implement → Test → Review → Merge → Close Issue → Done**

Project Status changes and the Issue-driven completion lifecycle are related but are not the same representation. Do not replace the Issue lifecycle with a separate hard-coded Kanban sequence in this protocol.

## Traceability

For implementation work:

`Issue → Branch → Pull Request → Review → Merge → Issue closure`

The implementing Pull Request must maintain explicit traceability to its initiating Issue. The PR relationship and the later Issue closure are separate lifecycle actions.

After a successful merge and completion of the work, the initiating Issue is closed with reason `completed`, and the completed work is represented by the appropriate final Project Status.

## Communication Rule of Precedence

When communication exists in multiple places, the latest authoritative decision recorded on the relevant GitHub Issue or in repository documentation takes precedence over transient agent context. Project Status is used to represent workflow state and does not replace the Issue's communication record.
