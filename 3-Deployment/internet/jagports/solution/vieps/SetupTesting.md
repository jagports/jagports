# VIEPS Application Functional Testing

## Purpose

Verify VIEPS application behaviour after the infrastructure and application deployment tasks have completed.

Cloudflare account, GitHub integration, Worker, D1, migration, and DNS setup tests belong to those task-specific procedures. This file contains only VIEPS application-level functional tests.

## Test environment

Use the verified deployment endpoint supplied by the deployment execution process. For local application checks, open Windows Terminal using PowerShell or Git Bash at:

```text
jagports/jagports/
```

## Public access test

Verify:

- application loads through the intended public endpoint;
- public/read functionality works without administrator authentication;
- public users cannot add stock;
- public users cannot modify stock;
- unauthorized mutation requests return the intended denial response.

Use `curl.exe` in PowerShell or `curl` in Git Bash where HTTP verification is appropriate:

```text
curl.exe -i https://<verified-test-host>/
```

## Administrator test

The accepted administrator model is application-level username/password authentication with `parts@jagports.fi` as the initial administrator identity.

Do not execute this as passed until Issue #448 has been implemented, reviewed, tested, and merged.

After the authentication implementation is available, verify:

- administrator authentication succeeds with valid credentials supplied through the approved credential mechanism;
- invalid credentials are rejected;
- authenticated administrator can add stock;
- authenticated administrator can modify stock;
- public users remain unable to mutate stock.

Never put credentials in shell history, repository files, Issues, PRs, or execution records.

## Persistence test

After an authorized stock mutation:

1. read the resulting record;
2. verify the expected application result;
3. verify the corresponding D1 persistence through the D1 task procedure;
4. read the record again after the normal deployment/restart boundary;
5. confirm that the expected record remains available.

## Failure classification

Use:

```text
PASS
FAIL
BLOCKED
NOT RUN
```

For a failure record the exact endpoint/operation, expected result, observed result, environment, and required corrective action in the relevant GitHub Issue/PR or execution record.

## Acceptance

Application testing is complete only when public/read behaviour, unauthorized mutation denial, administrator authorization, and persistence have each been independently verified for the intended environment.
