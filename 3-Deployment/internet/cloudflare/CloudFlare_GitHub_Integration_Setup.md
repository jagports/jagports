# Cloudflare GitHub Integration Setup

## Purpose

Connect the Cloudflare Workers deployment system to the Jagports GitHub repository.

## Operator environment

Open Windows Terminal using PowerShell or Git Bash at the Jagports repository root:

```text
jagports/jagports/
```

## Initial authorization

Open:

`https://dash.cloudflare.com/`

Select the intended account and open **Workers & Pages**. Use the Git integration/Workers Builds setup presented by the current Cloudflare dashboard to authorize the intended GitHub repository.

The initial GitHub App authorization is UI-based. Do not place GitHub or Cloudflare credentials in repository files.

## Repository selection

Select the repository:

```text
jagports/jagports
```

Configure the intended production branch as `main`. Non-production branches must use preview/version mechanisms and must not replace production state.

## Verification

Verify the repository connection in the Cloudflare Workers Builds/Git integration interface before relying on Git-integrated deployment. Where Cloudflare exposes a supported API for the configured integration, use that API for repeatable verification.

## Security

OAuth authorizations, tokens and secrets are managed by Cloudflare/GitHub through their supported credential mechanisms. Never copy credentials into GitHub Issues, PRs, Markdown files or scripts.
