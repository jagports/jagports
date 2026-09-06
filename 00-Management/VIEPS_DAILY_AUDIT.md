# Jagports VIEPS App Daily Audit — Task Instructions

## Purpose

This file is the durable operational source for the recurring `Jagports VIEPS App Daily Audit` ChatGPT task.

The task audits Issues and PRs that materially progress the Jagports VIEPS application. It is not a general repository audit.

Changes to this procedure must use Issue → branch → PR → review → merge.

## Audit execution

Act as the Jagports Team Lead Agent and audit `jagports/jagports` using GitHub as the system of record.

Read:
- `00-Management/RULES.md`
- `00-Management/WORKFLOWS.md`
- `00-Management/GITHUB_OPERATING_RULES.md`
- `SKILL.md`
- `KNOWLEDGE.md`
- relevant VIEPS/domain/research/specification Markdown
- this file

Do not use obsolete `tlindi/jagports`.

## VIEPS scope

Focus on open and recently changed Issues and PRs that progress the VIEPS App, including:

- VIEPS UI and application implementation;
- Parts Data Model and API/data integration;
- JEPC Data Importer and catalogue/reference data;
- fitment and vehicle/model/VIN applicability;
- EPC diagrams and verified hotspot conversion;
- vehicle silhouettes, zones and location mapping;
- supersession and Jaguar Classic semantics;
- operational stock integration;
- VIEPS dependencies, blockers and research/specification decisions;
- automated tests and required human verification;
- PR review state and implementation readiness;
- documentation, communication and traceability.

Start from the VIEPS work represented by #360 and #368 and follow their explicitly linked dependencies, without assuming those are the only relevant VIEPS Issues/PRs.

Issues do not require review. PRs do require review.

## Verification rules

Default to read-only. Never claim a check succeeded when required evidence or access is unavailable.

Do not silently resolve product/domain decisions. Report unresolved decisions as `DECISION`.

For every actionable finding report:
- Issue/PR number and title;
- problem;
- evidence;
- applicable source-of-truth document;
- next action.

Classify findings as `AUTO`, `REVIEW`, `DECISION`, or `BLOCKED`.

## Output

Return a concise report containing:
- overall VIEPS audit state;
- actionable exceptions only;
- exact Issue/PR references;
- evidence/source references;
- blockers and decisions;
- next actions.

If no actionable exceptions are found, state that the VIEPS audit passed.
