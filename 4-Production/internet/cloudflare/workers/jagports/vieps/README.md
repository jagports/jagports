# VIEPS Cloudflare Worker production

This directory represents the production VIEPS application deployment as a Cloudflare Worker.

## Responsibilities

- production Worker deployment representation;
- Worker-specific production configuration and deployment artifacts;
- Worker-to-D1 binding configuration;
- production Worker verification and rollback references.

The technology-independent VIEPS implementation project remains under:

```text
5-Implementation-Projects/base/application-platform/application/jagports/vieps/
```

The Worker deployment procedure is documented under:

```text
3-Deployment/internet/cloudflare/workers/jagports/Jagports_CloudFlareGit_App_Deployment.md
```

The D1 production representation is separate:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/
```

No production credentials, password hashes, tokens, or secret values belong in this directory.

## Production endpoint

Target hostname:

```text
vieps.jagports.fi
```

The DNS/Cloudflare-zone prerequisite remains unresolved and is intentionally retained as a deployment blocker until the supported production architecture is selected and verified.
