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

## VIEPS execution

End-to-end VIEPS deployment orchestration is maintained separately:

`3-Deployment/internet/jagports/solution/vieps/deployment_Execution.md`

## DNS deployment

Production address/DNS setup is a separate task:

`3-Deployment/internet/dns/hosting/jagports/setupProductionAddress.md`

The target hostname is `vieps.jagports.fi`. The DNS/Cloudflare architecture blocker remains intentionally unresolved until deployment reaches that prerequisite.

## Production representation

Worker:

`4-Production/internet/cloudflare/workers/jagports/vieps/`

D1:

`4-Production/internet/cloudflare/d1/jagports/vieps/`

Production Worker management:

`4-Production/internet/cloudflare/workers/jagports/vieps/Management_Tasks.md`

## Implementation requirements

Cloudflare-specific VIEPS implementation project:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/`

FQDN requirement:

`5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md`

The implementation requirements and deployment procedures are separate from the deployed production representation.

## Architectural boundary

VIEPS is public/read-accessible without whole-application Cloudflare Access. Stock mutation is administrator-authorized at the application layer.

The Cloudflare directory is an index/procedure layer; it does not contain the end-to-end VIEPS execution orchestrator.
