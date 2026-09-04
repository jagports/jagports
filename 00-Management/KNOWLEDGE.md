# Management Knowledge

## Daily Team Lead Project Audit

Jagports uses a recurring ChatGPT automation as the execution and notification mechanism for an independent daily Team Lead project audit.

The audit targets the authoritative repository `jagports/jagports` and treats GitHub as the system of record. The automation is not itself a project record and must not be treated as evidence that a GitHub operation succeeded.

The recurring audit:

- runs daily through the supported ChatGPT automation facility;
- reads the current Management, knowledge, communication/protocol, and work-plan source documents when accessible;
- checks project work, Issues, Pull Requests, workflow state, traceability, stale or blocked work, and communication/documentation compliance;
- reports only actionable exceptions;
- classifies findings as `AUTO`, `REVIEW`, `DECISION`, or `BLOCKED`;
- reports evidence and applicable source-of-truth documents for findings; and
- reports a capability or access limitation as `BLOCKED` instead of presenting an incomplete audit as successful.

The audit prompt is maintained in `00-Management/DAILY_PROJECT_AUDIT_SCHEDULE.md`, which also records the currently verified automation identifier and recurrence information.

The scheduling facility may provide ChatGPT notifications, but GitHub remains the durable system of record for project communication, decisions, implementation traceability, and repository knowledge.

The audit is read-only by default. It must not modify Issue or Pull Request content, repository files, labels, Project fields, or relationships unless an explicit project rule authorizes a non-content state operation.

Current GitHub Project Item read/mutation limitations of an individual agent connection must not be confused with the capability of the dedicated Project automation path. When Project state cannot be independently verified through the current connection, the audit must say so explicitly.
