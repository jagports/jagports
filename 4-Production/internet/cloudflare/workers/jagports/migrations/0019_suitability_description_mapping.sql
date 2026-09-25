PRAGMA foreign_keys = ON;

-- #641 / #877: additive normalized suitability metadata and source-description
-- mapping. No JEPC records or synthetic fixture assertions are seeded here.
-- Immutable imported/fixture source descriptions are distinct from normalized
-- dimension/value identities. Equal wording never implies equal source meaning.
CREATE TABLE applicability_source_description (
  id INTEGER PRIMARY KEY,
  source_namespace TEXT NOT NULL CHECK (TRIM(source_namespace) <> ''),
  dataset_key TEXT NOT NULL CHECK (TRIM(dataset_key) <> ''),
  source_key TEXT NOT NULL CHECK (TRIM(source_key) <> ''),
  source_language TEXT NOT NULL CHECK (TRIM(source_language) <> ''),
  source_group_code TEXT,
  source_value_code TEXT,
  source_model_ref TEXT,
  source_category_ref TEXT,
  source_item_ref TEXT,
  source_tree_path TEXT,
  record_locator TEXT NOT NULL CHECK (TRIM(record_locator) <> ''),
  original_text TEXT NOT NULL CHECK (TRIM(original_text) <> ''),
  provenance_kind TEXT NOT NULL CHECK (provenance_kind IN ('fixture', 'jepc')),
  evidence_id INTEGER REFERENCES applicability_evidence(id),
  UNIQUE (source_namespace, dataset_key, source_key, source_language)
);
CREATE INDEX idx_applicability_source_description_group
  ON applicability_source_description(source_namespace, dataset_key, source_group_code);

-- Append-only interpretation history. 'fixture' is a test-only mapping state:
-- it is never interchangeable with independently reviewed 'verified' JEPC.
CREATE TABLE applicability_description_mapping_revision (
  id INTEGER PRIMARY KEY,
  source_description_id INTEGER NOT NULL REFERENCES applicability_source_description(id),
  revision INTEGER NOT NULL CHECK (revision > 0),
  dimension_id INTEGER NOT NULL,
  value_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'verified', 'conflict', 'retired', 'fixture')),
  mapping_version TEXT NOT NULL CHECK (TRIM(mapping_version) <> ''),
  evidence_note TEXT NOT NULL CHECK (TRIM(evidence_note) <> ''),
  reviewer_ref TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dimension_id, value_code)
    REFERENCES applicability_dimension_value(dimension_id, value_code),
  UNIQUE (source_description_id, revision)
);
-- Current interpretation is the latest revision per source, including retired.
-- Historical verified/fixture rows remain immutable when a later revision
-- retires or replaces a mapping; do not add a uniqueness rule across history.
CREATE VIEW applicability_description_mapping_current AS
SELECT r.*
FROM applicability_description_mapping_revision r
WHERE r.revision = (
  SELECT MAX(next_revision.revision)
  FROM applicability_description_mapping_revision next_revision
  WHERE next_revision.source_description_id = r.source_description_id
);
CREATE INDEX idx_applicability_mapping_dimension
  ON applicability_description_mapping_revision(dimension_id, value_code, status);

-- Language-qualified domain labels are separate from the raw JEPC description text.
-- UI chrome itself is translated through EN/FI i18next resources.
CREATE TABLE applicability_dimension_label (
  dimension_id INTEGER NOT NULL REFERENCES applicability_dimension(id),
  language TEXT NOT NULL CHECK (TRIM(language) <> ''),
  name TEXT NOT NULL CHECK (TRIM(name) <> ''),
  description TEXT NOT NULL CHECK (TRIM(description) <> ''),
  PRIMARY KEY (dimension_id, language)
);
CREATE TABLE applicability_dimension_value_label (
  dimension_id INTEGER NOT NULL,
  value_code TEXT NOT NULL,
  language TEXT NOT NULL CHECK (TRIM(language) <> ''),
  name TEXT NOT NULL CHECK (TRIM(name) <> ''),
  description TEXT NOT NULL CHECK (TRIM(description) <> ''),
  FOREIGN KEY (dimension_id, value_code)
    REFERENCES applicability_dimension_value(dimension_id, value_code),
  PRIMARY KEY (dimension_id, value_code, language)
);

-- Explicit evidence that a given source description occurs inside ONE
-- source-qualified condition alternative. This is not a predicate operator.
-- Interpretation is kept in the referenced, append-only mapping revision.
CREATE TABLE applicability_set_description_evidence (
  set_id INTEGER NOT NULL REFERENCES applicability_condition_set(id),
  mapping_revision_id INTEGER NOT NULL REFERENCES applicability_description_mapping_revision(id),
  evidence_id INTEGER NOT NULL REFERENCES applicability_evidence(id),
  verification TEXT NOT NULL CHECK (verification IN ('fixture', 'verified')),
  PRIMARY KEY (set_id, mapping_revision_id, evidence_id)
);
CREATE INDEX idx_applicability_set_description_mapping
  ON applicability_set_description_evidence(mapping_revision_id, set_id);
CREATE TRIGGER applicability_set_description_scope_insert
BEFORE INSERT ON applicability_set_description_evidence
WHEN NOT EXISTS (
  SELECT 1 FROM applicability_condition_set cs
  JOIN occurrence_applicability a ON a.id = cs.assertion_id
  JOIN applicability_snapshot snap ON snap.id = a.snapshot_id
  JOIN applicability_bundle b ON b.id = snap.bundle_id
  JOIN applicability_model_context ctx ON ctx.id = a.model_context_id
  JOIN applicability_evidence ev ON ev.id = NEW.evidence_id
    AND ev.snapshot_id = a.snapshot_id
  JOIN applicability_set_evidence se ON se.set_id = cs.id
    AND se.evidence_id = ev.id
  JOIN applicability_description_mapping_revision rev
    ON rev.id = NEW.mapping_revision_id
  JOIN applicability_source_description sd ON sd.id = rev.source_description_id
  WHERE cs.id = NEW.set_id
    AND sd.source_namespace = b.source_namespace
    AND (sd.source_model_ref IS NULL OR sd.source_model_ref = ctx.source_model_id)
    AND ((NEW.verification = 'fixture' AND sd.provenance_kind = 'fixture'
          AND rev.status = 'fixture')
      OR (NEW.verification = 'verified' AND sd.provenance_kind = 'jepc'
          AND rev.status = 'verified' AND TRIM(COALESCE(rev.reviewer_ref, '')) <> ''))
)
BEGIN SELECT RAISE(ABORT, 'description evidence violates source, scope or review boundary'); END;
CREATE TRIGGER applicability_set_description_no_update
BEFORE UPDATE ON applicability_set_description_evidence
BEGIN SELECT RAISE(ABORT, 'description evidence is immutable'); END;
CREATE TRIGGER applicability_set_description_no_delete
BEFORE DELETE ON applicability_set_description_evidence
BEGIN SELECT RAISE(ABORT, 'description evidence is immutable'); END;

-- Source descriptions and mapping revisions are append-only evidence.
-- Corrections use a new source dataset/version or a new mapping revision.
CREATE TRIGGER applicability_source_description_no_update
BEFORE UPDATE ON applicability_source_description
BEGIN SELECT RAISE(ABORT, 'source descriptions are immutable'); END;
CREATE TRIGGER applicability_source_description_no_delete
BEFORE DELETE ON applicability_source_description
BEGIN SELECT RAISE(ABORT, 'source descriptions are immutable'); END;
CREATE TRIGGER applicability_mapping_revision_no_update
BEFORE UPDATE ON applicability_description_mapping_revision
BEGIN SELECT RAISE(ABORT, 'mapping revisions are immutable'); END;
CREATE TRIGGER applicability_mapping_revision_no_delete
BEFORE DELETE ON applicability_description_mapping_revision
BEGIN SELECT RAISE(ABORT, 'mapping revisions are immutable'); END;
CREATE TRIGGER applicability_mapping_revision_review_gate
BEFORE INSERT ON applicability_description_mapping_revision
WHEN (NEW.status = 'verified' AND (
  NEW.reviewer_ref IS NULL OR TRIM(NEW.reviewer_ref) = ''
  OR EXISTS (
    SELECT 1 FROM applicability_source_description
    WHERE id = NEW.source_description_id AND provenance_kind = 'fixture'
  )
)) OR (NEW.status = 'fixture' AND EXISTS (
  SELECT 1 FROM applicability_source_description
  WHERE id = NEW.source_description_id AND provenance_kind <> 'fixture'
))
BEGIN SELECT RAISE(ABORT, 'mapping status requires compatible source evidence and reviewer'); END;
CREATE TRIGGER applicability_mapping_revision_monotonic
BEFORE INSERT ON applicability_description_mapping_revision
WHEN NEW.revision <> 1 + COALESCE((
  SELECT MAX(revision) FROM applicability_description_mapping_revision
  WHERE source_description_id = NEW.source_description_id
), 0)
BEGIN SELECT RAISE(ABORT, 'mapping revisions must be sequential'); END;
