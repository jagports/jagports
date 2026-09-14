# Tailwind CSS 4.1.13 source package record

This directory is the Jagports versioned source/documentation snapshot for Tailwind CSS `4.1.13` and `@tailwindcss/cli` `4.1.13`.

## Upstream provenance

- Repository: `tailwindlabs/tailwindcss`
- Tag: `v4.1.13`
- Release commit: `1334c99`
- Release page: `https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.1.13`
- Source tarball endpoint: `https://api.github.com/repos/tailwindlabs/tailwindcss/tarball/v4.1.13`
- Source zip endpoint: `https://api.github.com/repos/tailwindlabs/tailwindcss/zipball/v4.1.13`
- License: MIT

## Mirrored material

The repository mirror stores the upstream license and user-facing README together with the package metadata and source/package entry points relevant to the VIEPS build:

```text
LICENSE
UPSTREAM_README.md
tailwindcss/README.md
tailwindcss/package.json
tailwindcss/index.css
tailwindcss/preflight.css
tailwindcss/utilities.css
@tailwindcss-cli/README.md
@tailwindcss-cli/package.json
@tailwindcss-cli/src/index.ts
```

These files are copied from the exact upstream `v4.1.13` tag. They provide an auditable local record of the selected source/package version and its documentation.

## Runtime/build boundary

This mirror is a development/library reference. The production browser must not load resources from this directory or any Tailwind CDN. The Worker build uses the pinned Tailwind packages from its local Node dependency set to compile `styles/vieps-tailwind.css` into the VIEPS-owned `public/vieps-tailwind.css` asset.

If the selected Tailwind version changes, add a new version directory rather than overwriting this one, and update the VIEPS dependency pin and documentation in the same reviewed change.
