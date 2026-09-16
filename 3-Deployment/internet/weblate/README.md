# Jagports Weblate Deployment

## Purpose

Define the deployment and operating procedure for the Weblate Translation Management System used by VIEPS UI localization.

This document implements the deployment and operating record for Issue #679. It distinguishes verified live configuration from remaining acceptance work and does not claim completion of the end-to-end translation release path until that path is actually exercised and verified.

## Authorities

- `00-Management/RULES_i18n.md` — canonical VIEPS UI i18n governance.
- `0-DocumentationEducationCompetense/SKILL_i18n.md` — agent execution procedure.
- `5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/I18N_FOUNDATION.md` — repository/application i18n foundation.
- Issue #554 — selected VIEPS i18n/Weblate architecture.
- Issue #676 — resource format, ordering, governance, and validation contract.
- Issue #679 — live Weblate deployment and Git integration.

## Current live deployment status

Verified on 2026-09-16:

- Hosted Weblate trial service is provisioned and reachable.
- Workspace: `Jagports VIEPS`.
- Workspace URL: `https://hosted.weblate.org/workspaces/ba803474-241d-4840-bc8c-bdb9dae615c5/`.
- Project: `Jagports VIEPS`.
- Project slug: `jagports-vieps`.
- Project URL: `https://hosted.weblate.org/projects/jagports-vieps/`.
- Translation component: `VIEPS UI`.
- Component slug: `vieps-ui`.
- Component URL: `https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/`.
- The Hosted Weblate GitHub App is connected to the `jagports` organization.
- GitHub App repository access is restricted to `jagports/jagports`.
- The `VIEPS UI` component has been migrated to `GitHub (via Weblate GitHub app)`.
- English and Finnish resources are visible in the component.
- Project-level `Enable hooks` is enabled.
- Project-level `Enable reviews` is enabled.
- Libre-hosting approval has not yet been requested.
- The complete translation edit → human review → Weblate GitHub PR → CI → merge → Weblate resynchronization round trip has not yet been demonstrated.

A Weblate diagnostic still reports that repository updates are pulled manually even after GitHub App migration and with project hooks enabled. Treat that warning as unresolved operational evidence until an actual GitHub-side repository update is shown to reach Weblate automatically. Do not dismiss or work around it by adding a second webhook unless evidence shows the GitHub App path is insufficient.

## Selected deployment mode

**Selected primary deployment mode: Hosted Weblate, targeting Libre hosting for the public VIEPS translation project.**

The project is currently running under the Hosted Weblate trial while configuration and eligibility requirements are completed.

Reasons for the selected mode:

- Hosted Weblate provides the required GitHub App, translation review, branch/PR, and synchronization workflow without introducing another Jagports-operated always-on application stack.
- GitHub remains the released-resource authority.
- VIEPS runtime remains independent of Weblate availability.
- The deployment minimizes Jagports-specific infrastructure and maintenance.

### Libre-hosting eligibility boundary

Repository visibility alone is not sufficient for Hosted Weblate Libre approval.

Before requesting Libre approval, verify and document the required licensing boundary and project disclosure:

- Jagports-authored source code intended to be libre and the VIEPS translation resources use the MIT License.
- Third-party software, copied upstream material, catalogue/source data, images, and other externally owned content are **not** relicensed by the Jagports MIT grant; they retain their original licenses or rights.
- Proprietary Jaguar/Unipart or other third-party catalogue/source material must not be described as MIT-licensed merely because it exists in the public repository.
- The repository README should explicitly mention that VIEPS translations are managed with Hosted Weblate before Libre approval is requested.
- Repository-level licensing documentation must make the Jagports-authored/third-party boundary clear enough that the Libre-hosting application does not imply that all repository content is covered by a single Jagports MIT grant.

Do not request Libre-hosting approval until these repository-side licensing/disclosure prerequisites have been addressed.

### Fallback

If Hosted Weblate Libre hosting is not accepted or becomes unsuitable, the approved fallback candidate is self-hosted Weblate using the official Docker deployment.

Changing from Hosted Weblate to self-hosted Weblate is an operational/deployment decision and must be recorded before provisioning. Do not silently switch deployment modes.

## Canonical VIEPS component configuration

### Repository and branches

Repository:

`https://github.com/jagports/jagports`

Repository branch:

`main`

Configured Weblate push branch name:

`weblate-translations`

Repository push URL:

- left empty for the pull-request integration;
- GitHub App integration manages authenticated repository access.

Version-control mode:

`GitHub (via Weblate GitHub app)`

Version-control parameters:

- Create merge requests / pull requests: enabled.
- Automatic pull-request merge: disabled.
- Merge method setting: `Create a merge commit`.

The exact fork/branch mechanics used by Hosted Weblate must be verified by the first generated pull request. The configured branch name must not be treated as evidence that a successful outbound PR flow already exists.

### Translation resources

Translation resource directory:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

File mask:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/*.json`

Monolingual base/source file:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json`

Initial translated locale:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json`

Source language:

`English`

### File format

- File format: i18next JSON file v4.
- Weblate format identifier: `i18nextv4`.
- JSON key ordering: case-sensitive sort (`json_sort_keys = case_sensitive`).
- JSON indentation: 2 spaces.
- Indentation style: spaces.
- Avoid spaces after separators: disabled.
- DOS line endings: disabled; repository resources remain on UNIX line endings.
- Edit monolingual base file: disabled.
- Intermediate language file: empty.
- Template for new translations: empty.
- Adding new translations: inherited project/workspace setting, `Create new language file`.
- Language code style: inherited/default based on file format.
- Language filter: `^[^.]+$`.
- Key filter: empty.
- `Use as a glossary`: disabled for the `VIEPS UI` component.

The component must preserve:

- the same logical semantic-key hierarchy across required locales;
- recursive case-sensitive alphabetical sibling-key ordering;
- i18next v4 / CLDR-compatible plural families;
- English as the canonical monolingual UI source language;
- Finnish as the initial translated UI locale;
- domain/source identifiers as data rather than translation identities.

## Translation instructions and license

Project translation instructions are:

> Translate VIEPS user-interface text only. Preserve part numbers, VINs, model/range identifiers, JEPC source data, and normalized domain codes unchanged. English is the source language. Finnish is the initial translation language. Human review is required before release.

Translation license:

`MIT License`

The component inherits the configured project/workspace translation license.

The MIT selection applies to Jagports-authored VIEPS translation resources. It does not override or replace the rights/license status of third-party or proprietary repository content.

## GitHub integration

Use the Hosted Weblate GitHub App rather than embedding a personal GitHub token in repository or Weblate component configuration.

Verified integration state:

- connected GitHub account: `jagports` organization;
- GitHub App status: active;
- repository access: `jagports/jagports` only;
- component VCS mode: `GitHub (via Weblate GitHub app)`;
- project `Enable hooks`: on;
- no repository credential, token, private key, or webhook secret is stored in repository content.

The Weblate workflow must not push release-ready translation changes directly to protected `main` or otherwise bypass Jagports review and CI.

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
Weblate translation branch / GitHub App change
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

## Human review and access control

Project access is currently public under the Hosted Weblate trial/Libre model.

Current review configuration:

- project `Enable reviews`: on;
- the `Administration` team includes the `Review strings` role;
- the Administration team scope covers all languages and all project components;
- current Jagports administrative access is therefore capable of performing the required Weblate human review.

Weblate translation review does not replace normal Jagports GitHub PR review. Both gates remain distinct:

1. human translation review in Weblate;
2. normal independent GitHub PR review and CI before merge.

Because the project is public, contribution visibility must not be confused with release authority. Public contributors may propose translations, but unreviewed content must not become release-ready merely because it exists in Weblate.

## Human and AI translation boundary

AI or machine translation may generate suggestions or drafts.

AI/machine output must not independently become released translation content.

Human/Weblate review remains required before translation content is treated as approved for release. Existing approved terminology should be reused where applicable.

No AI/machine translation integration has to be enabled merely to complete the Weblate deployment; if enabled later, it must remain suggestion/draft-only.

## Synchronization and conflict handling

Repository changes on `main` remain authoritative.

When Weblate and GitHub changes conflict:

1. synchronize/rebase/update the Weblate component from the current repository state;
2. preserve the canonical semantic keys rather than creating language-specific parallel identities;
3. resolve resource conflicts in the translation branch/PR;
4. run the repository i18n integrity CI;
5. do not bypass review merely to resolve synchronization drift.

If Weblate produces formatting, hierarchy, ordering, or plural-family changes that fail repository validation, the Weblate component configuration must be corrected. Manual post-processing must not become the normal release mechanism.

### Current synchronization warning

The live component currently reports:

`Repository updates are pulled manually. Configure repository hooks to automate pulling changes into Weblate.`

This warning remains visible even though:

- the component has been migrated to the Weblate GitHub App integration; and
- project `Enable hooks` is enabled.

Do not mark automatic inbound synchronization healthy solely from configuration state. Verify behavior using a representative GitHub repository change and observe whether Weblate receives it automatically. If it does, re-check whether the diagnostic clears or is stale. If it does not, investigate the GitHub App/repository event delivery path before adding any alternate webhook.

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
10. A subsequent repository-side translation/source change reaches Weblate automatically through the configured GitHub App/hook path.

Use a harmless representative translation wording change for this test. Do not modify domain identifiers or JEPC source-language catalogue data as the test payload.

## Operational administration

### Routine synchronization

- Keep project `Enable hooks` enabled.
- Keep the component on the Hosted Weblate GitHub App integration.
- Verify Weblate reflects newly merged semantic keys before assigning translation work.
- Do not treat Weblate state as release authority when it differs from `main`.
- Investigate persistent synchronization diagnostics with live event evidence rather than dismissing them without verification.

### Access and roles

- Keep administrative access limited to authorized Jagports maintainers.
- Translators may propose/edit translation content.
- `Enable reviews` must remain on while human review is required by Jagports i18n governance.
- At least one authorized team must retain `Review strings` permission.
- Repository merge approval remains governed by Jagports GitHub workflow even after Weblate translation approval.

### Credentials

- Prefer GitHub App installation credentials managed by the provider integration.
- Keep the GitHub App installation restricted to the required repository where possible.
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

- Hosted Weblate workspace/project/component URLs are reachable by an authorized Jagports administrator;
- GitHub App connection reports the `jagports` organization and `jagports/jagports` repository available;
- component VCS mode remains `GitHub (via Weblate GitHub app)`;
- project `Enable hooks` remains on;
- project `Enable reviews` remains on;
- current `en.json` and `fi.json` are visible/synchronized;
- a GitHub repository change reaches Weblate automatically;
- Weblate can create/update a translation PR;
- repository i18n CI accepts Weblate-generated resource changes;
- Weblate can resynchronize cleanly after the translation PR is merged.

## Runtime independence

Weblate is not a VIEPS production runtime dependency.

VIEPS production builds consume translation resources committed to the repository. A Weblate outage must not alter existing deployed VIEPS UI behavior or prevent a build that already has the required repository resources.

## Current execution status

### Verified complete configuration

- base `en.json` / `fi.json` resource foundation exists;
- #676 governance/resource validation is implemented;
- deterministic VIEPS i18n integrity CI exists;
- Hosted Weblate trial service is provisioned and reachable;
- VIEPS workspace/project/component exist;
- VIEPS component points at the canonical repository/resource paths;
- component format is `i18nextv4`;
- JSON key sorting is case-sensitive;
- GitHub App is installed and restricted to `jagports/jagports`;
- component has been migrated to `GitHub (via Weblate GitHub app)`;
- translation PR creation is enabled and automatic PR merge is disabled;
- source/base editing in Weblate is disabled;
- project hooks are enabled;
- project translation reviews are enabled;
- Administration role includes string-review capability;
- Weblate translation license is set to MIT for the Jagports-authored translation resources.

### Remaining before #679 completion

- document the repository-level licensing boundary and README Weblate disclosure needed before Libre-hosting approval;
- request and obtain Hosted Weblate Libre-hosting approval;
- verify the persistent inbound-synchronization diagnostic with an actual GitHub-side update;
- perform a harmless translation edit and human review in Weblate;
- verify Weblate generates the expected GitHub pull request through the configured integration;
- verify the generated changes pass #676/VIEPS i18n CI without manual reformatting;
- complete normal Jagports independent PR review and merge;
- verify Weblate resynchronizes the merged state without duplicate/reversion behavior;
- record basic operational health evidence from the completed round trip.

## External references

Current Weblate documentation used for this deployment procedure:

- Hosted/self-hosted options: https://weblate.org/en/hosting/
- Code-hosting/GitHub integration: https://docs.weblate.org/en/latest/admin/code-hosting.html
- Project settings/workflow: https://docs.weblate.org/en/latest/admin/projects.html
- Translation workflows/reviews: https://docs.weblate.org/en/latest/workflows.html
- Version-control integration: https://docs.weblate.org/en/latest/vcs.html
- Docker fallback deployment: https://docs.weblate.org/en/latest/admin/install/docker.html
