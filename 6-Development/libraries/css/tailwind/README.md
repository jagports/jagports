# Tailwind CSS local library mirror

This directory stores the repository-owned reference copy for the Tailwind CSS version used by VIEPS.

## Active version

- Tailwind CSS: `4.1.13`
- `@tailwindcss/cli`: `4.1.13`
- Upstream tag: `v4.1.13`
- Upstream release commit: `1334c99`
- License: MIT

Versioned material is stored under:

```text
6-Development/libraries/css/tailwind/4.1.13/
```

The VIEPS runtime must not load Tailwind from a CDN or other remote runtime source. VIEPS compiles Tailwind locally during the project build and serves the generated stylesheet as a VIEPS-owned static asset.

The files in this development-library directory are a durable, versioned source/documentation reference for the exact Tailwind release selected by VIEPS. They are not a second runtime styling path.

See `4.1.13/SOURCE_PACKAGE.md` for provenance and `4.1.13/USER_GUIDE.md` for local VIEPS usage.
