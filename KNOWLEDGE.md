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
- Repository-wide policy should be defined at the root and should not be unnecessarily duplicated in nested knowledge files.
- A nested knowledge file may briefly identify its scope or point to root policy, while its substantive content should remain domain-specific.
- Before committing a `KNOWLEDGE.md` change, review the content for task-specific identifiers and one-off examples and generalize or remove them where appropriate.

## GitHub Project automation credentials

GitHub Project automation that runs in GitHub Actions may require a repository Actions secret containing a credential that can modify the target Project. The Project owner and the automation identity are separate concepts: an organization-owned Project is addressed through the organization, while a dedicated GitHub user can provide the credential used by the workflow.

### Selecting and verifying an automation user

Prefer a dedicated GitHub user for long-lived Project automation rather than a personal administrator account when such an automation identity is available.

Before configuring the workflow credential, verify the intended automation user independently:

1. Authenticate GitHub CLI as the intended automation user.
2. Verify that the account can read the target organization-owned Project.
3. Verify that the account can perform the required Project mutation, such as changing a Project Item's `Status`.
4. Record only the verified capability and account identity in project documentation; never record the credential value.

A token's permission scope alone is not sufficient evidence. The actual Project operation must succeed using the intended automation identity.

### Creating the automation token

Create a dedicated personal access token while authenticated to GitHub as the selected automation user. Use the narrowest permissions that support the workflow's required repository and Project operations, and use an expiration appropriate to the project's security policy. The previously verified Jagports Project mutation used a token with the `project` scope.

The token must be stored only as a repository or organization Actions secret, using the exact secret name expected by the workflow: `PROJECTS_TOKEN`.

Do not put a token value in source code, workflow YAML, Issues, Pull Requests, `KNOWLEDGE.md`, scripts, logs, or chat. Do not expose the token when verifying the configuration; secret-listing or equivalent checks should be used only to confirm the secret name exists.

### Project setup and verification checklist

When creating or preparing a GitHub Project for automation, the setup task must include:

1. Identify and record the Project owner, Project number, and Project name.
2. Verify the required Project fields and option values used by automation.
3. Select a dedicated automation user where appropriate.
4. Verify the automation user's read access to the target Project.
5. Verify the automation user's write access by performing the required Project mutation.
6. Create a dedicated token for that automation user with the minimum required permissions.
7. Store the token as the workflow's `PROJECTS_TOKEN` Actions secret without exposing its value.
8. Verify that the secret exists by name.
9. Run an end-to-end workflow test using a real event and verify the resulting Project Item and Project Item `Status`.
10. Record failures as test evidence and do not claim successful automation until execution and resulting Project state have been verified.

`PROJECTS_TOKEN` is the GitHub Actions secret name. It must not be confused with the repository's separate `GITHUB_TOKEN`, which is used for repository operations where appropriate. The workflow configuration must consume the named Actions secret for Project mutations and must not hard-code the credential.
