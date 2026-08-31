# Jagports AI OS — Agent Instructions

## Before Beginning Work

Before beginning work on any GitHub Issue, the agent must inspect the repository root and use the root-folder structure as the first-level semantic map of Jagports AI OS knowledge.

Inspect all of these root folders, including folders that are currently empty:

- `0-DocumentationEducationCompetense` — Documentation, education, competencies
- `00-Management` — Management, governance, agent operating rules
- `2-Sales` — Sales, customer, commercial matters
- `3-Deployment` — Deployment, installation, operational deployment
- `4-Production` — Production, product planning, requirements
- `5-Implementation-Projects` — Active implementation projects
- `6-Development` — Software and technical development
- `7-Research` — Research, investigations, evidence

The agent must then identify which domains are relevant to the Issue and read the applicable `*.md` files in those domains before making decisions or implementation changes.

Do not blindly read every Markdown file. Use the Issue subject, task description, root-folder names, filenames, and document content to determine relevance.

### Semantic Domain Map

The root-folder names are the first-level navigation protocol. Use them as follows:

- `0-DocumentationEducationCompetense` — documentation, education, competencies, and agent communication protocol material.
- `00-Management` — management, governance, agent operating rules, process, and project-control material.
- `2-Sales` — sales, customers, and commercial matters.
- `3-Deployment` — deployment, installation, and operational deployment.
- `4-Production` — product planning, product requirements, priorities, and production-related knowledge.
- `5-Implementation-Projects` — active implementation projects and their work context.
- `6-Development` — software, engineering, and technical development.
- `7-Research` — research, investigations, evidence, and verification findings.

### Minimum Discovery Rules

- Read applicable management and agent-operating documentation before executing work.
- Check `0-DocumentationEducationCompetense` for applicable documentation, education, competence, and agent protocol material.
- Check `00-Management` for applicable management, governance, process, and project-control material.
- Check `2-Sales` for Issues concerning sales, customers, or commercial matters.
- Check `3-Deployment` for Issues concerning deployment, installation, or operational deployment.
- Check `4-Production` for applicable product plans, requirements, priorities, and production-related knowledge.
- Check `5-Implementation-Projects` for active implementation-project context when relevant.
- Check `6-Development` for implementation, software, engineering, or technical-development work.
- Check `7-Research` when the work depends on research, evidence, investigation, or external findings.
- Treat existing authoritative decisions and requirements as constraints unless the current Issue explicitly changes them through the required decision process.
- If relevant documentation conflicts, follow the established decision/authority rules. If the conflict cannot be resolved under those rules, escalate it as `CONFLICT` before proceeding with the affected decision or change.

The distinction is mandatory: inspect all root folders first; read documentation in depth only in domains relevant to the Issue. Empty folders are still inspected and remain part of the repository semantic map.

## Communication Protocol

The detailed Jagports AI OS agent communication protocol is maintained in:

`0-DocumentationEducationCompetense/AGENT_COMMUNICATION_PROTOCOL.md`

Agents must read the applicable communication-protocol rules before beginning work that involves agent hand-off, escalation, human decisions, workflow transitions, or persistent inter-agent communication.

## Repository Change Control

Repository changes must follow the controlled workflow:

`Issue → Branch → Change → Pull Request → Review → Merge → Verification`

No repository file may be modified directly on `main`. This applies equally to documentation, configuration, templates, scripts, source code, and small changes.

Before modifying a repository file, verify that the required Issue and dedicated branch exist. The change must be made on that branch, delivered through a Pull Request linked to the Issue, reviewed, approved, merged, and then verified.

## Persistent Communication

GitHub Issues, Pull Requests, Project state, and repository documentation are persistent project records. Critical decisions, blockers, findings, and hand-offs must not exist only in transient agent context.
