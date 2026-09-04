# Jagports Application MVP

This directory contains the first full-stack MVP vertical slice proposed in Issue #280.

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

## Application data

The application uses Cloudflare D1 for persistent data when deployed. The schema and migrations in this directory define the application data model.

## Current limitations

- The part table is ready for JEPC import but does not contain the complete JEPC catalogue.
- VIN decoding is represented by vehicle context storage; the complete source-backed decoder is a later implementation layer.
- The initial admin token is a simple MVP application mechanism, not a multi-user identity system.
- Stock update/delete endpoints are API-ready; the first UI focuses on create/search and can be expanded after review.

## Deployment

Deployment knowledge and deployment procedures are maintained under `3-Deployment/github-cloudflare-free/`.

## Data safety

Never commit production inventory data, API tokens or Cloudflare credentials to GitHub.
