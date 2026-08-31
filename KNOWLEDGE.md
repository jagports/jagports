# Jagports Project Knowledge

## Repository and GitHub Access

The authoritative Jagports repository is:

`jagports/jagports`

The GitHub account used for Jagports repository access is:

`jagports-fi`

`jagports-fi` is an administrator of the `jagports/jagports` repository.

Do not use the obsolete `tlindi/jagports` repository reference for current Jagports work.

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

Important principle:
Important project information must not exist only in private agent context. Decisions, results and reusable knowledge must be persisted into GitHub Issues, documentation, decision logs or knowledge files.

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

## KNOWLEDGE.md Generalization and Scope Rules

`KNOWLEDGE.md` is the repository-wide knowledge record. It contains durable, reusable knowledge rather than chronological work-item history or implementation-specific evidence.

- The repository root `KNOWLEDGE.md` is the single authoritative knowledge file.
- Do not create or retain additional `KNOWLEDGE.md` files in subfolders.
- Do not retain individual GitHub Issue numbers in `KNOWLEDGE.md`.
- Do not retain individual Pull Request numbers in `KNOWLEDGE.md`.
- Do not retain specific branch names in `KNOWLEDGE.md`.
- Do not retain temporary resource names, one-off test cases, or other identifiers that are meaningful only to a particular task or implementation.
- Do not retain one-off category examples when they are tied to a particular task, Issue, Pull Request, branch, or temporary workflow.
- When an observed event contains reusable information, convert it into a general rule or principle and retain only that generalized knowledge.
- Keep task-specific evidence, implementation history, individual test results, and temporary operational details in the relevant Issue, Pull Request, test record, project record, or other task-specific documentation.
- Before committing changes to the root `KNOWLEDGE.md`, review the content for task-specific identifiers and examples and generalize or remove them.
