# VIEPS Pre-Production Address Deployment

## Purpose

Execute and verify the VIEPS pre-production public address using the Cloudflare Workers `workers.dev` hostname mechanism.

This is a deployment task. Reusable implementation knowledge is maintained in:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress.md`

## Target

```text
Account Workers subdomain: jagports
Worker name:              vieps
Pre-production hostname:  vieps.jagports.workers.dev
Pre-production URL:       https://vieps.jagports.workers.dev
```

## Scope

This task configures and verifies the pre-production address only.

It does not establish or execute the production hostname, create/recreate D1, apply migrations, or implement application administrator authentication.

## Prerequisites

1. Open **Windows Terminal** using PowerShell or Git Bash.
2. Work from the repository root:

```text
jagports/jagports/
```

3. Confirm Cloudflare access to the intended account.
4. Confirm the Cloudflare Account ID.
5. Confirm the Worker/script name is `vieps`.
6. Review the implementation procedure and run its prerequisite test before any create/enable operation:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md`

7. Have an approved Cloudflare API token available through the approved credential mechanism if API testing/execution is used.

Do not record secret values.

## Task 1 — Test prerequisites and existing state

Run the reusable prerequisite/state test before changing Cloudflare configuration.

Test implementation:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress-test.md`

The test must first check whether the intended account Workers subdomain and Worker subdomain configuration already exist. Do not create a duplicate resource when the required state already exists.

The test must distinguish:

```text
EXISTS / READY
EXISTS / NOT READY
NOT EXISTS
ERROR / NOT VERIFIED
```

Proceed to creation/configuration only when the test shows that the required state is absent or incomplete.

## Task 2 — Configure account Workers subdomain

Expected account hostname:

```text
jagports.workers.dev
```

### Dashboard

Open:

`https://dash.cloudflare.com/`

Select the intended account, then **Workers & Pages** and the account Workers subdomain setting. Configure/select `jagports` and verify `jagports.workers.dev`.

### API

The reusable implementation procedure defines:

```text
PUT https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/subdomain
```

`{account_id}` is the Cloudflare Account ID obtained in the prerequisites. The request body field `subdomain` is the text value `jagports`.

Use the exact PowerShell/curl command from the implementation procedure rather than copying credentials into this task file.

### Verify

Read the account-level state and confirm:

```text
jagports.workers.dev
```

## Task 3 — Deploy/confirm the VIEPS Worker

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

## Task 4 — Enable the Worker `workers.dev` address

### Dashboard

Open:

`https://dash.cloudflare.com/`

Select the intended account → **Workers & Pages** → `vieps` → Domains/Routes. Ensure the `workers.dev` address is enabled and displays:

```text
https://vieps.jagports.workers.dev
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

## Task 5 — Verify Worker subdomain configuration

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

## Task 6 — Verify public hostname

Derived URL:

```text
https://<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev
```

VIEPS:

```text
https://vieps.jagports.workers.dev
```

PowerShell example:

```powershell
Invoke-WebRequest -Uri "https://vieps.jagports.workers.dev" -Method Get
```

Verify separately:

1. hostname resolves;
2. TLS/HTTPS succeeds;
3. the intended Worker responds;
4. the expected VIEPS application response is returned.

Do not accept an arbitrary HTTP response as application success. Use the expected status/response defined by VIEPS application testing.

## Task 7 — Application and database boundary

After address verification, execute the separate VIEPS application tests for public/read behavior and administrator authorization.

D1 binding and migration verification remains with the D1 deployment/migration procedures.

A working HTTPS response does not prove application authorization or D1 migration correctness.

## Task 8 — Production boundary

This task must not configure production DNS.

The current pre-production address is:

```text
vieps.jagports.workers.dev
```

The production hostname is already decided separately and applies only to production deployment. It must not be treated as a prerequisite for this pre-production task.

## Completion criteria

The address task is `EXECUTED → VERIFIED` only when all applicable address checks pass:

| Check | Result |
|---|---|
| Prerequisite/existing-state test | |
| Account Workers subdomain | |
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

If a step fails, record the failed operation and evidence in the GitHub work record. Do not claim verified deployment. Stop before a create operation when the prerequisite test cannot establish the existing state safely.

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
Evidence:
Failure / blocker:
Next action:
```