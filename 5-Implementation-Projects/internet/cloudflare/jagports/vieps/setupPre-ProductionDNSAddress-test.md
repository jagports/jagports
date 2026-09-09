# VIEPS Pre-Production Address Prerequisite Test

## Purpose

Verify the existing Cloudflare state required for VIEPS pre-production address deployment before any create or enable operation.

This test does not create or modify Cloudflare resources.

## Run location

Open Windows Terminal using PowerShell or Git Bash.

Run from the repository root:

```text
jagports/jagports/
```

## Required variables

```text
CLOUDFLARE_ACCOUNT_ID = Cloudflare Account ID of the intended account
CLOUDFLARE_API_TOKEN  = API token supplied through the approved credential mechanism
ACCOUNT_SUBDOMAIN     = jagports
WORKER_NAME           = vieps
EXPECTED_HOSTNAME     = vieps.jagports.workers.dev
```

`CLOUDFLARE_ACCOUNT_ID` is obtained from the intended Cloudflare account at `https://dash.cloudflare.com/`.

`WORKER_NAME` is the actual Cloudflare Worker/script name. For VIEPS it is `vieps`.

`ACCOUNT_SUBDOMAIN` is the account-level Workers subdomain text. For VIEPS it is `jagports`.

## Test 1 — Account authentication

PowerShell:

```powershell
npx wrangler whoami
```

Expected: Wrangler identifies an authenticated Cloudflare account with sufficient access.

If authentication or account identity cannot be verified, stop.

## Test 2 — Account Workers subdomain

API:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

PowerShell:

```powershell
$headers = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -Headers $headers
```

Bash/curl:

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

Expected account subdomain:

```text
jagports
```

Classify:

```text
EXISTS / READY
NOT EXISTS
ERROR / NOT VERIFIED
```

If the required subdomain already exists, do not create it again.

## Test 3 — VIEPS Worker subdomain state

API:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

For VIEPS:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/vieps/subdomain
```

PowerShell:

```powershell
$headers = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/scripts/$env:CLOUDFLARE_WORKER_NAME/subdomain" -Headers $headers
```

Expected when already configured:

```text
enabled = true
```

Classify:

```text
EXISTS / READY
EXISTS / NOT READY
NOT EXISTS
ERROR / NOT VERIFIED
```

If `enabled = true`, do not repeat the enable operation merely to recreate existing state.

## Test 4 — Derived hostname

Derive rather than manually invent the hostname:

```text
WORKER_NAME + "." + ACCOUNT_SUBDOMAIN + ".workers.dev
```

Expected:

```text
vieps.jagports.workers.dev
```

## Test 5 — Public endpoint, only when Worker is expected to exist

PowerShell:

```powershell
Invoke-WebRequest -Uri "https://vieps.jagports.workers.dev" -Method Get
```

Verify TLS/HTTPS and that the response is from the intended Worker.

A public HTTP response is not by itself proof of correct VIEPS application behavior. Application testing is separate.

## Decision before deployment

Use the test results to select the next operation:

```text
Account subdomain EXISTS + Worker enabled
    → do not create/enable again; proceed to public/application verification

Account subdomain EXISTS + Worker NOT READY
    → enable/configure Worker only

Account subdomain NOT EXISTS
    → create/configure account subdomain, then re-run this test

ERROR / NOT VERIFIED
    → stop; do not create resources blindly
```

## Security

Do not store or record API tokens, passwords or other secrets. Supply them at runtime through the approved credential mechanism.

## Vendor references

- Cloudflare Workers `workers.dev`: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Cloudflare Worker subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/
- Cloudflare account Workers subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/update/
