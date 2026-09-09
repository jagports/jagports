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

This procedure covers Jagports AI OS work, including its Management, implementation, documentation, research, tooling and enabling work where that work materially affects AI OS progress.
