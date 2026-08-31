# Jagports AI OS — Agent Instructions

## Before Beginning Work

Before beginning work on any GitHub Issue, the agent must inspect the repository root and use the root-folder structure as the first-level semantic map of Jagports AI OS knowledge.

Inspect all of these root folders, including folders that are currently empty:

- `0-DocumentationEducationCompetense` — Documentation, education, competencies, and agent protocol material.
- `00-Management` — Repository and project management. All repository/project management is performed by human `tlindi`; agents do not perform repository/project management.
- `2-Sales` — Sales, customers, and commercial matters.
- `3-Deployment` — Deployment, installation, and operational deployment.
- `4-Production` — Production data and files that run in production, organized as `Base → Platform → Platform Application → Application → EndCustomer`. There is currently no data or code considered production yet.
- `5-Implementation-Projects` — Active implementation projects and their work context.
- `6-Development` — Software, engineering, and technical development.
- `7-Research` — Research, investigations, evidence, and verification.

The agent must then identify which domains are relevant to the Issue and read the applicable documentation in those domains before making decisions or implementation changes.

## Documentation Discovery

`KNOWLEDGE.md` is the designated filename for repository or domain knowledge. After identifying the relevant domains from the root-folder structure, read `KNOWLEDGE.md` in those relevant domains when present. Do not search or read other Markdown files as part of this general agent-knowledge discovery process unless a separate, applicable instruction explicitly requires a particular document.

Use the Issue subject and root-folder names to determine which domains are relevant to the Issue. Do not blindly read `KNOWLEDGE.md` files from unrelated domains.

The discovery sequence is:

1. Inspect all eight root folders.
2. Use their names to identify the semantic domains relevant to the Issue.
3. In each relevant domain, read the applicable `KNOWLEDGE.md` when present.
4. Check `7-Research` when the work depends on research, evidence, investigation, or verification.
5. Check `00-Management` and `4-Production` when the Issue concerns management, governance, requirements, priorities, production, or product decisions.
6. Check `5-Implementation-Projects` and `6-Development` when implementation work is involved.
7. If relevant documentation conflicts, follow the established authority/decision rules. If the conflict cannot be resolved under those rules, escalate it as `CONFLICT` before proceeding with the affected decision or change.

The distinction is mandatory: inspect all root folders first; read `KNOWLEDGE.md` only in domains relevant to the Issue. Empty folders are still inspected and remain part of the repository semantic map.
