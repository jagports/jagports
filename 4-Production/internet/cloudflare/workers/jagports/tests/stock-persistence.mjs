import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
import { database, d1 } from './helpers/model-db.mjs';

function request(path, options = {}) {
  return new Request(`https://example.test${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': 'test-admin',
      ...(options.headers || {}),
    },
  });
}

function environment(db) {
  return {
    ADMIN_TOKEN: 'test-admin',
    DB: d1(db),
  };
}

test('normalized stock create/read/update persists through the Worker D1 path', async (t) => {
  const db = database({ fixtures: false });
  t.after(() => db.close());

  db.exec(`
    INSERT INTO part (id, part_number_raw, part_number_normalized, description)
      VALUES (84001, 'C2P84001', 'C2P84001', 'Issue 840 persistence fixture');
    INSERT INTO vehicle (id, vin_raw, identity_status)
      VALUES (84001, 'SAJ840PERSIST0001', 'test');
    INSERT INTO stock_site (id, name)
      VALUES (84001, 'Issue 840 test site');
    INSERT INTO stock_location (id, site_id, parent_id, location_type, name)
      VALUES (84001, 84001, NULL, 'shelf', 'Issue 840 shelf');
    INSERT INTO stock_source_party (id, source_type, name, source_ref)
      VALUES (84001, 'organization', 'Issue 840 test source', 'test:840:source');
  `);

  const env = environment(db);
  const created = await worker.fetch(request('/api/stock', {
    method: 'POST',
    body: JSON.stringify({
      part_number: 'C2P84001',
      quantity: 2,
      part_id: 84001,
      condition_code: null,
      available: 1,
      storage_location_id: 84001,
      source_party_id: 84001,
      donor_vehicle_id: 84001,
      source_ref: 'test:840:resolved',
      price: 12.5,
      currency: 'eur',
      notes: 'persistence test only',
    }),
  }), env);

  assert.equal(created.status, 201);
  const { id } = await created.json();
  assert.ok(id > 0);

  const read = await worker.fetch(request('/api/stock?q=C2P84001'), env);
  assert.equal(read.status, 200);
  const readBody = await read.json();
  assert.equal(readBody.results.length, 1);
  assert.deepEqual(
    {
      quantity: readBody.results[0].quantity,
      part_id: readBody.results[0].part_id,
      condition_code: readBody.results[0].condition_code,
      available: readBody.results[0].available,
      storage_location_id: readBody.results[0].storage_location_id,
      source_party_id: readBody.results[0].source_party_id,
      donor_vehicle_id: readBody.results[0].donor_vehicle_id,
      price: readBody.results[0].price,
      currency: readBody.results[0].currency,
      notes: readBody.results[0].notes,
    },
    {
      quantity: 2,
      part_id: 84001,
      condition_code: null,
      available: 1,
      storage_location_id: 84001,
      source_party_id: 84001,
      donor_vehicle_id: 84001,
      price: 12.5,
      currency: 'EUR',
      notes: 'persistence test only',
    },
  );

  const patched = await worker.fetch(request(`/api/stock/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      quantity: 3,
      condition_code: 'B',
      price: 15,
    }),
  }), env);
  assert.equal(patched.status, 200);

  const persisted = db.prepare(`
    SELECT quantity, condition_code, available, storage_location_id,
           source_party_id, donor_vehicle_id, price, currency, notes
    FROM stock_item WHERE id=?
  `).get(id);
  assert.deepEqual({ ...persisted }, {
    quantity: 3,
    condition_code: 'B',
    available: 1,
    storage_location_id: 84001,
    source_party_id: 84001,
    donor_vehicle_id: 84001,
    price: 15,
    currency: 'EUR',
    notes: 'persistence test only',
  });
});

test('unresolved stock requires source evidence and may persist explicitly unresolved', async (t) => {
  const db = database({ fixtures: false });
  t.after(() => db.close());
  const env = environment(db);

  const rejected = await worker.fetch(request('/api/stock', {
    method: 'POST',
    body: JSON.stringify({
      part_number: 'UNRESOLVED-840-BAD',
      quantity: 1,
      available: 0,
    }),
  }), env);
  assert.equal(rejected.status, 400);
  assert.equal((await rejected.json()).error, 'unresolved stock requires source evidence');

  const created = await worker.fetch(request('/api/stock', {
    method: 'POST',
    body: JSON.stringify({
      part_number: 'UNRESOLVED-840',
      quantity: 1,
      available: 0,
      source: 'test operator evidence',
      verification_status: 'test',
      notes: 'synthetic persistence test; not real inventory',
    }),
  }), env);
  assert.equal(created.status, 201);
  const { id } = await created.json();

  const row = db.prepare('SELECT part_id, source, available FROM stock_item WHERE id=?').get(id);
  assert.deepEqual({ ...row }, {
    part_id: null,
    source: 'test operator evidence',
    available: 0,
  });
});

test('stock persistence validation rejects invalid normalized states', async (t) => {
  const db = database({ fixtures: false });
  t.after(() => db.close());
  const env = environment(db);

  const invalidLocation = await worker.fetch(request('/api/stock', {
    method: 'POST',
    body: JSON.stringify({
      part_number: 'INVALID-AVAILABLE-840',
      quantity: 1,
      available: 1,
      source: 'test',
    }),
  }), env);
  assert.equal(invalidLocation.status, 400);
  assert.equal((await invalidLocation.json()).error, 'available stock requires storage_location_id');

  const invalidQuality = await worker.fetch(request('/api/stock', {
    method: 'POST',
    body: JSON.stringify({
      part_number: 'INVALID-QUALITY-840',
      quantity: 1,
      available: 0,
      source: 'test',
      condition_code: 'Z',
    }),
  }), env);
  assert.equal(invalidQuality.status, 400);
  assert.equal((await invalidQuality.json()).error, 'condition_code must be A-E or null');

  const unauthorized = await worker.fetch(new Request('https://example.test/api/stock'), env);
  assert.equal(unauthorized.status, 401);
});
