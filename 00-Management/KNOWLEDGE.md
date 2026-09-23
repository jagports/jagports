# Management Knowledge

## Product and Operating Vision

The durable vision documents are:

- [`VISION_AI-OS.md`](VISION_AI-OS.md) — Jagports AI OS operating/product vision, including the GitHub-centered human-governed agent model, durable-memory direction, automation principles, and baseline cost/infrastructure constraints.
- [`VISION_VIEPS.md`](VISION_VIEPS.md) — VIEPS product vision, including canonical Jaguar/parts knowledge, evidence-backed applicability, catalogue/stock separation, provider direction, and long-term platform direction.

These vision documents state intended direction and durable boundaries. They do not replace `WORKFLOWS.md`, `RULES.md`, detailed specifications, roadmaps, or implementation acceptance criteria.

## Decision Records

[`DECISIONS.md`](DECISIONS.md) is the cross-project index of consequential accepted decisions and their authoritative Issue/PR/document records.

Use the decision log to discover whether a consequential question has already been decided before reopening it. The linked originating record remains the detailed authority; the log preserves concise traceability and supersession history rather than duplicating full decision narratives.

Decision-record content requirements remain defined by `0-DocumentationEducationCompetense/COMMUNICATION_PROTOCOL.md`.

## Automation and System-of-Record Boundary

Automation may provide execution, scheduling, polling, or notification for Jagports management processes, but an automation mechanism is not itself the project system of record.

GitHub is the durable system of record for project communication, decisions, implementation traceability, Issues, Pull Requests, and repository knowledge.

A successful creation or execution of an automation must not be treated as evidence that the corresponding GitHub state or repository operation succeeded. External results require independent verification through the applicable capability.

## Scheduled Audit Knowledge

A recurring Team Lead audit is supported by ChatGPT automation. Its current schedule, prompt, and verified automation metadata are maintained in the scoped management document `00-Management/DAILY_AUDIT_SCHEDULE.md` rather than duplicated here.

The audit is intended to be read-only by default and to identify actionable exceptions while respecting the authoritative Management, workflow, communication, and knowledge sources.

## Lead Agent API and Unattended Execution

The Raspberry Pi Lead Agent has successfully completed operator-reported, separately authorized OpenAI API and existing wrapper smoke tests. This establishes a usable, billed API connection for **bounded advisory reasoning development**; no additional Codex-specific subscription is required for the initial OpenAI-backed specialist pilot.

The existing modular coordinator implements deterministic GitHub collection, lifecycle comparison, specialist routing, state and reports. The OpenAI wrapper is not yet connected to its specialist execution path, and automatic model-generated Telegram delivery has not been verified. The 9h45min user timer and manual service invocation have been reported as active/successful; an actual later timer-triggered invocation requires distinct journal and report evidence.

Incremental model-backed reasoning, research-to-decision validation and reliable notification work may proceed through the accepted specification, an approved per-run/recurring cost budget, least-privilege access and the existing human decision and independent review gates. Unimplemented production autonomy, autonomous code changes, merges and deployments must not be represented as existing capabilities merely because API connectivity succeeds.

ChatGPT scheduled prompt automation and the local Lead Agent are separate scheduling/execution paths; both preserve GitHub as the durable project system of record. Treat an unavailable **specific** execution or tool capability as a scoped, testable dependency rather than a blanket subscription-based block on all agent development.

## Capability Separation

The capability of an automation or agent connection is distinct from the authorization of the underlying GitHub account or credential.

For GitHub Project operations, repository access and Project Item capability must therefore be considered separately. An inability of one agent connection to read or mutate Project Items does not by itself indicate that the dedicated Project automation path is unavailable.

When a required capability is unavailable, the limitation must be recorded as such rather than replaced by an unverified claim of success.
