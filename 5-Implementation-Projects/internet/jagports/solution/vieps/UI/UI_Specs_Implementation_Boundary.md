# VIEPS UI — implementation tracking and baseline boundary

**Status:** Specification ready for implementation review  
**Controlling issue:** #468  
**Priority issue:** #484  
**Implementation parent:** #368

## Objective
Define the ownership and traceability boundary for completing the Concept View-1 priority sequence without reviving obsolete requirements.

## Ownership
- #468 is the controlling Concept View-1 specification while its acceptance criteria are completed.
- #368 is the implementation parent for the actual VIEPS UI.
- Search/result-state behavior is maintained in the canonical `../SPEC/UI_Part_Search.md` file.
- Other dedicated UI topic specifications remain in the existing `vieps/UI/` directory unless moved to the canonical `SPEC` area by an explicit specification decision.
- #360 remains obsolete and is not a requirements source.
- #366 remains superseded by #468.

## PR traceability
Implementation PRs should link the controlling specification, relevant priority issue, #368, and applicable domain/enabling issues. Specification PRs should identify the issue they make durable and should not silently redefine unrelated domain ownership.

## Whole-page-first strategy
The complete Concept-1 page should be established early. Components whose contracts are ready may be real; components awaiting later priorities use permanent-position placeholders or explicit unavailable states. Later implementation replaces the backing behavior without redesigning the information architecture.

## Repository structure

```text
5-Implementation-Projects/internet/jagports/solution/vieps/
  SPEC/
    UI_Part_Search.md
  UI/
    UI_Specs.md
    UI_Specs_Parts_Tree.md
    UI_Specs_<Topic>.md
```

No additional `specifications/` folder is introduced under `vieps`.

## Acceptance criteria
- [ ] #468/#368 ownership boundary is explicit.
- [ ] Dedicated specification issue/file pattern is explicit.
- [ ] #360 remains obsolete and excluded as requirements baseline.
- [ ] #366 remains superseded by #468.
- [ ] PR traceability requirements are defined.
- [ ] Whole-page-first implementation strategy is documented.
- [ ] No additional `specifications/` folder is introduced under `vieps`.
