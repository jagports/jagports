# Cloudflare Account Setup

## Purpose

Establish and verify the Cloudflare account prerequisite for Jagports deployment.

## Operator environment

Open Windows Terminal using PowerShell or Git Bash. Work from the Jagports repository root:

```text
jagports/jagports/
```

## Dashboard

Open:

`https://dash.cloudflare.com/`

Use the intended Cloudflare account. Account creation, billing, member administration and 2FA are account-level operations and must be completed in the Cloudflare account interface where no supported CLI/API operation is being used.

## CLI authentication

From the repository root:

```text
npx wrangler login
npx wrangler whoami
```

Stop if `whoami` does not identify the intended account/operator.

## Account ID

After selecting the intended account in the dashboard, obtain the Cloudflare Account ID from the account information/API area. Do not commit it as a secret; the Account ID itself is an identifier, not a credential.

## Credentials

API tokens, passwords, recovery codes and other secrets must be supplied through the approved credential-management mechanism at execution time and must not be stored in this repository.

## Verification

Account setup is complete only when the intended account is accessible and `npx wrangler whoami` verifies the authenticated operator/account.
