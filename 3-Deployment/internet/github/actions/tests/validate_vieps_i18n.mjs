import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const i18nDir = resolve(
  '5-Implementation-Projects/internet/jagports/solution/vieps/i18n',
);

const REQUIRED_LOCALES = ['en.json', 'fi.json'];
const PLURAL_KEY = /^(.*)_(zero|one|two|few|many|other)$/;

function localeFromFilename(filename) {
  return filename.replace(/\.json$/, '').replaceAll('_', '-');
}

function loadJson(filename) {
  const path = resolve(i18nDir, filename);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${filename}: invalid JSON: ${error.message}`);
  }
  assert.ok(parsed && typeof parsed === 'object' && !Array.isArray(parsed), `${filename}: root must be a JSON object`);
  return parsed;
}

function assertAlphabeticalKeys(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;

  const keys = Object.keys(value);
  const sorted = [...keys].sort();
  assert.deepEqual(keys, sorted, `${path}: sibling keys must be case-sensitive alphabetically ordered`);

  for (const key of keys) {
    assertAlphabeticalKeys(value[key], `${path}.${key}`);
  }
}

function assertPluralFamilies(value, locale, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;

  const families = new Map();

  for (const [key, child] of Object.entries(value)) {
    const match = key.match(PLURAL_KEY);
    if (!match) {
      assertPluralFamilies(child, locale, `${path}.${key}`);
      continue;
    }

    const [, base, category] = match;
    assert.ok(base.length > 0, `${path}.${key}: plural key must have a non-empty base name`);
    assert.equal(typeof child, 'string', `${path}.${key}: i18next v4 plural values must be strings`);

    if (!families.has(base)) families.set(base, new Set());
    families.get(base).add(category);
  }

  if (families.size === 0) return;

  let categories;
  try {
    categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  } catch (error) {
    throw new Error(`${locale}: invalid locale filename for plural validation: ${error.message}`);
  }

  const required = new Set(categories);
  const allowed = new Set([...categories, 'zero']);

  for (const [base, present] of families) {
    for (const category of required) {
      assert.ok(present.has(category), `${path}.${base}: missing required i18next v4 plural suffix _${category} for ${locale}`);
    }
    for (const category of present) {
      assert.ok(allowed.has(category), `${path}.${base}: plural suffix _${category} is not valid for ${locale}`);
    }
  }
}

function collectLogicalStructure(value, path = '<root>', entries = []) {
  if (Array.isArray(value)) {
    entries.push(`${path}:array:${value.length}`);
    value.forEach((item, index) => collectLogicalStructure(item, `${path}[${index}]`, entries));
    return entries;
  }

  if (value && typeof value === 'object') {
    entries.push(`${path}:object`);
    const seenPluralFamilies = new Set();

    for (const key of Object.keys(value)) {
      const match = key.match(PLURAL_KEY);
      if (match) {
        const base = match[1];
        if (!seenPluralFamilies.has(base)) {
          seenPluralFamilies.add(base);
          entries.push(`${path === '<root>' ? base : `${path}.${base}`}:plural`);
        }
        continue;
      }

      collectLogicalStructure(
        value[key],
        path === '<root>' ? key : `${path}.${key}`,
        entries,
      );
    }
    return entries;
  }

  entries.push(`${path}:${typeof value}`);
  return entries;
}

const localeFiles = readdirSync(i18nDir)
  .filter((filename) => filename.endsWith('.json'))
  .sort();

for (const required of REQUIRED_LOCALES) {
  assert.ok(localeFiles.includes(required), `missing required locale resource ${required}`);
}

const resources = new Map(localeFiles.map((filename) => [filename, loadJson(filename)]));
const base = resources.get('en.json');
const baseStructure = collectLogicalStructure(base);

for (const [filename, resource] of resources) {
  const locale = localeFromFilename(filename);
  assertAlphabeticalKeys(resource, filename);
  assertPluralFamilies(resource, locale, filename);
  assert.deepEqual(
    collectLogicalStructure(resource),
    baseStructure,
    `${filename}: logical translation-key hierarchy must match en.json`,
  );
}

console.log(`Validated ${localeFiles.length} VIEPS i18n locale file(s): ${localeFiles.join(', ')}`);
