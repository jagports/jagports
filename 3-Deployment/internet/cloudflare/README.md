# Jagports Cloudflare Deployment Documentation

## Purpose

Index for reusable Cloudflare deployment procedures used by Jagports VIEPS.

## Reusable procedures

### Cloudflare account

`3-Deployment/internet/cloudflare/CloudFlare_Account_Setup.md`

Account creation, security, member roles, recovery, and Wrangler authentication.

### GitHub integration

`3-Deployment/internet/cloudflare/CloudFlare_GitHub_Integration_Setup.md`

Workers Builds connection to `jagports/jagports`, branch control, preview builds, watch paths, API automation boundary, and verification.

### Worker deployment

`3-Deployment/internet/cloudflare/workers/jagports/CloudFlareGit_App_Deployment.md`

Worker-specific deployment configuration, CLI execution, endpoint dependency, and verification.

### D1 deployment

`3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Deployment.md`

D1 resource existence check, creation, Worker binding, and verification.

### D1 migrations

`3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md`

Repeatable migration review, source selection, preview/local testing, production application, and verification.

## Reduced-MVP runtime status

Issue #496, **VIEPS / Deployment-1 — Establish the First Real End-to-End VIEPS Runtime**, is completed and records that the repository/runtime foundation for an end-to-end VIEPS deployment was established.

The current reduced-MVP acceptance target is the **pre-production Cloudflare Worker named `vieps`**, built from reviewed `main` using the Worker representation under:

`4-Production/internet/cloudflare/workers/jagports/`

Repository configuration alone is not runtime evidence. A concrete acceptance run must record the exact deployed endpoint and revision under test, then execute the applicable runtime probes against that endpoint. Use:

`VIEPS_BASE_URL=https://<verified-vieps-endpoint> npm run test:runtime`

and the deployed-asset verification defined by the Worker deployment procedure.

The existing MVP endpoint `jagports.parts-5ec.workers.dev` remains a valid reduced-MVP runtime endpoint because the MVP is not the production deployment. It may be used for #546 acceptance when the execution record confirms the tested revision and runtime state.

The repository also references `vieps.parts-5ec.workers.dev` in verification tooling and migration examples. Either endpoint must be treated as acceptance evidence only when an actual #546 execution record identifies the endpoint used and confirms the deployed revision/runtime state.

Reduced-MVP closure does **not** require the later production hostname `vieps.jagports.fi`, production Worker identity `jagports`, or unrelated DNS/deployment-policy work. Those remain separate deployment concerns.

For #546, the execution evidence must identify at minimum:

- exact runtime URL;
- tested Git revision / deployed Worker version where available;
- that the environment is the pre-production `vieps` Worker;
- successful UI/API runtime probes for the fixture-backed PART path;
- retained STOCK behavior exercised through the accepted public path;
- any unavailable runtime evidence explicitly as NOT RUN/BLOCKED rather than inferred success.

## VIEPS execution

End-to-end VIEPS deployment orchestration is maintained separately:

`3-Deployment/internet/jagports/solution/vieps/deployment_Execution.md`

## DNS deployment

Production address/DNS setup is a separate task:

`3-Deployment/internet/dns/hosting/jagports/setupProductionAddress.md`

The target hostname is `vieps.jagports.fi`. The DNS/Cloudflare architecture blocker remains intentionally unresolved until deployment reaches that prerequisite.

## Production representation

Worker deployment directory:

`4-Production/internet/cloudflare/workers/jagports/`

The Worker identity configured for the current pre-production deployment is `vieps`.

D1:

`4-Production/internet/cloudflare/d1/jagports/vieps/`

Worker management:

`4-Production/internet/cloudflare/workers/jagports/Management_Tasks.md`

The obsolete `/base` hierarchy is not a deployment/runtime dependency.

## Implementation requirements

Cloudflare-specific VIEPS implementation project:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/`

FQDN requirement:

`5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md`

The implementation requirements and deployment procedures are separate from the deployed production representation.

## Architectural boundary

VIEPS is public/read-accessible without whole-application Cloudflare Access. Stock mutation is administrator-authorized at the application layer.

The Cloudflare directory is an index/procedure layer; it does not contain the end-to-end VIEPS execution orchestrator.
