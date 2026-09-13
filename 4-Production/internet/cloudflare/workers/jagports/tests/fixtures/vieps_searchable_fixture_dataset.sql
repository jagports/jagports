-- Synthetic MVP #607 searchable fixture dataset for VIEPS UI/API development and tests.
-- These rows are deterministic demo/test data, not real Jagports inventory evidence.
-- Catalogue/source details are traced to existing repository fixture/research records where available.

PRAGMA foreign_keys = ON;

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

INSERT OR IGNORE INTO part_occurrence (
  id, part_id, source, source_ref, context_type, context_ref, category_ref,
  item_number, diagram_ref, diagram_item_number, verification_status
)
SELECT 60711, id, 'fixture-607', 'issue:#607:mjb7703aa:occurrence', 'epc',
       'fixture-607:mvp-presentation', 'body/exterior/clips-fasteners', '1',
       'VIEPS-MVP-607', '1', 'fixture'
FROM part WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO part_occurrence (
  id, part_id, source, source_ref, context_type, context_ref, category_ref,
  item_number, diagram_ref, diagram_item_number, verification_status
)
SELECT 60712, id, 'fixture-607', 'issue:#354:supersession-example:mna7691aa', 'epc',
       'fixture-607:supersession-label', 'warning-labels', '2',
       'VIEPS-MVP-607', '2', 'fixture'
FROM part WHERE part_number_normalized = 'MNA7691AA';

INSERT OR IGNORE INTO part_occurrence (
  id, part_id, source, source_ref, context_type, context_ref, category_ref,
  item_number, diagram_ref, diagram_item_number, verification_status
)
SELECT 60713, id, 'fixture-607', 'issue:#354:supersession-example:xr847031', 'epc',
       'fixture-607:supersession-label', 'warning-labels', '3',
       'VIEPS-MVP-607', '3', 'fixture'
FROM part WHERE part_number_normalized = 'XR847031';

INSERT OR IGNORE INTO part_occurrence (
  id, part_id, source, source_ref, context_type, context_ref, category_ref,
  item_number, diagram_ref, diagram_item_number, verification_status
)
SELECT 60714, id, 'fixture-607', 'issue:#354:synthetic-chain-endpoint:fix538c', 'epc',
       'fixture-607:supersession-chain', 'fixture-chain', '4',
       'VIEPS-MVP-607', '4', 'fixture'
FROM part WHERE part_number_normalized = 'FIX538C';

INSERT OR IGNORE INTO part_image (
  part_id, image_ref, image_kind, description, source, source_ref,
  verification_status, availability_status
)
SELECT id, NULL, 'representative', 'Fixture image unavailable for MVP #607 test item',
       'fixture-607', 'issue:#607:image-unavailable', 'fixture', 'unavailable'
FROM part
WHERE part_number_normalized IN ('MNA7691AA', 'XR847031', 'FIX538C');

INSERT OR IGNORE INTO part_diagram (
  part_id, title, image_url, availability_status, source_ref, verification_status
)
SELECT id, 'MVP #607 fixture diagram context', NULL, 'unavailable',
       'issue:#607:diagram-unavailable', 'fixture'
FROM part
WHERE part_number_normalized IN ('MNA7691AA', 'XR847031', 'FIX538C');

INSERT OR IGNORE INTO part_fitment (
  part_id, vehicle_range_id, variation, qualifier, applicability_state,
  source, source_ref, verification_status, confidence
)
SELECT p.id, r.id, 'X100 XK8/XKR', 'MVP #607 fixture presentation; applicability not production-verified',
       'unavailable', 'fixture-607', 'issue:#607:x100-fixture-qualifier', 'fixture', 'fixture'
FROM part p
JOIN vehicle_range r ON r.range_code = 'X100'
WHERE p.part_number_normalized IN ('MNA7691AA', 'XR847031', 'FIX538C');

INSERT OR IGNORE INTO part_fitment (
  part_id, vehicle_range_id, variation, qualifier, applicability_state,
  source, source_ref, verification_status, confidence
)
SELECT p.id, r.id, 'X150 XK', 'MVP #607 fixture presentation; applicability not production-verified',
       'unavailable', 'fixture-607', 'issue:#607:x150-fixture-qualifier', 'fixture', 'fixture'
FROM part p
JOIN vehicle_range r ON r.range_code = 'X150'
WHERE p.part_number_normalized IN ('MNA7691AA', 'XR847031', 'FIX538C');

INSERT OR IGNORE INTO stock_site (id, name) VALUES
  (60790, 'Fixture #607 Site');

INSERT OR IGNORE INTO stock_location (id, site_id, parent_id, location_type, name) VALUES
  (60791, 60790, NULL, 'shelf', 'Fixture Shelf XK'),
  (60792, 60790, 60791, 'box', 'Box Label'),
  (60793, 60790, 60791, 'box', 'Box Clips');

INSERT OR IGNORE INTO stock_source_party (id, source_type, name, source_ref) VALUES
  (60794, 'other', 'Fixture #607 synthetic stock generator', 'issue:#607');

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60740, 'MJB7703AA', id, 2, 'used / inspected', 'available',
       'Fixture Shelf XK / Box Label', 'fixture-607', 'issue:#607:synthetic-stock:mjb7703aa',
       1, 'fixture', 0.61, 'B', 60792, 60794, 14.50, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60741, 'MNA7691AA', id, 4, 'used / good', 'available',
       'Fixture Shelf XK / Box Label', 'fixture-607', 'issue:#607:synthetic-stock:mna7691aa',
       1, 'fixture', 0.58, 'B', 60792, 60794, 6.00, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part WHERE part_number_normalized = 'MNA7691AA';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60742, 'XR847031', id, 1, 'new old stock / shelf wear', 'available',
       'Fixture Shelf XK / Box Label', 'fixture-607', 'issue:#607:synthetic-stock:xr847031',
       1, 'fixture', 0.58, 'A', 60792, 60794, 18.50, 'EUR',
       'Synthetic demo stock value; not real Jagports inventory evidence.'
FROM part WHERE part_number_normalized = 'XR847031';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60743, 'FIX538C', id, 1, 'test-only', 'available',
       'Fixture Shelf XK / Box Label', 'fixture-607', 'issue:#607:synthetic-stock:fix538c',
       1, 'fixture', 0.40, 'D', 60792, 60794, 3.00, 'EUR',
       'Synthetic chain-endpoint stock value; not real catalogue or inventory evidence.'
FROM part WHERE part_number_normalized = 'FIX538C';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60744, 'UNNUMBERED-FIRTREE1', id, 12, 'used / mixed', 'available',
       'Fixture Shelf XK / Box Clips', 'fixture-607', 'issue:#607:synthetic-stock:firtree1',
       1, 'fixture', 0.50, 'C', 60793, 60794, 0.60, 'EUR',
       'Synthetic demo stock value for an unidentified fixture clip.'
FROM part WHERE description = 'firtree1';

INSERT OR IGNORE INTO stock_item (
  id, part_number, part_id, quantity, condition, status, location, source,
  source_ref, available, verification_status, confidence, condition_code,
  storage_location_id, source_party_id, price, currency, notes
)
SELECT 60745, 'UNNUMBERED-FIRTREE2', id, 6, 'used / mixed', 'available',
       'Fixture Shelf XK / Box Clips', 'fixture-607', 'issue:#607:synthetic-stock:firtree2',
       1, 'fixture', 0.50, 'C', 60793, 60794, 0.80, 'EUR',
       'Synthetic demo stock value for an unidentified fixture clip.'
FROM part WHERE description = 'firtree2';
