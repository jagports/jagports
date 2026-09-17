# SKILL — VIEPS i18n execution

## Purpose

This skill is the machine/agent execution procedure for the VIEPS i18n governance rules defined in:

`00-Management/RULES_i18n.md`

It supplements `0-DocumentationEducationCompetense/SKILL.md` and the canonical Management workflow in `00-Management/WORKFLOWS.md`. It does not redefine Issue/PR lifecycle, review, testing, or merge rules.

## When this skill applies

Apply this procedure whenever a task creates, modifies, reviews, or refactors VIEPS UI/application code that can contain human-visible text.

Also apply it when modifying VIEPS translation resources under:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

## Mandatory changed-code scan

For every applicable implementation change:

1. Inspect added and modified UI/application code for human-visible static strings.
2. Classify each string as:
   - localizable UI/application presentation text;
   - non-translatable domain/source data;
   - internal/developer-only text.
3. Convert localizable presentation text to a stable semantic i18next key.
4. Do not introduce a second hard-coded localized path beside the i18n resource path.
5. When pre-existing hard-coded localizable text is encountered in the implementation path being changed, convert it when reasonably within the task scope.

Examples normally requiring i18n keys include labels, headings, buttons, navigation, user-visible validation/errors, status text, help text, placeholders, prompts, and explanatory copy.

## Translation resource contract

Use:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json`

and:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json`

The resource contract is:

- i18next JSON v4;
- Weblate `i18nextv4`;
- `en.json` as monolingual base/source language;
- same logical key hierarchy across required locales;
- case-sensitive alphabetical sibling-key ordering recursively;
- i18next v4 / CLDR-compatible plural suffixes for plural-capable strings.

## EN ↔ FI handling

When adding a new localizable key, maintain the English and Finnish values together.

### Source text is English

1. Use the supplied/approved English meaning as the canonical `en.json` value.
2. Create a Finnish translation proposal for the same key in `fi.json`.
3. Preserve terminology already established by existing approved translations where applicable.
4. Mark/communicate the Finnish value as AI/machine-proposed until human/Weblate review approves it.

### Source text is Finnish

1. Preserve the supplied/approved Finnish meaning in `fi.json`.
2. Create an English source-language proposal for the same key in `en.json`.
3. Ensure the English wording expresses the same application meaning rather than performing a word-for-word translation when that would distort the UI concept.
4. Treat the generated English value as proposed content until human/Weblate review approves it as the canonical source value.

### Source text is another language

Do not silently make that language the canonical UI source language.

Create/obtain a canonical English meaning for `en.json`, create the corresponding Finnish value for `fi.json`, and preserve any separately governed source-language data outside the UI translation mechanism where applicable.

## AI translation rule

AI/machine translation is permitted and expected as an acceleration mechanism, not as release authority.

The agent may automatically generate the missing EN↔FI counterpart during implementation, but must not claim human linguistic approval.

Weblate/human review remains authoritative for released translations.

When existing approved terminology exists, prefer consistent reuse over inventing new terminology.

## Non-translatable boundary

Do not convert the following into translated identities merely because they are visible:

- Jaguar part numbers;
- VINs;
- EPC/JEPC/source identifiers;
- normalized database/API codes;
- canonical model/Range identifiers;
- imported JEPC source-language catalogue text governed separately from UI locale;
- URLs and machine protocol values;
- schema/field names and internal identifiers;
- developer-only diagnostics/log text not shown as UI.

Localize the surrounding label/explanation instead of altering these values.

User-visible errors/status messages are localizable presentation text even when their internal diagnostic details are not.

## Key creation and maintenance

Use semantic, stable keys based on UI meaning/structure rather than literal English or Finnish text.

Example:

```text
stock.quality.unclassified.label
```

not:

```text
Condition not classified
```

When inserting or modifying keys:

1. Preserve the existing nested hierarchy unless a specification change requires otherwise.
2. Keep sibling keys in case-sensitive alphabetical order.
3. Update both `en.json` and `fi.json` at the corresponding logical path.
4. Preserve plural families and required CLDR categories where pluralization applies.
5. Do not rename a key merely to accommodate one language's wording.

## Validation before review

Before handing an applicable change to review, verify:

- changed UI/application code has been scanned for hard-coded human-visible strings;
- new/modified localizable strings resolve through i18next keys;
- corresponding English and Finnish entries exist;
- JSON is valid;
- required locale hierarchy is compatible;
- recursive case-sensitive alphabetical ordering is preserved;
- plural families are structurally valid where used;
- domain/source identifiers have not been translated as identities;
- no Weblate runtime dependency has been introduced.

Run or extend deterministic repository tests/CI where available.

If static-analysis tooling can reliably detect hard-coded localizable strings, integrate or use it. Do not use a naive detector that treats arbitrary source/domain literals as translation defects without context.

## Review communication

When AI generated one side of an EN↔FI pair, report that fact in the PR/review evidence when linguistically relevant.

Do not describe AI-generated translation as human-approved.

Human/Weblate review may alter wording without changing the stable i18n key or application logic.

## Precedence

`00-Management/WORKFLOWS.md` remains authoritative for workflow.

`00-Management/RULES_i18n.md` is authoritative for VIEPS i18n governance.

This file is the execution procedure implementing those i18n rules for agents and automation.
