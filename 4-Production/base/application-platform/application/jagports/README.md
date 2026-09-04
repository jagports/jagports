# Jagports Application

This directory contains the first full-stack application vertical slice proposed in Issue #280.

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

## Cloudflare setup

1. Create a D1 database named `jagports`.
2. Put its ID into `wrangler.toml`.
3. Apply the migration:

```text
npx wrangler d1 migrations apply jagports --remote
```

4. Create the admin secret:

```text
npx wrangler secret put ADMIN_TOKEN
```

5. Deploy:

```text
npm run deploy
```

6. Protect the deployed application with Cloudflare Access before using real inventory.

## Application data

The application uses Cloudflare D1 for persistent data when deployed. The schema and migrations in this directory define the application data model.

## Current limitations

- The part table is ready for JEPC import but does not contain the complete JEPC catalogue.
- VIN decoding is represented by vehicle context storage; the complete source-backed decoder is a later implementation layer.
- The initial admin token is a simple application mechanism, not a multi-user identity system.
- Stock update/delete endpoints are API-ready; the first UI focuses on create/search and can be expanded after review.

## Deployment

Deployment knowledge and deployment procedures are maintained under `3-Deployment/github-cloudflare-free/`.

## Data safety

Never commit production inventory data, API tokens or Cloudflare credentials to GitHub.
