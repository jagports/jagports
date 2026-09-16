import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const code = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const i18nCode = readFileSync(new URL('../public/i18n-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles/vieps-tailwind.css', import.meta.url), 'utf8');
const en = JSON.parse(readFileSync(new URL('../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json', import.meta.url), 'utf8'));
const fi = JSON.parse(readFileSync(new URL('../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json', import.meta.url), 'utf8'));

function harness(fetch) {
  const nodes = new Map();
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
    nodes.set(id, {
      value: '', hidden: false, disabled: false, textContent: '', listeners: {}, attrs: {},
      set innerHTML(value) { this.markup = value; if (id.endsWith('Select')) this.value = value.match(/value="([^"]*)"/)?.[1] || ''; },
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
    document,
    get,
    async search(query) { get('partNumber').value = query; await get('partSearch').listeners.submit({ preventDefault() {} }); },
    setLanguage(language) { get('languageSelect').listeners.change({ target: { value: language } }); },
  };
}

const response = (data, ok = true) => ({ ok, json: async () => data });
const fixture = {
  part: { part_number_normalized: 'TEST1', description: 'Test <part>', verification_status: 'fixture' },
  parts_tree: [{ path: ['Parent', 'Child'] }], images: [], diagrams: [],
  fitment: [
    { range_code: 'A', range_name: 'Range A', variation: 'Alpha', applicability_state: 'applicable' },
    { range_code: 'A', range_name: 'Range A', variation: 'Alpha 2', applicability_state: 'applicable' },
    { range_code: 'B', range_name: 'Range B', variation: 'Beta', applicability_state: 'applicable' },
  ],
};

test('complete Concept-11 shell exists before search, with no automatic part lookup', () => {
  let requests = 0;
  const ui = harness(() => { requests++; });
  assert.equal(requests, 0);
  assert.equal(ui.get('partCard').innerHTML.includes('No part selected.'), true);
  assert.doesNotMatch(html, /id="result"[^>]*hidden/);
  for (const region of ['tree', 'location', 'visual', 'ranges', 'fitment']) {
    assert.match(html, new RegExp(`class="panel ${region}-panel"`));
  }
  assert.match(html, /id="languageSelect"/);
  assert.match(html, /data-i18n="common\.search"/);
  assert.match(html, /id="vehicleLocation"/);
  assert.doesNotMatch(html, /Top view|Side view/);
  assert.match(css, /"tree search search"\s*"tree ranges ranges"\s*"tree location suitability"\s*"tree details details"/);
  assert.match(css, /max-width:\s*1100px/);
  assert.match(css, /max-width:\s*760px/);
  assert.match(html, /href="vieps-tailwind\.css"/);
  assert.doesNotMatch(html, /picocss|cdn\.tailwindcss\.com/i);
});

test('search renders escaped identity, nested paths and range-specific variations', async () => {
  const ui = harness(async () => response(fixture));
  await ui.search('TEST1');
  assert.match(ui.get('partCard').innerHTML, /Test &lt;part&gt;/);
  assert.match(ui.get('tree').innerHTML, /selected-path/);
  assert.match(ui.get('fitment').innerHTML, /Alpha 2/);
  assert.doesNotMatch(ui.get('fitment').innerHTML, /Beta/);
  ui.get('rangeSelect').value = 'B';
  ui.get('rangeSelect').listeners.change();
  assert.match(ui.get('fitment').innerHTML, /Beta/);
  assert.doesNotMatch(ui.get('fitment').innerHTML, /Alpha/);
  assert.match(ui.get('partCard').innerHTML, /TEST1/);
});

test('only applicable ranges are presented as suitable', async () => {
  const ui = harness(async () => response({ ...fixture, fitment: [
    { range_code: 'A', range_name: 'Range A', variation: 'Alpha', applicability_state: 'applicable' },
    { range_code: 'B', range_name: 'Range B', variation: 'Beta', applicability_state: 'excluded' },
    { range_code: 'C', range_name: 'Range C', variation: 'Gamma', applicability_state: 'unavailable' },
  ] }));
  await ui.search('TEST1');
  assert.match(ui.get('ranges').innerHTML, /Range A/);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /Range B|Range C/);
  assert.match(ui.get('fitment').innerHTML, /Alpha/);
  assert.doesNotMatch(ui.get('fitment').innerHTML, /Beta|Gamma/);
});

test('confirmed no-match and unavailable applicability are distinct UI states', async () => {
  let current = { ...fixture, fitment: [
    { range_code: 'B', range_name: 'Range B', applicability_state: 'excluded' },
  ] };
  const ui = harness(async () => response(current));
  await ui.search('TEST1');
  assert.match(ui.get('ranges').innerHTML, /No suitable vehicle range matches this PART\/context/);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /data is unavailable/);

  current = { ...fixture, fitment: [
    { range_code: 'C', range_name: 'Range C', applicability_state: 'unavailable' },
  ] };
  await ui.search('TEST1');
  assert.match(ui.get('ranges').innerHTML, /Vehicle applicability data is unavailable/);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /matches this PART\/context/);
});

test('empty and failed searches clear old results without hiding the page', async () => {
  let fail = false;
  const ui = harness(async () => response(fail ? { error: 'part not found' } : fixture, !fail));
  await ui.search('TEST1');
  await ui.search('');
  assert.equal(ui.get('rangeSelect').disabled, true);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  fail = true;
  await ui.search('unknown');
  assert.equal(ui.get('searchStatus').textContent, 'Part not found.');
  assert.equal(ui.get('result').hidden, false);
  assert.equal(ui.get('result').attrs['aria-busy'], 'false');
});

test('late responses cannot restore a cleared part', async () => {
  let finish;
  const ui = harness(() => new Promise(resolve => { finish = resolve; }));
  const pending = ui.search('TEST1');
  ui.get('partNumber').value = '';
  ui.get('partNumber').listeners.input();
  finish(response(fixture));
  await pending;
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  assert.equal(ui.get('rangeSelect').disabled, true);
});

test('only one selected visual is rendered; unavailable media is not presented as available', async () => {
  const ui = harness(async () => response({ ...fixture, images: [
    { image_url: '/a.png', description: 'First', availability_status: 'available' },
    { image_url: '/b.png', description: 'Second', availability_status: 'unavailable' },
  ] }));
  await ui.search('TEST1');
  assert.equal((ui.get('visuals').innerHTML.match(/<img/g) || []).length, 1);
  assert.equal(ui.get('visualChooser').hidden, false);
  ui.get('visualSelect').value = '1';
  ui.get('visualSelect').listeners.change();
  assert.doesNotMatch(ui.get('visuals').innerHTML, /<img/);
  assert.match(ui.get('visuals').innerHTML, /unavailable/);
});

test('locale switching rerenders presentation without changing canonical data', async () => {
  const ui = harness(async () => response(fixture));
  await ui.search('TEST1');
  ui.setLanguage('fi');
  assert.equal(ui.document.documentElement.lang, 'fi');
  assert.equal(ui.get('searchStatus').textContent, 'OSA ratkaistu.');
  assert.match(ui.get('partCard').innerHTML, /TEST1/);
  assert.match(ui.get('fitment').innerHTML, /Muunnelma/);
  assert.match(ui.get('ranges').innerHTML, /Range A/);
});
