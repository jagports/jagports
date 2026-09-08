# VIEPS Cloudflare D1 production

This directory represents the production VIEPS database deployment as a Cloudflare D1 resource.

## Responsibilities

- production D1 deployment representation;
- production migration files;
- D1-specific operational and recovery references;
- migration-state verification records where appropriate.

The technology-independent VIEPS implementation project remains under:

```text
5-Implementation-Projects/base/application-platform/application/jagports/vieps/
```

The D1 deployment procedure is documented under:

```text
3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Deployment.md
```

The Worker production representation is separate:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

The Worker binds to this D1 resource, but Worker deployment and D1 migration application are separate operational steps.

No production passwords, password hashes, tokens, API credentials, or other secret values belong in this directory.
