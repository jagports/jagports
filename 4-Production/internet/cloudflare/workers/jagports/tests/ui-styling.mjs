import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const code = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/vieps.css', import.meta.url), 'utf8');
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
  vm.runInNewContext(code, { document: { getElementById: id => nodes.get(id) }, fetch });
  const get = id => nodes.get(id);
  return { get, async search(query) { get('partNumber').value = query; await get('partSearch').listeners.submit({ preventDefault() {} }); } };
}
const response = (data, ok = true) => ({ ok, json: async () => data });
const fixture = {
  part: { part_number_normalized: 'TEST1', description: 'Test <part>', verification_status: 'fixture' },
  parts_tree: [{ path: ['Parent', 'Child'] }], images: [], diagrams: [],
  fitment: [
    { range_code: 'A', range_name: 'Range A', variation: 'Alpha' },
    { range_code: 'A', range_name: 'Range A', variation: 'Alpha 2' },
    { range_code: 'B', range_name: 'Range B', variation: 'Beta' },
  ],
};
test('complete EMF shell exists before search, with no automatic part lookup', () => {
  let requests = 0;
  harness(() => { requests++; });
  assert.equal(requests, 0);
  assert.doesNotMatch(html, /id="result"[^>]*hidden/);
  for (const region of ['tree', 'location', 'visual', 'ranges', 'fitment']) assert.match(html, new RegExp(`class="panel ${region}-panel"`));
  assert.match(html, /No part selected/);
  assert.match(html, /Top view/);
  assert.match(html, /Side view/);
  assert.match(css, /"tree search ranges" "tree location ranges" "tree details ranges" "tree suitability ranges"/);
  assert.match(css, /max-width: 980px/);
  assert.match(css, /max-width: 700px/);
  assert.match(html, /@picocss\/pico@2/);
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
test('empty and failed searches clear old results without hiding the page', async () => {
  let fail = false;
  const ui = harness(async () => response(fail ? { error: 'part not found' } : fixture, !fail));
  await ui.search('TEST1');
  await ui.search('');
  assert.equal(ui.get('rangeSelect').disabled, true);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  fail = true;
  await ui.search('unknown');
  assert.equal(ui.get('searchStatus').textContent, 'part not found');
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
