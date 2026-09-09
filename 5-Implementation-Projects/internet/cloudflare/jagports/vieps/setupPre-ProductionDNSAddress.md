# VIEPS Pre-Production Address Setup

## Purpose

Define the reusable implementation procedure for creating and enabling a Cloudflare Workers `workers.dev` pre-production hostname.

This document defines the hostname mechanism and implementation knowledge used by deployment tasks. It does not record execution results.

## Accepted VIEPS pre-production decision

VIEPS pre-production uses:

```text
<VIEPS-name>.<account>.workers.dev
```

Selected values:

```text
Account Workers subdomain: jagports
Worker name:              vieps
Pre-production hostname:  vieps.jagports.workers.dev
Pre-production URL:       https://vieps.jagports.workers.dev
```

## General hostname model

Cloudflare provides an account-level Workers subdomain:

```text
<ACCOUNT_SUBDOMAIN>.workers.dev
```

A Worker enabled on that subdomain is exposed as:

```text
<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev
```

Hostname configuration therefore has two levels:

1. establish the account Workers subdomain;
2. enable the individual Worker on that subdomain.

### Variables

```text
CLOUDFLARE_ACCOUNT_ID = Cloudflare account identifier
CLOUDFLARE_API_TOKEN  = API token supplied at execution time; never commit
ACCOUNT_SUBDOMAIN      = account-level workers.dev subdomain, for example jagports
WORKER_NAME            = Cloudflare Worker/script name, for example vieps
WORKERS_DEV_HOSTNAME   = derived value: WORKER_NAME.ACCOUNT_SUBDOMAIN.workers.dev
```

For VIEPS:

```text
ACCOUNT_SUBDOMAIN    = jagports
WORKER_NAME          = vieps
WORKERS_DEV_HOSTNAME = vieps.jagports.workers.dev
```

`ACCOUNT_SUBDOMAIN` is the text value selected for the account's Workers subdomain. It is not the Cloudflare account ID.

`WORKER_NAME` is the Worker/script name shown by Cloudflare and used by the Worker deployment configuration/API path. For VIEPS it is `vieps`.

## Finding required identifiers before API execution

### Cloudflare account ID

Open the Cloudflare Dashboard while signed in to the intended account:

`https://dash.cloudflare.com/`

Select the intended account and obtain its **Account ID** from the account information/API area. Use that value as `CLOUDFLARE_ACCOUNT_ID`.

### Worker/script name

Confirm the VIEPS Worker name from the Worker deployment configuration and Cloudflare Worker listing. The intended value is:

```text
vieps
```

### Account subdomain

The account Workers subdomain is a text label selected/configured at account level. For VIEPS it is:

```text
jagports
```

The resulting account hostname is:

```text
jagports.workers.dev
```

## Prerequisites

Before execution:

- the Cloudflare account exists;
- the operator can access the intended Cloudflare account;
- the Cloudflare account ID has been obtained;
- the intended Worker/script name has been confirmed;
- the intended account Workers subdomain has been selected;
- an API token with the required Workers permission is available when API execution is used;
- the VIEPS Worker deployment procedure is available;
- D1 creation, binding and migrations are handled separately.

Do not place API tokens, passwords, account secrets or recovery credentials in repository files or committed scripts.

## Method A — Cloudflare Dashboard

### A1. Configure the account Workers subdomain

1. Open `https://dash.cloudflare.com/`.
2. Select the intended Cloudflare account.
3. Open **Workers & Pages**.
4. Locate the account Workers subdomain setting.
5. Select **Change** where Cloudflare presents the account subdomain control.
6. Enter/select the intended subdomain, for example `jagports`.
7. Confirm that the resulting account hostname is `jagports.workers.dev`.

### A2. Enable the Worker on `workers.dev`

1. Open the `vieps` Worker.
2. Open its Domains/Routes settings.
3. Enable the `workers.dev` address.
4. Confirm the displayed URL is:

```text
https://vieps.jagports.workers.dev
```

No external custom DNS hostname is configured as part of this pre-production task.

## Method B — Wrangler CLI

Use the Worker deployment procedure for the exact Worker working directory/configuration. From the configured Worker project, the standard commands are:

```text
npx wrangler login
npx wrangler deploy
```

For a configuration-driven deployment, the relevant environment must have:

```toml
workers_dev = true
```

Do not create a second Worker merely to create the hostname. The Worker name in the deployment configuration determines the first hostname label.

## Method C — Cloudflare API: account Workers subdomain

Cloudflare's account subdomain operation is:

```text
PUT https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

Request body:

```json
{
  "subdomain": "<ACCOUNT_SUBDOMAIN>"
}
```

For VIEPS:

```json
{
  "subdomain": "jagports"
}
```

### PowerShell

Run from Windows Terminal/PowerShell after setting the required environment variables from the approved credential mechanism:

```powershell
$headers = @{
    Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN"
    "Content-Type" = "application/json"
}
$body = @{ subdomain = $env:CLOUDFLARE_WORKERS_SUBDOMAIN } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -Headers $headers -Body $body
```

### Bash/curl

Run from Git Bash at the repository root or the Worker project directory:

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain" -X PUT -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" --data "{\"subdomain\":\"$CLOUDFLARE_WORKERS_SUBDOMAIN\"}"
```

`CLOUDFLARE_WORKERS_SUBDOMAIN` is the text account subdomain, for example `jagports`.

## Method D — Cloudflare API: enable Worker subdomain

After the account subdomain exists, enable the intended Worker:

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

`{account_id}` is the Cloudflare Account ID obtained before API execution. `{script_name}` is the actual Worker/script name; for VIEPS it is `vieps`.

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

## Method E — API verification

### Account-level verification

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

Expected account subdomain:

```text
jagports
```

### Worker-level verification

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

A successful API response proves configuration state only. It does not prove application functionality.

## Deployment task boundary

This document defines reusable implementation knowledge.

Actual execution belongs to:

```text
3-Deployment/internet/dns/hosting/jagports/setupPre-ProductionAddress.md
```

The deployment task should reference this document rather than duplicating the API implementation knowledge.

## Test implementation

Reusable prerequisite/state verification is maintained separately in:

```text
5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md
```

The test implementation verifies prerequisites and current Cloudflare state before any create/enable operation is attempted. It must not create resources as part of a prerequisite test.

## Pre-production versus production

This procedure is specifically for VIEPS pre-production.

```text
Pre-production:
vieps.jagports.workers.dev

Production:
separate production deployment
```

The production hostname requirement is a separate production deployment concern and does not constrain the current pre-production Workers hostname.

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
- Create account Workers subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/update/
- Worker subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/
