# Jagports Cloudflare Account Setup

## Purpose

Create and verify the Cloudflare account used by Jagports production Workers and D1 resources.

This document covers account-level setup only. Worker, GitHub integration, D1 migration, VIEPS testing, and application management are separate procedures.

## Target account

- Organizational identity: `parts@jagports.fi`
- Purpose: Jagports production Cloudflare resources
- Repository: `jagports/jagports`

Do not record passwords, recovery codes, API tokens, secret values, or other credentials in this repository.

## UI procedure

Cloudflare dashboard:

https://dash.cloudflare.com/

1. Create or access the new Jagports Cloudflare account.
2. Use `parts@jagports.fi` as the organizational contact/initial identity.
3. Verify the account email.
4. Enable 2FA for the account owner/administrator.
5. Identify the durable account owner/administrator.
6. Add individual members only when needed and assign least-privilege roles.
7. Store recovery information in the approved password/credential management system.

## CLI boundary

Initial account creation, member administration, and user 2FA are not Wrangler operations.

Do not invent Wrangler commands for these actions.

After the account exists, use a terminal opened at the Jagports repository root for Wrangler operations:

```text
jagports/jagports/
```

Required local tooling:

```text
node --version
npm --version
npx wrangler --version
```

Windows: use Windows Terminal with PowerShell or Git Bash.
Git Bash is preferred for commands that use `curl`/`jq`.

## Wrangler authentication

From the repository root:

```text
npx wrangler login
npx wrangler whoami
```

`wrangler login` opens the Cloudflare authentication flow in a browser. Complete authentication for the intended Jagports Cloudflare account, then run `npx wrangler whoami` in the same terminal.

## Verification

Record the following only as status/evidence, never as credentials:

- account email verified;
- 2FA enabled;
- intended operator can authenticate with Wrangler;
- `npx wrangler whoami` identifies the intended Cloudflare account/operator;
- required members and roles exist.

## Automation boundary

Cloudflare supports APIs for many account/resource operations, but account creation and organization security should not be represented as automatically reproducible unless the exact supported API path has been adopted and tested by Jagports.

Resource-level automation is documented in the Worker, GitHub integration, and D1 procedures.

## Official references

- Cloudflare dashboard: https://dash.cloudflare.com/
- Wrangler authentication: https://developers.cloudflare.com/workers/wrangler/commands/#login
- Cloudflare API: https://developers.cloudflare.com/api/
