# Jagports AI OS — Agent Instructions

## Before Beginning Work

Before beginning work on any GitHub Issue, the agent must inspect the repository root and use the root-folder structure as the first-level semantic map of Jagports AI OS knowledge.

Inspect all of these root folders, including folders that are currently empty:

- `0-DocumentationEducationCompetense` — Documentation, education, competencies, and agent protocol material.
- `00-Management` — Repository and project management, governance, and management operating material. Current repository management is human-controlled; agents must follow the applicable instructions found here.
- `2-Sales` — Sales, customers, and commercial matters.
- `3-Deployment` — Deployment, installation, and operational deployment.
- `4-Production` — Production data and product/production knowledge. Its production hierarchy is `Base → Platform → Platform Application → Application → EndCustomer`; there is currently no data or code considered production yet.
- `5-Implementation-Projects` — Active implementation projects and their work context.
- `6-Development` — Software, engineering, and technical development.
- `7-Research` — Research, investigations, evidence, and verification.

The agent must then identify which domains are relevant to the Issue and read the applicable documentation in those domains before making decisions or implementation changes.

## Documentation Discovery

`KNOWLEDGE.md` is the conventional filename for repository or domain knowledge when such a file exists, but it is not a requirement that every relevant agent document use that filename. Other specifically named Markdown documents can contain applicable rules, protocols, requirements, or operating instructions.

Use the Issue subject, root-folder names, filenames, and document content to determine which documentation is relevant. Do not blindly read every Markdown file.

The discovery sequence is:

1. Inspect all eight root folders.
2. Use their names and contents to identify the semantic domains relevant to the Issue.
3. In each relevant domain, read the applicable `KNOWLEDGE.md` when present.
4. Also read other specifically relevant `*.md` documents when their names or contents indicate that they govern the Issue.
5. Check `7-Research` when the work depends on research, evidence, investigation, or verification.
6. Check `00-Management` and `4-Production` when the Issue concerns management, governance, requirements, priorities, production, or product decisions.
7. Check `5-Implementation-Projects` and `6-Development` when implementation work is involved.
8. If relevant documentation conflicts, follow the established authority/decision rules. If the conflict cannot be resolved under those rules, escalate it as `CONFLICT` before proceeding with the affected decision or change.

The distinction is mandatory: inspect all root folders first; read documentation in depth only in domains relevant to the Issue. Empty folders are still inspected and remain part of the repository semantic map.

## Communication Protocol

The detailed Jagports AI OS agent communication protocol is maintained in:

`0-DocumentationEducationCompetense/AGENT_COMMUNICATION_PROTOCOL.md`

This root-level document is only the discovery/index layer. Communication lifecycle, notification, acknowledgement, escalation, and persistent hand-off rules belong to the detailed communication-protocol work item and must not be duplicated here.

## Scope Boundary

This file defines repository knowledge discovery and navigation for agents. Changes to the Repository SKILL, repository change-control rules, file-move/rename behavior, or the detailed communication protocol belong to their dedicated Issues and Pull Requests rather than being implemented here.

Relevant current work items include:

- `#73` / `#77` — Repository SKILL and repository change-control requirements.
- `#80` — Repository SKILL rule for preserving file-move/rename semantics.
- `#14` — Agent communication protocol and its related architecture work.
