# JEPC Knowledge

## Parts supersession

Parts supersession is a first-class relationship between catalogue parts. A superseded or obsolete part remains an independently addressable catalogue entity; supersession does not overwrite or delete the historical part number.

The relationship should preserve its direction, provenance, evidence, and verification status. The data model must distinguish explicit catalogue/manufacturer supersession from inferred interchangeability, generic cross-reference, or other weaker relationships.

A supersession relationship may be one-to-one, one-to-many, or part of a longer replacement chain. The model must therefore represent relationships rather than encode supersession as a single replacement field on the source part.

Where an authoritative catalogue explicitly states that a part is superseded by another part, that statement is source evidence for a high-confidence supersession relationship. External catalogue sources such as JLR Classic Parts can provide this evidence when the source explicitly identifies the replacement relationship.

Supersession is reference/catalogue knowledge and must remain separate from mutable Jagports operational stock. Existing stock may legitimately reference a superseded catalogue part number.

### Recommended relationship information

A supersession relationship should be capable of recording:

- source catalogue part;
- target catalogue part;
- relationship direction/type;
- source/provenance;
- evidence or source statement;
- verification status/confidence;
- discovery/source date where required by the implementation.

Specific source examples and individual part-number relationships belong in the relevant research or task record unless they establish a reusable domain rule.
