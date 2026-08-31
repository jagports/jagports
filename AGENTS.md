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

1. Inspect `0-DocumentationEducationCompetense` and read its applicable `KNOWLEDGE.md` when the Issue requires documentation, education, competencies, or agent protocol knowledge.
2. Inspect `00-Management` and read its applicable `KNOWLEDGE.md` when the Issue concerns repository/project management, governance, requirements, priorities, or product decisions. Repository/project management itself is performed by human `tlindi`.
3. Inspect `2-Sales` and read its applicable `KNOWLEDGE.md` when the Issue concerns sales, customers, or commercial matters.
4. Inspect `3-Deployment` and read its applicable `KNOWLEDGE.md` when the Issue concerns deployment, installation, or operational deployment.
5. Inspect `4-Production` and read its applicable `KNOWLEDGE.md` when the Issue concerns production data, production files, or product decisions requiring production context. Production is organized as `Base → Platform → Platform Application → Application → EndCustomer`; there is currently no data or code considered production.
6. Inspect `5-Implementation-Projects` and read its applicable `KNOWLEDGE.md` when implementation-project context is relevant.
7. Inspect `6-Development` and read its applicable `KNOWLEDGE.md` when software, engineering, or technical development is involved.
8. Inspect `7-Research` and read its applicable `KNOWLEDGE.md` when the work depends on research, evidence, investigation, or verification.
9. If relevant documentation conflicts, follow the established authority/decision rules. If the conflict cannot be resolved under those rules, escalate it as `CONFLICT` before proceeding with the affected decision or change.

The distinction is mandatory: inspect all root folders first; read `KNOWLEDGE.md` only in domains relevant to the Issue. Empty folders are still inspected and remain part of the repository semantic map.
