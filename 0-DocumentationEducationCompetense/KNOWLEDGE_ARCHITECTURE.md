# Jagports Knowledge Architecture

## Purpose

This document defines the repository architecture used to store durable knowledge and to distinguish it from work records, research evidence, implementation material, and operating rules.

## Canonical semantic root map

The repository's first-level semantic map is:

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

These are semantic domains, not a statement that every domain must contain the same kinds or number of files.

The root `KNOWLEDGE.md` is the cross-domain knowledge layer. A nested `KNOWLEDGE.md` is a domain/subdomain knowledge layer and is authoritative only for durable knowledge within that scope.

## Knowledge locations

Established durable-knowledge files include:

- `KNOWLEDGE.md` — repository-wide and cross-domain durable knowledge.
- `0-DocumentationEducationCompetense/KNOWLEDGE.md` — documentation/competence-area knowledge.
- `6-Development/KNOWLEDGE.md` — development-specific durable knowledge.
- `5-Implementation-Projects/internet/cloudflare/jagports/vieps/KNOWLEDGE.md` — VIEPS-specific durable domain knowledge.

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

Knowledge files contain generalized conclusions, not chronological history. Do not record Issue numbers, PR numbers, branch names, temporary identifiers, one-off test cases, temporary filenames, or implementation-session details unless they are required to establish a reusable rule or provenance.

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
5. Consult research, implementation, or other Markdown only when the task specifically requires evidence, procedure, design, or other non-memory information.

This prevents general knowledge discovery from becoming an uncontrolled scan of every Markdown file in the repository.

## Architecture validation rule

The semantic root map above is the canonical repository map for knowledge discovery. No other Markdown document should define a competing first-level semantic folder list.

When changing the root structure, validate all repository Markdown that defines repository organization or knowledge discovery and update every authoritative reference in the same implementation. Do not accept a structure change when an obsolete or conflicting root-folder map remains in an authoritative instruction file.

Validation should check at minimum:

- the actual repository root tree;
- `AGENTS.md`;
- root `KNOWLEDGE.md`;
- `SKILL.md`;
- `00-Management/RULES.md`;
- `00-Management/WORKFLOWS.md`;
- this architecture document; and
- any other Markdown document that explicitly defines repository organization or knowledge discovery.

The validation result must distinguish between a semantic folder map and descriptions of deeper application, production, deployment, or implementation hierarchies. A deeper hierarchy is not a competing first-level map merely because it contains folder names.

## Enforcement objective

The architecture is maintained through the invariant:

**one semantic map → one knowledge hierarchy → one clear scope per knowledge file → no accidental duplication between knowledge, research, workflow, and task history.**

Structural changes to knowledge locations must be performed through the normal Issue → branch → PR → review → testing → merge process and must preserve traceability in the project work records.
