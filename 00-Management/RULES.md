# RULES — Jagports AI OS

## Architecture — Human Governance View

```text
                         WORK REQUEST
                              |
                              v
                  +-----------------------+
                  | Issue / PR given?     |
                  +-----------------------+
                       /             \
                     YES              NO
                      |                |
                      v                v
               Use the named     Search OPEN Issues
                  item                |
                                      v
                           +----------------------+
                           | Clear existing match?|
                           +----------------------+
                              /              \
                            YES               NO
                             |                 |
                             v                 v
                       Reuse Issue      Related Issue,
                                      but scope uncertain?
                                         /        \
                                       YES         NO
                                        |           |
                                        v           v
                                  Ask requester  Create Issue
                                        |           |
                                        +-----+-----+
                                              |
                                              v
                                  Search OPEN PRs
                                              |
                                              v
                                  +---------------------+
                                  | Clear matching PR?  |
                                  +---------------------+
                                    /             \
                                  YES              NO
                                   |                |
                                   v                v
                              Reuse PR       Related / duplicate
                                             scope uncertain?
                                               /        \
                                             YES         NO
                                              |           |
                                              v           v
                                        Ask requester  Create PR
                                              |           |
                                              +-----+-----+
                                                    |
                                                    v
                                           Implementation
                                             Round 1
                                                    |
                                                    v
                                           Review required?
                                                    |
                                                    v
                                  STOP — provide PR/review link
```

**Human interpretation:** reuse existing work whenever it legitimately covers the request; create new work only when necessary; ask the requester only when scope, duplication, ownership, or authority is genuinely uncertain.

## Purpose

This file defines high-level governance rules for Jagports AI OS. It applies to work performed through ChatGPT, Claude, Codex, other compatible AI agents, or human operators.

`SKILL.md` contains the detailed operational procedures. `RULES.md` defines the governing principles those procedures must follow.

## Work Request Ownership

A work request may originate from a human or from another AI agent. The workflow must not assume that the requester is human.

After the relevant Issue and PR have been identified or created, the **executing actor** may proceed automatically when no clarification is required. The executing actor may be ChatGPT, Claude, Codex, another compatible AI agent, or an authorized human operator.

The identity of the requester and the identity of the executing actor are separate concepts. A human may request work that another agent executes, and an agent may request work that another agent executes.

## Issue and PR Discovery

When a work request does not explicitly identify an Issue or PR:

1. Treat it as potentially novel.
2. Search open Issues for an existing item that clearly covers the requested work.
3. Reuse an existing Issue when it clearly covers the work.
4. Reuse a related Issue when the requested work is a legitimate amendment, extension, refinement, follow-up, or completion of that Issue.
5. If an existing Issue might be the same work but it is uncertain whether the work is a duplicate, amendment, or materially separate task, obtain clarification from the requester before proceeding.
6. If no suitable open Issue exists, create a new Issue.
7. Before creating a PR, search open PRs for an existing implementation.
8. Reuse an existing PR when it clearly covers the requested implementation or can legitimately be extended without creating ambiguous scope.
9. If PR duplication, scope, or ownership is uncertain, obtain clarification from the requester before proceeding.
10. One PR may implement multiple Issues when it genuinely addresses all of them; maintain explicit traceability to every Issue.

A new Issue or PR is not required merely because existing work is related. The decision is based on whether the existing work can legitimately contain the requested change while preserving clear scope and traceability.

## Clarification

"Ask the human" is not the default rule. Clarification should be requested from the **requester** or the appropriate decision-making actor.

A human decision is required only when the unresolved question specifically requires human authority, preference, approval, or judgment.

## Execution Boundary

Once Issue/PR identity and scope are resolved, the executing actor proceeds through Implementation Round 1 without unnecessary additional confirmation.

When review is required:

- stop implementation;
- do not merge;
- provide the PR/review link; and
- hand the work to the review stage.

## Historical Immutability

Closed Issues and merged PRs are historical records. Their descriptions and comments must not be modified.

They may be inspected for historical context and traceability, but they must not be reused as active work items.

## Traceability

The intended chain is:

`Work request → Issue → PR → Review → Merge → verification`

A PR may connect to multiple Issues when appropriate. Every Issue addressed by that PR must remain explicitly traceable.

## Authority Order

When rules overlap:

1. Repository governance in this `RULES.md`.
2. Detailed operational procedures in `SKILL.md`.
3. Project facts and historical decisions in `KNOWLEDGE.md`.

Operational procedures must not contradict these governing rules.
