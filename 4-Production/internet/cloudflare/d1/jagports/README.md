# Jagports D1 production runtime

This directory records the production/runtime representation for Jagports D1 resources. It describes which database serves the VIEPS application. Cloudflare account checks, database creation, schema application, migrations, and operator commands are maintained under `3-Deployment/internet/cloudflare/d1/`.

## Runtime resources

The operational D1 database `jagports` stores VIEPS stock and fixture data. JEPC catalogue parts are stored separately in the approved Range parts database named `parts-<approved_range_slug>`, such as `parts-xk`. The reviewed source-group-to-Range mapping determines which parts database serves an imported model.

The current pre-production Worker identity is `vieps`; its checked-in runtime configuration is under `4-Production/internet/cloudflare/workers/jagports/`. The later production Worker identity is `jagports` and must use the reviewed production D1 bindings for its deployment phase.

## Runtime behavior and data safety

The Worker reads operational stock and fixture data from `jagports` and reads real JEPC catalogue data from the matching parts database. A website `TEST=1` request selects fixture behavior according to the Worker URL contract; it does not change DataImporter behavior or database setup.

Production runtime configuration must use verified D1 database IDs and must not contain placeholder IDs or credentials. Production inventory data and Cloudflare secrets do not belong in Git.

## Deployment and verification references

The operational database deployment and migration procedures are in [3-Deployment/internet/cloudflare/d1/jagports](../../../../../3-Deployment/internet/cloudflare/d1/jagports/). JEPC parts database setup and operation are in [3-Deployment/internet/cloudflare/d1/OPERATIONS.md](../../../../../3-Deployment/internet/cloudflare/d1/OPERATIONS.md), governed by [SPEC_DATABASES.md](../../../../../3-Deployment/internet/cloudflare/d1/SPEC_DATABASES.md).

Runtime verification must establish that the Worker is bound to the intended D1 databases and can read the expected operational or parts data. Deployment records must separately confirm schema and migration state. The deployment guides define the commands and evidence used for those checks.
