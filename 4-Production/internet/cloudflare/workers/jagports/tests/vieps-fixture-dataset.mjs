import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { database, d1, root } from './helpers/model-db.mjs';
import { handleViepsPart } from '../src/vieps.js';

const fixturePartNumbers = ['MJB7703AA', 'MNA7691AA', 'XR847031', 'FIX538C'];
const fixtureDescriptiveIdentifiers = ['firtree1', 'firtree2'];
const expectedStockLocations = new Map([
  ['MJB7703AA', 'Fixture Shelf XK / Box A14'],
  ['MNA7691AA', 'Fixture Shelf XK / Box C07'],
  ['XR847031', 'Fixture Shelf XK / Box X31'],
  ['FIX538C', 'Fixture Shelf XK / Box R02'],
  ['firtree1', 'Fixture Shelf XK / Box F12'],
  ['firtree2', 'Fixture Shelf XK / Box F29'],
]);

async function resolve(env, partNumber) {
  const response = await handleViepsPart(
    new Request(`https://example.test/api/vieps/part?q=${partNumber}`),
    env,
  );
  assert.equal(response.status, 200, partNumber);
  return response.json();
}

function assertFixtureStock(data, lookupValue) {
  assert.ok(data.stock.length > 0, `${lookupValue} should expose stock rows`);

  const issue607Stock = data.stock.filter((item) => item.source === 'fixture-607');
  assert.ok(issue607Stock.length > 0, `${lookupValue} should expose #607 stock rows`);
  assert.ok(issue607Stock.some((item) => item.location === expectedStockLocations.get(lookupValue)), `${lookupValue} should expose its fixture stock location`);
  for (const item of issue607Stock) {
    assert.ok(Number.isInteger(item.quantity), `${lookupValue} quantity should be an integer`);
    assert.ok(item.quantity >= 0, `${lookupValue} quantity should be non-negative`);
    assert.match(item.location, /^Fixture Shelf XK \/ Box [A-Z0-9]{3}$/);
    assert.match(item.source_ref, /^issue:#607:synthetic-stock:/);
    assert.match(item.notes, /synthetic|demo/i);
    assert.match(item.notes, /not real.*inventory evidence|unidentified fixture clip/i);
    assert.equal(item.verification_status, 'fixture');
  }
}

test('extended MVP fixture part numbers resolve with catalogue, tree and synthetic stock context', async (t) => {
  const db = database();
  t.after(() => db.close());
  const env = { DB: d1(db) };

  for (const partNumber of fixturePartNumbers) {
    const data = await resolve(env, partNumber);
    assert.equal(data.part.part_number_normalized, partNumber);
    assert.ok(data.parts_tree.some((entry) => entry.path?.includes('MVP searchable fixtures')), partNumber);
    assertFixtureStock(data, partNumber);
  }
});

test('production migration chain exposes documented live fixture stock probes', async (t) => {
  const db = database({ fixtures: false });
  t.after(() => db.close());
  const env = { DB: d1(db) };

  for (const partNumber of fixturePartNumbers) {
    const data = await resolve(env, partNumber);
    assert.equal(data.part.part_number_normalized, partNumber);
    assertFixtureStock(data, partNumber);
  }

  for (const identifier of fixtureDescriptiveIdentifiers) {
    const data = await resolve(env, identifier);
    assert.equal(data.part.part_number_normalized, null);
    assert.equal(data.part.description, identifier);
    assertFixtureStock(data, identifier);
  }
});

test('extended MVP fixture dataset has deterministic real-life-looking stock values', (t) => {
  const db = database();
  t.after(() => db.close());

  const rows = db.prepare(`
    SELECT part_number, quantity, condition_code, location, storage_location_id, price, currency, notes
    FROM stock_item
    WHERE source = 'fixture-607'
    ORDER BY id
  `).all();

  assert.ok(rows.length >= 4);
  for (const row of rows) {
    assert.ok(Number.isInteger(row.quantity));
    assert.ok(row.quantity >= 0);
    assert.match(row.condition_code, /^[A-E]$/);
    assert.ok(row.storage_location_id > 0);
    assert.match(row.location, /^Fixture Shelf XK \/ Box [A-Z0-9]{3}$/);
    assert.ok(row.price >= 0);
    assert.equal(row.currency, 'EUR');
    assert.match(row.notes, /Synthetic/i);
  }
});

test('visible UI guidance lists numbered and non-numbered fixture probes separately', () => {
  const html = readFileSync(new URL('public/index.html', root), 'utf8');

  assert.match(html, /Tester fixture data/);
  assert.match(html, /randomized demo\/test values, not real inventory evidence/);
  assert.match(html, /Try these part numbers/);
  for (const partNumber of fixturePartNumbers) assert.match(html, new RegExp(partNumber));

  assert.match(html, /Non-numbered fixture identifiers/);
  assert.match(html, /not Jaguar part numbers/);
  for (const identifier of fixtureDescriptiveIdentifiers) assert.match(html, new RegExp(identifier));
});
