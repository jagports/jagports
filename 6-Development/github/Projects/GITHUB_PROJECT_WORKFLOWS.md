# GitHub Project Workflows — Jagports AI OS

## Authority and scope

This file is the scoped canonical source for GitHub Project / Kanban workflow behavior.

It is incorporated by reference from `00-Management/WORKFLOWS.md`.

It defines Project Item representation, Project mutation and verification meaning, Issue Project Item initialization, Pull Request Project Item lifecycle, Workstream inheritance behavior, and Project-specific lifecycle invariants.

It does not redefine the general Management lifecycle, repository change gate, review/testing/merge gate, record-integrity rules, or human authority. Those remain defined in `00-Management/WORKFLOWS.md`.

Current ChatGPT/GitHub Project capability limits are defined in `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md`.

GitHub connection capability knowledge is maintained in `6-Development/github/GITHUB_CONNECTIONS_KNOWLEDGE.md`.

**Core rule:** Project-specific workflow behavior is defined here exactly once. Secondary files must reference this file rather than duplicate Project/Kanban workflow rules.

Current ChatGPT/GitHub execution limitation: the Project workflow meanings below describe required behavior for capable external actors/tools. The current ChatGPT/GitHub connection must follow `6-Development/github/Projects/PROJECT_CAPABILITY_BOUNDARY.md` and must not duplicate or restate that capability-boundary rule here.

---

## 1. GitHub Project / Kanban State Control

The GitHub Project is the visual/system-of-record representation of workflow state.

An Issue or Pull Request may be represented by a **Project Item**. The workflow state is stored in that Project Item's **Status** field. The Project itself does not have the task's lifecycle Status.

Issue and Pull Request Project Items represent related but different objects:

- the **Issue Project Item** remains the primary business/work record and represents the lifecycle of the owned work;
- the **Pull Request Project Item** represents the execution/review state of a concrete integration artifact for that work.

A Pull Request Project Item must retain traceability to its owning/closing Issue or Issues. It is also an independently prioritized work record for review/integration. Issue and PR prioritization fields are separate and must not overwrite one another.

### State meaning

The normal Management lifecycle states defined by `00-Management/WORKFLOWS.md` have the following meaning when represented as GitHub Project Item Status values:

| State | Meaning |
|---|---|
| `BACKLOG` | Valid active work exists but substantive work has not started. |
| `RESEARCH` | Facts, existing work, dependencies, or implementation options are being investigated. |
| `PROPOSED` | A concrete solution or implementation approach has been prepared. |
| `DECISION NEEDED` | Human/authorized decision-maker judgment is required before proceeding. |
| `APPROVED` | Required decision/approval has been obtained and implementation may proceed. |
| `IMPLEMENTATION` | The approved work is actively being produced as repository artifacts, including code, configuration, documentation, data, migrations, tests, workflows, or other committed deliverables. |
| `REVIEW` | Implementation is complete enough for required review; implementation stops at this boundary. |
| `TESTING` | Required validation is being executed. |
| `DONE` | The represented work item or integration artifact has reached a verified terminal lifecycle state and no further work is expected on that item. For successful implementation, required review/testing/merge/closure obligations still apply; PR-specific terminal closure without merge is governed by this file and does not imply successful integration. |
| `BLOCKED` | A prerequisite or capability prevents the next required transition. |

A state is not established merely by an Issue comment. When the work is represented in GitHub Project, the Project Item and its **Project Item Status** are the authoritative Kanban representation and must be verified according to this file by a capable actor/tool.

For the current ChatGPT/GitHub connection, Project Item Status cannot be read or verified. Use the current capability-boundary reporting sentence instead of claiming Project state.

### Project operation rule

A Project operation has two distinct phases:

**MUTATE → VERIFY**

A mutation response is not, by itself, proof that the desired Project state exists.

After adding an Issue or Pull Request, changing Status, or performing another relevant Project mutation:

1. Identify the intended Project.
2. Identify the resulting Project Item.
3. Read the resulting Project state independently.
4. Verify the exact expected content identity, Project identity, archive state, field, and value.
5. Only then claim the operation succeeded.

If mutation fails, the Project Item cannot be found, the expected field/value cannot be verified, or the result is ambiguous:

- report failure;
- identify whether the failure occurred during mutation or verification when possible;
- state that **Project operation FAILED**;
- state that **no successful Project operation is claimed**;
- never convert an intended state into a claimed actual state.

This rule applies to automated and manual Project operations by capable actors/tools. It is not executable through the current ChatGPT/GitHub connection.

### Issue creation

For a new Issue belonging to the Project:

1. Add it to the Project.
2. Set `Project Item Status` to `BACKLOG`.
3. Independently verify Project Item existence and `BACKLOG`.
4. Record the verified result in the persistent task record.

If Project setup cannot be performed or verified, record the limitation and do not claim successful Project setup.

When substantive work begins, transition from `BACKLOG` to `RESEARCH` unless another state is explicitly appropriate, and verify the Project Item Status.

When a closed Issue is **reopened**, set its Project Item Status to `RESEARCH` and independently verify the result. Reopening means the previous terminal assumption has been invalidated and the work requires renewed investigation; it must not be reset to `BACKLOG`, because substantive work has already occurred. More specific states such as `DECISION NEEDED`, `BLOCKED`, or `IMPLEMENTATION` may follow once the renewed investigation establishes the next lifecycle condition.

### Prioritization fields by Project Item type

Both Issue and Pull Request Project Items expose the same authoritative prioritization concepts:

- **Priority**
- **Band**
- **Rank**
- **Workstream**
- **Status**

Their physical GitHub storage is:

**Issue Project Item**

- native Issue `Priority`;
- Project `Band` (`P0`...`P5`);
- Project `Rank`;
- Project `Workstream`;
- Project `Status`.

**Pull Request Project Item**

- Project `PR Priority` (`Urgent`, `High`, `Medium`, `Low`) — storage for the PR's authoritative Priority concept;
- Project `Band` (`P0`...`P5`);
- Project `PR Rank`;
- Project `Workstream`;
- Project `Status`.

The `PR ` prefix is an implementation/storage distinction required to avoid collision with native Issue Priority/Issue queue fields; it does not define a different semantic model. GitHub native Issue fields are unavailable on Pull Requests.

`Band` is one shared Project field used for both Issue and PR Project Items so Kanban can show the P0...P5 classification directly. Issue Rank and PR Rank are separate per-Workstream queues. An owning Issue may seed a PR's initial Priority/Workstream only when the evidence is unambiguous. The PR remains independently reprioritizable afterwards.


### Pull Request Project Item lifecycle

A Pull Request that belongs to Jagports work may be represented by its own Project Item so that the Kanban shows the concrete integration artifact as well as the owning Issue. The Pull Request Project Item uses the controlled workflow meanings defined in `00-Management/WORKFLOWS.md`; Pull Request events do not create a parallel lifecycle.

**Product Owner ruling — no Pull Request Project Item archiving:** No Pull Request Project Item shall ever be archived until further notice. This rule applies to open, merged, and closed-unmerged Pull Requests and supersedes every earlier workflow, implementation, test expectation, or audit rule that required or permitted archiving a Pull Request Project Item. A later change requires a new explicit Product Owner ruling.

Consequences of this ruling:

- every existing or newly created Pull Request Project Item must remain `isArchived = false`;
- a historical archived Pull Request Project Item is lifecycle drift and must be unarchived when an authorized correction is performed;
- automation must never use `archiveProjectV2Item` for Pull Request Project Items;
- audit/verification logic must treat any archived Pull Request Project Item as incorrect state.

The Pull Request Project Item follows these deterministic rules:

1. **Opened** → add the Pull Request itself to the Project and set its Project Item Status to `IMPLEMENTATION`, whether draft or non-draft. If Workstream is deterministically inherited/classified, set and verify it. Otherwise keep Workstream unassigned without guessing and create a durable human-facing notification containing the direct Pull Request URL plus the filtered all-items Project View 1 URL for that PR number so a human can immediately set `AI OS` or `VIEPS`; later prioritization may then rank it. The canonical Project view numbers and URLs are maintained in `6-Development/github/Projects/Setting_up_Kanban.md`.
2. **Converted to draft** → set the Pull Request Project Item Status to `IMPLEMENTATION`. Draft state is evidence that the integration artifact is not currently at the independent-review boundary; it does not move repository work backwards to `RESEARCH`.
3. **Marked ready for review / opened non-draft** → being non-draft is a prerequisite for review but does not by itself establish `REVIEW`. Keep `IMPLEMENTATION` until the canonical review hand-off in `00-Management/WORKFLOWS.md` has been completed and verified.
4. **Independent review requested** → after the PR is open, non-draft, the authorized independent reviewer has been selected, and the native GitHub review request has been made, set the Pull Request Project Item Status to `REVIEW`, verify it, and stop implementation at the canonical review boundary.
5. **Review request removed or Pull Request returned to active implementation** → return the Pull Request Project Item Status to `IMPLEMENTATION` when the canonical review hand-off no longer applies and implementation work resumes.
6. **Reopened** → inspect the current PR and review-handoff state. Use `IMPLEMENTATION` unless the canonical independent review hand-off has been re-established and verified; only then use `REVIEW`. If a historical PR Project Item is archived, unarchive and independently verify it before applying the active lifecycle state.
7. **Merged** → after the required review/testing/merge gates have passed, set the Pull Request Project Item Status to `DONE`, independently verify `DONE`, and independently verify `isArchived = false`. The item remains visible/unarchived.
8. **Closed without merge** → closing the Pull Request is a terminal lifecycle event for that Pull Request Project Item. Set the Pull Request Project Item Status to `DONE`, independently verify `DONE`, and independently verify `isArchived = false`. `DONE` here means no further work is expected on this Pull Request; it does **not** mean the proposed implementation was merged or successfully integrated. GitHub's native Pull Request state and the durable closure/supersession record preserve whether the terminal outcome was obsolete, superseded, abandoned, rejected, or otherwise closed without merge. The owning Issue determines whether the underlying work remains active, is replaced by another Pull Request, becomes blocked, or is otherwise resolved.

For Pull Request Project Items, `DONE` is therefore a terminal-lifecycle state, not a synonym for successful merge. Successful integration is established by the Pull Request's native merged state together with the required review/testing/merge gates; terminal closure without merge remains distinguishable in GitHub history.

Every Pull Request Project Item add, unarchive, or Status change follows the same **MUTATE → VERIFY** rule. Automation must verify that the resulting Project Item contains the intended Pull Request, belongs to the intended Project, remains unarchived, and has the exact expected Status before success is claimed. An archive mutation is prohibited for Pull Request Project Items under the current ruling.

The Pull Request Project Item lifecycle does not replace the owning Issue lifecycle. In particular, a qualifying closing-linked Pull Request may synchronize the owning Issue to `IMPLEMENTATION`, while the Pull Request's own Project Item also remains `IMPLEMENTATION` until the review hand-off defined in `00-Management/WORKFLOWS.md`. At the verified review boundary, the applicable Project Item or Items transition to `REVIEW`; the two items continue to represent different objects.

### IMPLEMENTATION transition from a closing-linked Pull Request

An **open Pull Request that explicitly has a GitHub closing relationship to an Issue** is the normal deterministic repository signal that implementation for that Issue has begun. Closing relationships created by GitHub closing keywords such as `Closes`, `Fixes`, or `Resolves` qualify; a branch, commit, ordinary Issue mention, or related PR without a closing relationship does not qualify by itself.

When this signal is observed, the Issue's Project Item Status may be synchronized to `IMPLEMENTATION` and then independently verified. This signal describes actual implementation activity and is broader than source-code work; the PR may contain code, documentation, configuration, data, tests, workflows, migrations, or other repository deliverables.

The automatic transition must not overwrite `DECISION NEEDED`, `BLOCKED`, `REVIEW`, `TESTING`, or `DONE`. A closing-linked PR does not itself prove that a required decision, approval, review, testing, or acceptance gate has passed. If implementation exists before a required approval or decision, preserve the applicable gate/blocking evidence rather than using automation to legitimize or hide the process defect.

---

## 2. Conflict handling

If this file conflicts with `00-Management/WORKFLOWS.md` on a general workflow boundary, `00-Management/WORKFLOWS.md` controls. Within the Project/Kanban scope delegated here, this file is the normative source and secondary documents must reference rather than redefine it.
