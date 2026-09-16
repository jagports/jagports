# Jagports Weblate Deployment

## Purpose

Define the deployment and operating procedure for the Weblate Translation Management System used by VIEPS UI localization.

This document implements the repository-side deployment preparation for Issue #679. It does not claim that the external Weblate service has been provisioned, approved, connected, or verified until those actions are actually completed and evidenced.

## Authorities

- `00-Management/RULES_i18n.md` — canonical VIEPS UI i18n governance.
- `0-DocumentationEducationCompetense/SKILL_i18n.md` — agent execution procedure.
- `5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/I18N_FOUNDATION.md` — repository/application i18n foundation.
- Issue #554 — selected VIEPS i18n/Weblate architecture.
- Issue #676 — resource format, ordering, governance, and validation contract.
- Issue #679 — live Weblate deployment and Git integration.

## Selected deployment mode

**Selected primary deployment mode: Hosted Weblate — Libre plan for a public libre project.**

Reasons:

- `jagports/jagports` is public and therefore can be submitted for Hosted Weblate's Libre-project hosting.
- The Libre plan is intended for public libre projects and avoids introducing another always-on Jagports-operated application stack solely for translation management.
- Hosted Weblate provides a GitHub App workflow for repository access, incoming notifications, translation branches, and pull requests.
- The selected direction minimizes Jagports-specific infrastructure and maintenance while keeping GitHub as the release authority.

The external Hosted Weblate application/approval is a real prerequisite. This repository decision does not imply that Weblate has accepted or provisioned the project.

### Fallback

If Hosted Weblate Libre hosting is not accepted or becomes unsuitable, the approved fallback candidate is self-hosted Weblate using the official Docker deployment.

Changing from Hosted Weblate to self-hosted Weblate is an operational/deployment decision and must be recorded before provisioning. Do not silently switch deployment modes.

## External provisioning boundary

The following actions must be performed and verified in Hosted Weblate/GitHub before #679 can be completed:

1. Apply for or enable Hosted Weblate Libre hosting for Jagports.
2. Confirm the resulting stable Weblate project URL.
3. Connect the `jagports` GitHub organization/repository using the Hosted Weblate GitHub App.
4. Restrict the App installation to the required repository where GitHub permits this.
5. Import/configure the VIEPS translation component using the canonical repository paths below.
6. Configure translator/reviewer roles and prove that human review is required before released translation content enters the repository merge path.
7. Perform and record the complete GitHub → Weblate → translation review → GitHub PR → CI → merge round trip.

No credential, token, private key, webhook secret, or other authentication material may be committed to this repository, Issues, PR comments, logs, or documentation examples containing real values.

## Canonical VIEPS component configuration

Repository:

`https://github.com/jagports/jagports`

Translation resource directory:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

File mask:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/*.json`

Monolingual base/source file:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json`

Initial translated locale:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json`

Format:

- i18next JSON file v4
- Weblate format identifier: `i18nextv4`
- JSON key ordering: `json_sort_keys = case_sensitive`

The component must preserve:

- the same logical semantic-key hierarchy across required locales;
- recursive case-sensitive alphabetical sibling-key ordering;
- i18next v4 / CLDR-compatible plural families;
- English as the canonical monolingual UI source language;
- Finnish as the initial translated UI locale;
- domain/source identifiers as data rather than translation identities.

## GitHub integration

For Hosted Weblate, use the current Hosted Weblate GitHub App integration rather than embedding a personal GitHub token in repository configuration.

The GitHub App integration is expected to provide repository access, incoming GitHub notifications, translation branch pushes, and Pull Request creation.

The Weblate workflow must not push release-ready translation changes directly to protected `main` in a way that bypasses Jagports review and CI.

Required release path:

```text
GitHub canonical i18n resources
        ↓
Hosted Weblate synchronization
        ↓
translator / optional AI-machine draft
        ↓
human Weblate review / approval
        ↓
Weblate translation branch
        ↓
GitHub Pull Request
        ↓
VIEPS i18n integrity CI
        ↓
normal Jagports independent review
        ↓
merge to main
```

GitHub remains the authoritative source of released translation resources.

## Human and AI translation boundary

AI or machine translation may generate suggestions or drafts.

AI/machine output must not independently become released translation content.

Human/Weblate review remains required before translation content is treated as approved for release. Existing approved terminology should be reused where applicable.

## Synchronization and conflict handling

Repository changes on `main` remain authoritative.

When Weblate and GitHub changes conflict:

1. synchronize/rebase/update the Weblate component from the current repository state;
2. preserve the canonical semantic keys rather than creating language-specific parallel identities;
3. resolve resource conflicts in the translation branch/PR;
4. run the repository i18n integrity CI;
5. do not bypass review merely to resolve synchronization drift.

If Weblate produces formatting, hierarchy, ordering, or plural-family changes that fail repository validation, the Weblate component configuration must be corrected. Manual post-processing must not become the normal release mechanism.

## Validation / acceptance round trip

A #679 acceptance round trip is complete only when all of the following are evidenced:

1. Weblate successfully reads `en.json` and `fi.json` from `jagports/jagports`.
2. A representative translation unit is edited in Weblate.
3. The translation is human-reviewed/approved in Weblate.
4. Weblate creates or updates a translation branch and GitHub Pull Request rather than modifying `main` directly.
5. The PR contains only the expected translation-resource change plus any explicitly required Weblate metadata/configuration change.
6. `VIEPS i18n integrity` passes on the exact PR head.
7. Normal Jagports independent review is completed.
8. The approved PR is merged through the normal repository workflow.
9. Weblate synchronizes the merged repository state without creating a duplicate/reversion loop.

Use a harmless representative translation wording change for this test. Do not modify domain identifiers or JEPC source-language catalogue data as the test payload.

## Operational administration

### Routine synchronization

- Keep automatic repository notifications/synchronization enabled through the supported Hosted Weblate GitHub App workflow.
- Verify Weblate reflects newly merged semantic keys before assigning translation work.
- Do not treat Weblate state as release authority when it differs from `main`.

### Access and roles

- Keep administrative access limited to authorized Jagports maintainers.
- Translators may propose/edit translation content.
- Reviewer/approver permission must remain distinct enough to preserve the required human review gate.
- Repository merge approval remains governed by Jagports GitHub workflow even after Weblate translation approval.

### Credentials

- Prefer GitHub App installation credentials managed by the provider integration.
- Do not place credentials in translation resources or deployment documentation.
- Rotate/revoke external integration credentials through the provider/GitHub administration path if compromise is suspected.

### Backup and recovery

For Hosted Weblate, GitHub remains the durable release source for translation resources.

A Weblate service outage must not prevent VIEPS from building or serving translations already merged to the repository.

After service recovery or reconnection, resynchronize from current `main` before allowing new translation changes to flow back.

### Upgrade responsibility

Hosted Weblate application upgrades are operated by the hosting provider. Jagports remains responsible for periodically verifying that the configured component format, GitHub integration behavior, review roles, and generated PRs still conform to #554/#676 and the repository CI contract.

### Health verification

Minimum operational health checks are:

- Hosted Weblate project URL is reachable by an authorized user;
- GitHub App connection reports the Jagports repository available;
- component repository synchronization succeeds;
- current `en.json` and `fi.json` are visible/synchronized;
- Weblate can create/update a translation PR;
- repository i18n CI accepts Weblate-generated resource changes.

## Runtime independence

Weblate is not a VIEPS production runtime dependency.

VIEPS production builds consume translation resources committed to the repository. A Weblate outage must not alter existing deployed VIEPS UI behavior or prevent a build that already has the required repository resources.

## Current execution status

Repository prerequisites are complete:

- base `en.json` / `fi.json` resource foundation exists;
- #676 governance/resource validation is implemented;
- deterministic VIEPS i18n integrity CI exists.

External Hosted Weblate provisioning, GitHub App connection, live component configuration, role configuration, and the end-to-end round trip remain unverified until performed against the actual service.

## External references

Current Weblate documentation used when preparing this procedure:

- Hosted/self-hosted options: https://weblate.org/en/hosting/
- Code-hosting/GitHub integration: https://docs.weblate.org/en/latest/admin/code-hosting.html
- Version-control integration: https://docs.weblate.org/en/latest/vcs.html
- Docker fallback deployment: https://docs.weblate.org/en/latest/admin/install/docker.html
