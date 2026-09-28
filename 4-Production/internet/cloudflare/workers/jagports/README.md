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
      |-- operational stock and TEST=1 fixture catalogue --> D1: jagports
      `-- parts data selected by configured Range --> D1: parts-<range_slug>
```

`?TEST=1` and `?test=1` (case-insensitive parameter name; value exactly `1`) activate synthetic catalogue and Fit fixtures without an environment feature flag. Search results, Parts Tree and Admin part lookup preserve this selection; conflicting duplicate TEST parameters are treated as real mode, never as an implicit fixture opt-in. The Fit endpoint uses the existing source-qualified D1 test mappings when available, or its clearly marked, embedded synthetic fallback linked only to existing fixture PARTs. Normal URLs use the reviewed parts database through `js/parts.js`; the configured Range selects the parts database binding. An absent parts database binding produces a parts-database error, while missing normalized JEPC fit remains an independent state. A real PART catalogue and its verified Fit data are different publication requirements: real mode must use verified source-qualified mappings when present and must never fall back to test data.

The later production Worker identity is `jagports`. It is reserved for the production phase and is not established by this pre-production configuration.

## VIEPS UI styling

The VIEPS frontend uses **local Tailwind CSS** as a build-time dependency. Pico CSS is not part of the runtime styling path.

Tailwind and `@tailwindcss/cli` are installed as pinned project dependencies. They are invoked from this project's local Node dependency set during the build; the browser does not load Tailwind from a CDN, remote stylesheet, remote script, or other runtime third-party Tailwind source.

The selected Tailwind version also has a repository-owned, versioned source/documentation mirror at:

```text
6-Development/libraries/css/tailwind/4.1.13/
```

That library mirror records the upstream release/tag provenance, MIT license, package metadata, user documentation, package/CSS entry points, and CLI source reference for the exact version used by VIEPS. It is retained for auditability and future upgrades; it is not a second browser/runtime styling path.

Source styling is maintained in:

```text
styles/vieps-tailwind.css
```

The local Tailwind CLI compiles that source to the VIEPS-owned static Worker asset:

```text
public/vieps-tailwind.css
```

`public/index.html` references that local generated stylesheet directly.

`npm run build:css` performs the CSS build. Both `npm run dev` and `npm run deploy` execute the CSS build before starting Wrangler, so local development and Cloudflare deployment use the same generated asset.

The Tailwind package versions are pinned exactly through `package.json`. The Concept-11 visual/layout reference is maintained under the VIEPS UI concept documentation; implementation must preserve VIEPS data and interaction contracts rather than infer unsupported behavior from the visual alone.

The default desktop layout also preserves the fitted-viewport behavior established by PR #616: page-level scrolling is suppressed in the normal desktop shell and long content scrolls inside its permanent VIEPS regions; narrower layouts restore normal page scrolling.

## Cloudflare endpoint

The current pre-production Worker is intended to use the Worker-provided `workers.dev` endpoint. The exact account subdomain and resulting hostname must be established from actual Cloudflare deployment evidence; documentation must not infer it from the Worker name alone.

A future public hostname such as `vieps.jagports.fi` is a separate DNS/hostname decision and must not be treated as operational until independently verified.

## Worker configuration

The Wrangler configuration is in this directory:

```text
4-Production/internet/cloudflare/workers/jagports/wrangler.toml
```

The configuration uses local paths for the Worker entry point, public assets, and D1 migrations. No `/base` path is deployed.

The checked-in JavaScript source is maintained in `js/`. See `scripts/build-js-assets.mjs` for the browser asset build and [`SPEC/URL.md`](../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/URL.md) for TEST-mode behavior. Parts database provisioning is governed by #980 and the `3-Deployment/internet/cloudflare/d1/parts/` implementation. Range remains application configuration, not a database type.

## Administrator security

The current application may still contain the transitional `ADMIN_TOKEN`/`x-admin-token` mechanism. It must not be treated as the final administrator login until Issue #448 is reviewed, tested, and merged.

Current setup instructions for the transitional token, including the required Worker-directory `cd`, Windows PowerShell token generation, Wrangler secret configuration, verification, and VIEPS Authorization-field usage, are maintained in:

```text
3-Deployment/internet/cloudflare/workers/jagports/CloudFlareGit_App_Deployment.md#transitional-administrator-token-setup
```

No credentials, password hashes, tokens, or secret values belong in this directory.
