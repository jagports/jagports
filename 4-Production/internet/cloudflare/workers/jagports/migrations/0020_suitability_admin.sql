-- #877: category/value retirement and auditable Admin changes.
-- Existing identities and evidence are preserved. No catalogue data is seeded.
ALTER TABLE applicability_dimension ADD COLUMN retired_at TEXT;
ALTER TABLE applicability_dimension_value ADD COLUMN retired_at TEXT;
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
