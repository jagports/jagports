# VIEPS Pre-Production Address Deployment

## Purpose

Execute and verify the VIEPS pre-production public address using the Cloudflare Workers `workers.dev` hostname mechanism.

This is a deployment task. Reusable implementation knowledge is maintained in:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress.md`

## Target

```text
Worker name:              vieps
Account Workers subdomain: discover from the intended Cloudflare account
Pre-production hostname:  vieps.<derived-from-account>.workers.dev
Pre-production URL:       https://vieps.<derived-from-account>.workers.dev
```

The concrete account Workers subdomain must be read from Cloudflare during execution. Do not assume it is `jagports`, the account ID, account name, organization name, or email address.

## Scope

This task configures and verifies the pre-production Worker address only.

It does not establish or execute the production hostname, create/recreate D1, apply migrations, change the account-wide Workers subdomain without a separate explicit decision, or implement application administrator authentication.

## Prerequisites

1. Open **Windows Terminal** using PowerShell or Git Bash.
2. Work from the repository root:

```text
jagports/jagports/
```

3. Confirm Cloudflare access to the intended account.
4. Confirm the Cloudflare Account ID.
5. Confirm the Worker/script name is `vieps`.
6. Review the implementation procedure and run its prerequisite test before any enable operation:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md`

7. Have an approved Cloudflare API token available through the approved credential mechanism if API testing/execution is used.

Do not record secret values.

## Task 1 — Test prerequisites and existing state

Run the reusable prerequisite/state test before changing Cloudflare configuration.

Test implementation:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md`

The test must read the actual account Workers subdomain before the deployment hostname is derived.

The test must distinguish:

```text
EXISTS / READY
EXISTS / NOT READY
NOT EXISTS
ERROR / NOT VERIFIED
```

Do not create or change the account-wide Workers subdomain merely because a repository example differs from the live account state.

## Task 2 — Discover account Workers subdomain

### Dashboard

Open:

`https://dash.cloudflare.com/`

Select the intended account, then **Workers & Pages** and read the account Workers subdomain shown as **Your subdomain** / equivalent account setting.

Record the displayed value in the execution record as:

```text
ACCOUNT_WORKERS_SUBDOMAIN = <verified value>
```

### API

Read:

```text
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

Use the exact PowerShell/curl command from the implementation procedure.

### Verify

Confirm that the account-level read succeeds for the intended account and that the returned value is the one used for all later hostname derivation.

If the account Workers subdomain does not exist or cannot be verified, stop. Do not silently select a replacement value.

## Task 3 — Derive the VIEPS hostname

After `ACCOUNT_WORKERS_SUBDOMAIN` is verified, derive:

```text
WORKERS_DEV_HOSTNAME = vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
WORKERS_DEV_URL      = https://vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

Record the concrete derived hostname and URL as execution evidence.

## Task 4 — Deploy/confirm the VIEPS Worker

The Worker/script name is:

```text
vieps
```

Use the authoritative VIEPS Worker deployment procedure for deployment. From the configured Worker project, the normal Wrangler deployment command is:

```text
npx wrangler deploy
```

Do not treat successful deployment alone as proof that the `workers.dev` address is enabled.

Verify the deployed Worker name before continuing.

## Task 5 — Enable the Worker `workers.dev` address

### Dashboard

Select the intended account → **Workers & Pages** → `vieps` → Domains/Routes.

Ensure the `workers.dev` address is enabled and that the displayed hostname matches the previously derived value:

```text
vieps.<ACCOUNT_WORKERS_SUBDOMAIN>.workers.dev
```

### API

Use:

```text
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

For VIEPS, `{script_name}` is `vieps`.

The request body is:

```json
{
  "enabled": true,
  "previews_enabled": false
}
```

Use the implementation procedure for the exact command and environment-variable setup.

## Task 6 — Verify Worker subdomain configuration

Use:

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

This verifies Cloudflare configuration only.

## Task 7 — Verify public hostname

Use the concrete hostname derived from the verified account Workers subdomain.

PowerShell example:

```powershell
$uri = "https://vieps.$env:CLOUDFLARE_WORKERS_SUBDOMAIN.workers.dev"
Invoke-WebRequest -Uri $uri -Method Get
```

Verify separately:

1. hostname resolves;
2. TLS/HTTPS succeeds;
3. the intended Worker responds;
4. the expected VIEPS application response is returned.

Do not accept an arbitrary HTTP response as application success. Use the expected status/response defined by VIEPS application testing.

## Task 8 — Application and database boundary

After address verification, execute the separate VIEPS application tests for public/read behavior and administrator authorization.

D1 binding and migration verification remains with the D1 deployment/migration procedures.

A working HTTPS response does not prove application authorization or D1 migration correctness.

## Task 9 — Production boundary

This task must not configure production DNS.

The pre-production address form is:

```text
vieps.<derived-from-account>.workers.dev
```

The concrete value is execution-time evidence derived from the account, not a repository-wide permanent hostname assumption.

The production hostname is decided separately and applies only to production deployment. It must not be treated as a prerequisite for this pre-production task.

## Completion criteria

The address task is `EXECUTED → VERIFIED` only when all applicable address checks pass:

| Check | Result |
|---|---|
| Prerequisite/existing-state test | |
| Account Workers subdomain discovered | |
| Derived VIEPS hostname recorded | |
| VIEPS Worker | |
| Worker `workers.dev` enabled | |
| Worker subdomain API verification | |
| Hostname resolution | |
| TLS/HTTPS | |
| Intended Worker response | |
| Expected VIEPS response | |
| Production hostname unchanged | |

`FAIL`, `BLOCKED`, or `NOT RUN` is not successful completion.

## Failure handling

If a step fails, record the failed operation and evidence in the GitHub work record. Do not claim verified deployment. Stop when the prerequisite test cannot establish existing account state safely.

## Security

- Never record API tokens or other secrets.
- Supply tokens through the approved credential/environment mechanism.
- `workers.dev` is public when enabled unless separately protected.
- Hostname availability is not application authorization.

## File references

Implementation procedure:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress.md`

Prerequisite/state test:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md`

Production hostname requirement:

`5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md`

## Execution result

Complete only after actual execution:

```text
Overall result: EXECUTED / BLOCKED / FAIL / NOT RUN
Verification result: VERIFIED / NOT VERIFIED
Account Workers subdomain:
Derived pre-production hostname:
Evidence:
Failure / blocker:
Next action:
```
