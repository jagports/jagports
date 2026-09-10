# VIEPS Deployment-1 — Cloudflare Runtime Foundation

This implementation record belongs to Issue #497 and establishes the repository-side foundation for the first real VIEPS runtime.

## Boundary

- Worker name: `vieps`.
- The production deployment configuration reuses the existing Jagports application source and static assets.
- The Worker uses the D1 binding name `DB` and database name `jagports`.
- The D1 resource is declared without a fabricated ID so Cloudflare/Wrangler can provision or identify the real resource during deployment.

## Deployment gate

Repository configuration is not evidence of a live Cloudflare Worker or D1 resource. Actual provisioning, deployment, binding verification and endpoint verification must be recorded separately before Issue #497 is considered complete.

## Related issues

- Parent: #496
- D1 foundation: #498
- API path: #499
