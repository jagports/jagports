# Jagports Cloudflare GitHub Integration Setup

## Purpose

Connect Cloudflare Workers Builds to the private GitHub repository `jagports/jagports`.

This document covers the GitHub-to-Cloudflare connection. Worker configuration and D1 deployment are separate procedures.

## Initial UI operation

Cloudflare dashboard:

https://dash.cloudflare.com/

1. Open **Workers & Pages**.
2. Create the Worker from Git, or select the existing Worker.
3. For an existing Worker open **Settings -> Builds -> Connect**.
4. Select GitHub.
5. Authorize the Cloudflare Workers & Pages GitHub App for the `jagports` organization.
6. When GitHub asks for repository access, select **Only select repositories** where available.
7. Select exactly `jagports/jagports`.
8. Return to Cloudflare and select the repository.

For an organization installation, the GitHub user performing the installation must have the organization authority required by GitHub for GitHub App installation.

There is no Wrangler command replacing this initial GitHub App authorization.

## Worker Builds configuration

The VIEPS deployment uses two distinct Worker resources/environments:

```text
Pre-production Worker: vieps
Production Worker:     jagports
```

The existing Deployment-1 MVP `jagports` Worker is retained as the current non-production deployment. A separate production `jagports` resource/configuration must not be assumed to be the same resource until Cloudflare resource identity is explicitly verified.

Common repository settings:

```text
Repository:         jagports/jagports
Production branch:  main
Root directory:     4-Production/internet/cloudflare/workers/jagports/vieps/
```

Pre-production deployment command:

```text
npx wrangler deploy
```

Production deployment command:

```text
npx wrangler deploy --env production
```

Build command:

```text
leave empty unless a build step is introduced
```

Preview deploy command:

```text
npx wrangler versions upload
```

Workers Builds configuration must identify the intended Worker/environment explicitly. The production build must use the Wrangler `production` environment, whose Worker name is `jagports`.

## Build watch paths

Workers Builds should be limited to changes relevant to the VIEPS Worker where watch-path configuration is used. The initial concrete list is:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/**
4-Production/internet/cloudflare/d1/jagports/vieps/migrations/**
```

Changes under the D1 migration path must trigger a deployment only when the deployment design intentionally couples migration review/application with the Worker build; D1 migration application itself remains a separate task and must not be inferred from a Worker build.

Official watch-path documentation:

https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/

## Preview branch strategy

Use `main` for production. Enable non-production branch builds under:

**Workers & Pages -> Worker -> Settings -> Build -> Branch control**

Preview versions use:

```text
npx wrangler versions upload
```

A preview deployment must not be treated as production deployment evidence.

## API automation boundary

After the one-time GitHub App installation, Cloudflare documents a Workers Builds API for repository connections, Worker/build metadata, triggers, environment variables, builds, and logs.

API reference:

https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/

Use API automation only where an actual Jagports automation step needs it. The API uses a user-scoped Cloudflare API token; do not store the token in repository content. Supply it from the approved credential/secret system at execution time.

Example shell setup, with values supplied externally:

```text
export CLOUDFLARE_API_TOKEN='<credential from approved secret store>'
export CLOUDFLARE_ACCOUNT_ID='<account id>'
```

Do not commit either value.

## Verification

From the Worker root:

```text
jagports/jagports/4-Production/internet/cloudflare/workers/jagports/vieps/
```

CLI verification where applicable:

```text
npx wrangler whoami
npx wrangler deploy --dry-run
npx wrangler deploy --env production --dry-run
```

Verify in Cloudflare:

- GitHub organization is `jagports`;
- repository is exactly `jagports/jagports`;
- production branch is `main`;
- pre-production Worker is `vieps`;
- production Worker is `jagports`;
- the existing Deployment-1 MVP `jagports` resource is not accidentally renamed, deleted, or repurposed;
- root/build/deploy commands are correct;
- preview branch builds are configured as intended;
- watch paths are configured as intended.

Verify in GitHub:

- the Cloudflare Workers & Pages App is installed for `jagports`;
- repository access includes `jagports/jagports`.

Use a controlled test commit to verify the complete GitHub -> Workers Build connection before relying on it for production deployment.

## Official references

- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- GitHub integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- Builds configuration: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Build branches: https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
- Build watch paths: https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/
- Builds API: https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/
