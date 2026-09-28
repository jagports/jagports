# Weblate / Update Translations

Compact operator procedure for VIEPS UI translations.

## 1. Translate

URL: https://hosted.weblate.org/translate/jagports-vieps/vieps-ui/fi/?q=

Change and save the required Finnish translation.

## 2. Review

URL: https://hosted.weblate.org/translate/jagports-vieps/vieps-ui/fi/?q=state%3Atranslated

Review/approve translations waiting for human review.

## 3. Commit and push from Weblate

URL: https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/#repository

Expected actions/status:

- `pending units > 0` → **Commit**;
- `outgoing commits > 0` → **Push**;
- Weblate creates/updates its GitHub translation branch and Pull Request.

Weblate may delay commits automatically, so use **Commit** when an immediate PR is required.

## 4. Review the GitHub PR

URL: https://github.com/jagports/jagports/pulls

Expected:

- Weblate-generated translation PR exists;
- `VIEPS i18n integrity` passes;
- normal independent Jagports GitHub review is approved;
- merge through the normal repository workflow.

Do not push translation changes directly to `main`.

## 5. Verify post-merge resynchronization

URL: https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/#repository

After the GitHub merge, Weblate should normally resynchronize within a few seconds. Verify rather than assume.

Expected clean state:

- `0 pending units`;
- `0 outgoing commits`;
- `0 missing commits`;
- `Last remote commit` = `Last commit in Weblate`;
- `main` is up to date;
- working tree is clean.

## Source-language changes

English source strings are changed through the normal Jagports GitHub Issue/branch/PR workflow, not by editing the Weblate monolingual base file.

After merge, Weblate should receive the new `main` revision automatically through the Hosted Weblate GitHub App/webhook path.

## Canonical resources

- English source: `5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json`
- Finnish translation: `5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json`
- Format: i18next JSON v4 / Weblate `i18nextv4`
- Key ordering: recursive case-sensitive alphabetical order
- GitHub remains release authority; Weblate is not a VIEPS runtime dependency.
