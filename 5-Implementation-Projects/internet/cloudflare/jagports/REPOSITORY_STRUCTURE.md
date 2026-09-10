# VIEPS Repository Structure

**Status:** Canonical path rule for structural cleanup
**Related:** #516, #519
**Governance predecessor:** #449

## Rule

The application name `vieps` must not be introduced as an additional repository directory level below an already application-, solution-, technology-, or resource-specific path solely to identify the application.

The application identity belongs in the content, configuration, metadata, or runtime identifier where required. It does not justify an otherwise redundant directory level.

## Canonical Deployment-1 paths

The current Worker path is already canonical:

```text
4-Production/internet/cloudflare/workers/jagports/
```

The Worker name remains a runtime/deployment identifier in `wrangler.toml`:

```toml
name = "vieps"
```

This does **not** require:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

The D1 production resource similarly uses the resource path without an additional application-name directory:

```text
4-Production/internet/cloudflare/d1/jagports/
```

## Layer targets

| Layer | Canonical target pattern | Redundant pattern to remove |
|---|---|---|
| Deployment | `3-Deployment/internet/jagports/solution/` | `3-Deployment/internet/jagports/solution/vieps/` |
| Cloudflare implementation | `5-Implementation-Projects/internet/cloudflare/jagports/` | `5-Implementation-Projects/internet/cloudflare/jagports/vieps/` |
| DNS implementation | `5-Implementation-Projects/internet/dns/jagports/` | `5-Implementation-Projects/internet/dns/jagports/vieps/` |
| Cloudflare D1 production | `4-Production/internet/cloudflare/d1/jagports/` | `4-Production/internet/cloudflare/d1/jagports/vieps/` |
| Cloudflare Worker production | `4-Production/internet/cloudflare/workers/jagports/` | `4-Production/internet/cloudflare/workers/jagports/vieps/` |

These targets are repository-directory rules. They do not rename runtime routes, Worker names, DNS hostnames, database names, or other identifiers that legitimately contain `vieps`.

## Migration rule

Structural cleanup must proceed in this order:

1. establish the canonical path specification;
2. update references and specifications;
3. move implementation/deployment/test files to the canonical paths;
4. remove obsolete redundant directories;
5. verify Wrangler, Workers Builds, D1 migrations, fixtures, tests, and documentation from the canonical paths.

Historical closed/merged Issue and PR text must not be rewritten.

## Scope boundary

A technology-specific production tree remains valid where required by repository architecture. This rule removes only the extra application-name level that duplicates an already established application/resource identity.

Runtime paths such as `/api/vieps/...` are outside this repository-directory rule and must remain unchanged unless a separate API specification explicitly changes them.
