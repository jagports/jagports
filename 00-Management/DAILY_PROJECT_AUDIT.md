# Jagports Daily Audit — Task Instructions

## Purpose

This file is the operational source for the recurring `Jagports Daily Audit` ChatGPT task. The scheduled task must read this file from the current `jagports/jagports` repository at the start of every run and execute the instructions in it.

The file is the durable source of the repeating task procedure. Changes to the repeating task procedure must be made here through the normal Issue → branch → PR → review → merge workflow.

## Audit execution

Act as the Jagports Team Lead Agent and perform an independent daily project, Issues and PRs audit of the GitHub repository `jagports/jagports` and its GitHub Project(s), Issues and PRs, using them as the system of record.

Read:

- `00-Management/RULES.md`
- `SKILL.md`
- `KNOWLEDGE.md`
- all relevant management/knowledge Markdown files
- all relevant agent-communication/protocol Markdown files such as `COMMUNICATION_PROTOCOL.md` wherever present
- `Jagports_AI_OS_Prioritized_Work_Plan.md` when accessible
- this file

Treat repository Markdown documents as operational source-of-truth instructions, not merely background.

Check Issues and PRs for:

- priority/work-plan consistency;
- missing or incorrect descriptions;
- parent/sub-issue relationships;
- labels and workflow status;
- linked PRs and review state;
- stale or blocked work;
- communication/documentation gaps;
- violations of documented management, development or communication process.

Do not use the obsolete `tlindi/jagports` repository.

Default to read-only audit. Do not modify Issue or PR text, repository content, labels, Project fields or relationships unless an explicit project rule authorizes a non-content state operation.

Report only actionable exceptions. Classify findings as `AUTO`, `REVIEW`, `DECISION`, or `BLOCKED`. For each finding include issue/PR number, title, problem, evidence, applicable source-of-truth document and recommended next action.

Pay particular attention to whether agent communications and decisions are recorded in GitHub rather than being left only in ChatGPT.

If no problems are found, state that the audit passed.

Never claim a check succeeded when required repository access or verification failed.

## OpenAI Codex GitHub connector blocker tracking

Track upstream OpenAI Codex issue `openai/codex#43297` as an external blocker for GitHub Projects V2 verification.

Every run:

1. Check the current state of `openai/codex#43297`:
   - open/closed state;
   - latest comments;
   - linked PRs or referenced fixes;
   - indications that the GitHub connector now supports the required GitHub Projects V2 endpoints.

2. Do not treat `#43297` as resolved merely because it is closed. Resolution requires an actual functional test from this environment:
   - read Jagports Project `Jagports AI OS`;
   - read Project items;
   - read Project Item Status;
   - confirm the required Project fields/relationships can be inspected.

3. If the upstream issue changes but the functional test still fails:
   - keep the blocker active;
   - record the current failure;
   - do not claim Project access is restored.

4. If the functional test succeeds:
   - record the successful test and tested capabilities;
   - identify all Jagports work previously blocked by `#43297`;
   - update records/comments/status only as permitted by `00-Management/RULES.md` and `00-Management/WORKFLOWS.md`;
   - specifically re-evaluate `#371`, `#383` and `#363`;
   - resume the previously blocked Project Item Status verification workflow.

5. Do not modify closed Issues or merged PRs. For historical records, add a comment only where repository rules permit it.

6. Until the functional test succeeds, do not report the Daily Project Audit as successfully Project-verified and do not remove the external-blocker documentation.

7. Report exactly one blocker state when applicable:
   - `BLOCKED — #43297 still prevents Project V2 verification`
   - `BLOCKED — upstream issue changed, functional test still fails`
   - `RESOLVED — #43297 fixed and Project V2 access independently tested`
   - `REGRESSION — previously working Project V2 access has failed again`

`#43297` closure alone is never the completion criterion. Successful end-to-end Project V2 testing is required.

## Project-audit completion rule

Do not treat `Project Audits` as a normal scheduled-task issue until `#43297` is resolved and Project V2 access has been independently tested and verified by us.

## Output

Return a concise daily audit report containing:

- overall audit state;
- actionable exceptions only;
- blocker state when applicable;
- exact Issue/PR references;
- evidence and source-of-truth references;
- next actions.

Do not claim successful Project verification when the connector cannot independently read and verify the required Project data.
