# Jagports AI OS — Explicitly Ordered Implementation Plan

> **WORK IN PROGRESS — NOT THE SOURCE OF TRUTH**
>
> This work-plan document retains the historical/planning Kanban style for work in progress. It is not authoritative for current workflow states or lifecycle rules. The GitHub Project's **Project Item Status options** are the authoritative Kanban work-state silos. The current Issue-to-completion lifecycle is defined in `KNOWLEDGE.md`.

## Priority execution list

- **P1 — Open Kanban:** **Executor:** Product Owner (with ChatGPT assistance). **Where:** GitHub Projects — https://github.com/features/issues. Select and create the central Jagports Kanban that will become the communication and work-control system for humans and agents.
- **P1.1 — Select Kanban tool:** **Executor:** Product Owner, assisted by ChatGPT. **Where:** ChatGPT + GitHub Projects. Confirm GitHub Projects is the $0 Kanban choice and define why it is the system of record.
- **P1.2 — Create Jagports GitHub repository:** **Executor:** Product Owner. **Where:** GitHub — https://github.com/. Create the private Jagports repository that will hold code, documentation, agent instructions, decisions, and project memory.
- **P1.3 — Configure Kanban workflow:** **Executor:** Product Owner with ChatGPT guidance. **Where:** GitHub Projects. Create/configure the Project Item Status options used as the Kanban work-state silos.
- **P1.4 — Define Kanban fields and labels:** **Executor:** Product Owner. **Where:** GitHub Projects / Issues. Add priority, work type, owner/agent, decision status, dependencies, risk, and other minimum fields needed for agent communication.
- **P1.5 — Define Kanban operating rules:** **Executor:** Product Owner + Team Lead Agent specification. **Where:** GitHub repository documentation. Define who may create, move, approve, block, review, and close work items.

- **P2 — Open agent accounts/access to Kanban:** **Executor:** Product Owner. **Where:** GitHub + Codex Web — https://openai.com/codex/. Establish the minimum permissions and access required for the AI agents to work through the Kanban.
- **P2.1 — Define agent identities:** **Executor:** Product Owner + ChatGPT. **Where:** GitHub repository. Name the initial Team Lead, Research, Product/Vehicle, Technical/Architecture, Prioritization/Validation, and Codex Engineering roles.
- **P2.2 — Validate leader R/W rights:** **Executor:** Product Owner. **Where:** GitHub repository / Project permissions. Decide which Team Lead agent, if supported by the selected tooling, receives read/write authority and which agents remain restricted.
- **P2.3 — Define permission boundaries:** **Executor:** Product Owner + ChatGPT. **Where:** GitHub repository documentation. Specify which agents may create, edit, move, approve, merge, or close each class of work.
- **P2.4 — Connect Codex to repository:** **Executor:** Product Owner + Codex Web. **Where:** Codex Web + GitHub. Authorize Codex to work against the Jagports repository and verify that it can inspect and modify the intended project.

- **P3 — Define agent communication protocol:** **Executor:** Product Owner + Team Lead Agent. **Where:** GitHub Issues / Projects. Make Issues, comments, labels, fields, status changes, and decision records the authoritative communication channel between agents and the Product Owner.
- **P3.1 — Define escalation categories:** **Executor:** Product Owner + Team Lead Agent. **Where:** GitHub repository documentation. Establish `AUTO`, `REVIEW`, `DECISION`, and `BLOCKED` handling rules.
- **P3.2 — Define human decision gate:** **Executor:** Product Owner. **Where:** GitHub Project. Require explicit Product Owner approval before consequential product, architecture, cost, security, or data-strategy decisions proceed.
- **P3.3 — Define agent hand-off format:** **Executor:** Team Lead Agent + ChatGPT. **Where:** GitHub Issue templates. Standardize what one agent must leave for the next agent to continue work without repeating research.

- **P4 — Create work-item templates:** **Executor:** Product Owner + ChatGPT, implemented by Codex where useful. **Where:** GitHub Issues. Create templates for Feature, Research, Decision, Architecture, Bug, Risk, Validation, Technical Debt, and Documentation.
- **P4.1 — Define feature template:** **Executor:** Product Owner + Product/Vehicle Agent. **Where:** GitHub Issues. Include problem, value, proposed solution, evidence, priority, dependencies, risks, acceptance criteria, open questions, and decision requirement.
- **P4.2 — Define research template:** **Executor:** Research Agent. **Where:** GitHub Issues. Require source/evidence, finding, confidence, implications, opportunity, and recommended next action.
- **P4.3 — Define decision template:** **Executor:** Team Lead Agent. **Where:** GitHub Issues / Decision Log. Record the decision, alternatives, recommendation, rationale, impact, reversibility, owner, and final resolution.

- **P5 — Establish Jagports product memory:** **Executor:** Product Owner + ChatGPT; Codex implements repository structure. **Where:** GitHub repository. Create the persistent product vision, requirements, terminology, vehicle/EPC context, architecture notes, constraints, roadmap, decisions, risks, and agent reports.
- **P5.1 — Create repository knowledge structure:** **Executor:** Codex Engineering Agent. **Where:** GitHub repository. Establish the agreed documentation directories and navigation.
- **P5.2 — Record product vision and constraints:** **Executor:** Product Owner + ChatGPT. **Where:** GitHub repository. Capture the current Jagports vision, goals, $0 operating constraint, and known boundaries.
- **P5.3 — Create decision log:** **Executor:** Team Lead Agent. **Where:** GitHub repository. Create the persistent history of product and technical decisions so agents do not repeatedly reopen resolved questions.

- **P6 — Establish prioritization system:** **Executor:** Prioritization/Validation Agent with Product Owner approval. **Where:** GitHub Project fields + Issues. Define a repeatable scoring method and use it to rank the backlog.
- **P6.1 — Define scoring factors:** **Executor:** Prioritization/Validation Agent. **Where:** GitHub repository documentation. Define customer value, business value, strategic differentiation, urgency, effort, risk, dependencies, evidence confidence, and reversibility.
- **P6.2 — Define priority rules:** **Executor:** Product Owner + Team Lead Agent. **Where:** GitHub Project. Convert scores into explicit priority levels and require a single ordered queue rather than an undifferentiated collection of P0/P1 tasks.
- **P6.3 — Populate first ranked backlog:** **Executor:** Product/Vehicle Agent + Prioritization/Validation Agent. **Where:** GitHub Project / Issues. Turn known Jagports opportunities into ranked work items.

- **P7 — Establish research-to-decision workflow:** **Executor:** Research Agent + Product/Vehicle Agent + Team Lead Agent. **Where:** ChatGPT/web research + GitHub Issues. Define the process from research finding through feature proposal, prioritization, decision request, and approved work.
- **P7.1 — Run first research cycle:** **Executor:** Research Agent. **Where:** ChatGPT/web research; results recorded in GitHub. Produce the first evidence-backed Jagports opportunities.
- **P7.2 — Convert findings to proposals:** **Executor:** Product/Vehicle Agent. **Where:** GitHub Issues. Convert validated findings into actionable feature or product proposals.
- **P7.3 — Escalate only required decisions:** **Executor:** Team Lead Agent. **Where:** GitHub Project. Present concise decision requests to the Product Owner and leave routine work autonomous.

- **P8 — Establish Codex engineering workflow:** **Executor:** Codex Engineering Agent. **Where:** Codex Web + GitHub repository. Define how approved Issues become implementation work, tests, documentation, review, and completion.
- **P8.1 — Create Codex engineering instructions:** **Executor:** Product Owner + ChatGPT; implemented by Codex. **Where:** GitHub repository. Define coding standards, repository rules, testing expectations, security constraints, documentation requirements, and escalation conditions.
- **P8.2 — Implement first approved task:** **Executor:** Codex Engineering Agent. **Where:** Codex Web + GitHub. Select the first approved Issue, implement it, test it, and return it for review.
- **P8.3 — Validate delivery loop:** **Executor:** Product Owner + Codex Engineering Agent. **Where:** GitHub + Codex Web. Validate the current Project Item Status flow against the actual configured Project options.

- **P9 — Establish quality gates:** **Executor:** Technical/Architecture Agent + Codex Engineering Agent + Product Owner. **Where:** GitHub repository and GitHub Actions where available. Define acceptance criteria, automated checks, review requirements, security expectations, and definition of done.
- **P9.1 — Define acceptance criteria standard:** **Executor:** Product/Vehicle Agent + Product Owner. **Where:** GitHub Issue templates. Ensure every implementation task has testable completion criteria.
- **P9.2 — Define technical review gate:** **Executor:** Technical/Architecture Agent. **Where:** GitHub Pull Requests / Issues. Require architecture review when changes cross defined technical boundaries.
- **P9.3 — Define automated validation:** **Executor:** Codex Engineering Agent. **Where:** GitHub Actions / repository. Add free-tier automated tests and checks where practical.

- **P10 — Prepare Raspberry Pi infrastructure:** **Executor:** Codex Engineering Agent + Product Owner. **Where:** Raspberry Pi 4B, 8GB RAM, 1TB SSD, Linux. Add the Pi only where persistent services, database, files, testing, scheduled jobs, or backups are actually required.
- **P10.1 — Prepare Linux environment:** **Executor:** Product Owner + Codex Engineering Agent. **Where:** Raspberry Pi terminal. Install and harden the minimum required open-source runtime environment.
- **P10.2 — Define persistent services:** **Executor:** Technical/Architecture Agent. **Where:** Raspberry Pi. Select which Jagports backend, database, storage, and testing services should run locally.
- **P10.3 — Establish backup strategy:** **Executor:** Codex Engineering Agent. **Where:** Raspberry Pi + GitHub. Ensure important local state is recoverable without turning the Pi into the authoritative source of project decisions or code.

- **P11 — Add autonomous automation:** **Executor:** Team Lead Agent + Codex Engineering Agent. **Where:** GitHub Actions and/or Raspberry Pi. Add scheduled or event-driven automation only when it demonstrably improves the workflow and remains within the $0 constraint.
- **P11.1 — Identify automation candidates:** **Executor:** Team Lead Agent. **Where:** GitHub Project / Issues. Find repetitive research, validation, reporting, testing, or maintenance tasks suitable for automation.
- **P11.2 — Implement first automation:** **Executor:** Codex Engineering Agent. **Where:** GitHub Actions or Raspberry Pi. Implement the highest-value free automation and document its trigger, permissions, outputs, and failure handling.

- **P12 — Expand and govern the agent team:** **Executor:** Product Owner + Team Lead Agent. **Where:** ChatGPT/Codex operating instructions + GitHub. Split roles further only when workload justifies it, then continuously improve prompts, permissions, performance, and governance.

---

# 1. Target Architecture

The initial Jagports AI OS uses four practical layers:

- **Product Owner:** You; final authority for consequential product decisions.
- **ChatGPT Free:** Research, analysis, product thinking, prioritization support, decision preparation, and coordination.
- **Codex Web:** Engineering agent operating against the GitHub repository.
- **GitHub:** Source code, Issues, Projects Kanban, documentation, decisions, backlog, and agent communication history.
- **Raspberry Pi 4B / 8GB / 1TB SSD:** Optional free infrastructure for persistent application services, database, files, testing, automation, and backups.

The Kanban provides the shared control surface before additional agent processes are introduced.

# 2. GitHub Kanban as the Central Communication Layer

> **WORK IN PROGRESS — NOT THE SOURCE OF TRUTH**
>
> This section preserves the original Kanban planning style for ongoing work. The actual work-state silos are the configured GitHub Project **Project Item Status options**. Do not treat this document's example sequence as the authoritative state machine.

The Kanban is the primary operational interface between the Product Owner and agents.

The Project Item Status options are the authoritative Kanban work-state silos. Their names and ordering are defined by the actual GitHub Project configuration, not by this work-plan document.

The Kanban should show at minimum:

- Priority
- Work type
- Current agent
- Decision status
- Dependencies
- Risk
- Due/target information if later required
- Links to evidence and implementation

The priority field should support an explicitly ordered queue, with sub-priorities such as `P1`, `P1.1`, `P1.2`, `P2`, `P2.1`, etc., rather than putting many unrelated tasks into one broad priority bucket.

# 3. Agent Roles

The initial operating team is:

1. **Team Lead / Chief of Staff Agent** — synthesizes agent outputs, maintains the ordered work queue, and escalates decisions.
2. **Research Agent** — researches markets, competitors, standards, vehicle/EPC developments, and relevant technical information.
3. **Product / Vehicle Agent** — translates customer and vehicle/EPC needs into product requirements and opportunities.
4. **Technical / Architecture Agent** — evaluates feasibility, architecture, dependencies, and technical risks.
5. **Prioritization / Validation Agent** — scores proposed work, challenges assumptions, identifies gaps, and validates priorities.
6. **Codex Engineering Agent** — implements approved GitHub work, tests it, and documents the result.

The roles do not need to be separate paid AI accounts or separate always-on servers in the first implementation; they can initially be defined as explicit operating roles and instructions.

# 4. Agent Autonomy and Escalation

Agents may act autonomously for research, analysis, documentation, routine implementation, testing, and backlog maintenance where explicitly authorized.

Use four escalation categories:

- **AUTO:** Agent can proceed.
- **REVIEW:** Agent can prepare work but should obtain review.
- **DECISION:** Product Owner approval is required.
- **BLOCKED:** Work cannot continue until an issue is resolved.

Consequential product direction, architecture, security, cost, data strategy, or other high-impact decisions must reach the Product Owner.

# 5. GitHub Work-Item Standard

Every meaningful unit of work should be a GitHub Issue with enough context for another agent to continue it.

Typical issue types:

- Feature
- Research
- Decision
- Architecture
- Bug
- Risk
- Technical debt
- Validation
- Documentation

A feature issue should normally contain:

- Problem / opportunity
- Proposed solution
- Business/customer value
- Evidence
- Priority
- Dependencies
- Risks
- Acceptance criteria
- Open questions
- Required decision

# 6. Product Memory

Recommended repository knowledge structure:

```text
JAGPORTS
├── 00-product-vision
├── 01-business-requirements
├── 02-vehicle-data-model
├── 03-epc-requirements
├── 04-feature-backlog
├── 05-research
├── 06-architecture
├── 07-decisions
├── 08-risks-and-issues
├── 09-roadmap
└── 10-agent-reports
```

GitHub is the authoritative location for project memory, code, documented decisions, and work history.

# 7. Prioritization Model

The prioritization system should combine:

- Customer value
- Business value
- Strategic differentiation
- Urgency
- Implementation effort
- Technical risk
- Dependencies
- Evidence confidence
- Reversibility

The output must be an **ordered queue**, not merely a set of priority labels. Sub-priorities are allowed to preserve explicit execution order.

Example:

```text
P1   Open Kanban
P1.1 Select Kanban tool
P1.2 Create repository
P1.3 Configure Project Item Status options
P1.4 Define fields
P2   Open agent access
P2.1 Define agent identities
P2.2 Validate leader R/W rights
P2.3 Define permission boundaries
```

# 8. Research-to-Feature Workflow

The intended workflow is:

`Research → Finding → Opportunity → Feature Proposal → Prioritization → Decision → Implementation`

Research should be recorded in GitHub Issues with evidence and confidence rather than remaining only in a ChatGPT conversation.

# 9. Codex Development Workflow

> **WORK IN PROGRESS — NOT THE SOURCE OF TRUTH**
>
> This section is retained as planning guidance. The authoritative Issue-to-completion lifecycle is maintained in `KNOWLEDGE.md`.

The current engineering lifecycle is:

`Approved Issue → Codex → Implement → Test → Review → Merge → Close Issue → Done`

Codex should stay within the approved scope and escalate major architectural or product changes instead of silently deciding them.

# 10. Raspberry Pi Role

The Raspberry Pi is optional and should not block the initial GitHub/Codex setup.

When required, it can provide:

- Jagports application runtime
- Database
- Persistent files
- Development/integration testing
- Scheduled jobs
- Local APIs/services
- Backups
- Future orchestration

The Pi is an infrastructure device, not the authoritative project-management system.

# 11. $0 Operating Constraint

The target architecture remains:

- ChatGPT Free
- Codex Web within available free access/limits
- GitHub Free features where sufficient
- Existing Raspberry Pi hardware
- Linux and open-source software

No paid API, cloud server, hosted database, commercial automation platform, or other recurring-cost dependency should be introduced while the $0 requirement remains active.

Free-tier limits must be treated as real constraints.

# 12. Immediate Next Execution Point

This document is a work-in-progress planning artifact. Current operational work is controlled by GitHub Issues and the GitHub Project's configured Project Item Status options.
