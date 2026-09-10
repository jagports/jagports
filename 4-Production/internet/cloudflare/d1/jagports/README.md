# VIEPS Cloudflare D1 production

This directory represents the production VIEPS database deployment as a Cloudflare D1 resource.

## Responsibilities

- production D1 deployment representation;
- production migration files;
- D1-specific operational and recovery references;
- migration-state verification records where appropriate.

The VIEPS implementation knowledge and specifications are maintained under:

```text
5-Implementation-Projects/internet/cloudflare/jagports/
```

The D1 deployment procedure is documented under:

```text
3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Deployment.md
```

The Worker production/runtime representation is separate:

```text
4-Production/internet/cloudflare/workers/jagports/
```

The current pre-production Worker identity is `vieps`. The later production Worker identity is `jagports`.

## Production architecture

The VIEPS Worker uses this D1 resource for persistent application data.

```text
Cloudflare Worker: vieps (pre-production)
      |
      v
Cloudflare D1: jagports
```

The Worker deployment and D1 migration application are separate operational steps. A successful Worker deployment does not prove that production D1 migrations were applied.

## D1 configuration and migrations

The production Worker configuration must bind to the intended production D1 database.

A real production database ID must be established through a reviewed configuration change. A placeholder database ID must not be deployed.

D1 migrations are repository-controlled and must be explicitly applied and verified against the remote production database:

```text
npx wrangler d1 migrations list jagports --remote
npx wrangler d1 migrations apply jagports --remote
```

The migration state must be checked after application and recorded as part of production deployment verification.

## Data safety

Production inventory data must not be committed to GitHub.

No production passwords, password hashes, tokens, API credentials, or other secret values belong in this directory.

Administrator authentication is an application concern implemented by the Worker. No external Google/Microsoft identity provider is selected at this stage.

## Verification

Production verification must establish:

- the Worker is bound to the intended D1 resource;
- expected migrations are present remotely;
- required migrations have been applied successfully;
- the Worker can perform the required application data operations;
- no production secret values are stored in the repository.
