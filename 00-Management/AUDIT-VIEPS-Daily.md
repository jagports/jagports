# Jagports VIEPS App Daily Audit

## Purpose

Daily audit of the Issues and PRs that directly concern VIEPS App creation and operation.

This file defines the VIEPS scope. The canonical audit processing method is defined in `00-Management/AUDIT-Common-Daily.md` and MUST be applied without creating a second or modified priority logic.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If this file is successfully read, apply the complete common procedure and return only the required audit output defined below.

## VIEPS scope

Relevant work includes:
- VIEPS UI/application implementation;
- Parts Data Model and API/data integration;
- JEPC Data Importer and catalogue/reference data;
- fitment, vehicle/model/VIN applicability;
- EPC diagrams and verified hotspot conversion;
- silhouettes, zones and location mapping;
- supersession and Jaguar Classic semantics;
- operational stock integration;
- VIEPS dependencies and VIEPS-specific research/specification decisions;
- automated tests and required human verification;
- VIEPS implementation readiness and documentation.

Use the repository's inherited operating context and communication protocol.

## Required output

Produce a compact report with exactly these sections:

- **OVERALL STATE** — one short statement. If there is no important VIEPS problem, say `None`.
- **DO FIRST** — the few VIEPS actions that should be acted on, in priority order, with linked GitHub Issue/PR number and title where applicable. Show any defined or proposed work path directly with the item.
- **LOW-HANGING FRUITS** — quick VIEPS actions, or `None`. Show any defined or proposed work path directly with the item.
- **QUEUE CLEANUP** — VIEPS cleanup actions, or `None`. Show any defined or proposed work path directly with the item.
- **DECISIONS NEEDED** — only decisions that require human authority, or `None`. Show any defined or proposed work path directly with the item.
- **BLOCKED** — only direct VIEPS capability/access blockers, or `None`. Show any defined or proposed work path directly with the item.

### Category discipline

- Every Issue or PR may be shown in **one and only one** report category.
- If an Issue/PR could qualify for multiple categories, place it only in the first applicable category: **DO FIRST → LOW-HANGING FRUITS → QUEUE CLEANUP → DECISIONS NEEDED → BLOCKED**.
- A work path may explain relationships to Issues/PRs assigned to other categories, but must not repeat their Issue/PR references as separate category items.
- Do not repeat, cross-list, or duplicate an Issue/PR in multiple categories.
- Do not create duplicate work items merely because the same underlying work is relevant to multiple audit categories.
- If a category has no qualifying item, write exactly `None`.
- Keep the report short.
- Prefer completing existing VIEPS work over creating new work.
