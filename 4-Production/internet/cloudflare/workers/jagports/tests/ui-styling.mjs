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

function harness(fetch, { initialSearch = '', rootFetch } = {}) {
  const requests = [];
  const location = { pathname: '/vieps', search: initialSearch, hash: '#browse' };
  const history = { replaceState(_state, _title, path) {
    location.pathname = path.split(/[?#]/)[0];
    location.search = path.includes('?') ? '?' + path.split('?')[1].split('#')[0] : '';
    location.hash = path.includes('#') ? '#' + path.split('#')[1] : '';
  } };
  const routedFetch = (url) => {
    requests.push(url);
    if (url.startsWith('/api/vieps/tree?root=1')) return rootFetch
      ? rootFetch(url)
      : Promise.resolve(response({ state: 'root', roots: [
        { node_id: 1, label: 'Suspension', sort_order: 1 },
        { node_id: 8, label: 'Body', sort_order: 2 },
      ] }));
    return fetch(url);
  };
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
  const languageControls = [...html.matchAll(/data-language="([^"]+)"/g)].map(([, language]) => ({
    dataset: { language }, listeners: {},
    addEventListener(event, fn) { this.listeners[event] = fn; },
  }));
  const document = {
    documentElement: { lang: 'en' },
    getElementById: id => nodes.get(id),
    querySelectorAll: selector => selector === '[data-language]' ? languageControls : [],
  };
  const context = { document, fetch: routedFetch, Intl, URLSearchParams, location, history, VIEPS_I18N_RESOURCES: { en, fi } };
  vm.runInNewContext(i18nCode, context);
  vm.runInNewContext(code, context);
  const get = id => nodes.get(id);
  return {
    document, location, requests,
    get,
    async search(query) { get('partNumber').value = query; await get('partSearch').listeners.submit({ preventDefault() {} }); },
    setLanguage(language) { languageControls.find(control => control.dataset.language === language).listeners.click(); },
  };
}

const response = (data, ok = true) => ({ ok, json: async () => data });
const fixture = {
  part: { id: 10, part_number_normalized: 'TEST1', description: 'Test <part>', verification_status: 'fixture' },
  tree_roots: [{ node_id: 1, label: 'Parent', sort_order: 1 }, { node_id: 8, label: 'Body', sort_order: 2 }],
  parts_tree: [{ nodes: [{ node_id: 1, label: 'Parent' }, { node_id: 2, label: 'Child' }] }], images: [], diagrams: [],
  fitment: [
    { range_code: 'A', range_name: 'Range A', variation: 'Alpha', applicability_state: 'applicable' },
    { range_code: 'A', range_name: 'Range A', variation: 'Alpha 2', applicability_state: 'applicable' },
    { range_code: 'B', range_name: 'Range B', variation: 'Beta', applicability_state: 'applicable' },
  ],
};

test('complete Concept-11 shell exists before search, with no automatic part lookup', () => {
  const ui = harness(() => { throw Error('unexpected part lookup'); });
  assert.equal(ui.requests.filter(url => url.startsWith('/api/vieps/part')).length, 0);
  assert.equal(ui.get('partCard').innerHTML.includes('No part selected.'), true);
  assert.doesNotMatch(html, /id="result"[^>]*hidden/);
  for (const region of ['tree', 'location', 'visual', 'ranges', 'fitment']) {
    assert.match(html, new RegExp(`class="panel ${region}-panel"`));
  }
  assert.match(html, /data-language="fi"/);
  assert.match(html, /🇫🇮\s*<span>\[fi-FI\]<\/span>/);
  assert.match(html, /data-language="en"/);
  assert.match(html, /🇬🇧\s*<span>\[en-GB\]<\/span>/);
  assert.doesNotMatch(html, /id="languageSelect"/);
  assert.match(html, /data-i18n="common\.search"/);
  assert.match(html, /id="vehicleLocation"/);
  assert.doesNotMatch(html, /Top view|Side view/);
  assert.match(css, /"tree search search"\s*"tree ranges ranges"\s*"tree location suitability"\s*"tree details details"/);
  assert.match(css, /max-width:\s*1100px/);
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /\.locale-control/);
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

test('locale flag switching rerenders presentation without changing canonical data', async () => {
  const ui = harness(async () => response(fixture));
  await ui.search('TEST1');
  ui.setLanguage('fi');
  assert.equal(ui.document.documentElement.lang, 'fi');
  assert.equal(ui.get('searchStatus').textContent, 'OSA ratkaistu.');
  assert.match(ui.get('partCard').innerHTML, /TEST1/);
  assert.match(ui.get('fitment').innerHTML, /Muunnelma/);
  assert.match(ui.get('ranges').innerHTML, /Range A/);
  ui.setLanguage('en');
  assert.equal(ui.document.documentElement.lang, 'en');
  assert.equal(ui.get('searchStatus').textContent, 'PART resolved.');
});


const flush = () => new Promise(resolve => setImmediate(resolve));
const browseFixture = {
  state: 'resolved', ancestry_state: 'complete',
  roots: [{ node_id: 1, label: 'Suspension', sort_order: 1 }, { node_id: 8, label: 'Body', sort_order: 2 }],
  selected_node: { node_id: 2, parent_id: 1, label: 'Front' },
  path: [
    { node_id: 1, parent_id: null, label: 'Suspension', sort_order: 1 },
    { node_id: 2, parent_id: 1, label: 'Front', sort_order: 1 },
  ],
  children: [{ node_id: 3, label: 'Bushings', sort_order: 1 }],
  parts: [{ id: 10, part_number_normalized: 'TEST1', description: 'Test part' }],
  part_nodes: [{ part_id: 10, node_id: 2 }],
};

test('empty submission restores collapsed roots, clearing selected PART and dependent panels', async () => {
  const ui = harness(async () => response(fixture));
  await ui.search('TEST1');
  await ui.search('');
  assert.match(ui.get('tree').innerHTML, /Suspension/);
  assert.match(ui.get('tree').innerHTML, /Body/);
  assert.doesNotMatch(ui.get('tree').innerHTML, /Child|data-part-query/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  assert.equal(ui.get('rangeSelect').disabled, true);
  assert.equal(ui.get('result').attrs['aria-busy'], 'false');
  assert.ok(ui.requests.some(url => url === '/api/vieps/tree?root=1'));
});

test('clear while PART request is pending invalidates stale result and restores roots', async () => {
  let finishPart;
  const ui = harness(() => new Promise(resolve => { finishPart = resolve; }));
  const pending = ui.search('TEST1');
  ui.get('partNumber').value = '';
  ui.get('partNumber').listeners.input();
  await flush();
  finishPart(response(fixture));
  await pending;
  assert.match(ui.get('tree').innerHTML, /Suspension/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  assert.equal(ui.get('result').attrs['aria-busy'], 'false');
});

test('clear while tree request is pending prevents stale browse restoration', async () => {
  let finishBrowse;
  const ui = harness(url => url.includes('node_id=2')
    ? new Promise(resolve => { finishBrowse = resolve; })
    : Promise.reject(Error('unexpected request')), { initialSearch: '?tree=2' });
  assert.ok(ui.requests.some(url => url.includes('node_id=2')));
  ui.get('partNumber').value = '';
  ui.get('partNumber').listeners.input();
  await flush();
  finishBrowse(response(browseFixture));
  await flush();
  assert.match(ui.get('tree').innerHTML, /Suspension/);
  assert.doesNotMatch(ui.get('tree').innerHTML, /Bushings|Test part/);
  assert.equal(ui.get('result').attrs['aria-busy'], 'false');
});

test('clearing deep link removes part and tree parameters, retaining unrelated URL state', async () => {
  const ui = harness(async () => response(fixture), { initialSearch: '?part=TEST1&tree=2&lang=fi' });
  await flush();
  ui.get('partNumber').value = '';
  ui.get('partNumber').listeners.input();
  await flush();
  assert.equal(ui.location.search, '?lang=fi');
  assert.equal(ui.location.hash, '#browse');
  assert.match(ui.get('tree').innerHTML, /Suspension/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
});

test('blank search retains stock filter on root read without claiming stock-filtered roots', async () => {
  const ui = harness(async () => response(fixture));
  ui.get('availabilitySelect').checked = true;
  await ui.search('');
  assert.equal(ui.get('availabilitySelect').checked, true);
  assert.ok(ui.requests.includes('/api/vieps/tree?root=1&stock_only=1'));
});

test('UI locale change retains selected browse tree without an extra API read', async () => {
  const ui = harness(async url => {
    assert.match(url, /node_id=2/);
    return response(browseFixture);
  }, { initialSearch: '?tree=2' });
  await flush();
  const before = ui.requests.length;
  assert.match(ui.get('tree').innerHTML, /Bushings/);
  ui.setLanguage('fi');
  assert.equal(ui.document.documentElement.lang, 'fi');
  assert.match(ui.get('tree').innerHTML, /Suspension|Front/);
  assert.match(ui.get('tree').innerHTML, /Bushings/);
  assert.equal(ui.requests.length, before);
});

test('root failure is distinguished from resolved PART and releases busy state', async () => {
  let fail = false;
  const ui = harness(async () => response(fixture), {
    rootFetch: () => fail
      ? Promise.reject(Error('root unavailable'))
      : Promise.resolve(response({ state: 'root', roots: [{ node_id: 1, label: 'Suspension' }] })),
  });
  await ui.search('TEST1');
  fail = true;
  await ui.search('');
  assert.equal(ui.get('searchStatus').className, 'error status-line');
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  assert.equal(ui.get('result').attrs['aria-busy'], 'false');
});


test('late initial root response cannot replace a subsequently resolved PART tree', async () => {
  let finishRoot;
  const ui = harness(async () => response(fixture), {
    rootFetch: () => new Promise(resolve => { finishRoot = resolve; }),
  });
  await ui.search('TEST1');
  finishRoot(response({ state: 'root', roots: [{ node_id: 99, label: 'Outdated root' }] }));
  await flush();
  assert.match(ui.get('tree').innerHTML, /Parent/);
  assert.doesNotMatch(ui.get('tree').innerHTML, /Outdated root/);
  assert.match(ui.get('partCard').innerHTML, /TEST1/);
});

test('multiple free-text PART candidates appear under a single evidenced ancestor, not in PART details', async () => {
  const candidates = {
    state: 'multiple_match',
    tree_roots: [{ node_id: 1, label: 'Suspension', sort_order: 1 }],
    matches: [
      { id: 10, part_number_normalized: 'TEST1', description: 'Left' },
      { id: 11, part_number_normalized: 'TEST2', description: 'Right' },
    ],
    parts_tree: [
      { part_id: 10, node_id: 2, nodes: [
        { node_id: 1, label: 'Suspension' }, { node_id: 2, label: 'Front' },
        { kind: 'part', part_id: 10, label: 'Left — TEST1', part_query: 'TEST1' },
      ] },
      { part_id: 11, node_id: 2, nodes: [
        { node_id: 1, label: 'Suspension' }, { node_id: 2, label: 'Front' },
        { kind: 'part', part_id: 11, label: 'Right — TEST2', part_query: 'TEST2' },
      ] },
    ],
  };
  const ui = harness(async () => response(candidates));
  await ui.search('TEST');
  const tree = ui.get('tree').innerHTML;
  assert.equal((tree.match(/href="\?tree=1"/g) || []).length, 1);
  assert.equal((tree.match(/href="\?tree=2"/g) || []).length, 1);
  assert.equal((tree.match(/data-part-query=/g) || []).length, 2);
  assert.match(tree, /href="\?part=TEST1&tree=2"/);
  assert.match(tree, /href="\?part=TEST2&tree=2"/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1|TEST2|Left|Right/);
  assert.equal(ui.get('rangeSelect').disabled, true);
});

test('switching language retains multiple-candidate leaves and avoids another search', async () => {
  const data = {
    state: 'multiple_match',
    tree_roots: [{ node_id: 1, label: 'Suspension' }],
    matches: [{ id: 10, part_number_normalized: 'TEST1', description: 'Left',
      tree_paths: [{ nodes: [{ node_id: 1, label: 'Suspension' }] }] }],
  };
  const ui = harness(async () => response(data));
  await ui.search('TEST');
  const before = ui.requests.length;
  ui.setLanguage('fi');
  assert.equal(ui.document.documentElement.lang, 'fi');
  assert.match(ui.get('tree').innerHTML, /TEST1/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  assert.equal(ui.requests.length, before);
});
