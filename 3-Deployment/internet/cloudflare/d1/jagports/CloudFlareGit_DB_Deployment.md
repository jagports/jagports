# Cloudflare D1 Deployment

## Purpose

Create or reuse the Jagports D1 database and configure its application binding without blindly creating duplicates.

## Operator environment

Open Windows Terminal using PowerShell or Git Bash at the Jagports repository root:

```text
jagports/jagports/
```

## Prerequisite state test

Authenticate first:

```text
npx wrangler whoami
```

List existing databases before any create operation:

```text
npx wrangler d1 list
```

Find the intended database by name (`jagports`). If it exists, reuse its database ID. Do not run `npx wrangler d1 create jagports` again.

If it does not exist, create it once:

```text
npx wrangler d1 create jagports
```

Record the returned database ID in the approved deployment configuration mechanism, not in credentials or ad-hoc execution notes.

## Binding

The Worker configuration uses the D1 binding name `DB` and database name `jagports`. The database ID is an environment-specific configuration value and must be supplied through the approved configuration mechanism.

## Verification

After configuration, list the database again and verify that the intended `jagports` database exists. D1 creation does not prove that migrations have been applied; migration is a separate repeatable task.

## Credentials

Never store Cloudflare API tokens, passwords or recovery credentials in GitHub. Wrangler obtains authentication through its supported credential mechanism.
