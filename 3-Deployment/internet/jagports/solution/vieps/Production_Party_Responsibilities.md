# VIEPS Production Party Ownership and Responsibilities

## Purpose

This document records the accepted ownership, administration, operational and recovery responsibilities for the VIEPS production environment and its external parties.

Responsibility assignment is not production-readiness evidence. A party may own or control a resource even when that resource has not yet been provisioned, deployed or verified.

## Cloudflare production resource hierarchy

The Jagports production Cloudflare account is the parent production resource for the VIEPS Worker and D1 resources:

```text
Jagports production Cloudflare account
        │
        ├── Worker: jagports / VIEPS
        │
        └── D1: jagports / VIEPS
```

This hierarchy records ownership and responsibility boundaries only. It does **not** establish that the Worker or D1 resource has already been provisioned, deployed, migrated, validated, or made production-ready.

| Resource | Ownership | Technical operation | Deployment authorization |
| --- | --- | --- | --- |
| Jagports production Cloudflare account | Jagports / `parts@jagports.fi`, owned/operated by `tlindi` | Account administration and access management under the Jagports owner/operator model | Jagports governance; operational owner `tlindi` |
| Cloudflare Worker `jagports` / VIEPS | Production resource under the Jagports Cloudflare account | Worker management procedure and Jagports production owner/operator model | Reviewed/approved Jagports deployment workflow |
| Cloudflare D1 `jagports` / VIEPS | Production resource under the Jagports Cloudflare account | D1 deployment/migration procedures and Jagports production owner/operator model | Reviewed/approved Jagports deployment workflow |

Ownership, technical operation, and deployment authorization are separate concepts. Authorization to deploy a resource is not evidence that deployment has occurred, and operation responsibility is not evidence that the resource is currently healthy or production-ready.

## Responsibility matrix

| Question | Responsibility |
| --- | --- |
| Who owns the Jagports Cloudflare account? | `tlindi` / `parts@jagports.fi` |
| Who is the Cloudflare account administrator? | `jagports` (`parts@jagports.fi`) / operated by `tlindi` |
| Who owns the GitHub organization/repository? | `tlindi` @github |
| Who can install the Cloudflare GitHub App? | `tlindi` |
| Who controls the production DNS zone? | `tlindi` |
| Who can change `vieps.jagports.fi` DNS? | `tlindi`; when production time arrives, `tlindi` can move the relevant DNS to Cloudflare if desired or required by the selected production architecture |
| Who authorizes production deployment? | Jagports governance; operational owner is `tlindi`, using GitHub as `tlindi` and Cloudflare as `jagports` (`parts@jagports.fi`) |
| Who operates the production Worker? | The production Worker management procedure defines the operating activities; operational responsibility is under the Jagports production owner/operator model |
| Who administers VIEPS stock? | Application-level administrator |
| Who can recover Cloudflare access? | Credential-management process; owner/operator `tlindi` through `jagports` (`parts@jagports.fi`) |

## Responsibility boundaries

### Ownership

- `tlindi` owns the Jagports-side Cloudflare and GitHub organizational resources identified above.
- The Cloudflare account uses `parts@jagports.fi` as the Jagports organizational identity.
- The VIEPS Worker and D1 resources are subordinate production resources of the Jagports Cloudflare account; they do not have independent ownership outside that account relationship.

### Administration and operation

- Account administration and technical operation are separate responsibilities from ownership.
- Cloudflare Worker operational activities are governed by the production Worker management procedure.
- Cloudflare D1 operational activities are governed by the D1 deployment and migration procedures.
- VIEPS stock authorization is application-level and must not be confused with Cloudflare infrastructure authorization.

### DNS

- Production DNS control remains with `tlindi`.
- The production hostname is `vieps.jagports.fi`.
- Moving the relevant DNS arrangement to Cloudflare is an option available to `tlindi` when production deployment architecture is selected and the production prerequisite is reached.
- DNS architecture must not be treated as a blocker for pre-production VIEPS work when the accepted pre-production `workers.dev` address is sufficient.

### Production deployment authorization

Production deployment follows Jagports governance and the approved repository workflow. Operationally, `tlindi` is the owner/operator using the GitHub identity `tlindi` and Cloudflare identity `jagports` (`parts@jagports.fi`).

The existence of this authority does not by itself mean that a production deployment has occurred or passed verification.

### Credential recovery

Cloudflare recovery follows the credential-management process. Recovery responsibility belongs to the owner/operator `tlindi` through the Jagports Cloudflare organizational identity.

No password, recovery code, API token or other secret belongs in this document or repository content.

## Production-readiness distinction

This responsibility record must be read separately from production implementation and deployment status.

In particular, it does not establish completion of:

- VIEPS UI implementation;
- Parts Data Model implementation;
- JEPC data import;
- backend/API behaviour;
- database/schema deployment;
- authentication/authorization implementation;
- automated testing and acceptance evidence;
- pre-production validation;
- Cloudflare Worker/D1 deployment;
- production DNS configuration;
- production operational readiness and rollback capability.

## Related work

**Corrective production-readiness analysis**

[Issue #462 — Correct VIEPS production-readiness analysis: DNS is not the primary blocker](https://github.com/jagports/jagports/issues/462)

**Cloudflare production resource ownership mapping**

[Issue #465 — Explicitly map ownership of Cloudflare production resources](https://github.com/jagports/jagports/issues/465)

**Responsibility documentation work record**

[Issue #463 — Document VIEPS production party ownership and operational responsibilities](https://github.com/jagports/jagports/issues/463)

**Cloudflare deployment procedures**

[PR #445 — Split Cloudflare Worker and D1 deployment documentation](https://github.com/jagports/jagports/pull/445)

[PR #447 — Cloudflare Git integrated Jagports deployment execution](https://github.com/jagports/jagports/pull/447)
