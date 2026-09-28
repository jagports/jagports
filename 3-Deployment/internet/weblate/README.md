# Jagports Weblate Deployment

## Purpose

Deployment and operating record for the Hosted Weblate service used by VIEPS UI translations.

This document implements Issue #679. Day-to-day translation handling is intentionally kept separate and compact in [`Update-Translations.md`](Update-Translations.md).

## Authorities

- `00-Management/RULES_i18n.md` — VIEPS i18n governance.
- `0-DocumentationEducationCompetense/SKILL_i18n.md` — agent execution procedure.
- `5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/I18N_FOUNDATION.md` — repository/application foundation.
- Issue #554 — VIEPS i18n/Weblate architecture.
- Issue #676 — resource format, ordering and validation contract.
- Issue #679 — live Weblate deployment and Git integration.

## Live service

Verified live configuration:

- Hosted Weblate service is active and publicly reachable under its trial period.
- Workspace: `Jagports VIEPS`.
- Workspace URL: https://hosted.weblate.org/workspaces/ba803474-241d-4840-bc8c-bdb9dae615c5/
- Project: `Jagports VIEPS`.
- Project URL: https://hosted.weblate.org/projects/jagports-vieps/
- Component: `VIEPS UI`.
- Component URL: https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/
- Finnish translation URL: https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/fi/
- Repository status URL: https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/#repository

Hosted Weblate Libre-plan approval/licensing administration is separate from the already functioning translation automation. The live trial service may continue to be used for translation workflow verification while that hosting-plan matter is completed.

Repository-side MIT scope and third-party exclusions are documented in the repository `LICENSE.md`, and the root `README.md` discloses Hosted Weblate usage.

## Selected deployment mode

Primary mode: **Hosted Weblate using the Hosted Weblate GitHub App**.

Fallback, only after an explicit deployment decision: self-hosted Weblate using the official Docker deployment.

Reasons for Hosted Weblate:

- no Jagports-operated always-on Weblate stack is required;
- GitHub App integration provides repository synchronization and PR creation;
- GitHub remains release authority;
- VIEPS runtime remains independent of Weblate availability.

## GitHub integration

Repository:

`https://github.com/jagports/jagports`

Source branch:

`main`

Version-control mode:

`GitHub (via Weblate GitHub app)`

Verified integration state:

- GitHub App connected to the `jagports` organization;
- repository access restricted to `jagports/jagports`;
- Pull Request creation enabled;
- automatic PR merge disabled;
- project hooks enabled;
- project reviews enabled;
- no GitHub token, private key, webhook secret or equivalent credential is stored in repository content.

Observed Weblate-generated translation branch:

`weblate-jagports-vieps-vieps-ui`

Do not rely on an earlier configured/displayed generic branch name when the live GitHub App integration generates a different concrete branch name.

## Translation resources

Canonical directory:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

File mask:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/*.json`

Source/base file:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json`

Initial translation file:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json`

Configuration:

- source language: English;
- format: i18next JSON v4;
- Weblate format identifier: `i18nextv4`;
- recursive case-sensitive alphabetical sibling-key ordering;
- 2-space indentation;
- UNIX line endings;
- monolingual base editing in Weblate disabled;
- Finnish is the initial translated locale;
- glossary mode disabled;
- language filter: `^[^.]+$`;
- key filter: empty.

Domain/source identifiers such as part numbers, VINs, canonical model/range identifiers, JEPC source data and normalized machine codes remain data rather than translation identities.

## Translation review and release authority

Project translation instructions:

> Translate VIEPS user-interface text only. Preserve part numbers, VINs, model/range identifiers, JEPC source data, and normalized domain codes unchanged. English is the source language. Finnish is the initial translation language. Human review is required before release.

Review configuration:

- `Enable reviews`: on;
- Administration has `Review strings` capability;
- AI/machine translation, if used, is suggestion/draft assistance only.

Weblate translation review and GitHub PR review are separate gates.

Release path:

```text
GitHub source resources
        ↓
Hosted Weblate synchronization
        ↓
translator / optional AI-machine draft
        ↓
human Weblate review
        ↓
Weblate GitHub branch / Pull Request
        ↓
VIEPS i18n integrity CI
        ↓
independent Jagports GitHub review
        ↓
merge to main
        ↓
automatic Weblate resynchronization
```

GitHub `main` remains the authoritative released-resource state.

## Verified automation behavior

The live integration has now demonstrated both directions.

### Weblate → GitHub

Verified behavior:

- Finnish translation changed in Weblate;
- Weblate committed/pushed the change;
- Hosted Weblate GitHub App created a GitHub Pull Request;
- the PR changed only the intended translation resource;
- `VIEPS i18n integrity` passed without manual reformatting;
- independent GitHub review approved the PR;
- the PR merged to `main`;
- Weblate automatically rebased/resynchronized to the merge commit;
- repository status returned to a clean `0 pending / 0 outgoing / 0 missing` state.

### GitHub → Weblate

A later normal GitHub PR changed the English source string in `en.json` and merged to `main`.

The Hosted Weblate GitHub integration received the new revision automatically and the Weblate repository view reflected the merged revision within approximately five seconds in the observed test.

This live evidence supersedes the earlier concern that repository updates might require manual pulling. No second webhook is required while the GitHub App/webhook path continues to synchronize correctly.

## Synchronization and conflict handling

`main` remains authoritative when repository and Weblate state differ.

If synchronization or conflict problems occur:

1. open the repository status page: https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/#repository
2. verify pending, outgoing and missing commits;
3. synchronize/rebase Weblate from current `main` before resolving translation conflicts;
4. preserve canonical semantic keys and resource hierarchy;
5. resolve changes through the Weblate translation branch / GitHub PR path;
6. require `VIEPS i18n integrity` to pass;
7. never bypass normal review to clear synchronization drift.

If Weblate-generated formatting, hierarchy, ordering or plural-family changes fail repository validation, fix the Weblate component configuration rather than adopting manual post-processing as the normal workflow.

A dedicated stale-approval edge-case test is not required for the current deployment completion. If source-string revision/review invalidation behavior becomes operationally important later, test and document it separately without blocking ordinary translation use.

## Day-to-day translation procedure

Use [`Update-Translations.md`](Update-Translations.md).

Key URLs:

- Translate Finnish: https://hosted.weblate.org/translate/jagports-vieps/vieps-ui/fi/?q=
- Review queue: https://hosted.weblate.org/translate/jagports-vieps/vieps-ui/fi/?q=state%3Atranslated
- Repository operations/status: https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/#repository
- GitHub Pull Requests: https://github.com/jagports/jagports/pulls

## Operational administration

### Routine synchronization

- keep project hooks enabled;
- keep the component on the Hosted Weblate GitHub App integration;
- verify new GitHub source changes appear in Weblate automatically;
- use the repository status view when synchronization is uncertain;
- do not treat Weblate state as release authority when it differs from `main`.

### Access and roles

- administrative access remains limited to authorized Jagports maintainers;
- translators may propose/edit translation content;
- human review remains enabled;
- at least one authorized team retains `Review strings` permission;
- GitHub merge approval remains governed by normal Jagports workflow.

### Credentials

- use provider-managed GitHub App credentials;
- keep App installation access restricted to required repositories;
- do not put credentials in repository content or translation files;
- rotate/revoke integration credentials through Weblate/GitHub administration if compromise is suspected.

### Backup and recovery

GitHub is the durable release source for translation resources.

A Weblate outage must not prevent VIEPS from building or serving already-merged translations.

After Weblate recovery/reconnection, synchronize from current `main` before allowing new outbound translation changes.

### Upgrades

Hosted Weblate application upgrades are operated by the hosting provider. Jagports remains responsible for periodically checking that component format, review settings, GitHub integration and generated PRs still conform to repository policy and CI.

### Health check

Healthy state requires:

- Hosted Weblate workspace/project/component reachable;
- GitHub App connected to `jagports/jagports`;
- component VCS mode remains `GitHub (via Weblate GitHub app)`;
- hooks enabled;
- reviews enabled;
- `en.json` and `fi.json` visible and synchronized;
- GitHub → Weblate updates arrive automatically;
- Weblate → GitHub PR creation works;
- `VIEPS i18n integrity` accepts generated resource changes;
- post-merge Weblate status returns to `0 pending / 0 outgoing / 0 missing` and a clean working tree.

## Runtime independence

Weblate is an authoring/review integration, not a VIEPS production runtime dependency.

Production builds consume repository translation resources. A Weblate outage does not alter existing deployed VIEPS UI behavior.

## Hosting-plan follow-up

The service currently identifies the project as being in a Hosted Weblate trial period.

Libre-hosting approval/status can be completed as a separate hosting-administration follow-up. It does not invalidate the verified GitHub/Weblate automation path described above.

## External references

- Hosted/self-hosted options: https://weblate.org/en/hosting/
- Code-hosting/GitHub integration: https://docs.weblate.org/en/latest/admin/code-hosting.html
- Project settings/workflow: https://docs.weblate.org/en/latest/admin/projects.html
- Translation workflows/reviews: https://docs.weblate.org/en/latest/workflows.html
- Version-control integration: https://docs.weblate.org/en/latest/vcs.html
- Docker fallback deployment: https://docs.weblate.org/en/latest/admin/install/docker.html
