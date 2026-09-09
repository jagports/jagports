# Jagports AI OS Daily Audit

## Purpose

Daily audit of the Issues and PRs that matter for Jagports AI OS progress.

This file defines the AI OS scope. The canonical audit processing method is defined in `00-Management/AUDIT-Common-Daily.md` and MUST be applied without creating a second or modified priority logic.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If this file is successfully read, apply the complete common procedure and return only its required audit output.

## Scope

This procedure covers Jagports AI OS work, including its Management, implementation, documentation, research, tooling and enabling work where that work materially affects AI OS progress.

Use the repository's inherited operating context and communication protocol.

## Project V2 verification

Track the external Project V2 verification dependency in `openai/codex` when applicable. Require an actual functional test before claiming that the `Jagports AI OS` Project, its items, Status and required fields/relationships have been verified. Record tested capabilities and resulting state with evidence.

Project Item capability limitations are not blockers by themselves. Do not require Project V2 operations that the current agent connection cannot perform or independently verify.
