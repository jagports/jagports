# Jagports Knowledge Architecture

## Purpose

This document defines the practical repository architecture used to store durable knowledge and to distinguish it from work records, research evidence, implementation material, and operating rules.

## Current status

The repository now has a usable hierarchical knowledge structure, but it must be treated as a maintained architecture rather than as a flat collection of Markdown files.

The semantic root map is:

```text
0-DocumentationEducationCompetense
00-Management
1-CustomerService
2-Sales
3-Deployment
4-Production
5-Implementation-Projects
6-Development
7-Research
```

The root `KNOWLEDGE.md` is the cross-domain knowledge layer. A nested `KNOWLEDGE.md` is a domain/subdomain knowledge layer and is authoritative only for durable knowledge within that scope.

## Current knowledge locations

The current repository contains these established knowledge files:

- `KNOWLEDGE.md` — repository-wide and cross-domain durable knowledge.
- `0-DocumentationEducationCompetense/KNOWLEDGE.md` — documentation/competence-area knowledge file, currently containing parts-supersession domain knowledge that should be reviewed for future relocation to a more domain-specific scope.
- `6-Development/KNOWLEDGE.md` — development-specific durable knowledge.
- `5-Implementation-Projects/base/application-platform/application/jagports/vieps/KNOWLEDGE.md` — VIEPS-specific durable domain knowledge.

The absence of a `KNOWLEDGE.md` in a semantic root is not itself an error. A knowledge file should exist where durable knowledge actually exists and where its scope can be stated clearly. Empty or not-yet-populated domains do not require artificial knowledge files.

## Semantic separation

Use the following separation:

| Information | Primary location |
|---|---|
| Repository-wide durable knowledge | Root `KNOWLEDGE.md` |
| Domain/subdomain durable knowledge | Nearest appropriate nested `KNOWLEDGE.md` |
| Management workflow authority | `00-Management/WORKFLOWS.md` |
| Human governance and rationale | `00-Management/RULES.md` |
| Agent execution instructions | `SKILL.md` and applicable `.codex/skills/*` |
| Research evidence and unresolved investigation | `7-Research` and appropriate research records |
| Active implementation work | `5-Implementation-Projects` and GitHub Issues/PRs |
| Development-specific durable engineering knowledge | `6-Development/KNOWLEDGE.md` |
| VIEPS-specific durable domain knowledge | VIEPS-scoped `KNOWLEDGE.md` |
| Chronological decisions | Decision records / GitHub work records, not general knowledge |
| Temporary troubleshooting and one-off implementation detail | Task/Issue/PR records, not durable knowledge |

## Knowledge admission test

Information belongs in a `KNOWLEDGE.md` only when it is:

1. verified or explicitly accepted;
2. reusable beyond one task;
3. relevant to the scope of that knowledge file;
4. useful for changing future implementation, investigation, or decision behaviour; and
5. traceable to evidence or an accepted decision where the claim requires provenance.

Before adding material, ask:

```text
Is it durable?
  ├─ no  → keep it in the task/research/work record
  └─ yes
      Is it reusable?
        ├─ no  → keep it in the task/research/work record
        └─ yes
            What is the narrowest correct scope?
              └─ place it in that scope's KNOWLEDGE.md
```

## Generalization rule

Knowledge files must contain generalized conclusions, not chronological history. Remove or generalize Issue numbers, PR numbers, branch names, temporary identifiers, one-off test cases, temporary filenames, and implementation-session details unless they are required to establish a reusable rule or provenance.

Research evidence remains evidence. It should not be copied wholesale into knowledge merely because it is relevant. Extract the durable conclusion and retain the evidence in its appropriate research or task record.

## Hierarchy rule

Knowledge is hierarchical:

```text
Repository
└── Root KNOWLEDGE.md
    └── Domain
        └── Domain KNOWLEDGE.md
            └── Subdomain
                └── Subdomain KNOWLEDGE.md
```

A nested knowledge file should contain knowledge that is meaningfully specific to its location. Do not duplicate root knowledge merely to make a nested file appear complete.

Conversely, do not move domain knowledge to the root merely for convenience. Promote knowledge to the root only when it is genuinely cross-domain.

## Navigation rule

An agent should discover knowledge in this order:

1. Read `SKILL.md` and the canonical Management workflow when required by the operating procedure.
2. Inspect the nine semantic root folders.
3. Identify the domains relevant to the Issue.
4. Read the relevant `KNOWLEDGE.md` files from the root toward the narrowest relevant scope.
5. Consult research, implementation, or other Markdown only when the task specifically requires evidence, procedure, design, or history.

This prevents general knowledge discovery from becoming an uncontrolled scan of every Markdown file in the repository.

## Current usability assessment

The architecture is **usable as persistent project memory**, with the following qualifications:

- The root `KNOWLEDGE.md` successfully provides repository-wide durable context and explicitly defines the nested knowledge hierarchy.
- The VIEPS knowledge file demonstrates that detailed domain knowledge can be kept at a narrow scope without polluting repository-wide memory.
- The development knowledge file provides a separate engineering scope.
- Research and implementation material are physically distinguishable from durable knowledge.
- The former parallel root `docs/` area has been removed, eliminating a competing documentation root.
- The former root `6-Architecture/` area has been removed, eliminating the duplicate `6` semantic root.
- `1-CustomerService` now exists in the semantic root map.
- The remaining main structural defect found during validation is documentation drift: `AGENTS.md` previously described eight root folders and omitted `1-CustomerService`. This is corrected by this implementation.
- `0-DocumentationEducationCompetense/KNOWLEDGE.md` is structurally valid as a nested knowledge file but its current parts-supersession content is semantically better suited to a product/domain scope. This is recorded as a follow-up normalization consideration, not as a reason to invalidate the whole architecture.
- `4-Production` is intentionally not normalized further by this change. Its established deeper production hierarchy is an implementation/domain concern and must be understood from its actual contents before structural changes are proposed.

## Enforcement objective

The architecture is not complete merely because the directories exist. Future work must preserve the invariant:

**one semantic map → one knowledge hierarchy → one clear scope per knowledge file → no accidental duplication between knowledge, research, workflow, and task history.**

Structural changes to knowledge locations must be performed through the normal Issue → branch → PR → review → testing → merge process and must preserve traceability.
