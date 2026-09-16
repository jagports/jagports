import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const i18nDir = resolve(
  here,
  '../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n',
);

const PLURAL_KEY = /^(.*)_(zero|one|two|few|many|other)$/;
const PRESENTATION_FIELDS = ['label', 'long_description', 'short_description'];
const QUALITY_KEYS = ['A', 'B', 'C', 'D', 'E', 'unclassified'];
const REQUIRED_LOCALE_FILES = ['en.json', 'fi.json'];

function loadLocale(filename) {
  return JSON.parse(readFileSync(resolve(i18nDir, filename), 'utf8'));
}

function localeFromFilename(filename) {
  return filename.replace(/\.json$/, '').replaceAll('_', '-');
}

function assertAlphabeticalKeys(value, path = '<root>') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertAlphabeticalKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const keys = Object.keys(value);
  const sorted = [...keys].sort();
  assert.deepEqual(keys, sorted, `${path}: sibling keys must be case-sensitive alphabetically ordered`);

  for (const key of keys) {
    assertAlphabeticalKeys(value[key], path === '<root>' ? key : `${path}.${key}`);
  }
}

function assertPluralFamilies(value, locale, path = '<root>') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPluralFamilies(item, locale, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const families = new Map();
  for (const [key, child] of Object.entries(value)) {
    const match = key.match(PLURAL_KEY);
    if (match) {
      const [, base, category] = match;
      assert.ok(base.length > 0, `${path}.${key}: plural key must have a non-empty base name`);
      assert.equal(typeof child, 'string', `${path}.${key}: i18next v4 plural value must be a string`);
      if (!families.has(base)) families.set(base, new Set());
      families.get(base).add(category);
    } else {
      assertPluralFamilies(child, locale, path === '<root>' ? key : `${path}.${key}`);
    }
  }

  if (families.size === 0) return;

  let pluralCategories;
  try {
    pluralCategories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  } catch (error) {
    assert.fail(`${locale}: locale filename must be valid for Intl.PluralRules (${error.message})`);
  }

  const required = new Set(pluralCategories);
  const allowed = new Set([...pluralCategories, 'zero']);

  for (const [base, categories] of families) {
    for (const category of required) {
      assert.ok(
        categories.has(category),
        `${locale}:${path}.${base}: missing required CLDR plural suffix _${category}`,
      );
    }
    for (const category of categories) {
      assert.ok(
        allowed.has(category),
        `${locale}:${path}.${base}: plural suffix _${category} is not valid for this locale`,
      );
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
    const pluralFamilies = new Set();
    for (const key of Object.keys(value)) {
      const match = key.match(PLURAL_KEY);
      if (match) {
        const base = match[1];
        if (!pluralFamilies.has(base)) {
          pluralFamilies.add(base);
          entries.push(`${path === '<root>' ? base : `${path}.${base}`}:plural`);
        }
      } else {
        collectLogicalStructure(value[key], path === '<root>' ? key : `${path}.${key}`, entries);
      }
    }
    return entries;
  }

  entries.push(`${path}:${typeof value}`);
  return entries;
}

test('locale resources follow the ordered i18next v4 file contract', () => {
  const localeFiles = readdirSync(i18nDir)
    .filter((filename) => filename.endsWith('.json'))
    .sort();

  for (const required of REQUIRED_LOCALE_FILES) {
    assert.ok(localeFiles.includes(required), `missing required locale resource ${required}`);
  }

  const resources = new Map(localeFiles.map((filename) => [filename, loadLocale(filename)]));
  const base = resources.get('en.json');
  const baseStructure = collectLogicalStructure(base);

  for (const [filename, resource] of resources) {
    const locale = localeFromFilename(filename);
    assertAlphabeticalKeys(resource, filename);
    assertPluralFamilies(resource, locale, filename);
    assert.deepEqual(
      collectLogicalStructure(resource),
      baseStructure,
      `${filename}: translation-key hierarchy must match en.json`,
    );
  }
});

test('stock-quality locale resources expose normalized A-E and unclassified presentation keys', () => {
  const resources = {
    en: loadLocale('en.json'),
    fi: loadLocale('fi.json'),
  };

  for (const [locale, resource] of Object.entries(resources)) {
    const quality = resource?.stock?.quality;
    assert.ok(quality, `${locale}: missing stock.quality resource`);
    assert.deepEqual(Object.keys(quality), QUALITY_KEYS, `${locale}: unexpected stock-quality key set`);

    for (const key of QUALITY_KEYS) {
      assert.deepEqual(
        Object.keys(quality[key]),
        PRESENTATION_FIELDS,
        `${locale}: ${key} presentation fields must be alphabetically ordered`,
      );
      for (const field of PRESENTATION_FIELDS) {
        assert.equal(typeof quality[key]?.[field], 'string', `${locale}: ${key}.${field} must be a string`);
        assert.ok(quality[key][field].trim().length > 0, `${locale}: ${key}.${field} must not be blank`);
      }
    }
  }

  assert.equal(resources.en.stock.quality.unclassified.label, 'Condition not classified');
  assert.equal(resources.fi.stock.quality.unclassified.label, 'Kunto luokittelematta');

  // `unclassified` is a presentation key for condition_code = NULL, not a sixth D1 quality code.
  assert.deepEqual(QUALITY_KEYS.filter((key) => key !== 'unclassified'), ['A', 'B', 'C', 'D', 'E']);
});
