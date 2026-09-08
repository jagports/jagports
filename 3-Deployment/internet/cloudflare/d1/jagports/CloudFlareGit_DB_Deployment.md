# Jagports Cloudflare D1 Database Deployment

## Purpose

Create and configure the Jagports production D1 database used by VIEPS.

D1 is a separate Cloudflare resource from the Worker. Database creation, Worker binding, schema migration, verification, and recovery are separate operational tasks.

## Production representation

```text
4-Production/internet/cloudflare/d1/jagports/vieps/
```

## Account prerequisite

Cloudflare account creation and authentication are defined once in:

```text
3-Deployment/internet/cloudflare/CloudFlare_Account_Setup.md
```

Do not repeat account creation or credentials here.

## CLI execution

Open Windows Terminal using PowerShell or Git Bash at:

```text
jagports/jagports/
```

Verify authentication:

```text
npx wrangler whoami
```

## Verify before create

Do not blindly create a database. First determine whether the intended production D1 database already exists in the authenticated account.

Use the current Wrangler D1 listing command supported by the installed Wrangler version, then compare the database name/ID with the reviewed production configuration.

If the intended database already exists, reuse it and do not create a duplicate.

If it does not exist, create it:

```text
npx wrangler d1 create jagports
```

Record the returned database ID through a reviewed repository change. Do not store credentials or tokens in the repository.

## Worker binding

The Worker configuration that consumes the database is:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/wrangler.toml
```

The D1 production representation is separate:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/
```

Verify that the Worker `DB` binding references the intended production database ID before deployment.

## Migration separation

Schema changes are not part of database creation. Use the separate migration procedure:

```text
3-Deployment/internet/cloudflare/d1/jagports/CloudFlareGit_DB_Migrations.md
```

A new migration does not require recreating the database.

## Verification

Verify:

- authenticated account is the intended Jagports Cloudflare account;
- intended D1 database exists and is not duplicated;
- production database ID is recorded in the reviewed Worker configuration;
- Worker `DB` binding points to that database;
- migration state is verified separately by the migration task.

Use CLI/API verification first. Use the Cloudflare dashboard only when the required information is not available through the supported CLI/API.

## Recovery

Cloudflare account access is restored through the approved credential-management/recovery process. API tokens and secrets are supplied to CLI/API tools from that system when needed.

Do not record passwords, recovery codes, API tokens, or secret values here.

## Official references

- Wrangler D1 commands: https://developers.cloudflare.com/d1/wrangler-commands/
- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
