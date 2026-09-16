import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { database, migrate, migrations, sql } from './helpers/model-db.mjs';

const QUALITY = new Map([
  ['A', 'New / Unused / Original Package'],
  ['B', 'Used / Good Working / Known History'],
  ['C', 'Used / Usable / No warranty'],
  ['D', 'Repairs / Needs Conditioning / Spares only'],
  ['E', 'Broken / Reference / Knowledge Gains'],
]);

// Prove the forward vocabulary migration preserves already-populated 0011 stock
// while making rack and tenant valid on upgraded databases.
const vocabMigration = migrations.indexOf('0014_stock_location_source_vocab.sql');
assert.equal(vocabMigration, 13);
const upgradeDb = new DatabaseSync(':memory:');
upgradeDb.exec('PRAGMA foreign_keys = ON');
migrate(upgradeDb, migrations.slice(0, vocabMigration));
upgradeDb.exec(`
  INSERT INTO stock_site (id, name) VALUES (56901, 'Upgrade Site');
  INSERT INTO stock_location (id, site_id, parent_id, location_type, name)
    VALUES (56910, 56901, NULL, 'shelf', 'Existing Shelf');
  INSERT INTO stock_source_party (id, source_type, name, source_ref)
    VALUES (56920, 'vendor', 'Existing Vendor', 'fixture:upgrade:vendor');
  INSERT INTO stock_item (
    id, part_number, quantity, condition, status, source, source_ref,
    verification_status, available, condition_code, storage_location_id,
    source_party_id, price, currency
  ) VALUES (
    56930, 'UPGRADE-STOCK', 2, 'Used / Good Working / Known History',
    'available', 'fixture', 'fixture:upgrade:stock', 'fixture', 1, 'B',
    56910, 56920, 25.00, 'EUR'
  );
`);
const beforeUpgrade = { ...upgradeDb.prepare('SELECT * FROM stock_item WHERE id=56930').get() };
migrate(upgradeDb, migrations.slice(vocabMigration));
assert.deepEqual({ ...upgradeDb.prepare('SELECT * FROM stock_item WHERE id=56930').get() }, beforeUpgrade);
assert.deepEqual(upgradeDb.prepare('PRAGMA foreign_key_check').all(), []);
assert.equal(upgradeDb.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE type='table' AND name LIKE '%_0014_old'").get().n, 0);
upgradeDb.prepare("INSERT INTO stock_location (site_id, parent_id, location_type, name) VALUES (56901, NULL, 'rack', 'Upgrade Rack')").run();
upgradeDb.prepare("INSERT INTO stock_source_party (source_type, name) VALUES ('tenant', 'Upgrade Tenant')").run();
assert.throws(
  () => upgradeDb.prepare("INSERT INTO stock_location (site_id, parent_id, location_type, name) VALUES (56901, NULL, 'bin', 'Bad')").run(),
  /CHECK constraint failed/,
);
upgradeDb.close();

const db = database({ fixtures: false });

const tableNames = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);
assert.ok(tableNames.includes('stock_site'));
assert.ok(tableNames.includes('stock_location'));
assert.ok(tableNames.includes('stock_source_party'));

db.prepare("INSERT INTO part (id, part_number_raw, part_number_normalized, description) VALUES (57001, 'C2P0001', 'C2P0001', 'Stock model fixture')").run();
db.prepare("INSERT INTO vehicle (id, vin_raw, identity_status) VALUES (57001, 'SAJ570FIXTURE0001', 'fixture')").run();

db.prepare("INSERT INTO stock_site (id, name) VALUES (57001, 'Jagports Main')").run();
db.prepare("INSERT INTO stock_site (id, name) VALUES (57002, 'Jagports Secondary')").run();
db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (57009, 57001, NULL, 'rack', 'Rack A')").run();
db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (57010, 57001, 57009, 'shelf', 'Shelf A')").run();
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
assert.equal(recursive.depth, 4);
assert.equal(db.prepare("SELECT location_type FROM stock_location WHERE id=57009").get().location_type, 'rack');

assert.throws(
  () => db.prepare("INSERT INTO stock_location (site_id, parent_id, location_type, name) VALUES (57001, NULL, 'bin', 'Bad')").run(),
  /CHECK constraint failed/,
);

db.prepare("INSERT INTO stock_source_party (id, source_type, name, source_ref) VALUES (57001, 'vendor', 'Fixture Vendor', 'fixture:vendor')").run();
db.prepare("INSERT INTO stock_source_party (id, source_type, name, source_ref) VALUES (57002, 'tenant', 'Fixture Tenant', 'fixture:tenant')").run();
assert.equal(db.prepare("SELECT source_type FROM stock_source_party WHERE id=57002").get().source_type, 'tenant');
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
    'C2P0001', 2, 'Used / Good Working / Known History', 'available', 'legacy Rack A/Shelf A/Box 1', 'fixture donor',
    'fixture:stock:1', 'resolved stock', 57001, 57001, 'fixture',
    'fixture', 1.0, 1,
    'B', 57011, 57001, 125.50
  )
`).run();

db.prepare(`
  INSERT INTO stock_item (
    part_number, quantity, condition, status, source, verification_status,
    available, condition_code, storage_location_id, source_party_id, price, currency
  ) VALUES ('UNRESOLVED-570', 1, 'Used / Usable / No warranty', 'available', NULL, 'fixture', 1, 'C', 57013, 57002, 25, 'EUR')
`).run();

const stock = db.prepare(`
  SELECT quantity, condition_code, storage_location_id, source_party_id,
         donor_vehicle_id, price, currency, available
  FROM stock_item WHERE part_number = 'C2P0001'
`).get();
assert.deepEqual({ ...stock }, {
  quantity: 2,
  condition_code: 'B',
  storage_location_id: 57011,
  source_party_id: 57001,
  donor_vehicle_id: 57001,
  price: 125.5,
  currency: 'EUR',
  available: 1,
});

// Availability is independent from A-E stock-quality classification. A stock
// item with a normalized storage location may remain available while its
// condition_code is explicitly unclassified (NULL).
db.prepare(`
  INSERT INTO stock_item (
    part_number, quantity, part_id, source, verification_status,
    available, storage_location_id
  ) VALUES ('UNCLASSIFIED-AVAILABLE', 1, 57001, 'fixture', 'fixture', 1, 57010)
`).run();
const unclassifiedAvailable = db.prepare(`
  SELECT available, condition_code, storage_location_id
  FROM stock_item WHERE part_number = 'UNCLASSIFIED-AVAILABLE'
`).get();
assert.deepEqual({ ...unclassifiedAvailable }, {
  available: 1,
  condition_code: null,
  storage_location_id: 57010,
});

db.prepare("UPDATE stock_item SET condition_code = NULL WHERE part_number = 'C2P0001'").run();
assert.deepEqual(
  { ...db.prepare("SELECT available, condition_code FROM stock_item WHERE part_number = 'C2P0001'").get() },
  { available: 1, condition_code: null },
);

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
  /available stock requires storage location/,
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
db.prepare(`INSERT INTO stock_item (part_number, quantity, condition, part_id, source, available, condition_code, storage_location_id) VALUES ('C2P0001-SECOND', 1, 'Repairs / Needs Conditioning / Spares only', 57001, 'fixture', 0, 'D', 57012)`).run();
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM stock_item WHERE part_id = 57001').get().count, 3);

const indexNames = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='stock_item'").all().map((row) => row.name);
for (const name of [
  'idx_stock_item_condition_code',
  'idx_stock_item_storage_location',
  'idx_stock_item_source_party',
  'idx_stock_item_price_currency',
]) assert.ok(indexNames.includes(name), `missing ${name}`);

// Deterministic stock fixtures exercise site/rack/shelf/box storage, tenant source
// parties and all normalized A-E quality meanings without relying on internal IDs.
const fixtureDb = database({ fixtures: false });
fixtureDb.exec(sql('tests/fixtures/stock_storage.sql'));

const fixtureStockRows = fixtureDb.prepare(`
  SELECT s.part_number, s.condition, s.condition_code, s.storage_location_id,
         l.name AS location_name, p.source_type
  FROM stock_item s
  JOIN stock_location l ON l.id = s.storage_location_id
  JOIN stock_source_party p ON p.id = s.source_party_id
  WHERE s.source_ref LIKE 'fixture:571:stock:%'
  ORDER BY s.condition_code
`).all();
assert.equal(fixtureStockRows.length, 5);
assert.deepEqual(fixtureStockRows.map((row) => row.condition_code), [...QUALITY.keys()]);
for (const row of fixtureStockRows) {
  assert.equal(row.condition, QUALITY.get(row.condition_code));
  assert.match(row.part_number, /^FIXTURE-STOCK-[A-E]$/);
  assert.ok(row.storage_location_id > 0);
  assert.ok(row.location_name.length > 0);
  assert.ok(['vendor', 'tenant'].includes(row.source_type));
}
assert.ok(fixtureStockRows.some((row) => row.source_type === 'tenant'));

const nestedFixture = fixtureDb.prepare(`
  WITH RECURSIVE location_path(id, parent_id, depth) AS (
    SELECT loc.id, loc.parent_id, 0
    FROM stock_location loc
    JOIN stock_site site ON site.id = loc.site_id
    WHERE site.name = 'Fixture Main Site'
      AND loc.name = 'BoxSub2'
    UNION ALL
    SELECT parent.id, parent.parent_id, child.depth + 1
    FROM stock_location parent
    JOIN location_path child ON child.parent_id = parent.id
  )
  SELECT MAX(depth) AS depth FROM location_path
`).get();
assert.equal(nestedFixture.depth, 4);

console.log('stock-model: accepted stock semantics passed');
