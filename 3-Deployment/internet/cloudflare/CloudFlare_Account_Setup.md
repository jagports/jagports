# Jagports Cloudflare Account Setup

## Purpose

Create and verify the Cloudflare account used by Jagports Workers and D1 resources.

This is the canonical account-level setup procedure. Worker, GitHub integration, D1 migration, VIEPS testing, DNS deployment, and application management are separate procedures.

## Target account

- Organizational identity: `parts@jagports.fi`
- Purpose: Jagports Cloudflare resources
- Repository: `jagports/jagports`

Do not record passwords, recovery codes, API tokens, secret values, or other credentials in this repository.

## Required outcomes versus Cloudflare UI labels

Cloudflare dashboard labels and navigation can change independently of this procedure. The required outcomes are authoritative:

- the organizational email is verified;
- a durable owner/administrator exists;
- 2FA is enabled for the owner/administrator;
- required members have appropriate least-privilege roles;
- recovery information is stored in the approved credential-management system;
- Wrangler can authenticate as the intended Jagports account/operator.

When the current dashboard path differs from an observed path below, use the current Cloudflare UI to reach the same required outcome and record the observed deviation in the execution evidence. Do not create a parallel deployment guide solely for a changed menu label.

## Account activation and UI procedure

Cloudflare dashboard:

https://dash.cloudflare.com/

Cloudflare may require email verification as part of initial account activation **before** normal dashboard sign-in/access is available. Therefore email verification is a prerequisite/outcome, not a step that is assumed to occur only after dashboard access.

1. Create or access the Jagports Cloudflare account using `parts@jagports.fi` as the organizational identity.
2. Complete email verification whenever Cloudflare requests it, including before first dashboard access if required.
3. Identify the durable account owner/administrator.
4. Enable 2FA for the owner/administrator.
5. Add individual members only when needed and assign least-privilege roles.
6. Store recovery information in the approved password/credential management system.

### 2FA path observed 2026-09-10

The Cloudflare UI observed during Jagports account setup exposed 2FA at:

```text
My Profile
  -> Settings
  -> Access Management
  -> Authentication
  -> Two-Factor Authentication
```

Observed direct page:

```text
https://dash.cloudflare.com/profile/access-management/authentication/two-factor
```

Treat this path as an observed navigation aid, not a permanent UI contract. The required outcome is that 2FA is enabled and subsequently verified.

### Member-management path observed 2026-09-10

The account-member UI was observed at:

```text
Manage account
  -> Members
  -> All members
```

Use that area, or its current Cloudflare equivalent, to verify the durable administrator, roles, 2FA state, and active membership.

Initial account creation, member administration, and user 2FA are UI/account operations; do not invent Wrangler replacements for them.

## Deployment-host prerequisite

Wrangler commands depend on Node.js/npm/npx. Verify the deployment host before attempting Wrangler authentication.

The established Jagports Windows command-line environment is Git Bash. Run the Node.js/npm/npx and Wrangler command-line procedure from Git Bash unless the task explicitly establishes another supported shell.

Verify:

```text
node --version
npm --version
npx --version
```

If Node.js is absent on the Windows deployment host, the demonstrated installation method is:

```text
winget install OpenJS.NodeJS.LTS
```

Run the installation from PowerShell where appropriate, then close and reopen Git Bash so the updated PATH is visible. Repeat the version checks before proceeding.

Do not continue to Wrangler authentication while `node`, `npm`, or `npx` is unavailable in the shell that will execute the deployment commands.

## Wrangler bootstrap and authentication

Open Git Bash at the Jagports repository root:

```text
jagports/jagports/
```

Check Wrangler through `npx`:

```text
npx wrangler --version
npx wrangler whoami
```

On first use, `npx` may offer to install the required Wrangler package. Accept the Wrangler package bootstrap when the package is the expected Cloudflare Wrangler package and continue using `npx` so a global Wrangler installation is not required by this procedure.

If `whoami` reports that the operator is not authenticated, run:

```text
npx wrangler login
```

`wrangler login` opens the Cloudflare authentication flow in a browser. Complete it for the intended Jagports account, then verify again:

```text
npx wrangler whoami
```

If access must later be restored, use the approved credential-management/recovery process. Do not store account credentials in GitHub.

## Verification

Record only status/evidence:

- account email verified;
- durable owner/administrator identified;
- 2FA enabled;
- intended operator can authenticate with Wrangler;
- `npx wrangler whoami` identifies the intended account/operator;
- required members and roles exist;
- Node.js/npm/npx are available in the actual deployment shell.

## Variation handling

Execution observations belong in the relevant GitHub Issue/PR or deployment execution record. When an observation reveals a reusable procedure correction, amend this canonical file through the normal repository workflow rather than creating a second account-setup implementation document.

## Official references

- Cloudflare dashboard: https://dash.cloudflare.com/
- Wrangler authentication: https://developers.cloudflare.com/workers/wrangler/commands/#login
- Cloudflare API: https://developers.cloudflare.com/api/
