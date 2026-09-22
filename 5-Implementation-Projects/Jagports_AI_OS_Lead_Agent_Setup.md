# Jagports AI OS — Lead Agent Implementation Project

## Business case

The Lead Agent prototype tests whether a small, low-cost coordinator can detect relevant GitHub changes, distribute work to specialists and surface actionable results without keeping project state in private chat or replacing human-governed decisions. The AI OS vision and authority boundaries remain in [VISION_AI-OS.md](../00-Management/VISION_AI-OS.md) and [WORKFLOWS.md](../00-Management/WORKFLOWS.md).

The investment hypothesis is incremental: retain deterministic GitHub collection, state comparison, specialist routing and reporting; add paid model reasoning only when it demonstrably improves classification or decisions. Reuse the existing Raspberry Pi where practical, avoid unnecessary recurring cost and keep the model/provider and orchestration runtime replaceable.

## Scope, traceability and document ownership

[Issue #49 — Expand and govern the agent team](https://github.com/jagports/jagports/issues/49) is related AI OS roadmap work. [Issue #594 — Lead Agent prototype documentation](https://github.com/jagports/jagports/issues/594) and [PR #595](https://github.com/jagports/jagports/pull/595) contain original setup/implementation history. [PR #781](https://github.com/jagports/jagports/pull/781) documented the minimum Agents SDK roadmap. [Issue #898](https://github.com/jagports/jagports/issues/898) covers direct API smoke-test documentation; [Issue #900](https://github.com/jagports/jagports/issues/900) covers timer verification.

Each responsibility has one canonical location:

| Content | Canonical document |
|---|---|
| Business case, evidence, dependencies and project direction | This Projects document |
| Architecture, implementation status and capability evolution | [Lead Agent README](../6-Development/AI/agents/jagports/jagports-lead-agent/README.md) |
| Reusable execution, diagnostics, API smoke tests and original engineering command variants | [Development OPERATIONS.md](../6-Development/AI/agents/jagports/jagports-lead-agent/OPERATIONS.md) |
| MyNodeBTC Raspberry Pi installation, host-specific user-bus recovery, 9h45min timer and verification | [Deployment installation](../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md) |

Commands and installation material are **not copied into this project record**. Original source history remains available through Git and linked work records.

## Prototype investment and observed results

The original workspace is `~/jagports-lead-agent`, operated as the unprivileged `codex` user on an existing MyNodeBTC Raspberry Pi with Python 3.11. The recorded prototype contains:

- GitHub issue collection and persisted lifecycle comparison (`new`, `closed`, `reopened`).
- `Event`, `LeadAgent`, `AgentRegistry` and normalized `AgentResult` boundaries.
- Deterministic Documentation, Deployment and Knowledge specialists.
- Report generation and partial Telegram notification integration.
- A direct OpenAI model-call wrapper that the current modular `main.py` does **not** invoke.

Original prototype checks on 12 September 2026 demonstrated close/reopen detection and different rule outputs from the three specialists. The initial PyGithub `issue.pull_request` / `raw_data` accesses caused unexpected object-completion requests; temporarily avoiding that classification made collection progress but can mix Issues and PRs in reported counts. A report in the original record contained 595 collected records, not necessarily 595 Issues.

The operator later supplied three distinct September 2026 results:

| Evidence | Observed result | Limit |
|---|---|---|
| Standalone OpenAI Responses API call | `JAGPORTS API TEST OK` | Does not prove SDK/coordinator integration |
| Manual `main.py` after approximately one week | Large, plausible new/closed lifecycle delta; no visible exception | Not proof of unattended scheduling |
| Immediate subsequent `main.py` run | `{'new': [], 'closed': [], 'reopened': []}` | Supports state reuse in those runs, not full regression coverage |
| systemd service test | `Result=success`, `ExecMainStatus=0` | Manual service success is not a timer-triggered execution |
| 9h45min timer status | Enabled, active, next elapse 23 September 2026 at 12:03:20 EEST | Subsequent unattended execution not verified in provided evidence |

A week between polls can account for a large apparent new/closed delta. Snapshot comparison cannot detect a record closing and reopening *between* polls, and saved `updated_at` alone does not imply title/comment-change detection.

## Incremental project direction

1. Keep the inexpensive deterministic collector, state/event/result contracts and existing reporting.
2. Verify the installed 9h45min timer through an **actual unattended** service invocation, including journal and output evidence.
3. Compact the event payload; avoid dumping full repository snapshots into reports or model prompts.
4. Introduce lazy Issue details and one bounded, model-neutral reasoning service using the OpenAI Agents SDK.
5. Prove semantic classification by one specialist and measurable API usage before expanding to others.
6. Progress to advisory planning, review, controlled execution, robust replay/retry and a human-governed reasoning team only as separate approved increments.

The user-verified standalone API request makes small-scale integration testing feasible; it does not itself authorize recurring API spend or production-grade unattended autonomous development.

## Constraints and remaining validation

- GitHub remains the durable system of record. Product Owner decisions, independent review and repository change gates remain authoritative.
- Do not grant the `codex` Linux user passwordless sudo or Docker access simply to simplify installation.
- A `pending_notification.txt` file is not a proven delivery queue. Bounded Telegram messages, one send per change, retries and failure observability need explicit tests.
- Complete Issue/PR classification and pagination, baseline migration, specialist failure isolation, API failures, compact context and token/cost measurements remain separate validation tasks.
- The original working archive predates later context fixes; do not assume it backs up the latest runtime.
- Timer configuration, successful manual service execution, successful direct API access and integrated autonomous reasoning are separate acceptance states.

Current status and priority belong to the linked GitHub work records rather than being duplicated here.
