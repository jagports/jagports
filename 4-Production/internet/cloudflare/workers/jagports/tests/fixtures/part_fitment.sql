PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO part (
  part_number_raw, part_number_normalized, description, source, source_ref, verification_status
) VALUES
  ('FIT-001', 'FIT001', 'Fitment Fixture Part', 'fixture-fitment', 'fitment-part-001', 'fixture');

INSERT OR IGNORE INTO part_occurrence (
  part_id, source, source_ref, context_type, context_ref, verification_status
)
SELECT id, 'fixture-fitment', 'fitment-occurrence-001', 'epc', 'fitment-context-001', 'fixture'
FROM part
WHERE part_number_normalized = 'FIT001';

INSERT OR IGNORE INTO part_fitment (
  part_occurrence_id, applicability_state, attribute_group, attribute_key, source_value,
  except_flag, source, source_ref, verification_status, confidence
)
SELECT id, 'applicable', 'engine', 'engine_variant', '4.0 SC', NULL,
       'fixture-fitment', 'fitment-positive-001', 'fixture', 'fixture'
FROM part_occurrence
WHERE source_ref = 'fitment-occurrence-001';

INSERT OR IGNORE INTO part_fitment (
  part_occurrence_id, applicability_state, attribute_group, attribute_key, source_value,
  except_flag, source, source_ref, verification_status, confidence
)
SELECT id, 'excluded', 'body', 'body_type', 'convertible', '1',
       'fixture-fitment', 'fitment-exclusion-001', 'fixture', 'fixture'
FROM part_occurrence
WHERE source_ref = 'fitment-occurrence-001';
