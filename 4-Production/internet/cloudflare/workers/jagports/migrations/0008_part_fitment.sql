PRAGMA foreign_keys = ON;

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
  ON part_fitment(part_occurrence_id, applicability_state, attribute_group, attribute_key, source_value, except_flag);
CREATE INDEX idx_part_fitment_occurrence
  ON part_fitment(part_occurrence_id);
CREATE INDEX idx_part_fitment_attribute
  ON part_fitment(attribute_group, attribute_key, source_value);
