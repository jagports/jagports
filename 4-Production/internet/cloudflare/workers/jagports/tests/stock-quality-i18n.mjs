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

const PRESENTATION_FIELDS = ['label', 'long_description', 'short_description'];
const QUALITY_KEYS = ['A', 'B', 'C', 'D', 'E', 'unclassified'];
const REQUIRED_LOCALE_FILES = ['en.json', 'fi.json'];

function loadLocale(filename) {
  return JSON.parse(readFileSync(resolve(i18nDir, filename), 'utf8'));
}

function assertAlphabeticalKeys(value, path = '<root>') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertAlphabeticalKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const keys = Object.keys(value);
  const sorted = [...keys].sort();
  assert.deepEqual(keys, sorted, `${path}: sibling keys must be alphabetically ordered`);

  for (const key of keys) {
    assertAlphabeticalKeys(value[key], path === '<root>' ? key : `${path}.${key}`);
  }
}

function collectStructure(value, path = '<root>', entries = []) {
  if (Array.isArray(value)) {
    entries.push(`${path}:array:${value.length}`);
    value.forEach((item, index) => collectStructure(item, `${path}[${index}]`, entries));
    return entries;
  }
  if (value && typeof value === 'object') {
    entries.push(`${path}:object`);
    for (const key of Object.keys(value)) {
      collectStructure(value[key], path === '<root>' ? key : `${path}.${key}`, entries);
    }
    return entries;
  }

  entries.push(`${path}:${typeof value}`);
  return entries;
}

test('locale resources use valid, alphabetically ordered, structurally consistent nested JSON', () => {
  const localeFiles = readdirSync(i18nDir)
    .filter((filename) => filename.endsWith('.json'))
    .sort();

  for (const required of REQUIRED_LOCALE_FILES) {
    assert.ok(localeFiles.includes(required), `missing required locale resource ${required}`);
  }

  const resources = new Map(localeFiles.map((filename) => [filename, loadLocale(filename)]));
  const base = resources.get('en.json');
  const baseStructure = collectStructure(base);

  for (const [filename, resource] of resources) {
    assertAlphabeticalKeys(resource, filename);
    assert.deepEqual(
      collectStructure(resource),
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
