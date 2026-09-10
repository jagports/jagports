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

Intended Worker:

```text
jagports
```

Intended production branch:

```text
main
```

Production Worker root:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

Recommended build configuration:

```text
Repository:             jagports/jagports
Production branch:     main
Root directory:        4-Production/internet/cloudflare/workers/jagports/vieps/
Build command:          leave empty unless a build step is introduced
Deploy command:         npx wrangler deploy
Preview deploy command: npx wrangler versions upload
```

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

Multiple development branches may therefore produce non-production versions without changing the production Worker on `main`.

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

From Windows Terminal using PowerShell or Git Bash at:

```text
jagports/jagports/
```

CLI verification where applicable:

```text
npx wrangler whoami
npx wrangler deploy --dry-run
```

Verify in Cloudflare:

- GitHub organization is `jagports`;
- repository is exactly `jagports/jagports`;
- production branch is `main`;
- Worker name matches the Wrangler configuration;
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
