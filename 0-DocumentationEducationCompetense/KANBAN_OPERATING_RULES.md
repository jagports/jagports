# Jagports Kanban Operating Rules

## Purpose

The Jagports GitHub Project is the system of record for project work, task state,
ownership, decisions, dependencies, risks, and execution coordination.

The Kanban is the primary communication and work-control system between the
Product Owner, Team Lead Agent, Specialist Agents, and human contributors.

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

The Product Owner may create, edit, prioritize, assign, approve, block, review,
and close work.

The Product Owner may delegate execution, but delegation does not transfer
ultimate human decision authority.

### Team Lead Agent

The Team Lead Agent is responsible for coordinating the work system and keeping
the Kanban operational.

The Team Lead Agent may:

- decompose approved goals into tasks
- propose priorities
- propose task ordering
- assign work to suitable executing entities
- coordinate Specialist Agents
- move work through normal execution states
- identify dependencies
- identify and escalate risks
- identify decisions requiring the Product Owner
- review work before human acceptance where appropriate
- maintain consistency of task structure and documentation

The Team Lead Agent must not silently make a decision reserved for the Product
Owner.

When human authority is required, the task must enter `DECISION NEEDED` and the
decision must be recorded.

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

A Specialist Agent must report material findings, blockers, risks, dependencies,
and proposed decisions through the Kanban/task record.

A Specialist Agent does not independently redefine project scope or override
Product Owner decisions.

### Human Contributor

A human contributor may execute assigned work according to the task definition.

Material changes to scope, priority, architecture, cost, or policy must be
escalated through the Kanban.

---

## 2. System of Record

Every material piece of project work must have a corresponding Kanban item.

The Kanban item is the authoritative record for:

- what is being done
- why it is being done
- priority
- executing entity
- execution target
- current state
- dependencies
- risk
- decision status
- relevant discussion
- acceptance/review status

Important decisions must not exist only in private chat.

Where a decision is made outside GitHub, the resulting decision must be
recorded in the relevant task or project documentation.

The workflow state of an Issue is the **Project Item Status**: the value of the
`Status` field belonging to that Issue's item in the GitHub Project. It is not a
status of the Project itself.

```text
GitHub Issue
     ↓
Project Item
     ↓
Jagports AI OS Project
     │
     └── Status / <current state>
```

The `Status` shown here belongs to the **Project Item**. The Project is the
container to which the Project Item belongs; it does not own the workflow
status.

---

## 3. Task Creation

Tasks may be proposed by the Product Owner, Team Lead Agent, Specialist Agents,
or human contributors.

However, proposed work does not automatically become committed work.

New work should initially enter:

`BACKLOG`

unless there is a clear reason for another state.

The task should contain enough information to understand:

- objective
- expected outcome
- reason/context
- proposed executor
- execution target
- dependencies
- known risks
- required decision/approval

When an Issue is added to the Project, its workflow state must be set and verified
through the Project Item Status field. The current implementation does not
provide an automatic Issue-to-Project-to-BACKLOG trigger; an agent or other
explicit automation must perform and verify the Project operations.

---

## 4. Priority Rules

Priority must be explicit.

The project must not treat multiple tasks with the same priority as if they
were automatically equal in execution order.

Use the priority hierarchy defined by the project.

Where exact ordering matters, use sub-priorities such as:

- `P1`
- `P1.1`
- `P1.2`
- `P1.3`
- `P2`
- `P2.1`

The Product Owner has final authority over priority.

The Team Lead Agent may propose priority and ordering and may maintain the
execution sequence after approval.

A lower-priority task must not displace a higher-priority task without an
explicit reason or priority change.

---

## 5. Assignment and Executing Entity

Each executable task should identify the actual executing entity.

Use the Project `Executing Entity` field to distinguish:

- Product Owner
- Team Lead Agent
- Specialist Agent
- Human

The GitHub `Assignees` field should identify the actual GitHub account when
available.

The task should also identify the concrete `Execution Target` where relevant,
such as:

- GitHub repository
- GitHub Project
- GitHub Issue
- specific file
- website
- external system
- local development environment
- other required device/system

---

## 6. Kanban State Rules

The controlled workflow is:

`BACKLOG → RESEARCH → PROPOSED → DECISION NEEDED → APPROVED → CODING → REVIEW → TESTING → DONE`

`BLOCKED` may be entered whenever work cannot proceed.

The values above are **Project Item Status option values**. They are stored in
the `Status` field of each Issue's Project item.

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

Work is identified but not actively being researched or executed.

### RESEARCH

Information gathering, investigation, discovery, or analysis is underway.

### PROPOSED

A concrete proposal or solution is ready for consideration.

### DECISION NEEDED

A human or otherwise required decision/approval is blocking progression.

The task must clearly state what decision is required.

### APPROVED

The required proposal/work has been approved and may proceed.

### CODING

Implementation or other active technical execution is underway.

### REVIEW

Work is ready for review.

### TESTING

Implementation or output is being tested and validated.

### DONE

The work is completed and accepted according to the task's definition of done.

### BLOCKED

Work cannot proceed because of a dependency, missing decision, technical
problem, external constraint, or other blocker.

A blocked task should document:

- blocker
- impact
- required resolution
- responsible party where known

---

## 7. Moving Work

The Team Lead Agent may move work through normal execution states when the
required conditions are satisfied.

The Product Owner may move or override state at any time.

A Specialist Agent or Human Contributor should not move work into an approval
or acceptance state merely by declaring its own work complete when independent
approval is required.

A workflow transition means changing the **Project Item Status** value on the
Issue's Project item to the corresponding Status option.

Moving to `DONE` means the defined completion/acceptance criteria have been met.

---

## 8. Decisions

A decision requiring Product Owner authority must be explicit.

The task should contain:

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

## 9. Dependencies

Dependencies must be recorded when another task, person, system, decision, or
external condition is required before work can continue.

Use the `Dependencies` field and/or task description to identify the dependency.

If a dependency prevents progress, use:

`BLOCKED`

The Team Lead Agent is responsible for detecting and escalating unresolved
dependencies.

---

## 10. Risk

Material risk should be recorded using the `Risk` field:

- `None`
- `Low`
- `Medium`
- `High`
- `Critical`

High and Critical risks should be explicitly described in the task.

A Critical risk may justify moving work to `BLOCKED` until resolved.

---

## 11. Labels

Repository labels provide additional classification.

Current operational labels include:

- `agent`
- `human`
- `decision-needed`
- `dependency`
- `blocked`

Labels should supplement Project fields, not replace them.

Use Project fields for structured workflow information and labels for useful
cross-cutting classification.

---

## 12. Review and Acceptance

Review should verify that the actual result matches the task objective.

Where appropriate:

`CODING → REVIEW → TESTING → DONE`

```text
CODING
  ↓
REVIEW
  ↓
TESTING
  ↓
DONE
```

A task should not be marked `DONE` merely because implementation has stopped.

The task should contain sufficient evidence that the expected result was
achieved.

Review must independently verify that the Issue's Project item exists and that
its **Project Item Status** matches the actual workflow state.

The Product Owner retains final acceptance authority for materially important
project outcomes.

---

## 13. Communication Rule

The Kanban is the shared operational memory.

Agents and humans should communicate material project information through the
relevant task or linked project documentation.

Important information must not depend on one person's private conversation
history.

If work discussed elsewhere becomes actionable, create or update the Kanban
item.

---

## 14. Escalation Rule

Escalate to the Product Owner when any of the following occurs:

- strategic direction is unclear
- priorities conflict
- scope must materially change
- an important business decision is required
- cost or external commitment is involved
- a high/critical risk cannot be resolved by the Team Lead Agent
- an architectural or policy decision exceeds delegated authority
- acceptance is disputed

When escalation is required, the task should enter:

`DECISION NEEDED`

and its `Decision Status` should become:

`Pending`

---

## 15. Operating Principle

The Team Lead Agent coordinates execution.

Specialist Agents and humans execute assigned work.

The Product Owner retains final human authority.

The Kanban records the work, its state, its owner/executor, decisions,
dependencies, risks, and completion.

No important project decision should depend solely on hidden conversation
context.

For clarity, whenever this document refers to a workflow state, it means the
**Project Item Status** stored in the `Status` field of the Issue's Project item.

---

## 16. P1.5 Completion Criteria

P1.5 is complete when:

- role authority is documented
- task creation rules are documented
- priority rules are documented
- executing entity rules are documented
- state-transition rules are documented
- decision rules are documented
- dependency rules are documented
- risk rules are documented
- review/acceptance rules are documented
- Kanban communication is established as the operational system of record
