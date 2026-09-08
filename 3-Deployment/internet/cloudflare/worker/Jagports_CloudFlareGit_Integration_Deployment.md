# Jagports Cloudflare Git Integration Deployment

## Purpose

Deployment knowledge and deployment procedures for the Jagports application.

The application implementation is under `4-Production/application/`. This document belongs under `3-Deployment/` because it describes how that product is deployed and operated.

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

## Deployment procedure

1. Connect `jagports/jagports` to Cloudflare Git integration.
2. Configure the Worker project root as the application implementation directory.
3. Create/configure the D1 database and binding.
4. Apply the committed migration.
5. Configure `ADMIN_TOKEN` as a Cloudflare secret; never commit secrets.
6. Configure Cloudflare Access in front of the Worker and require authentication.
7. Deploy.
8. Verify unauthenticated requests are rejected.
9. Verify authenticated health, part lookup and stock CRUD.
10. Verify inventory persists across redeployment.

## Security

Cloudflare Access is required before real inventory is exposed. `ADMIN_TOKEN` is an application-level authorization mechanism and does not replace Access. Production inventory and credentials must never be committed to GitHub.

## Rollback

Use the Cloudflare deployment/version mechanism for application rollback. Review database migrations for compatibility before deployment; do not assume an application rollback reverses destructive schema changes.

## Acceptance checklist

- [ ] GitHub source connected to Cloudflare.
- [ ] Worker root correct.
- [ ] D1 binding configured and migration applied.
- [ ] Secrets configured outside Git.
- [ ] Cloudflare Access enabled.
- [ ] Unauthenticated access rejected.
- [ ] Authenticated health, part lookup and stock CRUD verified.
- [ ] Inventory persistence verified.
- [ ] Rollback path understood.

## Separation of concerns

```text
5-Products-projects/       Product development
3-Deployment/              Deployment knowledge and procedures
4-Production/base/         Production foundation/runtime
4-Production/application/  Production application implementation
```
