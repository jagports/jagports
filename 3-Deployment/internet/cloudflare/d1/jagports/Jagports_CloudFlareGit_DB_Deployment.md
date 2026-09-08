# Jagports Cloudflare D1 Database Deployment

## Purpose

Deployment procedure for the Jagports production D1 database used by the VIEPS application.

D1 is a separate Cloudflare resource from the Worker. The Worker depends on D1 through the Wrangler `DB` binding, but database creation, schema migration, verification, and recovery are separate operational concerns.

The production D1 representation is:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/
```

The VIEPS implementation project remains technology-independent under:

```text
5-Implementation-Projects/base/application-platform/application/jagports/vieps/
```

## Repository structure

```text
3-Deployment/internet/cloudflare/d1/jagports/
    └── Jagports_CloudFlareGit_DB_Deployment.md

4-Production/internet/cloudflare/d1/jagports/vieps/
    └── production D1 deployment representation

4-Production/internet/cloudflare/workers/jagports/vieps/
    └── production Worker deployment representation

5-Implementation-Projects/base/application-platform/application/jagports/vieps/
    └── technology-independent VIEPS implementation project
```

The production tree represents the deployed technology/resource. The implementation project is deliberately kept independent of Cloudflare.

## Database

Recommended production database name:

```text
jagports
```

The actual Cloudflare D1 database ID is environment configuration. It is not a password or API token, but it must be recorded through a reviewed repository change when inserted into the production Wrangler configuration.

## Relationship to the Worker

The production Worker configuration contains the D1 binding:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/wrangler.toml
```

The D1 production resource is represented separately:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/
```

The Worker and D1 are deployed and verified separately:

```text
Worker deployment
      |
      +--> DB binding
              |
              v
          D1 database
              |
              v
       migration state
```

A successful Worker deployment does not prove that production D1 migrations have been applied.

## Cloudflare account

The accepted account decision is:

- Create a new Jagports Cloudflare account.
- Use `parts@jagports.fi` as the organizational account contact/initial identity.
- Enable 2FA.
- Store recovery information outside GitHub.

Never record account passwords, recovery codes, API tokens, or other secret values in this document.

## Create the database

After Wrangler authentication has been established:

```text
npx wrangler login
npx wrangler whoami
```

Create the production database when it does not already exist:

```text
npx wrangler d1 create jagports
```

Record the returned production database ID through a reviewed repository change to the production Worker configuration:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/wrangler.toml
```

Do not replace the production database ID with a development or placeholder ID.

## Migration source

The migration directory belongs to the production D1 representation:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/migrations/
```

Migration files are the authoritative schema change history for the deployed application.

Before applying a production migration:

1. Review the SQL.
2. Confirm the target database and Cloudflare account.
3. Confirm application compatibility.
4. Inspect remote migration state.
5. Apply only the required migrations.
6. Verify the resulting migration state.
7. Record the operation in the execution record.

## Inspect remote migration state

```text
npx wrangler d1 migrations list jagports --remote
```

Do not infer migration state from a Worker deployment result.

## Apply migrations

```text
npx wrangler d1 migrations apply jagports --remote
```

Production schema changes should prefer compatible expand/migrate/contract patterns. Avoid destructive changes unless the recovery/data-impact plan has been explicitly established.

## Verification

After applying migrations, verify:

- the intended Cloudflare account was used;
- the intended production database was used;
- the expected migration files are present in the production D1 representation;
- remote migration state contains the required migrations;
- the Worker `DB` binding points to the intended database;
- the application can read required data;
- authorized stock operations persist correctly;
- rollback/recovery implications are understood.

## Public VIEPS access model

The database is behind the application. Public Internet users may access public/read functionality through VIEPS, but they must not be able to mutate stock data.

Only authenticated/authorized administrators may add or modify stock data.

The initial administrator application identity is:

```text
parts@jagports.fi
```

No Google/Microsoft external identity provider is selected at this stage.

The administrator password must be represented by a secure password hash in the application security design. Neither the plaintext password nor its hash belongs in this repository documentation. Any operational secret required by the Worker should be stored as a Cloudflare secret.

## Backup and rollback considerations

Worker rollback and D1 schema rollback are separate operations.

Do not assume that deploying an earlier Worker version reverses a D1 migration.

For destructive or high-risk schema changes, define a data recovery procedure before production execution.

## Execution record

This document describes the procedure. It does not claim live execution.

Record actual operations using:

```text
Date/time:
Operator:
Environment: production
Operation:
Interface: UI | CLI
Status: RESEARCHED | EXECUTED | VERIFIED | BLOCKED
Command / dashboard action:
Result:
Verification:
Deviation / decision:
```

Never record passwords, password hashes, recovery codes, API tokens, or secret values.

## Official Cloudflare references

- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Wrangler D1 commands: https://developers.cloudflare.com/d1/wrangler-commands/
- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
