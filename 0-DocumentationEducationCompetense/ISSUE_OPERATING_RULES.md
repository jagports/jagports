# Jagports Issue Operating Rules

## Purpose

GitHub Issues are the primary work and communication records for Jagports.

An Issue records the objective, context, ownership, decisions, dependencies, risks, discussion, implementation references, review evidence, test evidence, and completion of a piece of work.

The GitHub Project provides a visual representation of Issues and stores workflow information for each Issue through its Project Item fields. The Project is not the work record itself.

Repository: `jagports/jagports`

Project: `Jagports Vehicle Information and EPC System`

---

## 1. Authority and Roles

### Product Owner

The Product Owner is the final human authority for:

- business priorities
- scope
- strategic direction
- budget/cost decisions
- external commitments
- acceptance of materially important outcomes
- decisions explicitly requiring human approval

The Product Owner may create, edit, prioritize, assign, approve, block, review, and close Issues.

The Product Owner may delegate execution, but delegation does not transfer ultimate human decision authority.

### Team Lead Agent

The Team Lead Agent coordinates Issue-based work and keeps the work system consistent.

The Team Lead Agent may:

- decompose approved goals into Issues where appropriate
- propose priorities
- propose ordering
- assign Issues to suitable executing entities
- coordinate Specialist Agents
- move workflow state when the required conditions are satisfied
- identify dependencies
- identify and escalate risks
- identify decisions requiring the Product Owner
- review work before human acceptance where appropriate
- maintain consistency of Issue structure and documentation

The Team Lead Agent must not silently make a decision reserved for the Product Owner.

When human authority is required, the Issue must enter `DECISION NEEDED` and the decision must be recorded.

### Specialist Agent

A Specialist Agent executes work within its assigned scope.

A Specialist Agent may:

- research
- analyze
- draft
- code
- test
- document
- perform other explicitly assigned work

A Specialist Agent must report material findings, blockers, risks, dependencies, and proposed decisions in the relevant Issue.

A Specialist Agent does not independently redefine scope or override Product Owner decisions.

### Human Contributor

A human contributor may execute assigned work according to the Issue definition.

Material changes to scope, priority, architecture, cost, or policy must be escalated through the Issue.

---

## 2. Issue as the System of Record

Every material piece of work must have a corresponding GitHub Issue unless the work is inherently represented by another authoritative GitHub record.

The Issue is the authoritative record for:

- what is being done
- why it is being done
- priority
- executing entity
- execution target
- workflow state
- dependencies
- risk
- decision status
- relevant discussion
- implementation and Pull Request references
- review status
- test evidence
- acceptance status

Important decisions must not exist only in private chat.

Where a decision is made outside GitHub, the resulting decision must be recorded in the relevant Issue or durable project documentation.

The Project may contain an item representing the Issue. That Project Item is a representation of the Issue for Project management purposes; it does not replace the Issue as the work record.

The workflow state is represented by the **Project Item Status**: the value of the `Status` field belonging to the Issue's Project Item. `Status` is a property of the Project Item, not of the Project itself.

```text
GitHub Issue
     │
     └── Project Item
            │
            └── Status / <current workflow state>
```

---

## 3. Issue Creation

Work should be represented by an Issue when it requires coordination, execution, discussion, review, testing, a decision, or traceability.

An Issue should contain enough information to understand:

- objective
- expected outcome
- reason/context
- proposed executor
- execution target
- dependencies
- known risks
- required decision/approval
- acceptance criteria where applicable

New work should normally begin in `BACKLOG` unless there is a clear reason for another workflow state.

When an Issue is added to the Project, its Project Item must be created, its `Status` set to the appropriate workflow value, and the result verified.

---

## 4. Issue Priority

Priority must be explicit.

The project must not treat multiple Issues with the same priority as if they were automatically equal in execution order.

Use the established priority hierarchy. Where exact ordering matters, use sub-priorities such as:

- `P1`
- `P1.1`
- `P1.2`
- `P1.3`
- `P2`
- `P2.1`

The Product Owner has final authority over priority.

The Team Lead Agent may propose priority and ordering and may maintain the execution sequence after approval.

A lower-priority Issue must not displace a higher-priority Issue without an explicit reason or priority change.

---

## 5. Issue Assignment and Executing Entity

Each executable Issue should identify the actual executing entity.

Use the Project `Executing Entity` field when the Issue is represented in the Project to distinguish:

- Product Owner
- Team Lead Agent
- Specialist Agent
- Human

The GitHub `Assignees` field should identify the actual GitHub account when available.

The Issue should identify the concrete `Execution Target` where relevant, such as:

- GitHub repository
- GitHub Project
- GitHub Issue
- specific file
- website
- external system
- local development environment
- other required device/system

---

## 6. Issue Workflow State

The controlled workflow is:

`BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → CODING → REVIEW → TESTING → DONE`

`BLOCKED` may be entered whenever work cannot proceed.

These values are **Project Item Status option values**. They represent the current workflow state of the Issue through the `Status` field of its Project Item.

```text
BACKLOG
   ↓
RESEARCH
   ↓
PROPOSED
   ↓
DECISION NEEDED
   ↓
APPROVED
   ↓
CODING
   ↓
REVIEW
   ↓
TESTING
   ↓
DONE
```

### BACKLOG

The Issue is identified but is not actively being researched or executed.

### RESEARCH

Information gathering, investigation, discovery, or analysis is underway.

### PROPOSED

A concrete proposal or solution is ready for consideration.

### DECISION NEEDED

A required decision or approval is blocking progression.

The Issue must clearly state what decision is required.

### APPROVED

The required proposal or work has been approved and may proceed.

### CODING

Implementation or other active technical execution is underway.

### REVIEW

The implementation or result is ready for review.

### TESTING

The implementation or result is being tested and validated.

### DONE

The Issue's defined completion and acceptance criteria have been met.

### BLOCKED

The Issue cannot proceed because of a dependency, missing decision, technical problem, external constraint, or other blocker.

A blocked Issue should document:

- blocker
- impact
- required resolution
- responsible party where known

---

## 7. Moving an Issue Through the Workflow

The Team Lead Agent may move an Issue through normal workflow states when the required conditions are satisfied.

The Product Owner may move or override workflow state at any time.

A Specialist Agent or Human Contributor should not move an Issue into an approval or acceptance state merely by declaring its own work complete when independent approval is required.

A workflow transition means changing the `Status` value of the Issue's Project Item to the corresponding Status option.

Moving an Issue to `DONE` means the defined completion and acceptance criteria have been met.

---

## 8. Decisions on Issues

A decision requiring Product Owner authority must be explicit in the Issue.

The Issue should contain:

1. the decision required
2. relevant alternatives
3. recommendation, if available
4. consequences/risks
5. Product Owner decision
6. date/record of decision

Use `Decision Status`:

- `Not Required`
- `Pending`
- `Approved`
- `Rejected`

A rejected proposal must not silently continue as approved work.

---

## 9. Issue Dependencies

Dependencies must be recorded when another Issue, person, system, decision, or external condition is required before work can continue.

Use the `Dependencies` field and/or Issue description to identify the dependency.

If a dependency prevents progress, set the Issue's Project Item Status to:

`BLOCKED`

The Team Lead Agent is responsible for detecting and escalating unresolved dependencies.

---

## 10. Issue Risk

Material risk should be recorded using the `Risk` field:

- `None`
- `Low`
- `Medium`
- `High`
- `Critical`

High and Critical risks should be explicitly described in the Issue.

A Critical risk may justify setting the Issue's Project Item Status to `BLOCKED` until resolved.

---

## 11. Labels

Repository labels provide additional classification for Issues and Pull Requests.

Current operational labels include:

- `agent`
- `human`
- `decision-needed`
- `dependency`
- `blocked`

Labels should supplement Project fields, not replace them.

Use Project fields for structured workflow information and labels for useful cross-cutting classification.

---

## 12. Pull Requests, Review, and Acceptance

Implementation Pull Requests must maintain explicit traceability to the Issue they implement.

Review should verify that the actual result matches the Issue objective and acceptance criteria.

Where appropriate:

`CODING → REVIEW → TESTING → DONE`

```text
Issue
  ↓
Pull Request
  ↓
Review
  ↓
Testing
  ↓
Merge
  ↓
Close Issue
  ↓
DONE
```

A Pull Request being merged does not by itself prove that the Issue is complete.

The Issue should contain sufficient evidence that the expected result was achieved.

Review must independently verify that the Issue has a Project Item when Project tracking is required and that its **Project Item Status** matches the actual workflow state.

The Product Owner retains final acceptance authority for materially important outcomes.

---

## 13. Issue Communication

The Issue is the shared operational memory for its work.

Agents and humans should communicate material information through the relevant Issue, Pull Request, or linked durable documentation.

Important information must not depend on one person's private conversation history.

If work discussed elsewhere becomes actionable, create or update the relevant Issue.

Issue and Pull Request comments must be formatted for quick visual scanning and reliable traceability. Put distinct traceability statements on separate lines or paragraphs, and put primary Issue or Pull Request links at the beginning of the line when practical.

---

## 14. Escalation from an Issue

Escalate to the Product Owner when any of the following occurs:

- strategic direction is unclear
- priorities conflict
- scope must materially change
- an important business decision is required
- cost or external commitment is involved
- a high/critical risk cannot be resolved by the Team Lead Agent
- an architectural or policy decision exceeds delegated authority
- acceptance is disputed

When escalation is required, set the Issue's Project Item Status to:

`DECISION NEEDED`

and set its `Decision Status` to:

`Pending`

---

## 15. Operating Principle

The Team Lead Agent coordinates Issue-based execution.

Specialist Agents and humans execute assigned work.

The Product Owner retains final human authority.

The Issue records the work, its context, ownership/executor, decisions, dependencies, risks, implementation references, review, testing, and completion.

The Project provides a management view and Project Item fields for workflow state and structured coordination; it is not a replacement for the Issue.

No important decision should depend solely on hidden conversation context.

For clarity, whenever this document refers to workflow state, it means the **Project Item Status** stored in the `Status` field of the Issue's Project Item.
