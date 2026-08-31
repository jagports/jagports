# Issue #78 — GitHub CLI category-label configuration

## Purpose

Create the GitHub labels used as machine-readable category metadata for the `SKILL /`, `AGENT /`, and `KNOWLEDGE /` subject-prefix convention.

Categories are metadata only. They must not become GitHub Project/Kanban Status, Priority, ordering, or workflow states.

## GitHub CLI commands

Run from any environment with GitHub CLI authenticated and repository access:

    gh label create "category:skill" --repo jagports/jagports --color "5319E7" --description "Skills, operating instructions, or automation rules"
    gh label create "category:agent" --repo jagports/jagports --color "1D76DB" --description "Agent behavior, roles, discovery, or hand-off"
    gh label create "category:knowledge" --repo jagports/jagports --color "0E8A16" --description "Project knowledge, documentation, research, decisions, or requirements"

If `category:skill` already exists, the command may report that it already exists. Do not delete/recreate it merely for that reason. To align its color/description with this specification, use `--force`:

    gh label create "category:skill" --repo jagports/jagports --color "5319E7" --description "Skills, operating instructions, or automation rules" --force

## Verification commands

    gh label list --repo jagports/jagports --search "category:"

Expected category labels:

    category:skill
    category:agent
    category:knowledge

Verify the labels on the implementation Issue and PR:

    gh issue view 78 --repo jagports/jagports --json number,title,labels
    gh pr view 94 --repo jagports/jagports --json number,title,labels

## Human verification

A human reviewer must confirm in PR #94 that all three labels exist, correspond to the documented prefixes, and remain independent of the Kanban workflow before the PR is approved/merged.

## Repository Change Gate

This file is part of the Issue #78 implementation branch and must reach `main` only through the normal PR review and merge process.
