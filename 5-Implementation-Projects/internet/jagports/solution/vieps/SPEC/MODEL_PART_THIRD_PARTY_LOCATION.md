# Third-Party PART Visual Location Specification

## Purpose

This document specifies optional visual-location evidence for third-party PARTs in VIEPS.

The feature is optional. Missing visual-location evidence must not block PART creation, STOCK creation, or stock administration.

## Supported evidence

A third-party PART may have one or both of these visual references:

1. a Jagports-created point or region placed over an imported JEPC illustration; and
2. an uploaded image that explains or shows the part location.

## Imported JEPC illustration reference

A manually created point or region on a JEPC illustration is Jagports-created evidence.

It must:

- reference the imported JEPC illustration without modifying the source image;
- retain the referenced diagram/image identity;
- retain the Jagports-created point/region geometry;
- record provenance showing that the point/region was added by Jagports;
- remain distinguishable from any hotspot or geometry imported from JEPC.

The UI must not present a Jagports-created point/region as an original Jaguar/JEPC hotspot.

## Uploaded location/reference image

A third-party PART may have one or more uploaded images used to clarify physical location or identify the referenced component.

Each image must retain:

- its PART reference;
- image reference/storage identifier;
- optional description;
- source/provenance;
- verification status;
- verification date where applicable.

Uploaded images are Jagports evidence and must remain distinguishable from imported JEPC media.

## UI behavior

When creating or editing a third-party PART, the operator may:

- leave visual-location evidence empty;
- select an imported JEPC illustration and add a point/region;
- upload a location/reference image;
- attach both forms of evidence.

Existing image/location evidence must be viewable and editable according to normal authorization rules.

## Boundaries

This specification does not redefine imported JEPC diagram/hotspot semantics, PART applicability, STOCK state, or media-import behavior.

Visual-location evidence is descriptive evidence only. It must not create or change vehicle applicability.

## Acceptance criteria

- A third-party PART can exist without visual-location evidence.
- A Jagports-created point/region can reference an imported JEPC illustration without changing the source image.
- Jagports-created geometry is distinguishable from imported JEPC hotspots.
- A third-party PART can have an uploaded location/reference image.
- Provenance is retained for both evidence types.
- Visual-location evidence does not change PART applicability or STOCK state.
