# Jagports AI OS Daily Audit

## Purpose

Daily audit of the Issues and PRs that matter for Jagports AI OS progress.

This file defines the AI OS-specific scope. The canonical audit processing method is defined in `00-Management/AUDIT-Common-Daily.md` and MUST be applied without creating a second or modified priority logic.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If this file is successfully read, apply the complete common procedure and return only its required audit output.

## Scope

Use the repository's inherited operating context and communication protocol. This procedure defines the AI OS-specific audit scope.

Relevant work includes:
- Jagports AI OS Management and governance;
- AI OS implementation, architecture and infrastructure;
- AI OS documentation and durable knowledge;
- AI OS research, tooling and agent capabilities;
- capabilities and enabling work that is part of AI OS or is specifically required to enable AI OS operation or development.

**Dependency boundary:** AI OS enables downstream applications such as VIEPS. Downstream application work is not AI OS audit work merely because it depends on AI OS. The AI OS audit may consider downstream work only as evidence of an AI OS dependency, capability gap, or enabling requirement when that relationship is directly relevant to AI OS progress. Report the AI OS work or AI OS consequence, not the downstream application work itself.
