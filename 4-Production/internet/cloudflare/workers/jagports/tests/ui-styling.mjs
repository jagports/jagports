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
  for (const [, tag, id] of html.matchAll(/(<[^>]*\bid="([^"]+)"[^>]*>)/g)) {
    nodes.set(id, {
      value: '', hidden: false, disabled: /\sdisabled(?:\s|>|=)/.test(tag),
      textContent: '', listeners: {}, attrs: {},
      set innerHTML(value) { this.markup = value; if (id.endsWith('Select')) this.value = value.match(/value="([^"]*)"/)?.[1] || ''; },
      get innerHTML() { return this.markup || ''; },
      addEventListener(event, fn) { this.listeners[event] = fn; },
      dispatchEvent(event) { return this.listeners[event.type]?.(event); },
      setAttribute(key, value) { this.attrs[key] = value; },
      querySelector() { return null; },
      querySelectorAll(selector) {
        const attr = selector === '[data-result-part-id]' ? 'data-result-part-id'
          : selector === '[data-part-query]' ? 'data-part-query' : null;
        if (!attr) return [];
        this.links = [...this.innerHTML.matchAll(/<a\b([^>]*)>/g)]
          .map(([, attrs]) => attrs).filter((attrs) => attrs.includes(attr + '='))
          .map((attrs) => {
            const dataset = {};
            for (const [, key, value] of attrs.matchAll(/data-([\w-]+)="([^"]*)"/g)) {
              dataset[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
            }
            return { dataset, listeners: {}, addEventListener(event, fn) { this.listeners[event] = fn; } };
          });
        return this.links;
      },
    });
  }
  const languageControls = [...html.matchAll(/data-language="([^"]+)"/g)].map(([, language]) => ({
    dataset: { language }, listeners: {},
    addEventListener(event, fn) { this.listeners[event] = fn; },
  }));
  const document = {
    documentElement: { lang: 'en' },
    listeners: {},
    addEventListener(event, fn) { this.listeners[event] = fn; },
    getElementById: id => nodes.get(id),
    querySelectorAll: selector => selector === '[data-language]' ? languageControls : [],
  };
  class FakeEvent { constructor(type) { this.type = type; } preventDefault() {} }
  const context = { document, fetch: routedFetch, Event: FakeEvent, Intl, URLSearchParams, location, history, VIEPS_I18N_RESOURCES: { en, fi } };
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
  for (const region of ['tree', 'location', 'visual', 'ranges']) {
    assert.match(html, new RegExp(`class="panel ${region}-panel"`));
  }
  // #875 nests suitability inside the single selected-PART panel.
  assert.match(html, /class="fitment-panel"/);
  assert.match(html, /id="searchResults"/);
  assert.match(html, /class="left-workspace"/);
  assert.match(html, /class="centre-workspace"/);
  assert.match(html, /class="right-workspace"/);
  assert.match(html, /data-language="fi"/);
  assert.match(html, /🇫🇮\s*<span>\[fi-FI\]<\/span>/);
  assert.match(html, /data-language="en"/);
  assert.match(html, /🇬🇧\s*<span>\[en-GB\]<\/span>/);
  assert.doesNotMatch(html, /id="languageSelect"/);
  assert.match(html, /data-i18n="common\.search"/);
  assert.match(html, /id="vehicleLocation"/);
  assert.doesNotMatch(html, /Top view|Side view/);
  assert.match(css, /\.mobile-top, \.concept-grid\s*\{\s*display:\s*contents/);
  assert.match(css, /\.tree-children/);
  assert.match(html, /class="mobile-top"/);
  assert.ok(html.indexOf('id="partSearch"') < html.indexOf('id="result"'));
  assert.match(css, /max-width:\s*1100px/);
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /\.locale-control/);
  assert.match(html, /href="vieps-tailwind\.css"/);
  assert.doesNotMatch(html, /picocss|cdn\.tailwindcss\.com/i);
});

test('Stock information toggles independently of stock filtering and supports dismissal', () => {
  const ui = harness(() => { throw Error('Stock help must not fetch'); });
  const help = ui.get('stockHelpButton');
  const popup = ui.get('stockHelpPopover');
  popup.hidden = true;
  ui.get('availabilitySelect').checked = true;
  help.listeners.mouseenter();
  assert.equal(popup.hidden, false, 'desktop hover opens help');
  help.listeners.mouseleave();
  assert.equal(popup.hidden, true, 'desktop hover closes help');
  help.listeners.focus();
  assert.equal(popup.hidden, false, 'keyboard focus opens help');
  help.listeners.click({ stopPropagation() {} });
  assert.equal(popup.hidden, false, 'click pins help for mobile/touch');
  assert.equal(help.attrs['aria-expanded'], 'true');
  assert.equal(ui.get('availabilitySelect').checked, true, 'filter is unchanged');
  ui.document.listeners.keydown({ key: 'Escape' });
  assert.equal(popup.hidden, true, 'Escape dismisses');
  help.listeners.click({ stopPropagation() {} });
  ui.document.listeners.pointerdown({ target: null });
  assert.equal(popup.hidden, true, 'outside touch dismisses');
  assert.equal(ui.get('availabilitySelect').checked, true);
  assert.equal(ui.requests.filter(url => url.includes('/api/vieps/part')).length, 0);
  assert.equal(en.stock.filter_on_stock_note,
    'Filters identifier-search results to PARTs with available operational stock and positive quantity.');
  assert.equal(typeof fi.stock.filter_on_stock_about, 'string');
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

test('#875 browse index displays precisely 13 vocabulary labels and no implied PART fitment', async () => {
  const expected = [
    'Jaguar Accessories', 'Daimler Limousine', 'E-Pace', 'E-Type',
    'F-Pace', 'F-Type', 'S-Type', 'X-Type', 'XE Range', 'XF Range',
    'XJ Range', 'XJS', 'XK Range',
  ];
  const ui = harness(() => { throw Error('browse index must not request PART fitment'); });
  const markup = ui.get('ranges').innerHTML;
  const labels = [...markup.matchAll(/data-browse-range-index="\d+">\s*([^<]+)<\/label>/g)]
    .map(([, text]) => text.trim());
  assert.deepEqual(labels, expected, 'the index is fixed browse vocabulary only');
  assert.equal((markup.match(/type="checkbox" disabled/g) || []).length, 13);
  assert.match(markup, /rangeBrowseNote/);
  assert.doesNotMatch(markup, /data-applicable|aria-checked="true"/);
  assert.equal(ui.get('rangeSelect').disabled, true);
  assert.equal(ui.get('variationsSelect').disabled, true);
  assert.equal(ui.get('partCard').innerHTML.includes('No part selected.'), true);
  assert.equal(ui.requests.filter(url => url.startsWith('/api/vieps/part')).length, 0);
  ui.setLanguage('fi');
  assert.match(ui.get('ranges').innerHTML, /E-Pace/);
  assert.match(ui.get('ranges').innerHTML, /Suodatin ei ole vielä käytettävissä/);
});

test('#875 selected PART never promotes browse vocabulary, excluded or unavailable rows into fitment', async () => {
  const ui = harness(async () => response({
    ...fixture,
    fitment: [
      { range_code: 'XK', range_name: 'XK Range', applicability_state: 'applicable',
        qualifier: 'Verified qualifier', verification_status: 'fixture' },
      { range_code: 'EX', range_name: 'E-Pace', applicability_state: 'excluded' },
      { range_code: 'N', range_name: 'F-Pace', applicability_state: 'no_match' },
      { range_code: 'U', range_name: 'XJS', applicability_state: 'unavailable' },
      { range_code: 'P', range_name: 'Daimler Limousine', applicability_state: 'applicable' },
    ],
  }));
  await ui.search('TEST1');
  const markup = ui.get('ranges').innerHTML;
  assert.match(markup, /XK Range/);
  assert.match(markup, /Daimler Limousine/);
  assert.doesNotMatch(markup, /E-Pace|F-Pace|XJS|data-browse-range-index/);
  assert.equal((markup.match(/<li>/g) || []).length, 2);
  assert.equal(ui.get('rangeSelect').disabled, false, 'supported ranges may select verified detail, not filter');
  assert.equal(ui.get('variationsSelect').disabled, true, 'normalized #641 filter remains separate');
  assert.match(ui.get('fitment').innerHTML, /Verified qualifier/);
  assert.match(ui.get('partCard').innerHTML, /TEST1/);
});

test('#875 selected-PART applicability preserves missing evidence, explicit exclusion and service errors', async () => {
  let data = { ...fixture, fitment: [] };
  const ui = harness(async () => response(data));
  await ui.search('TEST1');
  assert.match(ui.get('ranges').innerHTML, /data is unavailable/);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /XK Range|data-browse-range-index/);

  data = { ...fixture, fitment: [
    { range_code: 'E', range_name: 'E-Type', applicability_state: 'excluded' },
  ] };
  await ui.search('TEST1');
  assert.match(ui.get('ranges').innerHTML, /No suitable vehicle range matches/);
  assert.doesNotMatch(ui.get('ranges').innerHTML, /E-Type/);

  data = { ...fixture, fitment_state: 'error', fitment: [] };
  await ui.search('TEST1');
  assert.match(ui.get('ranges').innerHTML, /Applicable Models could not be loaded/);
  assert.equal(ui.get('rangeSelect').disabled, true);
  ui.setLanguage('fi');
  assert.match(ui.get('ranges').innerHTML, /Sopivien mallien tietoja ei voitu ladata/);
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
  assert.equal(ui.get('searchStatus').textContent, '2 matching PARTs. Select one from the Parts Tree or Search Results.');
  const tree = ui.get('tree').innerHTML;
  assert.equal((tree.match(/href="\?tree=1"/g) || []).length, 1);
  assert.equal((tree.match(/href="\?tree=2"/g) || []).length, 1);
  assert.equal((tree.match(/data-part-query=/g) || []).length, 2);
  assert.match(tree, /href="\?part=TEST1&tree=2"/);
  assert.match(tree, /href="\?part=TEST2&tree=2"/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1|TEST2|Left|Right/);
  assert.equal(ui.get('rangeSelect').disabled, true);
});

test('result rows deduplicate PART identity, synchronize selection with the tree and preserve stock and clear behavior', async () => {
  const partA = { id: 10, part_number_normalized: 'TEST1', description: 'First part' };
  const partB = { id: 11, part_number_normalized: 'TEST2', description: 'Second part' };
  const nodes = [{ node_id: 1, label: 'Suspension' }, { node_id: 2, label: 'Front' }];
  const candidates = {
    state: 'multiple_match', query: 'TEST', tree_roots: [{ node_id: 1, label: 'Suspension' }],
    matches: [partA, { ...partA }, partB],
    parts_tree: [10, 11].map(id => ({ part_id: id, node_id: 2, nodes })),
  };
  const ui = harness(async url => url.includes('candidate_id=11')
    ? response({ ...fixture, part: partB, parts_tree: [candidates.parts_tree[1]], fitment: [], stock: [] })
    : response(candidates));
  ui.get('availabilitySelect').checked = true;
  await ui.search('TEST');
  const results = ui.get('searchResults');
  assert.equal((results.innerHTML.match(/data-result-part-id=/g) || []).length, 2);
  assert.match(results.innerHTML, /TEST1 — First part/);
  assert.match(results.innerHTML, /TEST2 — Second part/);
  assert.match(results.innerHTML, /type="checkbox" disabled/);
  assert.equal((results.innerHTML.match(/class="bookmark-label"/g) || []).length, 2,
    'one separate disabled bookmark label per distinct canonical PART');
  assert.match(results.innerHTML, /aria-label="Bookmark \(not yet available\): TEST1 — First part"/);
  assert.match(results.innerHTML, /aria-label="Bookmark \(not yet available\): TEST2 — Second part"/);
  assert.equal((results.innerHTML.match(/class="bookmark-caption"/g) || []).length, 2);
  assert.equal((results.innerHTML.match(/<input type="checkbox" disabled/g) || []).length, 2);
  assert.doesNotMatch(results.innerHTML, /<input[^>]*\schecked(?:\s|>|=)/);
  const beforeSelection = ui.requests.length;
  // The checkbox is disabled and is not wired as a PART selection action.
  // Only the result link has the selectable PART click handler.
  assert.equal(results.links.length, 2);
  assert.equal(ui.requests.length, beforeSelection);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1|TEST2/);
  const link = results.links.find(node => node.dataset.resultPartId === '11');
  link.listeners.click({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(ui.requests.some(url => url.includes('q=TEST&stock_only=1&candidate_id=11')));
  assert.match(ui.get('partCard').innerHTML, /TEST2/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  assert.match(ui.get('searchResults').innerHTML, /selected-result[\s\S]*data-result-part-id="11"/);
  assert.match(ui.get('tree').innerHTML, /data-part-query="TEST2"/);
  assert.match(ui.get('tree').innerHTML, /aria-current="page"/);
  assert.equal(ui.get('availabilitySelect').checked, true);
  await ui.search('');
  assert.doesNotMatch(ui.get('searchResults').innerHTML, /data-result-part-id=/);
  assert.doesNotMatch(ui.get('tree').innerHTML, /data-part-query=/);
  assert.equal(ui.get('availabilitySelect').checked, true);
});

test('#875 future VIN/variations are disabled and explain unsupported state in both UI locales', () => {
  const ui = harness(() => { throw Error('unsupported controls must not fetch'); });
  for (const id of ['vinInput', 'variationsSelect']) {
    const input = ui.get(id);
    assert.equal(input.disabled, true, id + ' must remain disabled');
    assert.match(html, new RegExp('id="' + id + '"[^>]*disabled[^>]*aria-describedby="unsupportedControlsNote"'));
    assert.match(html, new RegExp('id="' + id + '"[^>]*data-i18n-title="header\\.not_yet_supported"'));
  }
  assert.match(html, /id="unsupportedControlsNote"[^>]*data-i18n="header\\.not_yet_supported"/);
  assert.equal(ui.get('rangeSelect').disabled, true);
  assert.equal(ui.requests.filter(url => url.startsWith('/api/vieps/part')).length, 0);
  assert.ok(en.header.not_yet_supported && fi.header.not_yet_supported);
});

test('#875 disabled bookmarks remain separate from row selection across English/Finnish', async () => {
  const part = { id: 42, part_number_normalized: 'TEST42', description: 'Fixture description' };
  const data = { state: 'multiple_match', query: 'TEST', matches: [part],
    tree_roots: [{ node_id: 1, label: 'Parent' }],
    parts_tree: [{ part_id: 42, nodes: [{ node_id: 1, label: 'Parent' }] }] };
  const ui = harness(async () => response(data));
  await ui.search('TEST');
  const before = ui.requests.length;
  const enHtml = ui.get('searchResults').innerHTML;
  assert.match(enHtml, /<a[^>]*data-result-part-id="42"/);
  assert.match(enHtml, /<label class="bookmark-label"><input type="checkbox" disabled/);
  assert.match(enHtml, /Bookmark \(not yet available\): TEST42 — Fixture description/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST42/);
  ui.setLanguage('fi');
  const fiHtml = ui.get('searchResults').innerHTML;
  assert.match(fiHtml, /Kirjanmerkki \(ei vielä käytettävissä\): TEST42 — Fixture description/);
  assert.match(fiHtml, /<input type="checkbox" disabled/);
  assert.equal(ui.requests.length, before, 'changing UI language never selects a PART or invokes persistence');
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST42/);
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
  assert.equal(ui.get('searchStatus').textContent, '1 matching PART. Select it from the Parts Tree or Search Results.');
  const before = ui.requests.length;
  ui.setLanguage('fi');
  assert.equal(ui.document.documentElement.lang, 'fi');
  assert.equal(ui.get('searchStatus').textContent, '1 vastaava OSA. Valitse se osapuusta tai hakutuloksista.');
  assert.match(ui.get('tree').innerHTML, /TEST1/);
  assert.doesNotMatch(ui.get('partCard').innerHTML, /TEST1/);
  assert.equal(ui.requests.length, before);
});
