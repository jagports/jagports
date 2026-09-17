# VIEPS Pre-Production Address Setup

## Purpose

Define the reusable implementation procedure for enabling and verifying the Cloudflare Workers `workers.dev` pre-production hostname used by VIEPS.

This document defines hostname discovery, derivation and implementation knowledge used by deployment tasks. It does not record execution results.

## Accepted VIEPS pre-production decision

VIEPS pre-production uses the Cloudflare Workers hostname model:

```text
<WORKER_NAME>.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

For VIEPS:

```text
WORKER_NAME = vieps
```

The account Workers subdomain is **not hard-coded in repository documentation**. It must be discovered from the actual Cloudflare account before deriving the final hostname.

Selected VIEPS pre-production hostname form:

```text
vieps.<derived-from-account>.workers.dev
```

The final hostname and URL are therefore:

```text
Pre-production hostname = vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
Pre-production URL      = https://vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

Do not assume the account Workers subdomain is the Cloudflare account ID, account name, email address, organization name, or `jagports` unless actual Cloudflare account state verifies that value.

## General hostname model

Cloudflare provides each Workers account with an account-level `workers.dev` subdomain in the form:

```text
<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

A Worker exposed through `workers.dev` uses:

```text
<WORKER_NAME>.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

For this procedure the authoritative order is:

1. authenticate to the intended Cloudflare account;
2. read/discover the account Workers subdomain;
3. confirm the Worker/script name is `vieps`;
4. derive the hostname from those two verified values;
5. enable the Worker `workers.dev` route if required;
6. independently verify configuration and the public endpoint.

## Variables

```text
CLOUDFLARE_ACCOUNT_ID       = Cloudflare account identifier
CLOUDFLARE_API_TOKEN        = API token supplied at execution time; never commit
ACCOUNT_WORKERS_SUBDOMAIN   = value read from the intended Cloudflare account
WORKER_NAME                 = vieps
WORKERS_DEV_HOSTNAME        = WORKER_NAME.ACCOUNT_WORKERS_SUBDOMAIN.workers.dev
```

`ACCOUNT_WORKERS_SUBDOMAIN` is a Cloudflare account-level Workers setting. It is not inferred from `CLOUDFLARE_ACCOUNT_ID`.

## Prerequisites

Before execution:

- the intended Cloudflare account exists;
- the operator can authenticate to that account;
- the Cloudflare account ID has been obtained;
- the actual account Workers subdomain can be read from Cloudflare;
- the intended Worker/script name is confirmed as `vieps`;
- an API token with the required Workers permission is available when API execution is used;
- the VIEPS Worker deployment procedure is available;
- D1 creation, binding and migrations are handled separately.

Do not place API tokens, passwords, account secrets or recovery credentials in repository files or committed scripts.

## Method A — Discover account Workers subdomain in Cloudflare Dashboard

1. Open `https://dash.cloudflare.com/`.
2. Select the intended Cloudflare account.
3. Open **Workers & Pages**.
4. Locate **Your subdomain** / the account Workers subdomain setting.
5. Record the displayed account Workers subdomain as `ACCOUNT_WORKERS_SUBDOMAIN` for the current execution record.
6. Do not change the subdomain merely to make it match repository examples.

If a change of the account-level Workers subdomain is desired, treat that as a separate explicit configuration decision because it can affect all Workers using that account subdomain.

## Method B — Discover account Workers subdomain through Cloudflare API

Read the account Workers subdomain before any mutation:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

Use the returned account subdomain value as `ACCOUNT_WORKERS_SUBDOMAIN`.

### PowerShell

```powershell
$headers = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
$result = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -Headers $headers
$result
```

### Bash/curl

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

Do not use the account-subdomain update operation as part of normal VIEPS pre-production setup unless a separate explicit decision authorizes changing the account-wide subdomain.

## Derive the VIEPS pre-production hostname

After `ACCOUNT_WORKERS_SUBDOMAIN` has been read and verified:

```text
WORKERS_DEV_HOSTNAME = vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

Example only:

```text
If ACCOUNT_WORKERS_SUBDOMAIN = example-account-label
then WORKERS_DEV_HOSTNAME    = vieps.example-account-label.workers.dev
```

The example value is not a Jagports configuration decision.

## Method C — Wrangler deployment

Use the Worker deployment procedure for the exact Worker working directory/configuration.

Standard commands:

```text
npx wrangler login
npx wrangler whoami
npx wrangler deploy
```

For a configuration-driven deployment, the relevant environment must not disable `workers.dev`. Where explicitly represented in Wrangler configuration:

```toml
workers_dev = true
```

Do not create a second Worker merely to create the hostname. The deployed Worker name provides the first hostname label.

## Method D — Enable Worker `workers.dev` route through Cloudflare API

After the account Workers subdomain has been discovered, enable the intended Worker when required:

```text
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

For VIEPS:

```text
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/vieps/subdomain
```

Request body:

```json
{
  "enabled": true,
  "previews_enabled": false
}
```

### PowerShell

```powershell
$headers = @{
    Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN"
    "Content-Type" = "application/json"
}
$body = @{ enabled = $true; previews_enabled = $false } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/scripts/$env:CLOUDFLARE_WORKER_NAME/subdomain" -Headers $headers -Body $body
```

### Bash/curl

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/$CLOUDFLARE_WORKER_NAME/subdomain" -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" --data '{"enabled":true,"previews_enabled":false}'
```

## Verification

### Account-level verification

Re-read:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

Verify that the returned value is the same `ACCOUNT_WORKERS_SUBDOMAIN` used to derive the hostname.

### Worker-level verification

Read:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

For VIEPS:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/vieps/subdomain
```

Expected relevant value:

```text
enabled = true
```

### Public endpoint verification

Construct the URL from verified values:

```text
https://vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

Verify separately:

1. hostname resolves;
2. TLS/HTTPS succeeds;
3. the intended Worker responds;
4. the expected VIEPS application response is returned.

A successful API response proves configuration state only. It does not prove application functionality.

## Deployment task boundary

This document defines reusable implementation knowledge.

Actual execution belongs to:

```text
3-Deployment/internet/dns/hosting/jagports/setupPre-ProductionAddress.md
```

The deployment task must record the actual discovered account Workers subdomain and resulting hostname as execution evidence rather than committing that runtime value here as a permanent assumption.

## Test implementation

Reusable prerequisite/state verification is maintained separately in:

```text
5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md
```

The test must discover current account state before any create/enable operation and must not change the account-level Workers subdomain.

## Pre-production versus production

This procedure is specifically for VIEPS pre-production.

```text
Pre-production:
vieps.<derived-from-account>.workers.dev

Production:
separate production deployment
```

The production hostname requirement is a separate production deployment concern and does not constrain the current pre-production Workers hostname.

Cloudflare recommends routes or custom domains rather than `workers.dev` for business-critical production use; therefore the pre-production `workers.dev` decision must not be silently promoted into the production hostname architecture.

## Security

- Treat API tokens as secrets.
- Supply tokens through the approved credential/environment mechanism.
- Never commit tokens, passwords, hashes or recovery codes.
- `workers.dev` is publicly reachable when enabled unless separately protected.
- Hostname configuration does not implement VIEPS administrator authorization.
- D1 and application authorization verification remain separate tasks.

## Vendor references

- Cloudflare Workers `workers.dev`: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Cloudflare Workers CLI: https://developers.cloudflare.com/workers/get-started/guide/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Cloudflare routing: https://developers.cloudflare.com/workers/configuration/routing/
- Worker subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/
- Account Workers subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/
