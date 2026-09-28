# Tailwind CSS 4.1.13 — VIEPS local usage

## Purpose

VIEPS uses Tailwind CSS locally at build time. The browser must receive only the generated VIEPS-owned CSS asset and must not load Tailwind from a CDN or remote runtime script.

## Version

```text
tailwindcss        4.1.13
@tailwindcss/cli   4.1.13
```

## VIEPS source and output

Input:

```text
4-Production/internet/cloudflare/workers/jagports/styles/vieps-tailwind.css
```

Generated output:

```text
4-Production/internet/cloudflare/workers/jagports/public/vieps-tailwind.css
```

Build command from the Worker directory:

```text
npm run build:css
```

Local development and deployment commands build CSS first:

```text
npm run dev
npm run deploy
```

## Rules

1. Keep Tailwind and `@tailwindcss/cli` pinned to the same reviewed version.
2. Do not introduce Tailwind CDN links, browser runtime loaders, or other remote Tailwind resources.
3. Keep the generated stylesheet under the Worker `public/` assets so local development and Cloudflare deployment serve the same file.
4. Keep Jagports/VIEPS design tokens and reusable component abstractions in `styles/vieps-tailwind.css` rather than scattering unrelated one-off styling.
5. Preserve the Concept-11 layout direction and the viewport-fit behavior inherited from PR #616.
6. When upgrading Tailwind, create a new versioned directory under `6-Development/libraries/css/tailwind/`, retain this version for historical reference, and update package pins, provenance, and tests together.

## Upstream reference

The local source/documentation mirror for this version is stored beside this guide. `SOURCE_PACKAGE.md` records the exact upstream tag and release commit.
