# Jagports VIEPS Production Address Setup

## Purpose

Deploy and verify the production DNS/hostname configuration required by VIEPS.

## Requirement

```text
5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md
```

Required hostname:

```text
vieps.jagports.fi
```

## Current blocker

The target Cloudflare Worker requires a supported DNS/Cloudflare architecture. Cloudflare documents that Worker Custom Domains require an active Cloudflare zone, while Worker Routes require a DNS record proxied through Cloudflare.

References:

https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
https://developers.cloudflare.com/workers/configuration/routing/routes/

Keep this task **BLOCKED** while DNS hosting remains incompatible with the selected Worker architecture.

## Execution when unblocked

Use the selected supported architecture and document the actual dashboard/CLI operation used to establish the hostname.

Do not invent DNS or Cloudflare commands. If a dashboard operation is required, record the exact current Cloudflare dashboard path used during execution.

## Verification

From Windows Terminal using PowerShell or Git Bash, verify DNS and HTTPS after configuration is established:

```text
nslookup vieps.jagports.fi
curl.exe -I https://vieps.jagports.fi/
```

Then verify that the response is served by the intended production Worker and that TLS is valid for the hostname.

DNS resolution alone is insufficient evidence of a correct Worker deployment.

## Evidence

Record actual execution and verification in the relevant GitHub Issue/PR and common execution record. Never record credentials or secret values.
