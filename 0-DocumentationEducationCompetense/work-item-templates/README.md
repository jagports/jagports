# Jagports Work-item Template Policy and Map

## Single source of truth

The executable GitHub Issue templates matching `.github/ISSUE_TEMPLATE/*.md` are the **single source of truth for template content**. They are stored in [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/).

Do not maintain duplicate copies of template fields or instructions elsewhere in the repository. Documentation may define template-selection policy and link to the executable templates, but it must not copy their bodies.

This document does **not** redefine the Management workflow. Workflow states, work discovery, Repository Change Gate, review/testing boundaries, record integrity, and completion rules remain authoritative in [`00-Management/WORKFLOWS.md`](../../00-Management/WORKFLOWS.md). Agent/human communication and specialized hand-off/escalation behavior remain governed by [`COMMUNICATION_PROTOCOL.md`](../COMMUNICATION_PROTOCOL.md).

## Template map

- [Feature](../../.github/ISSUE_TEMPLATE/feature.md)
- [Research](../../.github/ISSUE_TEMPLATE/research.md)
- [Decision](../../.github/ISSUE_TEMPLATE/human-decision.md)
- [Architecture](../../.github/ISSUE_TEMPLATE/architecture.md)
- [Bug](../../.github/ISSUE_TEMPLATE/bug.md)
- [Risk](../../.github/ISSUE_TEMPLATE/risk.md)
- [Validation](../../.github/ISSUE_TEMPLATE/validation.md)
- [Technical Debt](../../.github/ISSUE_TEMPLATE/technical-debt.md)
- [Documentation](../../.github/ISSUE_TEMPLATE/documentation.md)

Existing [`agent-escalation.md`](../../.github/ISSUE_TEMPLATE/agent-escalation.md) and [`agent-hand-off.md`](../../.github/ISSUE_TEMPLATE/agent-hand-off.md) are specialized communication templates governed by `COMMUNICATION_PROTOCOL.md`; they are not replacements for the work-item types above.

## Common rules

- Select the template that best matches the primary work item. Do not create duplicate Issues merely to use different templates.
- Keep the Issue as the persistent work record and preserve explicit links to relevant Issues, Pull Requests, repository files, evidence, and decisions.
- Write acceptance criteria as measurable checkboxes when the work has an implementation or verification outcome.
- Keep evidence separate from assumptions and identify uncertainty explicitly when it affects the work.
- Use repository source-of-truth documents instead of copying durable rules into an Issue body.
- Template selection does not establish or change Project Item Status; lifecycle state follows `00-Management/WORKFLOWS.md`.
