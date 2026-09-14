PRAGMA foreign_keys = ON;

-- Complete the deployed #607 searchable fixture set in the production migration chain.
-- 0012 added stock rows only when matching PART rows already existed. In production
-- only MJB7703AA existed, so the other documented fixture probes returned 404.
-- These rows remain deterministic fixture/demo data, not real Jagports inventory evidence.

INSERT OR IGNORE INTO part (
  id, part_number_raw, part_number_normalized, description, source, source_ref, verification_status
) VALUES
  (60731, 'MNA7691AA', 'MNA7691AA', 'Fan Warning Label', 'fixture-607', 'issue:#607:mna7691aa', 'fixture'),
  (60732, 'XR847031', 'XR847031', 'Fan Warning Label Replacement', 'fixture-607', 'issue:#607:xr847031', 'fixture'),
  (60733, 'FIX538C', 'FIX538C', 'Synthetic supersession chain endpoint fixture', 'fixture-607', 'issue:#607:fix538c', 'fixture');

INSERT OR IGNORE INTO part_tree_node (id, parent_id, label, sort_order)
VALUES
  (60701, NULL, 'Fixture catalogue evidence', 607),
  (60702, 60701, 'MVP searchable fixtures', 10),
  (60703, 60702, 'Supersession label fixtures', 10),
  (60704, 60702, 'Clip and fastener fixtures', 20),
  (60705, 60702, 'Representative presentation fixtures', 30);

INSERT OR IGNORE INTO part_tree_part (tree_node_id, part_id)
SELECT 60705, id FROM part WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO part_tree_part (tree_node_id, part_id)
SELECT 60703, id FROM part WHERE part_number_normalized IN ('MNA7691AA', 'XR847031', 'FIX538C');

INSERT OR IGNORE INTO part_tree_part (tree_node_id, part_id)
SELECT 60704, id FROM part WHERE description IN ('firtree1', 'firtree2', 'Unidentified clip');

INSERT OR IGNORE INTO part_supersession (
  superseded_part_id, superseding_part_id, source, source_ref, verification_status, confidence
)
SELECT p_old.id, p_new.id, 'fixture-607', 'issue:#607:mna7691aa-xr847031', 'fixture', 'fixture'
FROM part p_old
CROSS JOIN part p_new
WHERE p_old.part_number_normalized = 'MNA7691AA'
  AND p_new.part_number_normalized = 'XR847031';

INSERT OR IGNORE INTO part_supersession (
  superseded_part_id, superseding_part_id, source, source_ref, verification_status, confidence
)
SELECT p_old.id, p_new.id, 'fixture-607', 'issue:#607:xr847031-fix538c', 'fixture', 'fixture'
FROM part p_old
CROSS JOIN part p_new
WHERE p_old.part_number_normalized = 'XR847031'
  AND p_new.part_number_normalized = 'FIX538C';

INSERT OR IGNORE INTO stock_location (id, site_id, parent_id, location_type, name) VALUES
  (60797, 60790, 60791, 'box', 'Box F12'),
  (60798, 60790, 60791, 'box', 'Box F29');

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

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60744, 'UNNUMBERED-FIRTREE1', id, 12, 'used / mixed', 'available',
       'Fixture Shelf XK / Box F12', 'fixture-607', 'issue:#607:synthetic-stock:firtree1',
       1, 'fixture', 0.50, 'C', 60797, 60796, 0.60, 'EUR',
       'Synthetic demo stock value for an unidentified fixture clip.'
FROM part WHERE description = 'firtree1';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60745, 'UNNUMBERED-FIRTREE2', id, 6, 'used / mixed', 'available',
       'Fixture Shelf XK / Box F29', 'fixture-607', 'issue:#607:synthetic-stock:firtree2',
       1, 'fixture', 0.50, 'C', 60798, 60796, 0.80, 'EUR',
       'Synthetic demo stock value for an unidentified fixture clip.'
FROM part WHERE description = 'firtree2';
