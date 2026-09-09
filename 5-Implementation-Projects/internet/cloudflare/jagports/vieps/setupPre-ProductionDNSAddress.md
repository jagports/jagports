# VIEPS Pre-Production Address Setup

## Purpose

Define the reusable procedure for creating and enabling a Cloudflare Workers `workers.dev` pre-production hostname for VIEPS.

This document defines the hostname mechanism and the implementation knowledge required by deployment tasks. It does not claim that the hostname has been provisioned or that the VIEPS application has been deployed.

The procedure is intentionally generalized so the same method can create another pre-production Worker hostname by changing the account subdomain and Worker name.

## Accepted VIEPS pre-production decision

VIEPS pre-production currently uses:

```text
<VIEPS-name>.<account>.workers.dev
```

Selected VIEPS values:

```text
Account workers.dev subdomain: jagports
Worker name:                  vieps
Pre-production hostname:      vieps.jagports.workers.dev
Pre-production URL:           https://vieps.jagports.workers.dev
```

The hostname is provided by Cloudflare Workers. It is not a DNS record under `jagports.fi` and does not require `vieps.jagports.fi` to be available for pre-production.

## General hostname model

Cloudflare provides an account-level Workers subdomain:

```text
<ACCOUNT_SUBDOMAIN>.workers.dev
```

A Worker enabled on that subdomain is exposed as:

```text
<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev
```

Therefore hostname creation is a two-level configuration:

1. establish the account Workers subdomain;
2. enable the individual Worker on the `workers.dev` subdomain.

The generic deployment variables are:

```text
CLOUDFLARE_ACCOUNT_ID = <Cloudflare account ID>
CLOUDFLARE_API_TOKEN = <secret, never commit>
ACCOUNT_SUBDOMAIN     = <account workers.dev subdomain>
WORKER_NAME           = <Worker/script name>
WORKERS_DEV_HOSTNAME  = <WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev
```

For VIEPS:

```text
ACCOUNT_SUBDOMAIN    = jagports
WORKER_NAME          = vieps
WORKERS_DEV_HOSTNAME = vieps.jagports.workers.dev
```

Cloudflare documents that the account subdomain is configured at account level and that each Worker receives a `workers.dev` route using the Worker name. citeturn0search0

## Prerequisites

Before executing the setup:

- a Cloudflare account exists;
- the operator has permission to manage the account and Worker;
- the Cloudflare account ID is known;
- an API token with the required Workers permission is available when API execution is used;
- the intended account Workers subdomain has been selected and is available;
- the intended Worker/script name has been selected;
- the Worker deployment procedure is available;
- D1 creation, bindings and migrations are handled separately;
- no production hostname is being created by this procedure.

Do not place API tokens, passwords, account secrets or other credentials in repository files, shell history, scripts committed to Git, or documentation.

## Naming and hostname rules

Treat the hostname as derived data rather than as a manually typed DNS record:

```text
hostname = WORKER_NAME + "." + ACCOUNT_SUBDOMAIN + ".workers.dev"
```

The Worker name is used as the hostname's first label. Cloudflare documents the `workers.dev` URL as `<YOUR_WORKER_NAME>.<YOUR_SUBDOMAIN>.workers.dev`. citeturn0search0

Do not infer that the account subdomain can be freely changed during every Worker deployment. The account-level subdomain is shared by Workers in that account.

## Method A — Cloudflare Dashboard

Use the dashboard when interactive setup is preferred.

### A1. Create/configure the account Workers subdomain

1. Open **Workers & Pages** in the intended Cloudflare account.
2. Locate the account-level **Workers subdomain** setting.
3. Configure/select the desired account subdomain, for example:

```text
jagports
```

4. Confirm the resulting account hostname:

```text
jagports.workers.dev
```

Cloudflare's current dashboard procedure is to use **Workers & Pages** and select **Change** next to the account's subdomain. citeturn0search0

### A2. Enable the Worker on `workers.dev`

1. Open the intended Worker.
2. Open its domain/route settings.
3. Enable its `workers.dev` address.
4. Confirm the generated URL:

```text
https://<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev
```

For VIEPS:

```text
https://vieps.jagports.workers.dev
```

Do not configure `vieps.jagports.fi` as part of this pre-production procedure.

## Method B — Wrangler CLI

Wrangler can deploy a Worker to `workers.dev`. Cloudflare documents `npx wrangler deploy` as the normal deployment command; if no subdomain/domain has been configured, Wrangler can prompt for the required setup. citeturn0search1

From the Worker project directory:

```text
npx wrangler login
npx wrangler deploy
```

For a configuration-driven deployment, explicitly enable `workers_dev` where the selected environment is intended to use `workers.dev`:

```toml
name = "<WORKER_NAME>"
workers_dev = true
```

Cloudflare documents `workers_dev = true` as the Wrangler configuration option that enables deployment through a `*.workers.dev` subdomain. citeturn0search15turn0search14

The deployment source of truth remains the actual VIEPS Wrangler configuration and the Git-integrated deployment procedure. This document does not prescribe a particular project framework or build command beyond the standard Wrangler operation.

## Method C — Cloudflare API: create the account Workers subdomain

Cloudflare provides an API operation to create the account Workers subdomain:

```text
PUT /accounts/{account_id}/workers/subdomain
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

Cloudflare documents this operation as **Create Subdomain** and requires Workers Scripts Write permission. API token authentication is the preferred authentication mechanism. citeturn0search5

Example PowerShell:

```powershell
$headers = @{
    Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    subdomain = $env:CLOUDFLARE_WORKERS_SUBDOMAIN
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Put `
    -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/subdomain" `
    -Headers $headers `
    -Body $body
```

Example Bash/curl:

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain" \
  -X PUT \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"subdomain\":\"$CLOUDFLARE_WORKERS_SUBDOMAIN\"}"
```

The token is supplied through the environment and must not be embedded in the script.

## Method D — Cloudflare API: enable a Worker on `workers.dev`

After the account subdomain exists, enable the specific Worker/script on the subdomain:

```text
POST /accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

Request body:

```json
{
  "enabled": true,
  "previews_enabled": false
}
```

`previews_enabled` is optional and must be selected according to the pre-production preview policy. Do not enable it merely because the production Worker requires a `workers.dev` URL.

Cloudflare documents this operation as **Post Worker subdomain** and identifies `Workers Scripts Write` as the required permission. citeturn0search2turn0search8

Example PowerShell:

```powershell
$headers = @{
    Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    enabled = $true
    previews_enabled = $false
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/workers/scripts/$env:CLOUDFLARE_WORKER_NAME/subdomain" `
    -Headers $headers `
    -Body $body
```

Example Bash/curl:

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/$CLOUDFLARE_WORKER_NAME/subdomain" \
  -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"enabled":true,"previews_enabled":false}'
```

## Method E — Cloudflare API: verify the Worker subdomain state

The Worker-specific subdomain can be read with:

```text
GET /accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

Cloudflare returns the `enabled` and `previews_enabled` state. citeturn0search8

Example:

```text
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/$CLOUDFLARE_WORKER_NAME/subdomain" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

A successful API response with `enabled: true` proves the Worker subdomain configuration, but does not prove that the deployed application itself is functioning correctly.

## Deployment task boundary

This implementation document defines **how the hostname is created/configured**.

The actual execution task belongs in:

```text
3-Deployment/internet/dns/hosting/jagports/setupPre-ProductionAddress.md
```

That deployment document must consume this knowledge and record the actual operator execution and verification.

The deployment task must not recreate the API knowledge independently. It should reference this document and execute the applicable method.

## Verification

Verify the configuration at three levels.

### 1. Account level

Confirm:

```text
GET /accounts/{account_id}/workers/subdomain
```

returns the intended account subdomain, for example:

```text
jagports
```

### 2. Worker level

Confirm:

```text
GET /accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

returns:

```text
enabled = true
```

### 3. Internet/application level

Confirm the derived URL:

```text
https://<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev
```

For VIEPS:

```text
https://vieps.jagports.workers.dev
```

Then verify:

- DNS/hostname resolution succeeds;
- HTTPS/TLS connection succeeds;
- the intended Worker responds;
- the VIEPS application responds as expected;
- application authentication/authorization tests are executed separately;
- D1 binding/migration verification is executed separately;
- execution evidence is recorded in the deployment execution record.

A document change or successful API response alone is not application deployment evidence.

## Pre-production versus production

This is intentionally a pre-production hostname decision.

```text
Pre-production
    ↓
<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev

VIEPS current value
    ↓
vieps.jagports.workers.dev

Production
    ↓
separate production-hostname decision
```

`vieps.jagports.fi` must not block VIEPS pre-production solely because it is the intended production hostname.

Cloudflare currently recommends Workers routes or Custom Domains rather than `workers.dev` for production business-critical Workers. citeturn0search0turn0search3

## Security and operational considerations

- Treat API tokens as secrets.
- Use API tokens rather than legacy Global API Keys where possible. citeturn0search2
- Never commit tokens, passwords, hashes, recovery codes or secret values.
- Do not put credentials directly in curl/PowerShell source files that are committed to Git.
- Prefer environment variables or the approved secret/credential mechanism.
- `workers.dev` URLs are publicly reachable when enabled unless an access-control mechanism is applied. citeturn0search0
- Hostname configuration does not provide VIEPS administrator authorization.
- Do not treat a successful HTTP response as proof that D1 migrations or application authorization are correct.
- Keep pre-production resources and data separated from production resources where required.

## Related implementation records

**Implements / follows**

[Issue #459 — Generate setupPre-ProductionDNSAddress.md for VIEPS Cloudflare pre-production](https://github.com/jagports/jagports/issues/459)

**Extends**

[PR #447 — Cloudflare Git integrated Jagports deployment execution and VIEPS pre-production address](https://github.com/jagports/jagports/pull/447)

**Related**

[Issue #446 — Document Cloudflare Git integration and D1 deployment procedure](https://github.com/jagports/jagports/issues/446)

[Issue #448 — Implement public VIEPS access with administrator stock authorization](https://github.com/jagports/jagports/issues/448)

[PR #445 — Split Cloudflare Worker and D1 deployment documentation](https://github.com/jagports/jagports/pull/445)

[5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md](../../../../dns/jagports/vieps/FQDN_requirements.md)

## Vendor references

- Cloudflare Workers `workers.dev`: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Cloudflare Workers CLI getting started: https://developers.cloudflare.com/workers/get-started/guide/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Cloudflare Workers routing: https://developers.cloudflare.com/workers/configuration/routing/
- Create account Workers subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/update/
- Worker subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/

## Execution record boundary

This document defines reusable implementation knowledge and the accepted VIEPS target values.

It does not claim that `vieps.jagports.workers.dev` has been provisioned, deployed, or verified. Actual execution belongs to the deployment task and must be recorded separately after execution and verification.