# VIEPS FQDN Requirements

## Purpose

Define the application-level public hostname requirement independently from DNS and Cloudflare deployment implementation.

## Production hostname decision

The accepted production hostname is:

```text
vieps.jagports.fi
```

This is a completed production-hostname decision. It is not a pre-production prerequisite.

## Production requirements

- VIEPS must be reachable from the public Internet through `vieps.jagports.fi` after production deployment.
- Public/read functionality must not require administrator authentication.
- Stock add/modify functionality must require application-level administrator authorization.
- The hostname must resolve to the intended production application endpoint.
- TLS must be valid for the hostname.
- DNS and routing must be independently verified before production endpoint acceptance.

## Pre-production boundary

VIEPS development is first being executed in pre-production using the Cloudflare-provided Workers hostname:

```text
vieps.jagports.workers.dev
```

The pre-production hostname is intentionally separate from the production hostname requirement.

Therefore `vieps.jagports.fi` must not block pre-production deployment.

## Production deployment condition

For the intended Cloudflare Worker production architecture, the production hostname requires a supported Cloudflare DNS/routing arrangement. The deployment task must verify the applicable Cloudflare Custom Domain/Route and DNS prerequisites before attempting production hostname activation.

If the current external-DNS arrangement cannot satisfy the required Cloudflare architecture, production deployment must stop until a supported architecture is selected.

## Acceptance

Do not mark the production hostname requirement satisfied until all are verified:

```text
DNS resolution
    -> intended production endpoint
    -> TLS certificate valid
    -> intended production Worker invoked
    -> VIEPS application responds
    -> public/read access works
    -> unauthorized stock mutation is denied
```

This file records the production requirement and its completed hostname decision. Deployment execution and evidence belong to the relevant deployment task and GitHub work records.