# Jagports Cloudflare Deployment Documentation

## Purpose

Index for the reusable Cloudflare deployment procedures used by Jagports VIEPS.

The procedures are separated by responsibility. This directory is not a second task-management system.

## Account

[Jagports Cloudflare Account Setup](account/Jagports_CloudFlare_Account_Setup.md)

Creates and secures the Cloudflare account and establishes Wrangler authentication.

## GitHub integration

[Jagports Cloudflare GitHub Integration Setup](github/Jagports_CloudFlare_GitHub_Integration_Setup.md)

Connects `jagports/jagports` to Workers Builds and defines production/preview branch handling.

## Workers

[Jagports Cloudflare Git Worker Deployment](workers/jagports/Jagports_CloudFlareGit_App_Deployment.md)

Worker-specific deployment configuration and deployment procedure.

## D1

[Jagports Cloudflare D1 Database Deployment](d1/jagports/Jagports_CloudFlareGit_DB_Deployment.md)

D1 resource creation, Worker binding, and database-specific deployment procedure.

[Jagports Cloudflare D1 Migration Operations](d1/jagports/Jagports_CloudFlareGit_DB_Migrations.md)

Repeatable migration review, apply, and verification procedure.

## VIEPS solution deployment

[VIEPS Deployment Setup Management](../jagports/solution/vieps/SetupManagement.md)

Coordinates the deployment tasks without duplicating their detailed procedures.

[VIEPS Deployment Setup Testing](../jagports/solution/vieps/SetupTesting.md)

Provides repeatable pre-deployment, preview, endpoint, authorization, persistence, and post-deployment tests.

[VIEPS Deployment Setup Documentation Record Format](../jagports/solution/vieps/SetupDocumentationRecordFormat.md)

Defines the operation record format without storing credentials or duplicating GitHub traceability.

## Production management

[VIEPS Production Worker Management Tasks](../../../4-Production/internet/cloudflare/workers/jagports/vieps/VIEPS_Management_Tasks.md)

Defines repeatable production Worker management tasks.

## Application requirement

[VIEPS FQDN Requirements](../../../5-Implementation-Projects/base/application-platform/application/jagports/vieps/FQDN_requirements.md)

Defines the application-level `vieps.jagports.fi` requirement independently of Cloudflare implementation.

## Execution rule

Use the most specific procedure for the operation being performed.

```text
Cloudflare account
        |
        +--> GitHub integration
        |
        +--> Worker deployment
        |
        +--> D1 deployment
        |       |
        |       +--> migrations
        |
        +--> VIEPS testing
        |
        +--> production management
```

Each operation must be independently recorded as `EXECUTED` and then `VERIFIED`.

GitHub Issues and Pull Requests remain the authoritative task and traceability system.
