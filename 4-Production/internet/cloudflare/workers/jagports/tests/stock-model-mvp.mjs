import assert from 'node:assert/strict';
import { database, sql } from './helpers/model-db.mjs';

const db = database({ fixtures: false });

const tableNames = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);
assert.ok(tableNames.includes('stock_site'));
assert.ok(tableNames.includes('stock_location'));
assert.ok(tableNames.includes('stock_source_party'));

db.prepare("INSERT INTO part (id, part_number_raw, part_number_normalized, description) VALUES (57001, 'C2P0001', 'C2P0001', 'Stock model fixture')").run();
db.prepare("INSERT INTO vehicle (id, vin_raw, identity_status) VALUES (57001, 'SAJ570FIXTURE0001', 'fixture')").run();

db.prepare("INSERT INTO stock_site (id, name) VALUES (57001, 'Jagports Main')").run();
db.prepare("INSERT INTO stock_site (id, name) VALUES (57002, 'Jagports Secondary')").run();
db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (57010, 57001, NULL, 'shelf', 'Shelf A')").run();
db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (57011, 57001, 57010, 'box', 'Box 1')").run();
db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (57012, 57001, 57011, 'box', 'BoxSub1')").run();
db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (57013, 57001, 57012, 'box', 'BoxSub2')").run();
db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (57020, 57002, NULL, 'shelf', 'Shelf A')").run();

const recursive = db.prepare(`
  WITH RECURSIVE location_path(id, parent_id, depth) AS (
    SELECT id, parent_id, 0 FROM stock_location WHERE id = 57013
    UNION ALL
    SELECT parent.id, parent.parent_id, child.depth + 1
    FROM stock_location parent
    JOIN location_path child ON child.parent_id = parent.id
  )
  SELECT MAX(depth) AS depth FROM location_path
`).get();
assert.equal(recursive.depth, 3);

assert.throws(
  () => db.prepare("INSERT INTO stock_location (site_id, parent_id, location_type, name) VALUES (57001, NULL, 'bin', 'Bad')").run(),
  /CHECK constraint failed/,
);

db.prepare("INSERT INTO stock_source_party (id, source_type, name, source_ref) VALUES (57001, 'vendor', 'Fixture Vendor', 'fixture:vendor')").run();
assert.throws(
  () => db.prepare("INSERT INTO stock_source_party (source_type, name) VALUES ('invalid', 'Bad')").run(),
  /CHECK constraint failed/,
);

db.prepare(`
  INSERT INTO stock_item (
    part_number, quantity, condition, status, location, donor_vehicle,
    source_ref, notes, part_id, donor_vehicle_id, source,
    verification_status, confidence, available,
    condition_code, storage_location_id, source_party_id, price
  ) VALUES (
    'C2P0001', 2, 'Good-Working', 'available', 'legacy Shelf A/Box 1', 'fixture donor',
    'fixture:stock:1', 'resolved stock', 57001, 57001, 'fixture',
    'fixture', 1.0, 1,
    'B', 57011, 57001, 125.50
  )
`).run();

db.prepare(`
  INSERT INTO stock_item (
    part_number, quantity, condition, status, source, verification_status,
    available, condition_code, storage_location_id, source_party_id, price, currency
  ) VALUES ('UNRESOLVED-570', 1, 'Fair-Working', 'available', NULL, 'fixture', 1, 'C', 57013, 57001, 25, 'EUR')
`).run();

const stock = db.prepare(`
  SELECT quantity, condition_code, storage_location_id, source_party_id,
         donor_vehicle_id, price, currency, available
  FROM stock_item WHERE part_number = 'C2P0001'
`).get();
assert.deepEqual(stock, {
  quantity: 2,
  condition_code: 'B',
  storage_location_id: 57011,
  source_party_id: 57001,
  donor_vehicle_id: 57001,
  price: 125.5,
  currency: 'EUR',
  available: 1,
});

assert.throws(
  () => db.prepare(`INSERT INTO stock_item (part_number, quantity, part_id, available, condition_code, storage_location_id) VALUES ('BAD-QTY', 1.5, 57001, 0, 'A', 57010)`).run(),
  /stock quantity must be an integer/,
);
assert.throws(
  () => db.prepare(`INSERT INTO stock_item (part_number, quantity, part_id, available, condition_code, storage_location_id) VALUES ('BAD-CONDITION', 1, 57001, 0, 'Z', 57010)`).run(),
  /CHECK constraint failed/,
);
assert.throws(
  () => db.prepare(`INSERT INTO stock_item (part_number, quantity, part_id, available, condition_code) VALUES ('BAD-AVAILABLE', 1, 57001, 1, 'A')`).run(),
  /available stock requires condition and storage location/,
);
assert.throws(
  () => db.prepare(`INSERT INTO stock_item (part_number, quantity, available, condition_code, storage_location_id) VALUES ('BAD-UNRESOLVED', 1, 0, 'A', 57010)`).run(),
  /unresolved stock requires source evidence/,
);
assert.throws(
  () => db.prepare(`INSERT INTO stock_item (part_number, quantity, part_id, available, condition_code, storage_location_id, price) VALUES ('BAD-PRICE', 1, 57001, 0, 'A', 57010, -1)`).run(),
  /CHECK constraint failed/,
);
assert.throws(
  () => db.prepare(`INSERT INTO stock_item (part_number, quantity, part_id, available, condition_code, storage_location_id, currency) VALUES ('BAD-CURRENCY', 1, 57001, 0, 'A', 57010, 'eur')`).run(),
  /CHECK constraint failed/,
);

// One canonical PART may have multiple independent operational stock records.
db.prepare(`INSERT INTO stock_item (part_number, quantity, part_id, source, available, condition_code, storage_location_id) VALUES ('C2P0001-SECOND', 1, 57001, 'fixture', 0, 'D', 57012)`).run();
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM stock_item WHERE part_id = 57001').get().count, 2);

const indexNames = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='stock_item'").all().map((row) => row.name);
for (const name of [
  'idx_stock_item_condition_code',
  'idx_stock_item_storage_location',
  'idx_stock_item_source_party',
  'idx_stock_item_price_currency',
]) assert.ok(indexNames.includes(name), `missing ${name}`);

// Playable synthetic fixture set requested during review: multiple sites, shelves,
// boxes and recursively nested sub-boxes, plus sample stock placed in them.
const fixtureDb = database({ fixtures: false });
fixtureDb.exec(sql('tests/fixtures/mvp_stock_storage.sql'));
assert.equal(fixtureDb.prepare('SELECT COUNT(*) AS count FROM stock_site').get().count, 2);
assert.equal(fixtureDb.prepare('SELECT COUNT(*) AS count FROM stock_location').get().count, 8);
assert.equal(fixtureDb.prepare('SELECT COUNT(*) AS count FROM stock_item WHERE id BETWEEN 57140 AND 57143').get().count, 4);
assert.equal(fixtureDb.prepare('SELECT name FROM stock_location WHERE id = 57113').get().name, 'BoxSub2');

console.log('stock-model-mvp: accepted MVP stock semantics passed');
