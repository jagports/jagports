# VIEPS Cloudflare Worker pre-production

This directory is the Cloudflare Worker deployment representation for VIEPS pre-production.

The Worker identity is `vieps`. The directory name is `jagports` because the repository production hierarchy is organized by the later production Worker identity; `vieps` is not a directory level.

## Responsibilities

- VIEPS Worker runtime and deployment configuration;
- static application assets;
- D1 migration files used by this Worker;
- Worker-specific operational documentation and tests.

The obsolete `/base` hierarchy is not a runtime or deployment dependency and must not be referenced by this Worker.

The deployment procedure is documented under:

```text
3-Deployment/internet/cloudflare/workers/jagports/CloudFlareGit_App_Deployment.md
```

The D1 production representation is separate:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/
```

## Architecture

```text
Public Internet
      |
      v
Cloudflare Worker: vieps (pre-production)
      |
      v
Cloudflare D1: jagports
```

The later production Worker identity is `jagports`. It is reserved for the production phase and is not established by this pre-production configuration.

## Cloudflare endpoint

The current pre-production Worker is intended to use the Worker-provided `workers.dev` endpoint. The exact account subdomain and resulting hostname must be established from actual Cloudflare deployment evidence; documentation must not infer it from the Worker name alone.

A future public hostname such as `vieps.jagports.fi` is a separate DNS/hostname decision and must not be treated as operational until independently verified.

## Worker configuration

The Wrangler configuration is in this directory:

```text
4-Production/internet/cloudflare/workers/jagports/wrangler.toml
```

The configuration uses local paths for the Worker entry point, public assets, and D1 migrations. No `/base` path is deployed.

Worker deployment and D1 migration application remain separate operational steps.

## Administrator security

The current application may still contain the transitional `ADMIN_TOKEN`/`x-admin-token` mechanism. It must not be treated as the final administrator login until Issue #448 is reviewed, tested, and merged.

No credentials, password hashes, tokens, or secret values belong in this directory.
