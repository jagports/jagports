# Management Knowledge

## Automation and System-of-Record Boundary

Automation may provide execution, scheduling, polling, or notification for Jagports management processes, but an automation mechanism is not itself the project system of record.

GitHub is the durable system of record for project communication, decisions, implementation traceability, Issues, Pull Requests, and repository knowledge.

A successful creation or execution of an automation must not be treated as evidence that the corresponding GitHub state or repository operation succeeded. External results require independent verification through the applicable capability.

## Scheduled Audit Knowledge

A recurring Team Lead audit is supported by ChatGPT automation. Its current schedule, prompt, and verified automation metadata are maintained in the scoped management document `00-Management/DAILY_PROJECT_AUDIT_SCHEDULE.md` rather than duplicated here.

The audit is intended to be read-only by default and to identify actionable exceptions while respecting the authoritative Management, workflow, communication, and knowledge sources.

## Capability Separation

The capability of an automation or agent connection is distinct from the authorization of the underlying GitHub account or credential.

For GitHub Project operations, repository access and Project Item capability must therefore be considered separately. An inability of one agent connection to read or mutate Project Items does not by itself indicate that the dedicated Project automation path is unavailable.

When a required capability is unavailable, the limitation must be recorded as such rather than replaced by an unverified claim of success.
