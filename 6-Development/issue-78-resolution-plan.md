# Issue #78 Resolution Plan

This planning record defines the implementation approach for making change-category subject prefixes a permanent Jagports AI OS practice.

The implementation is authoritative in `SKILL.md`. This file records the plan only and is not a Kanban category or workflow definition.

## Categories

- `SKILL /` — Skills, operating instructions, automation and process rules.
- `AGENT /` — agent behavior, roles, discovery, hand-off and agent-facing instructions.
- `KNOWLEDGE /` — project/product knowledge, documentation, research, decisions and requirements.

## GitHub metadata

Use corresponding GitHub labels as machine-readable metadata:

- `category:skill`
- `category:agent`
- `category:knowledge`

The label is classification metadata; it is not a Kanban workflow state.

## Traceability

The same primary category is reflected in the Issue and associated Pull Request titles. Branch naming should retain the category where practical. The Issue → Branch → PR → Merge relationship remains the primary traceability chain.

## Kanban boundary

Category is deliberately orthogonal to the GitHub Project/Kanban. Category must not create or alter Status, Priority, or workflow states. `SKILL`, `AGENT`, and `KNOWLEDGE` work items use the same Kanban workflow.

## Automation

GitHub automation should validate consistency between the title prefix and category label. The automation should flag or fail records that lack the required prefix or have a mismatched category label.

## Primary category rule

When work spans multiple categories, use the prefix and label for the primary change. Describe secondary impacts in the record body instead of assigning multiple primary categories.

## Resolution

Update `SKILL.md` with the permanent rule, then validate the resulting Issue/PR naming, category metadata, and unchanged Kanban workflow model before merge.
