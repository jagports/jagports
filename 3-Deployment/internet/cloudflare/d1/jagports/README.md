# Jagports Cloudflare D1

## Purpose

This directory contains the repository-controlled Cloudflare D1 material for the Jagports VIEPS application database and the JEPC **parts databases** partitioned by configured vehicle Range.

The two database roles are distinct:

```text
jagports
  -> fixture-backed / operational application database
  -> mutable STOCK and application state

parts-<range_slug>
  -> imported JEPC/EPC parts database
  -> catalogue/reference data for one configured vehicle Range
```

A Range is application configuration used to select a parts database. A Range is not a database type.

## Parts database identity contract

The repository-controlled setup utility is:

```text
3-Deployment/internet/cloudflare/d1/jagports/setup-range-db.mjs
```

It creates or verifies a parts database identity only.

Database names are derived deterministically from an accepted stable VIEPS Range slug:

```text
<range_slug> -> parts-<range_slug>
xk           -> parts-xk
f-type       -> parts-f-type
```

The command validates Range-slug syntax but does not decide whether a JEPC model belongs to that Range.

Database creation is separate from:

- parts schema initialization and verification;
- Worker D1 binding;
- configured Range -> binding routing;
- JEPC catalogue import;
- Search Index publication;
- runtime publication.

The Worker migration chain under `4-Production/internet/cloudflare/workers/jagports/migrations/` contains application/fixture behavior and must not be applied wholesale to a parts database.

The fixture-backed `jagports` database remains separate from `parts-<range_slug>` databases.

## Documentation

- [OPERATIONS.md](OPERATIONS.md) — prerequisites, planning, creation, verification, recovery, and local test commands.
- [Jagports D1 deployment](CloudFlareGit_DB_Deployment.md) — D1 resource deployment and binding procedure.
- [Jagports D1 migrations](CloudFlareGit_DB_Migrations.md) — migration procedure.

Canonical VIEPS D1 topology and domain semantics remain in the VIEPS MODEL/SPEC documents. This README does not redefine those contracts.
