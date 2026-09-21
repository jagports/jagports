PRAGMA foreign_keys = ON;

-- #868: restore deterministic reduced-MVP fixture stock used by deployed human acceptance.
-- These rows are synthetic test/demo evidence, not real Jagports inventory.
-- The migration is intentionally idempotent so a mutated/deleted fixture row can be repaired
-- without changing catalogue identity or unrelated operational stock.

INSERT OR IGNORE INTO stock_site (id, name) VALUES
  (60790, 'Fixture #607 Site');

INSERT OR IGNORE INTO stock_location (id, site_id, parent_id, location_type, name) VALUES
  (60791, 60790, NULL, 'shelf', 'Fixture Shelf XK'),
  (60792, 60790, 60791, 'box', 'Box A14'),
  (60793, 60790, 60791, 'box', 'Box C07'),
  (60794, 60790, 60791, 'box', 'Box X31'),
  (60795, 60790, 60791, 'box', 'Box R02'),
  (60797, 60790, 60791, 'box', 'Box F12'),
  (60798, 60790, 60791, 'box', 'Box F29');

INSERT OR IGNORE INTO stock_source_party (id, source_type, name, source_ref) VALUES
  (60796, 'other', 'Fixture #607 synthetic stock generator', 'issue:#607');

UPDATE stock_item
SET part_number = 'MJB7703AA',
    part_id = (SELECT id FROM part WHERE part_number_normalized = 'MJB7703AA'),
    quantity = 2,
    condition = 'used / inspected',
    status = 'available',
    location = 'Fixture Shelf XK / Box A14',
    source = 'fixture-607',
    source_ref = 'issue:#607:synthetic-stock:mjb7703aa',
    available = 1,
    verification_status = 'fixture',
    confidence = 0.61,
    condition_code = 'B',
    storage_location_id = 60792,
    source_party_id = 60796,
    price = 14.50,
    currency = 'EUR',
    notes = 'Synthetic demo stock value; not real Jagports inventory evidence.'
WHERE id = 60740;

INSERT INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60740, 'MJB7703AA', id, 2, 'used / inspected', 'available',
       'Fixture Shelf XK / Box A14', 'fixture-607', 'issue:#607:synthetic-stock:mjb7703aa',
       1, 'fixture', 0.61, 'B', 60792, 60796, 14.50, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part
WHERE part_number_normalized = 'MJB7703AA'
  AND NOT EXISTS (SELECT 1 FROM stock_item WHERE id = 60740);

UPDATE stock_item
SET part_number = 'MNA7691AA',
    part_id = (SELECT id FROM part WHERE part_number_normalized = 'MNA7691AA'),
    quantity = 4,
    condition = 'used / good',
    status = 'available',
    location = 'Fixture Shelf XK / Box C07',
    source = 'fixture-607',
    source_ref = 'issue:#607:synthetic-stock:mna7691aa',
    available = 1,
    verification_status = 'fixture',
    confidence = 0.58,
    condition_code = 'B',
    storage_location_id = 60793,
    source_party_id = 60796,
    price = 6.00,
    currency = 'EUR',
    notes = 'Synthetic demo stock value; not real Jagports inventory evidence.'
WHERE id = 60741;

INSERT INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60741, 'MNA7691AA', id, 4, 'used / good', 'available',
       'Fixture Shelf XK / Box C07', 'fixture-607', 'issue:#607:synthetic-stock:mna7691aa',
       1, 'fixture', 0.58, 'B', 60793, 60796, 6.00, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part
WHERE part_number_normalized = 'MNA7691AA'
  AND NOT EXISTS (SELECT 1 FROM stock_item WHERE id = 60741);

UPDATE stock_item
SET part_number = 'XR847031',
    part_id = (SELECT id FROM part WHERE part_number_normalized = 'XR847031'),
    quantity = 1,
    condition = 'new old stock / shelf wear',
    status = 'available',
    location = 'Fixture Shelf XK / Box X31',
    source = 'fixture-607',
    source_ref = 'issue:#607:synthetic-stock:xr847031',
    available = 1,
    verification_status = 'fixture',
    confidence = 0.58,
    condition_code = 'A',
    storage_location_id = 60794,
    source_party_id = 60796,
    price = 18.50,
    currency = 'EUR',
    notes = 'Synthetic demo stock value; not real Jagports inventory evidence.'
WHERE id = 60742;

INSERT INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60742, 'XR847031', id, 1, 'new old stock / shelf wear', 'available',
       'Fixture Shelf XK / Box X31', 'fixture-607', 'issue:#607:synthetic-stock:xr847031',
       1, 'fixture', 0.58, 'A', 60794, 60796, 18.50, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part
WHERE part_number_normalized = 'XR847031'
  AND NOT EXISTS (SELECT 1 FROM stock_item WHERE id = 60742);

UPDATE stock_item
SET part_number = 'FIX538C',
    part_id = (SELECT id FROM part WHERE part_number_normalized = 'FIX538C'),
    quantity = 1,
    condition = 'test-only',
    status = 'available',
    location = 'Fixture Shelf XK / Box R02',
    source = 'fixture-607',
    source_ref = 'issue:#607:synthetic-stock:fix538c',
    available = 1,
    verification_status = 'fixture',
    confidence = 0.40,
    condition_code = 'D',
    storage_location_id = 60795,
    source_party_id = 60796,
    price = 3.00,
    currency = 'EUR',
    notes = 'Synthetic chain-endpoint stock value; not real catalogue or inventory evidence.'
WHERE id = 60743;

INSERT INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60743, 'FIX538C', id, 1, 'test-only', 'available',
       'Fixture Shelf XK / Box R02', 'fixture-607', 'issue:#607:synthetic-stock:fix538c',
       1, 'fixture', 0.40, 'D', 60795, 60796, 3.00, 'EUR',
       'Synthetic chain-endpoint stock value; not real catalogue or inventory evidence.'
FROM part
WHERE part_number_normalized = 'FIX538C'
  AND NOT EXISTS (SELECT 1 FROM stock_item WHERE id = 60743);

UPDATE stock_item
SET part_number = 'UNNUMBERED-FIRTREE1',
    part_id = (SELECT id FROM part WHERE part_number_normalized IS NULL AND description = 'firtree1' LIMIT 1),
    quantity = 12,
    condition = 'used / mixed',
    status = 'available',
    location = 'Fixture Shelf XK / Box F12',
    source = 'fixture-607',
    source_ref = 'issue:#607:synthetic-stock:firtree1',
    available = 1,
    verification_status = 'fixture',
    confidence = 0.50,
    condition_code = 'C',
    storage_location_id = 60797,
    source_party_id = 60796,
    price = 0.60,
    currency = 'EUR',
    notes = 'Synthetic demo stock value for an unidentified fixture clip.'
WHERE id = 60744;

INSERT INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60744, 'UNNUMBERED-FIRTREE1', id, 12, 'used / mixed', 'available',
       'Fixture Shelf XK / Box F12', 'fixture-607', 'issue:#607:synthetic-stock:firtree1',
       1, 'fixture', 0.50, 'C', 60797, 60796, 0.60, 'EUR',
       'Synthetic demo stock value for an unidentified fixture clip.'
FROM part
WHERE part_number_normalized IS NULL AND description = 'firtree1'
  AND NOT EXISTS (SELECT 1 FROM stock_item WHERE id = 60744)
LIMIT 1;

UPDATE stock_item
SET part_number = 'UNNUMBERED-FIRTREE2',
    part_id = (SELECT id FROM part WHERE part_number_normalized IS NULL AND description = 'firtree2' LIMIT 1),
    quantity = 6,
    condition = 'used / mixed',
    status = 'available',
    location = 'Fixture Shelf XK / Box F29',
    source = 'fixture-607',
    source_ref = 'issue:#607:synthetic-stock:firtree2',
    available = 1,
    verification_status = 'fixture',
    confidence = 0.50,
    condition_code = 'C',
    storage_location_id = 60798,
    source_party_id = 60796,
    price = 0.80,
    currency = 'EUR',
    notes = 'Synthetic demo stock value for an unidentified fixture clip.'
WHERE id = 60745;

INSERT INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60745, 'UNNUMBERED-FIRTREE2', id, 6, 'used / mixed', 'available',
       'Fixture Shelf XK / Box F29', 'fixture-607', 'issue:#607:synthetic-stock:firtree2',
       1, 'fixture', 0.50, 'C', 60798, 60796, 0.80, 'EUR',
       'Synthetic demo stock value for an unidentified fixture clip.'
FROM part
WHERE part_number_normalized IS NULL AND description = 'firtree2'
  AND NOT EXISTS (SELECT 1 FROM stock_item WHERE id = 60745)
LIMIT 1;
