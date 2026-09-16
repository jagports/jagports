-- Synthetic stock-storage fixtures for local/UI/API development and tests.
-- These are not real Jagports warehouse locations or inventory evidence.
-- Quality identity is condition_code. The legacy/supplementary condition column
-- remains NOT NULL in the current schema, so normalized fixtures keep it empty;
-- localized presentation belongs to i18n resources.

INSERT INTO stock_site (id, name) VALUES
  (57101, 'Fixture Main Site'),
  (57102, 'Fixture Secondary Site');

INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES
  (57109, 57101, NULL, 'rack', 'Rack A'),
  (57110, 57101, 57109, 'shelf', 'Shelf A'),
  (57111, 57101, 57110, 'box', 'Box 1'),
  (57112, 57101, 57111, 'box', 'BoxSub1'),
  (57113, 57101, 57112, 'box', 'BoxSub2'),
  (57114, 57101, NULL, 'shelf', 'Shelf B'),
  (57115, 57101, 57114, 'box', 'Box 2'),
  (57119, 57102, NULL, 'rack', 'Rack A'),
  (57120, 57102, 57119, 'shelf', 'Shelf A'),
  (57121, 57102, 57120, 'box', 'Box 1');

INSERT INTO stock_source_party (id, source_type, name, source_ref) VALUES
  (57130, 'vendor', 'Fixture Vendor', 'fixture:571:vendor'),
  (57131, 'tenant', 'Fixture Tenant', 'fixture:571:tenant');

INSERT INTO stock_item (
  id, part_number, quantity, condition, status, location, source, source_ref,
  available, condition_code, storage_location_id, source_party_id, price, currency
) VALUES
  (57140, 'FIXTURE-STOCK-A', 2, '', 'available', 'Rack A / Shelf A / Box 1', 'fixture', 'fixture:571:stock:a', 1, 'A', 57111, 57130, 40.00, 'EUR'),
  (57141, 'FIXTURE-STOCK-B', 1, '', 'available', 'Rack A / Shelf A / Box 1 / BoxSub1', 'fixture', 'fixture:571:stock:b', 1, 'B', 57112, 57130, 25.00, 'EUR'),
  (57142, 'FIXTURE-STOCK-C', 1, '', 'available', 'Rack A / Shelf A / Box 1 / BoxSub1 / BoxSub2', 'fixture', 'fixture:571:stock:c', 1, 'C', 57113, 57130, 12.50, 'EUR'),
  (57143, 'FIXTURE-STOCK-D', 1, '', 'available', 'Shelf B / Box 2', 'fixture', 'fixture:571:stock:d', 1, 'D', 57115, 57131, 8.00, 'EUR'),
  (57144, 'FIXTURE-STOCK-E', 1, '', 'available', 'Rack A / Shelf A / Box 1', 'fixture', 'fixture:571:stock:e', 1, 'E', 57121, 57131, 0.00, 'EUR');