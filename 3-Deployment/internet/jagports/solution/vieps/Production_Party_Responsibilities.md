# VIEPS Production Party Ownership and Responsibilities

## Purpose

This document is the canonical VIEPS deployment record for accepted ownership, administration, operational, recovery, external-party, and production-readiness responsibility boundaries.

Responsibility assignment is not production-readiness evidence. A party may own or control a resource even when that resource has not yet been provisioned, deployed, or verified.

## Cloudflare resource ownership hierarchy

The Jagports Cloudflare account is the parent ownership boundary for Jagports-managed Cloudflare resources:

```text
Jagports Cloudflare account — parts@jagports.fi
        |
        +-- Worker: vieps      (current pre-production identity)
        +-- Worker: jagports   (reserved production identity)
        +-- D1: jagports       (VIEPS database resource)
```

This hierarchy records ownership and responsibility only. It does not assert that a listed resource is provisioned, active, production-ready, or approved for production use.

| Resource | Ownership / responsibility | Operational meaning |
| --- | --- | --- |
| Jagports Cloudflare account | Jagports organizational account `parts@jagports.fi`, owner/operator `tlindi` | Parent account and authorization boundary for Jagports Cloudflare resources. |
| Worker `vieps` | Jagports Cloudflare account | Current pre-production Worker identity; operation is separate from ownership. |
| Worker `jagports` | Jagports Cloudflare account | Reserved production Worker identity; listing it here does not imply production deployment. |
| D1 `jagports` | Jagports Cloudflare account | VIEPS D1 resource; creation, binding, migration, and verification are separate deployment tasks. |

Account ownership, resource ownership, technical operation, and deployment authorization are distinct concepts and must not be used interchangeably.

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

### Administration and operation

- Account administration and technical operation are separate responsibilities from ownership.
- Cloudflare Worker operational activities are governed by the production Worker management procedure.
- VIEPS stock authorization is application-level and must not be confused with Cloudflare infrastructure authorization.

### DNS

- Production DNS control remains with `tlindi`.
- The production hostname is `vieps.jagports.fi`.
- Moving the relevant DNS arrangement to Cloudflare is an option available to `tlindi` when production deployment architecture is selected and the production prerequisite is reached.
- DNS is one production deployment prerequisite. It must not be ranked as the primary overall VIEPS production blocker without a complete readiness/dependency assessment.
- DNS architecture must not block pre-production VIEPS work when the accepted `workers.dev` address is sufficient.

### Production deployment authorization

Production deployment follows Jagports governance and the approved repository workflow. Operationally, `tlindi` is the owner/operator using the GitHub identity `tlindi` and Cloudflare identity `jagports` (`parts@jagports.fi`).

The existence of this authority does not by itself mean that a production deployment has occurred or passed verification.

### Credential recovery

Cloudflare recovery follows the credential-management process. Recovery responsibility belongs to the owner/operator `tlindi` through the Jagports Cloudflare organizational identity.

No password, recovery code, API token, or other secret belongs in this document or repository content.

## Third-party production dependencies

Third parties are a first-class production concept. Cloudflare, DNS/domain providers, and any other externally operated service used by VIEPS must eventually have their ownership, responsibility, dependency, recovery, and readiness boundaries identified and verified.

That production requirement is separate from current implementation priority. During the current pre-production development phase, third-party-specific work is intentionally the lowest-priority class and receives zero dedicated development allocation while higher-value product/application work remains incomplete. This is a phase-specific prioritization decision, not an assertion that third parties are irrelevant to eventual production readiness.

A third-party dependency therefore has two independent states:

1. **Production requirement** — the dependency must be understood and verified before it is relied upon in production.
2. **Current development priority** — work on that dependency may remain deferred while core VIEPS product/application work is incomplete and the accepted pre-production path does not require it.

## Production-readiness model

Production-readiness analysis must separate at least these two layers before ranking blockers or prerequisites.

### Product/application readiness

Includes, as applicable:

- approved VIEPS UI implementation;
- Parts Data Model implementation;
- JEPC data importer/data readiness;
- backend/API/application behaviour;
- database/schema compatibility from the application's perspective;
- authentication and authorization behaviour;
- automated tests, acceptance evidence, and pre-production validation.

### Deployment/operational readiness

Includes, as applicable:

- Cloudflare Worker and D1 deployment state;
- remote D1 migration state;
- DNS/FQDN production configuration;
- third-party service readiness;
- operational verification, recovery, and rollback capability.

A deployment prerequisite such as DNS must not be described as the biggest or primary overall production blocker merely because it is unresolved. Determine the major missing product/application and deployment prerequisites first, then describe their actual dependency relationship without inventing an unsupported ranking.

This responsibility record must therefore be read separately from implementation and deployment status. It does not establish completion of any readiness item listed above.

## Related work

**Corrective production-readiness analysis**

[Issue #462 — Correct VIEPS production-readiness analysis: DNS is not the primary blocker](https://github.com/jagports/jagports/issues/462)

**Responsibility documentation work record**

[Issue #463 — Document VIEPS production party ownership and operational responsibilities](https://github.com/jagports/jagports/issues/463)

**Cloudflare resource ownership mapping**

[Issue #465 — Explicitly map ownership of Cloudflare production resources](https://github.com/jagports/jagports/issues/465)

**Third-party production concept**

[Issue #466 — Treat third parties as a first-class production concept](https://github.com/jagports/jagports/issues/466)

**Cloudflare deployment procedures**

[PR #445 — Split Cloudflare Worker and D1 deployment documentation](https://github.com/jagports/jagports/pull/445)

[PR #447 — Cloudflare Git integrated Jagports deployment execution](https://github.com/jagports/jagports/pull/447)
