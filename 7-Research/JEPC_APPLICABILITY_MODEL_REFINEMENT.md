# JEPC applicability model refinement: evidence and review

## Work identity

Refines [#354 — Define and implement Parts Data Model](https://github.com/jagports/jagports/issues/354).

Enables mapping work in [#355 — IMPL / JEPC Data Importer](https://github.com/jagports/jagports/issues/355).

The Product Owner authorized applicability requirements/model refinement on 2026-09-14 and paused the separate hotspot investigation to conserve usage. This work does not resume [#352](https://github.com/jagports/jagports/issues/352).

Proposal: [PART applicability requirements](../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART_APPLICABILITY.md).

Repository baseline: `168a720` on main. Historical model implementation includes merged PRs #535 and #550. Their flat source fitment representation remains valid for retained evidence but does not satisfy the grouped transformation requirements below. This amendment reuses open #354; it does not complete that whole issue.

## Bounded source evidence

The existing [XK audit](JEPC_XK_SOURCE_AUDIT.md) is the evidence baseline. On 2026-09-14 the following installed files were read directly again under `C:/Program Files/JEPC/applications/JEPC`:

- `drilldown/pl_id_3187/L0/Itm_M3187_C11096_I1_L0.xml`;
- `drilldown/pl_id_3187/Itm_M3187_C11096_I1_attributes.xml`;
- `drilldown/pl_id_3187/tl_M3187_C11096_attributes.xml`.

The item file again contains HNA9670BA/application 93491 beneath `To VIN (023699)` and HJB9670AA/application 151439 beneath `From VIN (023700)`. The applicability rows are:

```text
93491,[C,  023699,1,0]
151439,[C,  023700,0,0]
```

The top-level file repeats item key `1` for those two boundaries. This does not justify collapsing them into one interval. The source record identity, application identity and canonical PART identity are different.

### Model bounds and Product Owner correction

The Product Owner clarified that one-sided item conditions must be combined with model breadcrumbs and JLHT production/VIN documentation. Inspection of `JEPCFiles/menus/models_l_id_0.xml` confirms:

| Model | Source label boundary |
|---|---|
| 3187 | XK8 Coupe/Convertible up to (V) 042775 |
| 3178 | XK8 Coupe/Convertible From (V) A00083 To (V) A30644 |
| 3173 | XK8 Coupe/Convertible From (V) A30645 |

The Product Owner identifies JLHT documents as supplying model 3187's start and model 3173's end. Their exact values/pages have not been captured in this bounded study. Treat those as evidence to attach, not as unknowable boundaries or permission to invent values.

For the airbag example, application 151439 can have a derived effective interval 023700 through 042775 under verified model ownership and comparator rules. Application 93491 can be bounded from the documented model start through 023699. Preserve the original item conditions and inherited model evidence alongside these derived intervals.

This corrects the initial assessment: a one-sided item record alone does **not** prove a required `vin_range` schema redesign. Existing complete-range records may be reused when their required fields are established. The remaining model gap is explicit occurrence/context pairing, derivation provenance and combination semantics, including unresolved cases.

### Item versus application terminology

Item `1` is the numbered Passenger airbag module position/function in category `11096` and its diagram. Application `93491` supplies HNA9670BA for that item under one condition; application `151439` supplies HJB9670AA under another. JEPC's top-level filtering determines whether the numbered item remains visible; application filtering distinguishes candidate part rows. Neither terminology requires a destination decision-node entity.

The repository sample `JEPCFiles/menus/pl_id_3187_attributes.xml` includes `11149,[A6,913,1,0,1]` and positive A6/A23 tuples. This establishes raw group/value/flag examples, not human names for those groups.

No whole-installation traversal, full importer run or stock mutation was performed.

## Reproducible source probes

Run from the repository root:

```text
node 7-Research/probe_jepc_applicability.mjs
```

The script runs the repository's `JEPCFiltering.js` functions in a bounded VM context. It does not implement a replacement evaluator. Its SHA-256 on the inspected source is `552c548a01e31cecfc416dc5452d659a5a5f645041ee1abb5ef05463c0fc96dd`, matching the prior installed-source audit fingerprint.

Result: **10 source probes passed**.

| Probe | Observed result | Requirement implication |
|---|---|---|
| Four padded serial inputs around 023699/023700 | Upper comparison accepts equality at 023699; lower comparison accepts equality at 023700. | Preserve one-sided bounds and explicit inclusivity. |
| Repeated top-level item key with opposite bounds | Item remains visible when one boundary record passes. | Preserve alternatives and filter scope. |
| Same repeated boundary arrays at application scope | Candidate is removed when a boundary fails. | Duplicate IDs cannot imply one universal combination rule. |
| Unpadded serial against padded raw boundary | The isolated function returns application 151439 for string `023699`. | Raw formatting/coercion matters; validate the complete parser/input path before choosing normalization. |
| Synthetic matching A6 exclusion plus matching A23 group | Application is removed, but category candidate survives. | Category visibility is not an occurrence fitment assertion. |
| Required A6 source group absent from supplied vehicle attributes | Source leaves application candidate visible. | Unknown vehicle input must remain distinct from verified applicability. |

The attribute combinations are synthetic function inputs using observed token vocabulary. They are not asserted to occur as a combined record in JEPC. Padded serial probes deliberately isolate comparison behavior; the unpadded result is not evidence of a live JEPC UI defect. Source parsing, user-input normalization and complete end-to-end execution are outside these probes.

## Verified model gaps

Inspected migrations `0004_part_occurrence_context.sql`, `0006_part_vehicle_vin_applicability.sql` and `0008_part_fitment.sql`, and the current PART field dictionary.

1. Independent PART-level model and VIN links cannot encode which model/VIN/attribute combination belongs to which occurrence.
2. `vin_range` requires prefix, start and end. It can hold complete effective intervals when all fields are established, including inherited model bounds. It cannot by itself preserve a one-sided source predicate and the evidence chain used to derive the complete interval. This is a source/derivation requirement, not proof that every effective interval needs a schema change.
3. `part_fitment` has no condition-set identity, Boolean grouping, interpretation version or completeness state. Rows can preserve source tuples but do not define a verified evaluation algorithm.
4. Fitment uniqueness includes occurrence/state/group/key/value/flag but excludes evidence identity. Identical tuples from distinct source rows cannot retain evidence multiplicity in that row structure alone.
5. Existing `applicable` default and `verification_status` text do not establish complete source coverage or positive vehicle fitment.

These are representation gaps, not claims that current basic stock/part search is broken or that breadcrumbs cannot establish model boundaries. The proposed amendment now prioritizes reuse of established range entities, with explicit occurrence binding and derivation evidence.

## Recommended decision

Adopt occurrence-bound applicability assertions with complete alternative condition sets, typed serial/attribute predicates, independent source evidence and explicit incomplete/unavailable states. Keep the current PART identity and stock boundary.

Alternatives considered:

- Independent PART-to-range lists are smaller, but lose combinations and can manufacture applicability through cross-joining.
- Source tree entities reproduce JEPC navigation semantics and contradict the accepted VIEPS destination boundary.
- A general arbitrary Boolean expression engine adds scope and can hide source structure in opaque payloads. The proposal starts with finite, inspectable relational sets and quarantines mappings that cannot be safely represented within bounded processing.

The physical SQL design, source identity key, initial comparator and verified attribute mappings need review before migration implementation. No new schema, API evaluator, deployment or universal JEPC translation is claimed here.

## Acceptance review

The proposal defines ten acceptance examples covering observed one-sided bounds, occurrence/model pairing, correlated alternatives, scoped exclusion, missing input, unknown alternatives, incomplete evidence, conflicts, repeat import and language-independent identity.

These examples are requirements for the subsequent implementation tests. They are not represented as ten passed destination-model tests. Only the source probes above were executed.

## Integration and knowledge placement

[PR #655 — SPEC / Move VIEPS part and stock models to SPEC](https://github.com/jagports/jagports/pull/655)

That separate open PR relocates `PART_MODEL.md` to `5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md`. This refinement adds a companion specification in that destination area and a short link from the current model. At integration, retain the link in the relocated model using `MODEL_PART_APPLICABILITY.md`; retain the evidence link using `../../../../../../7-Research/JEPC_APPLICABILITY_MODEL_REFINEMENT.md`. Do not keep two model authorities. This work does not edit PR #655 or claim its approval.

The existing VIEPS `KNOWLEDGE.md` already records the accepted identity/context, no-source-tree, exclusion, alternative and unknown-data boundaries. No proposed schema decision is promoted to accepted knowledge before review. Detailed new evidence stays in this record; the companion SPEC owns the proposed field/relationship requirements.

Independent review and specification acceptance remain pending. Project Item mutation/read is unavailable through the current connector; no Project Status transition is claimed.
