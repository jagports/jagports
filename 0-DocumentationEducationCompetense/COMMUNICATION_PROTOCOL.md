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

```text
Message created
      ↓
Agent notified
      ↓
Acknowledged
      ↓
Action taken
      ↓
Result recorded
      ↓
Knowledge updated
```

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

```text
Work / observation
       ↓
Need human visibility?
    ↙         ↘
   No         Yes
   ↓           ↓
  AUTO     Escalation
             ↓
 DECISION / BLOCKED / RISK
 SCOPE / ACCESS / CONFLICT / FAILURE
             ↓
        Owner action
             ↓
          Continue
```

## Human Decision Gate

A human decision gate is mandatory when an agent cannot proceed without choosing between materially different outcomes, changing an agreed constraint, accepting material risk, or establishing a new project rule.

The gate has four states:

1. `PROPOSED` — agent has documented the alternatives and recommendation.
2. `DECISION NEEDED` — human input is explicitly required.
3. `APPROVED` — the human decision authorizes the selected option.
4. `REJECTED` — the proposed option is not authorized; the Issue records the reason or replacement direction.

```text
Agent proposal
      ↓
   PROPOSED
      ↓
DECISION NEEDED
      ↓
Human decision
   ↙       ↘
REJECTED   APPROVED
              ↓
           Proceed
```

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

```text
Source agent
     ↓
Issue hand-off record
     ↓
Destination agent / human
     ↓
Acknowledgement
     ↓
Accept / Clarify / Escalate
     ↓
Continue work
```

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

Current implementation reality: Codex is not yet integrated into the Jagports development workflow. At present, implementation is primarily driven by ChatGPT under the control and direction of `tlindi`.

Project Status changes and the Issue-driven completion lifecycle are related but are not the same representation. Project Status visualizes the current workflow state of an Issue; it is not a separate hard-coded completion lifecycle.

## Traceability

For implementation work:

`Issue → Branch → Pull Request → Review → Merge → Issue closure → Done`

```text
Issue
  ↓
Branch
  ↓
Pull Request
  ↓
Review
  ↓
Merge
  ↓
Issue closure
  ↓
DONE
```

The implementing Pull Request must maintain explicit traceability to its initiating Issue. The PR relationship and the later Issue closure are separate lifecycle actions.

### Pull Request review and completion

```text
Implementation PR
       ↓
Ready for review
       ↓
Visible Review conversation as needed
       ↓
Formal review outcome
   ↙              ↘
Changes          Approved
  ↓                 ↓
Implement          Merge
  ↓                 ↓
Review conversation    Close Issue
continues                 ↓
                        DONE
```

### Review conversation terminology

Use GitHub UI terminology for human-facing communication:

- **Review conversation** means an inline Pull Request review discussion.
- When its state matters, say **Unresolved Review conversation** or **Resolved Review conversation**.
- Reserve **review thread** or **review thread object** for GitHub API, GraphQL, and tool implementation details.
- The durable mapping is: **Review conversation (GitHub UI / human-facing)** ↔ **review thread (API / GraphQL / tool object)**.
- Agents must translate API/tool vocabulary into the human-facing UI term before reporting review state to users.

Review communication follows the canonical semantics in `00-Management/WORKFLOWS.md`:

- A GitHub `PENDING` review is a reviewer-private draft until submission. Line-level and file-level comments created inside the normal pending-review flow remain pending and therefore cannot be relied upon for reviewer↔maker discussion.
- `Line comment` or `file comment` alone does not mean immediately visible. Visibility depends on whether the comment is pending or independently submitted.
- When anchored interaction is needed before formal review submission, prefer a standalone submitted PR review comment created directly through the review-comment mechanism/API/tool when immediate submission without a pending review is supported.
- If standalone anchored submission is unavailable in the current UI/tool, use an immediately visible top-level PR Conversation comment and include direct file/line links where needed.
- The maker/executor may reply and implement changes while the formal review is still unsubmitted.
- If GitHub later marks an anchored Review conversation `outdated` because the referenced diff changed, that state alone does not prove the concern was satisfied; the reviewer verifies whether it was addressed or remains applicable.
- Formal review submission is the review conclusion. Where independent approval is required, `APPROVED` remains mandatory and must not be inferred from discussion activity, replies, implementation changes, Resolved/Unresolved Review conversation state, checkboxes, or inactivity.

After a successful merge and completion of the work, the initiating Issue is closed with reason `completed`. The GitHub Project then represents the completed work with the appropriate final Project Status.

## Testing

Implementation validation is recorded through the relevant test Issue or test record.

```text
Implementation Issue
        ↓
   Pull Request
        ↓
    Test Issue
        ↓
 PASS / FAIL / BLOCKED
        ↓
 Review / remediation
        ↓
     Completion
```

A test result must be persistent and traceable to the implementation it validates.

## Communication Rule of Precedence

When communication exists in multiple places, the latest authoritative decision recorded on the relevant GitHub Issue or in repository documentation takes precedence over transient agent context. Project Status is used to represent workflow state and does not replace the Issue's communication record.

## Generic Work-Path and Rendered Line-Break Formatting

When an answer, report, hand-off, audit, or other communication presents a sequential work path using arrows, the work-path formatting is generic and applies regardless of the originating procedure or document.

The work path must render as one Issue/PR item per visual line. Each Issue/PR item must be an actual Markdown link containing its number and full title.

A downward arrow (`↓`) must occupy its own visual line between consecutive path items. Do not place multiple arrows on one line, and do not compress multiple path items into one paragraph or inline chain.

A short explanatory relationship such as `enables:`, `solves:`, or `capability:` may appear after the downward arrow and before the next Issue/PR link when it helps explain the relationship.

Example:

[**#354 — Define and implement Parts Data Model**](https://github.com/jagports/jagports/issues/354)
↓
**enables:** [**#355 — Create JEPC Data Importer for MVP**](https://github.com/jagports/jagports/issues/355)
↓
**enables:** [**#368 — VIEPS UI / Implement MVP Web UI**](https://github.com/jagports/jagports/issues/368)

The work path may use other concise relationship labels when supported by evidence. Do not invent dependencies or relationships merely to create a work path.
