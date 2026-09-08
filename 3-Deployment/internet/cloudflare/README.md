# Jagports Cloudflare Deployment Documentation

## Purpose

Index for reusable Cloudflare deployment procedures used by Jagports VIEPS.

## Account

[Jagports Cloudflare Account Setup](account/Jagports_CloudFlare_Account_Setup.md)

Account creation, security, member roles, and Wrangler authentication.

## GitHub integration

[Jagports Cloudflare GitHub Integration Setup](github/Jagports_CloudFlare_GitHub_Integration_Setup.md)

Workers Builds connection to `jagports/jagports`, branch control, preview builds, API automation, and verification.

## Workers

[Jagports Cloudflare Git Worker Deployment](workers/jagports/Jagports_CloudFlareGit_App_Deployment.md)

Worker-specific deployment configuration and procedure.

## D1

[Jagports Cloudflare D1 Database Deployment](d1/jagports/Jagports_CloudFlareGit_DB_Deployment.md)

D1 resource creation and Worker binding.

[Jagports Cloudflare D1 Migration Operations](d1/jagports/Jagports_CloudFlareGit_DB_Migrations.md)

Repeatable migration review, application, and verification.

## Production representation

Worker:

`4-Production/internet/cloudflare/workers/jagports/vieps/`

D1:

`4-Production/internet/cloudflare/d1/jagports/vieps/`

## VIEPS implementation

`5-Implementation-Projects/base/application-platform/application/jagports/vieps/`

The implementation project remains technology-independent.

## Execution

Live setup and end-to-end testing are orchestrated by PR #447:

https://github.com/jagports/jagports/pull/447

This PR documents reusable deployment procedures. It does not claim that live Cloudflare setup has been executed.

## Architectural boundary

VIEPS is public/read-accessible without whole-application Cloudflare Access. Stock mutation is administrator-authorized at the application layer.

The target hostname is:

```text
vieps.jagports.fi
```

The DNS/Cloudflare architecture blocker remains intentionally unresolved until deployment reaches that prerequisite.
