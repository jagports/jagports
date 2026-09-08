# Jagports Cloudflare Git Worker Deployment

## Purpose

Deployment procedure for the public Jagports VIEPS application running as a Cloudflare Worker.

The production Worker representation is:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

The VIEPS implementation project remains technology-independent under:

```text
5-Implementation-Projects/base/application-platform/application/jagports/vieps/
```

This document covers the Worker deployment only. D1 deployment is documented separately.

## Repository structure

```text
3-Deployment/internet/cloudflare/workers/jagports/
    └── Jagports_CloudFlareGit_App_Deployment.md

4-Production/internet/cloudflare/workers/jagports/vieps/
    └── production Worker deployment representation

4-Production/internet/cloudflare/d1/jagports/vieps/
    └── production D1 deployment representation

5-Implementation-Projects/base/application-platform/application/jagports/vieps/
    └── technology-independent VIEPS implementation project
```

The production tree represents the deployed technology/resource. The implementation project is deliberately kept independent of Cloudflare.

## Architecture

```text
GitHub repository
    |
    +--> Pull Request / review
    |
    +--> main
            |
            v
      Cloudflare Workers Builds
            |
            v
       Worker: jagports
            |
            +--> application/API
                    |
                    v
               Cloudflare D1
```

Workers Builds connects to the Git repository. It does not connect to or depend on the GitHub Project/Kanban system.

## Cloudflare account

The accepted account decision is:

- Create a new Jagports Cloudflare account.
- Use `parts@jagports.fi` as the organizational account contact/initial identity.
- Verify the email address.
- Enable 2FA.
- Store recovery information outside GitHub.
- Add individual operators with least-privilege roles; do not share the account-owner login.

No credentials, recovery codes, password hashes, or tokens belong in this document.

## GitHub integration

Target repository:

```text
jagports/jagports
```

Use Cloudflare Workers Builds as the preferred Git integration.

Initial GitHub App authorization is a Cloudflare dashboard operation. After the GitHub App is installed and authorized, Cloudflare's Workers Builds API can support later automation; this does not replace the initial authorization step.

Recommended setup:

1. Open Cloudflare Workers & Pages.
2. Connect the GitHub repository.
3. Authorize the `jagports` organization when requested.
4. Restrict repository access to `jagports/jagports` where the GitHub App allows repository selection.
5. Select the repository.
6. Configure the Worker root and commands below.

## Worker configuration

Production Worker directory:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/
```

Worker name:

```text
jagports
```

Production branch:

```text
main
```

Recommended Workers Builds configuration:

```text
Repository:             jagports/jagports
Production branch:     main
Root directory:        4-Production/internet/cloudflare/workers/jagports/vieps/
Build command:          leave empty unless a build step is introduced
Deploy command:         npx wrangler deploy
Preview deploy command: npx wrangler versions upload
```

The production Worker directory is the deployment representation. Implementation-project material belongs under `5-Implementation-Projects/.../vieps/` and is not itself the Cloudflare deployment root.

## Public VIEPS access model

VIEPS is intentionally a public Internet application.

Do **not** protect the whole VIEPS application with Cloudflare Access.

The application authorization boundary is inside VIEPS:

```text
Internet user
    |
    +--> public/read functionality: allowed
    |
    +--> stock add/modify: denied

Administrator
    |
    +--> application authentication
            |
            +--> stock add/modify: allowed
```

The initial administrator identity is:

```text
parts@jagports.fi
```

No Google/Microsoft external identity provider is selected at this stage.

The administrator password must be stored using a secure password-hash scheme. The plaintext password and password hash must not be committed to GitHub. Application implementation determines the exact password-hash storage mechanism; deployment configuration must provide only the secure credential material required by that implementation.

If a separate bootstrap secret is required by the Worker, use a Cloudflare Worker secret rather than repository configuration.

## Production endpoint

The desired hostname is:

```text
https://vieps.jagports.fi
```

There is an unresolved infrastructure constraint: Cloudflare Worker Custom Domains require an active Cloudflare zone, while Worker Routes require a DNS record that is proxied through Cloudflare.

Therefore this document does **not** claim that `vieps.jagports.fi` can be attached to the Worker while DNS hosting remains entirely at another DNS provider.

Before production deployment, resolve one of these supported architectures:

1. Move the required `jagports.fi` DNS zone/subdomain management to Cloudflare and use a Worker Custom Domain; or
2. Select another supported public endpoint architecture.

Do not mark the hostname as `VERIFIED` until the actual DNS/Cloudflare configuration has been independently tested.

## D1 dependency

The Worker uses the D1 binding declared in the production Worker configuration:

```text
4-Production/internet/cloudflare/workers/jagports/vieps/wrangler.toml
```

The D1 production representation is separate:

```text
4-Production/internet/cloudflare/d1/jagports/vieps/
```

The D1 database and migrations are separate deployment concerns. A successful Worker build/deployment does not prove that the required D1 migrations have been applied.

See:

```text
3-Deployment/internet/cloudflare/d1/jagports/Jagports_CloudFlareGit_DB_Deployment.md
```

## Deployment flow

```text
Feature branch
    |
    v
Pull Request
    |
    +--> tests / review
    |
    v
Merge main
    |
    v
Cloudflare Workers Build
    |
    v
Production Worker
    |
    v
4-Production/internet/cloudflare/workers/jagports/vieps/
```

For preview branches, use the configured preview deployment mechanism and verify it separately from production.

## Wrangler operations

Authentication:

```text
npx wrangler login
npx wrangler whoami
```

Configuration validation:

```text
npx wrangler deploy --dry-run
```

Preview version upload where enabled:

```text
npx wrangler versions upload
```

Controlled direct deployment fallback:

```text
npx wrangler deploy
```

A direct production deployment is a bootstrap/troubleshooting exception after Git integration has been established. Record why it was necessary.

## Verification

After deployment, independently verify:

- the Cloudflare build corresponds to the intended GitHub commit;
- the intended Worker version is active;
- the intended production Worker directory/configuration is used;
- the D1 binding is present;
- required D1 migrations are applied;
- the public VIEPS application loads;
- public users can use public/read functionality;
- public users cannot add or modify stock;
- administrator authentication succeeds;
- administrator stock mutation succeeds;
- D1 persistence works;
- the selected production endpoint resolves and serves the Worker;
- application logs show no deployment errors.

## Rollback

Worker rollback and D1 schema rollback are separate operations.

For Worker code, identify a known-good Worker version and document the rollback operation. Do not assume that rolling back Worker code reverses a D1 migration.

D1 schema changes require compatible migration and recovery planning.

## Execution record

This document describes the procedure. It does not claim live execution.

Record actual operations in the deployment execution record with:

```text
Date/time:
Operator:
Environment: production
Operation:
Interface: UI | CLI
Status: RESEARCHED | EXECUTED | VERIFIED | BLOCKED
Command / dashboard action:
Result:
Verification:
Deviation / decision:
```

Never record passwords, password hashes, recovery codes, API tokens, or secret values.

## Official Cloudflare references

- Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Git integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/
- GitHub integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- Worker routing and domains: https://developers.cloudflare.com/workers/configuration/routing/
- Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
