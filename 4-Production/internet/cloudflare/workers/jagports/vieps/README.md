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

## Production architecture

```text
Public Internet
      |
      v
Cloudflare Worker: jagports / VIEPS
      |
      v
Cloudflare D1: jagports
```

VIEPS is a public application. Public users may access public/read functionality.

Stock add/modify operations require administrator authentication and authorization. The accepted administrator implementation is tracked separately in Issue #448.

The whole public application must not be protected by Cloudflare Access.

## Cloudflare account and endpoint

The intended organizational Cloudflare account is the new Jagports account using `parts@jagports.fi`.

Target production hostname:

```text
vieps.jagports.fi
```

The hostname/DNS prerequisite remains intentionally unresolved. The deployment must not claim this hostname is operational until the supported Cloudflare/DNS architecture is selected and independently verified.

## Worker configuration

The production Worker configuration belongs in this directory, for example:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/wrangler.toml
```

The Worker must bind to the intended production D1 database. A placeholder D1 database ID must not be deployed.

Worker deployment and D1 migration application are separate operational steps.

## Administrator security

The initial administrator identity is:

```text
parts@jagports.fi
```

No Google/Microsoft external identity provider is selected at this stage.

The administrator password must use secure password-hash/credential storage. Plaintext passwords and password hashes must never be committed to GitHub, documentation, Issues, Pull Requests, logs, or build output.

The current application may still contain the transitional `ADMIN_TOKEN`/`x-admin-token` mechanism. It must not be treated as the final administrator login until Issue #448 is reviewed, tested, and merged.

## Verification

Production verification must separately establish:

- public application/read access works;
- unauthorized users cannot mutate stock;
- an authenticated administrator can perform authorized stock mutation;
- the Worker reaches the intended production D1 resource;
- the production hostname is operational through the selected DNS/Cloudflare architecture.

No production credentials, password hashes, tokens, or secret values belong in this directory.
