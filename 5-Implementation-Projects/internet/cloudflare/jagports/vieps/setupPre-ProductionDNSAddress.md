# VIEPS Pre-Production Address Setup

## Purpose

Define the VIEPS pre-production public address using the Cloudflare-provided `workers.dev` hostname.

This document is an implementation procedure for pre-production only. It does not establish or change the production hostname requirement.

## Accepted pre-production decision

VIEPS pre-production uses the Cloudflare Workers hostname model:

```text
<VIEPS-name>.<account>.workers.dev
```

The selected VIEPS pre-production hostname is:

```text
vieps.jagports.workers.dev
```

The hostname is provided by Cloudflare Workers. It is not a DNS record under `jagports.fi` and does not require `vieps.jagports.fi` to be available for pre-production.

## Hostname model

Cloudflare provides a configurable account-level `workers.dev` subdomain:

```text
<account>.workers.dev
```

A Worker deployed with `workers.dev` enabled is then exposed using the Worker name as the first DNS label:

```text
<worker-name>.<account>.workers.dev
```

For VIEPS the intended mapping is therefore:

```text
Cloudflare account subdomain: jagports.workers.dev
Worker name:                  vieps
Pre-production address:      vieps.jagports.workers.dev
```

The Worker name must comply with Cloudflare's `workers.dev` naming restrictions. In particular, the name is a DNS label and must be no longer than 63 characters and use only alphanumeric characters and dashes, without a leading or trailing dash.

## Prerequisites

Before executing this setup:

- a Cloudflare account is available;
- the operator has sufficient permission to manage the VIEPS Worker;
- the account `workers.dev` subdomain is configured as `jagports`;
- the VIEPS Worker name is `vieps` or the deployment configuration explicitly establishes the equivalent hostname;
- the VIEPS Worker deployment procedure is available;
- any required D1 binding and migration work is handled separately from hostname setup.

The hostname decision does not by itself prove that the Worker, D1 database, GitHub integration, or application authentication has been deployed.

## Dashboard setup

Cloudflare dashboard setup can be used when the account `workers.dev` subdomain has not yet been configured.

1. Open Cloudflare Workers & Pages.
2. Locate the account-level Workers subdomain setting.
3. Configure the account subdomain as:

```text
jagports
```

4. Open the VIEPS Worker.
5. Ensure its `workers.dev` address is enabled.
6. Verify that the resulting Worker address is:

```text
https://vieps.jagports.workers.dev
```

Do not configure `vieps.jagports.fi` as part of this pre-production procedure.

## CLI setup and deployment

The Worker can be deployed through Wrangler when the Cloudflare account and Worker project are correctly authenticated and configured.

Typical deployment command:

```text
npx wrangler deploy
```

If the Wrangler configuration enables `workers_dev`, Cloudflare can expose the Worker through its `workers.dev` hostname.

The exact Worker configuration is the implementation source of truth. Do not add credentials, API tokens, passwords, or secret values to this document or to committed configuration.

For Git-integrated deployment, the deployment mechanism defined by the VIEPS Cloudflare deployment documentation remains authoritative. This file defines the pre-production address requirement and its verification; it does not replace the Worker deployment procedure.

## Verification

The address setup is successful only after actual execution and independent verification.

Verify all applicable points:

```text
Cloudflare account subdomain
        ↓
        jagports.workers.dev
        ↓
VIEPS Worker workers.dev route
        ↓
https://vieps.jagports.workers.dev
        ↓
HTTP/TLS connection succeeds
        ↓
VIEPS application responds
```

Minimum verification:

- the Cloudflare account subdomain is `jagports`;
- the VIEPS Worker is enabled on `workers.dev`;
- the address resolves to the Cloudflare Worker endpoint;
- HTTPS/TLS works for the address;
- the VIEPS application responds through the address;
- the observed Worker/application response is recorded in the execution record;
- no production hostname change is inferred from successful pre-production verification.

A document change alone is not execution evidence.

## Pre-production versus production

This hostname is intentionally a pre-production decision.

The production hostname remains a separate decision. At production launch, reassess whether `workers.dev` is sufficient or whether a custom production hostname should be used.

The current production application requirement recorded in `FQDN_requirements.md` remains separate from this pre-production address.

Therefore:

```text
Pre-production
    ↓
vieps.jagports.workers.dev

Production
    ↓
separate production-hostname decision
```

`vieps.jagports.fi` must not block VIEPS pre-production solely because it is the intended production hostname.

## Security and operational considerations

- `workers.dev` URLs are publicly reachable when enabled unless access controls such as Cloudflare Access are applied.
- Do not assume that the hostname itself provides administrator authorization.
- VIEPS application authorization rules remain application-level controls.
- Public/read access and administrator stock mutation authorization must be tested through the VIEPS functional testing procedure.
- Do not store passwords, password hashes, recovery codes, API tokens, Cloudflare secrets, or other secret values in this document.
- Keep pre-production resources and data separated from production resources where the deployment design requires it.
- Do not treat a successful HTTP response as proof that D1 migrations or application authorization are correct.

Cloudflare recommends Workers routes or Custom Domains rather than `workers.dev` for production business-critical Workers. This supports retaining the `workers.dev` decision as a pre-production choice while deferring the final production hostname decision.

## Related implementation records

**Implements / follows**

[Issue #459 — Generate setupPre-ProductionDNSAddress.md for VIEPS Cloudflare pre-production](https://github.com/jagports/jagports/issues/459)

**Extends**

[PR #447 — Cloudflare Git integrated Jagports deployment execution](https://github.com/jagports/jagports/pull/447)

**Related**

[Issue #446 — Document Cloudflare Git integration and D1 deployment procedure](https://github.com/jagports/jagports/issues/446)

[Issue #448 — Implement public VIEPS access with administrator stock authorization](https://github.com/jagports/jagports/issues/448)

[PR #445 — Split Cloudflare Worker and D1 deployment documentation](https://github.com/jagports/jagports/pull/445)

[5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md](../dns/jagports/vieps/FQDN_requirements.md)

## External Cloudflare references

- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/workers/get-started/guide/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/configuration/routing/

## Execution record boundary

This document defines the procedure and accepted target address only.

It does not claim that `vieps.jagports.workers.dev` has been provisioned, deployed, or verified. Actual execution and verification must be recorded separately in the applicable VIEPS execution record and GitHub Issue/PR communication.