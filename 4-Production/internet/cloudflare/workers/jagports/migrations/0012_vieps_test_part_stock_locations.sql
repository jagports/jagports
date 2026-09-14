PRAGMA foreign_keys = ON;

-- Seed deterministic demo/test stock rows for live VIEPS fixture part-number checks.
-- These rows are fixture data for interactive MVP validation, not real Jagports inventory evidence.
-- They intentionally use random-looking but deterministic locations so every documented test part returns stock context.

INSERT OR IGNORE INTO stock_site (id, name) VALUES
  (60790, 'Fixture #607 Site');

INSERT OR IGNORE INTO stock_location (id, site_id, parent_id, location_type, name) VALUES
  (60791, 60790, NULL, 'shelf', 'Fixture Shelf XK'),
  (60792, 60790, 60791, 'box', 'Box A14'),
  (60793, 60790, 60791, 'box', 'Box C07'),
  (60794, 60790, 60791, 'box', 'Box X31'),
  (60795, 60790, 60791, 'box', 'Box R02');

INSERT OR IGNORE INTO stock_source_party (id, source_type, name, source_ref) VALUES
  (60796, 'other', 'Fixture #607 synthetic stock generator', 'issue:#607');

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60740, 'MJB7703AA', id, 2, 'used / inspected', 'available',
       'Fixture Shelf XK / Box A14', 'fixture-607', 'issue:#607:synthetic-stock:mjb7703aa',
       1, 'fixture', 0.61, 'B', 60792, 60796, 14.50, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60741, 'MNA7691AA', id, 4, 'used / good', 'available',
       'Fixture Shelf XK / Box C07', 'fixture-607', 'issue:#607:synthetic-stock:mna7691aa',
       1, 'fixture', 0.58, 'B', 60793, 60796, 6.00, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part WHERE part_number_normalized = 'MNA7691AA';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60742, 'XR847031', id, 1, 'new old stock / shelf wear', 'available',
       'Fixture Shelf XK / Box X31', 'fixture-607', 'issue:#607:synthetic-stock:xr847031',
       1, 'fixture', 0.58, 'A', 60794, 60796, 18.50, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part WHERE part_number_normalized = 'XR847031';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60743, 'FIX538C', id, 1, 'test-only', 'available',
       'Fixture Shelf XK / Box R02', 'fixture-607', 'issue:#607:synthetic-stock:fix538c',
       1, 'fixture', 0.40, 'D', 60795, 60796, 3.00, 'EUR',
       'Synthetic chain-endpoint stock value; not real catalogue or inventory evidence.'
FROM part WHERE part_number_normalized = 'FIX538C';
