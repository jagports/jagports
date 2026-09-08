# VIEPS FQDN Requirements

## Purpose

Define the application-level requirement for the public VIEPS hostname independently from the Cloudflare deployment implementation.

## Required public hostname

```text
vieps.jagports.fi
```

The hostname is an application/product requirement. The mechanism used to provide it is a deployment/infrastructure decision.

## Requirements

- VIEPS must be reachable from the public Internet through the accepted production hostname.
- Public/read functionality must not require administrator authentication.
- Stock add/modify functionality must require application-level administrator authorization.
- The hostname must resolve to the intended production application endpoint.
- TLS must be valid for the hostname.
- DNS and routing must be independently verified before production endpoint acceptance.

## Current deployment constraint

The current Cloudflare Worker target is expected to use `vieps.jagports.fi`.

Cloudflare's current Worker documentation states that:

- Custom Domains require an active Cloudflare zone and Cloudflare creates the DNS record for the Custom Domain.
- Routes require a DNS record for the hostname that is proxied through Cloudflare.

References:

https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
https://developers.cloudflare.com/workers/configuration/routing/routes/

Therefore an external-DNS-only architecture is currently a **BLOCKED deployment prerequisite** for the intended Worker-origin design until a supported architecture is selected.

## Acceptance

Do not mark the FQDN requirement satisfied until all are verified:

```text
DNS resolution
    -> intended public endpoint
    -> TLS certificate valid
    -> Cloudflare Worker invoked
    -> VIEPS application responds
    -> public/read access works
    -> unauthorized stock mutation is denied
```

This file records the requirement. The actual deployment blocker and execution evidence belong to the relevant GitHub Issue and deployment records.
