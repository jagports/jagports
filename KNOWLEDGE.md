# Jagports Project Knowledge

## Repository and GitHub Access

The authoritative Jagports repository is:

`jagports/jagports`

The GitHub account used for Jagports repository access is:

`jagports-fi`

`jagports-fi` is an administrator of the `jagports/jagports` repository.

Do not use the obsolete `tlindi/jagports` repository reference for current Jagports work.

```text
gh authentication
       ↓
   GitHub account
       ↓
repository / Project access
       ↓
Jagports AI OS Project
       │
       └── Project Item
              │
              └── Status / <current state>
```

`Status` is a property of the **Project Item**. It is not a property of the Project. The Project is the container that contains the Project Item.

For current Management workflow, execution, Project-state, review, testing, and capability rules, use the canonical sources referenced below rather than maintaining parallel rules in this file.

## Current Management Workflow Sources

`00-Management/WORKFLOWS.md` is the canonical normative source for Management workflows.

`00-Management/RULES.md` contains human-readable governance and rationale.

`SKILL.md` contains machine/agent execution guidance and implements or references the canonical workflow.

`.codex/skills/*` contains specialized operational procedures and must reference the canonical workflow rather than redefine it.

`0-DocumentationEducationCompetense/AGENT_COMMUNICATION_PROTOCOL.md` contains the detailed communication protocol for agent/human communication, acknowledgements, hand-offs, escalations, decisions, and implementation traceability.

These sources are authoritative for their respective current rules. `KNOWLEDGE.md` is not an alternative workflow authority.

## Durable Repository Knowledge

The Project's important reusable information must not exist only in private agent context. Decisions, reusable findings, and durable knowledge should be persisted in the appropriate GitHub Issue, documentation, decision record, or knowledge file.

`KNOWLEDGE.md` should contain generalized, durable knowledge rather than chronological task history or copies of current operating procedures.

## GitHub Project automation credentials

For organization-owned Project automation, distinguish the automation identity, its credential, and the GitHub Actions secret that stores that credential.

For Jagports Project automation:

- The Project is organization-owned by `jagports`.
- The dedicated automation identity is `jagports-fi`.
- `PROJECTS_TOKEN` is the GitHub Actions secret name used to store the Project automation credential.
- The token value must never be written to repository content, workflow files, Issues, Pull Requests, scripts, logs, or chat.
- `GITHUB_TOKEN` is a separate GitHub Actions-provided credential. Do not assume it provides the Project mutation capability required by Jagports automation.

Credential possession and Project capability are separate verification points. A token or authentication check must not be treated as proof that the workflow can perform the required Project mutation. Project access and the resulting Project state must be verified independently.

The detailed development-specific setup, permission requirements, and end-to-end verification belong in `6-Development/KNOWLEDGE.md`.

## ChatGPT Scheduled Project Audit

Jagports has an active recurring **daily project audit** scheduled through the ChatGPT task/automation facility.

The audit targets the authoritative repository:

`jagports/jagports`

The scheduled audit acts as an independent Team Lead-level project review. It must inspect the GitHub repository and Project as the system of record and consult the relevant repository source-of-truth documents, including:

- `00-Management/RULES.md`
- `00-Management/WORKFLOWS.md`
- `SKILL.md`
- `KNOWLEDGE.md` and relevant nested `KNOWLEDGE.md` files
- relevant management, knowledge, communication and protocol Markdown files
- `0-DocumentationEducationCompetense/AGENT_COMMUNICATION_PROTOCOL.md`
- `Jagports_AI_OS_Prioritized_Work_Plan.md`

The audit checks, at minimum:

- Issue priority and work-plan consistency
- Issue descriptions and required traceability
- Parent/sub-issue relationships
- Project Item status and workflow consistency
- Labels and other relevant Project metadata
- Pull Request links, review state and implementation traceability
- stale, blocked or otherwise unattended work
- management, development and communication-process compliance
- whether agent communications, acknowledgements, decisions and hand-offs are recorded in the GitHub system of record rather than existing only in private ChatGPT context

The audit is **read-only by default**. It must not modify Issue or Pull Request content, repository files, labels, Project fields or relationships unless an explicit project rule authorizes a non-content state operation.

Audit findings are classified as:

- `AUTO` — suitable for an already authorized, low-risk automated action
- `REVIEW` — requires human or agent review before action
- `DECISION` — requires Product Owner or other authorized decision
- `BLOCKED` — cannot be completed because of a verified access, capability, dependency or technical problem

The audit must report evidence and the applicable source-of-truth document for actionable findings. It must never report a check or corrective action as successful without verification.

The ChatGPT task facility can notify the user through the ChatGPT application, including mobile notifications when the user's notification settings and platform support them. Such notifications are a convenience/alerting channel only; GitHub remains the Jagports system of record for project communication, decisions, implementation traceability and durable knowledge.

The scheduled audit itself does not replace the GitHub Issue/PR communication protocol. Agents must continue to record relevant work communication, decisions, acknowledgements, hand-offs and escalations in the appropriate GitHub records according to `0-DocumentationEducationCompetense/AGENT_COMMUNICATION_PROTOCOL.md` and the canonical Management workflow.

If the scheduled audit cannot access the repository, required source-of-truth documents, GitHub Project data, or another required capability, the audit must report the limitation as `BLOCKED` rather than presenting an incomplete audit as successful.

## Future Agent Operating Model Investigation

Topic: proactive multi-agent workflow architecture

This topic requires further investigation before implementation.

Potential architecture options:

1. Scheduled polling agents
- Agent watcher process runs continuously on an available host.
- Periodically checks GitHub Issues, Projects, comments, assignments and status changes.
- Evaluation criteria:
  - suitability for Jagports
  - response time
  - operating cost
  - vendor lock-in risk
  - simplicity and ease of deployment
  - technical complexity

2. GitHub Actions event-driven agents
- GitHub events trigger workflows.
- Possible triggers:
  - Issue created or updated
  - Issue assigned
  - Issue comment added
  - Pull Request opened or reviewed
  - Repository file changes
- Evaluation criteria:
  - suitability for Jagports
  - response time
  - operating cost
  - vendor lock-in risk
  - simplicity and ease of deployment
  - technical complexity

3. Coordinator Agent architecture
- A coordinator service routes work between specialised agents.
- Possible responsibilities:
  - detect new work
  - assign agents
  - collect acknowledgements
  - monitor progress
  - detect missing responses
  - maintain information flow
- Evaluation criteria:
  - suitability for Jagports
  - response time
  - operating cost
  - vendor lock-in risk
  - simplicity and ease of deployment
  - technical complexity

This remains an investigation topic. It is not a current Management workflow definition.

## AI Tool Capability Transparency

When an AI agent is expected to perform an external action, the agent must distinguish user/account authorization from the execution capabilities actually available in the current session.

If an expected action cannot be completed, record and communicate the verified cause where possible, such as:
- required tool operation unavailable
- insufficient permission
- authentication problem
- unavailable integration
- technical failure

Do not claim that an action was completed without verification. Do not repeatedly retry an unsupported operation without explaining the limitation.

For Jagports, an important operational distinction is:
- GitHub account/repository permissions determine what the account is authorized to do.
- The connected agent/tool interface determines which of those operations the agent can actually invoke in a given session.

When capability availability changes or is uncertain, the agent should state the limitation explicitly and identify the available alternative or required next step.

## GitHub Access and Command Execution Lessons

GitHub access must be checked before starting work that depends on GitHub. Repository access alone is not sufficient: the agent must also verify that the specific operation required for the task is available, such as file editing, branch creation, PR creation, Issue comments, or Project field updates.

If required GitHub access or an operation is unavailable, the user must be alerted immediately. The agent must not silently substitute an unperformed action, repeatedly retry an unavailable operation, or unnecessarily make the user execute commands to compensate for the missing agent capability.

When the user explicitly requests commands, provide the requested command sequence in one Markdown code block for easy console pasting. Do not propose creating a script for the user to run when direct commands are sufficient.

For command sequences whose later steps depend on earlier output, use a temporary file in the working directory to carry the required result between commands. Remove those temporary files after the dependent commands have completed successfully.

Windows Git Bash compatibility is an explicit project constraint. Avoid `awk`, Bash associative arrays, backslash (`\\`) line continuations, and Windows path-separator assumptions. Prefer forward-slash paths and simple Git Bash-compatible shell constructs. Commands should be verified against these known limitations before being given to the user.

## GitHub Issue and Pull Request Comment Formatting

GitHub Issue and Pull Request comments must be formatted for quick visual scanning and reliable traceability.

- Put each distinct traceability statement on its own line or paragraph.
- When an Issue or Pull Request is the primary reference for a statement, put its Markdown link at the beginning of the line.
- Keep the Issue/PR number and title together in the link text when useful; do not bury the reference inside a long sentence.
- Separate relationship text such as `implements`, `resolves`, `supersedes`, or `previous implementation` from the referenced Issue or Pull Request instead of placing the complete relationship in one long sentence.
- Use short headings or labels on their own lines when context is needed before a reference.
- Do not construct long inline chains containing a PR title, PR number, Issue title, Issue number, and relationship text in the same sentence.

Preferred pattern:

**Previous implementation**
[PR #<number> — <title>](<PR URL>)

**Implements/resolves**
[Issue #<number> — <title>](<Issue URL>)

For multiple references, give each primary reference its own line rather than combining them into a single paragraph.

## KNOWLEDGE.md Hierarchy and Generalization Rules

`KNOWLEDGE.md` files may exist at the repository root and within domain-specific subfolders. Each file contains durable, reusable knowledge appropriate to its scope.

- The root `KNOWLEDGE.md` contains cross-domain, repository-wide and organizational knowledge.
- A nested `KNOWLEDGE.md` contains durable knowledge specific to its containing domain or subfolder.
- Further nesting is allowed when a domain becomes sufficiently large to justify a more specific knowledge scope.
- A nested knowledge file must not be deleted merely because it is nested. Consolidate material into the root only when it is genuinely cross-domain.
- The hierarchy policy in this section applies to every `KNOWLEDGE.md` in the repository.
- All `KNOWLEDGE.md` files must contain durable, reusable knowledge rather than chronological task history.
- Generalize observations before recording them as knowledge. Do not preserve individual Issue numbers, PR numbers, branch names, temporary identifiers, one-off test cases, or one-off category examples unless they are necessary to express a reusable principle.
- Task-specific evidence, implementation history and temporary operational details belong in the relevant task record, review, test record, project record, or other task-specific documentation.
- Repository-wide policy should be defined in the appropriate governing source and should not be unnecessarily duplicated in knowledge files.
- A nested knowledge file may briefly identify its scope or point to root policy, while its substantive content should remain domain-specific.
- Before committing a `KNOWLEDGE.md` change, review the content for task-specific identifiers and one-off examples and generalize or remove them where appropriate.

Reusable knowledge-flow visualizations belong with documentation/knowledge topics rather than in a central collection of unrelated diagrams. The reusable knowledge-flow diagram is maintained in `0-DocumentationEducationCompetense/KNOWLEDGE_FLOW.md`.

## Project Work Plan Reference

`5-Implementation-Projects/Jagports_AI_OS_Prioritized_Work_Plan.md` is maintained as a **WORK IN PROGRESS** planning document.

Agents should consult it when planning project work, but should critically evaluate its descriptions, assumptions and proposed structures. The work plan is not fixed: agents are encouraged to identify inconsistencies, outdated material, missing work, unnecessary complexity and better approaches, and to freely suggest improvements.

GitHub Issues are the primary work and communication records. The GitHub Project provides a visual representation of Issues and their current Project Item Status. Current lifecycle and Project-state rules are defined in `00-Management/WORKFLOWS.md`.

## Agent Communication Protocol Reference

`0-DocumentationEducationCompetense/AGENT_COMMUNICATION_PROTOCOL.md` defines the detailed communication protocol for agents and humans working on Jagports AI OS.

Agents should consult that protocol when handling Issue communication, acknowledgements, hand-offs, escalations, decisions and implementation traceability. Current Management workflow rules remain in `00-Management/WORKFLOWS.md`.

## 4-Production Folder Structure

`4-Production/` is the repository location for production implementations. It may contain the following approved subfolders:

- `base/` — shared/base production infrastructure and foundational runtime components.
- `platform/` — platform-level production components.
- `application-platform/` — reusable application-platform/runtime services used by applications.
- `application/` — production application implementations.
- `customer/` — customer-specific production components and configuration.

Existing production subfolders remain valid unless explicitly reorganized through an approved Issue and Pull Request.

Agents must not invent additional root-level production folders. Production files must be placed under `4-Production/` and, where applicable, one of the approved subfolders above.

Before choosing a production subfolder, agents must inspect the relevant repository documentation and existing contents. If the correct subfolder is unclear, the agent must ask the Product Owner rather than inventing a new structure.
