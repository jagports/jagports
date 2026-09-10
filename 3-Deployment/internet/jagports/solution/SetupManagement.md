# VIEPS Application Setup Management

## Purpose

Define application-level setup for the VIEPS administrator authentication mechanism.

This file does not contain Cloudflare deployment orchestration, DNS deployment, Worker/D1 setup, testing, or operational Worker management.

## Administrator setup

Initial administrator identity:

```text
parts@jagports.fi
```

The accepted authorization model is application-level username/password authentication. No Google/Microsoft external identity provider is selected at this stage.

The administrator password must be stored using the application's secure password-hash mechanism. Plaintext passwords and password hashes must not be committed to GitHub or written into deployment documentation.

If the application requires a bootstrap secret or other operational secret, provide it through the approved Cloudflare secret/credential mechanism at deployment time.

## Setup verification

Verify only after the application authentication implementation is available:

- `parts@jagports.fi` is configured as the intended administrator;
- plaintext password is not stored in repository content;
- password material is represented only through the application's approved secure mechanism;
- public users do not receive administrator authorization;
- administrator authentication is required for stock add/modify operations.

Application functional testing is defined in:

`3-Deployment/internet/jagports/solution/SetupTesting.md`

Operational Worker management is defined in:

`4-Production/internet/cloudflare/workers/jagports/Management_Tasks.md`
