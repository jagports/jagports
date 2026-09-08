# VIEPS Deployment Setup Testing

## Purpose

Repeatable testing procedure for verifying a VIEPS deployment after Cloudflare Worker, D1, Git integration, and application changes.

This file is the VIEPS solution testing layer. Cloudflare resource setup remains in the Cloudflare deployment procedures.

## Test environment

Run repository/CLI tests from:

```text
jagports/jagports/
```

Use the intended environment-specific Wrangler configuration and Cloudflare account.

Required local checks:

```text
node --version
npm --version
npx wrangler --version
npx wrangler whoami
```

## Test order

### 1. Pre-deployment configuration test

Run the Worker configuration/package validation:

```text
npx wrangler deploy --dry-run
```

Confirm that:

- the intended Worker name is selected;
- the intended Wrangler configuration is loaded;
- the D1 binding is configured;
- no placeholder production database ID remains;
- no secret value is present in repository content.

### 2. D1 migration test

Before production application:

```text
npx wrangler d1 migrations list jagports --remote
```

Apply only reviewed migrations:

```text
npx wrangler d1 migrations apply jagports --remote
```

Verify again:

```text
npx wrangler d1 migrations list jagports --remote
```

### 3. Preview test

For a non-production branch, configure Workers Builds to create a preview build and use:

```text
npx wrangler versions upload
```

Verify that the preview version is not the active production version.

### 4. Public access test

Verify through the actual public test endpoint:

- application loads;
- public/read functions work;
- public users cannot add stock;
- public users cannot modify stock;
- unauthorized mutation requests return the intended denial response.

### 5. Administrator test

The accepted administrator model is application-level username/password authentication, with `parts@jagports.fi` as the initial administrator identity.

Do not execute this test as passed until Issue #448 has been implemented, reviewed, tested, and merged.

After #448 is complete, verify:

- administrator authentication succeeds;
- invalid credentials are rejected;
- authenticated administrator can add stock;
- authenticated administrator can modify stock;
- public users remain unable to mutate stock.

### 6. Persistence test

After an authorized stock mutation:

1. read the resulting record;
2. verify the expected D1 state;
3. redeploy/restart the Worker where operationally appropriate;
4. read the record again;
5. confirm persistence.

### 7. Git-integrated deployment test

Verify the complete chain:

```text
GitHub commit
    -> Workers Build
    -> build result
    -> Worker version
    -> active deployment
    -> public endpoint
```

The Cloudflare GitHub integration should provide build status/check information where configured.

## DNS/hostname test

Target hostname:

```text
vieps.jagports.fi
```

This remains blocked until a supported Cloudflare/DNS architecture is selected.

Do not mark the hostname test passed merely because the Worker exists or a `workers.dev` URL works.

Cloudflare's current documentation states that Custom Domains require an active Cloudflare zone and that Routes require a Cloudflare-proxied DNS record. See:

https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
https://developers.cloudflare.com/workers/configuration/routing/routes/

## CLI verification examples

Use `curl.exe` in PowerShell or `curl` in Git Bash for HTTP verification:

```text
curl.exe -i https://<verified-test-host>/
curl.exe -i https://<verified-test-host>/<public-read-path>
```

Do not put administrator credentials or tokens directly into shell history. Use the approved secret/credential mechanism for authenticated tests.

## Failure classification

Use one of:

```text
PASS
FAIL
BLOCKED
NOT RUN
```

For every failure record:

- exact command or URL;
- observed result;
- expected result;
- environment;
- required corrective action.

## Evidence

Test evidence belongs in the relevant GitHub Issue/PR or execution record, not as a permanent chronological log in this procedure file.
