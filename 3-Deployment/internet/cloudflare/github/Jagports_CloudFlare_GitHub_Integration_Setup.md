# Jagports Cloudflare GitHub Integration Setup

## Purpose

Connect Cloudflare Workers Builds to the private GitHub repository `jagports/jagports`.

This document covers the GitHub-to-Cloudflare connection. Worker configuration and D1 deployment are separate procedures.

## Current Cloudflare model

Cloudflare Workers Builds supports GitHub organization accounts and can automatically build/deploy a Worker from repository changes.

Official documentation, current as of 2026-09:

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

The API uses a **user-scoped Cloudflare API token** with the required Workers Builds permissions. Never put that token in repository content.

## API automation path

Use a Git Bash terminal opened at the repository root, or another shell with `curl` and `jq` available.

Set credentials only in the shell/approved secret store, never in a committed file:

```text
export CLOUDFLARE_API_TOKEN='<credential from approved secret store>'
export CLOUDFLARE_ACCOUNT_ID='<account id>'
```

The following API operations are available after the initial GitHub App installation:

1. Obtain the GitHub organization ID.
2. Obtain the repository ID for `jagports/jagports`.
3. Create/update the Cloudflare repository connection.
4. Obtain the Worker tag.
5. Obtain the build token UUID.
6. Create production and preview triggers.
7. Set trigger environment variables.
8. Trigger a build.
9. List builds and inspect build logs.

Use the exact current endpoint and request body from the official API reference before executing automation. Do not copy tokens into scripts or documentation.

## Worker connection requirements

The Cloudflare Worker dashboard name must match the Wrangler `name` in the selected repository root.

The intended Worker is:

```text
jagports
```

The intended production branch is:

```text
main
```

The intended production source root is the production Worker implementation defined by PR #445. The exact path must be taken from the merged production documentation rather than copied from an obsolete path.

## Branch and preview strategy

Use `main` as the production branch.

Enable non-production branch builds when preview validation is required:

**Cloudflare dashboard**

Workers & Pages -> select Worker -> Settings -> Build -> Branch control -> enable builds for non-production branches.

Cloudflare then builds non-production branches using the preview deploy command, normally:

```text
npx wrangler versions upload
```

A preview build must not be treated as a production deployment.

Pull-request builds can provide preview URLs and build status comments/checks when the Worker and build configuration support them.

## Monorepo/build watch consideration

Workers Builds triggers on repository changes by default. Because `jagports/jagports` is a repository containing multiple project areas, configure build watch paths if necessary so unrelated repository changes do not unnecessarily deploy the VIEPS Worker.

Official documentation:

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
