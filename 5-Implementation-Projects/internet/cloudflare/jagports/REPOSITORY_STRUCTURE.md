# VIEPS Repository Structure

**Status:** Canonical path rule for structural cleanup
**Related:** #516, #519, #523, #524
**Governance predecessor:** #449

## Rule

The application/resource identifier `vieps` is permitted as the **final repository directory element when the resulting path is 5 or fewer directory levels deep**.

A final `vieps` element must not be removed merely because it identifies the application. The repository must not add `vieps` as a redundant application-name directory at **directory level 6 or deeper** solely for identification.

The depth count applies to repository directory levels and excludes the filename.

Existing valid paths must be preserved. Structural cleanup must not mechanically remove every occurrence of `vieps`.

## Examples

The following final `vieps` paths are valid because `vieps` is at directory level 5 or less:

```text
3-Deployment/internet/jagports/solution/vieps/
4-Production/internet/cloudflare/d1/jagports/vieps/
5-Implementation-Projects/internet/cloudflare/jagports/vieps/
5-Implementation-Projects/internet/dns/jagports/vieps/
```

A path where `vieps` would become directory level 6 or deeper solely as an application-name marker is not valid.

## Canonical Deployment-1 Worker path

The current Worker path remains canonical:

```text
4-Production/internet/cloudflare/workers/jagports/
```

The Worker name remains a runtime/deployment identifier in `wrangler.toml`:

```toml
name = "vieps"
```

The Worker name does not determine repository directory depth.

## Layer guidance

Technology-specific production trees remain valid where required by repository architecture. A final `vieps` directory within the allowed depth is also valid when it represents the application/resource boundary for that layer.

The rule is therefore based on **path depth plus architectural justification**, not on the presence of the string `vieps` itself.

## Runtime identifiers

This repository-directory rule does not rename or prohibit legitimate runtime identifiers such as:

- Worker name `vieps`;
- `/api/vieps/...` routes;
- DNS hostnames containing `vieps`;
- database/resource names containing `vieps`;
- configuration or content identifiers containing `vieps`.

## Migration rule

Do not perform structural migration merely to remove a final `vieps` element when it is at directory level 5 or less.

Where a redundant `vieps` directory exists at level 6 or deeper solely as an application-name marker, address it through the normal Issue → branch → PR → review → merge workflow.

Historical closed/merged Issue and PR text must not be rewritten. Corrections are recorded through new Issues, comments, commits, and reviewed PRs.
