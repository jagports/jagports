PRAGMA foreign_keys = ON;

-- Retain the 0003 range/variation presentation rows separately. There is no
-- verified conversion from these rows to occurrence-level source attributes.
ALTER TABLE part_fitment RENAME TO deployment1_part_fitment;
DROP INDEX idx_part_fitment_unique;
DROP INDEX idx_part_fitment_part;
DROP INDEX idx_part_fitment_range;
CREATE UNIQUE INDEX idx_deployment1_part_fitment_unique
  ON deployment1_part_fitment(part_id, vehicle_range_id, variation, qualifier);
CREATE INDEX idx_deployment1_part_fitment_part ON deployment1_part_fitment(part_id);
CREATE INDEX idx_deployment1_part_fitment_range ON deployment1_part_fitment(vehicle_range_id);

CREATE TABLE part_fitment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_occurrence_id INTEGER NOT NULL REFERENCES part_occurrence(id) ON DELETE CASCADE,
  applicability_state TEXT NOT NULL DEFAULT 'applicable',
  attribute_group TEXT,
  attribute_key TEXT,
  source_value TEXT,
  except_flag TEXT,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  confidence TEXT,
  CHECK (TRIM(applicability_state) <> ''),
  CHECK (applicability_state IN ('applicable', 'excluded', 'unavailable')),
  CHECK (source_value IS NULL OR TRIM(source_value) <> ''),
  CHECK (except_flag IS NULL OR TRIM(except_flag) <> '')
);

CREATE UNIQUE INDEX idx_part_fitment_identity
  ON part_fitment(
    part_occurrence_id,
    applicability_state,
    COALESCE(attribute_group, ''),
    COALESCE(attribute_key, ''),
    COALESCE(source_value, ''),
    COALESCE(except_flag, '')
  );
CREATE INDEX idx_part_fitment_occurrence
  ON part_fitment(part_occurrence_id);
CREATE INDEX idx_part_fitment_attribute
  ON part_fitment(attribute_group, attribute_key, source_value);
