-- Deterministic MVP stock fixtures for migration 0010.
-- One canonical PART has multiple operational stock records.
-- One stock record is unresolved and therefore has no part_id.
-- Donor vehicle identity is separate from catalogue applicability.

INSERT INTO part (id, part_number_raw, part_number_normalized, description, source, source_ref, verification_status)
VALUES (9101, 'MJB7703AA', 'MJB7703AA', 'Fixture catalogue part', 'fixture', 'stock-fixture-part', 'verified');

INSERT INTO vehicle (id, vin_raw, serial, model_range, market, identity_status, notes)
VALUES (9201, 'SAJJNADW3TJ123456', 'TJ123456', 'FIXTURE-XJ', 'ROW', 'verified', 'Fixture donor vehicle');

INSERT INTO stock_item (
  id, part_number, quantity, condition, status, location, donor_vehicle,
  source_ref, notes, part_id, donor_vehicle_id, source, verification_status,
  confidence, available
)
VALUES
  (9301, 'MJB7703AA', 3, 'used', 'available', 'BIN-A1', 'SAJJNADW3TJ123456',
   'stock-fixture-1', 'First stock record for canonical PART', 9101, 9201,
   'fixture', 'verified', 1.0, 1),
  (9302, 'MJB7703AA', 1, 'new', 'reserved', 'BIN-B2', NULL,
   'stock-fixture-2', 'Second independent stock record for same PART', 9101, NULL,
   'fixture', 'verified', 1.0, 0),
  (9303, 'UNKNOWN-CLIP', 2, 'used', 'available', 'BIN-C3', NULL,
   'stock-fixture-3', 'Unresolved/non-catalogue stock; no fabricated PART', NULL, NULL,
   'fixture', 'unverified', NULL, 1);
