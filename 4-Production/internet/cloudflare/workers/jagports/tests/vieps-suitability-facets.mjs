import test from 'node:test';
import assert from 'node:assert/strict';
import { database, d1 } from './helpers/model-db.mjs';
import { handleViepsSuitability } from '../src/suitability.js';
import { handleApi } from '../src/index.js';

const namespace = 'fixture:pre-jepc-suitability:v1';
function fixture(t, enabled = true) {
  const db = database();
  t.after(() => db.close());
  const env = { DB: d1(db), ...(enabled ? { ENABLE_SUITABILITY_FIXTURES: '1' } : {}) };
  async function request(facets = [], opts = {}) {
    const url = new URL('https://test.example/api/vieps/suitability?TEST=1');
    for (const facet of facets) url.searchParams.append('facet', facet);
    for (const [key, value] of Object.entries(opts)) url.searchParams.set(key, value);
    const response = await handleApi(new Request(url), env);
    return { status: response.status, body: await response.json() };
  }
  return { db, env, request };
}
const keys = (result) => result.matches.map((row) => row.occurrence_key).sort();

test('fixture endpoint is unavailable by default and never reads synthetic facts', async (t) => {
  const { db, env } = fixture(t, false);
  const response = await handleApi(new Request('https://test.example/api/vieps/suitability?TEST=1'), env);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.state, 'unavailable');
  assert.equal(body.fixture_mode, false);
  assert.deepEqual(body.categories, []);
  assert.deepEqual(body.matches, []);
  const empty = await handleViepsSuitability(new Request('https://test.example/api/vieps/suitability'), {});
  assert.equal(empty.status, 503);
  assert.equal(db.prepare('SELECT count(*) n FROM applicability_source_description WHERE provenance_kind=\'fixture\'').get().n, 13);
});

test('fixture vocabulary has four stable dimensions, eight values, and source-separated duplicate wording', async (t) => {
  const { db, request } = fixture(t);
  const { status, body } = await request();
  assert.equal(status, 200);
  assert.equal(body.source_namespace, namespace);
  assert.equal(body.fixture_mode, true);
  assert.deepEqual(body.categories.map((row) => [row.code, row.values.map((v) => v.code)]), [
    ['body', ['convertible', 'coupe']],
    ['engine_aspiration', ['na', 'supercharged']],
    ['seat_equipment', ['memory_seat', 'powered_seats']],
    ['steering', ['LHD', 'RHD']],
  ]);
  const sourceRows = db.prepare("SELECT id,source_group_code,original_text FROM applicability_source_description WHERE original_text='Coupe' ORDER BY id").all();
  assert.equal(sourceRows.length, 4);
  assert.equal(new Set(sourceRows.map((row) => row.id)).size, 4);
  assert.equal(db.prepare("SELECT status FROM applicability_description_mapping_current WHERE source_description_id=87709").get().status, 'proposed');
  assert.equal(body.categories.find((row) => row.code === 'body').values.length, 2);
});

test('complete positive fixture records retain six distinct source occurrences and their own contexts', async (t) => {
  const { request } = fixture(t);
  const { body } = await request();
  assert.equal(body.state, 'applicable');
  assert.deepEqual(keys(body), ['O-A', 'O-B', 'O-C', 'O-F']);
  assert.equal(body.matches.find((row) => row.occurrence_key === 'O-A').part_id, body.matches.find((row) => row.occurrence_key === 'O-B').part_id);
  assert.notEqual(body.matches.find((row) => row.occurrence_key === 'O-A').occurrence_id, body.matches.find((row) => row.occurrence_key === 'O-B').occurrence_id);
  assert.equal(body.matches.find((row) => row.occurrence_key === 'O-F').model_context, 'FIX877-X150');
  assert.deepEqual(body.excluded_occurrences.map((row) => row.occurrence_id), [87714]);
  assert.deepEqual(body.unavailable_occurrences.map((row) => row.occurrence_id), [87715]);
  for (const match of body.matches) assert.equal(match.provenance, 'synthetic_fixture');
});

test('AND across categories uses one condition set, never different occurrences of the same PART', async (t) => {
  const { request } = fixture(t);
  assert.deepEqual(keys((await request(['body:coupe', 'steering:LHD', 'engine_aspiration:supercharged'])).body), ['O-A']);
  assert.deepEqual(keys((await request(['body:convertible', 'steering:RHD', 'engine_aspiration:na'])).body), ['O-B']);
  assert.deepEqual(keys((await request(['body:coupe', 'steering:RHD', 'engine_aspiration:na'])).body), ['O-C']);
  assert.deepEqual(keys((await request(['body:coupe', 'steering:LHD', 'engine_aspiration:na'])).body), []);
  assert.deepEqual(keys((await request(['body:convertible', 'engine_aspiration:supercharged'])).body), []);
  assert.deepEqual(keys((await request(['body:coupe', 'steering:RHD', 'engine_aspiration:supercharged'])).body), ['O-F']);
});

test('two independent sourced seat descriptions coexist on one occurrence', async (t) => {
  const { request } = fixture(t);
  const both = (await request(['seat_equipment:memory_seat', 'seat_equipment:powered_seats'])).body;
  assert.deepEqual(keys(both), ['O-A']);
  assert.deepEqual(both.matches[0].values.filter((x) => x.startsWith('seat_equipment:')),
    ['seat_equipment:memory_seat', 'seat_equipment:powered_seats']);
  assert.deepEqual(keys((await request(['seat_equipment:powered_seats'])).body), ['O-A', 'O-B']);
  assert.deepEqual(keys((await request(['seat_equipment:memory_seat', 'body:convertible'])).body), []);
});

test('exclusions, incomplete coverage and genuine no-match stay distinct', async (t) => {
  const { request } = fixture(t);
  const excluded = (await request(['body:convertible', 'steering:LHD'])).body;
  assert.equal(excluded.state, 'excluded');
  assert.deepEqual(keys(excluded), []);
  assert.deepEqual(excluded.excluded_occurrences.map((row) => row.occurrence_id), [87714]);
  const unknown = (await request([], { q: 'F-SUIT-04' })).body;
  assert.equal(unknown.state, 'unavailable');
  assert.equal(unknown.unavailable_occurrences[0].occurrence_id, 87715);
  assert.deepEqual(unknown.matches, []);
  const noMatch = (await request(['body:convertible', 'engine_aspiration:supercharged'])).body;
  assert.equal(noMatch.state, 'no_match'); // O-E is known Coupe and cannot match selected Convertible.
  assert.deepEqual(noMatch.matches, []);
  const missing = (await request([], { q: 'DOES-NOT-EXIST' })).body;
  assert.equal(missing.state, 'no_match');
});

test('available options follow positively surviving occurrences and never expose excluded/unknown facts', async (t) => {
  const { request } = fixture(t);
  const a = (await request(['body:convertible', 'steering:RHD'])).body;
  assert.deepEqual(keys(a), ['O-B']);
  assert.deepEqual(a.available_options, [
    'body:convertible', 'engine_aspiration:na', 'seat_equipment:powered_seats', 'steering:RHD',
  ]);
  assert.ok(!a.available_options.includes('engine_aspiration:supercharged'));
  const empty = (await request(['body:convertible', 'engine_aspiration:supercharged'])).body;
  assert.deepEqual(empty.available_options, []);
});

test('invalid facet IDs, unsupported query, stock-only filtering, and non-GET are handled deterministically', async (t) => {
  const { env, request } = fixture(t);
  for (const [facets, opts, code] of [
    [['unknown:value'], {}, 'facet_unknown'],
    [['body:UNKNOWN'], {}, 'facet_unknown'],
    [['body:contains:coupe'], {}, 'facet_invalid'],
    [[], { stock_only: '2' }, 'stock_filter_invalid'],
    [[], { q: 'x'.repeat(161) }, 'query_invalid'],
  ]) {
    const result = await request(facets, opts);
    assert.equal(result.status, 400);
    assert.equal(result.body.error_code, code);
  }
  const stock = await request([], { stock_only: '1' });
  assert.equal(stock.status, 200);
  assert.deepEqual(stock.body.matches, []);
  assert.equal(stock.body.state, 'no_match');
  const post = await handleApi(new Request('https://test.example/api/vieps/suitability?TEST=1', { method: 'POST' }), env);
  assert.equal(post.status, 405);
});

test('retired current mapping makes affected occurrences unavailable rather than a positive match', async (t) => {
  const { db, request } = fixture(t);
  db.exec(`INSERT INTO applicability_description_mapping_revision
    (source_description_id,revision,dimension_id,value_code,status,mapping_version,evidence_note)
    VALUES (87708,2,87703,'powered_seats','retired','fixture-v2','synthetic retirement test')`);
  const { body } = await request([], { q: 'F-SUIT-01' });
  assert.equal(body.state, 'unavailable');
  assert.deepEqual(body.matches, []);
  assert.equal(body.unavailable_occurrences.length, 2);
  assert.ok(!body.categories.find((c) => c.code === 'seat_equipment')
    .values.some((v) => v.code === 'powered_seats'));
});

test('Finnish domain labels do not change canonical facet identities or raw source language', async (t) => {
  const { request } = fixture(t);
  const { status, body } = await request(['body:coupe'], { ui_language: 'fi' });
  assert.equal(status, 200);
  const category = body.categories.find((c) => c.code === 'body');
  assert.equal(category.name, 'Kori');
  const coupe = category.values.find((v) => v.id === 'body:coupe');
  assert.equal(coupe.name, 'Coupé');
  assert.ok(coupe.source_descriptions.every((s) => s.language === 'en'));
  assert.ok(coupe.source_descriptions.every((s) => s.source_namespace === namespace));
  assert.equal(new Set(coupe.source_descriptions.map((s) => s.id)).size, 3);
  assert.deepEqual(keys(body), ['O-A', 'O-C', 'O-F']);
});

test('missing required domain language labels produces an explicit unavailable response', async (t) => {
  const { db, request } = fixture(t);
  db.exec("DELETE FROM applicability_dimension_value_label WHERE dimension_id=87703 AND value_code='powered_seats' AND language='fi'");
  const { status, body } = await request([], { ui_language: 'fi' });
  assert.equal(status, 503);
  assert.equal(body.state, 'unavailable');
  assert.equal(body.reason, 'mapping_language_or_provenance_unavailable');
  assert.deepEqual(body.matches, []);
});

test('a clean database never publishes synthetic facts even when the fixture flag is enabled', async (t) => {
  const db = database({ fixtures: false }); t.after(() => db.close());
  const response = await handleViepsSuitability(
    new Request('https://test.example/api/vieps/suitability'),
    { DB: d1(db), ENABLE_SUITABILITY_FIXTURES: '1' },
  );
  const body = await response.json();
  assert.equal(body.state, 'no_match');
  assert.deepEqual(body.categories, []);
  assert.deepEqual(body.matches, []);
});
