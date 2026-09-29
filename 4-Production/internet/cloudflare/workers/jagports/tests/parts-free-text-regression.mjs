import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePart } from '../js/parts.js';
import { handleApi } from '../js/worker.js';
import { database, d1 } from './helpers/model-db.mjs';

function partsDatabaseFixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE part (
      id INTEGER PRIMARY KEY,
      part_number_raw TEXT,
      part_number_normalized TEXT,
      description TEXT,
      source TEXT NOT NULL,
      source_ref TEXT,
      verification_status TEXT NOT NULL
    );
    CREATE TABLE part_occurrence (
      id INTEGER PRIMARY KEY,
      part_id INTEGER NOT NULL,
      source TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      context_type TEXT NOT NULL,
      context_ref TEXT NOT NULL,
      category_ref TEXT,
      item_number TEXT,
      diagram_ref TEXT,
      diagram_item_number TEXT,
      verification_status TEXT NOT NULL
    );
    CREATE TABLE part_tree_node (
      id INTEGER PRIMARY KEY,
      parent_id INTEGER,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE part_tree_part (
      tree_node_id INTEGER NOT NULL,
      part_id INTEGER NOT NULL
    );

    -- Values are copied from the repository's existing synthetic
    -- part_model_integrity.sql fixture. They are test evidence, not production facts.
    INSERT INTO part VALUES
      (53801, 'MNA 7691-AA', 'MNA7691AA', 'Fan Warning Label',
       'fixture', 'fixture:538:old', 'fixture'),
      (53802, 'XR847031', 'XR847031', 'Replacement label',
       'fixture', 'fixture:538:replacement', 'fixture'),
      (53803, 'FIX538C', 'FIX538C', 'Synthetic chain endpoint',
       'fixture', 'fixture:538:chain', 'fixture');

    INSERT INTO part_occurrence VALUES
      (63401, 53801, 'fixture', 'fixture:634:mna', 'epc',
       'fixture:634/context-a', 'fixture-category', '1', NULL, NULL, 'fixture'),
      (63402, 53802, 'fixture', 'fixture:634:xr', 'epc',
       'fixture:634/context-b', 'fixture-category', '2', NULL, NULL, 'fixture'),
      (63403, 53803, 'fixture', 'fixture:634:fix', 'epc',
       'fixture:634/context-c', 'fixture-category', '3', NULL, NULL, 'fixture');

    INSERT INTO part_tree_node VALUES
      (63410, NULL, 'Fixture catalogue', 1),
      (63411, 63410, 'Fixture parts', 1);

    INSERT INTO part_tree_part VALUES
      (63411, 53801),
      (63411, 53802),
      (63411, 53803);
  `);
  return db;
}

function stockDatabaseFixture(stockedPartNumbers = []) {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE stock_item (
      id INTEGER PRIMARY KEY,
      part_number TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      condition TEXT,
      condition_code TEXT,
      status TEXT,
      location TEXT,
      source TEXT,
      source_ref TEXT,
      verification_status TEXT NOT NULL,
      available INTEGER NOT NULL,
      confidence REAL,
      price NUMERIC,
      currency TEXT,
      notes TEXT
    );
  `);
  const insert = db.prepare(`INSERT INTO stock_item (
      id,part_number,quantity,condition,condition_code,status,location,source,
      source_ref,verification_status,available,confidence,price,currency,notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  stockedPartNumbers.forEach((partNumber, index) => {
    insert.run(
      index + 1, partNumber, 1, 'test fixture', 'B', 'available', 'fixture-location',
      'test', 'fixture:634:stock', 'test', 1, 1, null, 'EUR',
      'Synthetic stock row for #634 search-order regression coverage.',
    );
  });
  return db;
}

function realSearchEnvironment(stockedPartNumbers = []) {
  const partsDb = partsDatabaseFixture();
  const stockDb = stockDatabaseFixture(stockedPartNumbers);
  return {
    env: {
      DB: d1(stockDb),
      PARTS_DATABASE_BINDINGS: '{"xk":"PARTS_XK"}',
      PARTS_XK: d1(partsDb),
    },
    close() {
      partsDb.close();
      stockDb.close();
    },
  };
}

async function search(env, query, stockOnly = false) {
  const url = new URL('https://example.test/api/part');
  url.searchParams.set('q', query);
  if (stockOnly) url.searchParams.set('stock_only', '1');
  return handlePart(new Request(url), env);
}

test('exact and partial PART identifiers still resolve through deterministic lookup', async (t) => {
  const fixture = realSearchEnvironment();
  t.after(() => fixture.close());

  for (const query of ['MNA 7691-AA', '7691']) {
    const response = await search(fixture.env, query);
    assert.equal(response.status, 200, query);
    const data = await response.json();
    assert.equal(data.state, 'resolved', query);
    assert.equal(data.search_path, 'deterministic', query);
    assert.equal(data.part.part_number_normalized, 'MNA7691AA', query);
  }
});

test('descriptive PART query resolves through free-text fallback after identifier miss', async (t) => {
  const fixture = realSearchEnvironment();
  t.after(() => fixture.close());

  const response = await search(fixture.env, 'Fan Warning');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.state, 'resolved');
  assert.equal(data.search_path, 'free_text');
  assert.equal(data.part.part_number_normalized, 'MNA7691AA');
});

test('descriptive query with multiple PART matches returns candidates without selecting a PART', async (t) => {
  const fixture = realSearchEnvironment();
  t.after(() => fixture.close());

  const response = await search(fixture.env, 'label');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.state, 'multiple_match');
  assert.equal(data.search_path, 'free_text');
  assert.equal(data.selected_part, null);
  assert.equal(data.part, undefined);
  assert.deepEqual(
    data.matches.map((part) => part.part_number_normalized).sort(),
    ['MNA7691AA', 'XR847031'],
  );
  assert.equal(data.parts_tree.length, 2);
});

test('descriptive query plus stock_only retains stocked matches after discovery', async (t) => {
  const fixture = realSearchEnvironment(['MNA7691AA']);
  t.after(() => fixture.close());

  const response = await search(fixture.env, 'label', true);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.state, 'resolved');
  assert.equal(data.search_path, 'free_text');
  assert.equal(data.part.part_number_normalized, 'MNA7691AA');
});

test('descriptive query plus stock_only returns stock_filtered_empty when only non-stock matches exist', async (t) => {
  const fixture = realSearchEnvironment(['MNA7691AA']);
  t.after(() => fixture.close());

  const response = await search(fixture.env, 'Replacement label', true);
  assert.equal(response.status, 404);
  const data = await response.json();
  assert.equal(data.state, 'stock_filtered_empty');
  assert.equal(data.search_path, 'free_text');
  assert.equal(data.error, 'no stocked part match');
});

test('true no-match remains not_found after identifier and limited free-text evaluation', async (t) => {
  const fixture = realSearchEnvironment();
  t.after(() => fixture.close());

  const response = await search(fixture.env, 'wiper motor');
  assert.equal(response.status, 404);
  const data = await response.json();
  assert.equal(data.state, 'not_found');
  assert.equal(data.search_path, 'free_text');
});

test('TEST and normal parts-data paths share the PART-description fallback contract', async (t) => {
  const db = database();
  t.after(() => db.close());
  const binding = d1(db);
  const env = {
    DB: binding,
    PARTS_DATABASE_BINDINGS: '{"xk":"PARTS_XK"}',
    PARTS_XK: binding,
  };

  const normal = await handleApi(new Request(
    'https://example.test/api/part?q=Fan%20Warning%20Label'), env);
  const fixture = await handleApi(new Request(
    'https://example.test/api/part?q=Fan%20Warning%20Label&TEST=1'), env);

  assert.equal(normal.status, 200);
  assert.equal(fixture.status, 200);
  const normalData = await normal.json();
  const fixtureData = await fixture.json();
  for (const data of [normalData, fixtureData]) {
    assert.equal(data.state, 'resolved');
    assert.equal(data.search_path, 'free_text');
    assert.equal(data.part.part_number_normalized, 'MNA7691AA');
  }
});
