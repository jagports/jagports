import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const i18nDir = resolve(
  here,
  '../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n',
);

const QUALITY_KEYS = ['A', 'B', 'C', 'D', 'E', 'unclassified'];
const PRESENTATION_FIELDS = ['label', 'short_description', 'long_description'];

function loadLocale(locale) {
  return JSON.parse(readFileSync(resolve(i18nDir, `${locale}.json`), 'utf8'));
}

test('stock-quality locale resources expose normalized A-E and unclassified presentation keys', () => {
  const resources = {
    en: loadLocale('en'),
    fi: loadLocale('fi'),
  };

  for (const [locale, resource] of Object.entries(resources)) {
    const quality = resource?.stock?.quality;
    assert.ok(quality, `${locale}: missing stock.quality resource`);
    assert.deepEqual(Object.keys(quality), QUALITY_KEYS, `${locale}: unexpected stock-quality key set`);

    for (const key of QUALITY_KEYS) {
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
