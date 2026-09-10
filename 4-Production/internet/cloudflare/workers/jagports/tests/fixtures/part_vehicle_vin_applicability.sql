PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO model_range (
  range_code, name, source, source_ref, verification_status
) VALUES (
  'X100', 'X100', 'fixture-applicability', 'model-range-001', 'fixture'
);

INSERT OR IGNORE INTO vin_range (
  vin_prefix, serial_start, serial_end, model_year, production_boundary,
  market, body, engine_variant, emissions, transmission_steering,
  source, source_ref, verification_status
) VALUES (
  'SAJJG', '001001', '008105', '1996', '1996-02',
  'ROW', 'coupe', '4.0L N/A', NULL, NULL,
  'fixture-applicability', 'vin-range-001', 'fixture'
);

INSERT OR IGNORE INTO part_model_range (
  part_id, model_range_id, source, source_ref, verification_status
)
SELECT p.id, m.id, 'fixture-applicability', 'part-model-range-001', 'fixture'
FROM part p
CROSS JOIN model_range m
WHERE p.part_number_normalized = 'MNA7691AA'
  AND m.range_code = 'X100';

INSERT OR IGNORE INTO part_vin_range (
  part_id, vin_range_id, source, source_ref, verification_status
)
SELECT p.id, v.id, 'fixture-applicability', 'part-vin-range-001', 'fixture'
FROM part p
CROSS JOIN vin_range v
WHERE p.part_number_normalized = 'MNA7691AA'
  AND v.vin_prefix = 'SAJJG'
  AND v.serial_start = '001001';
