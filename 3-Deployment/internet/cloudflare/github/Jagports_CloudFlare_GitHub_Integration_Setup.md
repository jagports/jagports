# Jagports Cloudflare GitHub Integration Setup

## Purpose

Connect Cloudflare Workers Builds to the private GitHub repository `jagports/jagports`.

This document covers the GitHub-to-Cloudflare connection. Worker configuration and D1 deployment are separate procedures.

## Current Cloudflare model

Cloudflare Workers Builds supports GitHub organization accounts and can automatically build/deploy a Worker from repository changes.

Official documentation:

https://developers.cloudflare.com/workers/ci-cd/builds/
https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/

## Required UI operation

The initial GitHub App authorization is a dashboard operation.

Cloudflare dashboard:

https://dash.cloudflare.com/

1. Open **Workers & Pages**.
2. Create the Worker from Git, or select the existing Worker.
3. For an existing Worker open **Settings -> Builds -> Connect**.
4. Select GitHub.
5. Authorize the Cloudflare Workers & Pages GitHub App for the `jagports` organization.
6. When GitHub asks for repository access, select **Only select repositories** where available.
7. Select exactly:

```text
jagports/jagports
```

8. Return to Cloudflare and select the repository.

For an organization installation, the GitHub user performing the installation must be an organization owner or have the appropriate GitHub Apps Manager capability.

## CLI/API boundary

There is no Wrangler command that replaces the initial Cloudflare GitHub App installation/authorization.

Do not invent a Wrangler equivalent.

After the one-time GitHub App installation, Cloudflare provides a Workers Builds API for automation of repository connections, triggers, environment variables, and builds:

https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/

The API uses a user-scoped Cloudflare API token with the required Workers Builds permissions. Never put that token in repository content.

## API automation

Use Git Bash at the repository root for `curl`/`jq` commands.

Store credentials only in the approved secret/credential system:

```text
export CLOUDFLARE_API_TOKEN='<credential from approved secret store>'
export CLOUDFLARE_ACCOUNT_ID='<account id>'
```

Do not commit these values.

After the initial GitHub App installation, the documented API flow can:

1. obtain the GitHub organization ID;
2. obtain the repository ID for `jagports/jagports`;
3. create/update the Cloudflare repository connection;
4. obtain the Worker tag;
5. obtain the build token UUID;
6. create production and preview triggers;
7. set trigger environment variables;
8. trigger a build;
9. list builds and inspect build logs.

Use the current endpoint/request body from the official API reference when implementing these calls.

## Worker connection requirements

The Cloudflare Worker dashboard name must match the Wrangler `name` in the selected repository root.

Intended Worker:

```text
jagports
```

Intended production branch:

```text
main
```

The production Worker source root is the path defined by the Worker deployment procedure in this PR.

## Branch and preview strategy

Use `main` as the production branch.

For preview validation, enable non-production branch builds:

**Workers & Pages -> select Worker -> Settings -> Build -> Branch control**

Enable builds for non-production branches when required.

Preview deploy command:

```text
npx wrangler versions upload
```

Preview builds must not be treated as production deployments.

## Monorepo/build watch paths

Because `jagports/jagports` contains multiple project areas, configure Workers Builds watch paths if required so unrelated repository changes do not unnecessarily deploy the VIEPS Worker.

https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/

## Verification

Verify in Cloudflare:

- GitHub organization is `jagports`;
- repository is exactly `jagports/jagports`;
- production branch is `main`;
- Worker name matches Wrangler configuration;
- build/deploy commands are the intended commands;
- non-production branch builds are configured as intended;
- repository access is limited to the required repository where supported.

Verify in GitHub:

- the Cloudflare Workers & Pages App is installed for the `jagports` organization;
- its repository access includes `jagports/jagports`;
- a controlled test commit can produce the expected Cloudflare build/check result.

## Official references

- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- GitHub integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- Builds configuration: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Build branches: https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
- Build watch paths: https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/
- Builds API: https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/
