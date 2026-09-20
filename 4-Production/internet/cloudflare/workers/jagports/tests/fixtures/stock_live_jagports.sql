-- Real live Jagports STOCK evidence for #840 / #607 MVP testing.
-- Source workbook (repository controlled):
-- 5-Implementation-Projects/base/jagports/excel/jagports Excels/jagports-parts-stock.xlsx
-- Source row: Stock!A11:J11
--
-- Observed source values:
-- PN HJA3403AB; Shelf R2A; Box B14; quantity 1;
-- model text "Jaguar XK8 XKR X100"; short description "Door mirror - US".
--
-- This is current live Jagports inventory evidence, not synthetic stock. Fields absent from
-- the workbook evidence (A-E quality, price, donor/source party) remain NULL or
-- otherwise unclassified rather than being invented.

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO part (
  part_number_raw,
  part_number_normalized,
  description,
  source,
  source_ref,
  verification_status
) VALUES (
  'HJA3403AB',
  'HJA3403AB',
  'Door mirror - US',
  'jagports-xlsx',
  'repo:5-Implementation-Projects/base/jagports/excel/jagports Excels/jagports-parts-stock.xlsx#Stock!A11:J11',
  'live-inventory'
);

-- Extend the #607 searchable fixture set with one real historical stocked PART.
INSERT OR IGNORE INTO part_tree_part (tree_node_id, part_id)
SELECT 60705, id
FROM part
WHERE part_number_normalized = 'HJA3403AB';

-- The legacy workbook records R2A as the shelf but does not record the parent
-- site name for the RnX location family. Preserve that uncertainty explicitly.
INSERT OR IGNORE INTO stock_site (id, name)
VALUES (84010, 'RnX site - name not recorded in XLSX');

INSERT OR IGNORE INTO stock_location (
  id, site_id, parent_id, location_type, name
) VALUES
  (84011, 84010, NULL, 'shelf', 'R2A'),
  (84012, 84010, 84011, 'box', 'B14');

INSERT OR IGNORE INTO stock_item (
  id,
  part_number,
  part_id,
  quantity,
  condition,
  status,
  location,
  source,
  source_ref,
  available,
  verification_status,
  confidence,
  condition_code,
  storage_location_id,
  source_party_id,
  price,
  currency,
  notes
)
SELECT
  84020,
  'HJA3403AB',
  id,
  1,
  'unknown',
  'live-inventory',
  'R2A / B14',
  'jagports-xlsx',
  'repo:5-Implementation-Projects/base/jagports/excel/jagports Excels/jagports-parts-stock.xlsx#Stock!A11:J11',
  1,
  'live-inventory',
  NULL,
  NULL,
  84012,
  NULL,
  NULL,
  'EUR',
  'Live Jagports STOCK from repository XLSX; quantity is the saved VLOOKUP result from PartsMaster.Stock.'
FROM part
WHERE part_number_normalized = 'HJA3403AB';
