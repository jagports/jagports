# Jagports Application

This directory contains the production VIEPS application.

## Local development

Requirements:

- Node.js
- npm
- Cloudflare Wrangler

From this directory:

```text
npm install
npm test
npm run dev
```

## Production architecture

The application runs as a public Cloudflare Worker and uses Cloudflare D1 for persistent application data.

```text
Public Internet
      |
      v
Cloudflare Worker: jagports
      |
      v
Cloudflare D1: jagports
```

Public users may access public/read functionality.

Stock add/modify operations require administrator authentication and authorization. The accepted administrator implementation is tracked in [Issue #448 — Implement public VIEPS access with administrator stock authorization](https://github.com/jagports/jagports/issues/448).

The whole public application must not be protected by Cloudflare Access.

## Cloudflare setup

Worker deployment procedure:

```text
3-Deployment/internet/cloudflare/workers/jagports/Jagports_CloudFlareGit_App_Deployment.md
```

D1 deployment procedure:

```text
3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Deployment.md
```

Execution runbook:

```text
3-Deployment/internet/cloudflare/worker/Jagports_CloudFlareGit_Integration_Deployment_Execution.md
```

## D1 configuration

The production Wrangler configuration is:

```text
wrangler.toml
```

It contains the D1 `DB` binding and production database identifier.

A real production database ID must be established through a reviewed configuration change. The placeholder database ID must not be deployed.

Remote migrations are applied explicitly:

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
```

## Administrator security

The initial administrator identity is:

```text
parts@jagports.fi
```

No Google/Microsoft external identity provider is selected at this stage.

The administrator password must be handled using secure password-hash/credential storage. Plaintext passwords and password hashes must never be committed to GitHub, documentation, Issues, Pull Requests, logs, or build output.

The current code still contains the transitional `ADMIN_TOKEN`/`x-admin-token` authorization mechanism. Do not treat that as the final administrator login until Issue #448 is reviewed, tested, and merged.

## Current limitations

- The part table is ready for JEPC import but does not contain the complete JEPC catalogue.
- VIN decoding is represented by vehicle context storage; the complete source-backed decoder is a later implementation layer.
- The accepted public/admin authorization model is pending implementation under Issue #448.
- The production hostname `vieps.jagports.fi` is not yet verified. Cloudflare Worker Custom Domains require an active Cloudflare zone, and Worker Routes require DNS to be proxied through Cloudflare; the external-DNS-only requirement therefore remains an unresolved deployment prerequisite.

## Data safety

Never commit production inventory data, passwords, password hashes, API tokens or Cloudflare credentials to GitHub.
