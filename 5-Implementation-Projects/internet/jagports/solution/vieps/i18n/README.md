# VIEPS i18n resources

Base repository/resource foundation:

[`../SPEC/I18N_FOUNDATION.md`](../SPEC/I18N_FOUNDATION.md)

Detailed resource-format, ordering, governance, and validation rules are owned by Issue #676 and are applied on top of the base foundation.

## Runtime/build contract

The canonical source resources are:

- `en.json` — English source/base locale;
- `fi.json` — Finnish locale.

The VIEPS Worker build runs `npm run build:i18n`, which reads these canonical repository resources and generates `4-Production/internet/cloudflare/workers/jagports/public/i18n-resources.js` for deployment. The generated asset is a build artifact rather than a second translation authority.

The runtime uses the same application views and logic for every UI locale. English is the deterministic default/fallback locale, the active UI locale controls the document `lang` metadata, plural-capable strings follow the i18next JSON v4 / CLDR suffix model, and locale-aware number/currency formatting is applied where relevant.

The UI locale is independent from JEPC catalogue/source-data language governed by Issue #620. Part numbers, VINs, model/Range identifiers, JEPC identifiers, and other domain/source values remain data rather than translated identities.

The deployed VIEPS application consumes repository-built resources only. Weblate is not required by the production request/runtime path.

## Weblate repository integration contract

Issue #679 configures Weblate against the repository contract selected by Issues #554 and #676:

```text
Repository:
jagports/jagports

File mask:
5-Implementation-Projects/internet/jagports/solution/vieps/i18n/*.json

Monolingual base language file:
5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json

File format:
i18next JSON file v4

Weblate format identifier:
i18nextv4

JSON key ordering:
json_sort_keys = case_sensitive
```

Weblate is an authoring/review integration. Translation changes intended for release must enter the normal Jagports GitHub branch/PR/CI/review workflow; Weblate automation must not bypass `main`, repository validation, or required human review. AI or machine translation may produce proposals/drafts but is not release authority.

GitHub remains authoritative for released translation resources, and the normal VIEPS build consumes those reviewed repository resources.

## Weblate operations

Deployment/operations:

[`../../../../../../3-Deployment/internet/weblate/README.md`](../../../../../../3-Deployment/internet/weblate/README.md)

Compact translation update procedure:

[`../../../../../../3-Deployment/internet/weblate/Update-Translations.md`](../../../../../../3-Deployment/internet/weblate/Update-Translations.md)

Canonical live component:

https://hosted.weblate.org/projects/jagports-vieps/vieps-ui/
