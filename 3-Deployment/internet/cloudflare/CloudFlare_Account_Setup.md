# Jagports Cloudflare Account Setup

## Purpose

Create and verify the Cloudflare account used by Jagports production Workers and D1 resources.

This document covers account-level setup only. Worker, GitHub integration, D1 migration, VIEPS testing, DNS deployment, and application management are separate procedures.

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

Initial account creation, member administration, and user 2FA are UI/account operations; do not invent Wrangler replacements for them.

## CLI authentication after account creation

Open Windows Terminal using PowerShell or Git Bash at the Jagports repository root:

```text
jagports/jagports/
```

Check tooling:

```text
node --version
npm --version
npx wrangler --version
```

Authenticate and verify:

```text
npx wrangler login
npx wrangler whoami
```

`wrangler login` opens the Cloudflare authentication flow in a browser. Complete it for the intended Jagports account, then use `whoami` to verify the authenticated operator/account.

If access must later be restored, use the approved credential-management/recovery process. Do not store account credentials in GitHub.

## Verification

Record only status/evidence:

- account email verified;
- 2FA enabled;
- intended operator can authenticate with Wrangler;
- `npx wrangler whoami` identifies the intended account/operator;
- required members and roles exist.

## Official references

- Cloudflare dashboard: https://dash.cloudflare.com/
- Wrangler authentication: https://developers.cloudflare.com/workers/wrangler/commands/#login
- Cloudflare API: https://developers.cloudflare.com/api/
