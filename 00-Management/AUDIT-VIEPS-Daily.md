# Jagports VIEPS App Daily Audit

## Purpose

Daily audit of the Issues and PRs that directly concern VIEPS App creation and operation.

This file defines the VIEPS scope. The canonical audit processing method and required output are defined in `00-Management/AUDIT-Common-Daily.md` and MUST be applied without creating a second or modified priority logic or output format.

## Execution precondition

- The audit procedure MUST be read from the exact branch specified by the caller.
- If this file cannot be read from that exact branch, output `BLOCKED` and stop.
- Successful reading of this file MUST NOT be reported.
- If this file is successfully read, apply the complete common procedure and return only its required audit output.

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
- VIEPS-specific dependencies and VIEPS-specific research/specification decisions;
- automated tests and required human verification;
- VIEPS implementation readiness and documentation.

**Dependency boundary:** AI OS is an upstream enabling system for VIEPS. AI OS development may help, slow, constrain, or otherwise affect VIEPS development and may therefore be considered as dependency/context when assessing VIEPS progress. However, AI OS Issues/PRs are not VIEPS audit work and must not be reported as VIEPS progress merely because VIEPS depends on them. Report the resulting VIEPS impact, dependency, or required VIEPS action rather than duplicating the upstream AI OS work.

Use the repository's inherited operating context and communication protocol.
