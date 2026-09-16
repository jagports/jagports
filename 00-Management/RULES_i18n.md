# RULES — VIEPS i18n

## Purpose and authority

This file defines the human/contributor governance rules for VIEPS UI/application internationalization.

It is referenced by `00-Management/RULES.md` and complements the canonical Management workflow in `00-Management/WORKFLOWS.md`. It does not redefine Issue/PR lifecycle, review, testing, or merge workflow.

The machine/agent execution procedure is defined in:

`0-DocumentationEducationCompetense/SKILL_i18n.md`

The selected VIEPS i18n architecture is owned by Issue #554 and the translation-resource file contract by Issue #676.

## Scope

These rules apply whenever a repository change creates, modifies, or exposes human-visible VIEPS UI/application text.

They apply to, for example:

- labels and headings;
- buttons and navigation;
- status and availability text;
- validation and error messages shown to users;
- help and explanatory UI copy;
- placeholders and prompts;
- other static human-visible application text.

## Mandatory hard-coded-text check

Every VIEPS UI/application implementation change must inspect the changed code for human-visible static text.

New or modified localizable human-visible text must not remain hard-coded in implementation code when it can reasonably be represented by the VIEPS i18n mechanism.

When pre-existing hard-coded localizable text is encountered in the implementation path being changed, convert it to the canonical i18n mechanism when that conversion is reasonably within the change scope rather than adding another parallel hard-coded convention.

A localizable string is represented by a stable semantic i18n key. The visible English or Finnish text itself must not be used as the translation-key identity.

## Canonical translation resources

VIEPS UI translation resources are stored under:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

The current required source/initial locale pair is:

- `en.json` — canonical monolingual base/source-language resource;
- `fi.json` — Finnish translation resource.

Resources use:

- i18next JSON v4;
- Weblate format identifier `i18nextv4`;
- matching logical key hierarchy between required locales;
- case-sensitive alphabetical sibling-key ordering at every JSON object level;
- i18next v4 / CLDR-compatible plural handling where required.

## English/Finnish source handling

For a new localizable UI concept, both the English source entry and Finnish translation entry must be maintained together unless an approved exception explicitly documents why one side cannot yet be supplied.

If the implementation text is supplied in English:

- the supplied/approved English meaning becomes the canonical `en.json` value;
- a Finnish translation is created for the same key in `fi.json`.

If the implementation text is supplied in Finnish:

- the supplied/approved Finnish meaning is retained in `fi.json`;
- a canonical English source value is created for the same key in `en.json`.

AI/machine translation may be used to produce the initial EN↔FI counterpart, but generated text is a translation proposal, not independent release authority.

Human/Weblate review and approval remains authoritative for released translation content.

## Translation-management boundary

Weblate is the selected Translation Management System for VIEPS UI translations.

GitHub remains the authoritative source of released translation resources.

Weblate may provide machine/AI-assisted suggestions, translator editing, and reviewer approval, but the TMS must not become a production runtime dependency.

Released builds must remain reproducible from repository content.

## Non-translatable and separately governed data

Do not convert domain identity or source evidence into UI translation identity merely because it is displayed to a human.

Examples normally outside the UI-translation mechanism include:

- Jaguar part numbers;
- VINs;
- EPC/JEPC identifiers;
- normalized database/API codes;
- canonical model/Range identifiers;
- source-language JEPC catalogue text governed by the multilingual catalogue-data model;
- URLs, machine protocol values, schema/field names, and internal identifiers;
- developer-only diagnostics/log messages that are not presented as application UI.

If such data requires a localized surrounding label or explanation, localize the surrounding presentation text while preserving the underlying data value unchanged.

User-visible errors and status messages are UI text and are localizable even when related internal diagnostics are not.

## Review and validation expectations

A VIEPS UI/application change is not i18n-compatible merely because locale files exist.

Review should verify, where applicable:

- changed code has been checked for hard-coded human-visible strings;
- new/modified localizable text resolves through semantic i18n keys;
- `en.json` and `fi.json` contain the corresponding logical keys;
- any AI-generated counterpart is treated as proposed translation content for human/Weblate review;
- resource hierarchy, alphabetical ordering, and plural conventions remain valid;
- domain/source identifiers have not been incorrectly translated;
- the application does not acquire a runtime dependency on Weblate.

CI/static analysis should detect newly introduced hard-coded localizable UI strings where practical. Deterministic checks must not guess that arbitrary domain/source text is a translation defect.

## Conflict and precedence

`00-Management/WORKFLOWS.md` remains authoritative for Management workflow.

This file is the canonical repository-wide i18n governance rule for VIEPS UI/application implementation. More specific specifications may refine an i18n behavior but must not create a competing translation-file convention or bypass the human approval boundary without an explicit superseding decision.
