# Jagports MVP — GitHub + Cloudflare Free Deployment

## Purpose

Deployment knowledge and deployment procedures for the Jagports Application MVP.

The application itself is production code under `4-Production/application/jagports-mvp/`. This document belongs under `3-Deployment/` because it describes how that product is deployed and operated.

## Runtime

```text
Browser
  |
  v
Cloudflare Access
  |
  v
Cloudflare Worker
  |---- Static Assets
  +---- /api/*
           |
           v
        Cloudflare D1
```

## GitHub role

GitHub is the source-control, Issue, Pull Request and review system. Connect the repository to Cloudflare's Git integration for deployment. Do not use GitHub repository files as the mutable stock inventory database.

## Cloudflare Free foundation

The initial $0 deployment uses:

- Workers + Static Assets for the web application and API.
- D1 for persistent application data.
- Cloudflare Access as the authenticated outer boundary for the private application.

The MVP should remain within the available Free-tier envelope where practical. Verify current Cloudflare limits before production rollout rather than treating documented limits as permanent.

## Deployment procedure

1. Create/configure the Cloudflare Worker application.
2. Connect `jagports/jagports` using Cloudflare Git integration.
3. Configure the Worker project root as `4-Production/application/jagports-mvp/`.
4. Create a D1 database for the MVP.
5. Configure the database binding expected by `wrangler.toml`.
6. Apply the committed D1 migration.
7. Configure `ADMIN_TOKEN` as a Cloudflare secret; never commit it.
8. Configure a Cloudflare Access application in front of the deployed Worker.
9. Require authentication for the private application/API.
10. Deploy.
11. Verify unauthenticated requests are rejected by Access.
12. Verify authenticated health, part search and stock CRUD.
13. Verify inventory survives redeployment.

## Security rules

- Cloudflare Access is required before real inventory is exposed.
- `ADMIN_TOKEN` is an MVP application-level authorization mechanism, not a replacement for Access.
- Secrets must be configured through Cloudflare secret management and never committed to GitHub.
- Production inventory data must not be committed to the repository.
- Before accepting real inventory, test both unauthenticated and authenticated paths.

## Rollback

A bad application deployment must be reversible through the Cloudflare deployment/version mechanism. Database migrations must be reviewed for compatibility before deployment; do not assume application rollback can safely reverse an already-applied destructive schema change.

## Acceptance checklist

- [ ] GitHub source connected to Cloudflare.
- [ ] Worker project root is correct.
- [ ] D1 binding is configured.
- [ ] Migration applied.
- [ ] Secrets configured outside Git.
- [ ] Cloudflare Access enabled.
- [ ] Unauthenticated access rejected.
- [ ] Authenticated health check passes.
- [ ] Part lookup passes.
- [ ] Stock create/search/update/delete passes.
- [ ] Inventory persistence verified.
- [ ] Rollback path understood.

## Separation of concerns

```text
5-Products-projects/
  Product development

3-Deployment/
  Deployment knowledge and procedures

4-Production/base/
  Production foundation/runtime components

4-Production/application/
  Production application implementation
```

The deployment procedure must not be duplicated as the authoritative version inside the production application directory.
