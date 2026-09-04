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

### GitHub Project Operations Available to the Agent

The current connected GitHub tool does not provide GitHub Project Item mutation or independent Project Item read operations. This is the current operational state and must be treated as a persistent limitation until further notice. No future availability of these operations is assumed.

Normal Jagports Project task management is designed to use dedicated Project automation rather than requiring every agent or user to have direct Project administration capability. The dedicated `jagports-fi` automation identity and `PROJECTS_TOKEN` are used by the repository's Project automation path for Project Item operations.

Therefore:

- Do not interpret the current agent connection's inability to mutate or independently read Project Items as a failure of the Jagports Project architecture or Project automation credentials.
- Do not claim that a Project Item was added, its Status changed, or the resulting Project state was independently verified through this agent connection.
- Do not create duplicate Issues because Project Item state cannot be verified through this agent connection.
- Continue repository and Issue work that can be performed and verified through the available connection.
- When a task requires Project Item mutation or independent Project Item verification, record that the operation cannot be performed through the current connection and do not represent the Project state as verified.

The `MUTATE → INDEPENDENTLY VERIFY → CLAIM SUCCESS` rule is not implementable for GitHub Project Item operations through the current agent connection. It is not a current executable requirement for those operations and must not be presented as one. This limitation applies until further notice.

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
