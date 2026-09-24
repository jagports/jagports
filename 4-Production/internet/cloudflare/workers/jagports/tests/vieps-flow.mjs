import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { database, d1 } from './helpers/model-db.mjs';
import { handleViepsPart } from '../src/vieps.js';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const code = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const i18nCode = readFileSync(new URL('../public/i18n-runtime.js', import.meta.url), 'utf8');
const en = JSON.parse(readFileSync(new URL('../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json', import.meta.url), 'utf8'));
const fi = JSON.parse(readFileSync(new URL('../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json', import.meta.url), 'utf8'));

function uiHarness(fetch) {
  const nodes = new Map();
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
    nodes.set(id, {
      value: '', checked: false, hidden: false, disabled: false, textContent: '', listeners: {}, attrs: {},
      set innerHTML(value) {
        this.markup = value;
        if (id.endsWith('Select')) this.value = value.match(/value="([^"]*)"/)?.[1] || '';
      },
      get innerHTML() { return this.markup || ''; },
      addEventListener(event, fn) { this.listeners[event] = fn; },
      setAttribute(key, value) { this.attrs[key] = value; },
      querySelector() { return null; },
    });
  }
  const document = {
    documentElement: { lang: 'en' },
    getElementById: id => nodes.get(id),
    querySelectorAll: () => [],
  };
  const context = { document, fetch, Intl, VIEPS_I18N_RESOURCES: { en, fi } };
  vm.runInNewContext(i18nCode, context);
  vm.runInNewContext(code, context);
  const get = id => nodes.get(id);
  return {
    get,
    async search(query, { stockOnly = false } = {}) {
      get('partNumber').value = query;
      get('availabilitySelect').checked = stockOnly;
      await get('partSearch').listeners.submit({ preventDefault() {} });
    },
  };
}

function productionPath(t) {
  const db = database();
  t.after(() => db.close());
  const env = { DB: d1(db) };
  const fetch = (url) => handleViepsPart(new Request(`https://example.test${url}`), env);
  return { db, env, ui: uiHarness(fetch) };
}

test('coordinated MVP flow keeps canonical PART through tree, suitable Range, variations and Part Image', async (t) => {
  const { ui } = productionPath(t);
  await ui.search('MJB7703AA');

  assert.match(ui.get('partCard').innerHTML, /MJB7703AA/);
  assert.match(ui.get('tree').innerHTML, /Body/);
  assert.match(ui.get('tree').innerHTML, /selected-path/);
  assert.match(ui.get('ranges').innerHTML, /X100/);
  assert.match(ui.get('ranges').innerHTML, /X150/);

  ui.get('rangeSelect').value = 'X100';
  ui.get('rangeSelect').listeners.change();

  assert.match(ui.get('locationStatus').textContent, /X100/);
  assert.match(ui.get('partCard').innerHTML, /MJB7703AA/);
  assert.match(ui.get('rangeEvidence').innerHTML, /4\.0 Coupe/);
  assert.match(ui.get('rangeEvidence').innerHTML, /4\.0 Convertible/);
  assert.doesNotMatch(ui.get('rangeEvidence').innerHTML, /Excluded fixture variation/);
  assert.doesNotMatch(ui.get('rangeEvidence').innerHTML, /Unavailable fixture variation/);
  assert.match(ui.get('visuals').innerHTML, /\/fixtures\/mjb7703aa\.svg/);
  assert.match(ui.get('visuals').innerHTML, /Representative verified fixture Part Image/);
  assert.match(ui.get('locationStatus').textContent, /unavailable/i);
});

test('variation panel distinguishes confirmed no-match from unavailable applicability', async (t) => {
  const { ui } = productionPath(t);

  await ui.search('MNA7691AA');
  assert.match(ui.get('rangeEvidence').innerHTML, /No applicable variation matches the selected PART\/context/);

  await ui.search('XR847031');
  assert.match(ui.get('rangeEvidence').innerHTML, /Variation applicability data is unavailable/);
});

test('public stock-only filter distinguishes stocked PARTs from stock-filtered empty results', async (t) => {
  const { db, ui } = productionPath(t);

  await ui.search('MJB7703AA', { stockOnly: true });
  assert.match(ui.get('partCard').innerHTML, /MJB7703AA/);

  db.prepare(`UPDATE stock_item SET available=0 WHERE part_id=(SELECT id FROM part WHERE part_number_normalized='MJB7703AA')`).run();
  await ui.search('MJB7703AA', { stockOnly: true });
  assert.match(ui.get('searchStatus').textContent, /currently on stock/i);

  await ui.search('MJB7703AA');
  assert.match(ui.get('partCard').innerHTML, /MJB7703AA/);
});

test('Part Image path keeps unavailable and non-numbered states explicit', async (t) => {
  const { ui } = productionPath(t);
  await ui.search('firtree1');

  assert.match(ui.get('partCard').innerHTML, /No Jaguar part number/);
  assert.match(ui.get('visuals').innerHTML, /Image \/ diagram unavailable/);
});

test('Concept-11 acceptance regions remain visibly represented in the production shell', () => {
  for (const id of [
    'partSearch', 'availabilitySelect', 'tree', 'rangeSelect', 'ranges',
    'vehicleLocation', 'locationStatus', 'rangeEvidence', 'partCard',
    'visualChooser', 'visualSelect', 'visuals',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.match(html, /data-i18n="stock\.filter_on_stock"/);
  assert.match(html, /data-i18n="location\.heading"/);
  assert.match(html, /data-i18n="fitment\.heading"/);
  assert.match(html, /data-i18n="visual\.heading"/);
});
