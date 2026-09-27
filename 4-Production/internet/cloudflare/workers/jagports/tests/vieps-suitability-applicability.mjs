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
      value: '', hidden: false, disabled: false, textContent: '', listeners: {}, attrs: {},
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
    async search(query) {
      get('partNumber').value = query;
      await get('partSearch').listeners.submit({ preventDefault() {} });
    },
  };
}

function productionPath(t) {
  const db = database();
  t.after(() => db.close());
  const env = { DB: d1(db) };
  const fetch = (url) => handleViepsPart(new Request(`https://example.test${url}`), env);
  return { db, env, fetch, ui: uiHarness(fetch) };
}

async function api(env, partNumber) {
  const response = await handleViepsPart(
    new Request(`https://example.test/api/vieps/part?q=${encodeURIComponent(partNumber)}`),
    env,
  );
  assert.equal(response.status, 200);
  return response.json();
}

test('production API carries applicability_state for applicable, excluded and unavailable fixtures', async (t) => {
  const { env } = productionPath(t);

  const applicable = await api(env, 'MJB7703AA');
  assert.ok(applicable.fitment.length >= 4);
  assert.deepEqual(
    [...new Set(applicable.fitment.map((row) => row.applicability_state))].sort(),
    ['applicable', 'excluded', 'unavailable'],
  );

  const excluded = await api(env, 'MNA7691AA');
  assert.equal(excluded.fitment.length, 1);
  assert.equal(excluded.fitment[0].applicability_state, 'excluded');

  const unavailable = await api(env, 'XR847031');
  assert.equal(unavailable.fitment.length, 1);
  assert.equal(unavailable.fitment[0].applicability_state, 'unavailable');
});

test('production UI includes applicable ranges and preserves canonical PART while range context changes', async (t) => {
  const { ui } = productionPath(t);
  await ui.search('MJB7703AA');

  assert.match(ui.get('ranges').innerHTML, /X100/);
  assert.match(ui.get('ranges').innerHTML, /X150/);
  assert.match(ui.get('partCard').innerHTML, /MJB7703AA/);

  ui.get('rangeSelect').value = 'X150';
  ui.get('rangeSelect').listeners.change();
  assert.match(ui.get('rangeEvidence').innerHTML, /X150|4\.0|variation|qualifier/i);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /X100 —.*X150 —.*X100 —/);
  assert.match(ui.get('partCard').innerHTML, /MJB7703AA/);
});

test('production UI excludes confirmed excluded ranges from suitable presentation', async (t) => {
  const { ui } = productionPath(t);
  await ui.search('MNA7691AA');

  assert.equal(ui.get('rangeSelect').disabled, true);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /X100 —/);
  assert.match(ui.get('ranges').innerHTML, /No suitable vehicle range matches this PART\/context/);
});

test('production UI represents unavailable applicability distinctly from confirmed no-match', async (t) => {
  const { ui } = productionPath(t);
  await ui.search('XR847031');

  assert.equal(ui.get('rangeSelect').disabled, true);
  assert.match(ui.get('ranges').innerHTML, /Vehicle applicability data is unavailable/);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /matches this PART\/context/);
});
