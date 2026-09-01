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

## GitHub Issue and Pull Request Comment Formatting

GitHub Issue and Pull Request comments must be formatted for quick visual scanning and reliable traceability.

- Put each distinct traceability statement on its own line or paragraph.
- When an Issue or Pull Request is the primary reference for a statement, put its Markdown link at the beginning of the line.
- Keep the Issue/PR number and title together in the link text when useful; do not bury the reference inside a long sentence.
- Separate relationship text such as `implements`, `resolves`, `supersedes`, or `previous implementation` from the referenced Issue or Pull Request instead of placing the complete relationship in one long line.
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
- Repository-wide policy should be defined at the root and should not be unnecessarily duplicated in nested knowledge files.
- A nested knowledge file may briefly identify its scope or point to root policy, while its substantive content should remain domain-specific.
- Before committing a `KNOWLEDGE.md` change, review the content for task-specific identifiers and one-off examples and generalize or remove them where appropriate.

## Project Work Plan Reference

`5-Implementation-Projects/Jagports_AI_OS_Prioritized_Work_Plan.md` is maintained as a **WORK IN PROGRESS** planning document.

Agents should consult it when planning project work, but should critically evaluate its descriptions, assumptions and proposed structures. The work plan is not fixed: agents are encouraged to identify inconsistencies, outdated material, missing work, unnecessary complexity and better approaches, and to freely suggest improvements.

The GitHub Issues are the primary work and communication records. The GitHub Project provides a visual representation of Issues and their current Project Item Status.

## Agent Communication Protocol Reference

`0-DocumentationEducationCompetense/AGENT_COMMUNICATION_PROTOCOL.md` defines the detailed communication protocol for agents and humans working on Jagports AI OS.

Agents should consult the protocol when handling Issue communication, acknowledgements, hand-offs, escalations, decisions and implementation traceability. It complements this knowledge file by providing operational communication rules.

## Issue-to-Completion Lifecycle

The standard Issue-driven development lifecycle is:

**Approved Issue → Codex → Implement → Test → Review → Merge → Close Issue → Done**

The previous lifecycle **Approved Issue → Codex → Implement → Test → Review → Merge → Done** is obsolete and must not be used.

Current implementation reality: Codex is not yet integrated into the Jagports development workflow. At present, implementation is primarily driven by ChatGPT under the control and direction of `tlindi`.

The initiating Issue remains open while its implementation is being developed, tested and reviewed. The implementing Pull Request should maintain explicit traceability to the initiating Issue using the project's preferred relationship wording.

After the implementing Pull Request is successfully merged and the work is complete, close the initiating Issue with reason `completed`. The final Project state for the completed work is `DONE`.

Closing the Issue is a lifecycle step after merge; it is not a substitute for PR-to-Issue traceability and does not require the PR relationship itself to use automatic `Closes #N` wording.

## ASCII Workflow Diagrams

Plain-text workflow diagrams are preferred over Mermaid when a compact visual explanation improves understanding. They should be short, focused, readable in GitHub Markdown, Issue comments and Pull Request comments, and reusable rather than tied to one-off task numbers.

### GitHub identity and Project access

```text
gh authentication
       ↓
   GitHub account
       ↓
repository access
       ↓
  Project access
       ↓
 Project #<id>
       ↓
  Project Status
```

### Issue → Project relationship

```text
GitHub Issue
     ↓
Project Item
     ↓
Jagports AI OS Project
     ↓
Status / <current state>
```

### Issue implementation traceability

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

### Complete Issue-driven lifecycle

```text
Approved Issue
      ↓
    Codex
      ↓
  Implement
      ↓
     Test
      ↓
    Review
      ↓
    Merge
      ↓
Close Issue
      ↓
     DONE
```

### Research → approved implementation

```text
Research
   ↓
Finding
   ↓
Opportunity
   ↓
Feature Proposal
   ↓
Prioritization
   ↓
Decision
   ↓
Approval
   ↓
Implementation
```

### Human decision gate

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

### Agent communication lifecycle

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

### Agent hand-off

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

### Escalation handling

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

### Pull Request control flow

```text
Draft / implementation PR
          ↓
      Ready for review
          ↓
        Review
       ↙      ↘
 Changes     Approved
   ↓             ↓
Implement      Merge
   ↓             ↓
Review again   Close Issue
                 ↓
                DONE
```

### Test relationship

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

### Project Status versus lifecycle

```text
Issue lifecycle
      ↓
Approved → Implement → Test → Review → Merge → Close
      ↓
Project Item Status
      ↓
Current visual work state
```

Project Status is the visualization of the current work state. It is not a second, competing completion lifecycle.

### Knowledge flow

```text
Observed result
      ↓
Task record / Issue
      ↓
Validated reusable finding
      ↓
KNOWLEDGE.md
      ↓
Future agent work
```

### Scope rule for ASCII diagrams

Use an ASCII diagram when it makes a relationship, transition, ownership boundary, decision gate, dependency, or lifecycle easier to understand. Do not add diagrams merely for decoration. Prefer one small diagram over a large diagram containing unrelated processes. Keep task-specific Issue/PR numbers out of reusable knowledge diagrams unless the diagram is explicitly part of task-specific documentation.
