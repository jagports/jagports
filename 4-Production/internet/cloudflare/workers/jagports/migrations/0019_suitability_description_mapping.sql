PRAGMA foreign_keys = ON;

-- #641 / #877: additive normalized suitability metadata and source-description
-- mapping. No JEPC records or synthetic fixture assertions are seeded here.
-- Existing scalar dimensions retain their behavior by default.
ALTER TABLE applicability_dimension
  ADD COLUMN cardinality TEXT NOT NULL DEFAULT 'scalar'
  CHECK (cardinality IN ('scalar', 'set'));

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

-- Two positive membership conditions may coexist on one complete alternative.
-- This does NOT make an assertion verified or evaluate occurrence suitability.
CREATE TABLE applicability_set_membership_condition (
  id INTEGER PRIMARY KEY,
  set_id INTEGER NOT NULL REFERENCES applicability_condition_set(id),
  dimension_id INTEGER NOT NULL REFERENCES applicability_dimension(id),
  operator TEXT NOT NULL CHECK (operator IN ('contains', 'not_contains')),
  value_code TEXT NOT NULL,
  evidence_id INTEGER REFERENCES applicability_evidence(id),
  FOREIGN KEY (dimension_id, value_code)
    REFERENCES applicability_dimension_value(dimension_id, value_code),
  UNIQUE (set_id, dimension_id, operator, value_code)
);
CREATE INDEX idx_applicability_membership_lookup
  ON applicability_set_membership_condition(dimension_id, value_code, operator);

-- A condition set explicitly declared unconditional cannot also carry
-- membership conditions, matching the pre-existing scalar protection.
CREATE TRIGGER applicability_no_unconditional_membership_insert
BEFORE INSERT ON applicability_set_membership_condition
WHEN EXISTS (
  SELECT 1 FROM applicability_condition_set
  WHERE id = NEW.set_id AND unconditional = 1
)
BEGIN SELECT RAISE(ABORT, 'unconditional set cannot contain membership'); END;
CREATE TRIGGER applicability_no_unconditional_membership_update
BEFORE UPDATE OF set_id ON applicability_set_membership_condition
WHEN EXISTS (
  SELECT 1 FROM applicability_condition_set
  WHERE id = NEW.set_id AND unconditional = 1
)
BEGIN SELECT RAISE(ABORT, 'unconditional set cannot contain membership'); END;
CREATE TRIGGER applicability_no_unconditional_set_with_membership
BEFORE UPDATE OF unconditional ON applicability_condition_set
WHEN NEW.unconditional = 1 AND EXISTS (
  SELECT 1 FROM applicability_set_membership_condition WHERE set_id = OLD.id
)
BEGIN SELECT RAISE(ABORT, 'conditional set contains membership'); END;

-- Keep scalar and set condition storage disjoint. Existing dimensions are
-- scalar until an explicitly reviewed category changes its cardinality.
CREATE TRIGGER applicability_membership_set_dimension_insert
BEFORE INSERT ON applicability_set_membership_condition
WHEN NOT EXISTS (
  SELECT 1 FROM applicability_dimension
  WHERE id = NEW.dimension_id AND cardinality = 'set'
)
BEGIN SELECT RAISE(ABORT, 'membership requires set dimension'); END;
CREATE TRIGGER applicability_membership_set_dimension_update
BEFORE UPDATE OF dimension_id ON applicability_set_membership_condition
WHEN NOT EXISTS (
  SELECT 1 FROM applicability_dimension
  WHERE id = NEW.dimension_id AND cardinality = 'set'
)
BEGIN SELECT RAISE(ABORT, 'membership requires set dimension'); END;
CREATE TRIGGER applicability_scalar_dimension_insert
BEFORE INSERT ON applicability_attribute_condition
WHEN EXISTS (
  SELECT 1 FROM applicability_dimension
  WHERE id = NEW.dimension_id AND cardinality <> 'scalar'
)
BEGIN SELECT RAISE(ABORT, 'scalar condition requires scalar dimension'); END;
CREATE TRIGGER applicability_scalar_dimension_update
BEFORE UPDATE OF dimension_id ON applicability_attribute_condition
WHEN EXISTS (
  SELECT 1 FROM applicability_dimension
  WHERE id = NEW.dimension_id AND cardinality <> 'scalar'
)
BEGIN SELECT RAISE(ABORT, 'scalar condition requires scalar dimension'); END;
CREATE TRIGGER applicability_cardinality_guard
BEFORE UPDATE OF cardinality ON applicability_dimension
WHEN NEW.cardinality <> OLD.cardinality AND (
  EXISTS (SELECT 1 FROM applicability_attribute_condition WHERE dimension_id = OLD.id)
  OR EXISTS (SELECT 1 FROM applicability_set_membership_condition WHERE dimension_id = OLD.id)
)
BEGIN SELECT RAISE(ABORT, 'cannot change cardinality with active conditions'); END;

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
