-- #877: category/value retirement and auditable Admin changes.
-- Existing identities and evidence are preserved. No catalogue data is seeded.
-- Side tables keep legacy positional INSERTs into 0016 dimension/value tables valid.
CREATE TABLE applicability_dimension_retirement (
  dimension_id INTEGER PRIMARY KEY REFERENCES applicability_dimension(id),
  retired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE applicability_dimension_value_retirement (
  dimension_id INTEGER NOT NULL,
  value_code TEXT NOT NULL,
  retired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dimension_id, value_code) REFERENCES applicability_dimension_value(dimension_id, value_code),
  PRIMARY KEY (dimension_id, value_code)
);
CREATE TABLE applicability_suitability_admin_audit (
  id INTEGER PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN (
    'dimension_create', 'dimension_edit', 'dimension_retire',
    'value_create', 'value_edit', 'value_retire', 'mapping_revision'
  )),
  dimension_id INTEGER REFERENCES applicability_dimension(id),
  value_code TEXT,
  source_description_id INTEGER REFERENCES applicability_source_description(id),
  mapping_revision_id INTEGER REFERENCES applicability_description_mapping_revision(id),
  actor_ref TEXT NOT NULL CHECK (TRIM(actor_ref) <> ''),
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_suitability_admin_audit_created
  ON applicability_suitability_admin_audit(created_at, id);
CREATE TRIGGER suitability_admin_audit_no_update
BEFORE UPDATE ON applicability_suitability_admin_audit
BEGIN SELECT RAISE(ABORT, 'admin audit is immutable'); END;
CREATE TRIGGER suitability_admin_audit_no_delete
BEFORE DELETE ON applicability_suitability_admin_audit
BEGIN SELECT RAISE(ABORT, 'admin audit is immutable'); END;
