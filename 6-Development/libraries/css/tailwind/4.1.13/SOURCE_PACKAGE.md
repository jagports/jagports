# Tailwind CSS 4.1.13 source package record

This directory is the Jagports versioned source/package and documentation snapshot for Tailwind CSS `4.1.13` and `@tailwindcss/cli` `4.1.13`.

## Upstream provenance

- Repository: `tailwindlabs/tailwindcss`
- Tag: `v4.1.13`
- Release commit: `1334c99`
- Release page: `https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.1.13`
- GitHub source tarball endpoint: `https://api.github.com/repos/tailwindlabs/tailwindcss/tarball/v4.1.13`
- GitHub source zip endpoint: `https://api.github.com/repos/tailwindlabs/tailwindcss/zipball/v4.1.13`
- npm package archive: `https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.1.13.tgz`
- npm package integrity: `sha512-i+zidfmTqtwquj4hMEwdjshYYgMbOrPzb9a0M3ZgNa0JMoZeFC6bxZvO8yr8ozS6ix2SDz0+mvryPeBs2TFE+w==`
- License: MIT

## Local versioned material

The repository mirror stores the release license, user documentation, package metadata, and source/package entry points relevant to the VIEPS Tailwind build:

```text
LICENSE
UPSTREAM_README.md
USER_GUIDE.md
tailwindcss/README.md
tailwindcss/package.json
tailwindcss/index.css
tailwindcss/preflight.css
tailwindcss/utilities.css
@tailwindcss-cli/README.md
@tailwindcss-cli/package.json
@tailwindcss-cli/src/index.ts
```

The package manifests and selected package entry points are copied from the exact upstream `v4.1.13` release. `USER_GUIDE.md` and the local README files add Jagports/VIEPS usage and provenance context around that upstream material.

The upstream source/archive endpoints and npm archive integrity are retained here so the complete release can be independently re-fetched and verified when needed. The checked-in tree intentionally keeps the human-auditable source/package and documentation material needed by this repository rather than making the production browser depend on a package archive.

## Runtime/build boundary

This mirror is a development/library reference. The production browser must not load resources from this directory or any Tailwind CDN. The Worker build uses the pinned Tailwind packages from its local Node dependency set to compile `styles/vieps-tailwind.css` into the VIEPS-owned `public/vieps-tailwind.css` asset.

If the selected Tailwind version changes, add a new version directory rather than overwriting this one, and update the VIEPS dependency pin, provenance record, documentation, and tests in the same reviewed change.
