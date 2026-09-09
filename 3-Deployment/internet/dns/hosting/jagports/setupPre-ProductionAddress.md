# VIEPS Pre-Production Address Deployment

## Purpose

Execute and verify the VIEPS pre-production public address using the Cloudflare Workers `workers.dev` hostname mechanism.

This is a **deployment task**, not the reusable implementation knowledge source. The reusable Cloudflare hostname creation knowledge is maintained in:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress.md`

## Target

The current VIEPS pre-production target is:

```text
Account workers.dev subdomain: jagports
Worker name:                  vieps
Pre-production hostname:      vieps.jagports.workers.dev
Pre-production URL:           https://vieps.jagports.workers.dev
```

The procedure is generalized. For another pre-production Worker, replace the account subdomain and Worker name according to the implementation document.

## Scope boundary

This task creates/configures and verifies the **pre-production address** only.

It does not:

- establish the production hostname;
- configure `vieps.jagports.fi`;
- claim that production DNS is ready;
- create/recreate the D1 database;
- apply D1 migrations unless explicitly included by a separate database task;
- implement administrator authentication;
- replace VIEPS application functional testing.

The accepted production hostname requirement remains separately recorded in:

`5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md`

## Prerequisites

Before execution:

- Cloudflare account access is available;
- the intended Cloudflare account ID is known;
- the intended Worker exists or is being deployed by the Worker deployment task;
- the operator has the required Cloudflare permissions;
- an approved Cloudflare API token is available if API execution is used;
- the reusable hostname procedure has been reviewed;
- no production DNS prerequisite is being incorrectly applied to this pre-production task.

Do not record API tokens, passwords or other secret values in the execution record.

## Execution record

Record the following before or during execution:

```text
Execution date/time:
Operator:
Cloudflare account ID: <record identifier only if repository policy permits>
Account workers.dev subdomain:
Worker name:
Target hostname:
Execution method: Dashboard / Wrangler / API / Script
```

Do not record secret values.

## Task 1 — Confirm account Workers subdomain

Expected account-level subdomain:

```text
jagports.workers.dev
```

### Dashboard

1. Open Cloudflare **Workers & Pages**.
2. Select the intended account.
3. Open the account Workers subdomain setting.
4. Confirm the subdomain is `jagports`.
5. If the intended subdomain does not exist, create/configure it according to the implementation procedure.

### API

The implementation document defines the vendor API operation:

```text
PUT /accounts/{account_id}/workers/subdomain
```

Request:

```json
{
  "subdomain": "jagports"
}
```

Use the API example from:

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress.md`

### Verify

Confirm the account-level Workers subdomain is:

```text
jagports.workers.dev
```

Record:

```text
Account subdomain: PASS / FAIL
Evidence:
```

## Task 2 — Confirm/deploy the VIEPS Worker

The Worker name must be:

```text
vieps
```

Use the authoritative VIEPS Worker deployment procedure for the actual Worker deployment.

If Wrangler is used, the normal deployment command is:

```text
npx wrangler deploy
```

The Worker configuration must enable `workers_dev` for the environment intended to use the pre-production address.

Do not treat successful Worker deployment alone as proof that the address is enabled.

Record:

```text
Worker deployment: PASS / FAIL
Worker name:
Deployment evidence:
```

## Task 3 — Enable the Worker `workers.dev` address

### Dashboard

1. Open the `vieps` Worker.
2. Open its Domains/Routes settings.
3. Ensure the `workers.dev` address is enabled.
4. Confirm the displayed address is:

```text
https://vieps.jagports.workers.dev
```

### API

Use:

```text
POST /accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

For VIEPS:

```text
POST /accounts/{account_id}/workers/scripts/vieps/subdomain
```

Request:

```json
{
  "enabled": true,
  "previews_enabled": false
}
```

Use the reusable implementation document for the PowerShell/curl examples.

Record:

```text
Worker workers.dev enablement: PASS / FAIL
Evidence:
```

## Task 4 — Verify Worker subdomain through API

Use:

```text
GET /accounts/{account_id}/workers/scripts/vieps/subdomain
```

Expected relevant result:

```json
{
  "enabled": true
}
```

Record:

```text
API Worker subdomain verification: PASS / FAIL
Observed enabled value:
Evidence:
```

An API result of `enabled: true` proves the Worker subdomain configuration but does not prove application functionality.

## Task 5 — Verify the public hostname

Construct the URL from the configuration values rather than manually assuming the final address:

```text
https://<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev
```

For VIEPS:

```text
https://vieps.jagports.workers.dev
```

Verify:

1. DNS/hostname resolution succeeds.
2. HTTPS/TLS connection succeeds.
3. The request reaches the intended Worker.
4. The Worker returns the expected VIEPS application response.

Example PowerShell connectivity check:

```powershell
Invoke-WebRequest -Uri "https://vieps.jagports.workers.dev" -Method Get
```

For a scripted deployment check, validate the expected HTTP status and application response rather than accepting any response as success.

Record:

```text
Hostname resolution: PASS / FAIL
TLS/HTTPS: PASS / FAIL
Worker response: PASS / FAIL
VIEPS application response: PASS / FAIL
Observed status:
Observed evidence:
```

## Task 6 — Verify application boundary separately

The address deployment is successful only as an address deployment. Separately verify:

- public/read functionality works as intended;
- administrator authentication works according to the approved VIEPS application design;
- unauthorized stock mutation is denied;
- authorized stock mutation is tested where applicable;
- D1 binding and migration state is verified by the database deployment/testing procedure.

Do not mark these as PASS merely because the hostname responds over HTTPS.

## Task 7 — Confirm production boundary

Confirm that this deployment has **not** changed or required the production hostname.

Expected statement:

```text
Pre-production address:
vieps.jagports.workers.dev

Production hostname:
separate production-launch decision
```

`vieps.jagports.fi` must not be reported as a pre-production prerequisite or as provisioned by this task.

## Completion criteria

The pre-production address deployment can be marked **EXECUTED → VERIFIED** only when all applicable checks below are PASS:

| Check | Result | Evidence |
|---|---|---|
| Account Workers subdomain configured | | |
| VIEPS Worker deployed | | |
| Worker `workers.dev` enabled | | |
| Worker subdomain API verification | | |
| Hostname resolves | | |
| TLS/HTTPS succeeds | | |
| Intended Worker responds | | |
| VIEPS application responds | | |
| Production hostname unchanged | | |

A `BLOCKED`, `FAIL`, or `NOT RUN` result is not successful completion.

## Failure handling

If a step fails:

1. record the exact failed step;
2. record the observed error/evidence;
3. do not claim the deployment is verified;
4. classify the issue according to repository escalation rules when human action is required;
5. continue only when recovery is supported by the documented procedure or an explicit decision.

## Security

- Never record API tokens or other secret values.
- Use Cloudflare API tokens through approved secret/environment mechanisms.
- Do not commit deployment credentials.
- Do not confuse hostname availability with application authorization.
- `workers.dev` endpoints are public when enabled unless separately protected.

## Related records

**Implementation knowledge:**

`5-Implementation-Projects/internet/cloudflare/jagports/vieps/setupPre-ProductionDNSAddress.md`

**Traceability:**

[Issue #459 — Generate setupPre-ProductionDNSAddress.md for VIEPS Cloudflare pre-production](https://github.com/jagports/jagports/issues/459)

[PR #447 — Cloudflare Git integrated Jagports deployment execution and VIEPS pre-production address](https://github.com/jagports/jagports/pull/447)

[Issue #446 — Document Cloudflare Git integration and D1 deployment procedure](https://github.com/jagports/jagports/issues/446)

**Production requirement, not pre-production execution:**

`5-Implementation-Projects/internet/dns/jagports/vieps/FQDN_requirements.md`

## Vendor references

- Cloudflare Workers `workers.dev`: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Cloudflare Workers CLI getting started: https://developers.cloudflare.com/workers/get-started/guide/
- Cloudflare Workers configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Cloudflare account Workers subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/update/
- Cloudflare Worker subdomain API: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/

## Execution result

Complete this section only after actual execution:

```text
Overall result: EXECUTED / BLOCKED / FAIL / NOT RUN
Verification result: VERIFIED / NOT VERIFIED
Execution record:
Evidence:
Issues / blockers:
Next action:
```
