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
CLOUDFLARE_ACCOUNT_ID       = Cloudflare Account ID of the intended account
CLOUDFLARE_API_TOKEN        = API token supplied through the approved credential mechanism
ACCOUNT_WORKERS_SUBDOMAIN   = discovered from the intended Cloudflare account
WORKER_NAME                 = vieps
EXPECTED_HOSTNAME           = vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

`CLOUDFLARE_ACCOUNT_ID` is obtained from the intended Cloudflare account at `https://dash.cloudflare.com/`.

`WORKER_NAME` is the actual Cloudflare Worker/script name. For VIEPS it is `vieps`.

`ACCOUNT_WORKERS_SUBDOMAIN` must be read from the actual Cloudflare account. Do not assume it is `jagports`, the account ID, account name, organization name, or email address.

## Test 1 — Account authentication

PowerShell:

```powershell
npx wrangler whoami
```

Expected: Wrangler identifies the intended authenticated Cloudflare account with sufficient access.

If authentication or account identity cannot be verified, stop.

## Test 2 — Discover account Workers subdomain

API:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

PowerShell:

```powershell
$headers = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
$result = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -Headers $headers
$result
```

Bash/curl:

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

Expected: the request returns the account-level Workers subdomain for the intended account.

Record that returned value as:

```text
ACCOUNT_WORKERS_SUBDOMAIN
```

Classify:

```text
EXISTS / READY
NOT EXISTS
ERROR / NOT VERIFIED
```

This test is read-only. Do not change the account Workers subdomain merely to match a repository example.

If no account Workers subdomain exists or its state cannot be verified, stop and record the result before any account-level mutation.

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

## Test 4 — Derive hostname from verified account state

Derive rather than manually invent the hostname:

```text
WORKER_NAME + "." + ACCOUNT_WORKERS_SUBDOMAIN + ".workers.dev"
```

For VIEPS the expected hostname form is:

```text
vieps.<derived-from-account>.workers.dev
```

The concrete hostname is valid for this execution only after `ACCOUNT_WORKERS_SUBDOMAIN` has been read from the intended account.

## Test 5 — Public endpoint, only when Worker is expected to exist

Construct:

```text
https://vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

PowerShell example after the discovered value has been supplied to the environment:

```powershell
$uri = "https://vieps.$env:CLOUDFLARE_WORKERS_SUBDOMAIN.workers.dev"
Invoke-WebRequest -Uri $uri -Method Get
```

Verify TLS/HTTPS and that the response is from the intended Worker.

A public HTTP response is not by itself proof of correct VIEPS application behavior. Application testing is separate.

## Decision before deployment

Use the test results to select the next operation:

```text
Account subdomain VERIFIED + Worker enabled
    → do not create/enable again; proceed to public/application verification

Account subdomain VERIFIED + Worker NOT READY
    → enable/configure Worker only

Account subdomain NOT EXISTS
    → stop; account-wide subdomain creation/change requires an explicit configuration decision

ERROR / NOT VERIFIED
    → stop; do not create resources blindly
```

## Security

Do not store or record API tokens, passwords or other secrets. Supply them at runtime through the approved credential mechanism.

## Vendor references

- Cloudflare Workers `workers.dev`: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Cloudflare Worker subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/
- Cloudflare account Workers subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/
