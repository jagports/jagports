# VIEPS Deployment Setup Documentation Record Format

## Purpose

Define the reusable format for recording actual VIEPS deployment operations without storing credentials or duplicating GitHub task traceability.

## One operation record

```text
Date/time:
Operator:
Environment: development | preview | production
Task:
Operation:
Interface: CLI | API | UI
Command / UI path:
Input source/configuration:
Result:
Verification command / test:
Verification result:
Status: RESEARCHED | EXECUTED | VERIFIED | BLOCKED | FAILED
Deviation / decision:
```

## Rules

- Record the exact command used where a CLI command exists.
- Record the exact dashboard navigation path where UI is required.
- Record the URL to the relevant current official documentation for UI operations when useful.
- Record verification separately from execution.
- Record blockers explicitly rather than converting them into assumptions.
- Never record passwords, password hashes, recovery codes, API tokens, secret values, or session credentials.
- Do not store GitHub Issue/PR traceability as a permanent duplicate list. GitHub is the authoritative task traceability system.

## Status meaning

```text
RESEARCHED = procedure/documentation checked
EXECUTED   = operation actually performed
VERIFIED   = result independently checked
BLOCKED    = prerequisite prevents execution
FAILED     = operation executed but did not produce the expected result
```

`EXECUTED` does not imply `VERIFIED`.

## Example

```text
Date/time: 2026-09-08 12:00 EEST
Operator: <operator>
Environment: preview
Task: Worker preview deployment
Operation: Upload preview Worker version
Interface: CLI
Command / UI path: npx wrangler versions upload
Input source/configuration: reviewed feature branch
Result: preview version created
Verification command / test: HTTP request to supplied preview URL
Verification result: application loaded; public read test passed
Status: VERIFIED
Deviation / decision: none
```

The example contains no secret material and is illustrative only; actual execution evidence belongs in the relevant task record.