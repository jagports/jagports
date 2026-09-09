# Cloudflare Git-integrated VIEPS Worker Deployment

## Purpose

Deploy and verify the VIEPS Worker through the configured Cloudflare Workers deployment path.

## Operator environment

Open Windows Terminal using PowerShell or Git Bash at the Jagports repository root:

```text
jagports/jagports/
```

The actual Worker source/configuration directory is the project directory selected by the Cloudflare Git integration. Do not invent a second Worker project.

## Configuration

The Worker configuration is a `wrangler.toml` file owned by the Worker project. The configuration must define the Worker name and deployment settings. For pre-production, the Workers hostname is enabled with:

```toml
workers_dev = true
```

The configuration file is not a credential store. D1 IDs and other environment-specific values must be supplied through the approved configuration/secret mechanism.

## Git-integrated deployment

Production deployment uses reviewed `main` through Cloudflare Workers Builds. Do not use a direct deployment as the normal production path.

## CLI validation

From the configured Worker project:

```text
npx wrangler whoami
npx wrangler deploy --dry-run
```

The dry run must complete successfully before an actual deployment is attempted.

For an explicitly recorded bootstrap/fallback operation only:

```text
npx wrangler deploy
```

## Preview/version deployment

For non-production branches use the configured preview/version mechanism:

```text
npx wrangler versions upload
```

Keep production on `main`. Preview validation must not modify production state.

## Verification

Verify the deployed Worker name and endpoint through the task-specific address procedure. A successful Wrangler deployment alone does not prove application functionality or administrator authorization.

## Credentials

Never commit API tokens, passwords or other secrets. Wrangler authentication obtains credentials through its supported login/credential mechanism.
