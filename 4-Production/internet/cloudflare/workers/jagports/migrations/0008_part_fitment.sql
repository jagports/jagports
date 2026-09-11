PRAGMA foreign_keys = ON;

-- Persistent schema names describe domain semantics only. Deployment/release or
-- compatibility status must never leak into table names.
-- temp_part_fitment_migration exists only while this migration copies the old
-- part_fitment rows into the evolved normal part_fitment table. It is dropped
-- before the migration completes and is not part of the application schema.
ALTER TABLE part_fitment RENAME TO temp_part_fitment_migration;
DROP INDEX idx_part_fitment_unique;
DROP INDEX idx_part_fitment_part;
DROP INDEX idx_part_fitment_range;

CREATE TABLE part_fitment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  part_occurrence_id INTEGER REFERENCES part_occurrence(id) ON DELETE CASCADE,
  vehicle_range_id INTEGER REFERENCES vehicle_range(id) ON DELETE CASCADE,
  variation TEXT,
  qualifier TEXT,
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

INSERT INTO part_fitment (
  id,
  part_id,
  vehicle_range_id,
  variation,
  qualifier,
  applicability_state,
  verification_status
)
SELECT
  id,
  part_id,
  vehicle_range_id,
  variation,
  qualifier,
  'applicable',
  verification_status
FROM temp_part_fitment_migration;

DROP TABLE temp_part_fitment_migration;

CREATE UNIQUE INDEX idx_part_fitment_range_identity
  ON part_fitment(
    part_id,
    vehicle_range_id,
    COALESCE(variation, ''),
    COALESCE(qualifier, '')
  )
  WHERE vehicle_range_id IS NOT NULL AND part_occurrence_id IS NULL;

CREATE UNIQUE INDEX idx_part_fitment_occurrence_identity
  ON part_fitment(
    part_occurrence_id,
    applicability_state,
    COALESCE(attribute_group, ''),
    COALESCE(attribute_key, ''),
    COALESCE(source_value, ''),
    COALESCE(except_flag, '')
  )
  WHERE part_occurrence_id IS NOT NULL;

CREATE INDEX idx_part_fitment_part
  ON part_fitment(part_id);
CREATE INDEX idx_part_fitment_occurrence
  ON part_fitment(part_occurrence_id);
CREATE INDEX idx_part_fitment_range
  ON part_fitment(vehicle_range_id);
CREATE INDEX idx_part_fitment_attribute
  ON part_fitment(attribute_group, attribute_key, source_value);
